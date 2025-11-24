import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getSessions, deleteSession, SessionData } from '../utils/sessionStorage';
import { hasVideoRecording } from '../utils/videoStorage';
import { DifficultyLevel, PitchMode } from '../types';
import ScoreTrendGraph from './ScoreTrendGraph';
import SessionPDFExport from './SessionPDFExport';
import AchievementsPanel from './AchievementsPanel';
import VideoStorageStats from './VideoStorageStats';
import { VideoPlayer } from './VideoPlayer';
import { Calendar, Clock, Trophy, Trash2, ChevronDown, ChevronUp, MessageSquare, X, ArrowLeft, FileDown, Video } from 'lucide-react';

interface SessionHistoryProps {
  onBack: () => void;
}

const SessionHistory: React.FC<SessionHistoryProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<SessionData[]>([]);
  const [selectedSession, setSelectedSession] = useState<SessionData | null>(null);
  const [sessionToExport, setSessionToExport] = useState<SessionData | null>(null);
  const [sessionsWithVideo, setSessionsWithVideo] = useState<Set<string>>(new Set());
  const [sessionToPlay, setSessionToPlay] = useState<string | null>(null);

  // Filters
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [modeFilter, setModeFilter] = useState<string>('all');
  const [scoreFilter, setScoreFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadSessions();
    checkVideoAvailability();
  }, []);

  const checkVideoAvailability = async () => {
    const loadedSessions = getSessions(user?.id);
    const videoSet = new Set<string>();

    for (const session of loadedSessions) {
      const hasVideo = await hasVideoRecording(session.sessionId, user?.id);
      if (hasVideo) {
        videoSet.add(session.sessionId);
      }
    }

    setSessionsWithVideo(videoSet);
  };

  useEffect(() => {
    applyFilters();
  }, [sessions, difficultyFilter, modeFilter, scoreFilter, sortBy, sortOrder]);

  const loadSessions = () => {
    const loadedSessions = getSessions(user?.id);
    setSessions(loadedSessions);
  };

  const applyFilters = () => {
    let filtered = [...sessions];

    // Difficulty filter
    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(s => s.difficulty === difficultyFilter);
    }

    // Mode filter
    if (modeFilter !== 'all') {
      filtered = filtered.filter(s => s.mode === modeFilter);
    }

    // Score filter
    if (scoreFilter !== 'all') {
      filtered = filtered.filter(s => {
        if (!s.finalScore) return false;
        switch (scoreFilter) {
          case 'high': return s.finalScore >= 80;
          case 'medium': return s.finalScore >= 60 && s.finalScore < 80;
          case 'low': return s.finalScore < 60;
          default: return true;
        }
      });
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.timestamp).getTime();
        const dateB = new Date(b.timestamp).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      } else {
        const scoreA = a.finalScore || 0;
        const scoreB = b.finalScore || 0;
        return sortOrder === 'desc' ? scoreB - scoreA : scoreA - scoreB;
      }
    });

    setFilteredSessions(filtered);
  };

  const handleDelete = (sessionId: string) => {
    if (confirm('Are you sure you want to delete this session? This cannot be undone.')) {
      deleteSession(sessionId, user?.id);
      loadSessions();
      if (selectedSession?.sessionId === sessionId) {
        setSelectedSession(null);
      }
    }
  };

  const getDifficultyColor = (difficulty: DifficultyLevel) => {
    switch (difficulty) {
      case DifficultyLevel.ROOKIE: return 'text-green-500 bg-green-500/10';
      case DifficultyLevel.PRO: return 'text-yellow-500 bg-yellow-500/10';
      case DifficultyLevel.ELITE: return 'text-red-500 bg-red-500/10';
      default: return 'text-neutral-400 bg-neutral-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400 bg-green-500/20';
    if (score >= 60) return 'text-yellow-400 bg-yellow-500/20';
    return 'text-red-400 bg-red-500/20';
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen max-h-screen overflow-y-auto bg-black text-white p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <button
          onClick={onBack}
          className="group flex items-center space-x-2 mb-6 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-red-900/50 rounded-full transition-all duration-300"
        >
          <ArrowLeft className="w-4 h-4 text-neutral-400 group-hover:text-red-500" />
          <span className="text-sm font-mono uppercase tracking-wider text-neutral-400 group-hover:text-white">Back</span>
        </button>
        <h1 className="text-4xl font-bold mb-2 flex items-center space-x-3">
          <Calendar className="w-10 h-10 text-red-500" />
          <span>Session History</span>
        </h1>
        <p className="text-neutral-400 text-lg">
          {sessions.length} total sessions • {filteredSessions.length} displayed
        </p>
      </div>

      {/* Score Trend Graph */}
      <div className="max-w-7xl mx-auto mb-6">
        <ScoreTrendGraph maxDataPoints={20} />
      </div>

      {/* Achievements */}
      <div className="max-w-7xl mx-auto mb-6">
        <AchievementsPanel />
      </div>

      {/* Video Storage Stats */}
      <div className="max-w-7xl mx-auto mb-6">
        <VideoStorageStats />
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto mb-6 bg-neutral-900 rounded-xl p-6 border border-neutral-800">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Difficulty Filter */}
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2">Difficulty</label>
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:border-red-500 focus:outline-none"
            >
              <option value="all">All Levels</option>
              <option value={DifficultyLevel.ROOKIE}>Rookie</option>
              <option value={DifficultyLevel.PRO}>PRO</option>
              <option value={DifficultyLevel.ELITE}>Elite</option>
            </select>
          </div>

          {/* Mode Filter */}
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2">Mode</label>
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:border-red-500 focus:outline-none"
            >
              <option value="all">All Modes</option>
              <option value={PitchMode.COACH}>Coach</option>
              <option value={PitchMode.ROLEPLAY}>Roleplay</option>
            </select>
          </div>

          {/* Score Filter */}
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2">Score Range</label>
            <select
              value={scoreFilter}
              onChange={(e) => setScoreFilter(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:border-red-500 focus:outline-none"
            >
              <option value="all">All Scores</option>
              <option value="high">High (80+)</option>
              <option value="medium">Medium (60-79)</option>
              <option value="low">Low (&lt;60)</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'score')}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:border-red-500 focus:outline-none"
            >
              <option value="date">Date</option>
              <option value="score">Score</option>
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2">Order</label>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white hover:bg-neutral-700 transition-colors flex items-center justify-center space-x-2"
            >
              {sortOrder === 'desc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              <span>{sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="max-w-7xl mx-auto">
        {filteredSessions.length === 0 ? (
          <div className="bg-neutral-900 rounded-xl p-12 text-center border border-neutral-800">
            <Calendar className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-neutral-400 mb-2">No Sessions Found</h2>
            <p className="text-neutral-500">
              {sessions.length === 0
                ? 'Start training with Agnes to see your session history here!'
                : 'Try adjusting your filters to see more sessions.'}
            </p>
          </div>
        ) : (
          <div className="bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden">
            <table className="w-full">
              <thead className="bg-neutral-800 border-b border-neutral-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-neutral-300 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-neutral-300 uppercase tracking-wider">Difficulty</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-neutral-300 uppercase tracking-wider">Mode</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-neutral-300 uppercase tracking-wider">Score</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-neutral-300 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-neutral-300 uppercase tracking-wider">Messages</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-neutral-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {filteredSessions.map((session) => (
                  <tr
                    key={session.sessionId}
                    className="hover:bg-neutral-800/50 transition-colors cursor-pointer focus-within:bg-neutral-800/50 focus-within:ring-2 focus-within:ring-red-500"
                    onClick={() => setSelectedSession(session)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedSession(session);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`View details for session from ${formatDate(session.timestamp)}, score ${session.finalScore || 'N/A'}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2 text-neutral-300">
                        <Calendar className="w-4 h-4 text-neutral-500" />
                        <span>{formatDate(session.timestamp)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getDifficultyColor(session.difficulty)}`}>
                        {session.difficulty}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-neutral-300">
                      {session.mode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {session.finalScore !== undefined ? (
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${getScoreColor(session.finalScore)}`}>
                          {session.finalScore}/100
                        </span>
                      ) : (
                        <span className="text-neutral-500 text-sm">No score</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2 text-neutral-300">
                        <Clock className="w-4 h-4 text-neutral-500" />
                        <span>{formatDuration(session.duration)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2 text-neutral-300">
                        <MessageSquare className="w-4 h-4 text-neutral-500" />
                        <span>{session.transcript.length}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {sessionsWithVideo.has(session.sessionId) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSessionToPlay(session.sessionId);
                            }}
                            className="text-purple-500 hover:text-purple-400 transition-colors p-2 rounded-lg hover:bg-purple-500/10 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-neutral-900"
                            title="Watch recording"
                            aria-label={`Watch video recording for session from ${formatDate(session.timestamp)}`}
                          >
                            <Video className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSessionToExport(session);
                          }}
                          className="text-blue-500 hover:text-blue-400 transition-colors p-2 rounded-lg hover:bg-blue-500/10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-neutral-900"
                          title="Export to PDF"
                          aria-label={`Export session from ${formatDate(session.timestamp)} to PDF`}
                        >
                          <FileDown className="w-5 h-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(session.sessionId);
                          }}
                          className="text-red-500 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-red-500/10 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-neutral-900"
                          title="Delete session"
                          aria-label={`Delete session from ${formatDate(session.timestamp)}`}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Session Detail Modal */}
      {selectedSession && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-8">
          <div className="bg-neutral-900 rounded-xl border border-neutral-800 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-neutral-800 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Session Details</h2>
                <p className="text-neutral-400">{formatDate(selectedSession.timestamp)}</p>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="p-2 rounded-full hover:bg-neutral-800 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Session Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-neutral-800 rounded-lg p-4">
                  <div className="text-neutral-400 text-sm mb-1">Difficulty</div>
                  <div className={`font-bold ${getDifficultyColor(selectedSession.difficulty).split(' ')[0]}`}>
                    {selectedSession.difficulty}
                  </div>
                </div>
                <div className="bg-neutral-800 rounded-lg p-4">
                  <div className="text-neutral-400 text-sm mb-1">Mode</div>
                  <div className="font-bold">{selectedSession.mode}</div>
                </div>
                <div className="bg-neutral-800 rounded-lg p-4">
                  <div className="text-neutral-400 text-sm mb-1">Score</div>
                  <div className={`font-bold ${selectedSession.finalScore ? getScoreColor(selectedSession.finalScore).split(' ')[0] : 'text-neutral-500'}`}>
                    {selectedSession.finalScore !== undefined ? `${selectedSession.finalScore}/100` : 'No score'}
                  </div>
                </div>
                <div className="bg-neutral-800 rounded-lg p-4">
                  <div className="text-neutral-400 text-sm mb-1">Duration</div>
                  <div className="font-bold">{formatDuration(selectedSession.duration)}</div>
                </div>
              </div>

              {/* Transcript */}
              <div>
                <h3 className="text-lg font-bold mb-4 flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5 text-red-500" />
                  <span>Conversation Transcript ({selectedSession.transcript.length} messages)</span>
                </h3>
                <div className="space-y-3">
                  {selectedSession.transcript.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg ${
                        msg.role === 'agnes'
                          ? 'bg-red-900/20 border border-red-800/30'
                          : 'bg-neutral-800 border border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-bold ${msg.role === 'agnes' ? 'text-red-400' : 'text-white'}`}>
                          {msg.role === 'agnes' ? 'AGNES 21' : 'YOU'}
                        </span>
                        <span className="text-xs text-neutral-500">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-neutral-300 whitespace-pre-wrap">{msg.text}</div>
                      {msg.score !== undefined && (
                        <div className={`mt-2 inline-block px-2 py-1 rounded text-xs font-bold ${getScoreColor(msg.score)}`}>
                          SCORE: {msg.score}/100
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-neutral-800 flex justify-between">
              <button
                onClick={() => handleDelete(selectedSession.sessionId)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Session</span>
              </button>
              <button
                onClick={() => setSelectedSession(null)}
                className="px-6 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Export Modal */}
      {sessionToExport && (
        <SessionPDFExport
          session={sessionToExport}
          onClose={() => setSessionToExport(null)}
        />
      )}

      {/* Video Player Modal */}
      {sessionToPlay && (
        <VideoPlayer
          sessionId={sessionToPlay}
          onClose={() => setSessionToPlay(null)}
        />
      )}
    </div>
  );
};

export default SessionHistory;