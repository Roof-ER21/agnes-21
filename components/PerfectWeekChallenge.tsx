import React, { useState, useEffect } from 'react';
import { Calendar, Check, Flame, Trophy, Star, Zap, Target } from 'lucide-react';

interface DayStatus {
  date: string;
  completed: boolean;
  score: number | null;
  dayOfWeek: number;
}

interface PerfectWeekChallengeProps {
  userId: string;
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MIN_SCORE_FOR_PERFECT = 80;
const PERFECT_WEEK_XP_BONUS = 500;

const PerfectWeekChallenge: React.FC<PerfectWeekChallengeProps> = ({ userId }) => {
  const [weekData, setWeekData] = useState<DayStatus[]>([]);
  const [perfectWeeksEarned, setPerfectWeeksEarned] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);

  useEffect(() => {
    loadWeekData();
  }, [userId]);

  const loadWeekData = () => {
    // Get current week's data
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - currentDay);

    const week: DayStatus[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      // Check localStorage for session data on this day
      const dayData = localStorage.getItem(`agnes_day_${userId}_${dateStr}`);
      const parsed = dayData ? JSON.parse(dayData) : null;

      week.push({
        date: dateStr,
        completed: parsed?.completed || false,
        score: parsed?.score || null,
        dayOfWeek: i
      });
    }

    setWeekData(week);

    // Load perfect weeks count
    const storedWeeks = localStorage.getItem(`agnes_perfect_weeks_${userId}`);
    setPerfectWeeksEarned(storedWeeks ? parseInt(storedWeeks, 10) : 0);

    // Calculate current streak
    const storedStreak = localStorage.getItem(`agnes_streak_${userId}`);
    setCurrentStreak(storedStreak ? parseInt(storedStreak, 10) : 0);
  };

  const getDayColor = (day: DayStatus, isToday: boolean) => {
    if (!day.completed) {
      if (isToday) {
        return {
          bg: 'bg-yellow-900/30',
          border: 'border-yellow-500/50',
          text: 'text-yellow-400',
          icon: 'text-yellow-400'
        };
      }
      if (new Date(day.date) < new Date()) {
        // Missed day
        return {
          bg: 'bg-red-900/20',
          border: 'border-red-500/30',
          text: 'text-red-400',
          icon: 'text-red-400'
        };
      }
      // Future day
      return {
        bg: 'bg-neutral-800',
        border: 'border-neutral-700',
        text: 'text-neutral-500',
        icon: 'text-neutral-600'
      };
    }

    // Completed
    if (day.score !== null && day.score >= MIN_SCORE_FOR_PERFECT) {
      return {
        bg: 'bg-green-900/30',
        border: 'border-green-500/50',
        text: 'text-green-400',
        icon: 'text-green-400'
      };
    }

    // Completed but below threshold
    return {
      bg: 'bg-orange-900/20',
      border: 'border-orange-500/30',
      text: 'text-orange-400',
      icon: 'text-orange-400'
    };
  };

  const isPerfectWeekAchieved = () => {
    return weekData.every(day =>
      day.completed && day.score !== null && day.score >= MIN_SCORE_FOR_PERFECT
    );
  };

  const getPerfectDaysCount = () => {
    return weekData.filter(day =>
      day.completed && day.score !== null && day.score >= MIN_SCORE_FOR_PERFECT
    ).length;
  };

  const getWeekProgress = () => {
    const perfectDays = getPerfectDaysCount();
    return (perfectDays / 7) * 100;
  };

  const today = new Date().toISOString().split('T')[0];
  const perfectDays = getPerfectDaysCount();
  const isAchieved = isPerfectWeekAchieved();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-yellow-500 uppercase tracking-[0.2em]">
          Perfect Week Challenge
        </h3>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 text-xs text-neutral-500">
            <Trophy className="w-3 h-3 text-yellow-500" />
            <span>{perfectWeeksEarned} earned</span>
          </div>
        </div>
      </div>

      {/* Week Calendar */}
      <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800">
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-neutral-400">Week Progress</span>
            <span className={isAchieved ? 'text-green-400 font-bold' : 'text-neutral-400'}>
              {perfectDays}/7 Perfect Days
            </span>
          </div>
          <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isAchieved
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                  : 'bg-gradient-to-r from-yellow-500 to-orange-500'
              }`}
              style={{ width: `${getWeekProgress()}%` }}
            />
          </div>
        </div>

        {/* Day Grid */}
        <div className="grid grid-cols-7 gap-2">
          {weekData.map(day => {
            const isToday = day.date === today;
            const colors = getDayColor(day, isToday);
            const isPerfectDay = day.completed && day.score !== null && day.score >= MIN_SCORE_FOR_PERFECT;

            return (
              <div
                key={day.date}
                className={`relative p-2 rounded-lg border ${colors.border} ${colors.bg} text-center transition-all duration-300`}
              >
                {/* Day Label */}
                <div className={`text-xs font-medium ${colors.text} mb-1`}>
                  {DAYS_OF_WEEK[day.dayOfWeek]}
                </div>

                {/* Status Icon */}
                <div className="flex justify-center">
                  {day.completed ? (
                    isPerfectDay ? (
                      <Star className={`w-5 h-5 ${colors.icon} fill-current`} />
                    ) : (
                      <Check className={`w-5 h-5 ${colors.icon}`} />
                    )
                  ) : isToday ? (
                    <Target className={`w-5 h-5 ${colors.icon}`} />
                  ) : (
                    <div className={`w-5 h-5 rounded-full border-2 ${colors.border}`} />
                  )}
                </div>

                {/* Score */}
                {day.score !== null && (
                  <div className={`text-xs mt-1 font-bold ${colors.text}`}>
                    {day.score}
                  </div>
                )}

                {/* Today Indicator */}
                {isToday && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                )}
              </div>
            );
          })}
        </div>

        {/* Challenge Info */}
        <div className="mt-4 p-3 bg-neutral-800/50 rounded-lg">
          <div className="flex items-start space-x-2">
            <Zap className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-neutral-300 text-xs">
                Complete a training session with <span className="text-yellow-400 font-bold">80+ score</span> every day this week
              </p>
              <p className="text-neutral-500 text-xs mt-1">
                Reward: <span className="text-green-400">{PERFECT_WEEK_XP_BONUS} XP</span> + Perfect Week badge
              </p>
            </div>
          </div>
        </div>

        {/* Achievement Banner */}
        {isAchieved && (
          <div className="mt-4 p-4 bg-gradient-to-r from-green-900/50 to-emerald-900/50 border border-green-500/50 rounded-xl text-center">
            <div className="flex justify-center mb-2">
              <div className="p-2 bg-green-500 rounded-full">
                <Trophy className="w-6 h-6 text-white" />
              </div>
            </div>
            <h4 className="text-green-400 font-bold text-lg">Perfect Week Achieved!</h4>
            <p className="text-green-300/70 text-sm mt-1">+{PERFECT_WEEK_XP_BONUS} XP Bonus Earned</p>
          </div>
        )}
      </div>

      {/* Streak Display */}
      {currentStreak > 0 && (
        <div className="flex items-center justify-between p-3 bg-orange-900/20 border border-orange-500/30 rounded-lg">
          <div className="flex items-center space-x-2">
            <Flame className="w-5 h-5 text-orange-500" />
            <span className="text-orange-400 font-medium">Current Streak</span>
          </div>
          <span className="text-orange-400 font-bold text-lg">{currentStreak} days</span>
        </div>
      )}
    </div>
  );
};

export default PerfectWeekChallenge;
