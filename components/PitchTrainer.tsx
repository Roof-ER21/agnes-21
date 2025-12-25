
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { createPcmBlob, decodeAudioData, base64ToUint8Array, blobToBase64 } from '../utils/audioUtils';
import { buildSystemInstruction } from '../utils/improvedPrompts';
import Waveform from './Waveform';
import AgnesAvatar from './AgnesAvatar';
import MicLevelMeter from './MicLevelMeter';
import AgnesStateIndicator, { AgnesState } from './AgnesStateIndicator';
import StreakCounter from './StreakCounter';
import Confetti from './Confetti';
import SparklesComponent from './Sparkles';
import { SessionConfig, PitchMode, DifficultyLevel } from '../types';
import {
  saveSession,
  updateSession,
  generateSessionId,
  updateStreak,
  checkAchievements,
  getAchievementById,
  SessionData,
  TranscriptMessage as StoredTranscriptMessage
} from '../utils/sessionStorage';
import {
  saveVideoRecording,
  getSupportedMimeType,
  generateThumbnail
} from '../utils/videoStorage';
import { playSuccess, playPerfect, playLevelUp, toggleSounds, areSoundsEnabled } from '../utils/soundEffects';
import { useAuth } from '../contexts/AuthContext';
import { checkTTSHealth, generateSpeech, DEFAULT_FEEDBACK_VOICE, speakWithChatterbox } from '../utils/chatterboxTTS';
import { createVAD, startVAD, stopVAD, pauseVAD, createFallbackVAD } from '../utils/vadUtils';
import { Mic, MicOff, Video, VideoOff, X, ChevronDown, ChevronUp, Trophy, Skull, Shield, Zap, MessageSquare, Keyboard, Circle, Sparkles, AlertTriangle, Volume2, VolumeX, Wand2 } from 'lucide-react';
import XPBar from './XPBar';
import LevelUpModal from './LevelUpModal';
import { calculateSessionXP, awardXP, getUserProgress } from '../utils/gamification';
import { getStreak } from '../utils/sessionStorage';

interface PitchTrainerProps {
  config: SessionConfig;
  onEndSession: () => void;
  onMiniModuleComplete?: (moduleId: string) => void;
}

interface TranscriptMessage {
  role: 'user' | 'agnes';
  text: string;
  timestamp: Date;
  score?: number;
}

const PitchTrainer: React.FC<PitchTrainerProps> = ({ config, onEndSession, onMiniModuleComplete }) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  // We track active audio chunks to keep the visualizer synced with actual playback
  const [activeAudioCount, setActiveAudioCount] = useState(0);
  const aiSpeaking = activeAudioCount > 0;

  const [error, setError] = useState<string | null>(null);
  const [isScriptExpanded, setIsScriptExpanded] = useState(false);

  // NEW: Transcript and scoring
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [isTranscriptExpanded, setIsTranscriptExpanded] = useState(false);
  const [currentScore, setCurrentScore] = useState<number | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // NEW: Session persistence
  const [sessionId] = useState<string>(generateSessionId());
  const [sessionStartTime] = useState<Date>(new Date());

  // NEW: Agnes state tracking
  const [agnesState, setAgnesState] = useState<AgnesState>(AgnesState.IDLE);

  // NEW: Keyboard shortcuts hint
  const [showKeyboardHints, setShowKeyboardHints] = useState(false);

  // NEW: Streak tracking
  const [streakKey, setStreakKey] = useState(0); // Used to trigger StreakCounter reload

  // NEW: Video recording
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // NEW: End Session modals
  const [showEndSessionModal, setShowEndSessionModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [videoSaved, setVideoSaved] = useState(false);
  const [newAchievements, setNewAchievements] = useState<string[]>([]);

  // NEW: Celebration states
  const [showConfetti, setShowConfetti] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);
  const [soundsOn, setSoundsOn] = useState(areSoundsEnabled());

  // NEW: Custom Voice Mode (Chatterbox TTS with Reeses Piecies)
  const [useCustomVoice, setUseCustomVoice] = useState(false);
  const [ttsAvailable, setTtsAvailable] = useState<boolean | null>(null);

  // NEW: Score Me functionality
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [isRequestingScore, setIsRequestingScore] = useState(false);

  // NEW: Silence timeout tracking
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const SILENCE_TIMEOUT_MS = 3000; // 3 seconds of silence = end of speech
  const [isSpeakingCustom, setIsSpeakingCustom] = useState(false);

  // NEW: Level-up modal state
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{
    previous: number;
    new: number;
    unlocks: string[];
  }>({ previous: 1, new: 1, unlocks: [] });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Audio Context Refs
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null); // NEW: For user mic visualization

  const streamRef = useRef<MediaStream | null>(null);
  const audioInputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  // Video Interval Ref
  const frameIntervalRef = useRef<number | null>(null);
  
  // Session Ref (to avoid stale closures)
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const aiClientRef = useRef<GoogleGenAI | null>(null);

  // CRITICAL: Session active flag to prevent audio playback after cleanup starts
  const sessionActiveRef = useRef<boolean>(true);

  // Ref for custom voice mode (to avoid stale closures in callbacks)
  const useCustomVoiceRef = useRef<boolean>(false);

  const getDifficultyColor = () => {
    switch (config.difficulty) {
      case DifficultyLevel.BEGINNER: return 'text-cyan-500';
      case DifficultyLevel.ROOKIE: return 'text-green-500';
      case DifficultyLevel.PRO: return 'text-yellow-500';
      case DifficultyLevel.ELITE: return 'text-red-600';
      case DifficultyLevel.NIGHTMARE: return 'text-orange-600';
      default: return 'text-white';
    }
  };

  // NEW: Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'm':
          setIsMuted(prev => !prev);
          break;
        case 'v':
          setIsVideoEnabled(prev => !prev);
          break;
        case 's':
          setIsScriptExpanded(prev => !prev);
          break;
        case 't':
          setIsTranscriptExpanded(prev => !prev);
          break;
        case 'c':
          if (ttsAvailable) {
            setUseCustomVoice(prev => !prev);
          }
          break;
        case 'escape':
          if (confirm('Are you sure you want to end this session?')) {
            handleEndSession();
          }
          break;
        case '?':
          setShowKeyboardHints(prev => !prev);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  // NEW: Update Agnes state based on activity
  useEffect(() => {
    if (aiSpeaking || isSpeakingCustom) {
      setAgnesState(AgnesState.RESPONDING);
    } else if (isSpeaking) {
      setAgnesState(AgnesState.LISTENING);
    } else if (isConnected) {
      setAgnesState(AgnesState.IDLE);
    }
  }, [aiSpeaking, isSpeaking, isConnected, isSpeakingCustom]);

  // NEW: Check Chatterbox TTS availability
  useEffect(() => {
    const checkTTS = async () => {
      try {
        console.log('Checking Chatterbox TTS availability...');
        const available = await checkTTSHealth();
        setTtsAvailable(available);
        if (available) {
          console.log('✅ Chatterbox TTS is available - custom voice enabled');
          console.log('   Voice: Reeses Piecies');
          console.log('   Press "C" or click the wand icon to toggle custom voice');
        } else {
          console.log('⚠️ Chatterbox TTS backend not responding');
          console.log('   Custom voice will be disabled');
          console.log('   To enable: Start TTS backend at http://localhost:8000');
        }
      } catch (error) {
        console.error('❌ Error checking TTS availability:', error);
        setTtsAvailable(false);
      }
    };
    checkTTS();
  }, []);

  // Sync custom voice ref with state
  useEffect(() => {
    useCustomVoiceRef.current = useCustomVoice;
  }, [useCustomVoice]);

  useEffect(() => {
    const initSession = async () => {
      try {
        // 1. Setup Client
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;
        if (!apiKey) {
          throw new Error('API key not found. Please set VITE_GEMINI_API_KEY in .env.local');
        }
        aiClientRef.current = new GoogleGenAI({ apiKey });
        
        // 2. Setup Audio/Video Media Stream
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: true, 
          video: { width: 640, height: 480 } 
        });
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Use a more robust error handler for video play
          const playPromise = videoRef.current.play();
          if (playPromise !== undefined) {
            playPromise.catch(err => {
              // Silently ignore AbortError and DOMException with code 20 (interrupted)
              if (err.name === 'AbortError' ||
                  (err instanceof DOMException && err.code === 20)) {
                // Expected error when load is interrupted, ignore silently
                return;
              }
              // Log other errors
              console.error('Video play error:', err);
            });
          }
        }

        // 3. Setup Audio Contexts
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        inputAudioContextRef.current = new AudioContext({ sampleRate: 16000 });
        outputAudioContextRef.current = new AudioContext({ sampleRate: 24000 });

        // Setup Analyser for AI Voice
        const analyser = outputAudioContextRef.current.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.5;
        analyserRef.current = analyser;

        // Setup Analyser for User Mic (for waveform)
        const micAnalyser = inputAudioContextRef.current.createAnalyser();
        micAnalyser.fftSize = 256;
        micAnalyser.smoothingTimeConstant = 0.8;
        micAnalyserRef.current = micAnalyser;

        // 4. Build improved system instruction
        const systemInstruction = buildSystemInstruction(
          config.mode,
          config.difficulty,
          config.script || "No specific script provided"
        );

        // 5. Connect to Gemini Live
        const sessionPromise = aiClientRef.current.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-09-2025',
          callbacks: {
            onopen: () => {
              console.log('Gemini Live Session Opened');
              setIsConnected(true);
              startAudioInput();
              startVideoInput();
              startRecording(); // Start video recording
            },
            onmessage: async (message: LiveServerMessage) => {
              const serverContent = message.serverContent;

              // Handle Interruption
              if (serverContent?.interrupted) {
                audioSourcesRef.current.forEach(source => {
                  try { source.stop(); } catch (e) { /* ignore */ }
                });
                audioSourcesRef.current.clear();
                setActiveAudioCount(0);
                nextStartTimeRef.current = 0;
                return;
              }

              // Handle Text Output (for transcript and custom voice)
              const textContent = serverContent?.modelTurn?.parts?.[0]?.text;
              if (textContent) {
                // Parse score if present
                const scoreMatch = textContent.match(/AGNES SCORE:?\s*(\d+)/i);
                const score = scoreMatch ? parseInt(scoreMatch[1]) : null;

                if (score !== null) {
                  setCurrentScore(score);
                }

                // Add to transcript
                setTranscript(prev => [...prev, {
                  role: 'agnes',
                  text: textContent,
                  timestamp: new Date(),
                  score: score || undefined
                }]);

                // If custom voice enabled, speak with Chatterbox TTS (Reeses Piecies)
                if (useCustomVoiceRef.current && sessionActiveRef.current) {
                  // Don't wait for this, let it play asynchronously
                  speakWithCustomVoice(textContent);
                }
              }

              // Handle Audio Output (only if session is still active AND custom voice is disabled)
              const base64Audio = serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
              if (base64Audio && sessionActiveRef.current && !useCustomVoiceRef.current) {
                await playAudioChunk(base64Audio);
              }
            },
            onclose: () => {
              console.log('Gemini Live Session Closed');
              setIsConnected(false);
            },
            onerror: (err) => {
              console.error('Gemini Live Error', err);
              setError("Connection error. Please restart.");
            }
          },
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
            },
            systemInstruction: systemInstruction,
          }
        });
        
        sessionPromiseRef.current = sessionPromise;

      } catch (err: any) {
        console.error("Initialization Error", err);

        // Improved error handling with specific messages
        if (err.name === 'NotAllowedError') {
          setError("🎤 Microphone/Camera access denied. Click the lock icon in your browser and enable permissions.");
        } else if (err.name === 'NotFoundError') {
          setError("🎤 No microphone or camera detected. Please connect a device and refresh the page.");
        } else if (err.name === 'NotReadableError') {
          setError("🎥 Camera/mic is being used by another app. Close other apps and try again.");
        } else if (err.message && err.message.includes('API')) {
          setError("🌐 AI connection failed. Check your internet connection or API key.");
        } else {
          setError(`❌ Initialization failed: ${err.message || 'Unknown error'}`);
        }
      }
    };

    initSession();

    return () => {
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  const cleanup = () => {
    // CRITICAL: Disable session FIRST to prevent new audio from playing
    sessionActiveRef.current = false;

    // Stop all audio sources SECOND (before closing contexts)
    audioSourcesRef.current.forEach(source => {
      try {
        source.stop();
      } catch (e) {
        console.warn('Error stopping audio source:', e);
      }
    });
    audioSourcesRef.current.clear();
    setActiveAudioCount(0);

    // Now safe to close audio contexts THIRD
    if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
      inputAudioContextRef.current.close();
    }
    if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
      outputAudioContextRef.current.close();
    }

    // Stop media tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    // Clear frame interval
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
    }

    // Stop recording if active
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  // NEW: Video Recording Functions
  const startRecording = () => {
    try {
      if (!streamRef.current) {
        console.error('No stream available for recording');
        return;
      }

      const mimeType = getSupportedMimeType();
      console.log(`Starting recording with MIME type: ${mimeType}`);

      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType,
        videoBitsPerSecond: 2500000 // 2.5 Mbps
      });

      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstart = () => {
        console.log('Recording started');
        setIsRecording(true);
      };

      mediaRecorder.onstop = () => {
        console.log('Recording stopped');
        setIsRecording(false);
      };

      mediaRecorder.onerror = (event: Event) => {
        console.error('MediaRecorder error:', event);
        setIsRecording(false);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Collect data every second
    } catch (error) {
      console.error('Failed to start recording:', error);
      setIsRecording(false);
    }
  };

  const stopRecording = async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
        resolve(null);
        return;
      }

      // Request final data chunk before stopping
      if (mediaRecorderRef.current.state === 'recording') {
        try {
          mediaRecorderRef.current.requestData();
        } catch (e) {
          console.warn('Failed to request final data chunk:', e);
        }
      }

      mediaRecorderRef.current.onstop = async () => {
        // Small delay to ensure all chunks are received
        await new Promise(resolve => setTimeout(resolve, 100));

        if (recordedChunksRef.current.length > 0) {
          const mimeType = getSupportedMimeType();
          const videoBlob = new Blob(recordedChunksRef.current, { type: mimeType });
          console.log(`Recording complete: ${videoBlob.size} bytes (${recordedChunksRef.current.length} chunks)`);
          resolve(videoBlob);
        } else {
          resolve(null);
        }
        setIsRecording(false);
      };

      mediaRecorderRef.current.stop();
    });
  };

  // NEW: Handle session end - opens confirmation modal
  const handleEndSession = () => {
    setShowEndSessionModal(true);
  };

  // NEW: Handle Score Me button - requests score from Agnes
  const handleScoreMe = async () => {
    if (!sessionPromiseRef.current || isRequestingScore) return;

    setIsRequestingScore(true);

    try {
      // Send a text message to Gemini asking for scoring
      const session = await sessionPromiseRef.current;

      // Add user message to transcript
      const scoreRequestMsg: TranscriptMessage = {
        role: 'user',
        text: '🎯 Score Me',
        timestamp: new Date()
      };
      setTranscript(prev => [...prev, scoreRequestMsg]);

      // Send the scoring request to Gemini
      session.sendClientContent({
        turns: [{
          role: 'user',
          parts: [{ text: 'Agnes, please score my performance now. Provide your AGNES SCORE out of 100 and detailed feedback on what I did well and what I can improve.' }]
        }],
        turnComplete: true
      });

    } catch (error) {
      console.error('Error requesting score:', error);
    } finally {
      // Reset after a delay to allow response
      setTimeout(() => setIsRequestingScore(false), 5000);
    }
  };

  // NEW: Handle end session with auto-score option
  const handleEndWithScore = async () => {
    setShowScoreModal(false);
    setIsRequestingScore(true);

    try {
      if (sessionPromiseRef.current) {
        const session = await sessionPromiseRef.current;

        // Request final score before ending
        session.sendClientContent({
          turns: [{
            role: 'user',
            parts: [{ text: 'The session is ending. Please provide your final AGNES SCORE out of 100 and a summary of my performance.' }]
          }],
          turnComplete: true
        });

        // Wait for response before ending
        await new Promise(resolve => setTimeout(resolve, 8000));
      }
    } catch (error) {
      console.error('Error getting final score:', error);
    }

    // Now end the session
    confirmEndSession();
  };

  // NEW: Handle end without score
  const handleEndWithoutScore = () => {
    setShowScoreModal(false);
    confirmEndSession();
  };

  // NEW: Confirm and save session
  const confirmEndSession = async () => {
    setShowEndSessionModal(false);

    // CRITICAL: Disable session to prevent audio race conditions
    sessionActiveRef.current = false;

    // Stop all audio sources immediately
    audioSourcesRef.current.forEach(source => {
      try {
        source.stop();
      } catch (e) {
        // Ignore errors during shutdown
      }
    });
    audioSourcesRef.current.clear();
    setActiveAudioCount(0);

    // Stop and save video recording
    const videoBlob = await stopRecording();

    // Calculate session duration
    const duration = Math.floor((new Date().getTime() - sessionStartTime.getTime()) / 1000);

    // Save session to localStorage
    const sessionData: SessionData = {
      sessionId,
      timestamp: sessionStartTime,
      difficulty: config.difficulty,
      mode: config.mode,
      script: config.script || 'No script',
      transcript: transcript.map(msg => ({
        role: msg.role,
        text: msg.text,
        timestamp: msg.timestamp,
        score: msg.score
      })),
      finalScore: currentScore || undefined,
      duration
    };

    const saved = saveSession(sessionData, user?.id);
    if (saved) {
      console.log(`Session ${sessionId} saved successfully`);
    } else {
      console.error('Failed to save session');
    }

    // Save video recording to IndexedDB
    let videoSavedSuccess = false;
    if (videoBlob) {
      console.log('Saving video recording...');
      const thumbnail = await generateThumbnail(videoBlob);
      const videoRecording = {
        sessionId,
        recordedAt: sessionStartTime,
        duration,
        size: videoBlob.size,
        mimeType: videoBlob.type,
        videoBlob,
        thumbnail,
        metadata: {
          difficulty: config.difficulty,
          mode: config.mode,
          finalScore: currentScore || undefined
        }
      };

      videoSavedSuccess = await saveVideoRecording(videoRecording, user?.id);
      if (videoSavedSuccess) {
        console.log('✅ Video recording saved successfully');
      } else {
        console.error('❌ Failed to save video recording');
      }
    }
    setVideoSaved(videoSavedSuccess);

    // Update streak
    const streakResult = updateStreak(user?.id);
    if (streakResult.newMilestone) {
      console.log(`🎉 New milestone reached: ${streakResult.newMilestone} days!`);
    }
    if (streakResult.streakBroken) {
      console.log('💔 Streak was broken, but starting fresh!');
    }

    // Calculate and award XP
    const streakData = getStreak(user?.id);
    const xpEarned = calculateSessionXP(sessionData, streakData);
    const xpResult = awardXP(xpEarned, user?.id);

    console.log('🎯 XP System:', {
      xpEarned,
      totalXP: xpResult.totalXP,
      previousLevel: xpResult.previousLevel,
      newLevel: xpResult.newLevel,
      leveledUp: xpResult.leveledUp
    });

    // Check for new achievements
    const newAchievementsUnlocked = checkAchievements(user?.id);
    const achievementNames: string[] = [];
    if (newAchievementsUnlocked.length > 0) {
      newAchievementsUnlocked.forEach(achievementId => {
        const achievement = getAchievementById(achievementId);
        if (achievement) {
          console.log(`🏆 Achievement Unlocked: ${achievement.name} - ${achievement.description}`);
          achievementNames.push(achievement.name);
        }
      });
    }
    setNewAchievements(achievementNames);

    // Trigger StreakCounter reload
    setStreakKey(prev => prev + 1);

    // Handle level-up
    if (xpResult.leveledUp) {
      setLevelUpData({
        previous: xpResult.previousLevel,
        new: xpResult.newLevel,
        unlocks: xpResult.newUnlocks
      });
      setShowLevelUpModal(true);
      playLevelUp();
    }

    // Trigger celebrations based on score
    if (currentScore !== null && currentScore !== undefined) {
      if (currentScore >= 100) {
        setShowConfetti(true);
        playPerfect();
      } else if (currentScore >= 85) {
        setShowSparkles(true);
        playSuccess();
      }
    }

    // Show success modal
    setShowSuccessModal(true);
  };

  // NEW: Discard session without saving
  const discardSession = async () => {
    setShowEndSessionModal(false);

    // CRITICAL: Disable session to prevent audio race conditions
    sessionActiveRef.current = false;

    // Stop all audio sources immediately
    audioSourcesRef.current.forEach(source => {
      try {
        source.stop();
      } catch (e) {
        // Ignore errors during shutdown
      }
    });
    audioSourcesRef.current.clear();
    setActiveAudioCount(0);

    // Stop recording but don't save
    await stopRecording();

    // Clean up and return home
    onEndSession();
  };

  // NEW: Return to home after success modal
  const returnToHome = () => {
    setShowSuccessModal(false);
    // Mark mini-module as completed if applicable
    if (config.isMiniModule && config.miniModuleId && onMiniModuleComplete) {
      onMiniModuleComplete(config.miniModuleId);
    }
    onEndSession();
  };

  const startAudioInput = () => {
    if (!inputAudioContextRef.current || !streamRef.current) return;

    const source = inputAudioContextRef.current.createMediaStreamSource(streamRef.current);
    audioInputSourceRef.current = source;

    const processor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
    scriptProcessorRef.current = processor;

    processor.onaudioprocess = (e) => {
      if (isMuted) return;

      const inputData = e.inputBuffer.getChannelData(0);
      const pcmBlob = createPcmBlob(inputData);

      if (sessionPromiseRef.current) {
        sessionPromiseRef.current.then(session => {
          session.sendRealtimeInput({ media: pcmBlob });
        });
      }
    };

    // Connect mic analyser for voice activity detection
    if (micAnalyserRef.current) {
      source.connect(micAnalyserRef.current);
    }

    source.connect(processor);
    processor.connect(inputAudioContextRef.current.destination);

    // Start voice activity detection
    startVoiceActivityDetection();
  };

  // Voice activity detection for waveform - improved with silence timeout
  const startVoiceActivityDetection = () => {
    // Higher threshold (45 instead of 15) to avoid picking up background noise
    const VOICE_THRESHOLD = 45;
    let lastSpeakingState = false;

    const checkVoiceActivity = () => {
      if (!micAnalyserRef.current) return;

      const dataArray = new Uint8Array(micAnalyserRef.current.frequencyBinCount);
      micAnalyserRef.current.getByteFrequencyData(dataArray);

      // Calculate average volume
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

      const nowSpeaking = average > VOICE_THRESHOLD && !isMuted;

      // If just started speaking, clear any silence timeout
      if (nowSpeaking && !lastSpeakingState) {
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }
        setIsSpeaking(true);
      }
      // If just stopped speaking, start silence timeout
      else if (!nowSpeaking && lastSpeakingState) {
        if (!silenceTimeoutRef.current) {
          silenceTimeoutRef.current = setTimeout(() => {
            setIsSpeaking(false);
            silenceTimeoutRef.current = null;
          }, SILENCE_TIMEOUT_MS);
        }
      }
      // Still speaking, keep state true
      else if (nowSpeaking) {
        setIsSpeaking(true);
      }

      lastSpeakingState = nowSpeaking;
      requestAnimationFrame(checkVoiceActivity);
    };

    checkVoiceActivity();
  };

  const startVideoInput = () => {
    const FPS = 1; 
    frameIntervalRef.current = window.setInterval(() => {
      if (!videoRef.current || !canvasRef.current || !isVideoEnabled) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx) return;

      canvas.width = video.videoWidth / 4;
      canvas.height = video.videoHeight / 4;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob(async (blob) => {
        if (blob && sessionPromiseRef.current) {
          const base64Data = await blobToBase64(blob);
          sessionPromiseRef.current.then(session => {
            session.sendRealtimeInput({
              media: {
                mimeType: 'image/jpeg',
                data: base64Data
              }
            });
          });
        }
      }, 'image/jpeg', 0.5);

    }, 1000 / FPS);
  };

  const playAudioChunk = async (base64Audio: string) => {
    // CRITICAL: Check session active flag FIRST (before any audio operations)
    if (!sessionActiveRef.current) {
      console.log('Session inactive, skipping audio playback');
      return;
    }

    if (!outputAudioContextRef.current) return;

    const ctx = outputAudioContextRef.current;

    // Don't create audio sources if context is closed
    if (ctx.state === 'closed') {
      console.warn('Audio context is closed, skipping audio playback');
      return;
    }

    try {
      const audioBuffer = await decodeAudioData(base64ToUint8Array(base64Audio), ctx);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;

      // Route audio through analyser
      if (analyserRef.current) {
          source.connect(analyserRef.current);
          analyserRef.current.connect(ctx.destination);
      } else {
          source.connect(ctx.destination);
      }

      const currentTime = ctx.currentTime;
      if (nextStartTimeRef.current < currentTime) {
        nextStartTimeRef.current = currentTime;
      }

      source.start(nextStartTimeRef.current);
      nextStartTimeRef.current += audioBuffer.duration;

      setActiveAudioCount(prev => prev + 1);

      source.onended = () => {
        setActiveAudioCount(prev => Math.max(0, prev - 1));
        audioSourcesRef.current.delete(source);
      };
      audioSourcesRef.current.add(source);
    } catch (error) {
      console.error('Error playing audio chunk:', error);
    }
  };

  // NEW: Speak text with Chatterbox TTS (Reeses Piecies voice)
  const speakWithCustomVoice = async (text: string) => {
    if (!sessionActiveRef.current) return;
    if (!ttsAvailable) {
      console.warn('Chatterbox TTS not available, falling back to no audio');
      return;
    }

    setIsSpeakingCustom(true);
    try {
      // Clean up the text (remove score markers, etc.)
      const cleanText = text
        .replace(/AGNES SCORE:?\s*\d+/gi, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      if (!cleanText) {
        setIsSpeakingCustom(false);
        return;
      }

      // Generate audio with Chatterbox TTS using Reeses Piecies voice
      const audioBuffer = await generateSpeech(cleanText, {
        voice: DEFAULT_FEEDBACK_VOICE, // 'reeses_piecies'
        exaggeration: 0.4
      });

      // Play the audio
      if (outputAudioContextRef.current && sessionActiveRef.current) {
        const ctx = outputAudioContextRef.current;
        if (ctx.state === 'closed') {
          setIsSpeakingCustom(false);
          return;
        }

        const audioData = await ctx.decodeAudioData(audioBuffer.slice(0));
        const source = ctx.createBufferSource();
        source.buffer = audioData;

        // Route through analyser for visualization
        if (analyserRef.current) {
          source.connect(analyserRef.current);
          analyserRef.current.connect(ctx.destination);
        } else {
          source.connect(ctx.destination);
        }

        source.start();
        audioSourcesRef.current.add(source);

        source.onended = () => {
          setIsSpeakingCustom(false);
          audioSourcesRef.current.delete(source);
        };
      }
    } catch (error) {
      console.error('Error speaking with custom voice:', error);
      setIsSpeakingCustom(false);
    }
  };

  return (
    <div className="relative h-screen w-full bg-black flex flex-col overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6 z-10 flex justify-between items-center bg-gradient-to-b from-black/90 to-transparent">
        <div className="flex items-center space-x-3">
           <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-red-600 animate-pulse' : 'bg-neutral-600'}`}></div>
           <span className="font-mono font-bold text-white tracking-widest text-lg">AGNES 21 <span className="text-red-600">//</span> LIVE</span>
           {isRecording && (
             <div className="flex items-center space-x-2 px-3 py-1 bg-red-600/20 border border-red-600/50 rounded-full animate-pulse">
               <Circle className="w-3 h-3 text-red-500 fill-red-500" />
               <span className="text-xs font-mono font-bold text-red-500 uppercase tracking-wider">REC</span>
             </div>
           )}
        </div>
        
        <div className="flex items-center space-x-4">
           {/* Gamification Badge */}
           <div className="hidden md:flex items-center space-x-2 px-3 py-1 rounded bg-neutral-900/80 border border-neutral-800 backdrop-blur">
              {config.difficulty === DifficultyLevel.BEGINNER && <Sparkles className="w-4 h-4 text-cyan-500" />}
              {config.difficulty === DifficultyLevel.ROOKIE && <Shield className="w-4 h-4 text-green-500" />}
              {config.difficulty === DifficultyLevel.PRO && <Zap className="w-4 h-4 text-yellow-500" />}
              {config.difficulty === DifficultyLevel.ELITE && <Skull className="w-4 h-4 text-red-600" />}
              {config.difficulty === DifficultyLevel.NIGHTMARE && <AlertTriangle className="w-4 h-4 text-orange-600" />}
              <span className={`font-mono text-xs font-bold ${getDifficultyColor()}`}>
                LVL: {config.difficulty}
              </span>
           </div>

           {/* Streak Counter */}
           <div className="hidden md:block">
             <StreakCounter key={streakKey} showCalendar={true} />
           </div>

           {/* XP Bar */}
           <div className="hidden md:block">
             <XPBar userId={user?.id} compact={true} />
           </div>

           {/* Sound Toggle */}
           <button
             onClick={() => {
               const newState = toggleSounds();
               setSoundsOn(newState);
             }}
             className="p-2 rounded-full bg-neutral-900/50 border border-neutral-800 hover:bg-neutral-800 hover:border-neutral-700 transition-all duration-300"
             title={soundsOn ? 'Mute celebration sounds' : 'Enable celebration sounds'}
             aria-label={soundsOn ? 'Mute celebration sounds' : 'Enable celebration sounds'}
           >
             {soundsOn ? (
               <Volume2 className="w-5 h-5 text-yellow-500" />
             ) : (
               <VolumeX className="w-5 h-5 text-neutral-500" />
             )}
           </button>

           {/* Custom Voice Toggle (Chatterbox TTS) - Always visible with status */}
           <button
             onClick={() => {
               if (ttsAvailable) {
                 setUseCustomVoice(!useCustomVoice);
               }
             }}
             className={`p-2 rounded-full transition-all duration-300 relative ${
               ttsAvailable === null
                 ? 'bg-neutral-900/50 border border-neutral-800 text-neutral-600 cursor-wait'
                 : !ttsAvailable
                 ? 'bg-neutral-900/50 border border-neutral-800 text-neutral-600 cursor-not-allowed opacity-50'
                 : useCustomVoice
                 ? 'bg-purple-600/30 border border-purple-500 text-purple-400 hover:bg-purple-600/50'
                 : 'bg-neutral-900/50 border border-neutral-800 text-neutral-500 hover:bg-neutral-800 hover:border-neutral-700 hover:text-white'
             }`}
             title={
               ttsAvailable === null
                 ? 'Checking custom voice availability...'
                 : !ttsAvailable
                 ? 'Custom voice unavailable (TTS backend not running)'
                 : useCustomVoice
                 ? 'Using Reeses Piecies custom voice (click for standard Gemini voice)'
                 : 'Switch to Reeses Piecies custom voice'
             }
             aria-label={
               ttsAvailable === null
                 ? 'Checking custom voice availability'
                 : !ttsAvailable
                 ? 'Custom voice unavailable - TTS backend not running'
                 : useCustomVoice
                 ? 'Switch to standard Gemini voice'
                 : 'Switch to Reeses Piecies custom voice'
             }
             disabled={!ttsAvailable}
           >
             <Wand2 className="w-5 h-5" />
             {ttsAvailable === false && (
               <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-black"></div>
             )}
             {useCustomVoice && ttsAvailable && (
               <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full border border-black animate-pulse"></div>
             )}
           </button>

           <button
             onClick={handleEndSession}
             className="group flex items-center space-x-2 px-4 py-2 bg-red-600/20 hover:bg-red-600 border border-red-500 hover:border-red-400 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-black"
             aria-label={`End training session${isRecording ? ' and save recording' : ''}. Press Enter or click to confirm.`}
           >
             {isRecording && (
               <Circle className="w-3 h-3 text-red-500 fill-red-500 animate-pulse group-hover:animate-none group-hover:text-white group-hover:fill-white" />
             )}
             <span className="text-sm font-mono font-bold text-red-500 group-hover:text-white uppercase tracking-wider">
               End Session
             </span>
             <X className="w-4 h-4 text-red-500 group-hover:text-white" />
           </button>

           {/* Keyboard Hints Toggle */}
           <button
             onClick={() => setShowKeyboardHints(!showKeyboardHints)}
             className="p-2 rounded-full bg-neutral-900/50 border border-neutral-800 hover:bg-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white transition-all duration-300"
             title="Show keyboard shortcuts (or press ?)"
           >
             <Keyboard className="w-5 h-5" />
           </button>
        </div>
      </div>

      {/* Main Visual Area */}
      <div className="flex-1 flex flex-col items-center justify-center relative p-6">
         
         {/* Visualizers Container */}
         <div className="w-full max-w-5xl grid md:grid-cols-2 gap-12 items-center justify-items-center mb-10">
             
             {/* LEFT: USER */}
             <div className="flex flex-col items-center space-y-6">
                {/* Video Preview Frame */}
                <div className="relative w-full max-w-md aspect-video bg-neutral-900 rounded-xl overflow-hidden border border-neutral-800 shadow-[0_0_40px_rgba(255,255,255,0.05)] group">
                    <video 
                    ref={videoRef} 
                    muted 
                    playsInline 
                    className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-500 ${!isVideoEnabled ? 'opacity-0' : 'opacity-100'}`} 
                    />
                    {!isVideoEnabled && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-500 space-y-2">
                        <VideoOff className="w-12 h-12" />
                        <span className="text-xs tracking-widest uppercase">Camera Off</span>
                    </div>
                    )}
                    <div className="absolute bottom-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded text-xs font-medium text-white/80 border border-white/10 flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                    <span>YOUR FEED</span>
                    </div>
                    <canvas ref={canvasRef} className="hidden" />
                </div>
                <Waveform isActive={isSpeaking} color="bg-white" label="YOUR VOICE" />
             </div>

             {/* RIGHT: AGNES 21 AVATAR */}
             <div className="flex flex-col items-center justify-center space-y-6">
                 <AgnesAvatar
                   isActive={aiSpeaking}
                   isListening={!aiSpeaking && isConnected}
                   analyser={analyserRef.current}
                 />

                 {/* Agnes State Indicator */}
                 <AgnesStateIndicator state={agnesState} />
             </div>
         </div>

         {/* Mic Level Meter - Positioned between user video and controls */}
         <div className="absolute bottom-32 left-8 w-full max-w-xs z-20">
           <MicLevelMeter analyser={micAnalyserRef.current} isActive={!isMuted && isConnected} />
         </div>
         
         {/* Transcript Overlay (LEFT) */}
         <div className={`absolute bottom-24 left-8 w-full max-w-md transition-all duration-500 ease-in-out ${isTranscriptExpanded ? 'h-[65vh] opacity-100' : 'h-14 opacity-90'} bg-neutral-900/90 backdrop-blur-xl border border-neutral-800 rounded-t-2xl overflow-hidden flex flex-col shadow-2xl z-30`}>
            <button
              onClick={() => setIsTranscriptExpanded(!isTranscriptExpanded)}
              className="w-full p-4 flex items-center justify-between text-neutral-400 hover:text-white border-b border-neutral-800 bg-neutral-900/50 hover:bg-neutral-800 transition-colors"
            >
               <div className="flex items-center space-x-2">
                 <MessageSquare className="w-4 h-4 text-blue-500" />
                 <span className="text-xs font-bold tracking-widest uppercase">Transcript</span>
                 {transcript.length > 0 && (
                   <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">{transcript.length}</span>
                 )}
               </div>
               {isTranscriptExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
            <div className="flex-1 p-4 overflow-y-auto space-y-3 scrollbar-hide">
               {transcript.length === 0 ? (
                 <div className="text-neutral-500 italic text-sm text-center mt-4">
                   Conversation will appear here...
                 </div>
               ) : (
                 transcript.map((msg, idx) => (
                   <div key={idx} className={`p-3 rounded-lg ${msg.role === 'agnes' ? 'bg-red-900/20 border border-red-800/30' : 'bg-neutral-800/50 border border-neutral-700'}`}>
                     <div className="flex items-center justify-between mb-1">
                       <span className={`text-xs font-bold tracking-wider ${msg.role === 'agnes' ? 'text-red-400' : 'text-white'}`}>
                         {msg.role === 'agnes' ? 'AGNES 21' : 'YOU'}
                       </span>
                       <span className="text-xs text-neutral-500">
                         {msg.timestamp.toLocaleTimeString()}
                       </span>
                     </div>
                     <div className="text-sm text-neutral-300 whitespace-pre-wrap">
                       {msg.text}
                     </div>
                     {msg.score !== undefined && (
                       <div className={`mt-2 px-2 py-1 rounded text-xs font-bold inline-block ${
                         msg.score >= 80 ? 'bg-green-500/20 text-green-400' :
                         msg.score >= 60 ? 'bg-yellow-500/20 text-yellow-400' :
                         'bg-red-500/20 text-red-400'
                       }`}>
                         SCORE: {msg.score}/100
                       </div>
                     )}
                   </div>
                 ))
               )}
            </div>
         </div>

         {/* Script Overlay (RIGHT) */}
         <div className={`absolute bottom-24 right-8 w-full max-w-md transition-all duration-500 ease-in-out ${isScriptExpanded ? 'h-[65vh] opacity-100' : 'h-14 opacity-90'} bg-neutral-900/90 backdrop-blur-xl border border-neutral-800 rounded-t-2xl overflow-hidden flex flex-col shadow-2xl z-30`}>
            <button
              onClick={() => setIsScriptExpanded(!isScriptExpanded)}
              className="w-full p-4 flex items-center justify-between text-neutral-400 hover:text-white border-b border-neutral-800 bg-neutral-900/50 hover:bg-neutral-800 transition-colors"
            >
               <div className="flex items-center space-x-2">
                 <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                 <span className="text-xs font-bold tracking-widest uppercase">Script Assist</span>
               </div>
               {isScriptExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
            <div className="flex-1 p-6 overflow-y-auto text-neutral-300 leading-relaxed whitespace-pre-wrap font-sans text-base scrollbar-hide selection:bg-red-900/50 selection:text-white">
               {config.script || <span className="text-neutral-500 italic">No script selected for this session.</span>}
            </div>
         </div>
      </div>

      {/* Bottom Controls */}
      <div className="h-24 bg-black border-t border-neutral-900 flex items-center justify-center space-x-8 z-20">
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className={`p-5 rounded-full transition-all duration-300 ${isMuted ? 'bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]' : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:bg-neutral-800 hover:border-neutral-700 hover:text-white'}`}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>
          
          <button 
            onClick={() => setIsVideoEnabled(!isVideoEnabled)}
            className={`p-5 rounded-full transition-all duration-300 ${!isVideoEnabled ? 'bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]' : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:bg-neutral-800 hover:border-neutral-700 hover:text-white'}`}
          >
            {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </button>

          {/* Score Me Button */}
          <div className="ml-8 border-l border-neutral-800 pl-8 flex items-center space-x-4">
             <button
               onClick={handleScoreMe}
               disabled={isRequestingScore || !isConnected}
               className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                 isRequestingScore
                   ? 'bg-yellow-600/50 text-yellow-300 cursor-wait'
                   : 'bg-yellow-600 hover:bg-yellow-500 text-white shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:shadow-[0_0_30px_rgba(234,179,8,0.5)]'
               } disabled:opacity-50 disabled:cursor-not-allowed`}
               title="Get your score from Agnes"
             >
               <Trophy className="w-5 h-5" />
               <span className="text-xs font-bold tracking-widest uppercase">
                 {isRequestingScore ? 'Scoring...' : 'Score Me'}
               </span>
             </button>

             {/* Current Score Display */}
             {currentScore !== null && (
               <div className={`px-3 py-2 rounded-lg text-sm font-bold ${
                 currentScore >= 80 ? 'bg-green-600/20 text-green-400 border border-green-600/50' :
                 currentScore >= 60 ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-600/50' :
                 'bg-red-600/20 text-red-400 border border-red-600/50'
               }`}>
                 Score: {currentScore}/100
               </div>
             )}

             {/* ARIA Live Region for Score Updates */}
             <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
               {currentScore !== null && `Agnes scored your performance: ${currentScore} out of 100`}
             </div>
          </div>
      </div>
      
      {error && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-red-600/90 backdrop-blur text-white px-6 py-3 rounded-lg shadow-xl font-medium border border-red-500 flex items-center space-x-2 animate-bounce z-50">
          <X className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Keyboard Shortcuts Panel */}
      {showKeyboardHints && (
        <div className="absolute top-24 right-8 bg-neutral-900/95 backdrop-blur-xl border border-neutral-800 rounded-xl p-6 shadow-2xl z-50 max-w-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold tracking-wider text-sm flex items-center space-x-2">
              <Keyboard className="w-4 h-4 text-blue-400" />
              <span>KEYBOARD SHORTCUTS</span>
            </h3>
            <button
              onClick={() => setShowKeyboardHints(false)}
              className="text-neutral-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between py-2 border-b border-neutral-800">
              <span className="text-neutral-400">Toggle Mute</span>
              <kbd className="px-2 py-1 bg-neutral-800 border border-neutral-700 rounded text-white font-mono text-xs">M</kbd>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-neutral-800">
              <span className="text-neutral-400">Toggle Video</span>
              <kbd className="px-2 py-1 bg-neutral-800 border border-neutral-700 rounded text-white font-mono text-xs">V</kbd>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-neutral-800">
              <span className="text-neutral-400">Toggle Script</span>
              <kbd className="px-2 py-1 bg-neutral-800 border border-neutral-700 rounded text-white font-mono text-xs">S</kbd>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-neutral-800">
              <span className="text-neutral-400">Toggle Transcript</span>
              <kbd className="px-2 py-1 bg-neutral-800 border border-neutral-700 rounded text-white font-mono text-xs">T</kbd>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-neutral-800">
              <span className="text-neutral-400">
                Toggle Custom Voice
                {!ttsAvailable && <span className="text-red-400 text-xs ml-1">(disabled)</span>}
              </span>
              <kbd className="px-2 py-1 bg-neutral-800 border border-neutral-700 rounded text-white font-mono text-xs">C</kbd>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-neutral-800">
              <span className="text-neutral-400">End Session</span>
              <kbd className="px-2 py-1 bg-neutral-800 border border-neutral-700 rounded text-white font-mono text-xs">ESC</kbd>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-neutral-400">Show/Hide Shortcuts</span>
              <kbd className="px-2 py-1 bg-neutral-800 border border-neutral-700 rounded text-white font-mono text-xs">?</kbd>
            </div>
          </div>
        </div>
      )}

      {/* End Session Confirmation Modal */}
      {showEndSessionModal && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby="end-session-title"
          aria-describedby="end-session-description"
        >
          <div
            className="bg-neutral-900 rounded-xl border border-neutral-800 max-w-lg w-full p-6 space-y-6"
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setShowEndSessionModal(false);
              }
            }}
          >
            {/* Header */}
            <div className="text-center">
              <h2 id="end-session-title" className="text-2xl font-bold text-white mb-2">End Training Session?</h2>
              <p id="end-session-description" className="text-neutral-400 text-sm">
                Your session will be saved with {transcript.length} messages
              </p>
            </div>

            {/* Session Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-700">
                <div className="text-neutral-400 text-xs mb-1">Duration</div>
                <div className="text-white font-bold">
                  {Math.floor((Date.now() - sessionStartTime.getTime()) / 60000)}m
                </div>
              </div>
              <div className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-700">
                <div className="text-neutral-400 text-xs mb-1">Current Score</div>
                <div className={`font-bold ${
                  currentScore && currentScore >= 80 ? 'text-green-400' :
                  currentScore && currentScore >= 60 ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {currentScore || 'N/A'}
                </div>
              </div>
            </div>

            {/* Recording Status */}
            {isRecording && (
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Video className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-semibold text-purple-400">Video Recording Active</span>
                </div>
                <p className="text-xs text-neutral-400">
                  Your session recording will be saved and available for playback in Session History
                </p>
              </div>
            )}

            {/* Auto-Score Option */}
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-semibold text-yellow-400">Get Final Score?</span>
              </div>
              <p className="text-xs text-neutral-400">
                Have Agnes provide a final performance score and feedback before ending the session.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleEndWithScore}
                disabled={isRequestingScore}
                className={`w-full px-4 py-3 rounded-lg transition-colors font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900 ${
                  isRequestingScore
                    ? 'bg-yellow-600/50 text-yellow-200 cursor-wait'
                    : 'bg-yellow-600 hover:bg-yellow-500 text-white focus:ring-yellow-500'
                }`}
                aria-label="Get final score from Agnes then end session"
                autoFocus
              >
                <div className="flex items-center justify-center space-x-2">
                  <Trophy className="w-5 h-5" />
                  <span>{isRequestingScore ? 'Getting Score...' : 'Score & End Session'}</span>
                </div>
              </button>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowEndSessionModal(false)}
                  className="flex-1 px-4 py-3 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 focus:ring-offset-neutral-900"
                  aria-label="Cancel and return to training session"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmEndSession}
                  className="flex-1 px-4 py-3 bg-neutral-700 hover:bg-neutral-600 border border-neutral-600 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 focus:ring-offset-neutral-900"
                  aria-label="End session without scoring"
                >
                  End Without Scoring
                </button>
              </div>
            </div>

            {/* Optional: Discard Button */}
            <button
              onClick={discardSession}
              className="w-full text-xs text-neutral-500 hover:text-red-400 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-neutral-900 rounded"
              aria-label="Discard session without saving"
            >
              Discard session without saving
            </button>
          </div>
        </div>
      )}

      {/* Post-Session Success Modal */}
      {showSuccessModal && (
        <div
          className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby="success-title"
          aria-describedby="success-description"
        >
          <div
            className="bg-neutral-900 rounded-xl border border-green-500/30 max-w-md w-full p-8 space-y-6 text-center"
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                returnToHome();
              }
            }}
          >
            {/* Success Icon */}
            <div className="w-20 h-20 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
              <Trophy className="w-10 h-10 text-green-400" />
            </div>

            {/* Title */}
            <div>
              <h2 id="success-title" className="text-2xl font-bold text-white mb-2">Session Saved!</h2>
              <p id="success-description" className="text-lg text-green-400 font-bold">
                {currentScore !== undefined ? `Final Score: ${currentScore}/100` : 'Training session completed successfully'}
              </p>
            </div>

            {/* Stats */}
            <div className="space-y-3 text-left">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-400">Session Duration:</span>
                <span className="text-white font-semibold">
                  {Math.floor((Date.now() - sessionStartTime.getTime()) / 60000)}m
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-400">Messages:</span>
                <span className="text-white font-semibold">{transcript.length}</span>
              </div>
              {videoSaved && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-400">Video Recording:</span>
                  <span className="text-green-400 font-semibold flex items-center gap-1">
                    <Video className="w-3 h-3" /> Saved
                  </span>
                </div>
              )}
            </div>

            {/* Achievements/Streak Updates */}
            {newAchievements.length > 0 && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <p className="text-yellow-400 font-semibold mb-2">🏆 New Achievements!</p>
                {newAchievements.map((achievement, idx) => (
                  <p key={idx} className="text-sm text-neutral-300">{achievement}</p>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={returnToHome}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-semibold focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-neutral-900"
                aria-label="Close and return to home screen"
                autoFocus
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Level Up Modal */}
      <LevelUpModal
        show={showLevelUpModal}
        previousLevel={levelUpData.previous}
        newLevel={levelUpData.new}
        unlocksAtThisLevel={levelUpData.unlocks}
        onClose={() => setShowLevelUpModal(false)}
        userId={user?.id}
      />

      {/* Celebration Animations */}
      <Confetti
        show={showConfetti}
        onComplete={() => setShowConfetti(false)}
      />
      <SparklesComponent
        show={showSparkles}
        intensity={currentScore && currentScore >= 95 ? 'high' : 'medium'}
      />
    </div>
  );
};

export default PitchTrainer;
