/**
 * Storage utilities for Field Translator
 * Handles persistence of phrases, sessions, and settings
 */

import { QuickPhrase, TranslationSession, TranslationMessage, SupportedLanguage } from '../types';
import { SYSTEM_PHRASES } from './quickPhraseData';

// Storage keys
const CUSTOM_PHRASES_KEY = 'agnes_custom_phrases';
const TRANSLATION_SESSIONS_KEY = 'agnes_translation_sessions';
const TRANSLATOR_SETTINGS_KEY = 'agnes_translator_settings';

// ============================================
// Quick Phrases Storage
// ============================================

/**
 * Get all phrases (system + custom)
 */
export const getAllPhrases = (userId?: string): QuickPhrase[] => {
  const customPhrases = getCustomPhrases(userId);
  return [...SYSTEM_PHRASES, ...customPhrases];
};

/**
 * Get custom phrases from localStorage
 */
export const getCustomPhrases = (userId?: string): QuickPhrase[] => {
  try {
    const stored = localStorage.getItem(CUSTOM_PHRASES_KEY);
    if (!stored) return [];

    const allPhrases: QuickPhrase[] = JSON.parse(stored);

    // Filter by scope and user
    return allPhrases.filter(phrase => {
      if (phrase.scope === 'global') return true;
      if (phrase.scope === 'personal' && phrase.createdBy === userId) return true;
      return false;
    });
  } catch {
    return [];
  }
};

/**
 * Save a custom phrase
 */
export const saveCustomPhrase = (phrase: QuickPhrase): void => {
  try {
    const stored = localStorage.getItem(CUSTOM_PHRASES_KEY);
    const phrases: QuickPhrase[] = stored ? JSON.parse(stored) : [];

    // Check if updating existing
    const existingIndex = phrases.findIndex(p => p.id === phrase.id);
    if (existingIndex >= 0) {
      phrases[existingIndex] = phrase;
    } else {
      phrases.push(phrase);
    }

    localStorage.setItem(CUSTOM_PHRASES_KEY, JSON.stringify(phrases));
  } catch (error) {
    console.error('Error saving phrase:', error);
  }
};

/**
 * Delete a custom phrase
 */
export const deleteCustomPhrase = (phraseId: string): void => {
  try {
    const stored = localStorage.getItem(CUSTOM_PHRASES_KEY);
    if (!stored) return;

    const phrases: QuickPhrase[] = JSON.parse(stored);
    const filtered = phrases.filter(p => p.id !== phraseId);
    localStorage.setItem(CUSTOM_PHRASES_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting phrase:', error);
  }
};

/**
 * Check if a phrase is a system phrase (cannot be deleted)
 */
export const isSystemPhrase = (phraseId: string): boolean => {
  return phraseId.startsWith('sys-');
};

/**
 * Create a new phrase ID
 */
export const generatePhraseId = (): string => {
  return `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// ============================================
// Translation Sessions Storage
// ============================================

/**
 * Get all translation sessions for a user
 */
export const getTranslationSessions = (userId: string): TranslationSession[] => {
  try {
    const stored = localStorage.getItem(`${TRANSLATION_SESSIONS_KEY}_${userId}`);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

/**
 * Save a translation session
 */
export const saveTranslationSession = (session: TranslationSession): void => {
  try {
    const sessions = getTranslationSessions(session.userId);
    const existingIndex = sessions.findIndex(s => s.id === session.id);

    if (existingIndex >= 0) {
      sessions[existingIndex] = session;
    } else {
      sessions.unshift(session); // Add to beginning
    }

    // Keep only last 100 sessions
    const trimmed = sessions.slice(0, 100);
    localStorage.setItem(
      `${TRANSLATION_SESSIONS_KEY}_${session.userId}`,
      JSON.stringify(trimmed)
    );
  } catch (error) {
    console.error('Error saving session:', error);
  }
};

/**
 * Delete a translation session
 */
export const deleteTranslationSession = (sessionId: string, userId: string): void => {
  try {
    const sessions = getTranslationSessions(userId);
    const filtered = sessions.filter(s => s.id !== sessionId);
    localStorage.setItem(
      `${TRANSLATION_SESSIONS_KEY}_${userId}`,
      JSON.stringify(filtered)
    );
  } catch (error) {
    console.error('Error deleting session:', error);
  }
};

/**
 * Generate a new session ID
 */
export const generateSessionId = (): string => {
  return `ts-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Generate a new message ID
 */
export const generateMessageId = (): string => {
  return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Create a new translation message
 */
export const createTranslationMessage = (
  speaker: 'rep' | 'homeowner',
  originalText: string,
  originalLang: SupportedLanguage,
  translatedText: string,
  translatedLang: SupportedLanguage
): TranslationMessage => ({
  id: generateMessageId(),
  speaker,
  originalText,
  originalLang,
  translatedText,
  translatedLang,
  timestamp: new Date().toISOString(),
});

/**
 * Create a new translation session
 */
export const createTranslationSession = (
  userId: string,
  targetLanguage: SupportedLanguage
): TranslationSession => ({
  id: generateSessionId(),
  userId,
  startTime: new Date().toISOString(),
  targetLanguage,
  messages: [],
});

// ============================================
// Translator Settings
// ============================================

interface TranslatorSettings {
  defaultTargetLanguage: SupportedLanguage;
  autoSpeak: boolean;
  speechRate: number;
  autoDetect: boolean;
}

const DEFAULT_SETTINGS: TranslatorSettings = {
  defaultTargetLanguage: 'es',
  autoSpeak: true,
  speechRate: 0.9,
  autoDetect: true,
};

/**
 * Get translator settings
 */
export const getTranslatorSettings = (userId: string): TranslatorSettings => {
  try {
    const stored = localStorage.getItem(`${TRANSLATOR_SETTINGS_KEY}_${userId}`);
    if (!stored) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

/**
 * Save translator settings
 */
export const saveTranslatorSettings = (
  userId: string,
  settings: Partial<TranslatorSettings>
): void => {
  try {
    const current = getTranslatorSettings(userId);
    const updated = { ...current, ...settings };
    localStorage.setItem(
      `${TRANSLATOR_SETTINGS_KEY}_${userId}`,
      JSON.stringify(updated)
    );
  } catch (error) {
    console.error('Error saving settings:', error);
  }
};

// ============================================
// Export/Import
// ============================================

/**
 * Export all translation data for a user
 */
export const exportTranslationData = (userId: string): string => {
  const data = {
    sessions: getTranslationSessions(userId),
    customPhrases: getCustomPhrases(userId),
    settings: getTranslatorSettings(userId),
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(data, null, 2);
};

/**
 * Get session statistics
 */
export const getSessionStats = (userId: string) => {
  const sessions = getTranslationSessions(userId);

  const languageCounts: Record<string, number> = {};
  let totalMessages = 0;

  for (const session of sessions) {
    languageCounts[session.targetLanguage] = (languageCounts[session.targetLanguage] || 0) + 1;
    totalMessages += session.messages.length;
  }

  return {
    totalSessions: sessions.length,
    totalMessages,
    languageBreakdown: languageCounts,
    mostUsedLanguage: Object.entries(languageCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || null,
  };
};
