/**
 * Agnes Voice Utility
 *
 * Provides a unified voice API for Agnes across all modes.
 * Uses Web Speech API with premium voice selection.
 *
 * Note: Gemini Live requires bidirectional audio (mic input) to work.
 * For TTS-only use in Field Translator, we use Web Speech API with
 * the best available voices for each language.
 */

import { SupportedLanguage, SUPPORTED_LANGUAGES } from '../types';

// ============================================
// Voice Cache & Selection
// ============================================

let voicesLoaded = false;
let cachedVoices: SpeechSynthesisVoice[] = [];

/**
 * Get all available voices, waiting for them to load if necessary
 */
const getVoices = (): Promise<SpeechSynthesisVoice[]> => {
  return new Promise((resolve) => {
    if (voicesLoaded && cachedVoices.length > 0) {
      resolve(cachedVoices);
      return;
    }

    const loadVoices = () => {
      cachedVoices = speechSynthesis.getVoices();
      if (cachedVoices.length > 0) {
        voicesLoaded = true;
        console.log(`🔊 Loaded ${cachedVoices.length} TTS voices`);
        resolve(cachedVoices);
      }
    };

    // Try immediately
    loadVoices();

    // Also listen for changes
    if (!voicesLoaded) {
      speechSynthesis.onvoiceschanged = loadVoices;
      // Fallback timeout
      setTimeout(() => {
        if (!voicesLoaded) {
          loadVoices();
          resolve(cachedVoices);
        }
      }, 1000);
    }
  });
};

/**
 * Premium voice preferences by language
 * Prioritizes Siri, Enhanced, and natural-sounding voices
 */
const VOICE_PREFERENCES: Record<string, string[]> = {
  en: ['samantha', 'siri', 'allison', 'ava', 'karen', 'moira', 'tessa', 'enhanced'],
  es: ['paulina', 'mónica', 'monica', 'angélica', 'angelica', 'siri', 'enhanced'],
  zh: ['tingting', 'ting-ting', 'meijia', 'siri', 'enhanced'],
  vi: ['linh', 'siri', 'enhanced'],
  ko: ['yuna', 'sora', 'siri', 'enhanced'],
  pt: ['luciana', 'fernanda', 'siri', 'enhanced'],
  ar: ['laila', 'mariam', 'maged', 'siri', 'enhanced'],
  fr: ['amélie', 'amelie', 'audrey', 'thomas', 'siri', 'enhanced'],
  ru: ['milena', 'katya', 'yuri', 'siri', 'enhanced'],
  tl: ['siri', 'enhanced', 'female'],
  hi: ['lekha', 'siri', 'enhanced'],
  ja: ['kyoko', 'otoya', 'siri', 'enhanced'],
  de: ['anna', 'petra', 'helena', 'siri', 'enhanced'],
  it: ['alice', 'federica', 'elsa', 'siri', 'enhanced'],
  pl: ['zosia', 'ewa', 'siri', 'enhanced'],
  uk: ['siri', 'enhanced', 'female'],
  fa: ['siri', 'enhanced', 'female'],
  th: ['kanya', 'siri', 'enhanced'],
  bn: ['siri', 'enhanced', 'female'],
  ht: ['siri', 'enhanced', 'female'],
  pa: ['siri', 'enhanced', 'female'],
};

/**
 * Speech rates per language for natural rhythm
 */
const SPEECH_RATES: Record<string, number> = {
  en: 0.95,
  es: 0.92,
  zh: 0.85,
  vi: 0.85,
  ko: 0.90,
  pt: 0.92,
  ar: 0.85,
  fr: 0.92,
  ru: 0.90,
  tl: 0.92,
  hi: 0.88,
  ja: 0.88,
  de: 0.92,
  it: 0.92,
  pl: 0.90,
  uk: 0.90,
  fa: 0.85,
  th: 0.85,
  bn: 0.88,
  ht: 0.90,
  pa: 0.88,
};

/**
 * Score a voice for quality
 */
const scoreVoice = (voice: SpeechSynthesisVoice, lang: string): number => {
  const nameLower = voice.name.toLowerCase();
  let score = 0;

  // Highest priority: Siri voices
  if (nameLower.includes('siri')) {
    score += 500;
  }

  // Very high: Enhanced/Premium voices
  if (nameLower.includes('enhanced') || nameLower.includes('premium')) {
    score += 300;
  }

  // High: Preferred voice names for this language
  const preferences = VOICE_PREFERENCES[lang] || VOICE_PREFERENCES.en;
  for (let i = 0; i < preferences.length; i++) {
    if (nameLower.includes(preferences[i])) {
      score += 200 - i * 10; // Earlier in list = higher score
    }
  }

  // Medium: Local/native voices
  if (voice.localService) {
    score += 50;
  }

  // Penalize: Google voices (often robotic)
  if (nameLower.includes('google')) {
    score -= 100;
  }

  return score;
};

/**
 * Find the best voice for a language
 */
const findBestVoice = async (lang: SupportedLanguage): Promise<SpeechSynthesisVoice | null> => {
  const voices = await getVoices();
  const langConfig = SUPPORTED_LANGUAGES.find(l => l.code === lang);
  const voiceCode = langConfig?.voiceCode || 'en-US';
  const langPrefix = voiceCode.split('-')[0];

  // Filter voices for this language
  const matchingVoices = voices.filter(v => {
    const vLang = v.lang.toLowerCase();
    return vLang.startsWith(langPrefix.toLowerCase()) ||
           vLang.startsWith(lang.toLowerCase());
  });

  if (matchingVoices.length === 0) {
    console.warn(`No voices found for ${lang}, using default`);
    return voices[0] || null;
  }

  // Score and sort voices
  const scoredVoices = matchingVoices
    .map(v => ({ voice: v, score: scoreVoice(v, lang) }))
    .sort((a, b) => b.score - a.score);

  const best = scoredVoices[0];
  console.log(`🎤 Best voice for ${lang}: ${best.voice.name} (score: ${best.score})`);

  return best.voice;
};

// ============================================
// Speech Synthesis
// ============================================

let currentUtterance: SpeechSynthesisUtterance | null = null;

/**
 * Agnes speaks using Web Speech API with premium voice
 */
export const agnesVoiceSpeak = async (
  text: string,
  lang: SupportedLanguage = 'en',
  options?: {
    onEnd?: () => void;
    onError?: (error: string) => void;
  }
): Promise<void> => {
  const { onEnd, onError } = options || {};

  if (!text || text.trim().length === 0) {
    console.warn('agnesVoiceSpeak: Empty text');
    onEnd?.();
    return;
  }

  // Cancel any ongoing speech
  speechSynthesis.cancel();

  return new Promise(async (resolve) => {
    try {
      const voice = await findBestVoice(lang);
      const utterance = new SpeechSynthesisUtterance(text);

      if (voice) {
        utterance.voice = voice;
      }

      // Set language and rate
      const langConfig = SUPPORTED_LANGUAGES.find(l => l.code === lang);
      utterance.lang = langConfig?.voiceCode || 'en-US';
      utterance.rate = SPEECH_RATES[lang] || 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      currentUtterance = utterance;

      console.log(`🔊 Agnes speaking in ${lang}: "${text.substring(0, 50)}..."`);

      // Set up timeout to prevent hanging
      const timeout = setTimeout(() => {
        console.warn('⚠️ Speech timeout');
        speechSynthesis.cancel();
        onEnd?.();
        resolve();
      }, 30000);

      utterance.onend = () => {
        clearTimeout(timeout);
        currentUtterance = null;
        console.log('✅ Agnes finished speaking');
        onEnd?.();
        resolve();
      };

      utterance.onerror = (event) => {
        clearTimeout(timeout);
        currentUtterance = null;
        // Don't log "interrupted" errors - those are expected when canceling
        if (event.error !== 'interrupted') {
          console.error('❌ Speech error:', event.error);
          onError?.(event.error);
        }
        resolve();
      };

      speechSynthesis.speak(utterance);

    } catch (error) {
      console.error('agnesVoiceSpeak error:', error);
      onError?.(error instanceof Error ? error.message : 'Unknown error');
      resolve();
    }
  });
};

/**
 * Stop Agnes from speaking
 */
export const agnesVoiceStop = (): void => {
  speechSynthesis.cancel();
  currentUtterance = null;
};

/**
 * Check if Agnes is currently speaking
 */
export const isAgnesSpeaking = (): boolean => {
  return speechSynthesis.speaking;
};

/**
 * Initialize (pre-load voices)
 */
export const initGeminiTTS = async (): Promise<void> => {
  await getVoices();
  console.log('Agnes voice system initialized');
};

/**
 * Cleanup (no-op for Web Speech API)
 */
export const cleanupGeminiTTS = async (): Promise<void> => {
  agnesVoiceStop();
};

/**
 * Legacy exports for compatibility
 */
export const speakWithGemini = agnesVoiceSpeak;
export const stopGeminiSpeaking = agnesVoiceStop;
export const isGeminiAvailable = (): boolean => true;
