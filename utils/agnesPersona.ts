/**
 * Agnes the Linguist - Persona & Scripts
 * 5-star professional translator persona for field reps
 *
 * Key traits:
 * - Warm, professional, reassuring
 * - Consistent personality across all languages
 * - Natural conversational flow
 */

import { SupportedLanguage } from '../types';

// ============================================
// Agnes Introduction Scripts
// ============================================

/**
 * Agnes introduction to the REP (always in English)
 */
export const AGNES_REP_INTRO =
  "Hello! I'm Agnes, your translator. I'll help you communicate with the homeowner. Just speak naturally, and I'll handle the translation.";

/**
 * Agnes introduction when auto-detecting language
 */
export const AGNES_AUTO_DETECT_INTRO =
  "I'm listening to determine what language the homeowner speaks. Please have them say something.";

/**
 * Agnes introduction to the HOMEOWNER (in their language)
 * These are professionally written, warm, and reassuring
 */
export const AGNES_HOMEOWNER_INTROS: Record<string, string> = {
  // Original languages
  en: "Hello! I'm Agnes, a translator here to help you and the representative understand each other. Please speak naturally.",

  es: "¡Hola! Soy Agnes, una traductora. Estoy aquí para ayudarles a entenderse. Por favor, hable con normalidad.",

  zh: "您好！我是Agnes，一位翻译。我来帮助您和这位代表互相理解。请正常说话。",

  vi: "Xin chào! Tôi là Agnes, phiên dịch viên. Tôi sẽ giúp bạn và người đại diện hiểu nhau. Xin hãy nói chuyện bình thường.",

  ko: "안녕하세요! 저는 통역사 Agnes입니다. 서로 이해할 수 있도록 도와드리겠습니다. 편하게 말씀하세요.",

  pt: "Olá! Sou Agnes, tradutora. Estou aqui para ajudar vocês a se entenderem. Por favor, fale normalmente.",

  ar: "مرحباً! أنا أغنيس، مترجمة. سأساعدكما على التفاهم. تحدث بشكل طبيعي من فضلك.",

  // New languages
  fr: "Bonjour! Je suis Agnes, interprète. Je suis là pour vous aider à vous comprendre. Parlez naturellement, s'il vous plaît.",

  ru: "Здравствуйте! Я Агнес, переводчик. Я помогу вам понять друг друга. Пожалуйста, говорите естественно.",

  tl: "Kumusta! Ako si Agnes, tagapagsalin. Tutulungan ko kayong magkaintindihan. Magsalita lang po kayo ng natural.",

  hi: "नमस्ते! मैं Agnes हूं, अनुवादक। मैं आपकी बातचीत में मदद करूंगी। कृपया सामान्य रूप से बोलें।",

  ja: "こんにちは！通訳のアグネスです。お二人の会話をお手伝いします。自然にお話しください。",

  de: "Hallo! Ich bin Agnes, Ihre Dolmetscherin. Ich helfe Ihnen, einander zu verstehen. Bitte sprechen Sie ganz normal.",

  it: "Ciao! Sono Agnes, interprete. Sono qui per aiutarvi a capirvi. Per favore, parlate normalmente.",

  pl: "Dzień dobry! Jestem Agnes, tłumaczka. Pomogę wam się zrozumieć. Proszę mówić naturalnie.",

  uk: "Вітаю! Я Агнес, перекладач. Я допоможу вам порозумітися. Будь ласка, говоріть природно.",

  fa: "سلام! من Agnes هستم، مترجم. به شما کمک می‌کنم که همدیگر را بفهمید. لطفاً طبیعی صحبت کنید.",

  th: "สวัสดีค่ะ! ฉันคือ Agnes ล่ามค่ะ ฉันจะช่วยให้คุณทั้งสองเข้าใจกัน กรุณาพูดตามปกติค่ะ",

  bn: "হ্যালো! আমি Agnes, দোভাষী। আমি আপনাদের বুঝতে সাহায্য করব। অনুগ্রহ করে স্বাভাবিকভাবে কথা বলুন।",

  ht: "Bonjou! Mwen se Agnes, entèprèt. Mwen la pou ede nou konprann youn lòt. Tanpri pale nòmalman.",

  pa: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ Agnes ਹਾਂ, ਦੁਭਾਸ਼ੀਆ। ਮੈਂ ਤੁਹਾਡੀ ਗੱਲਬਾਤ ਵਿੱਚ ਮਦਦ ਕਰਾਂਗੀ। ਕਿਰਪਾ ਕਰਕੇ ਆਮ ਤੌਰ 'ਤੇ ਬੋਲੋ।",
};

/**
 * Agnes status messages (shown to rep)
 */
export const AGNES_STATUS_MESSAGES = {
  idle: "Tap to activate Agnes",
  activating: "Agnes is starting...",
  detecting: "Detecting language...",
  introducing: "Introducing to homeowner...",
  listening: "Listening...",
  translating: "Translating...",
  speaking: "Speaking...",
  ended: "Session ended",
};

/**
 * Agnes facilitation phrases (for context during conversation)
 */
export const AGNES_FACILITATION: Record<string, Record<string, string>> = {
  // When Agnes didn't understand
  didNotUnderstand: {
    en: "I'm sorry, could you please repeat that?",
    es: "Lo siento, ¿podría repetir?",
    zh: "对不起，您能再说一遍吗？",
    vi: "Xin lỗi, bạn có thể lặp lại được không?",
    ko: "죄송합니다, 다시 말씀해 주시겠어요?",
    pt: "Desculpe, poderia repetir?",
    ar: "عذراً، هل يمكنك التكرار؟",
    fr: "Pardon, pourriez-vous répéter?",
    ru: "Простите, не могли бы вы повторить?",
    tl: "Pasensya na, puwede mo bang ulitin?",
    hi: "क्षमा करें, क्या आप दोहरा सकते हैं?",
    ja: "すみません、もう一度お願いします。",
    de: "Entschuldigung, könnten Sie das wiederholen?",
    it: "Scusi, può ripetere?",
    pl: "Przepraszam, czy może pan powtórzyć?",
    uk: "Вибачте, чи можете повторити?",
    fa: "ببخشید، می‌توانید تکرار کنید؟",
    th: "ขอโทษค่ะ ช่วยพูดอีกครั้งได้ไหมคะ?",
    bn: "মাফ করবেন, আবার বলবেন?",
    ht: "Eskize m, èske ou ka repete?",
    pa: "ਮੁਆਫ਼ ਕਰੋ, ਕੀ ਤੁਸੀਂ ਦੁਹਰਾ ਸਕਦੇ ਹੋ?",
  },

  // Acknowledgment before translating
  acknowledgment: {
    en: "Got it.",
    es: "Entendido.",
    zh: "明白了。",
    vi: "Đã hiểu.",
    ko: "알겠습니다.",
    pt: "Entendi.",
    ar: "فهمت.",
    fr: "Compris.",
    ru: "Понял.",
    tl: "Naintindihan ko.",
    hi: "समझ गया।",
    ja: "わかりました。",
    de: "Verstanden.",
    it: "Capito.",
    pl: "Rozumiem.",
    uk: "Зрозуміло.",
    fa: "متوجه شدم.",
    th: "เข้าใจค่ะ",
    bn: "বুঝেছি।",
    ht: "Mwen konprann.",
    pa: "ਸਮਝ ਗਿਆ।",
  },

  // Session ending
  goodbye: {
    en: "Thank you. Have a great day!",
    es: "Gracias. ¡Que tenga un buen día!",
    zh: "谢谢。祝您有美好的一天！",
    vi: "Cảm ơn. Chúc bạn một ngày tốt lành!",
    ko: "감사합니다. 좋은 하루 되세요!",
    pt: "Obrigado. Tenha um ótimo dia!",
    ar: "شكراً. أتمنى لك يوماً سعيداً!",
    fr: "Merci. Bonne journée!",
    ru: "Спасибо. Хорошего дня!",
    tl: "Salamat. Magandang araw!",
    hi: "धन्यवाद। आपका दिन शुभ हो!",
    ja: "ありがとうございます。良い一日を！",
    de: "Danke. Einen schönen Tag noch!",
    it: "Grazie. Buona giornata!",
    pl: "Dziękuję. Miłego dnia!",
    uk: "Дякую. Гарного дня!",
    fa: "متشکرم. روز خوبی داشته باشید!",
    th: "ขอบคุณค่ะ วันนี้เป็นวันดีนะคะ!",
    bn: "ধন্যবাদ। শুভ দিন!",
    ht: "Mèsi. Pase yon bon jounen!",
    pa: "ਧੰਨਵਾਦ। ਤੁਹਾਡਾ ਦਿਨ ਸ਼ੁਭ ਹੋਵੇ!",
  },
};

// ============================================
// Natural Speech Helpers
// ============================================

/**
 * Add natural pauses and flow to text
 * Makes Agnes sound more human, less robotic
 */
export const addNaturalFlow = (text: string): string => {
  return text
    // Add micro-pauses after punctuation
    .replace(/\.\s+/g, '. ')
    .replace(/\?\s+/g, '? ')
    .replace(/!\s+/g, '! ')
    .replace(/,\s+/g, ', ')
    // Soften abrupt starts
    .trim();
};

/**
 * Get a brief transition phrase for natural conversation
 * Used between listening and speaking
 */
export const getTransitionPhrase = (toLanguage: SupportedLanguage): string => {
  // Short acknowledgment sounds more natural than silence
  const phrases: Record<string, string> = {
    en: "",  // No transition needed for English
    es: "",
    zh: "",
    vi: "",
    ko: "",
    pt: "",
    ar: "",
    fr: "",
    ru: "",
    tl: "",
    hi: "",
    ja: "",
    de: "",
    it: "",
    pl: "",
    uk: "",
    fa: "",
    th: "",
    bn: "",
    ht: "",
    pa: "",
  };
  return phrases[toLanguage] || "";
};

// ============================================
// Helper Functions
// ============================================

/**
 * Get Agnes introduction for the rep
 */
export const getAgnesRepIntro = (): string => {
  return AGNES_REP_INTRO;
};

/**
 * Get Agnes auto-detect intro for the rep
 */
export const getAgnesAutoDetectIntro = (): string => {
  return AGNES_AUTO_DETECT_INTRO;
};

/**
 * Get Agnes introduction for homeowner in their language
 */
export const getAgnesHomeownerIntro = (lang: SupportedLanguage): string => {
  return AGNES_HOMEOWNER_INTROS[lang] || AGNES_HOMEOWNER_INTROS.en;
};

/**
 * Get Agnes status message
 */
export const getAgnesStatus = (state: string): string => {
  return AGNES_STATUS_MESSAGES[state as keyof typeof AGNES_STATUS_MESSAGES] || "Ready";
};

/**
 * Get facilitation phrase in target language
 */
export const getAgnesFacilitationPhrase = (
  context: keyof typeof AGNES_FACILITATION,
  lang: SupportedLanguage
): string => {
  const phrases = AGNES_FACILITATION[context];
  return phrases?.[lang] || phrases?.en || "";
};

/**
 * Language detected announcement (to rep)
 */
export const getLanguageDetectedMessage = (langName: string): string => {
  return `Detected ${langName}. Introducing myself now.`;
};

// ============================================
// Agnes Voice Configuration
// ============================================

/**
 * Agnes uses consistent female voices across languages
 * Prioritizes warm, professional sounding voices
 */
export const AGNES_VOICE_PREFERENCE: Record<string, string[]> = {
  // English - warm female voices
  en: ['samantha', 'allison', 'ava', 'karen', 'moira', 'tessa'],

  // Spanish - Mexican/Latin American preferred for US context
  es: ['paulina', 'mónica', 'angélica'],

  // Chinese - natural female voices
  zh: ['tingting', 'ting-ting', 'meijia'],

  // Vietnamese
  vi: ['linh'],

  // Korean
  ko: ['yuna', 'sora'],

  // Portuguese - Brazilian for US context
  pt: ['luciana', 'fernanda'],

  // Arabic
  ar: ['laila', 'mariam'],

  // French
  fr: ['amélie', 'amelie', 'audrey', 'thomas'],

  // Russian
  ru: ['milena', 'katya', 'yuri'],

  // Tagalog/Filipino
  tl: ['female'],

  // Hindi
  hi: ['lekha', 'female'],

  // Japanese
  ja: ['kyoko', 'otoya'],

  // German
  de: ['anna', 'petra', 'helena'],

  // Italian
  it: ['alice', 'federica', 'elsa'],

  // Polish
  pl: ['zosia', 'ewa'],

  // Ukrainian
  uk: ['female'],

  // Persian
  fa: ['female'],

  // Thai
  th: ['kanya'],

  // Bengali
  bn: ['female'],

  // Haitian Creole
  ht: ['female'],

  // Punjabi
  pa: ['female'],
};

/**
 * Get Agnes's preferred voice for a language
 */
export const getAgnesVoicePreference = (lang: SupportedLanguage): string[] => {
  return AGNES_VOICE_PREFERENCE[lang] || AGNES_VOICE_PREFERENCE.en;
};

/**
 * Speech rate settings per language for natural rhythm
 * Slightly slower for languages with tones or complex sounds
 */
export const AGNES_SPEECH_RATES: Record<string, number> = {
  en: 0.95,   // Natural English pace
  es: 0.92,   // Spanish - slightly slower for clarity
  zh: 0.85,   // Chinese - slower for tones
  vi: 0.85,   // Vietnamese - slower for tones
  ko: 0.90,   // Korean
  pt: 0.92,   // Portuguese
  ar: 0.85,   // Arabic - slower for clarity
  fr: 0.92,   // French
  ru: 0.90,   // Russian
  tl: 0.92,   // Tagalog
  hi: 0.88,   // Hindi
  ja: 0.88,   // Japanese
  de: 0.92,   // German
  it: 0.92,   // Italian
  pl: 0.90,   // Polish
  uk: 0.90,   // Ukrainian
  fa: 0.85,   // Persian
  th: 0.85,   // Thai - slower for tones
  bn: 0.88,   // Bengali
  ht: 0.90,   // Haitian Creole
  pa: 0.88,   // Punjabi
};

/**
 * Get speech rate for a language
 */
export const getAgnesSpeechRate = (lang: SupportedLanguage): number => {
  return AGNES_SPEECH_RATES[lang] || 0.9;
};
