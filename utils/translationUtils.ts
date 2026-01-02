/**
 * Translation Utilities for Field Translator
 * Uses Google Gemini for translation and language detection with dialect support
 */

import {
  SupportedLanguage,
  SupportedDialect,
  SUPPORTED_LANGUAGES,
  DIALECT_VARIANTS,
  DetectionResult,
  getDialectConfig
} from '../types';

// ============================================
// API Timeout Configuration
// ============================================

const API_TIMEOUT_MS = 15000; // 15 second timeout for API calls

/**
 * Fetch with timeout using AbortController
 */
const fetchWithTimeout = async (
  url: string,
  options: RequestInit,
  timeoutMs: number = API_TIMEOUT_MS
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

// ============================================
// Translation with Gemini
// ============================================

/**
 * Translate text from one language to another using Gemini
 */
export const translateText = async (
  text: string,
  targetLang: SupportedLanguage,
  sourceLang?: SupportedLanguage
): Promise<string> => {
  // Validate input text
  const trimmedText = text?.trim();
  if (!trimmedText) {
    console.warn('translateText called with empty text');
    return '';
  }

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const targetConfig = SUPPORTED_LANGUAGES.find(l => l.code === targetLang);
  const sourceConfig = sourceLang ? SUPPORTED_LANGUAGES.find(l => l.code === sourceLang) : null;

  const prompt = sourceLang
    ? `Translate the following ${sourceConfig?.name || 'text'} to ${targetConfig?.name}.
Keep it natural and conversational, suitable for a friendly business conversation at someone's door.
Only return the translation, nothing else.

Text to translate:
${text}`
    : `Translate the following text to ${targetConfig?.name}.
Keep it natural and conversational, suitable for a friendly business conversation at someone's door.
Only return the translation, nothing else.

Text to translate:
${text}`;

  try {
    const response = await fetchWithTimeout(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1000,
          },
        }),
      },
      API_TIMEOUT_MS
    );

    if (!response.ok) {
      const status = response.status;
      // Provide specific error messages for common API errors
      if (status === 429) {
        throw new Error('Rate limit exceeded - too many translation requests. Please wait a moment.');
      } else if (status === 401) {
        throw new Error('Invalid API key - translation service unavailable');
      } else if (status === 403) {
        throw new Error('API access forbidden - check quota or permissions');
      } else if (status === 500 || status === 503) {
        throw new Error('Translation service temporarily unavailable. Please try again.');
      }
      throw new Error(`Translation failed (${status}): ${response.statusText}`);
    }

    const data = await response.json();
    const translatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!translatedText) {
      throw new Error('No translation returned');
    }

    return translatedText.trim();
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
};

// ============================================
// Language Detection
// ============================================

/**
 * Detect the language of given text using Gemini (basic version)
 */
export const detectLanguage = async (text: string): Promise<SupportedLanguage | null> => {
  const result = await detectLanguageWithDialect(text);
  return result?.language || null;
};

/**
 * Enhanced language detection with dialect recognition
 * Detects Spanish and Arabic dialects with regional variants
 * Uses caching for high-confidence results
 */
export const detectLanguageWithDialect = async (text: string): Promise<DetectionResult | null> => {
  // Validate input text
  const trimmedText = text?.trim();
  if (!trimmedText) {
    console.warn('detectLanguageWithDialect called with empty text');
    return null;
  }

  // Check cache first
  const cached = getCachedDetection(trimmedText);
  if (cached) {
    return cached;
  }

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const supportedCodes = SUPPORTED_LANGUAGES.map(l => l.code).filter(c => c !== 'auto').join(', ');

  const prompt = `Analyze the following text and detect its language with regional dialect if applicable.

For Spanish, identify if it's:
- Mexican Spanish (es-mx): Uses "güey", "chido", "padre", Mexican slang
- Puerto Rican Spanish (es-pr): Uses "boricua", "chavos", Caribbean pronunciation
- Castilian Spanish (es-es): Uses "vale", "tío", "vosotros" conjugations
- Argentine Spanish (es-ar): Uses "che", "vos" instead of "tú", "boludo"
- Colombian Spanish (es-co): Uses "parcero", "bacano", clear pronunciation

For Arabic, identify if it's:
- Egyptian Arabic (ar-eg): Uses "ازيك", "كده", Egyptian expressions
- Lebanese Arabic (ar-lb): Uses French loanwords, "كيفك", Levantine style
- Saudi Arabic (ar-sa): Uses "وش", Gulf vocabulary, formal style
- Moroccan Arabic (ar-ma): Uses French/Berber influence, "لاباس"
- Gulf Arabic (ar-ae): Uses "شلونك", Gulf expressions

Reply with ONLY a JSON object in this exact format:
{"language": "xx", "dialect": "xx-xx", "confidence": 85, "region": "Country Name"}

For non-Spanish/Arabic languages, omit the dialect field:
{"language": "xx", "confidence": 90}

Supported language codes: ${supportedCodes}
If unsure or language is not supported, reply: {"language": "unknown", "confidence": 0}

Text to analyze:
${text}`;

  try {
    const response = await fetchWithTimeout(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0,
            maxOutputTokens: 100,
          },
        }),
      },
      API_TIMEOUT_MS
    );

    if (!response.ok) {
      const status = response.status;
      // Provide specific error messages for common API errors
      if (status === 429) {
        console.warn('Rate limit exceeded for language detection');
        return null; // Return null instead of throwing to allow fallback
      } else if (status === 401 || status === 403) {
        throw new Error('API access issue - language detection unavailable');
      } else if (status === 500 || status === 503) {
        console.warn('Language detection service temporarily unavailable');
        return null; // Return null instead of throwing to allow fallback
      }
      throw new Error(`Language detection failed (${status}): ${response.statusText}`);
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!responseText) {
      console.error('Empty response from Gemini');
      return null;
    }

    // Parse JSON response
    try {
      // Extract JSON from response (handle potential markdown wrapping)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No JSON found in response:', responseText);
        return null;
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate language code
      const validLang = SUPPORTED_LANGUAGES.find(l => l.code === parsed.language);
      if (!validLang || parsed.language === 'unknown') {
        console.log('Unknown or unsupported language detected:', parsed.language);
        return null;
      }

      // Validate dialect if provided
      let validDialect: SupportedDialect | undefined;
      if (parsed.dialect) {
        const dialectConfig = getDialectConfig(parsed.dialect as SupportedDialect);
        if (dialectConfig && dialectConfig.parentLang === parsed.language) {
          validDialect = parsed.dialect as SupportedDialect;
        }
      }

      const result: DetectionResult = {
        language: validLang.code,
        dialect: validDialect,
        confidence: Math.min(100, Math.max(0, parsed.confidence || 80)),
        region: parsed.region
      };

      console.log(`🔍 Detected: ${result.dialect || result.language} (${result.confidence}% confidence)${result.region ? ` - ${result.region}` : ''}`);

      // Cache high-confidence results
      cacheDetection(text, result);

      return result;
    } catch (parseError) {
      console.error('Failed to parse detection response:', responseText);
      return null;
    }
  } catch (error) {
    console.error('Language detection error:', error);
    return null;
  }
};

/**
 * Get display name for a detected language/dialect
 */
export const getDetectionDisplayName = (result: DetectionResult): string => {
  if (result.dialect) {
    const dialectConfig = getDialectConfig(result.dialect);
    if (dialectConfig) {
      return `${dialectConfig.name} ${dialectConfig.flag}`;
    }
  }
  const langConfig = SUPPORTED_LANGUAGES.find(l => l.code === result.language);
  return langConfig ? `${langConfig.name} ${langConfig.flag}` : result.language;
};

/**
 * Get voice code for a detection result (prefers dialect-specific code)
 */
export const getVoiceCodeForDetection = (result: DetectionResult): string => {
  if (result.dialect) {
    const dialectConfig = getDialectConfig(result.dialect);
    if (dialectConfig) {
      return dialectConfig.voiceCode;
    }
  }
  const langConfig = SUPPORTED_LANGUAGES.find(l => l.code === result.language);
  return langConfig?.voiceCode || 'en-US';
};

// ============================================
// Translation Caching (LRU with size limits)
// ============================================

interface CacheEntry {
  translation: string;
  timestamp: number;
  lastAccessed: number;
}

const CACHE_KEY = 'agnes_translation_cache';
const CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days
const CACHE_MAX_ENTRIES = 500; // LRU limit

// In-memory cache for faster access (avoids JSON.parse on every lookup)
let memoryCache: Map<string, CacheEntry> | null = null;

/**
 * Load cache from localStorage into memory (lazy loading)
 */
const loadCache = (): Map<string, CacheEntry> => {
  if (memoryCache) return memoryCache;

  try {
    const stored = localStorage.getItem(CACHE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      memoryCache = new Map(Object.entries(parsed));
    } else {
      memoryCache = new Map();
    }
  } catch {
    memoryCache = new Map();
  }
  return memoryCache;
};

/**
 * Save cache to localStorage (debounced)
 */
let saveTimeout: NodeJS.Timeout | null = null;
const saveCache = (): void => {
  if (saveTimeout) clearTimeout(saveTimeout);

  saveTimeout = setTimeout(() => {
    try {
      if (!memoryCache) return;
      const obj: Record<string, CacheEntry> = {};
      memoryCache.forEach((v, k) => { obj[k] = v; });
      localStorage.setItem(CACHE_KEY, JSON.stringify(obj));
    } catch (error) {
      console.error('Cache save error:', error);
    }
  }, 1000); // Debounce saves by 1 second
};

/**
 * Evict oldest entries if cache exceeds max size (LRU)
 */
const evictOldEntries = (cache: Map<string, CacheEntry>): void => {
  const now = Date.now();

  // First, remove expired entries
  for (const [key, entry] of cache) {
    if (now - entry.timestamp > CACHE_MAX_AGE) {
      cache.delete(key);
    }
  }

  // If still over limit, remove least recently accessed
  if (cache.size > CACHE_MAX_ENTRIES) {
    const entries = Array.from(cache.entries())
      .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

    const toRemove = cache.size - CACHE_MAX_ENTRIES;
    for (let i = 0; i < toRemove; i++) {
      cache.delete(entries[i][0]);
    }
  }
};

/**
 * Get cached translation if available
 */
export const getCachedTranslation = (
  text: string,
  targetLang: SupportedLanguage
): string | null => {
  try {
    const cache = loadCache();
    const key = `${text}:${targetLang}`;
    const entry = cache.get(key);

    if (entry && Date.now() - entry.timestamp < CACHE_MAX_AGE) {
      // Update last accessed time (LRU)
      entry.lastAccessed = Date.now();
      return entry.translation;
    }

    return null;
  } catch {
    return null;
  }
};

/**
 * Cache a translation
 */
export const cacheTranslation = (
  text: string,
  targetLang: SupportedLanguage,
  translation: string
): void => {
  try {
    const cache = loadCache();
    const key = `${text}:${targetLang}`;
    const now = Date.now();

    cache.set(key, {
      translation,
      timestamp: now,
      lastAccessed: now,
    });

    // LRU eviction
    evictOldEntries(cache);

    // Debounced save to localStorage
    saveCache();
  } catch (error) {
    console.error('Cache error:', error);
  }
};

// ============================================
// Language Detection Caching (Session-based)
// ============================================

// In-memory cache for detected languages (per session, high confidence)
const detectionCache = new Map<string, { result: DetectionResult; timestamp: number }>();
const DETECTION_CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const DETECTION_CONFIDENCE_THRESHOLD = 85; // Only cache high-confidence detections

/**
 * Get cached detection result
 */
export const getCachedDetection = (text: string): DetectionResult | null => {
  const key = text.trim().toLowerCase().substring(0, 100); // Normalize key
  const cached = detectionCache.get(key);

  if (cached && Date.now() - cached.timestamp < DETECTION_CACHE_TTL) {
    console.log(`🔍 Using cached detection: ${cached.result.dialect || cached.result.language}`);
    return cached.result;
  }

  return null;
};

/**
 * Cache a detection result (only if high confidence)
 */
export const cacheDetection = (text: string, result: DetectionResult): void => {
  if (result.confidence >= DETECTION_CONFIDENCE_THRESHOLD) {
    const key = text.trim().toLowerCase().substring(0, 100);
    detectionCache.set(key, { result, timestamp: Date.now() });

    // Limit cache size
    if (detectionCache.size > 100) {
      const oldest = Array.from(detectionCache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
      if (oldest) detectionCache.delete(oldest[0]);
    }
  }
};

/**
 * Translate with caching
 */
export const translateWithCache = async (
  text: string,
  targetLang: SupportedLanguage,
  sourceLang?: SupportedLanguage
): Promise<string> => {
  // Validate input text early
  const trimmedText = text?.trim();
  if (!trimmedText) {
    console.warn('translateWithCache called with empty text');
    return '';
  }

  // Check cache first
  const cached = getCachedTranslation(trimmedText, targetLang);
  if (cached) {
    return cached;
  }

  // Translate and cache
  const translation = await translateText(trimmedText, targetLang, sourceLang);
  if (translation) {
    cacheTranslation(trimmedText, targetLang, translation);
  }
  return translation;
};

// ============================================
// Batch Translation (with concurrency limit)
// ============================================

const BATCH_CONCURRENCY_LIMIT = 3; // Max parallel API calls

/**
 * Run promises with concurrency limit (proper semaphore pattern)
 */
const limitConcurrency = async <T>(
  tasks: (() => Promise<T>)[],
  limit: number
): Promise<T[]> => {
  const results: T[] = new Array(tasks.length);
  let currentIndex = 0;
  let completedCount = 0;

  return new Promise((resolve, reject) => {
    // Track active workers
    let activeWorkers = 0;

    const startNext = () => {
      // If all tasks are started, just wait for completion
      if (currentIndex >= tasks.length) {
        if (completedCount >= tasks.length) {
          resolve(results);
        }
        return;
      }

      // Start new tasks up to the limit
      while (activeWorkers < limit && currentIndex < tasks.length) {
        const taskIndex = currentIndex++;
        activeWorkers++;

        tasks[taskIndex]()
          .then(result => {
            results[taskIndex] = result;
          })
          .catch(error => {
            // Store error but continue with other tasks
            console.error(`Task ${taskIndex} failed:`, error);
            results[taskIndex] = undefined as T; // Mark as failed
          })
          .finally(() => {
            activeWorkers--;
            completedCount++;
            startNext();
          });
      }
    };

    // Kick off initial batch
    if (tasks.length === 0) {
      resolve([]);
    } else {
      startNext();
    }
  });
};

/**
 * Translate multiple texts at once (with concurrency limit)
 */
export const translateBatch = async (
  texts: string[],
  targetLang: SupportedLanguage,
  sourceLang?: SupportedLanguage
): Promise<string[]> => {
  // Check cache for each text
  const results: (string | null)[] = texts.map(text =>
    getCachedTranslation(text, targetLang)
  );

  // Find texts that need translation with their original indices
  const uncachedIndices: number[] = [];
  const uncachedTexts: string[] = [];

  texts.forEach((text, i) => {
    if (results[i] === null) {
      uncachedIndices.push(i);
      uncachedTexts.push(text);
    }
  });

  if (uncachedTexts.length === 0) {
    return results as string[];
  }

  console.log(`📝 Translating ${uncachedTexts.length} texts (${BATCH_CONCURRENCY_LIMIT} parallel max)`);

  // Create translation tasks
  const tasks = uncachedTexts.map(text => () => translateText(text, targetLang, sourceLang));

  // Execute with concurrency limit
  const translations = await limitConcurrency(tasks, BATCH_CONCURRENCY_LIMIT);

  // Cache and merge results
  uncachedIndices.forEach((originalIndex, i) => {
    const translation = translations[i];
    results[originalIndex] = translation;
    cacheTranslation(texts[originalIndex], targetLang, translation);
  });

  return results as string[];
};

// ============================================
// Language Name Helpers
// ============================================

/**
 * Get language display name
 */
export const getLanguageName = (code: SupportedLanguage): string => {
  const lang = SUPPORTED_LANGUAGES.find(l => l.code === code);
  return lang?.name || code;
};

/**
 * Get language native name
 */
export const getLanguageNativeName = (code: SupportedLanguage): string => {
  const lang = SUPPORTED_LANGUAGES.find(l => l.code === code);
  return lang?.nativeName || code;
};

/**
 * Get language flag emoji
 */
export const getLanguageFlag = (code: SupportedLanguage): string => {
  const lang = SUPPORTED_LANGUAGES.find(l => l.code === code);
  return lang?.flag || '';
};
