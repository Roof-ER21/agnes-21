/**
 * Gemini TTS Utility - Agnes Voice System
 *
 * Uses Gemini's native audio (Kore voice) for English
 * Falls back to Web Speech API for other languages
 *
 * This ensures Agnes sounds the same in roleplay/feedback AND translator modes
 */

import { GoogleGenAI, Modality } from '@google/genai';
import { SupportedLanguage } from '../types';
import { speak as webSpeechSpeak, stopSpeaking as webSpeechStop } from './speechUtils';
import { base64ToUint8Array, decodeAudioData } from './audioUtils';

// ============================================
// Gemini TTS for English (Kore Voice)
// ============================================

let geminiClient: GoogleGenAI | null = null;
let audioContext: AudioContext | null = null;
let isGeminiSpeaking = false;
let currentAudioSource: AudioBufferSourceNode | null = null;

/**
 * Initialize Gemini client
 */
const initGeminiClient = (): GoogleGenAI | null => {
  if (geminiClient) return geminiClient;

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY not configured - using Web Speech API fallback');
    return null;
  }

  geminiClient = new GoogleGenAI({ apiKey });
  return geminiClient;
};

/**
 * Get or create audio context
 */
const getAudioContext = (): AudioContext => {
  if (!audioContext || audioContext.state === 'closed') {
    audioContext = new AudioContext({ sampleRate: 24000 });
  }
  return audioContext;
};

/**
 * Speak text using Gemini's Kore voice (English only)
 * This opens a short-lived session just for TTS
 */
export const speakWithGemini = async (
  text: string,
  onEnd?: () => void,
  onError?: (error: string) => void
): Promise<void> => {
  const client = initGeminiClient();

  if (!client) {
    // Fallback to Web Speech API
    webSpeechSpeak(text, 'en', { onEnd, onError });
    return;
  }

  const ctx = getAudioContext();

  // Ensure audio context is running
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }

  isGeminiSpeaking = true;
  const audioChunks: Uint8Array[] = [];

  return new Promise((resolve) => {
    let sessionPromise: any;
    let hasError = false;

    try {
      sessionPromise = client.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: async () => {
            // Send text to speak
            try {
              const session = await sessionPromise;
              await session.send({
                text: text
              });
              // Signal end of input
              await session.send({ text: '', endOfTurn: true });
            } catch (e) {
              console.error('Error sending text:', e);
              hasError = true;
              isGeminiSpeaking = false;
              onError?.('Failed to send text');
              resolve();
            }
          },
          onmessage: async (message: any) => {
            const serverContent = message.serverContent;

            // Collect audio chunks
            const base64Audio = serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && isGeminiSpeaking) {
              audioChunks.push(base64ToUint8Array(base64Audio));
            }

            // Check if turn is complete
            if (serverContent?.turnComplete) {
              // Play all collected audio
              if (audioChunks.length > 0 && isGeminiSpeaking) {
                await playCollectedAudio(audioChunks, ctx);
              }

              // Close session
              try {
                const session = await sessionPromise;
                session.close();
              } catch (e) {
                console.warn('Error closing session:', e);
              }

              isGeminiSpeaking = false;
              onEnd?.();
              resolve();
            }
          },
          onclose: () => {
            if (!hasError) {
              isGeminiSpeaking = false;
              onEnd?.();
            }
            resolve();
          },
          onerror: (err: any) => {
            console.error('Gemini TTS error:', err);
            hasError = true;
            isGeminiSpeaking = false;

            // Fallback to Web Speech API
            webSpeechSpeak(text, 'en', { onEnd, onError });
            resolve();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          },
          systemInstruction: 'You are Agnes, a professional translator. Speak naturally and warmly. Just read the text provided, do not add anything.',
        }
      });

    } catch (error: any) {
      console.error('Failed to connect to Gemini:', error);
      isGeminiSpeaking = false;

      // Fallback to Web Speech API
      webSpeechSpeak(text, 'en', { onEnd, onError });
      resolve();
    }

    // Timeout fallback
    setTimeout(() => {
      if (isGeminiSpeaking) {
        console.warn('Gemini TTS timeout - falling back');
        isGeminiSpeaking = false;
        webSpeechSpeak(text, 'en', { onEnd, onError });
        resolve();
      }
    }, 15000);
  });
};

/**
 * Play collected audio chunks
 */
const playCollectedAudio = async (
  chunks: Uint8Array[],
  ctx: AudioContext
): Promise<void> => {
  // Combine all chunks
  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.length;
  }

  try {
    const audioBuffer = await decodeAudioData(combined, ctx);

    return new Promise((resolve) => {
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);

      currentAudioSource = source;

      source.onended = () => {
        currentAudioSource = null;
        resolve();
      };

      source.start(0);
    });
  } catch (error) {
    console.error('Error playing audio:', error);
  }
};

/**
 * Stop Gemini TTS
 */
export const stopGeminiSpeaking = (): void => {
  isGeminiSpeaking = false;

  if (currentAudioSource) {
    try {
      currentAudioSource.stop();
    } catch (e) {
      // Ignore if already stopped
    }
    currentAudioSource = null;
  }
};

/**
 * Check if Gemini is available for TTS
 */
export const isGeminiAvailable = (): boolean => {
  return !!import.meta.env.VITE_GEMINI_API_KEY;
};

// ============================================
// Unified Agnes Voice (Auto-routes)
// ============================================

/**
 * Agnes speaks - uses Gemini for English, Web Speech for others
 * This is the main function to use for consistent Agnes voice
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

  // For English: Try Gemini (Kore voice) first
  if (lang === 'en' && isGeminiAvailable()) {
    try {
      await speakWithGemini(text, onEnd, onError);
      return;
    } catch (error) {
      console.warn('Gemini TTS failed, falling back to Web Speech');
      // Fall through to Web Speech
    }
  }

  // For non-English or if Gemini failed: Use Web Speech API
  return new Promise((resolve) => {
    webSpeechSpeak(text, lang, {
      onEnd: () => {
        onEnd?.();
        resolve();
      },
      onError: (error) => {
        onError?.(error);
        resolve();
      },
    });
  });
};

/**
 * Stop Agnes from speaking (works for both Gemini and Web Speech)
 */
export const agnesVoiceStop = (): void => {
  stopGeminiSpeaking();
  webSpeechStop();
};

/**
 * Check if Agnes is currently speaking
 */
export const isAgnesSpeaking = (): boolean => {
  return isGeminiSpeaking;
};
