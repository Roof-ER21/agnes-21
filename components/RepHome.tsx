/**
 * Rep Home - Trainee dashboard with stats and quick actions
 * Personalized home screen for sales reps
 */

import React, { useState, useEffect } from 'react';
import {
  Globe,
  Video,
  Trophy,
  History,
  Mic,
  TrendingUp,
  Target,
  Flame,
  Award,
  ChevronRight,
  Calendar,
  Home,
  ShoppingCart
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getUserProgress } from '../utils/gamification';
import { getSessions } from '../utils/sessionStorage';
import { getStreak } from '../utils/sessionStorage';

interface RepHomeProps {
  onNavigate: (view: string) => void;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
}

const RepHome: React.FC<RepHomeProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalSessions: 0,
    avgScore: 0,
    currentStreak: 0,
    totalXP: 0,
    currentLevel: 1,
    weeklyGoalProgress: 0
  });

  useEffect(() => {
    if (!user?.id) return;

    // Load user progress
    const progress = getUserProgress(user.id);
    const sessions = getSessions(user.id);
    const streakData = getStreak(user.id);

    // Calculate average score
    const sessionsWithScore = sessions.filter(s => s.finalScore !== undefined);
    const avgScore = sessionsWithScore.length > 0
      ? Math.round(sessionsWithScore.reduce((sum, s) => sum + (s.finalScore || 0), 0) / sessionsWithScore.length)
      : 0;

    // Calculate weekly goal progress (5 sessions per week target)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weekSessions = sessions.filter(s => new Date(s.timestamp) >= oneWeekAgo);
    const weeklyGoalProgress = Math.min(100, Math.round((weekSessions.length / 5) * 100));

    setStats({
      totalSessions: sessions.length,
      avgScore,
      currentStreak: streakData.currentStreak,
      totalXP: progress.totalXP,
      currentLevel: progress.currentLevel,
      weeklyGoalProgress
    });
  }, [user?.id]);

  const quickActions: QuickAction[] = [
    {
      id: 'training',
      title: 'Start Training',
      description: 'Practice with Agnes 21',
      icon: <Mic className="w-8 h-8" />,
      color: 'text-red-400',
      bgColor: 'bg-red-600/20',
      borderColor: 'border-red-500/50'
    },
    {
      id: 'translate',
      title: 'Field Translator',
      description: 'Real-time translation',
      icon: <Globe className="w-8 h-8" />,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-600/20',
      borderColor: 'border-cyan-500/50'
    },
    {
      id: 'demos',
      title: 'Demo Library',
      description: 'Watch training videos',
      icon: <Video className="w-8 h-8" />,
      color: 'text-purple-400',
      bgColor: 'bg-purple-600/20',
      borderColor: 'border-purple-500/50'
    },
    {
      id: 'leaderboard',
      title: 'Leaderboard',
      description: 'See team rankings',
      icon: <Trophy className="w-8 h-8" />,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-600/20',
      borderColor: 'border-yellow-500/50'
    }
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Welcome Header */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-neutral-400 text-sm">{getGreeting()}</p>
            {/* Division Badge */}
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm uppercase tracking-wider shadow-lg ${
              user?.division === 'retail'
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-emerald-500/25'
                : 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-red-500/25'
            }`}>
              {user?.division === 'retail' ? (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  <span>Retail</span>
                </>
              ) : (
                <>
                  <Home className="w-4 h-4" />
                  <span>Insurance</span>
                </>
              )}
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Welcome back, <span className="text-red-500">{user?.name}</span>!
          </h1>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Current Streak */}
          <div className="p-4 bg-gradient-to-br from-orange-900/30 to-orange-900/10 border border-orange-500/30 rounded-xl">
            <div className="flex items-center space-x-2 mb-2">
              <Flame className="w-5 h-5 text-orange-400" />
              <span className="text-xs text-orange-300 uppercase tracking-wider">Streak</span>
            </div>
            <div className="text-3xl font-bold text-orange-400">{stats.currentStreak}</div>
            <div className="text-xs text-neutral-500">days</div>
          </div>

          {/* Avg Score */}
          <div className="p-4 bg-gradient-to-br from-green-900/30 to-green-900/10 border border-green-500/30 rounded-xl">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <span className="text-xs text-green-300 uppercase tracking-wider">Avg Score</span>
            </div>
            <div className="text-3xl font-bold text-green-400">{stats.avgScore}%</div>
            <div className="text-xs text-neutral-500">all time</div>
          </div>

          {/* Level */}
          <div className="p-4 bg-gradient-to-br from-purple-900/30 to-purple-900/10 border border-purple-500/30 rounded-xl">
            <div className="flex items-center space-x-2 mb-2">
              <Award className="w-5 h-5 text-purple-400" />
              <span className="text-xs text-purple-300 uppercase tracking-wider">Level</span>
            </div>
            <div className="text-3xl font-bold text-purple-400">{stats.currentLevel}</div>
            <div className="text-xs text-neutral-500">{stats.totalXP} XP</div>
          </div>

          {/* Sessions */}
          <div className="p-4 bg-gradient-to-br from-blue-900/30 to-blue-900/10 border border-blue-500/30 rounded-xl">
            <div className="flex items-center space-x-2 mb-2">
              <Target className="w-5 h-5 text-blue-400" />
              <span className="text-xs text-blue-300 uppercase tracking-wider">Sessions</span>
            </div>
            <div className="text-3xl font-bold text-blue-400">{stats.totalSessions}</div>
            <div className="text-xs text-neutral-500">completed</div>
          </div>
        </div>

        {/* Weekly Goal Progress */}
        <div className="p-5 bg-neutral-900/80 border border-neutral-800 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-yellow-400" />
              <span className="text-sm font-medium">Weekly Goal</span>
            </div>
            <span className="text-xs text-neutral-400">{stats.weeklyGoalProgress}% complete</span>
          </div>
          <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 transition-all duration-500"
              style={{ width: `${stats.weeklyGoalProgress}%` }}
            />
          </div>
          <p className="text-xs text-neutral-500 mt-2">
            Complete 5 training sessions this week to earn bonus XP!
          </p>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-neutral-400 uppercase tracking-wider">Quick Actions</h2>

          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.id}
                onClick={() => onNavigate(action.id)}
                className={`group p-5 ${action.bgColor} border ${action.borderColor} rounded-xl text-left transition-all duration-300 hover:scale-[1.02]`}
              >
                <div className={`${action.color} mb-3`}>
                  {action.icon}
                </div>
                <h3 className="text-lg font-bold text-white mb-1">{action.title}</h3>
                <p className="text-xs text-neutral-400">{action.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* View History Link */}
        <button
          onClick={() => onNavigate('history')}
          className="w-full group flex items-center justify-between p-4 bg-neutral-900/50 hover:bg-neutral-900 border border-neutral-800 hover:border-red-500/30 rounded-xl transition-all duration-300"
        >
          <div className="flex items-center space-x-3">
            <History className="w-5 h-5 text-red-400" />
            <div className="text-left">
              <h3 className="font-medium text-white">View Training History</h3>
              <p className="text-xs text-neutral-500">See your past sessions and analytics</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-neutral-500 group-hover:text-red-400 group-hover:translate-x-1 transition-all" />
        </button>
      </div>
    </div>
  );
};

export default RepHome;
