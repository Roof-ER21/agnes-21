/**
 * Speech Utilities for Field Translator
 * Uses Web Speech API for Text-to-Speech and Speech-to-Text
 * Includes enhanced prosody control for natural-sounding speech
 */

import { SupportedLanguage, SupportedDialect, SUPPORTED_LANGUAGES, DIALECT_VARIANTS } from '../types';

// ============================================
// Text-to-Speech (TTS)
// ============================================

let currentUtterance: SpeechSynthesisUtterance | null = null;

/**
 * Get available voices for a language
 */
export const getVoicesForLanguage = (langCode: SupportedLanguage): SpeechSynthesisVoice[] => {
  const voices = speechSynthesis.getVoices();
  const langConfig = SUPPORTED_LANGUAGES.find(l => l.code === langCode);
  if (!langConfig) return [];

  // Match by language code prefix (e.g., 'es' matches 'es-ES', 'es-MX', etc.)
  return voices.filter(voice =>
    voice.lang.startsWith(langCode) ||
    voice.lang.startsWith(langConfig.voiceCode.split('-')[0])
  );
};

/**
 * Premium voice names by language - Apple's best Siri & Enhanced voices
 * PRIORITY ORDER: Siri voices > Enhanced > Premium > Standard
 */
const PREMIUM_VOICES_BY_LANG: Record<string, string[]> = {
  // English - prioritize Siri voices for most natural sound
  en: ['siri', 'samantha', 'karen', 'daniel', 'moira', 'tessa', 'allison', 'ava', 'alex', 'susan', 'tom', 'zoe', 'nicky', 'aaron', 'martha', 'oliver'],
  // Spanish - Latin American for US context
  es: ['siri', 'paulina', 'mónica', 'monica', 'jorge', 'diego', 'juan', 'marisol', 'angélica', 'angelica', 'isabela'],
  // Chinese - natural voices
  zh: ['siri', 'tingting', 'ting-ting', 'meijia', 'mei-jia', 'sinji', 'li-mu', 'yu-shu'],
  // Vietnamese
  vi: ['siri', 'linh'],
  // Korean
  ko: ['siri', 'yuna', 'sora'],
  // Portuguese - Brazilian
  pt: ['siri', 'luciana', 'felipe', 'catarina', 'joana', 'fernanda'],
  // Arabic - Egyptian voices
  ar: ['siri', 'maged', 'majed', 'laila', 'mariam', 'tarik', 'hoda'],
  // French
  fr: ['siri', 'amélie', 'amelie', 'thomas', 'audrey', 'marie'],
  // Russian
  ru: ['siri', 'milena', 'katya', 'yuri'],
  // Tagalog
  tl: ['siri'],
  // Hindi
  hi: ['siri', 'lekha', 'rishi'],
  // Japanese
  ja: ['siri', 'kyoko', 'otoya', 'hattori'],
  // German
  de: ['siri', 'anna', 'petra', 'helena', 'markus'],
  // Italian
  it: ['siri', 'alice', 'federica', 'luca', 'paola'],
  // Polish
  pl: ['siri', 'zosia', 'ewa'],
  // Ukrainian
  uk: ['siri', 'lesya'],
  // Persian
  fa: ['siri'],
  // Thai
  th: ['siri', 'kanya', 'narisa'],
  // Bengali
  bn: ['siri'],
  // Haitian Creole
  ht: [],
  // Punjabi
  pa: ['siri'],
};

/**
 * Novelty/unprofessional voices to avoid for business use
 */
const NOVELTY_VOICES = [
  'eddy', 'flo', 'grandma', 'grandpa', 'reed', 'rocko', 'sandy', 'shelley',
  'superstar', 'bubbles', 'cellos', 'zarvox', 'whisper', 'trinoids', 'bad news',
  'bahh', 'bells', 'boing', 'deranged', 'hysterical', 'organ', 'wobble',
];

/**
 * Voice quality keywords - prioritize these for natural sound
 */
const PREMIUM_VOICE_KEYWORDS = [
  'premium', 'enhanced', 'natural', 'neural', 'siri',
  ...Object.values(PREMIUM_VOICES_BY_LANG).flat(),
];

/**
 * Get the best voice for a language - prioritizes natural-sounding voices
 */
export const getBestVoice = (langCode: SupportedLanguage): SpeechSynthesisVoice | null => {
  const voices = getVoicesForLanguage(langCode);
  if (voices.length === 0) return null;

  // Get language-specific premium voices
  const langPremiumVoices = PREMIUM_VOICES_BY_LANG[langCode] || [];

  // Score voices based on quality indicators
  const scoredVoices = voices.map(voice => {
    let score = 0;
    const nameLower = voice.name.toLowerCase();

    // HIGHEST PRIORITY: Siri voices are the most natural
    if (nameLower.includes('siri')) {
      score += 500; // Siri is always best choice
    }

    // VERY HIGH: Enhanced/Premium marked voices
    if (nameLower.includes('enhanced') || nameLower.includes('premium')) {
      score += 300;
    }

    // HIGH: Language-specific premium voice names
    if (langPremiumVoices.some(pv => nameLower.includes(pv))) {
      score += 200;
    }

    // MEDIUM: General premium keywords (neural, natural)
    if (nameLower.includes('neural') || nameLower.includes('natural')) {
      score += 150;
    }

    // General premium keywords
    if (PREMIUM_VOICE_KEYWORDS.some(kw => nameLower.includes(kw))) {
      score += 100;
    }

    // Prefer non-compact voices (fuller, more natural sound)
    if (!nameLower.includes('compact')) {
      score += 50;
    }

    // Prefer local Apple voices over network Google voices
    if (voice.localService && !nameLower.startsWith('google')) {
      score += 40;
    }

    // Prefer voices that match the exact locale
    const langConfig = SUPPORTED_LANGUAGES.find(l => l.code === langCode);
    if (langConfig && voice.lang === langConfig.voiceCode) {
      score += 25;
    }

    // PENALIZE Google voices - they tend to sound more robotic
    if (nameLower.startsWith('google')) {
      score -= 100;
    }

    // HEAVILY PENALIZE novelty/unprofessional voices
    if (NOVELTY_VOICES.some(nv => nameLower.includes(nv))) {
      score -= 500;
    }

    // PENALIZE compact voices (lower quality)
    if (nameLower.includes('compact')) {
      score -= 75;
    }

    return { voice, score };
  });

  // Sort by score descending and return the best
  scoredVoices.sort((a, b) => b.score - a.score);

  // Log top 3 choices for debugging
  console.log(`Voice options for ${langCode}:`,
    scoredVoices.slice(0, 3).map(v => `${v.voice.name} (${v.score})`).join(', ')
  );

  return scoredVoices[0]?.voice || null;
};

/**
 * Language-specific voice settings for natural speech
 * Extended for all 21 supported languages
 */
const LANGUAGE_VOICE_SETTINGS: Record<string, { rate: number; pitch: number }> = {
  // Original languages
  en: { rate: 0.95, pitch: 1.0 },   // English - natural pace
  es: { rate: 0.92, pitch: 1.02 },  // Spanish - warm
  zh: { rate: 0.85, pitch: 1.0 },   // Chinese - slower for tones
  vi: { rate: 0.85, pitch: 1.0 },   // Vietnamese - slower for tones
  ko: { rate: 0.90, pitch: 1.0 },   // Korean - moderate pace
  pt: { rate: 0.92, pitch: 1.02 },  // Portuguese - warm
  ar: { rate: 0.85, pitch: 1.0 },   // Arabic - slower for clarity
  // New languages
  fr: { rate: 0.92, pitch: 1.0 },   // French
  ru: { rate: 0.90, pitch: 1.0 },   // Russian
  tl: { rate: 0.92, pitch: 1.0 },   // Tagalog
  hi: { rate: 0.88, pitch: 1.0 },   // Hindi
  ja: { rate: 0.88, pitch: 1.0 },   // Japanese
  de: { rate: 0.92, pitch: 1.0 },   // German
  it: { rate: 0.92, pitch: 1.02 },  // Italian - expressive
  pl: { rate: 0.90, pitch: 1.0 },   // Polish
  uk: { rate: 0.90, pitch: 1.0 },   // Ukrainian
  fa: { rate: 0.85, pitch: 1.0 },   // Persian
  th: { rate: 0.85, pitch: 1.0 },   // Thai - tonal
  bn: { rate: 0.88, pitch: 1.0 },   // Bengali
  ht: { rate: 0.90, pitch: 1.0 },   // Haitian Creole
  pa: { rate: 0.88, pitch: 1.0 },   // Punjabi
};

/**
 * Dialect-specific voice settings for regional speech patterns
 * These override base language settings when a dialect is detected
 */
const DIALECT_VOICE_SETTINGS: Record<SupportedDialect, { rate: number; pitch: number }> = {
  // Spanish dialects - US focus
  'es-mx': { rate: 0.92, pitch: 1.02 },   // Mexican - natural conversational
  'es-pr': { rate: 0.90, pitch: 1.03 },   // Puerto Rican - slightly slower, melodic
  'es-es': { rate: 0.88, pitch: 1.0 },    // Castilian - more formal pace
  'es-ar': { rate: 0.95, pitch: 1.01 },   // Argentine - faster, Italian influence
  'es-co': { rate: 0.90, pitch: 1.02 },   // Colombian - clear, measured

  // Arabic dialects - US focus
  'ar-eg': { rate: 0.85, pitch: 1.02 },   // Egyptian - expressive, warm
  'ar-lb': { rate: 0.88, pitch: 1.03 },   // Lebanese - melodic, French influence
  'ar-sa': { rate: 0.82, pitch: 0.98 },   // Saudi - formal, measured
  'ar-ma': { rate: 0.85, pitch: 1.0 },    // Moroccan - faster than Gulf
  'ar-ae': { rate: 0.84, pitch: 1.0 },    // Gulf - clear enunciation
} as Record<SupportedDialect, { rate: number; pitch: number }>;

/**
 * Get voice settings for a language or dialect
 */
export const getVoiceSettings = (langOrDialect: SupportedLanguage | SupportedDialect): { rate: number; pitch: number } => {
  // Check if it's a dialect first
  if (langOrDialect.includes('-')) {
    const dialectSettings = DIALECT_VOICE_SETTINGS[langOrDialect as SupportedDialect];
    if (dialectSettings) return dialectSettings;

    // Fall back to parent language
    const parentLang = langOrDialect.split('-')[0] as SupportedLanguage;
    return LANGUAGE_VOICE_SETTINGS[parentLang] || { rate: 0.9, pitch: 1.0 };
  }

  return LANGUAGE_VOICE_SETTINGS[langOrDialect] || { rate: 0.9, pitch: 1.0 };
};

/**
 * Key phrases that should have slight emphasis (pause before/after)
 * These are common in conversational sales speech
 */
const EMPHASIS_PHRASES = [
  'free', 'no cost', 'no obligation', 'completely free',
  '10 minutes', '15 minutes', 'quick', 'fast',
  'insurance', 'covered', 'no charge',
  'storm damage', 'hail damage',
  'your neighbor', 'across the street',
];

/**
 * Prosody configuration for different speech styles
 */
export interface ProsodyConfig {
  pauseAfterSentence: string;     // Pause after periods
  pauseAfterQuestion: string;     // Pause after questions
  pauseAfterExclaim: string;      // Pause after exclamations
  pauseAfterComma: string;        // Pause after commas
  pauseAfterColon: string;        // Pause after colons
  emphasisPause: string;          // Pause before key phrases
  breathingPause: string;         // Natural breathing pauses
}

/**
 * Default prosody settings for conversational speech
 */
const DEFAULT_PROSODY: ProsodyConfig = {
  pauseAfterSentence: ' ... ',    // ~300ms
  pauseAfterQuestion: ' .... ',   // ~400ms (slightly longer for questions)
  pauseAfterExclaim: ' ... ',     // ~300ms
  pauseAfterComma: ' .. ',        // ~150ms
  pauseAfterColon: ' .. ',        // ~150ms
  emphasisPause: ' . ',           // ~75ms (subtle pause before key phrases)
  breathingPause: ' . ',          // ~75ms (after "and", "but", "so")
};

/**
 * Fast-paced prosody for energetic speech
 */
const FAST_PROSODY: ProsodyConfig = {
  pauseAfterSentence: ' .. ',
  pauseAfterQuestion: ' ... ',
  pauseAfterExclaim: ' .. ',
  pauseAfterComma: ' . ',
  pauseAfterColon: ' . ',
  emphasisPause: '',
  breathingPause: '',
};

/**
 * Slow, clear prosody for emphasis or non-native speakers
 */
const CLEAR_PROSODY: ProsodyConfig = {
  pauseAfterSentence: ' .... ',
  pauseAfterQuestion: ' ..... ',
  pauseAfterExclaim: ' .... ',
  pauseAfterComma: ' ... ',
  pauseAfterColon: ' ... ',
  emphasisPause: ' .. ',
  breathingPause: ' . ',
};

/**
 * Add natural pauses to text for better prosody
 * @param text - The text to process
 * @param style - 'natural' (default), 'fast', or 'clear'
 * @param addEmphasis - Whether to add pauses before key phrases
 */
const addNaturalPauses = (
  text: string,
  style: 'natural' | 'fast' | 'clear' = 'natural',
  addEmphasis: boolean = true
): string => {
  const prosody = style === 'fast' ? FAST_PROSODY
    : style === 'clear' ? CLEAR_PROSODY
    : DEFAULT_PROSODY;

  let processed = text
    // Sentence endings
    .replace(/\.\s+/g, '.' + prosody.pauseAfterSentence)
    .replace(/\?\s+/g, '?' + prosody.pauseAfterQuestion)
    .replace(/!\s+/g, '!' + prosody.pauseAfterExclaim)
    // Mid-sentence pauses
    .replace(/,\s+/g, ',' + prosody.pauseAfterComma)
    .replace(/:\s+/g, ':' + prosody.pauseAfterColon)
    .replace(/;\s+/g, ';' + prosody.pauseAfterComma);

  // Add breathing pauses after common conjunctions
  if (prosody.breathingPause) {
    processed = processed
      .replace(/\band\b/gi, prosody.breathingPause + 'and')
      .replace(/\bbut\b/gi, prosody.breathingPause + 'but')
      .replace(/\bso\b/gi, prosody.breathingPause + 'so');
  }

  // Add subtle emphasis pauses before key phrases
  if (addEmphasis && prosody.emphasisPause) {
    for (const phrase of EMPHASIS_PHRASES) {
      const regex = new RegExp(`\\b(${phrase})\\b`, 'gi');
      processed = processed.replace(regex, prosody.emphasisPause + '$1');
    }
  }

  return processed;
};

/**
 * Remove prosody pauses from text (for display purposes)
 */
export const removeProsodyPauses = (text: string): string => {
  return text.replace(/\s*\.{2,}\s*/g, ' ').trim();
};

/**
 * Speak text in a given language with natural prosody
 * Supports both base languages and regional dialects
 */
export const speak = (
  text: string,
  langCode: SupportedLanguage | SupportedDialect,
  options?: {
    rate?: number;
    pitch?: number;
    volume?: number;
    natural?: boolean;          // Enable natural pauses (default: true)
    prosodyStyle?: 'natural' | 'fast' | 'clear';  // Prosody style
    addEmphasis?: boolean;      // Add emphasis to key phrases (default: true)
    onEnd?: () => void;
    onError?: (error: string) => void;
  }
): void => {
  // Cancel any ongoing speech
  stopSpeaking();

  // Handle dialects - get the parent language config but use dialect settings
  const baseLangCode = langCode.includes('-')
    ? langCode.split('-')[0] as SupportedLanguage
    : langCode;

  const langConfig = SUPPORTED_LANGUAGES.find(l => l.code === baseLangCode);
  if (!langConfig) {
    options?.onError?.('Unsupported language');
    return;
  }

  // Get voice settings (dialect-aware)
  const voiceSettings = getVoiceSettings(langCode);

  // Get voice code - prefer dialect-specific if available
  let voiceCode = langConfig.voiceCode;
  if (langCode.includes('-')) {
    const dialectConfig = DIALECT_VARIANTS.find(d => d.code === langCode);
    if (dialectConfig) {
      voiceCode = dialectConfig.voiceCode;
    }
  }

  // Process text for natural pauses (enabled by default)
  const prosodyStyle = options?.prosodyStyle ?? 'natural';
  const addEmphasis = options?.addEmphasis ?? true;
  const processedText = options?.natural !== false
    ? addNaturalPauses(text, prosodyStyle, addEmphasis)
    : text;

  const utterance = new SpeechSynthesisUtterance(processedText);
  utterance.lang = voiceCode;
  utterance.rate = options?.rate ?? voiceSettings.rate;
  utterance.pitch = options?.pitch ?? voiceSettings.pitch;
  utterance.volume = options?.volume ?? 1;

  // Try to set the best voice for the base language
  const voice = getBestVoice(baseLangCode);
  if (voice) {
    utterance.voice = voice;
    console.log(`Using voice: ${voice.name} (${voice.lang}) for ${langCode}`);
  }

  utterance.onend = () => {
    currentUtterance = null;
    options?.onEnd?.();
  };

  utterance.onerror = (event) => {
    currentUtterance = null;
    options?.onError?.(event.error);
  };

  currentUtterance = utterance;
  speechSynthesis.speak(utterance);
};

/**
 * Stop current speech
 */
export const stopSpeaking = (): void => {
  speechSynthesis.cancel();
  currentUtterance = null;
};

/**
 * Check if currently speaking
 */
export const isSpeaking = (): boolean => {
  return speechSynthesis.speaking;
};

/**
 * Pause current speech
 */
export const pauseSpeaking = (): void => {
  speechSynthesis.pause();
};

/**
 * Resume paused speech
 */
export const resumeSpeaking = (): void => {
  speechSynthesis.resume();
};

// ============================================
// Speech-to-Text (STT)
// ============================================

interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

type SpeechRecognitionCallback = (result: SpeechRecognitionResult) => void;
type SpeechRecognitionErrorCallback = (error: string) => void;

let recognition: SpeechRecognition | null = null;

/**
 * Check if speech recognition is supported
 */
export const isSpeechRecognitionSupported = (): boolean => {
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
};

/**
 * Minimum confidence threshold to filter out noise
 * Lower = more sensitive but more noise
 * Higher = less noise but might miss quiet speech
 */
const MIN_CONFIDENCE_THRESHOLD = 0.3; // Very sensitive - accept most speech

/**
 * Clean transcript by removing common noise artifacts
 */
const cleanTranscript = (text: string): string => {
  return text
    .trim()
    // Remove common noise words that get picked up
    .replace(/^(um|uh|hmm|ah|oh|er)\s*/gi, '')
    // Remove trailing noise
    .replace(/\s*(um|uh|hmm|ah|oh|er)$/gi, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Start listening for speech input
 * Enhanced with better sensitivity and noise filtering
 */
export const startListening = (
  langCode: SupportedLanguage,
  onResult: SpeechRecognitionCallback,
  onError: SpeechRecognitionErrorCallback,
  options?: {
    continuous?: boolean;
    interimResults?: boolean;
    onEnd?: () => void;
    sensitivityBoost?: boolean; // Enable extra sensitivity
  }
): void => {
  if (!isSpeechRecognitionSupported()) {
    onError('Speech recognition not supported in this browser');
    return;
  }

  // Stop any existing recognition
  stopListening();

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();

  const langConfig = SUPPORTED_LANGUAGES.find(l => l.code === langCode);

  // Configure for maximum sensitivity
  recognition.lang = langConfig?.voiceCode || 'en-US';
  recognition.continuous = options?.continuous ?? true; // Keep listening
  recognition.interimResults = options?.interimResults ?? true;
  recognition.maxAlternatives = 3; // Get multiple alternatives for better accuracy

  recognition.onresult = (event) => {
    const result = event.results[event.results.length - 1];
    const transcript = result[0].transcript;
    const confidence = result[0].confidence;

    // Clean the transcript
    const cleanedTranscript = cleanTranscript(transcript);

    // Only filter by confidence for final results
    // Always pass interim results so user sees feedback
    if (result.isFinal) {
      // Check confidence threshold for final results
      if (confidence < MIN_CONFIDENCE_THRESHOLD && cleanedTranscript.length < 3) {
        console.log(`Filtered low-confidence noise: "${transcript}" (${(confidence * 100).toFixed(1)}%)`);
        return; // Skip this result
      }
    }

    // Skip empty results
    if (!cleanedTranscript && result.isFinal) {
      return;
    }

    onResult({
      transcript: result.isFinal ? cleanedTranscript : transcript,
      confidence: confidence,
      isFinal: result.isFinal,
    });
  };

  recognition.onerror = (event) => {
    // Don't report 'no-speech' or 'aborted' as errors - these are normal
    if (event.error === 'no-speech' || event.error === 'aborted') {
      console.log(`Speech recognition: ${event.error}`);
      return;
    }
    onError(event.error);
  };

  recognition.onend = () => {
    recognition = null;
    options?.onEnd?.();
  };

  // Use a slight delay to ensure audio context is ready
  setTimeout(() => {
    try {
      recognition?.start();
      console.log(`Started listening in ${langConfig?.voiceCode || 'en-US'}`);
    } catch (e) {
      console.error('Failed to start recognition:', e);
    }
  }, 100);
};

/**
 * Stop listening
 */
export const stopListening = (): void => {
  if (recognition) {
    recognition.stop();
    recognition = null;
  }
};

/**
 * Check if currently listening
 */
export const isListening = (): boolean => {
  return recognition !== null;
};

// ============================================
// Language Detection (using Web Speech API)
// ============================================

/**
 * Try to auto-detect language from speech
 * Note: This uses a multi-language approach where we listen with no specific language
 */
export const detectLanguageFromSpeech = (
  onResult: (langCode: SupportedLanguage | null, transcript: string) => void,
  onError: SpeechRecognitionErrorCallback,
  timeout: number = 5000
): void => {
  if (!isSpeechRecognitionSupported()) {
    onError('Speech recognition not supported');
    return;
  }

  stopListening();

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();

  // Use a general language setting to try auto-detect
  recognition.lang = ''; // Empty means auto-detect in some browsers
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  const timeoutId = setTimeout(() => {
    stopListening();
    onResult(null, '');
  }, timeout);

  recognition.onresult = (event) => {
    clearTimeout(timeoutId);
    const transcript = event.results[0][0].transcript;
    // We'll use Gemini for actual language detection
    onResult(null, transcript);
  };

  recognition.onerror = (event) => {
    clearTimeout(timeoutId);
    onError(event.error);
  };

  recognition.start();
};

// ============================================
// Voice Availability Check
// ============================================

/**
 * Wait for voices to load (they load asynchronously)
 */
export const waitForVoices = (): Promise<SpeechSynthesisVoice[]> => {
  return new Promise((resolve) => {
    const voices = speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(voices);
      return;
    }

    speechSynthesis.onvoiceschanged = () => {
      resolve(speechSynthesis.getVoices());
    };

    // Fallback timeout
    setTimeout(() => {
      resolve(speechSynthesis.getVoices());
    }, 1000);
  });
};

/**
 * Check which languages have voice support
 */
export const checkVoiceSupport = async (): Promise<Map<SupportedLanguage, boolean>> => {
  await waitForVoices();
  const support = new Map<SupportedLanguage, boolean>();

  for (const lang of SUPPORTED_LANGUAGES) {
    const voices = getVoicesForLanguage(lang.code);
    support.set(lang.code, voices.length > 0);
  }

  return support;
};

// ============================================
// Voice Debugging & Selection
// ============================================

/**
 * Get all available voices with quality info
 */
export const getAllVoicesWithInfo = async (): Promise<Array<{
  name: string;
  lang: string;
  isLocal: boolean;
  isPremium: boolean;
}>> => {
  await waitForVoices();
  const voices = speechSynthesis.getVoices();

  return voices.map(voice => {
    const nameLower = voice.name.toLowerCase();
    const isPremium = PREMIUM_VOICE_KEYWORDS.some(kw => nameLower.includes(kw));

    return {
      name: voice.name,
      lang: voice.lang,
      isLocal: voice.localService,
      isPremium,
    };
  });
};

/**
 * Log available voices for debugging
 */
export const logAvailableVoices = async (): Promise<void> => {
  const voices = await getAllVoicesWithInfo();
  console.log('=== Available TTS Voices ===');

  const grouped = voices.reduce((acc, v) => {
    const langKey = v.lang.split('-')[0];
    if (!acc[langKey]) acc[langKey] = [];
    acc[langKey].push(v);
    return acc;
  }, {} as Record<string, typeof voices>);

  for (const [lang, langVoices] of Object.entries(grouped)) {
    console.log(`\n${lang.toUpperCase()}:`);
    langVoices.forEach(v => {
      const flags = [
        v.isPremium ? '★ Premium' : '',
        v.isLocal ? 'Local' : 'Network',
      ].filter(Boolean).join(', ');
      console.log(`  - ${v.name} (${v.lang}) [${flags}]`);
    });
  }
};

// TypeScript declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}
