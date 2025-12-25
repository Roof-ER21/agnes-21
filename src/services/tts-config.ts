/**
 * TTS Configuration for Agnes 21
 * Environment-based provider selection
 */

import TTSManager, { TTSConfig, TTSProvider } from './tts-manager';

// Get TTS provider from environment
const getTTSProvider = (): TTSProvider => {
  const provider = import.meta.env.VITE_TTS_PROVIDER;
  if (provider && ['google', 'elevenlabs', 'webspeech', 'custom'].includes(provider)) {
    return provider as TTSProvider;
  }
  return 'webspeech'; // Default to free browser API
};

// Get API key for cloud providers
const getAPIKey = (): string | undefined => {
  return import.meta.env.VITE_TTS_API_KEY;
};

// Get custom endpoint for self-hosted TTS
const getCustomEndpoint = (): string | undefined => {
  return import.meta.env.VITE_TTS_ENDPOINT;
};

// TTS configuration
const ttsConfig: TTSConfig = {
  provider: getTTSProvider(),
  apiKey: getAPIKey(),
  customEndpoint: getCustomEndpoint(),
  language: 'en-US'
};

// Create singleton TTS manager
export const ttsManager = new TTSManager(ttsConfig);

// Export configuration for debugging
export const debugConfig = () => {
  console.log('TTS Configuration:', {
    provider: ttsConfig.provider,
    hasApiKey: !!ttsConfig.apiKey,
    customEndpoint: ttsConfig.customEndpoint,
    language: ttsConfig.language
  });
};
