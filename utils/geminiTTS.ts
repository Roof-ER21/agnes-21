/**
 * Agnes Voice Utility
 *
 * Provides a unified voice API for Agnes across all modes.
 * Uses Web Speech API with premium voice selection.
 *
 * Note: The PitchTrainer uses Gemini Live's Kore voice because it maintains
 * a full bidirectional session. For Field Translator TTS-only use, we use
 * Web Speech API which still sounds great with our premium voice selection.
 */

import { SupportedLanguage } from '../types';
import { speak as webSpeechSpeak, stopSpeaking as webSpeechStop, isSpeaking } from './speechUtils';

// ============================================
// Unified Agnes Voice
// ============================================

/**
 * Agnes speaks - uses Web Speech API with premium voice selection
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
 * Stop Agnes from speaking
 */
export const agnesVoiceStop = (): void => {
  webSpeechStop();
};

/**
 * Check if Agnes is currently speaking
 */
export const isAgnesSpeaking = (): boolean => {
  return isSpeaking();
};

/**
 * Legacy export for compatibility
 */
export const speakWithGemini = agnesVoiceSpeak;
export const stopGeminiSpeaking = agnesVoiceStop;
export const isGeminiAvailable = (): boolean => true;
