/**
 * ConversationTranscript Component
 * Real-time transcript display for Agnes the Linguist
 */

import React, { useEffect, useRef } from 'react';
import { SupportedLanguage, SUPPORTED_LANGUAGES } from '../types';
import { User, Home, Volume2 } from 'lucide-react';

// ============================================
// Types
// ============================================

export interface TranscriptEntry {
  id: string;
  speaker: 'rep' | 'homeowner' | 'agnes';
  originalText: string;
  originalLang: SupportedLanguage;
  translatedText?: string;
  translatedLang?: SupportedLanguage;
  timestamp: Date;
}

interface ConversationTranscriptProps {
  entries: TranscriptEntry[];
  onSpeak?: (text: string, lang: SupportedLanguage) => void;
  className?: string;
}

// ============================================
// Helper Functions
// ============================================

const getLanguageFlag = (code: SupportedLanguage): string => {
  const lang = SUPPORTED_LANGUAGES.find(l => l.code === code);
  return lang?.flag || '';
};

const getLanguageName = (code: SupportedLanguage): string => {
  const lang = SUPPORTED_LANGUAGES.find(l => l.code === code);
  return lang?.name || code;
};

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
};

// ============================================
// Speaker Badge Component
// ============================================

interface SpeakerBadgeProps {
  speaker: 'rep' | 'homeowner' | 'agnes';
  lang?: SupportedLanguage;
}

const SpeakerBadge: React.FC<SpeakerBadgeProps> = ({ speaker, lang }) => {
  const getConfig = () => {
    switch (speaker) {
      case 'rep':
        return {
          icon: <User className="w-3 h-3" />,
          label: 'Rep',
          bgColor: 'bg-blue-500/20',
          borderColor: 'border-blue-500/40',
          textColor: 'text-blue-400',
        };
      case 'homeowner':
        return {
          icon: <Home className="w-3 h-3" />,
          label: 'Homeowner',
          bgColor: 'bg-green-500/20',
          borderColor: 'border-green-500/40',
          textColor: 'text-green-400',
        };
      case 'agnes':
        return {
          icon: null,
          label: 'Agnes',
          bgColor: 'bg-purple-500/20',
          borderColor: 'border-purple-500/40',
          textColor: 'text-purple-400',
        };
    }
  };

  const config = getConfig();

  return (
    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${config.bgColor} border ${config.borderColor}`}>
      {config.icon}
      <span className={`text-xs font-medium ${config.textColor}`}>{config.label}</span>
      {lang && <span className="text-xs ml-1">{getLanguageFlag(lang)}</span>}
    </div>
  );
};

// ============================================
// Transcript Entry Component
// ============================================

interface TranscriptEntryItemProps {
  entry: TranscriptEntry;
  onSpeak?: (text: string, lang: SupportedLanguage) => void;
}

const TranscriptEntryItem: React.FC<TranscriptEntryItemProps> = ({
  entry,
  onSpeak,
}) => {
  const getBgColor = () => {
    switch (entry.speaker) {
      case 'rep':
        return 'bg-blue-900/10 border-l-blue-500';
      case 'homeowner':
        return 'bg-green-900/10 border-l-green-500';
      case 'agnes':
        return 'bg-purple-900/10 border-l-purple-500';
    }
  };

  return (
    <div className={`p-3 rounded-lg border-l-2 ${getBgColor()} mb-3`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <SpeakerBadge speaker={entry.speaker} lang={entry.originalLang} />
        <span className="text-xs text-neutral-500">{formatTime(entry.timestamp)}</span>
      </div>

      {/* Original text */}
      <div className="mb-2">
        <p className="text-white text-sm leading-relaxed">"{entry.originalText}"</p>
      </div>

      {/* Translation (if exists) */}
      {entry.translatedText && entry.translatedLang && (
        <div className="flex items-start gap-2 pt-2 border-t border-neutral-700/50">
          <span className="text-neutral-500 text-xs shrink-0">
            {getLanguageFlag(entry.translatedLang)}
          </span>
          <p className="text-neutral-300 text-sm italic leading-relaxed">
            "{entry.translatedText}"
          </p>
          {onSpeak && (
            <button
              onClick={() => onSpeak(entry.translatedText!, entry.translatedLang!)}
              className="shrink-0 p-1 hover:bg-neutral-700 rounded transition-colors"
              title="Speak translation"
            >
              <Volume2 className="w-3 h-3 text-neutral-400" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================
// Main Transcript Component
// ============================================

const ConversationTranscript: React.FC<ConversationTranscriptProps> = ({
  entries,
  onSpeak,
  className = '',
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new entries are added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries.length]);

  if (entries.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-8 text-center ${className}`}>
        <div className="text-neutral-500 text-sm">
          Transcript will appear here as the conversation progresses
        </div>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className={`overflow-y-auto ${className}`}
    >
      {entries.map(entry => (
        <TranscriptEntryItem
          key={entry.id}
          entry={entry}
          onSpeak={onSpeak}
        />
      ))}
    </div>
  );
};

export default ConversationTranscript;

// ============================================
// Live Typing Indicator
// ============================================

interface TypingIndicatorProps {
  speaker: 'rep' | 'homeowner';
  text: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  speaker,
  text,
}) => {
  if (!text) return null;

  const getBgColor = () => {
    return speaker === 'rep'
      ? 'bg-blue-900/20 border-blue-500/30'
      : 'bg-green-900/20 border-green-500/30';
  };

  return (
    <div className={`p-3 rounded-lg border ${getBgColor()} mb-3`}>
      <div className="flex items-center gap-2 mb-1">
        <SpeakerBadge speaker={speaker} />
        <span className="text-xs text-neutral-500 animate-pulse">typing...</span>
      </div>
      <p className="text-neutral-400 text-sm italic">"{text}"</p>
    </div>
  );
};
