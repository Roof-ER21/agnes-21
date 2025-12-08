/**
 * AudioWaveform Component
 * Animated waveform visualizer for Agnes the Linguist
 */

import React, { useEffect, useState } from 'react';

interface AudioWaveformProps {
  isActive: boolean;
  status: 'idle' | 'listening' | 'speaking' | 'translating';
  className?: string;
}

const AudioWaveform: React.FC<AudioWaveformProps> = ({
  isActive,
  status,
  className = '',
}) => {
  const [bars, setBars] = useState<number[]>(Array(12).fill(0.3));

  useEffect(() => {
    if (!isActive || status === 'idle') {
      // Reset to idle state
      setBars(Array(12).fill(0.3));
      return;
    }

    // Animate bars based on status
    const interval = setInterval(() => {
      setBars(prevBars =>
        prevBars.map((_, i) => {
          if (status === 'listening') {
            // More active animation when listening
            return 0.2 + Math.random() * 0.8;
          } else if (status === 'speaking') {
            // Rhythmic animation when speaking
            const time = Date.now() / 200;
            return 0.3 + Math.sin(time + i * 0.5) * 0.4 + Math.random() * 0.2;
          } else if (status === 'translating') {
            // Pulsing animation when translating
            const time = Date.now() / 300;
            return 0.4 + Math.sin(time) * 0.3;
          }
          return 0.3;
        })
      );
    }, 80);

    return () => clearInterval(interval);
  }, [isActive, status]);

  // Status colors
  const getBarColor = () => {
    switch (status) {
      case 'listening':
        return 'bg-cyan-500';
      case 'speaking':
        return 'bg-green-500';
      case 'translating':
        return 'bg-yellow-500';
      default:
        return 'bg-neutral-600';
    }
  };

  const getGlowColor = () => {
    switch (status) {
      case 'listening':
        return 'shadow-cyan-500/50';
      case 'speaking':
        return 'shadow-green-500/50';
      case 'translating':
        return 'shadow-yellow-500/50';
      default:
        return '';
    }
  };

  return (
    <div className={`flex items-center justify-center gap-1 h-16 ${className}`}>
      {bars.map((height, i) => (
        <div
          key={i}
          className={`w-1.5 rounded-full transition-all duration-75 ${getBarColor()} ${
            isActive ? `shadow-lg ${getGlowColor()}` : ''
          }`}
          style={{
            height: `${Math.max(8, height * 60)}px`,
            opacity: isActive ? 1 : 0.4,
          }}
        />
      ))}
    </div>
  );
};

export default AudioWaveform;

// ============================================
// Status Indicator Component
// ============================================

interface StatusIndicatorProps {
  status: 'idle' | 'listening' | 'speaking' | 'translating' | 'detecting' | 'introducing';
  detectedLanguage?: string;
  languageFlag?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  detectedLanguage,
  languageFlag,
}) => {
  const getStatusText = () => {
    switch (status) {
      case 'idle':
        return 'Ready to start';
      case 'detecting':
        return 'Detecting language...';
      case 'listening':
        return 'Listening...';
      case 'speaking':
        return 'Speaking...';
      case 'translating':
        return 'Translating...';
      case 'introducing':
        return 'Introducing to homeowner...';
      default:
        return '';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'listening':
      case 'detecting':
        return 'text-cyan-400';
      case 'speaking':
        return 'text-green-400';
      case 'translating':
        return 'text-yellow-400';
      case 'introducing':
        return 'text-purple-400';
      default:
        return 'text-neutral-400';
    }
  };

  const getPulseClass = () => {
    if (status === 'idle') return '';
    return 'animate-pulse';
  };

  return (
    <div className="text-center space-y-2">
      <div className={`text-sm font-mono uppercase tracking-wider ${getStatusColor()} ${getPulseClass()}`}>
        {getStatusText()}
      </div>
      {detectedLanguage && (
        <div className="flex items-center justify-center gap-2 text-xs text-neutral-300">
          <span>Detected:</span>
          <span className="font-semibold">{detectedLanguage}</span>
          {languageFlag && <span className="text-lg">{languageFlag}</span>}
        </div>
      )}
    </div>
  );
};

// ============================================
// Agnes Message Display
// ============================================

interface AgnesMessageProps {
  message: string;
  isVisible: boolean;
}

export const AgnesMessage: React.FC<AgnesMessageProps> = ({
  message,
  isVisible,
}) => {
  if (!isVisible || !message) return null;

  return (
    <div className="mt-4 p-3 bg-purple-900/30 border border-purple-500/30 rounded-lg">
      <div className="flex items-start gap-2">
        <span className="text-purple-400 font-semibold text-sm">Agnes:</span>
        <p className="text-purple-100 text-sm leading-relaxed">{message}</p>
      </div>
    </div>
  );
};
