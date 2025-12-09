/**
 * Agnes Voice Utility - Hybrid Approach
 *
 * Uses Gemini Live for English (consistent with roleplay/feedback)
 * Falls back to Web Speech API for other languages
 */

import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { base64ToUint8Array, decodeAudioData } from './audioUtils';
import { SupportedLanguage, SUPPORTED_LANGUAGES } from '../types';

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
        this.session.send({
          clientContent: {
            turns: [{
              role: 'user',
              parts: [{ text: `Read this aloud: "${text}"` }]
            }],
            turnComplete: true
          }
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

const SPEECH_RATES: Record<string, number> = {
  en: 0.95, es: 0.92, zh: 0.85, vi: 0.85, ko: 0.90,
  pt: 0.92, ar: 0.85, fr: 0.92, ru: 0.90, tl: 0.92,
  hi: 0.88, ja: 0.88, de: 0.92, it: 0.92, pl: 0.90,
  uk: 0.90, fa: 0.85, th: 0.85, bn: 0.88, ht: 0.90, pa: 0.88,
};

const scoreVoice = (voice: SpeechSynthesisVoice, lang: string): number => {
  const nameLower = voice.name.toLowerCase();
  let score = 0;

  if (nameLower.includes('siri')) score += 500;
  if (nameLower.includes('enhanced') || nameLower.includes('premium')) score += 300;

  const prefs = VOICE_PREFERENCES[lang] || VOICE_PREFERENCES.en;
  for (let i = 0; i < prefs.length; i++) {
    if (nameLower.includes(prefs[i])) score += 200 - i * 10;
  }

  if (voice.localService) score += 50;
  if (nameLower.includes('google')) score -= 100;

  return score;
};

const findBestVoice = async (lang: SupportedLanguage): Promise<SpeechSynthesisVoice | null> => {
  const voices = await getVoices();
  const langConfig = SUPPORTED_LANGUAGES.find(l => l.code === lang);
  const voiceCode = langConfig?.voiceCode || 'en-US';
  const langPrefix = voiceCode.split('-')[0];

  const matching = voices.filter(v => {
    const vLang = v.lang.toLowerCase();
    return vLang.startsWith(langPrefix.toLowerCase()) || vLang.startsWith(lang.toLowerCase());
  });

  if (matching.length === 0) return voices[0] || null;

  const scored = matching.map(v => ({ voice: v, score: scoreVoice(v, lang) }))
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
      utterance.rate = SPEECH_RATES[lang] || 0.9;
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
