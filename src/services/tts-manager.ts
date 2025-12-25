/**
 * TTS Manager - Unified Text-to-Speech service with multiple providers
 * Supports Google Cloud TTS, ElevenLabs, Web Speech API, and custom backends
 */

export type TTSProvider = 'google' | 'elevenlabs' | 'webspeech' | 'custom';

export interface TTSConfig {
  provider: TTSProvider;
  apiKey?: string;
  customEndpoint?: string;
  voice?: string;
  language?: string;
}

export interface TTSOptions {
  voice?: string;
  language?: string;
  speed?: number;
  pitch?: number;
  exaggeration?: number;
}

export interface TTSResponse {
  audioUrl: string;
  provider: TTSProvider;
  duration?: number;
  cached?: boolean;
}

class TTSManager {
  private config: TTSConfig;
  private audioCache: Map<string, string> = new Map();

  constructor(config: TTSConfig) {
    this.config = config;
  }

  /**
   * Generate speech from text using configured provider
   */
  async generateSpeech(text: string, options: TTSOptions = {}): Promise<TTSResponse> {
    const cacheKey = this.getCacheKey(text, options);

    // Check cache first
    if (this.audioCache.has(cacheKey)) {
      return {
        audioUrl: this.audioCache.get(cacheKey)!,
        provider: this.config.provider,
        cached: true
      };
    }

    // Generate new audio
    let response: TTSResponse;

    try {
      switch (this.config.provider) {
        case 'google':
          response = await this.generateWithGoogle(text, options);
          break;
        case 'elevenlabs':
          response = await this.generateWithElevenLabs(text, options);
          break;
        case 'webspeech':
          response = await this.generateWithWebSpeech(text, options);
          break;
        case 'custom':
          response = await this.generateWithCustom(text, options);
          break;
        default:
          throw new Error(`Unknown TTS provider: ${this.config.provider}`);
      }

      // Cache the result
      this.audioCache.set(cacheKey, response.audioUrl);

      return response;
    } catch (error) {
      console.error(`TTS generation failed with ${this.config.provider}:`, error);

      // Fallback to Web Speech API
      if (this.config.provider !== 'webspeech') {
        console.log('Falling back to Web Speech API');
        return this.generateWithWebSpeech(text, options);
      }

      throw error;
    }
  }

  /**
   * Generate speech using Google Cloud Text-to-Speech
   */
  private async generateWithGoogle(text: string, options: TTSOptions): Promise<TTSResponse> {
    const startTime = Date.now();

    const response = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': this.config.apiKey || ''
      },
      body: JSON.stringify({
        input: { text },
        voice: {
          languageCode: options.language || this.config.language || 'en-US',
          name: options.voice || 'en-US-Neural2-F', // Female voice
          ssmlGender: 'FEMALE'
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: options.speed || 1.0,
          pitch: options.pitch || 0.0
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Google TTS API error: ${response.statusText}`);
    }

    const data = await response.json();
    const audioUrl = `data:audio/mp3;base64,${data.audioContent}`;

    return {
      audioUrl,
      provider: 'google',
      duration: Date.now() - startTime
    };
  }

  /**
   * Generate speech using ElevenLabs API
   */
  private async generateWithElevenLabs(text: string, options: TTSOptions): Promise<TTSResponse> {
    const startTime = Date.now();
    const voiceId = options.voice || '21m00Tcm4TlvDq8ikWAM'; // Default voice

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': this.config.apiKey || ''
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: options.exaggeration || 0.0,
          use_speaker_boost: true
        }
      })
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.statusText}`);
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);

    return {
      audioUrl,
      provider: 'elevenlabs',
      duration: Date.now() - startTime
    };
  }

  /**
   * Generate speech using browser Web Speech API
   */
  private async generateWithWebSpeech(text: string, options: TTSOptions): Promise<TTSResponse> {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Web Speech API not supported in this browser'));
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = options.language || this.config.language || 'en-US';
      utterance.rate = options.speed || 1.0;
      utterance.pitch = options.pitch || 1.0;

      // Find matching voice
      const voices = speechSynthesis.getVoices();
      const voice = voices.find(v => v.name.includes(options.voice || 'Female')) || voices[0];
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onend = () => {
        resolve({
          audioUrl: '', // Web Speech API doesn't provide URL
          provider: 'webspeech'
        });
      };

      utterance.onerror = (event) => {
        reject(new Error(`Web Speech API error: ${event.error}`));
      };

      speechSynthesis.speak(utterance);
    });
  }

  /**
   * Generate speech using custom backend (Railway TTS service)
   */
  private async generateWithCustom(text: string, options: TTSOptions): Promise<TTSResponse> {
    const startTime = Date.now();
    const endpoint = this.config.customEndpoint || '/api/tts/generate';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        voice: options.voice || 'reeses_piecies',
        exaggeration: options.exaggeration || 0.4
      })
    });

    if (!response.ok) {
      throw new Error(`Custom TTS API error: ${response.statusText}`);
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);

    return {
      audioUrl,
      provider: 'custom',
      duration: Date.now() - startTime
    };
  }

  /**
   * Get available voices for current provider
   */
  async getAvailableVoices(): Promise<Array<{ id: string; name: string; language: string }>> {
    switch (this.config.provider) {
      case 'google':
        return this.getGoogleVoices();
      case 'elevenlabs':
        return this.getElevenLabsVoices();
      case 'webspeech':
        return this.getWebSpeechVoices();
      case 'custom':
        return this.getCustomVoices();
      default:
        return [];
    }
  }

  private async getGoogleVoices() {
    // Predefined Google voices (could fetch from API)
    return [
      { id: 'en-US-Neural2-A', name: 'Neural2 A (Male)', language: 'en-US' },
      { id: 'en-US-Neural2-C', name: 'Neural2 C (Female)', language: 'en-US' },
      { id: 'en-US-Neural2-D', name: 'Neural2 D (Male)', language: 'en-US' },
      { id: 'en-US-Neural2-F', name: 'Neural2 F (Female)', language: 'en-US' }
    ];
  }

  private async getElevenLabsVoices() {
    // Fetch from ElevenLabs API
    try {
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': this.config.apiKey || ''
        }
      });
      const data = await response.json();
      return data.voices.map((v: any) => ({
        id: v.voice_id,
        name: v.name,
        language: v.language || 'en'
      }));
    } catch (error) {
      console.error('Failed to fetch ElevenLabs voices:', error);
      return [];
    }
  }

  private async getWebSpeechVoices() {
    return new Promise<Array<{ id: string; name: string; language: string }>>((resolve) => {
      const voices = speechSynthesis.getVoices();
      if (voices.length > 0) {
        resolve(voices.map(v => ({
          id: v.voiceURI,
          name: v.name,
          language: v.lang
        })));
      } else {
        // Wait for voices to load
        speechSynthesis.onvoiceschanged = () => {
          const voices = speechSynthesis.getVoices();
          resolve(voices.map(v => ({
            id: v.voiceURI,
            name: v.name,
            language: v.lang
          })));
        };
      }
    });
  }

  private async getCustomVoices() {
    try {
      const response = await fetch(`${this.config.customEndpoint || ''}/api/tts/voices`);
      const voices = await response.json();
      return voices.map((v: any) => ({
        id: v.id,
        name: v.name,
        language: 'en-US'
      }));
    } catch (error) {
      console.error('Failed to fetch custom voices:', error);
      return [];
    }
  }

  /**
   * Clear audio cache
   */
  clearCache() {
    this.audioCache.clear();
  }

  /**
   * Generate cache key from text and options
   */
  private getCacheKey(text: string, options: TTSOptions): string {
    return `${this.config.provider}:${text}:${JSON.stringify(options)}`;
  }
}

export default TTSManager;
