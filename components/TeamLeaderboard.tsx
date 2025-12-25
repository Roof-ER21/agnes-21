import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Trophy,
  Medal,
  Award,
  TrendingUp,
  TrendingDown,
  Flame,
  Target,
  Star,
  ChevronRight,
  ChevronLeft,
  X,
  Zap,
  Crown,
  BarChart3
} from 'lucide-react';
import {
  getSessions,
  getStreak,
  getAchievementProgress,
  SessionData
} from '../utils/sessionStorage';
import { leaderboardApi } from '../utils/apiClient';

// ============================================
// TYPES & INTERFACES
// ============================================

interface LeaderboardUser {
  id: string;
  name: string;
  avatar: string;
  totalSessions: number;
  avgScore: number;
  currentStreak: number;
  achievementCount: number;
  recentSessions: SessionData[];
  scoreImprovement: number;
  rank?: number;
  previousRank?: number;
  rankChange?: number;
  weekScore?: number;
}

interface WeeklyWinner {
  userId: string;
  userName: string;
  score: number;
  weekStart: string;
}

type LeaderboardCategory = 'overall' | 'streaks' | 'volume' | 'achievements' | 'rising';

// ============================================
// XP CALCULATION INFO (For Reference)
// ============================================
// Base XP: 50 per session
// Score Bonus: +1 XP per point above 70 (max +30)
// Perfect Bonus: +50 XP for score >= 100
// Streak Bonus: +10 XP per streak day
// Difficulty Multipliers: BEGINNER (1x), ROOKIE (1.25x), PRO (1.5x), ELITE (2x), NIGHTMARE (3x)

// ============================================
// HELPER FUNCTIONS
// ============================================

const getMedalEmoji = (rank: number): string => {
  switch (rank) {
    case 1: return '🥇';
    case 2: return '🥈';
    case 3: return '🥉';
    default: return '';
  }
};

const getRankColor = (rank: number): string => {
  switch (rank) {
    case 1: return 'from-yellow-400 via-yellow-500 to-red-500';
    case 2: return 'from-gray-300 via-gray-400 to-gray-500';
    case 3: return 'from-amber-400 via-amber-500 to-amber-600';
    default: return 'from-blue-500 to-purple-600';
  }
};

const getWeekStart = (): string => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = now.getDate() - dayOfWeek;
  const weekStart = new Date(now.setDate(diff));
  return weekStart.toISOString().split('T')[0];
};

// ============================================
// SPARKLINE COMPONENT
// ============================================

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}

const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 100,
  height = 30,
  color = '#ef4444'
}) => {
  if (data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="inline-block">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

// ============================================
// PROFILE CARD COMPONENT
// ============================================

interface ProfileCardProps {
  user: LeaderboardUser;
  onClose: () => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ user, onClose }) => {
  const recentScores = user.recentSessions.map(s => s.finalScore || 0);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-gradient-to-br from-gray-900 to-black border-2 border-red-500/30 rounded-2xl max-w-md w-full shadow-2xl shadow-red-500/20 animate-in zoom-in duration-200">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-red-600 to-yellow-500 p-6 rounded-t-2xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-4">
            <div className="text-6xl">{user.avatar}</div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-1">{user.name}</h2>
              <div className="flex items-center gap-2 text-white/90">
                <Medal className="w-4 h-4" />
                <span className="text-sm">Rank #{user.rank}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="p-6 grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-lg p-4">
            <div className="text-blue-400 text-sm mb-1">Total Sessions</div>
            <div className="text-2xl font-bold text-white">{user.totalSessions}</div>
          </div>

          <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-lg p-4">
            <div className="text-green-400 text-sm mb-1">Avg Score</div>
            <div className="text-2xl font-bold text-white">{user.avgScore}</div>
          </div>

          <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 border border-orange-500/30 rounded-lg p-4">
            <div className="text-orange-400 text-sm mb-1 flex items-center gap-1">
              <Flame className="w-3 h-3" />
              Current Streak
            </div>
            <div className="text-2xl font-bold text-white">{user.currentStreak} days</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-lg p-4">
            <div className="text-purple-400 text-sm mb-1 flex items-center gap-1">
              <Trophy className="w-3 h-3" />
              Achievements
            </div>
            <div className="text-2xl font-bold text-white">{user.achievementCount}</div>
          </div>
        </div>

        {/* Score Trend */}
        <div className="px-6 pb-4">
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-2 flex items-center justify-between">
              <span>Score Trend (Last 5 Sessions)</span>
              <span className={user.scoreImprovement >= 0 ? 'text-green-400' : 'text-red-400'}>
                {user.scoreImprovement >= 0 ? '+' : ''}{user.scoreImprovement}
              </span>
            </div>
            <Sparkline
              data={recentScores}
              width={320}
              height={40}
              color={user.scoreImprovement >= 0 ? '#10b981' : '#ef4444'}
            />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="px-6 pb-6">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-red-500" />
            Recent Activity
          </h3>
          <div className="space-y-2">
            {user.recentSessions.slice(0, 3).map((session, index) => (
              <div
                key={index}
                className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    (session.finalScore || 0) >= 90 ? 'bg-green-500' :
                    (session.finalScore || 0) >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  <div>
                    <div className="text-white text-sm font-medium">
                      {session.difficulty} • {session.mode}
                    </div>
                    <div className="text-gray-400 text-xs">
                      {new Date(session.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="text-white font-bold">{session.finalScore}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// LEADERBOARD ROW COMPONENT
// ============================================

interface LeaderboardRowProps {
  user: LeaderboardUser;
  rank: number;
  isCurrentUser: boolean;
  onClick: () => void;
}

const LeaderboardRow: React.FC<LeaderboardRowProps> = ({
  user,
  rank,
  isCurrentUser,
  onClick
}) => {
  const isTopThree = rank <= 3;
  const rankChange = user.rankChange || 0;

  return (
    <div
      onClick={onClick}
      onKeyPress={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`View profile for ${user.name}, ranked ${rank}, average score ${user.avgScore}, current streak ${user.currentStreak} days${isCurrentUser ? ' (You)' : ''}`}
      className={`
        relative group cursor-pointer rounded-xl p-4 transition-all duration-300
        ${isTopThree ? 'bg-gradient-to-r from-yellow-500/10 to-red-500/10 border-2 border-yellow-500/30' : 'bg-gray-800/50 border border-gray-700'}
        ${isCurrentUser ? 'ring-2 ring-cyan-500 shadow-lg shadow-cyan-500/20' : ''}
        hover:scale-[1.02] hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900
      `}
    >
      {/* Podium glow for top 3 */}
      {isTopThree && (
        <div className={`absolute inset-0 rounded-xl bg-gradient-to-r ${getRankColor(rank)} opacity-0 group-hover:opacity-20 transition-opacity duration-300`} />
      )}

      <div className="relative flex items-center gap-4">
        {/* Rank Badge */}
        <div className="flex flex-col items-center gap-1">
          <div className={`
            flex items-center justify-center w-12 h-12 rounded-lg font-bold text-lg
            ${isTopThree
              ? `bg-gradient-to-br ${getRankColor(rank)} text-white shadow-lg`
              : 'bg-gray-700 text-gray-300'
            }
          `}>
            {rank <= 3 ? getMedalEmoji(rank) : `#${rank}`}
          </div>

          {/* Rank Change Indicator */}
          {rankChange !== 0 && (
            <div className={`flex items-center gap-0.5 text-xs font-semibold ${
              rankChange > 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {rankChange > 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span>{Math.abs(rankChange)}</span>
            </div>
          )}
        </div>

        {/* Avatar */}
        <div className="text-4xl">{user.avatar}</div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-white font-bold text-lg truncate">{user.name}</h3>
            {isCurrentUser && (
              <span className="px-2 py-0.5 bg-cyan-500/20 border border-cyan-500/50 rounded text-cyan-400 text-xs font-semibold">
                YOU
              </span>
            )}
            {isTopThree && (
              <Crown className="w-4 h-4 text-yellow-400" />
            )}
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1 text-gray-400">
              <Target className="w-3 h-3" />
              <span className="text-white font-semibold">{user.avgScore}</span>
              <span>avg</span>
            </div>
            <div className="flex items-center gap-1 text-gray-400">
              <Flame className="w-3 h-3 text-orange-500" />
              <span className="text-white font-semibold">{user.currentStreak}</span>
              <span>streak</span>
            </div>
            <div className="flex items-center gap-1 text-gray-400">
              <Trophy className="w-3 h-3 text-purple-500" />
              <span className="text-white font-semibold">{user.achievementCount}</span>
            </div>
          </div>
        </div>

        {/* Sparkline */}
        <div className="hidden md:block">
          <Sparkline
            data={user.recentSessions.map(s => s.finalScore || 0)}
            width={80}
            height={30}
            color="#ef4444"
          />
        </div>

        {/* Arrow Indicator */}
        <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-red-500 transition-colors" />
      </div>
    </div>
  );
};

// ============================================
// PODIUM COMPONENT
// ============================================

interface PodiumProps {
  topThree: LeaderboardUser[];
  onUserClick: (user: LeaderboardUser) => void;
  isUserInTopThree: boolean;
}

const Podium: React.FC<PodiumProps> = ({ topThree, onUserClick, isUserInTopThree }) => {
  if (topThree.length < 3) return null;

  const [first, second, third] = topThree;

  return (
    <div className="mb-8 relative">
      {/* Spotlight effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/5 to-transparent rounded-2xl" />

      <div className="relative flex items-end justify-center gap-4 p-8">
        {/* Second Place */}
        <div
          onClick={() => onUserClick(second)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onUserClick(second);
            }
          }}
          tabIndex={0}
          role="button"
          aria-label={`Second place: ${second.name}, score ${second.avgScore}. Press Enter to view profile.`}
          className="flex flex-col items-center cursor-pointer group transform transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-lg"
        >
          <div className="text-6xl mb-2 transform group-hover:scale-110 transition-transform">
            {second.avatar}
          </div>
          <div className="text-5xl mb-2">🥈</div>
          <div className="text-white font-bold text-lg mb-1">{second.name}</div>
          <div className="text-gray-400 text-sm mb-3">Score: {second.avgScore}</div>
          <div className="w-32 h-24 bg-gradient-to-t from-gray-400 to-gray-500 rounded-t-lg shadow-lg flex items-center justify-center">
            <span className="text-white text-3xl font-bold">2</span>
          </div>
        </div>

        {/* First Place */}
        <div
          onClick={() => onUserClick(first)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onUserClick(first);
            }
          }}
          tabIndex={0}
          role="button"
          aria-label={`First place: ${first.name}, score ${first.avgScore}. Press Enter to view profile.`}
          className="flex flex-col items-center cursor-pointer group transform transition-transform hover:scale-105 -mt-8 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-lg"
        >
          {/* Crown and glow */}
          <div className="relative mb-2">
            <div className="absolute inset-0 bg-yellow-400 blur-xl opacity-50" />
            <Crown className="relative w-12 h-12 text-yellow-400 animate-pulse" />
          </div>
          <div className="text-7xl mb-2 transform group-hover:scale-110 transition-transform">
            {first.avatar}
          </div>
          <div className="text-6xl mb-2">🥇</div>
          <div className="text-white font-bold text-xl mb-1">{first.name}</div>
          <div className="text-yellow-400 text-sm font-semibold mb-3">Score: {first.avgScore}</div>
          <div className="w-36 h-32 bg-gradient-to-t from-yellow-400 via-yellow-500 to-red-500 rounded-t-lg shadow-2xl shadow-yellow-500/50 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
            <span className="relative text-white text-4xl font-bold">1</span>
          </div>
        </div>

        {/* Third Place */}
        <div
          onClick={() => onUserClick(third)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onUserClick(third);
            }
          }}
          tabIndex={0}
          role="button"
          aria-label={`Third place: ${third.name}, score ${third.avgScore}. Press Enter to view profile.`}
          className="flex flex-col items-center cursor-pointer group transform transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-lg"
        >
          <div className="text-6xl mb-2 transform group-hover:scale-110 transition-transform">
            {third.avatar}
          </div>
          <div className="text-5xl mb-2">🥉</div>
          <div className="text-white font-bold text-lg mb-1">{third.name}</div>
          <div className="text-gray-400 text-sm mb-3">Score: {third.avgScore}</div>
          <div className="w-32 h-20 bg-gradient-to-t from-amber-500 to-amber-600 rounded-t-lg shadow-lg flex items-center justify-center">
            <span className="text-white text-3xl font-bold">3</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN TEAM LEADERBOARD COMPONENT
// ============================================

interface TeamLeaderboardProps {
  currentUserId?: string;
}

const TeamLeaderboard: React.FC<TeamLeaderboardProps> = ({ currentUserId = 'user_0' }) => {
  const { user } = useAuth();
  const [category, setCategory] = useState<LeaderboardCategory>('overall');
  const [selectedUser, setSelectedUser] = useState<LeaderboardUser | null>(null);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [apiUsers, setApiUsers] = useState<LeaderboardUser[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch leaderboard from API
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const data = await leaderboardApi.get();
        // Transform API data to LeaderboardUser format (now includes real session stats)
        const transformedUsers: LeaderboardUser[] = data.map((u: any, index: number) => ({
          id: u.id,
          name: u.name,
          avatar: u.avatar,
          totalSessions: u.totalSessions || 0,
          avgScore: u.avgScore || 0,
          currentStreak: u.currentStreak || 0,
          achievementCount: 0, // Can be enhanced later
          recentSessions: [], // Not included in API response
          scoreImprovement: 0, // Calculated from recent sessions
          rank: u.rank || index + 1,
          weekScore: u.totalXp
        }));
        setApiUsers(transformedUsers);
      } catch (error) {
        console.warn('Failed to fetch leaderboard from API:', error);
        setApiUsers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [lastUpdate]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(Date.now());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Get users from API - no more mock data fallback
  const users = useMemo(() => {
    // Return API data (can be empty array if no users yet)
    const baseUsers = apiUsers || [];

    // Enhance current user's data with local session info if available
    if (user?.id && baseUsers.length > 0) {
      const sessions = getSessions(user.id);
      const currentUserInList = baseUsers.find(u => u.id === user.id);

      if (currentUserInList && sessions.length > 0) {
        const streak = getStreak(user.id);
        const achievementProgress = getAchievementProgress(user.id);

        // Update with local session data
        currentUserInList.recentSessions = sessions.slice(-5);
        currentUserInList.achievementCount = achievementProgress.unlockedAchievements.length;

        // Calculate score improvement from local sessions
        const firstFive = sessions.slice(0, 5).filter(s => s.finalScore);
        const lastFive = sessions.slice(-5).filter(s => s.finalScore);
        if (firstFive.length > 0 && lastFive.length > 0) {
          const firstAvg = firstFive.reduce((sum, s) => sum + (s.finalScore || 0), 0) / firstFive.length;
          const lastAvg = lastFive.reduce((sum, s) => sum + (s.finalScore || 0), 0) / lastFive.length;
          currentUserInList.scoreImprovement = Math.round(lastAvg - firstAvg);
        }
      }
    }

    return baseUsers;
  }, [lastUpdate, user?.id, apiUsers]);

  // Sort users by category
  const sortedUsers = useMemo(() => {
    const sorted = [...users];

    switch (category) {
      case 'overall':
        sorted.sort((a, b) => b.avgScore - a.avgScore);
        break;
      case 'streaks':
        sorted.sort((a, b) => b.currentStreak - a.currentStreak);
        break;
      case 'volume':
        sorted.sort((a, b) => b.totalSessions - a.totalSessions);
        break;
      case 'achievements':
        sorted.sort((a, b) => b.achievementCount - a.achievementCount);
        break;
      case 'rising':
        sorted.sort((a, b) => b.scoreImprovement - a.scoreImprovement);
        break;
    }

    // Add rank and rank change
    return sorted.map((user, index) => ({
      ...user,
      rank: index + 1,
      previousRank: user.rank || index + 1,
      rankChange: (user.rank || index + 1) - (index + 1)
    }));
  }, [users, category]);

  const topTen = sortedUsers.slice(0, 10);
  const topThree = sortedUsers.slice(0, 3);
  const actualUserId = user?.id || currentUserId;
  const currentUserEntry = sortedUsers.find(u => u.id === actualUserId);
  const isCurrentUserTopThree = currentUserEntry ? currentUserEntry.rank! <= 3 : false;

  // Weekly competition (mock)
  const weeklyWinners: WeeklyWinner[] = JSON.parse(
    localStorage.getItem('weekly_winners') || '[]'
  );

  const getCategoryIcon = (cat: LeaderboardCategory) => {
    switch (cat) {
      case 'overall': return <Trophy className="w-4 h-4" />;
      case 'streaks': return <Flame className="w-4 h-4" />;
      case 'volume': return <Target className="w-4 h-4" />;
      case 'achievements': return <Star className="w-4 h-4" />;
      case 'rising': return <TrendingUp className="w-4 h-4" />;
    }
  };

  const getCategoryLabel = (cat: LeaderboardCategory) => {
    switch (cat) {
      case 'overall': return 'Overall Score';
      case 'streaks': return 'Streak Kings';
      case 'volume': return 'Volume Leaders';
      case 'achievements': return 'Achievement Hunters';
      case 'rising': return 'Rising Stars';
    }
  };

  return (
    <div className="min-h-screen max-h-screen overflow-y-auto bg-gradient-to-b from-gray-900 via-black to-gray-900 p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <Trophy className="w-10 h-10 text-yellow-400" />
              Team Leaderboard
            </h1>
            <p className="text-gray-400">Compete, dominate, and rise to the top!</p>
          </div>

          {/* Auto-refresh indicator */}
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>Live</span>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-3">
          {(['overall', 'streaks', 'volume', 'achievements', 'rising'] as LeaderboardCategory[]).map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-200
                ${category === cat
                  ? 'bg-gradient-to-r from-red-600 to-yellow-500 text-white shadow-lg scale-105'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                }
              `}
            >
              {getCategoryIcon(cat)}
              <span>{getCategoryLabel(cat)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Podium Display for Top 3 (only show if we have at least 3 users) */}
        {!isLoading && topThree.length >= 3 && (
          <Podium
            topThree={topThree}
            onUserClick={setSelectedUser}
            isUserInTopThree={isCurrentUserTopThree}
          />
        )}

        {/* Weekly Competition Banner */}
        <div className="mb-8 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-2 border-purple-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                <h2 className="text-xl font-bold text-white">
                  Week of {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </h2>
              </div>
              <p className="text-gray-400 text-sm">
                Current leader: <span className="text-white font-semibold">{topThree[0]?.name}</span>
              </p>
            </div>

            {weeklyWinners.length > 0 && (
              <div className="text-right">
                <div className="text-gray-400 text-sm mb-1">Last Week Champion</div>
                <div className="text-white font-bold flex items-center gap-2">
                  <Crown className="w-4 h-4 text-yellow-400" />
                  {weeklyWinners[weeklyWinners.length - 1]?.userName}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Leaderboard List */}
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Medal className="w-6 h-6 text-red-500" />
            Top 10 Rankings
          </h2>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Loading leaderboard...</p>
            </div>
          ) : topTen.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Training Data Yet</h3>
              <p className="text-gray-400 mb-4">Complete training sessions to appear on the leaderboard!</p>
              <p className="text-sm text-gray-500">
                Earn XP by training: 50 base XP per session + bonuses for high scores and streaks.
              </p>
            </div>
          ) : (
            <>
              {topTen.map(u => (
                <LeaderboardRow
                  key={u.id}
                  user={u}
                  rank={u.rank!}
                  isCurrentUser={u.id === actualUserId}
                  onClick={() => setSelectedUser(u)}
                />
              ))}

              {/* Current user position if not in top 10 */}
              {currentUserEntry && currentUserEntry.rank! > 10 && (
                <>
                  <div className="py-4 text-center text-gray-500">
                    <div className="inline-flex items-center gap-2">
                      <div className="h-px w-8 bg-gray-700" />
                      <span className="text-sm">Your Position</span>
                      <div className="h-px w-8 bg-gray-700" />
                    </div>
                  </div>

                  <LeaderboardRow
                    user={currentUserEntry}
                    rank={currentUserEntry.rank!}
                    isCurrentUser={true}
                    onClick={() => setSelectedUser(currentUserEntry)}
                  />
                </>
              )}
            </>
          )}
        </div>

        {/* Hall of Fame */}
        {weeklyWinners.length > 0 && (
          <div className="mt-12 bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Award className="w-6 h-6 text-purple-500" />
              Hall of Fame
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {weeklyWinners.slice(-3).reverse().map((winner, index) => (
                <div key={index} className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
                  <div className="text-gray-400 text-sm mb-1">Week of {winner.weekStart}</div>
                  <div className="text-white font-bold text-lg">{winner.userName}</div>
                  <div className="text-purple-400 text-sm">Score: {winner.score}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Profile Card Modal */}
      {selectedUser && (
        <ProfileCard user={selectedUser} onClose={() => setSelectedUser(null)} />
      )}
    </div>
  );
};

export default TeamLeaderboard;
