/**
 * Rep History - Personal training history with analytics
 * Shows stats, score trends, recent sessions, and achievements
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  Target,
  Flame,
  Award,
  Trophy,
  Calendar,
  ChevronRight,
  BarChart3,
  Mic,
  Users,
  Play,
  Star,
  Filter
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  getSessions,
  getStreak,
  getSessionStats,
  getUnlockedAchievements,
  getAchievementCompletion,
  SessionData,
  Achievement,
  ALL_ACHIEVEMENTS
} from '../utils/sessionStorage';
import { getUserProgress } from '../utils/gamification';
import { PitchMode, DifficultyLevel } from '../types';

interface RepHistoryProps {
  onBack: () => void;
  onViewSession?: (sessionId: string) => void;
}

const RepHistory: React.FC<RepHistoryProps> = ({ onBack, onViewSession }) => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [filter, setFilter] = useState<'all' | 'week' | 'month'>('all');
  const [modeFilter, setModeFilter] = useState<'all' | PitchMode.COACH | PitchMode.ROLEPLAY>('all');

  useEffect(() => {
    if (!user?.id) return;
    const allSessions = getSessions(user.id);
    // Sort by most recent first
    allSessions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setSessions(allSessions);
  }, [user?.id]);

  // Calculate analytics
  const analytics = useMemo(() => {
    if (!user?.id) return null;

    const stats = getSessionStats(user.id);
    const streak = getStreak(user.id);
    const progress = getUserProgress(user.id);
    const achievements = getUnlockedAchievements(user.id);
    const achievementCompletion = getAchievementCompletion(user.id);

    // Calculate total time
    const totalSeconds = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const totalHours = Math.round((totalSeconds / 3600) * 10) / 10;

    // Calculate improvement (compare first 3 vs last 3 sessions)
    const sessionsWithScores = sessions
      .filter(s => s.finalScore !== undefined)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    let improvement = 0;
    if (sessionsWithScores.length >= 2) {
      const firstThree = sessionsWithScores.slice(0, Math.min(3, sessionsWithScores.length));
      const lastThree = sessionsWithScores.slice(-Math.min(3, sessionsWithScores.length));
      const firstAvg = firstThree.reduce((sum, s) => sum + (s.finalScore || 0), 0) / firstThree.length;
      const lastAvg = lastThree.reduce((sum, s) => sum + (s.finalScore || 0), 0) / lastThree.length;
      improvement = Math.round(lastAvg - firstAvg);
    }

    // Get score trend for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const scoreTrend: { date: string; score: number; count: number }[] = [];
    const dateMap = new Map<string, { scores: number[]; count: number }>();

    // Initialize last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dateMap.set(dateStr, { scores: [], count: 0 });
    }

    // Fill with session data
    sessions.forEach(session => {
      const dateStr = new Date(session.timestamp).toISOString().split('T')[0];
      const entry = dateMap.get(dateStr);
      if (entry && session.finalScore !== undefined) {
        entry.scores.push(session.finalScore);
        entry.count++;
      }
    });

    // Convert to array
    dateMap.forEach((data, date) => {
      const avgScore = data.scores.length > 0
        ? Math.round(data.scores.reduce((sum, s) => sum + s, 0) / data.scores.length)
        : 0;
      scoreTrend.push({ date, score: avgScore, count: data.count });
    });

    return {
      totalSessions: stats.totalSessions,
      averageScore: stats.averageScore,
      bestScore: stats.bestScore,
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      totalHours,
      improvement,
      totalXP: progress.totalXP,
      currentLevel: progress.currentLevel,
      achievements,
      achievementCompletion,
      scoreTrend,
      sessionsPerDifficulty: stats.sessionsPerDifficulty
    };
  }, [user?.id, sessions]);

  // Filter sessions
  const filteredSessions = useMemo(() => {
    let result = sessions;

    // Time filter
    if (filter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      result = result.filter(s => new Date(s.timestamp) >= weekAgo);
    } else if (filter === 'month') {
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      result = result.filter(s => new Date(s.timestamp) >= monthAgo);
    }

    // Mode filter
    if (modeFilter !== 'all') {
      result = result.filter(s => s.mode === modeFilter);
    }

    return result;
  }, [sessions, filter, modeFilter]);

  const getDifficultyColor = (difficulty: DifficultyLevel) => {
    switch (difficulty) {
      case DifficultyLevel.BEGINNER: return 'text-green-400 bg-green-500/20';
      case DifficultyLevel.ROOKIE: return 'text-blue-400 bg-blue-500/20';
      case DifficultyLevel.PRO: return 'text-purple-400 bg-purple-500/20';
      case DifficultyLevel.ELITE: return 'text-yellow-400 bg-yellow-500/20';
      case DifficultyLevel.NIGHTMARE: return 'text-red-400 bg-red-500/20';
      default: return 'text-neutral-400 bg-neutral-500/20';
    }
  };

  const getModeIcon = (mode: PitchMode) => {
    return mode === PitchMode.COACH ? (
      <Mic className="w-4 h-4 text-blue-400" />
    ) : (
      <Users className="w-4 h-4 text-purple-400" />
    );
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const sessionDate = new Date(date);
    const diffDays = Math.floor((now.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return sessionDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return sessionDate.toLocaleDateString('en-US', { weekday: 'long' });
    } else {
      return sessionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getScoreColor = (score?: number) => {
    if (!score) return 'text-neutral-500';
    if (score >= 90) return 'text-green-400';
    if (score >= 80) return 'text-yellow-400';
    if (score >= 70) return 'text-orange-400';
    return 'text-red-400';
  };

  const getRarityColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common': return 'border-neutral-500/50 bg-neutral-500/10';
      case 'rare': return 'border-blue-500/50 bg-blue-500/10';
      case 'epic': return 'border-purple-500/50 bg-purple-500/10';
      case 'legendary': return 'border-yellow-500/50 bg-yellow-500/10';
    }
  };

  if (!analytics) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-pulse text-neutral-400">Loading...</div>
      </div>
    );
  }

  // Calculate max score for chart scaling
  const maxScore = Math.max(...analytics.scoreTrend.map(d => d.score), 100);
  const chartHeight = 120;

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-red-400" />
            <span className="text-sm text-neutral-400">Level {analytics.currentLevel}</span>
            <span className="text-xs text-red-400">{analytics.totalXP} XP</span>
          </div>
        </div>

        <h1 className="text-3xl font-bold">Your Training History</h1>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Sessions */}
          <div className="p-4 bg-gradient-to-br from-blue-900/30 to-blue-900/10 border border-blue-500/30 rounded-xl">
            <div className="flex items-center space-x-2 mb-2">
              <Target className="w-5 h-5 text-blue-400" />
              <span className="text-xs text-blue-300 uppercase tracking-wider">Sessions</span>
            </div>
            <div className="text-3xl font-bold text-blue-400">{analytics.totalSessions}</div>
            <div className="text-xs text-neutral-500">completed</div>
          </div>

          {/* Avg Score */}
          <div className="p-4 bg-gradient-to-br from-green-900/30 to-green-900/10 border border-green-500/30 rounded-xl">
            <div className="flex items-center space-x-2 mb-2">
              <Star className="w-5 h-5 text-green-400" />
              <span className="text-xs text-green-300 uppercase tracking-wider">Avg Score</span>
            </div>
            <div className="text-3xl font-bold text-green-400">{analytics.averageScore}%</div>
            <div className="text-xs text-neutral-500">best: {analytics.bestScore}%</div>
          </div>

          {/* Time Spent */}
          <div className="p-4 bg-gradient-to-br from-purple-900/30 to-purple-900/10 border border-purple-500/30 rounded-xl">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="w-5 h-5 text-purple-400" />
              <span className="text-xs text-purple-300 uppercase tracking-wider">Time</span>
            </div>
            <div className="text-3xl font-bold text-purple-400">{analytics.totalHours}</div>
            <div className="text-xs text-neutral-500">hours</div>
          </div>

          {/* Improvement */}
          <div className="p-4 bg-gradient-to-br from-orange-900/30 to-orange-900/10 border border-orange-500/30 rounded-xl">
            <div className="flex items-center space-x-2 mb-2">
              {analytics.improvement > 0 ? (
                <TrendingUp className="w-5 h-5 text-green-400" />
              ) : analytics.improvement < 0 ? (
                <TrendingDown className="w-5 h-5 text-red-400" />
              ) : (
                <Minus className="w-5 h-5 text-neutral-400" />
              )}
              <span className="text-xs text-orange-300 uppercase tracking-wider">Progress</span>
            </div>
            <div className={`text-3xl font-bold ${analytics.improvement > 0 ? 'text-green-400' : analytics.improvement < 0 ? 'text-red-400' : 'text-neutral-400'}`}>
              {analytics.improvement > 0 ? '+' : ''}{analytics.improvement}%
            </div>
            <div className="text-xs text-neutral-500">improvement</div>
          </div>
        </div>

        {/* Streak & Level */}
        <div className="grid grid-cols-2 gap-3">
          {/* Current Streak */}
          <div className="p-5 bg-neutral-900/80 border border-neutral-800 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <Flame className="w-5 h-5 text-orange-400" />
                  <span className="text-sm font-medium">Current Streak</span>
                </div>
                <div className="text-4xl font-bold text-orange-400">{analytics.currentStreak}</div>
                <div className="text-xs text-neutral-500">days in a row</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-neutral-500 mb-1">Longest</div>
                <div className="text-xl font-bold text-neutral-400">{analytics.longestStreak}</div>
              </div>
            </div>
          </div>

          {/* Achievements */}
          <div className="p-5 bg-neutral-900/80 border border-neutral-800 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  <span className="text-sm font-medium">Achievements</span>
                </div>
                <div className="text-4xl font-bold text-yellow-400">{analytics.achievements.length}</div>
                <div className="text-xs text-neutral-500">of {ALL_ACHIEVEMENTS.length} unlocked</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-neutral-500 mb-1">Progress</div>
                <div className="text-xl font-bold text-neutral-400">{analytics.achievementCompletion}%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Score Trend Chart */}
        <div className="p-5 bg-neutral-900/80 border border-neutral-800 rounded-xl">
          <div className="flex items-center space-x-2 mb-4">
            <BarChart3 className="w-5 h-5 text-red-400" />
            <span className="font-medium">Score Trend</span>
            <span className="text-xs text-neutral-500">Last 30 Days</span>
          </div>

          {/* Simple bar chart */}
          <div className="relative h-32">
            <div className="absolute inset-0 flex items-end justify-between space-x-0.5">
              {analytics.scoreTrend.map((day, i) => {
                const height = day.score > 0 ? (day.score / maxScore) * chartHeight : 2;
                const hasData = day.count > 0;
                return (
                  <div
                    key={day.date}
                    className="flex-1 flex flex-col items-center justify-end"
                    title={`${day.date}: ${day.score}% (${day.count} sessions)`}
                  >
                    <div
                      className={`w-full rounded-t transition-all duration-300 ${
                        hasData
                          ? day.score >= 80
                            ? 'bg-green-500'
                            : day.score >= 60
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          : 'bg-neutral-800'
                      }`}
                      style={{ height: `${height}px`, minHeight: '2px' }}
                    />
                  </div>
                );
              })}
            </div>
            {/* Reference lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              <div className="flex items-center">
                <div className="w-full h-px bg-neutral-800" />
                <span className="text-xs text-neutral-600 ml-2">100</span>
              </div>
              <div className="flex items-center">
                <div className="w-full h-px bg-neutral-800" />
                <span className="text-xs text-neutral-600 ml-2">50</span>
              </div>
              <div className="flex items-center">
                <div className="w-full h-px bg-neutral-800" />
                <span className="text-xs text-neutral-600 ml-2">0</span>
              </div>
            </div>
          </div>
        </div>

        {/* Achievements Showcase (Recent) */}
        {analytics.achievements.length > 0 && (
          <div className="p-5 bg-neutral-900/80 border border-neutral-800 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <span className="font-medium">Recent Achievements</span>
              </div>
              <span className="text-xs text-neutral-500">
                {analytics.achievements.length} unlocked
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {analytics.achievements.slice(0, 6).map(achievement => (
                <div
                  key={achievement.id}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${getRarityColor(achievement.rarity)}`}
                  title={achievement.description}
                >
                  <span className="text-xl">{achievement.icon}</span>
                  <span className="text-sm font-medium">{achievement.name}</span>
                </div>
              ))}
              {analytics.achievements.length > 6 && (
                <div className="flex items-center px-3 py-2 text-sm text-neutral-400">
                  +{analytics.achievements.length - 6} more
                </div>
              )}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-neutral-500" />
            <div className="flex bg-neutral-900 rounded-lg p-1">
              {(['all', 'week', 'month'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    filter === f
                      ? 'bg-red-600 text-white'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {f === 'all' ? 'All Time' : f === 'week' ? 'This Week' : 'This Month'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex bg-neutral-900 rounded-lg p-1">
            {(['all', PitchMode.COACH, PitchMode.ROLEPLAY] as const).map(m => (
              <button
                key={m}
                onClick={() => setModeFilter(m)}
                className={`px-3 py-1 text-xs rounded-md transition-colors flex items-center space-x-1 ${
                  modeFilter === m
                    ? 'bg-red-600 text-white'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {m === 'all' ? (
                  <span>All</span>
                ) : m === PitchMode.COACH ? (
                  <>
                    <Mic className="w-3 h-3" />
                    <span>Coach</span>
                  </>
                ) : (
                  <>
                    <Users className="w-3 h-3" />
                    <span>Roleplay</span>
                  </>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Sessions List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-neutral-400 uppercase tracking-wider">
              Sessions ({filteredSessions.length})
            </h2>
          </div>

          {filteredSessions.length === 0 ? (
            <div className="p-8 bg-neutral-900/50 border border-neutral-800 rounded-xl text-center">
              <Calendar className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
              <p className="text-neutral-400">No sessions found</p>
              <p className="text-xs text-neutral-600 mt-1">
                {filter !== 'all' ? 'Try adjusting your filters' : 'Complete a training session to see it here'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredSessions.map(session => (
                <button
                  key={session.sessionId}
                  onClick={() => onViewSession?.(session.sessionId)}
                  className="w-full group p-4 bg-neutral-900/50 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-xl transition-all duration-200 text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Mode Icon */}
                      <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center">
                        {getModeIcon(session.mode)}
                      </div>

                      {/* Session Info */}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-white">
                            {session.scriptName || session.script || 'Training Session'}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs ${getDifficultyColor(session.difficulty)}`}>
                            {session.difficulty}
                          </span>
                          {session.isMiniModule && (
                            <span className="px-2 py-0.5 rounded text-xs bg-cyan-500/20 text-cyan-400">
                              Mini
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-3 mt-1">
                          <span className="text-xs text-neutral-500">
                            {formatDate(session.timestamp)}
                          </span>
                          <span className="text-xs text-neutral-600">|</span>
                          <span className="text-xs text-neutral-500">
                            {formatDuration(session.duration)}
                          </span>
                          {session.xpEarned && (
                            <>
                              <span className="text-xs text-neutral-600">|</span>
                              <span className="text-xs text-yellow-500">
                                +{session.xpEarned} XP
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Score & Arrow */}
                    <div className="flex items-center space-x-4">
                      {session.finalScore !== undefined ? (
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${getScoreColor(session.finalScore)}`}>
                            {session.finalScore}
                          </div>
                          <div className="text-xs text-neutral-500">score</div>
                        </div>
                      ) : (
                        <div className="text-right">
                          <div className="text-lg text-neutral-600">--</div>
                          <div className="text-xs text-neutral-600">no score</div>
                        </div>
                      )}
                      <ChevronRight className="w-5 h-5 text-neutral-600 group-hover:text-red-400 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Difficulty Breakdown */}
        <div className="p-5 bg-neutral-900/80 border border-neutral-800 rounded-xl">
          <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-4">
            Sessions by Difficulty
          </h3>
          <div className="grid grid-cols-5 gap-2">
            {Object.entries(analytics.sessionsPerDifficulty).map(([difficulty, count]) => (
              <div
                key={difficulty}
                className={`p-3 rounded-lg text-center ${getDifficultyColor(difficulty as DifficultyLevel)}`}
              >
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-xs capitalize">{difficulty.toLowerCase()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RepHistory;
