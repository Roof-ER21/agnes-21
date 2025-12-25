/**
 * Agnes Voice Utility - Hybrid Approach
 *
 * Uses Gemini Live for English (consistent with roleplay/feedback)
 * Falls back to Web Speech API for other languages
 */

import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { base64ToUint8Array, decodeAudioData } from './audioUtils';
import { SupportedLanguage, SupportedDialect, SUPPORTED_LANGUAGES, DIALECT_VARIANTS, getDialectConfig } from '../types';

// ============================================
// Gemini Live TTS for English
// ============================================

class GeminiEnglishTTS {
  private aiClient: GoogleGenAI | null = null;
  private session: any = null;
  private audioContext: AudioContext | null = null;
  private audioQueue: AudioBufferSourceNode[] = [];
  private resolveCallback: (() => void) | null = null;
  private isInitialized: boolean = false;
  private nextStartTime: number = 0;

  async init(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.warn('Gemini API key not found');
        return false;
      }

      this.aiClient = new GoogleGenAI({ apiKey });

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass({ sampleRate: 24000 });

      this.isInitialized = true;
      console.log('🎤 Gemini English TTS initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize Gemini TTS:', error);
      return false;
    }
  }

  private async connect(): Promise<boolean> {
    if (!this.aiClient) return false;
    if (this.session) return true;

    try {
      console.log('🔌 Connecting to Gemini Live for English TTS...');

      const sessionPromise = this.aiClient.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            console.log('✅ Gemini TTS session opened');
          },
          onmessage: async (message: LiveServerMessage) => {
            const serverContent = message.serverContent;

            // Handle audio
            const base64Audio = serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              await this.playAudioChunk(base64Audio);
            }

            // Check if done
            if (serverContent?.turnComplete) {
              setTimeout(() => {
                this.resolveCallback?.();
                this.resolveCallback = null;
              }, 200);
            }
          },
          onclose: () => {
            console.log('Gemini TTS session closed');
            this.session = null;
          },
          onerror: (error) => {
            console.error('Gemini TTS error:', error);
            this.session = null;
            this.resolveCallback?.();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
            languageCode: 'en-US'
          },
          systemInstruction: `You are Agnes, a warm and professional assistant.
Your task is to read text aloud naturally.
Do NOT add commentary - just speak the exact text given.
Speak clearly and warmly like a professional translator.`
        }
      });

      this.session = await sessionPromise;
      return true;
    } catch (error) {
      console.error('Failed to connect Gemini session:', error);
      return false;
    }
  }

  private async playAudioChunk(base64Audio: string): Promise<void> {
    if (!this.audioContext) return;

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    try {
      const audioBuffer = await decodeAudioData(
        base64ToUint8Array(base64Audio),
        this.audioContext
      );

      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);

      const currentTime = this.audioContext.currentTime;
      if (this.nextStartTime < currentTime) {
        this.nextStartTime = currentTime;
      }

      source.start(this.nextStartTime);
      this.nextStartTime += audioBuffer.duration;

      this.audioQueue.push(source);
      source.onended = () => {
        const idx = this.audioQueue.indexOf(source);
        if (idx > -1) this.audioQueue.splice(idx, 1);
      };
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  }

  async speak(text: string): Promise<boolean> {
    if (!this.isInitialized) {
      const ok = await this.init();
      if (!ok) return false;
    }

    const connected = await this.connect();
    if (!connected || !this.session) {
      console.warn('Gemini session not available');
      return false;
    }

    console.log(`🔊 Gemini speaking: "${text.substring(0, 50)}..."`);

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.warn('Gemini speech timeout');
        this.resolveCallback = null;
        resolve(false);
      }, 15000);

      this.resolveCallback = () => {
        clearTimeout(timeout);
        resolve(true);
      };

      try {
        this.session.sendClientContent({
          turns: [{
            role: 'user',
            parts: [{ text: `Read this aloud: "${text}"` }]
          }],
          turnComplete: true
        });
      } catch (error) {
        console.error('Error sending to Gemini:', error);
        clearTimeout(timeout);
        resolve(false);
      }
    });
  }

  stop(): void {
    this.audioQueue.forEach(s => { try { s.stop(); } catch {} });
    this.audioQueue = [];
    this.nextStartTime = 0;
    this.resolveCallback?.();
    this.resolveCallback = null;
  }

  async cleanup(): Promise<void> {
    this.stop();
    this.session = null;
    if (this.audioContext && this.audioContext.state !== 'closed') {
      await this.audioContext.close();
    }
    this.audioContext = null;
    this.isInitialized = false;
  }
}

// Singleton for Gemini English
const geminiEnglish = new GeminiEnglishTTS();

// ============================================
// Web Speech API for Other Languages
// ============================================

let voicesLoaded = false;
let cachedVoices: SpeechSynthesisVoice[] = [];

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
        resolve(cachedVoices);
      }
    };

    loadVoices();
    if (!voicesLoaded) {
      speechSynthesis.onvoiceschanged = loadVoices;
      setTimeout(() => {
        loadVoices();
        resolve(cachedVoices);
      }, 1000);
    }
  });
};

const VOICE_PREFERENCES: Record<string, string[]> = {
  en: ['samantha', 'siri', 'allison', 'ava', 'karen', 'enhanced'],
  es: ['paulina', 'mónica', 'monica', 'siri', 'enhanced'],
  zh: ['tingting', 'ting-ting', 'meijia', 'siri', 'enhanced'],
  vi: ['linh', 'siri', 'enhanced'],
  ko: ['yuna', 'sora', 'siri', 'enhanced'],
  pt: ['luciana', 'fernanda', 'siri', 'enhanced'],
  ar: ['laila', 'mariam', 'maged', 'siri', 'enhanced'],
  fr: ['amélie', 'amelie', 'audrey', 'siri', 'enhanced'],
  ru: ['milena', 'katya', 'yuri', 'siri', 'enhanced'],
  tl: ['siri', 'enhanced'],
  hi: ['lekha', 'siri', 'enhanced'],
  ja: ['kyoko', 'otoya', 'siri', 'enhanced'],
  de: ['anna', 'petra', 'helena', 'siri', 'enhanced'],
  it: ['alice', 'federica', 'elsa', 'siri', 'enhanced'],
  pl: ['zosia', 'ewa', 'siri', 'enhanced'],
  uk: ['siri', 'enhanced'],
  fa: ['siri', 'enhanced'],
  th: ['kanya', 'siri', 'enhanced'],
  bn: ['siri', 'enhanced'],
  ht: ['siri', 'enhanced'],
  pa: ['siri', 'enhanced'],
};

// Dialect-specific voice preferences (US-focused dialects)
const DIALECT_VOICE_PREFERENCES: Record<string, string[]> = {
  // Spanish variants
  'es-mx': ['paulina', 'juan', 'mónica', 'siri', 'enhanced'],     // Mexican Spanish
  'es-pr': ['paulina', 'mónica', 'siri', 'enhanced'],              // Puerto Rican Spanish
  'es-es': ['jorge', 'mónica', 'lucia', 'siri', 'enhanced'],       // Castilian Spanish
  'es-ar': ['diego', 'mónica', 'siri', 'enhanced'],                // Argentine Spanish
  'es-co': ['mónica', 'paulina', 'siri', 'enhanced'],              // Colombian Spanish

  // Arabic variants
  'ar-eg': ['laila', 'maged', 'tarik', 'siri', 'enhanced'],        // Egyptian Arabic
  'ar-lb': ['laila', 'mariam', 'siri', 'enhanced'],                // Lebanese Arabic
  'ar-sa': ['maged', 'mishaal', 'siri', 'enhanced'],               // Saudi Arabic
  'ar-ma': ['laila', 'mariam', 'siri', 'enhanced'],                // Moroccan Arabic
  'ar-ae': ['maged', 'mishaal', 'siri', 'enhanced'],               // Gulf Arabic
};

const SPEECH_RATES: Record<string, number> = {
  en: 0.95, es: 0.92, zh: 0.85, vi: 0.85, ko: 0.90,
  pt: 0.92, ar: 0.85, fr: 0.92, ru: 0.90, tl: 0.92,
  hi: 0.88, ja: 0.88, de: 0.92, it: 0.92, pl: 0.90,
  uk: 0.90, fa: 0.85, th: 0.85, bn: 0.88, ht: 0.90, pa: 0.88,
};

// Dialect-specific speech rates for natural pacing
const DIALECT_SPEECH_RATES: Record<string, number> = {
  // Spanish variants
  'es-mx': 0.92,  // Mexican Spanish - natural conversational pace
  'es-pr': 0.90,  // Puerto Rican Spanish - Caribbean rhythm
  'es-es': 0.88,  // Castilian Spanish - slightly faster
  'es-ar': 0.90,  // Argentine Spanish - moderate pace
  'es-co': 0.92,  // Colombian Spanish - clear pronunciation

  // Arabic variants
  'ar-eg': 0.85,  // Egyptian Arabic - clear enunciation
  'ar-lb': 0.88,  // Lebanese Arabic - slightly faster
  'ar-sa': 0.82,  // Saudi Arabic - formal, measured pace
  'ar-ma': 0.85,  // Moroccan Arabic - moderate pace
  'ar-ae': 0.85,  // Gulf Arabic - moderate pace
};

/**
 * Get voice preferences for a language or dialect
 */
const getVoicePreferences = (langOrDialect: SupportedLanguage | SupportedDialect): string[] => {
  // Check if it's a dialect first
  if (langOrDialect.includes('-')) {
    const dialectPrefs = DIALECT_VOICE_PREFERENCES[langOrDialect];
    if (dialectPrefs) return dialectPrefs;

    // Fallback to parent language
    const parentLang = langOrDialect.split('-')[0] as SupportedLanguage;
    return VOICE_PREFERENCES[parentLang] || VOICE_PREFERENCES.en;
  }

  return VOICE_PREFERENCES[langOrDialect] || VOICE_PREFERENCES.en;
};

/**
 * Get speech rate for a language or dialect
 */
const getSpeechRate = (langOrDialect: SupportedLanguage | SupportedDialect): number => {
  // Check if it's a dialect first
  if (langOrDialect.includes('-')) {
    const dialectRate = DIALECT_SPEECH_RATES[langOrDialect];
    if (dialectRate) return dialectRate;

    // Fallback to parent language
    const parentLang = langOrDialect.split('-')[0] as SupportedLanguage;
    return SPEECH_RATES[parentLang] || 0.9;
  }

  return SPEECH_RATES[langOrDialect] || 0.9;
};

const scoreVoice = (voice: SpeechSynthesisVoice, langOrDialect: string): number => {
  const nameLower = voice.name.toLowerCase();
  let score = 0;

  if (nameLower.includes('siri')) score += 500;
  if (nameLower.includes('enhanced') || nameLower.includes('premium')) score += 300;

  // Use dialect-aware voice preferences
  const prefs = getVoicePreferences(langOrDialect as SupportedLanguage);
  for (let i = 0; i < prefs.length; i++) {
    if (nameLower.includes(prefs[i])) score += 200 - i * 10;
  }

  if (voice.localService) score += 50;
  if (nameLower.includes('google')) score -= 100;

  return score;
};

const findBestVoice = async (langOrDialect: SupportedLanguage | SupportedDialect): Promise<SpeechSynthesisVoice | null> => {
  const voices = await getVoices();

  // Determine voice code - check dialect first, then language
  let voiceCode: string;
  let langPrefix: string;

  if (langOrDialect.includes('-')) {
    // It's a dialect - use dialect-specific voice code
    const dialectConfig = getDialectConfig(langOrDialect as SupportedDialect);
    voiceCode = dialectConfig?.voiceCode || 'en-US';
    langPrefix = langOrDialect.split('-')[0];
  } else {
    // It's a base language
    const langConfig = SUPPORTED_LANGUAGES.find(l => l.code === langOrDialect);
    voiceCode = langConfig?.voiceCode || 'en-US';
    langPrefix = voiceCode.split('-')[0];
  }

  const matching = voices.filter(v => {
    const vLang = v.lang.toLowerCase();
    // Match by dialect code first, then by language prefix
    return vLang === voiceCode.toLowerCase() ||
           vLang.startsWith(langPrefix.toLowerCase()) ||
           vLang.startsWith(langOrDialect.toLowerCase());
  });

  if (matching.length === 0) return voices[0] || null;

  const scored = matching.map(v => ({ voice: v, score: scoreVoice(v, langOrDialect) }))
    .sort((a, b) => b.score - a.score);

  return scored[0].voice;
};

const speakWithWebSpeech = async (
  text: string,
  lang: SupportedLanguage,
  onEnd?: () => void,
  onError?: (error: string) => void
): Promise<void> => {
  speechSynthesis.cancel();

  return new Promise(async (resolve) => {
    try {
      const voice = await findBestVoice(lang);
      const utterance = new SpeechSynthesisUtterance(text);

      if (voice) {
        utterance.voice = voice;
        console.log(`🎤 Using voice: ${voice.name}`);
      }

      const langConfig = SUPPORTED_LANGUAGES.find(l => l.code === lang);
      utterance.lang = langConfig?.voiceCode || 'en-US';
      utterance.rate = getSpeechRate(lang);
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      const timeout = setTimeout(() => {
        speechSynthesis.cancel();
        onEnd?.();
        resolve();
      }, 30000);

      utterance.onend = () => {
        clearTimeout(timeout);
        console.log('✅ Web Speech finished');
        onEnd?.();
        resolve();
      };

      utterance.onerror = (event) => {
        clearTimeout(timeout);
        if (event.error !== 'interrupted') {
          console.error('Speech error:', event.error);
          onError?.(event.error);
        }
        resolve();
      };

      speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Web Speech error:', error);
      onError?.(error instanceof Error ? error.message : 'Unknown error');
      resolve();
    }
  });
};

// ============================================
// Main Export - Hybrid Approach
// ============================================

/**
 * Agnes speaks - uses Gemini for English, Web Speech for others
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
    onEnd?.();
    return;
  }

  console.log(`🔊 Agnes speaking in ${lang}: "${text.substring(0, 50)}..."`);

  // Try Gemini for English
  if (lang === 'en') {
    const success = await geminiEnglish.speak(text);
    if (success) {
      console.log('✅ Gemini English TTS success');
      onEnd?.();
      return;
    }
    console.log('⚠️ Gemini failed, falling back to Web Speech');
  }

  // Use Web Speech for other languages or as fallback
  await speakWithWebSpeech(text, lang, onEnd, onError);
};

/**
 * Stop Agnes from speaking
 */
export const agnesVoiceStop = (): void => {
  geminiEnglish.stop();
  speechSynthesis.cancel();
};

/**
 * Check if speaking
 */
export const isAgnesSpeaking = (): boolean => {
  return speechSynthesis.speaking;
};

/**
 * Initialize
 */
export const initGeminiTTS = async (): Promise<void> => {
  await Promise.all([
    geminiEnglish.init(),
    getVoices()
  ]);
  console.log('🎤 Agnes voice system initialized (hybrid mode)');
};

/**
 * Cleanup
 */
export const cleanupGeminiTTS = async (): Promise<void> => {
  agnesVoiceStop();
  await geminiEnglish.cleanup();
};

// Legacy exports
export const speakWithGemini = agnesVoiceSpeak;
export const stopGeminiSpeaking = agnesVoiceStop;
export const isGeminiAvailable = (): boolean => true;
