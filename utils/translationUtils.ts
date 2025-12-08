/**
 * Translation Utilities for Field Translator
 * Uses Google Gemini for translation and language detection
 */

import { GoogleGenAI } from '@anthropic-ai/sdk';
import { SupportedLanguage, SUPPORTED_LANGUAGES } from '../types';

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
 * Detect the language of given text using Gemini
 */
export const detectLanguage = async (text: string): Promise<SupportedLanguage | null> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const supportedCodes = SUPPORTED_LANGUAGES.map(l => l.code).join(', ');

  const prompt = `Detect the language of the following text.
Reply with ONLY the two-letter language code from this list: ${supportedCodes}
If the language is not in the list or you cannot determine it, reply with "unknown".

Text:
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
            maxOutputTokens: 10,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Language detection failed: ${response.statusText}`);
    }

    const data = await response.json();
    const detectedCode = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toLowerCase();

    // Validate the detected code
    const validLang = SUPPORTED_LANGUAGES.find(l => l.code === detectedCode);
    return validLang ? validLang.code : null;
  } catch (error) {
    console.error('Language detection error:', error);
    return null;
  }
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
