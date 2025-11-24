import React, { useState, useEffect } from 'react';
import {
  ALL_ACHIEVEMENTS,
  getAchievementProgress,
  getAchievementCompletion,
  Achievement
} from '../utils/sessionStorage';
import { Trophy, Lock, Star, Sparkles, Award } from 'lucide-react';

interface AchievementsPanelProps {
  className?: string;
}

const AchievementsPanel: React.FC<AchievementsPanelProps> = ({ className = '' }) => {
  const [progress, setProgress] = useState(getAchievementProgress());
  const [completion, setCompletion] = useState(getAchievementCompletion());
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [rarityFilter, setRarityFilter] = useState<'all' | 'common' | 'rare' | 'epic' | 'legendary'>('all');

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = () => {
    setProgress(getAchievementProgress());
    setCompletion(getAchievementCompletion());
  };

  const isUnlocked = (achievementId: string) => {
    return progress.unlockedAchievements.includes(achievementId);
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-500 bg-gray-500/10 text-gray-400';
      case 'rare': return 'border-blue-500 bg-blue-500/10 text-blue-400';
      case 'epic': return 'border-purple-500 bg-purple-500/10 text-purple-400';
      case 'legendary': return 'border-yellow-500 bg-yellow-500/10 text-yellow-400';
      default: return 'border-gray-600 bg-gray-600/10 text-gray-500';
    }
  };

  const getRarityGlow = (rarity: string) => {
    switch (rarity) {
      case 'rare': return 'shadow-[0_0_15px_rgba(59,130,246,0.3)]';
      case 'epic': return 'shadow-[0_0_20px_rgba(168,85,247,0.4)]';
      case 'legendary': return 'shadow-[0_0_25px_rgba(234,179,8,0.5)] animate-pulse';
      default: return '';
    }
  };

  // Filter achievements
  const filteredAchievements = ALL_ACHIEVEMENTS.filter(achievement => {
    const matchesUnlockStatus =
      filter === 'all' ||
      (filter === 'unlocked' && isUnlocked(achievement.id)) ||
      (filter === 'locked' && !isUnlocked(achievement.id));

    const matchesRarity = rarityFilter === 'all' || achievement.rarity === rarityFilter;

    return matchesUnlockStatus && matchesRarity;
  });

  // Group by rarity
  const groupedAchievements = {
    legendary: filteredAchievements.filter(a => a.rarity === 'legendary'),
    epic: filteredAchievements.filter(a => a.rarity === 'epic'),
    rare: filteredAchievements.filter(a => a.rarity === 'rare'),
    common: filteredAchievements.filter(a => a.rarity === 'common')
  };

  const unlockedCount = progress.unlockedAchievements.length;
  const totalCount = ALL_ACHIEVEMENTS.length;

  return (
    <div className={`bg-neutral-900 border border-neutral-800 rounded-xl p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Trophy className="w-7 h-7 text-yellow-500" />
          <div>
            <h3 className="text-2xl font-bold text-white">Achievements</h3>
            <p className="text-sm text-neutral-400">
              {unlockedCount} of {totalCount} unlocked ({completion}%)
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:border-red-500 focus:outline-none"
          >
            <option value="all">All</option>
            <option value="unlocked">Unlocked</option>
            <option value="locked">Locked</option>
          </select>
          <select
            value={rarityFilter}
            onChange={(e) => setRarityFilter(e.target.value as any)}
            className="px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:border-red-500 focus:outline-none"
          >
            <option value="all">All Rarities</option>
            <option value="legendary">Legendary</option>
            <option value="epic">Epic</option>
            <option value="rare">Rare</option>
            <option value="common">Common</option>
          </select>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-neutral-400">Overall Progress</span>
          <span className="text-sm font-bold text-white">{completion}%</span>
        </div>
        <div className="w-full bg-neutral-800 rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-red-600 via-yellow-500 to-green-500 transition-all duration-500"
            style={{ width: `${completion}%` }}
          />
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="space-y-6">
        {/* Legendary */}
        {groupedAchievements.legendary.length > 0 && (
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              <h4 className="text-sm font-bold uppercase tracking-wider text-yellow-500">Legendary</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupedAchievements.legendary.map(achievement => (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  isUnlocked={isUnlocked(achievement.id)}
                  rarityColor={getRarityColor(achievement.rarity)}
                  rarityGlow={getRarityGlow(achievement.rarity)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Epic */}
        {groupedAchievements.epic.length > 0 && (
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Star className="w-5 h-5 text-purple-500" />
              <h4 className="text-sm font-bold uppercase tracking-wider text-purple-500">Epic</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupedAchievements.epic.map(achievement => (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  isUnlocked={isUnlocked(achievement.id)}
                  rarityColor={getRarityColor(achievement.rarity)}
                  rarityGlow={getRarityGlow(achievement.rarity)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Rare */}
        {groupedAchievements.rare.length > 0 && (
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Award className="w-5 h-5 text-blue-500" />
              <h4 className="text-sm font-bold uppercase tracking-wider text-blue-500">Rare</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupedAchievements.rare.map(achievement => (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  isUnlocked={isUnlocked(achievement.id)}
                  rarityColor={getRarityColor(achievement.rarity)}
                  rarityGlow={getRarityGlow(achievement.rarity)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Common */}
        {groupedAchievements.common.length > 0 && (
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Trophy className="w-5 h-5 text-gray-500" />
              <h4 className="text-sm font-bold uppercase tracking-wider text-gray-500">Common</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupedAchievements.common.map(achievement => (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  isUnlocked={isUnlocked(achievement.id)}
                  rarityColor={getRarityColor(achievement.rarity)}
                  rarityGlow={getRarityGlow(achievement.rarity)}
                />
              ))}
            </div>
          </div>
        )}

        {filteredAchievements.length === 0 && (
          <div className="text-center py-12 text-neutral-500">
            <Trophy className="w-12 h-12 mx-auto mb-4 text-neutral-700" />
            <p>No achievements match your filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

interface AchievementCardProps {
  achievement: Achievement;
  isUnlocked: boolean;
  rarityColor: string;
  rarityGlow: string;
}

const AchievementCard: React.FC<AchievementCardProps> = ({
  achievement,
  isUnlocked,
  rarityColor,
  rarityGlow
}) => {
  return (
    <div
      className={`relative p-4 rounded-lg border-2 transition-all ${
        isUnlocked
          ? `${rarityColor} ${rarityGlow}`
          : 'border-neutral-700 bg-neutral-800/30'
      }`}
    >
      {/* Lock Overlay for Locked Achievements */}
      {!isUnlocked && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] rounded-lg flex items-center justify-center">
          <Lock className="w-8 h-8 text-neutral-600" />
        </div>
      )}

      {/* Content */}
      <div className={`${!isUnlocked && 'opacity-50'}`}>
        <div className="flex items-start space-x-3 mb-2">
          <div className="text-3xl">{achievement.icon}</div>
          <div className="flex-1">
            <h5 className="font-bold text-white text-sm">{achievement.name}</h5>
            <p className="text-xs text-neutral-400 uppercase tracking-wider">
              {achievement.rarity}
            </p>
          </div>
        </div>
        <p className="text-sm text-neutral-300">{achievement.description}</p>
      </div>

      {/* Unlocked Badge */}
      {isUnlocked && (
        <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1.5">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </div>
  );
};

export default AchievementsPanel;
