import React, { useEffect, useState, useRef } from 'react';
import { Trophy, VolumeX, Volume2 } from 'lucide-react';

// Gemini TTS instance (lazy loaded)
let geminiTTSInstance: any = null;

interface ScoreReviewModalProps {
  show: boolean;
  scoreText: string;
  numericScore: number | null;
  onClose: () => void;  // Single action - always ends session
}

const ScoreReviewModal: React.FC<ScoreReviewModalProps> = ({
  show,
  scoreText,
  numericScore,
  onClose
}) => {
  // Typewriter state
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  // TTS state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsError, setTtsError] = useState<string | null>(null);
  const [ttsStatus, setTtsStatus] = useState<'idle' | 'speaking' | 'complete' | 'unavailable'>('idle');
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const localAudioContextRef = useRef<AudioContext | null>(null);
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Get score color based on value
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-600/30 text-green-400 border-green-500/50';
    if (score >= 60) return 'bg-yellow-600/30 text-yellow-400 border-yellow-500/50';
    return 'bg-red-600/30 text-red-400 border-red-500/50';
  };

  // Clean text for TTS - remove score patterns and excess whitespace
  const cleanTextForTTS = (text: string): string => {
    return text
      .replace(/AGNES SCORE:?\s*\d+/gi, '')
      .replace(/(?:final\s+)?score:?\s*\d+\s*(?:\/\s*100)?/gi, '')
      .replace(/\*\*/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };

  // Typewriter effect
  useEffect(() => {
    if (!show || !scoreText) {
      setDisplayedText('');
      setIsTyping(false);
      return;
    }

    let index = 0;
    setDisplayedText('');
    setIsTyping(true);

    const interval = setInterval(() => {
      if (index < scoreText.length) {
        setDisplayedText(prev => prev + scoreText.charAt(index));
        index++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 15); // 15ms per character for smooth typewriter

    return () => clearInterval(interval);
  }, [show, scoreText]);

  // TTS playback when modal shows - Gemini TTS (Kore voice) with Web Speech fallback
  useEffect(() => {
    if (!show || !scoreText) return;

    const playScoreAudio = async () => {
      const cleanText = cleanTextForTTS(scoreText);
      if (!cleanText) {
        setTtsStatus('unavailable');
        return;
      }

      setIsSpeaking(true);
      setTtsStatus('speaking');
      setTtsError(null);

      // Try Gemini TTS first (Agnes's Kore voice)
      try {
        // Lazy load GeminiEnglishTTS
        if (!geminiTTSInstance) {
          const { GeminiEnglishTTS } = await import('../utils/geminiTTS');
          geminiTTSInstance = new GeminiEnglishTTS();
        }

        const initialized = await geminiTTSInstance.init();
        if (initialized) {
          await geminiTTSInstance.speak(cleanText);
          setIsSpeaking(false);
          setTtsStatus('complete');
          console.log('Score read with Gemini Kore voice');
          return; // Success - exit early
        }
      } catch (error) {
        console.warn('Gemini TTS failed, falling back to Web Speech:', error);
      }

      // Fallback to Web Speech API
      if ('speechSynthesis' in window) {
        try {
          // Cancel any ongoing speech
          window.speechSynthesis.cancel();

          const utterance = new SpeechSynthesisUtterance(cleanText);
          utterance.rate = 1.0;
          utterance.pitch = 1.0;
          utterance.volume = 1.0;

          // Try to find a good voice
          const voices = window.speechSynthesis.getVoices();
          const preferredVoice = voices.find(v =>
            v.name.includes('Samantha') ||
            v.name.includes('Google') ||
            v.lang.startsWith('en')
          );
          if (preferredVoice) {
            utterance.voice = preferredVoice;
          }

          utterance.onend = () => {
            setIsSpeaking(false);
            setTtsStatus('complete');
            speechSynthRef.current = null;
          };

          utterance.onerror = (e) => {
            console.error('Web Speech error:', e);
            setIsSpeaking(false);
            setTtsStatus('complete');
            setTtsError('Voice playback failed');
          };

          speechSynthRef.current = utterance;
          window.speechSynthesis.speak(utterance);
          console.log('Playing score audio with Web Speech API fallback');
        } catch (error) {
          console.error('Web Speech API error:', error);
          setIsSpeaking(false);
          setTtsStatus('unavailable');
          setTtsError('Voice not available');
        }
      } else {
        console.log('No TTS available - text only mode');
        setIsSpeaking(false);
        setTtsStatus('unavailable');
      }
    };

    // Small delay to let modal animation complete
    const timer = setTimeout(playScoreAudio, 300);
    return () => clearTimeout(timer);
  }, [show, scoreText]);

  // Cleanup on unmount or hide
  useEffect(() => {
    if (!show) {
      handleStopSpeaking();
      // Close local audio context if we created one
      if (localAudioContextRef.current) {
        localAudioContextRef.current.close().catch(() => {});
        localAudioContextRef.current = null;
      }
      // Reset status
      setTtsStatus('idle');
    }
  }, [show]);

  const handleStopSpeaking = () => {
    // Stop AudioBufferSourceNode (Chatterbox TTS)
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
      } catch (e) {
        // Already stopped
      }
      audioSourceRef.current = null;
    }
    // Stop Web Speech API
    if (speechSynthRef.current) {
      window.speechSynthesis.cancel();
      speechSynthRef.current = null;
    }
    setIsSpeaking(false);
    if (ttsStatus === 'speaking') {
      setTtsStatus('complete');
    }
  };

  const handleClose = () => {
    handleStopSpeaking();
    onClose();
  };

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="score-review-title"
    >
      {/* Modal Container */}
      <div className="relative bg-neutral-900 rounded-2xl border-2 border-yellow-500/50 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-scaleIn">

        {/* Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-transparent to-red-500/5 pointer-events-none" />

        {/* Header with Score Badge */}
        <div className="relative p-6 border-b border-yellow-500/20 bg-gradient-to-r from-yellow-900/20 to-neutral-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Trophy className="w-8 h-8 text-yellow-400" />
                <div className="absolute inset-0 animate-ping opacity-30">
                  <Trophy className="w-8 h-8 text-yellow-400" />
                </div>
              </div>
              <h2 id="score-review-title" className="text-2xl font-bold text-white">
                Your Score
              </h2>
            </div>
            {numericScore !== null && (
              <div className={`px-5 py-2 rounded-xl text-3xl font-black border-2 ${getScoreColor(numericScore)}`}>
                {numericScore}/100
              </div>
            )}
          </div>
        </div>

        {/* Scrollable Feedback Area with Typewriter */}
        <div className="p-6 max-h-[50vh] overflow-y-auto">
          <div className="text-neutral-200 text-base leading-relaxed whitespace-pre-wrap font-medium">
            {displayedText}
            {isTyping && (
              <span className="inline-block w-2 h-5 bg-yellow-400 ml-1 animate-pulse" />
            )}
          </div>
          {!displayedText && !isTyping && (
            <div className="text-neutral-500 italic">Generating feedback...</div>
          )}
        </div>

        {/* Agnes Speaking Indicator */}
        <div className={`px-6 py-3 border-t border-yellow-500/20 transition-all duration-300 ${
          isSpeaking ? 'bg-yellow-500/10' : 'bg-neutral-800/50'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isSpeaking ? (
                <>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                    <div className="w-2 h-3 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-4 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                    <div className="w-2 h-3 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                  </div>
                  <span className="text-yellow-400 text-sm font-medium ml-2">Agnes is speaking...</span>
                </>
              ) : ttsError ? (
                <>
                  <VolumeX className="w-4 h-4 text-red-400" />
                  <span className="text-red-400 text-sm">{ttsError}</span>
                </>
              ) : ttsStatus === 'complete' ? (
                <>
                  <Volume2 className="w-4 h-4 text-green-500" />
                  <span className="text-green-500 text-sm">Audio complete</span>
                </>
              ) : ttsStatus === 'unavailable' ? (
                <>
                  <VolumeX className="w-4 h-4 text-neutral-500" />
                  <span className="text-neutral-500 text-sm">Voice unavailable - read above</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-neutral-500" />
                  <span className="text-neutral-500 text-sm">Preparing audio...</span>
                </>
              )}
            </div>

            {isSpeaking && (
              <button
                onClick={handleStopSpeaking}
                className="flex items-center gap-2 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 rounded-lg transition-colors"
              >
                <VolumeX className="w-4 h-4 text-neutral-400" />
                <span className="text-sm text-neutral-300">Stop Speaking</span>
              </button>
            )}
          </div>
        </div>

        {/* Action Button - Session Complete */}
        <div className="p-6 border-t border-neutral-800 bg-neutral-900/50">
          <button
            onClick={handleClose}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 rounded-xl text-white font-semibold transition-all shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/40"
          >
            <Trophy className="w-5 h-5" />
            Session Complete
          </button>
          <p className="text-center text-neutral-500 text-sm mt-3">
            Your score has been saved. Great training session!
          </p>
        </div>
      </div>
    </div>
  );
};

export default ScoreReviewModal;
