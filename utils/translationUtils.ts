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
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
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
    const response = await fetch(
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
      }
    );

    if (!response.ok) {
      throw new Error(`Translation failed: ${response.statusText}`);
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
 */
export const detectLanguageWithDialect = async (text: string): Promise<DetectionResult | null> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
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
    const response = await fetch(
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
      }
    );

    if (!response.ok) {
      throw new Error(`Language detection failed: ${response.statusText}`);
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
// Translation Caching
// ============================================

interface CacheEntry {
  translation: string;
  timestamp: number;
}

const CACHE_KEY = 'agnes_translation_cache';
const CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Get cached translation if available
 */
export const getCachedTranslation = (
  text: string,
  targetLang: SupportedLanguage
): string | null => {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    const key = `${text}:${targetLang}`;
    const entry: CacheEntry | undefined = cache[key];

    if (entry && Date.now() - entry.timestamp < CACHE_MAX_AGE) {
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
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    const key = `${text}:${targetLang}`;
    cache[key] = {
      translation,
      timestamp: Date.now(),
    };

    // Clean old entries
    const now = Date.now();
    for (const k of Object.keys(cache)) {
      if (now - cache[k].timestamp > CACHE_MAX_AGE) {
        delete cache[k];
      }
    }

    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Cache error:', error);
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
  // Check cache first
  const cached = getCachedTranslation(text, targetLang);
  if (cached) {
    return cached;
  }

  // Translate and cache
  const translation = await translateText(text, targetLang, sourceLang);
  cacheTranslation(text, targetLang, translation);
  return translation;
};

// ============================================
// Batch Translation
// ============================================

/**
 * Translate multiple texts at once
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

  // Find texts that need translation
  const needsTranslation = texts.filter((_, i) => results[i] === null);

  if (needsTranslation.length === 0) {
    return results as string[];
  }

  // Translate uncached texts
  const translations = await Promise.all(
    needsTranslation.map(text => translateText(text, targetLang, sourceLang))
  );

  // Cache and merge results
  let translationIndex = 0;
  return texts.map((text, i) => {
    if (results[i] !== null) {
      return results[i]!;
    }
    const translation = translations[translationIndex++];
    cacheTranslation(text, targetLang, translation);
    return translation;
  });
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
