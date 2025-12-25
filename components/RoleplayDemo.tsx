/**
 * RoleplayDemo Component
 * Plays pre-generated AI-to-AI roleplay demonstrations showing different quality levels
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Star,
  Award,
  TrendingUp,
  TrendingDown,
  XCircle,
  CheckCircle,
  ArrowLeft
} from 'lucide-react';

// Demo quality levels with scoring info
const DEMO_LEVELS = [
  {
    id: 'excellent',
    name: 'Excellent',
    score: '90/100',
    color: 'from-green-500 to-emerald-600',
    bgColor: 'bg-green-500/20',
    borderColor: 'border-green-500',
    icon: Award,
    description: 'Perfect delivery with all 5 non-negotiables, strong close, natural flow',
    characteristics: [
      'Name introduction within 5 seconds',
      'Company mention with value proposition',
      'Relatable neighborhood reference',
      'Clear purpose (inspection)',
      'Strong assumptive close'
    ]
  },
  {
    id: 'good',
    name: 'Good',
    score: '70/100',
    color: 'from-blue-500 to-cyan-600',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500',
    icon: TrendingUp,
    description: 'All elements present but room for improvement in delivery',
    characteristics: [
      'Covers all non-negotiables',
      'Slightly rushed delivery',
      'Could be more conversational',
      'Close could be stronger',
      'Good foundation to build on'
    ]
  },
  {
    id: 'bad',
    name: 'Needs Work',
    score: '40/100',
    color: 'from-yellow-500 to-orange-600',
    bgColor: 'bg-yellow-500/20',
    borderColor: 'border-yellow-500',
    icon: TrendingDown,
    description: 'Missing 2-3 non-negotiables, weak close attempt',
    characteristics: [
      'Skips company introduction',
      'No relatability element',
      'Weak or missing close',
      'Too scripted/robotic',
      'Needs more practice'
    ]
  },
  {
    id: 'awful',
    name: 'Door Slam',
    score: '15/100',
    color: 'from-red-500 to-rose-600',
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500',
    icon: XCircle,
    description: 'Pushy, no intro, defensive behavior leads to door slam',
    characteristics: [
      'No personal introduction',
      'Immediately pushy/salesy',
      'Ignores homeowner concerns',
      'Gets defensive when rejected',
      'Results in door slam'
    ]
  }
];

// Demo scripts with transcript
const DEMO_SCRIPTS: Record<string, Array<{ speaker: 'salesperson' | 'homeowner'; text: string; emotion?: string }>> = {
  excellent: [
    { speaker: 'salesperson', text: "Good morning! My name is Marcus with Roof-ER. How are you today?" },
    { speaker: 'homeowner', text: "Oh, I'm alright. A bit busy though." },
    { speaker: 'salesperson', text: "I totally understand - I'll be quick! I'm just out here because we're doing free storm damage inspections in the neighborhood after last week's hail. Your neighbor across the street, the Johnsons, actually just had their roof inspected and we found some damage their insurance is covering completely." },
    { speaker: 'homeowner', text: "Oh really? I didn't know there was hail damage around here." },
    { speaker: 'salesperson', text: "Yeah, it's pretty common after storms like we had. The damage isn't always visible from the ground. Would you mind if I took a quick 10-minute look at your roof? Totally free, no obligation. I just want to make sure you're protected." },
    { speaker: 'homeowner', text: "Sure, go ahead and take a look.", emotion: 'positive' }
  ],
  good: [
    { speaker: 'salesperson', text: "Hi there! I'm Marcus from Roof-ER. We're out doing roof inspections in the neighborhood." },
    { speaker: 'homeowner', text: "Okay... what for?" },
    { speaker: 'salesperson', text: "Well, there was a storm last week and we're checking for damage. Your neighbor mentioned they might have some issues so we're going around to help everyone out." },
    { speaker: 'homeowner', text: "I see. We haven't noticed anything wrong with our roof." },
    { speaker: 'salesperson', text: "That's good! Most storm damage isn't visible from the ground though. Would it be okay if I just took a quick look? It's free and only takes about 10 minutes." },
    { speaker: 'homeowner', text: "I guess that would be alright.", emotion: 'neutral' }
  ],
  bad: [
    { speaker: 'salesperson', text: "Hey there. So we're doing roof inspections today. You interested?" },
    { speaker: 'homeowner', text: "Uh, who are you with?" },
    { speaker: 'salesperson', text: "Oh yeah, Roof-ER. Anyway, there was a storm and your roof probably has damage. Can I check it out?" },
    { speaker: 'homeowner', text: "I don't know, we're pretty busy right now..." },
    { speaker: 'salesperson', text: "It'll only take a few minutes. You really should get it looked at before it gets worse." },
    { speaker: 'homeowner', text: "Maybe another time.", emotion: 'hesitant' }
  ],
  awful: [
    { speaker: 'salesperson', text: "Hey, you need a new roof. We're the best company around." },
    { speaker: 'homeowner', text: "Excuse me? Who are you?" },
    { speaker: 'salesperson', text: "Doesn't matter. Your roof is definitely damaged. Everyone in this neighborhood is getting work done. Sign up now before spots fill up." },
    { speaker: 'homeowner', text: "No thanks, I'm not interested." },
    { speaker: 'salesperson', text: "Come on, everyone's doing it. You'd be crazy to pass this up. Your roof is definitely damaged, trust me." },
    { speaker: 'homeowner', text: "Please leave. I said I'm not interested.", emotion: 'angry' },
    { speaker: 'salesperson', text: "But—" },
    { speaker: 'homeowner', text: "[Door slams]", emotion: 'door_slam' }
  ]
};

interface Props {
  onBack?: () => void;
}

const RoleplayDemo: React.FC<Props> = ({ onBack }) => {
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLine, setCurrentLine] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const selectedDemo = DEMO_LEVELS.find(d => d.id === selectedLevel);
  const script = selectedLevel ? DEMO_SCRIPTS[selectedLevel] : [];

  // Simulate playback with transcript highlighting
  useEffect(() => {
    if (isPlaying && script.length > 0) {
      intervalRef.current = setInterval(() => {
        setCurrentLine(prev => {
          const next = prev + 1;
          if (next >= script.length) {
            setIsPlaying(false);
            return 0;
          }
          setProgress((next / script.length) * 100);
          return next;
        });
      }, 3000); // 3 seconds per line
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, script.length]);

  const handlePlay = () => {
    setIsPlaying(true);
    setCurrentLine(0);
    setProgress(0);
    // In production, this would play the pre-generated audio files
    // For now, we simulate with transcript highlighting
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleRestart = () => {
    setCurrentLine(0);
    setProgress(0);
    setIsPlaying(true);
  };

  const handleSkip = () => {
    setCurrentLine(prev => Math.min(prev + 1, script.length - 1));
    setProgress(((currentLine + 1) / script.length) * 100);
  };

  if (!selectedLevel) {
    // Level selection view
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Training
            </button>
          )}

          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Roleplay Demonstrations
            </h1>
            <p className="text-gray-400 text-lg">
              Watch AI-to-AI examples of different pitch quality levels
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {DEMO_LEVELS.map((level) => {
              const Icon = level.icon;
              return (
                <button
                  key={level.id}
                  onClick={() => setSelectedLevel(level.id)}
                  className={`p-6 rounded-2xl border-2 ${level.borderColor} ${level.bgColor}
                    hover:scale-[1.02] transition-all duration-300 text-left group`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${level.color}`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span className={`text-2xl font-bold bg-gradient-to-r ${level.color} bg-clip-text text-transparent`}>
                      {level.score}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2">{level.name}</h3>
                  <p className="text-gray-400 text-sm mb-4">{level.description}</p>

                  <div className="flex items-center gap-2 text-sm text-gray-500 group-hover:text-gray-400 transition-colors">
                    <Play className="w-4 h-4" />
                    <span>Click to watch demo</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-8 p-6 bg-slate-800/50 rounded-2xl border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400" />
              How to Use These Demos
            </h3>
            <ul className="space-y-2 text-gray-400">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                Watch each level to understand the scoring criteria
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                Notice the difference in approach between levels
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                Practice matching the "Excellent" level in your own training
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Demo playback view
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => setSelectedLevel(null)}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Levels
        </button>

        {/* Header with score */}
        <div className={`p-6 rounded-2xl ${selectedDemo?.bgColor} border-2 ${selectedDemo?.borderColor} mb-6`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {selectedDemo && (
                <div className={`p-3 rounded-xl bg-gradient-to-br ${selectedDemo.color}`}>
                  <selectedDemo.icon className="w-8 h-8 text-white" />
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold text-white">{selectedDemo?.name} Level</h2>
                <p className="text-gray-400">{selectedDemo?.description}</p>
              </div>
            </div>
            <div className={`text-4xl font-bold bg-gradient-to-r ${selectedDemo?.color} bg-clip-text text-transparent`}>
              {selectedDemo?.score}
            </div>
          </div>
        </div>

        {/* Transcript */}
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 mb-6 overflow-hidden">
          <div className="p-4 border-b border-slate-700">
            <h3 className="text-lg font-semibold text-white">Conversation Transcript</h3>
          </div>
          <div className="p-4 max-h-[400px] overflow-y-auto space-y-4">
            {script.map((line, index) => (
              <div
                key={index}
                className={`flex ${line.speaker === 'salesperson' ? 'justify-end' : 'justify-start'}
                  transition-all duration-300 ${currentLine === index && isPlaying ? 'scale-105' : 'opacity-60'}`}
              >
                <div
                  className={`max-w-[80%] p-4 rounded-2xl ${
                    line.speaker === 'salesperson'
                      ? 'bg-blue-600/30 border border-blue-500/50 rounded-br-sm'
                      : 'bg-purple-600/30 border border-purple-500/50 rounded-bl-sm'
                  } ${currentLine === index && isPlaying ? 'ring-2 ring-white/50' : ''}`}
                >
                  <div className="text-xs text-gray-400 mb-1 flex items-center gap-2">
                    <span className="font-semibold">
                      {line.speaker === 'salesperson' ? '21 (Salesperson)' : 'Agnes (Homeowner)'}
                    </span>
                    {line.emotion && (
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        line.emotion === 'positive' ? 'bg-green-500/30 text-green-300' :
                        line.emotion === 'angry' || line.emotion === 'door_slam' ? 'bg-red-500/30 text-red-300' :
                        'bg-gray-500/30 text-gray-300'
                      }`}>
                        {line.emotion}
                      </span>
                    )}
                  </div>
                  <p className="text-white">{line.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Playback controls */}
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
          {/* Progress bar */}
          <div className="mb-4">
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${selectedDemo?.color} transition-all duration-300`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handleRestart}
              className="p-3 rounded-full bg-slate-700 hover:bg-slate-600 transition-colors"
            >
              <SkipBack className="w-5 h-5 text-white" />
            </button>

            <button
              onClick={isPlaying ? handlePause : handlePlay}
              className={`p-4 rounded-full bg-gradient-to-r ${selectedDemo?.color} hover:opacity-90 transition-opacity`}
            >
              {isPlaying ? (
                <Pause className="w-8 h-8 text-white" />
              ) : (
                <Play className="w-8 h-8 text-white" />
              )}
            </button>

            <button
              onClick={handleSkip}
              className="p-3 rounded-full bg-slate-700 hover:bg-slate-600 transition-colors"
            >
              <SkipForward className="w-5 h-5 text-white" />
            </button>

            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-3 rounded-full bg-slate-700 hover:bg-slate-600 transition-colors ml-4"
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-white" />
              ) : (
                <Volume2 className="w-5 h-5 text-white" />
              )}
            </button>
          </div>

          <p className="text-center text-gray-500 text-sm mt-4">
            {isPlaying ? 'Playing demo...' : 'Click play to start the demonstration'}
          </p>
        </div>

        {/* Key characteristics */}
        <div className="mt-6 p-6 bg-slate-800/50 rounded-2xl border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">What to Notice</h3>
          <ul className="space-y-2">
            {selectedDemo?.characteristics.map((char, index) => (
              <li key={index} className="flex items-start gap-2 text-gray-400">
                {selectedDemo.id === 'excellent' || selectedDemo.id === 'good' ? (
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                )}
                {char}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RoleplayDemo;
