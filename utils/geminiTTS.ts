/**
 * Agnes Gemini Live TTS Service
 *
 * Uses Gemini Live's native audio for high-quality multilingual TTS.
 * This is the same voice technology used in PitchTrainer roleplay/feedback.
 *
 * Features:
 * - Kore voice (natural, warm, professional)
 * - Multilingual support via languageCode
 * - Session persistence per language
 * - Audio playback via Web Audio API
 */

import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { base64ToUint8Array, decodeAudioData } from './audioUtils';
import { SupportedLanguage, SUPPORTED_LANGUAGES } from '../types';

// ============================================
// Gemini Live TTS Service Class
// ============================================

class GeminiTTSService {
  private aiClient: GoogleGenAI | null = null;
  private session: any = null;
  private audioContext: AudioContext | null = null;
  private currentLang: SupportedLanguage = 'en';
  private audioQueue: AudioBufferSourceNode[] = [];
  private resolveCallback: (() => void) | null = null;
  private isInitialized: boolean = false;
  private isConnecting: boolean = false;
  private nextStartTime: number = 0;

  /**
   * Initialize the service (call once on app start)
   */
  async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.error('Gemini API key not found');
        return;
      }

      this.aiClient = new GoogleGenAI({ apiKey });

      // Create audio context for playback (24kHz for Gemini audio)
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass({ sampleRate: 24000 });

      this.isInitialized = true;
      console.log('GeminiTTSService initialized');
    } catch (error) {
      console.error('Failed to initialize GeminiTTSService:', error);
    }
  }

  /**
   * Connect to Gemini Live for a specific language
   */
  private async connectForLanguage(lang: SupportedLanguage): Promise<void> {
    if (!this.aiClient || !this.isInitialized) {
      await this.init();
    }

    if (!this.aiClient) {
      throw new Error('Gemini client not initialized');
    }

    // If we're already connecting, wait
    if (this.isConnecting) {
      await new Promise(resolve => setTimeout(resolve, 100));
      return this.connectForLanguage(lang);
    }

    // If already connected to this language, reuse session
    if (this.session && this.currentLang === lang) {
      return;
    }

    // Close existing session if different language
    if (this.session) {
      await this.disconnect();
    }

    this.isConnecting = true;

    try {
      const langConfig = SUPPORTED_LANGUAGES.find(l => l.code === lang);
      const languageCode = langConfig?.voiceCode || 'en-US';
      const languageName = langConfig?.name || 'the target language';

      console.log(`Connecting Gemini TTS for ${languageName} (${languageCode})...`);

      this.session = await this.aiClient.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            console.log(`Gemini TTS session opened for ${languageName}`);
          },
          onmessage: async (message: LiveServerMessage) => {
            const serverContent = message.serverContent;

            // Handle audio output
            const base64Audio = serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              await this.playAudioChunk(base64Audio);
            }

            // Check if model is done speaking
            if (serverContent?.turnComplete) {
              // Small delay to ensure all audio chunks are played
              setTimeout(() => {
                this.resolveCallback?.();
                this.resolveCallback = null;
              }, 100);
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
            this.resolveCallback = null;
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
            languageCode: languageCode
          },
          systemInstruction: `You are Agnes, a professional translator assistant.
Your ONLY task is to read aloud the text provided to you.
Speak naturally and clearly in ${languageName}.
Do NOT add any commentary, explanation, or additional words.
Simply read the exact text given to you.`
        }
      });

      this.currentLang = lang;
      this.nextStartTime = 0;
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * Play an audio chunk from Gemini
   */
  private async playAudioChunk(base64Audio: string): Promise<void> {
    if (!this.audioContext) return;

    // Resume audio context if suspended (browser autoplay policy)
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

      // Schedule audio to play in sequence (avoid overlapping)
      const currentTime = this.audioContext.currentTime;
      if (this.nextStartTime < currentTime) {
        this.nextStartTime = currentTime;
      }

      source.start(this.nextStartTime);
      this.nextStartTime += audioBuffer.duration;

      // Track audio source for cleanup
      this.audioQueue.push(source);
      source.onended = () => {
        const idx = this.audioQueue.indexOf(source);
        if (idx > -1) this.audioQueue.splice(idx, 1);
      };
    } catch (error) {
      console.error('Error playing audio chunk:', error);
    }
  }

  /**
   * Speak text in the specified language using Gemini's voice
   */
  async speak(text: string, lang: SupportedLanguage = 'en'): Promise<void> {
    if (!text || text.trim().length === 0) {
      console.warn('GeminiTTS: Empty text provided');
      return;
    }

    console.log(`GeminiTTS speaking in ${lang}: "${text.substring(0, 50)}..."`);

    try {
      await this.connectForLanguage(lang);

      if (!this.session) {
        throw new Error('Failed to connect to Gemini');
      }

      return new Promise((resolve, reject) => {
        this.resolveCallback = resolve;

        // Set timeout to prevent hanging
        const timeout = setTimeout(() => {
          console.warn('GeminiTTS: Speech timeout');
          this.resolveCallback = null;
          resolve();
        }, 30000); // 30 second timeout

        // Override resolve to clear timeout
        const originalResolve = resolve;
        this.resolveCallback = () => {
          clearTimeout(timeout);
          originalResolve();
        };

        // Send text to Gemini for speech synthesis
        this.session.send({
          clientContent: {
            turns: [{
              role: 'user',
              parts: [{ text: `Read this aloud: ${text}` }]
            }],
            turnComplete: true
          }
        });
      });
    } catch (error) {
      console.error('GeminiTTS speak error:', error);
      // Don't throw - allow the conversation to continue
    }
  }

  /**
   * Stop all audio playback
   */
  stop(): void {
    console.log('GeminiTTS: Stopping audio');
    this.audioQueue.forEach(source => {
      try {
        source.stop();
      } catch (e) {
        // Ignore errors on stop
      }
    });
    this.audioQueue = [];
    this.nextStartTime = 0;

    if (this.resolveCallback) {
      this.resolveCallback();
      this.resolveCallback = null;
    }
  }

  /**
   * Check if currently speaking
   */
  isSpeaking(): boolean {
    return this.audioQueue.length > 0;
  }

  /**
   * Disconnect the session
   */
  async disconnect(): Promise<void> {
    this.stop();
    if (this.session) {
      console.log('Disconnecting Gemini TTS session');
      // Note: The session will be closed by the callbacks
      this.session = null;
    }
    this.currentLang = 'en';
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    await this.disconnect();
    if (this.audioContext && this.audioContext.state !== 'closed') {
      await this.audioContext.close();
    }
    this.audioContext = null;
    this.aiClient = null;
    this.isInitialized = false;
  }
}

// ============================================
// Singleton Instance & Exports
// ============================================

// Create singleton instance
const geminiTTSInstance = new GeminiTTSService();

/**
 * Initialize Gemini TTS (call once on app start or before first use)
 */
export const initGeminiTTS = async (): Promise<void> => {
  await geminiTTSInstance.init();
};

/**
 * Agnes speaks using Gemini's native voice
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

  try {
    await geminiTTSInstance.speak(text, lang);
    onEnd?.();
  } catch (error) {
    console.error('agnesVoiceSpeak error:', error);
    onError?.(error instanceof Error ? error.message : 'Unknown error');
  }
};

/**
 * Stop Agnes from speaking
 */
export const agnesVoiceStop = (): void => {
  geminiTTSInstance.stop();
};

/**
 * Check if Agnes is currently speaking
 */
export const isAgnesSpeaking = (): boolean => {
  return geminiTTSInstance.isSpeaking();
};

/**
 * Clean up Gemini TTS resources (call on component unmount)
 */
export const cleanupGeminiTTS = async (): Promise<void> => {
  await geminiTTSInstance.cleanup();
};

/**
 * Legacy exports for compatibility
 */
export const speakWithGemini = agnesVoiceSpeak;
export const stopGeminiSpeaking = agnesVoiceStop;
export const isGeminiAvailable = (): boolean => true;

// Export the service instance for advanced use
export { geminiTTSInstance as geminiTTS };
