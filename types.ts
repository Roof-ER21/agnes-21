export enum PitchMode {
  COACH = 'COACH',
  ROLEPLAY = 'ROLEPLAY'
}

export enum DifficultyLevel {
  BEGINNER = 'BEGINNER',
  ROOKIE = 'ROOKIE',
  PRO = 'PRO',
  ELITE = 'ELITE',
  NIGHTMARE = 'NIGHTMARE'
}

export interface SessionConfig {
  mode: PitchMode;
  script?: string;
  difficulty: DifficultyLevel;
  isMiniModule?: boolean;
  miniModuleId?: string;
}

export type AudioVolumeCallback = (volume: number) => void;

// ============================================
// Field Translator Types
// ============================================

// Extended language support - 20+ languages
export type SupportedLanguage =
  | 'en' | 'es' | 'zh' | 'vi' | 'ko' | 'pt' | 'ar'  // Original 7
  | 'fr' | 'ru' | 'tl' | 'hi' | 'ja' | 'de' | 'it'  // Common additions
  | 'pl' | 'ht' | 'pa' | 'uk' | 'fa' | 'th' | 'bn'  // More coverage
  | 'auto';  // Auto-detect option

export interface LanguageConfig {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  voiceCode: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  // Primary languages (most common in US)
  { code: 'en', name: 'English', nativeName: 'English', voiceCode: 'en-US', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', voiceCode: 'es-MX', flag: '🇲🇽' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', voiceCode: 'zh-CN', flag: '🇨🇳' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', voiceCode: 'vi-VN', flag: '🇻🇳' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', voiceCode: 'ko-KR', flag: '🇰🇷' },
  { code: 'tl', name: 'Tagalog', nativeName: 'Tagalog', voiceCode: 'fil-PH', flag: '🇵🇭' },
  { code: 'fr', name: 'French', nativeName: 'Français', voiceCode: 'fr-FR', flag: '🇫🇷' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', voiceCode: 'ar-SA', flag: '🇸🇦' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', voiceCode: 'ru-RU', flag: '🇷🇺' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', voiceCode: 'pt-BR', flag: '🇧🇷' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', voiceCode: 'hi-IN', flag: '🇮🇳' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', voiceCode: 'de-DE', flag: '🇩🇪' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', voiceCode: 'ja-JP', flag: '🇯🇵' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', voiceCode: 'it-IT', flag: '🇮🇹' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', voiceCode: 'pl-PL', flag: '🇵🇱' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', voiceCode: 'uk-UA', flag: '🇺🇦' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', voiceCode: 'fa-IR', flag: '🇮🇷' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', voiceCode: 'th-TH', flag: '🇹🇭' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', voiceCode: 'bn-IN', flag: '🇧🇩' },
  { code: 'ht', name: 'Haitian Creole', nativeName: 'Kreyòl Ayisyen', voiceCode: 'ht-HT', flag: '🇭🇹' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', voiceCode: 'pa-IN', flag: '🇮🇳' },
  // Auto-detect pseudo-language
  { code: 'auto', name: 'Auto-Detect', nativeName: "I don't know", voiceCode: 'en-US', flag: '🔍' },
];

export type PhraseCategory = 'greeting' | 'pitch' | 'insurance' | 'objection' | 'scheduling' | 'closing';

export interface QuickPhrase {
  id: string;
  category: PhraseCategory;
  englishText: string;
  createdBy: string; // 'system' | managerId
  scope: 'global' | 'personal';
  translations: Partial<Record<SupportedLanguage, string>>;
  createdAt: string;
}

export interface TranslationMessage {
  id: string;
  speaker: 'rep' | 'homeowner';
  originalText: string;
  originalLang: SupportedLanguage;
  translatedText: string;
  translatedLang: SupportedLanguage;
  timestamp: string;
}

export interface TranslationSession {
  id: string;
  userId: string;
  startTime: string;
  endTime?: string;
  targetLanguage: SupportedLanguage;
  messages: TranslationMessage[];
}

// ============================================
// Agnes the Linguist Types
// ============================================

/**
 * Agnes session states
 */
export type AgnesState =
  | 'idle'           // Ready to start, showing button
  | 'activating'     // Agnes says intro to rep
  | 'detecting'      // Listening for homeowner to detect language
  | 'introducing'    // Agnes introduces herself to homeowner
  | 'listening'      // Actively listening for speech
  | 'translating'    // Processing translation
  | 'speaking'       // Agnes speaking translation
  | 'ended';         // Session ended

/**
 * Agnes session data
 */
export interface AgnesSession {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  detectedLanguage?: SupportedLanguage;
  autoSpeak: boolean;
}