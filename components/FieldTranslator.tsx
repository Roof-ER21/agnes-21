/**
 * Agnes the Linguist - Field Translator
 * Complete redesign with one-button activation and conversation facilitation
 *
 * Features:
 * - Auto-detect language option (using Gemini)
 * - 21 supported languages
 * - Natural conversation flow
 * - Consistent Agnes persona
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  SupportedLanguage,
  SupportedDialect,
  SUPPORTED_LANGUAGES,
  AgnesState,
  DetectionResult,
  getDialectConfig,
} from '../types';
import {
  translateWithCache,
  detectLanguageWithDialect,
  getLanguageName,
  getLanguageFlag,
  getDetectionDisplayName,
  getVoiceCodeForDetection,
} from '../utils/translationUtils';
import {
  startListening,
  stopListening,
  isSpeechRecognitionSupported,
  waitForVoices,
} from '../utils/speechUtils';
import {
  agnesVoiceSpeak,
  agnesVoiceStop,
  initGeminiTTS,
  cleanupGeminiTTS,
} from '../utils/geminiTTS';
import {
  getAgnesRepIntro,
  getAgnesAutoDetectIntro,
  getAgnesHomeownerIntro,
  getLanguageDetectedMessage,
} from '../utils/agnesPersona';
import {
  saveTranslationSession,
  getTranslationSessions,
  generateSessionId,
  generateMessageId,
} from '../utils/translationStorage';
import { SYSTEM_PHRASES } from '../utils/quickPhraseData';
import AudioWaveform, { StatusIndicator, AgnesMessage } from './AudioWaveform';
import ConversationTranscript, { TranscriptEntry, TypingIndicator } from './ConversationTranscript';
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  History,
  X,
  BookOpen,
  Globe,
  Search,
  Mic,
} from 'lucide-react';

interface FieldTranslatorProps {
  onBack: () => void;
}

const FieldTranslator: React.FC<FieldTranslatorProps> = ({ onBack }) => {
  const { user } = useAuth();

  // ============================================
  // State
  // ============================================

  // Agnes state machine
  const [agnesState, setAgnesState] = useState<AgnesState>('idle');

  // Session data
  const [sessionId, setSessionId] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage | null>(null);
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);

  // Transcript
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [interimText, setInterimText] = useState<string>('');

  // Agnes message (what she's saying)
  const [agnesMessage, setAgnesMessage] = useState<string>('');

  // Settings
  const [autoSpeak, setAutoSpeak] = useState<boolean>(true);

  // UI state
  const [showQuickPhrases, setShowQuickPhrases] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [showLanguageSelect, setShowLanguageSelect] = useState<boolean>(false);
  const [isAutoDetecting, setIsAutoDetecting] = useState<boolean>(false);
  const [pastSessions, setPastSessions] = useState<any[]>([]);

  // Track whose turn it is
  const [currentSpeaker, setCurrentSpeaker] = useState<'rep' | 'homeowner'>('homeowner');

  // Refs for async operations
  const sessionActiveRef = useRef<boolean>(false);
  const selectedLangRef = useRef<SupportedLanguage | null>(null);
  const currentSpeakerRef = useRef<'rep' | 'homeowner'>('homeowner');

  // ============================================
  // Speech Recognition Check
  // ============================================

  const speechSupported = isSpeechRecognitionSupported();

  // Track if voices are loaded
  const [voicesReady, setVoicesReady] = useState<boolean>(false);

  // Initialize Gemini TTS and load voices on mount
  useEffect(() => {
    const initialize = async () => {
      // Initialize Gemini TTS for high-quality native voice
      await initGeminiTTS();
      console.log('Gemini TTS initialized for Field Translator');

      // Also load Web Speech voices as fallback
      const voices = await waitForVoices();
      console.log(`Loaded ${voices.length} TTS voices`);
      setVoicesReady(true);
    };
    initialize();
  }, []);

  // ============================================
  // Natural Pause Helper
  // ============================================

  const naturalPause = (ms: number = 300): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  };

  // ============================================
  // Agnes Speech Function
  // ============================================

  const agnesSpeak = useCallback(async (text: string, lang: SupportedLanguage = 'en'): Promise<void> => {
    if (!text || text.trim().length === 0) {
      console.warn('agnesSpeak called with empty text');
      return;
    }

    setAgnesMessage(text);
    console.log(`🔊 Agnes speaking in ${lang} (Gemini Kore): "${text.substring(0, 80)}..."`);

    try {
      // Use Gemini Live TTS for high-quality natural voice
      await agnesVoiceSpeak(text, lang, {
        onEnd: () => {
          console.log('✅ Agnes finished speaking (Gemini)');
        },
        onError: (error) => {
          console.error('❌ Gemini TTS error:', error);
        },
      });
    } catch (error) {
      console.error('❌ Agnes speak error:', error);
    } finally {
      setAgnesMessage('');
    }
  }, []);

  // ============================================
  // Listen for specific speaker
  // ============================================

  const listenForSpeaker = useCallback((speaker: 'rep' | 'homeowner', lang?: SupportedLanguage): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Determine language: rep always English, homeowner uses selected or provided language
      const listenLang: SupportedLanguage = speaker === 'rep'
        ? 'en'
        : (lang || selectedLangRef.current || 'es');

      console.log(`Listening for ${speaker} in ${listenLang}`);

      // Set timeout for silence
      const timeout = setTimeout(() => {
        stopListening();
        setInterimText('');
        reject(new Error('Listening timeout'));
      }, 20000); // 20 second timeout

      startListening(
        listenLang,
        (result) => {
          setInterimText(result.transcript);

          if (result.isFinal && result.transcript.trim()) {
            clearTimeout(timeout);
            stopListening();
            setInterimText('');
            console.log(`${speaker} said: "${result.transcript}"`);
            resolve(result.transcript.trim());
          }
        },
        (error) => {
          clearTimeout(timeout);
          setInterimText('');
          console.error('Listen error:', error);
          reject(error);
        },
        {
          continuous: false,
          interimResults: true,
        }
      );
    });
  }, []);

  // ============================================
  // Auto-detect Language Flow
  // ============================================

  const handleAutoDetect = useCallback(async () => {
    setShowLanguageSelect(false);
    setIsAutoDetecting(true);

    try {
      // Agnes tells rep she's listening
      setAgnesState('detecting');
      await agnesSpeak(getAgnesAutoDetectIntro(), 'en');

      if (!sessionActiveRef.current) return;

      // Listen for homeowner (use English recognition but capture raw audio)
      // Then use Gemini to detect the actual language
      const spokenText = await listenForSpeaker('homeowner', 'en');

      if (!sessionActiveRef.current || !spokenText) {
        setIsAutoDetecting(false);
        setShowLanguageSelect(true);
        return;
      }

      // Use Gemini to detect language with dialect recognition
      const detection = await detectLanguageWithDialect(spokenText);

      if (!detection) {
        // Truly couldn't detect - ask to select manually
        await agnesSpeak("I couldn't determine the language. Please select it manually.", 'en');
        setIsAutoDetecting(false);
        setShowLanguageSelect(true);
        return;
      }

      if (detection.language === 'en') {
        // Detected English - the homeowner speaks English, no translation needed
        await agnesSpeak("The homeowner appears to speak English. If they speak another language, please select it now.", 'en');
        setIsAutoDetecting(false);
        setShowLanguageSelect(true);
        return;
      }

      // Successfully detected! Show dialect-specific name if available
      const displayName = getDetectionDisplayName(detection);
      const confidenceNote = detection.confidence >= 90
        ? ''
        : detection.confidence >= 70
          ? ' I think.'
          : ' Let me know if that\'s not right.';
      await agnesSpeak(`I detected ${displayName.replace(/[^\w\s]/g, '')}.${confidenceNote}`, 'en');

      // Set the detected language and dialect info
      setSelectedLanguage(detection.language);
      selectedLangRef.current = detection.language;
      setDetectionResult(detection);
      setIsAutoDetecting(false);

      // Add the homeowner's first message to transcript
      const translation = await translateWithCache(spokenText, 'en', detection.language);
      addToTranscript('homeowner', spokenText, detection.language, translation, 'en');

      // Now introduce Agnes to homeowner in their language
      await naturalPause(500);
      setAgnesState('introducing');
      const intro = getAgnesHomeownerIntro(detection.language);
      await agnesSpeak(intro, detection.language);

      if (!sessionActiveRef.current) return;

      // Start conversation - homeowner responds next
      currentSpeakerRef.current = 'homeowner';
      setCurrentSpeaker('homeowner');

      // Start conversation loop
      handleSingleTurn();

    } catch (error) {
      console.error('Auto-detect error:', error);
      setIsAutoDetecting(false);
      setShowLanguageSelect(true);
    }
  }, [agnesSpeak, listenForSpeaker]);

  // ============================================
  // Add to Transcript
  // ============================================

  const addToTranscript = useCallback((
    speaker: 'rep' | 'homeowner' | 'agnes',
    originalText: string,
    originalLang: SupportedLanguage,
    translatedText?: string,
    translatedLang?: SupportedLanguage
  ) => {
    const entry: TranscriptEntry = {
      id: generateMessageId(),
      speaker,
      originalText,
      originalLang,
      translatedText,
      translatedLang,
      timestamp: new Date(),
    };
    setTranscript(prev => [...prev, entry]);
  }, []);

  // ============================================
  // Single Turn Handler
  // ============================================

  const handleSingleTurn = useCallback(async () => {
    if (!sessionActiveRef.current || !selectedLangRef.current) {
      console.log('handleSingleTurn: session not active or no language selected');
      return;
    }

    const speaker = currentSpeakerRef.current;
    const homeownerLang = selectedLangRef.current;

    console.log(`\n📍 === NEW TURN: Waiting for ${speaker} ===`);

    try {
      setAgnesState('listening');

      // Natural pause before listening
      await naturalPause(300);

      // Listen for current speaker
      console.log(`👂 Listening for ${speaker}...`);
      const text = await listenForSpeaker(speaker);

      if (!sessionActiveRef.current) return;

      console.log(`💬 ${speaker} said: "${text}"`);

      // Determine translation direction
      const sourceLang = speaker === 'rep' ? 'en' : homeownerLang;
      const targetLang = speaker === 'rep' ? homeownerLang : 'en';

      // Translate
      console.log(`🔄 Translating from ${sourceLang} to ${targetLang}...`);
      setAgnesState('translating');
      const translation = await translateWithCache(text, targetLang, sourceLang);

      console.log(`📝 Translation: "${translation}"`);

      if (!sessionActiveRef.current) return;

      // Add to transcript
      addToTranscript(speaker, text, sourceLang, translation, targetLang);

      // Speak translation if auto-speak is on
      console.log(`🔊 Auto-speak is ${autoSpeak ? 'ON' : 'OFF'}`);
      if (autoSpeak) {
        setAgnesState('speaking');
        // Natural pause before speaking
        await naturalPause(200);
        console.log(`🗣️ Speaking translation in ${targetLang}...`);
        await agnesSpeak(translation, targetLang);
        console.log(`✅ Done speaking`);
      }

      // Switch speaker for next turn
      const nextSpeaker = speaker === 'rep' ? 'homeowner' : 'rep';
      currentSpeakerRef.current = nextSpeaker;
      setCurrentSpeaker(nextSpeaker);

      // Continue with next turn after natural pause
      if (sessionActiveRef.current) {
        await naturalPause(400);
        handleSingleTurn();
      }

    } catch (error) {
      console.error('❌ Turn error:', error);
      // On timeout or error, retry listening for same speaker
      if (sessionActiveRef.current) {
        console.log('🔄 Retrying...');
        await naturalPause(800);
        handleSingleTurn();
      }
    }
  }, [listenForSpeaker, addToTranscript, agnesSpeak, autoSpeak]);

  // ============================================
  // Language Selected Handler (Manual Selection)
  // ============================================

  const handleLanguageSelected = useCallback(async (lang: SupportedLanguage) => {
    if (lang === 'auto') {
      handleAutoDetect();
      return;
    }

    setSelectedLanguage(lang);
    selectedLangRef.current = lang;
    setShowLanguageSelect(false);

    console.log(`Language selected: ${lang}`);

    try {
      // Agnes introduces herself to homeowner in their language
      setAgnesState('introducing');
      const intro = getAgnesHomeownerIntro(lang);
      await agnesSpeak(intro, lang);

      if (!sessionActiveRef.current) return;

      // Start conversation - homeowner goes first
      currentSpeakerRef.current = 'homeowner';
      setCurrentSpeaker('homeowner');

      // Start the conversation loop
      await naturalPause(300);
      handleSingleTurn();

    } catch (error) {
      console.error('Error after language selection:', error);
      endSession();
    }
  }, [agnesSpeak, handleSingleTurn, handleAutoDetect]);

  // ============================================
  // Start Agnes Session
  // ============================================

  const startAgnesSession = useCallback(async () => {
    if (!speechSupported) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Safari.');
      return;
    }

    // Initialize session
    const newSessionId = generateSessionId();
    setSessionId(newSessionId);
    sessionActiveRef.current = true;
    setTranscript([]);
    setSelectedLanguage(null);
    selectedLangRef.current = null;
    setDetectionResult(null);

    try {
      // Step 1: Agnes introduces herself to rep (English)
      setAgnesState('activating');
      await agnesSpeak(getAgnesRepIntro(), 'en');

      if (!sessionActiveRef.current) return;

      // Step 2: Auto-start language detection (no modal needed)
      // Agnes will listen and automatically detect the homeowner's language
      // Falls back to manual selection only if auto-detect fails
      handleAutoDetect();

    } catch (error) {
      console.error('Session start error:', error);
      setAgnesState('idle');
      sessionActiveRef.current = false;
    }
  }, [speechSupported, agnesSpeak, handleAutoDetect]);

  // ============================================
  // End Session
  // ============================================

  const endSession = useCallback(() => {
    sessionActiveRef.current = false;
    agnesVoiceStop(); // Stop Gemini + Web Speech
    stopListening();
    setAgnesState('ended');
    setInterimText('');
    setShowLanguageSelect(false);
    setIsAutoDetecting(false);

    // Save session if we have transcript
    if (transcript.length > 0 && user?.id) {
      saveTranslationSession({
        id: sessionId,
        userId: user.id,
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        targetLanguage: selectedLanguage || 'es',
        messages: transcript.map(t => ({
          id: t.id,
          speaker: t.speaker as 'rep' | 'homeowner',
          originalText: t.originalText,
          originalLang: t.originalLang,
          translatedText: t.translatedText || '',
          translatedLang: t.translatedLang || 'en',
          timestamp: t.timestamp.toISOString(),
        })),
      });
    }

    // Reset after a moment
    setTimeout(() => {
      setAgnesState('idle');
      setSelectedLanguage(null);
      selectedLangRef.current = null;
      setDetectionResult(null);
    }, 2000);
  }, [transcript, user?.id, sessionId, selectedLanguage]);

  // ============================================
  // Quick Phrase Handler
  // ============================================

  const handleQuickPhrase = useCallback(async (phrase: string) => {
    if (!sessionActiveRef.current || !selectedLangRef.current) return;

    setShowQuickPhrases(false);
    const targetLang = selectedLangRef.current;

    // Translate and speak
    setAgnesState('translating');
    const translation = await translateWithCache(phrase, targetLang, 'en');

    addToTranscript('rep', phrase, 'en', translation, targetLang);

    if (autoSpeak) {
      setAgnesState('speaking');
      await naturalPause(200);
      await agnesSpeak(translation, targetLang);
    }

    // After quick phrase, listen for homeowner response
    currentSpeakerRef.current = 'homeowner';
    setCurrentSpeaker('homeowner');

    // Continue conversation
    if (sessionActiveRef.current) {
      await naturalPause(400);
      handleSingleTurn();
    }
  }, [addToTranscript, agnesSpeak, autoSpeak, handleSingleTurn]);

  // ============================================
  // Speak Translation Manually
  // ============================================

  const handleSpeakTranslation = useCallback((text: string, lang: SupportedLanguage) => {
    // Use Gemini TTS for consistent high-quality voice
    agnesVoiceSpeak(text, lang);
  }, []);

  // ============================================
  // Load Past Sessions
  // ============================================

  useEffect(() => {
    if (showHistory && user?.id) {
      const sessions = getTranslationSessions(user.id);
      setPastSessions(sessions.slice(0, 10));
    }
  }, [showHistory, user?.id]);

  // ============================================
  // Cleanup on unmount
  // ============================================

  useEffect(() => {
    return () => {
      sessionActiveRef.current = false;
      agnesVoiceStop(); // Stop any playing audio
      stopListening();
      // Cleanup Gemini TTS resources
      cleanupGeminiTTS().catch(console.error);
    };
  }, []);

  // ============================================
  // Render - Language Selection Modal
  // ============================================

  const renderLanguageSelection = () => {
    // Get languages excluding 'en' and 'auto', then add auto at top
    const selectableLanguages = SUPPORTED_LANGUAGES.filter(l => l.code !== 'en');

    return (
      <div className="fixed inset-0 bg-black/95 z-50 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-[calc(100vw-2rem)] sm:max-w-md mx-auto">
            <div className="text-center mb-6 pt-4">
              <Globe className="w-10 h-10 text-cyan-400 mx-auto mb-3" />
              <h2 className="text-lg font-bold text-white mb-1">
                Select Homeowner's Language
              </h2>
              <p className="text-neutral-400 text-sm">
                What language does the homeowner speak?
              </p>
            </div>

            {/* Auto-Detect Option - Prominent at top */}
            <button
              onClick={() => handleLanguageSelected('auto')}
              disabled={isAutoDetecting}
              className="w-full flex items-center gap-4 p-4 mb-4 bg-gradient-to-r from-cyan-900/50 to-blue-900/50 hover:from-cyan-800/50 hover:to-blue-800/50 border-2 border-cyan-500/50 rounded-xl transition-all disabled:opacity-50"
            >
              <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center">
                <Search className="w-6 h-6 text-cyan-400" />
              </div>
              <div className="text-left flex-1">
                <div className="text-white font-bold">Auto-Detect</div>
                <div className="text-cyan-400/80 text-xs">Let Agnes listen and identify the language</div>
              </div>
              {isAutoDetecting && (
                <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              )}
            </button>

            <div className="text-center text-neutral-500 text-xs mb-4">— or select manually —</div>

            {/* Language Grid */}
            <div className="grid grid-cols-2 gap-2">
              {selectableLanguages.filter(l => l.code !== 'auto').map(lang => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageSelected(lang.code)}
                  className="flex items-center gap-2 p-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-cyan-500/50 rounded-lg transition-all"
                >
                  <span className="text-xl">{lang.flag}</span>
                  <div className="text-left min-w-0">
                    <div className="text-white text-sm font-medium truncate">{lang.name}</div>
                    <div className="text-neutral-500 text-xs truncate">{lang.nativeName}</div>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={endSession}
              className="w-full mt-6 py-3 text-neutral-400 hover:text-white text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ============================================
  // Render - Idle State
  // ============================================

  if (agnesState === 'idle') {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Back</span>
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          {/* Waveform (idle) */}
          <div className="mb-8">
            <AudioWaveform isActive={false} status="idle" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-white mb-2 tracking-wide">
            AGNES THE LINGUIST
          </h1>
          <p className="text-neutral-400 text-sm mb-12">
            Your 5-star field translator
          </p>

          {/* Start Button */}
          <button
            onClick={startAgnesSession}
            disabled={!speechSupported}
            className="px-12 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-2xl text-white font-bold text-lg shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:shadow-cyan-500/40 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            START AGNES
          </button>

          {!speechSupported && (
            <p className="text-red-400 text-xs mt-4 text-center">
              Speech recognition not supported in this browser.
              <br />Please use Chrome or Safari.
            </p>
          )}

          {/* Past Conversations Link */}
          <button
            onClick={() => setShowHistory(true)}
            className="mt-8 text-neutral-500 hover:text-neutral-300 text-sm flex items-center gap-2 transition-colors"
          >
            <History className="w-4 h-4" />
            View Past Conversations
          </button>
        </div>

        {/* History Modal */}
        {showHistory && (
          <HistoryModal
            sessions={pastSessions}
            onClose={() => setShowHistory(false)}
          />
        )}
      </div>
    );
  }

  // ============================================
  // Render - Active State
  // ============================================

  const isActive = ['activating', 'detecting', 'introducing', 'listening', 'translating', 'speaking'].includes(agnesState);
  const waveformStatus = agnesState === 'speaking' ? 'speaking' : agnesState === 'translating' ? 'translating' : 'listening';

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Language Selection Modal */}
      {showLanguageSelect && renderLanguageSelection()}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Manual Language Select Button */}
          <button
            onClick={() => setShowLanguageSelect(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-full text-neutral-300 text-sm transition-colors"
            title="Select language manually"
          >
            <Globe className="w-4 h-4" />
            {selectedLanguage ? (
              <span>{getLanguageFlag(selectedLanguage)}</span>
            ) : (
              <span className="text-xs">Language</span>
            )}
          </button>

          <button
            onClick={endSession}
            className="px-4 py-1.5 bg-red-600/20 hover:bg-red-600/40 border border-red-500/40 rounded-full text-red-400 text-sm transition-colors"
          >
            End Session
          </button>
        </div>
      </div>

      {/* Agnes Status Area */}
      <div className="px-4 py-6 border-b border-neutral-800 bg-neutral-900/50">
        {/* Waveform */}
        <AudioWaveform
          isActive={isActive}
          status={waveformStatus}
          className="mb-4"
        />

        {/* Status - Show dialect-specific info if available */}
        <StatusIndicator
          status={agnesState as any}
          detectedLanguage={detectionResult
            ? getDetectionDisplayName(detectionResult).replace(/[^\w\s]/g, '')
            : selectedLanguage
              ? getLanguageName(selectedLanguage)
              : undefined}
          languageFlag={detectionResult?.dialect
            ? getDialectConfig(detectionResult.dialect)?.flag
            : selectedLanguage
              ? getLanguageFlag(selectedLanguage)
              : undefined}
        />

        {/* Current Speaker Indicator */}
        {selectedLanguage && agnesState === 'listening' && (
          <div className="mt-3 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-neutral-800 rounded-full">
              <Mic className="w-3 h-3 text-cyan-400 animate-pulse" />
              <span className="text-xs text-neutral-400">
                Waiting for{' '}
                <span className={currentSpeaker === 'rep' ? 'text-blue-400' : 'text-green-400'}>
                  {currentSpeaker === 'rep' ? 'Rep (English)' : `Homeowner (${getLanguageName(selectedLanguage)})`}
                </span>
              </span>
            </div>
          </div>
        )}

        {/* Skip Auto-Detect Button - shown during detection phase */}
        {isAutoDetecting && agnesState === 'detecting' && (
          <div className="mt-4 text-center">
            <button
              onClick={() => {
                stopListening();
                agnesVoiceStop();
                setIsAutoDetecting(false);
                setShowLanguageSelect(true);
              }}
              className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 rounded-lg text-white text-sm font-medium transition-colors flex items-center gap-2 mx-auto min-h-[44px]"
            >
              <Globe className="w-4 h-4 text-cyan-400" />
              Skip - Choose Language Manually
            </button>
          </div>
        )}

        {/* Agnes Message */}
        <AgnesMessage
          message={agnesMessage}
          isVisible={!!agnesMessage}
        />
      </div>

      {/* Transcript Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="px-4 py-2 border-b border-neutral-800">
          <h2 className="text-xs font-mono uppercase tracking-wider text-neutral-500">
            Live Transcript
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <ConversationTranscript
            entries={transcript}
            onSpeak={handleSpeakTranslation}
          />

          {/* Typing indicator */}
          {interimText && (
            <TypingIndicator
              speaker={currentSpeaker}
              text={interimText}
            />
          )}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="px-4 py-4 border-t border-neutral-800 bg-neutral-900/50">
        <div className="flex items-center justify-between">
          {/* Auto-speak toggle */}
          <button
            onClick={() => setAutoSpeak(!autoSpeak)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              autoSpeak
                ? 'bg-green-600/20 text-green-400 border border-green-500/40'
                : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
            }`}
          >
            {autoSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="text-xs font-medium">
              Auto-speak: {autoSpeak ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Quick Phrases */}
          <button
            onClick={() => setShowQuickPhrases(true)}
            disabled={!selectedLanguage}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/40 rounded-lg text-purple-400 transition-colors disabled:opacity-50"
          >
            <BookOpen className="w-4 h-4" />
            <span className="text-xs font-medium">Quick Phrases</span>
          </button>
        </div>
      </div>

      {/* Quick Phrases Panel */}
      {showQuickPhrases && (
        <QuickPhrasesPanel
          onSelect={handleQuickPhrase}
          onClose={() => setShowQuickPhrases(false)}
        />
      )}
    </div>
  );
};

// ============================================
// Quick Phrases Panel Component
// ============================================

interface QuickPhrasesPanelProps {
  onSelect: (phrase: string) => void;
  onClose: () => void;
}

const QuickPhrasesPanel: React.FC<QuickPhrasesPanelProps> = ({ onSelect, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('greeting');

  const categories = [
    { id: 'greeting', label: 'Greetings' },
    { id: 'pitch', label: 'Pitch' },
    { id: 'insurance', label: 'Insurance' },
    { id: 'objection', label: 'Objections' },
    { id: 'scheduling', label: 'Scheduling' },
    { id: 'closing', label: 'Closing' },
  ];

  const filteredPhrases = SYSTEM_PHRASES.filter(p => p.category === selectedCategory);

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
        <h2 className="text-white font-bold">Quick Phrases</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-neutral-400" />
        </button>
      </div>

      {/* Categories */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto border-b border-neutral-800">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCategory === cat.id
                ? 'bg-purple-600 text-white'
                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Phrases List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredPhrases.map(phrase => (
          <button
            key={phrase.id}
            onClick={() => onSelect(phrase.englishText)}
            className="w-full text-left p-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded-lg transition-colors"
          >
            <p className="text-white text-sm">{phrase.englishText}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================
// History Modal Component
// ============================================

interface HistoryModalProps {
  sessions: any[];
  onClose: () => void;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ sessions, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
        <h2 className="text-white font-bold">Past Conversations</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-neutral-400" />
        </button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {sessions.length === 0 ? (
          <div className="text-center text-neutral-500 py-12">
            No past conversations yet
          </div>
        ) : (
          sessions.map(session => (
            <div
              key={session.id}
              className="p-4 bg-neutral-900 border border-neutral-700 rounded-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-neutral-400">
                  {new Date(session.startTime).toLocaleDateString()}
                </span>
                <span className="text-lg">
                  {getLanguageFlag(session.targetLanguage)}
                </span>
              </div>
              <p className="text-xs text-neutral-500">
                {session.messages?.length || 0} messages
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FieldTranslator;
