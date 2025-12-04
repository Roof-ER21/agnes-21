import React, { useState, useEffect } from 'react';
import { Target, MessageSquare, Handshake, Shield, Zap, Lock, Check, ChevronRight, Star } from 'lucide-react';

export interface SkillNode {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  level: number;
  maxLevel: number;
  xpRequired: number;
  xpEarned: number;
  unlocked: boolean;
  prerequisites: string[];
}

interface SkillTreeProps {
  userId: string;
}

const INITIAL_SKILLS: SkillNode[] = [
  {
    id: 'opening',
    name: 'Opening Mastery',
    description: 'Perfect your first impression and the 5 non-negotiables',
    icon: Zap,
    color: 'cyan',
    level: 0,
    maxLevel: 5,
    xpRequired: 100,
    xpEarned: 0,
    unlocked: true,
    prerequisites: []
  },
  {
    id: 'rapport',
    name: 'Rapport Building',
    description: 'Connect authentically and make it relatable',
    icon: MessageSquare,
    color: 'purple',
    level: 0,
    maxLevel: 5,
    xpRequired: 150,
    xpEarned: 0,
    unlocked: true,
    prerequisites: []
  },
  {
    id: 'objections',
    name: 'Objection Handling',
    description: 'Turn resistance into opportunity',
    icon: Shield,
    color: 'orange',
    level: 0,
    maxLevel: 5,
    xpRequired: 200,
    xpEarned: 0,
    unlocked: false,
    prerequisites: ['opening', 'rapport']
  },
  {
    id: 'closing',
    name: 'Closing Techniques',
    description: 'Seal the deal with confidence',
    icon: Target,
    color: 'green',
    level: 0,
    maxLevel: 5,
    xpRequired: 200,
    xpEarned: 0,
    unlocked: false,
    prerequisites: ['objections']
  },
  {
    id: 'mastery',
    name: 'Sales Mastery',
    description: 'Combine all skills into perfection',
    icon: Star,
    color: 'yellow',
    level: 0,
    maxLevel: 3,
    xpRequired: 500,
    xpEarned: 0,
    unlocked: false,
    prerequisites: ['closing']
  }
];

const SkillTree: React.FC<SkillTreeProps> = ({ userId }) => {
  const [skills, setSkills] = useState<SkillNode[]>(INITIAL_SKILLS);
  const [selectedSkill, setSelectedSkill] = useState<SkillNode | null>(null);

  // Load skills from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`agnes_skills_${userId}`);
    if (stored) {
      setSkills(JSON.parse(stored));
    }
  }, [userId]);

  const getColorClasses = (color: string, unlocked: boolean) => {
    if (!unlocked) {
      return {
        bg: 'bg-neutral-800',
        border: 'border-neutral-700',
        text: 'text-neutral-600',
        icon: 'text-neutral-600',
        progress: 'bg-neutral-700'
      };
    }

    const colors: Record<string, { bg: string; border: string; text: string; icon: string; progress: string }> = {
      cyan: {
        bg: 'bg-cyan-900/30',
        border: 'border-cyan-500/50',
        text: 'text-cyan-400',
        icon: 'text-cyan-400',
        progress: 'bg-cyan-500'
      },
      purple: {
        bg: 'bg-purple-900/30',
        border: 'border-purple-500/50',
        text: 'text-purple-400',
        icon: 'text-purple-400',
        progress: 'bg-purple-500'
      },
      orange: {
        bg: 'bg-orange-900/30',
        border: 'border-orange-500/50',
        text: 'text-orange-400',
        icon: 'text-orange-400',
        progress: 'bg-orange-500'
      },
      green: {
        bg: 'bg-green-900/30',
        border: 'border-green-500/50',
        text: 'text-green-400',
        icon: 'text-green-400',
        progress: 'bg-green-500'
      },
      yellow: {
        bg: 'bg-yellow-900/30',
        border: 'border-yellow-500/50',
        text: 'text-yellow-400',
        icon: 'text-yellow-400',
        progress: 'bg-yellow-500'
      }
    };
    return colors[color] || colors.cyan;
  };

  const getLevelStars = (level: number, maxLevel: number) => {
    return Array.from({ length: maxLevel }, (_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${i < level ? 'text-yellow-500 fill-yellow-500' : 'text-neutral-600'}`}
      />
    ));
  };

  const getProgress = (skill: SkillNode) => {
    if (!skill.unlocked) return 0;
    const currentLevelXP = skill.xpRequired;
    return Math.min((skill.xpEarned / currentLevelXP) * 100, 100);
  };

  const totalSkillPoints = skills.reduce((sum, s) => sum + s.level, 0);
  const maxSkillPoints = skills.reduce((sum, s) => sum + s.maxLevel, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-yellow-500 uppercase tracking-[0.2em]">
          Skill Tree
        </h3>
        <div className="flex items-center space-x-2 text-xs text-neutral-500">
          <Star className="w-3 h-3 text-yellow-500" />
          <span>{totalSkillPoints}/{maxSkillPoints} Skills</span>
        </div>
      </div>

      {/* Skill Tree Visualization */}
      <div className="relative">
        {/* Connection Lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#525252" />
              <stop offset="100%" stopColor="#737373" />
            </linearGradient>
          </defs>
        </svg>

        {/* Skill Nodes */}
        <div className="space-y-3">
          {/* Row 1: Opening & Rapport (unlocked by default) */}
          <div className="grid grid-cols-2 gap-3">
            {skills.filter(s => ['opening', 'rapport'].includes(s.id)).map(skill => {
              const colors = getColorClasses(skill.color, skill.unlocked);
              const Icon = skill.icon;
              const progress = getProgress(skill);

              return (
                <button
                  key={skill.id}
                  onClick={() => setSelectedSkill(skill)}
                  className={`relative p-4 rounded-xl border ${colors.border} ${colors.bg} transition-all duration-300 text-left hover:scale-[1.02]`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${colors.bg}`}>
                      <Icon className={`w-5 h-5 ${colors.icon}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white text-sm font-bold truncate">{skill.name}</h4>
                      <div className="flex mt-1">
                        {getLevelStars(skill.level, skill.maxLevel)}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3 h-1 bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${colors.progress} rounded-full transition-all duration-500`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Connector Arrow */}
          <div className="flex justify-center py-1">
            <ChevronRight className="w-4 h-4 text-neutral-600 rotate-90" />
          </div>

          {/* Row 2: Objections */}
          {skills.filter(s => s.id === 'objections').map(skill => {
            const colors = getColorClasses(skill.color, skill.unlocked);
            const Icon = skill.icon;
            const progress = getProgress(skill);

            return (
              <button
                key={skill.id}
                onClick={() => skill.unlocked && setSelectedSkill(skill)}
                disabled={!skill.unlocked}
                className={`relative w-full p-4 rounded-xl border ${colors.border} ${colors.bg} transition-all duration-300 text-left ${
                  skill.unlocked ? 'hover:scale-[1.02]' : 'opacity-60 cursor-not-allowed'
                }`}
              >
                {!skill.unlocked && (
                  <div className="absolute top-2 right-2">
                    <Lock className="w-4 h-4 text-neutral-600" />
                  </div>
                )}
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${colors.bg}`}>
                    <Icon className={`w-5 h-5 ${colors.icon}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-bold truncate ${skill.unlocked ? 'text-white' : 'text-neutral-500'}`}>
                      {skill.name}
                    </h4>
                    <p className="text-neutral-500 text-xs mt-0.5">{skill.description}</p>
                    {skill.unlocked && (
                      <div className="flex mt-1">
                        {getLevelStars(skill.level, skill.maxLevel)}
                      </div>
                    )}
                  </div>
                </div>

                {skill.unlocked && (
                  <div className="mt-3 h-1 bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${colors.progress} rounded-full transition-all duration-500`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </button>
            );
          })}

          {/* Connector Arrow */}
          <div className="flex justify-center py-1">
            <ChevronRight className="w-4 h-4 text-neutral-600 rotate-90" />
          </div>

          {/* Row 3: Closing */}
          {skills.filter(s => s.id === 'closing').map(skill => {
            const colors = getColorClasses(skill.color, skill.unlocked);
            const Icon = skill.icon;
            const progress = getProgress(skill);

            return (
              <button
                key={skill.id}
                onClick={() => skill.unlocked && setSelectedSkill(skill)}
                disabled={!skill.unlocked}
                className={`relative w-full p-4 rounded-xl border ${colors.border} ${colors.bg} transition-all duration-300 text-left ${
                  skill.unlocked ? 'hover:scale-[1.02]' : 'opacity-60 cursor-not-allowed'
                }`}
              >
                {!skill.unlocked && (
                  <div className="absolute top-2 right-2">
                    <Lock className="w-4 h-4 text-neutral-600" />
                  </div>
                )}
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${colors.bg}`}>
                    <Icon className={`w-5 h-5 ${colors.icon}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-bold truncate ${skill.unlocked ? 'text-white' : 'text-neutral-500'}`}>
                      {skill.name}
                    </h4>
                    <p className="text-neutral-500 text-xs mt-0.5">{skill.description}</p>
                    {skill.unlocked && (
                      <div className="flex mt-1">
                        {getLevelStars(skill.level, skill.maxLevel)}
                      </div>
                    )}
                  </div>
                </div>

                {skill.unlocked && (
                  <div className="mt-3 h-1 bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${colors.progress} rounded-full transition-all duration-500`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </button>
            );
          })}

          {/* Connector Arrow */}
          <div className="flex justify-center py-1">
            <ChevronRight className="w-4 h-4 text-neutral-600 rotate-90" />
          </div>

          {/* Row 4: Mastery (Final) */}
          {skills.filter(s => s.id === 'mastery').map(skill => {
            const colors = getColorClasses(skill.color, skill.unlocked);
            const Icon = skill.icon;
            const progress = getProgress(skill);

            return (
              <button
                key={skill.id}
                onClick={() => skill.unlocked && setSelectedSkill(skill)}
                disabled={!skill.unlocked}
                className={`relative w-full p-4 rounded-xl border-2 ${
                  skill.unlocked
                    ? 'border-yellow-500/50 bg-gradient-to-r from-yellow-900/30 to-orange-900/30'
                    : 'border-neutral-700 bg-neutral-800'
                } transition-all duration-300 text-left ${
                  skill.unlocked ? 'hover:scale-[1.02]' : 'opacity-60 cursor-not-allowed'
                }`}
              >
                {!skill.unlocked && (
                  <div className="absolute top-2 right-2">
                    <Lock className="w-4 h-4 text-neutral-600" />
                  </div>
                )}
                <div className="flex items-start space-x-3">
                  <div className={`p-3 rounded-lg ${skill.unlocked ? 'bg-yellow-900/50' : 'bg-neutral-700'}`}>
                    <Icon className={`w-6 h-6 ${skill.unlocked ? 'text-yellow-400' : 'text-neutral-600'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-bold truncate ${skill.unlocked ? 'text-yellow-400' : 'text-neutral-500'}`}>
                      {skill.name}
                    </h4>
                    <p className="text-neutral-500 text-xs mt-0.5">{skill.description}</p>
                    {skill.unlocked && (
                      <div className="flex mt-1">
                        {getLevelStars(skill.level, skill.maxLevel)}
                      </div>
                    )}
                  </div>
                </div>

                {skill.unlocked && (
                  <div className="mt-3 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Skill Detail Modal */}
      {selectedSkill && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setSelectedSkill(null)}>
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            {(() => {
              const colors = getColorClasses(selectedSkill.color, selectedSkill.unlocked);
              const Icon = selectedSkill.icon;
              return (
                <>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className={`p-3 rounded-xl ${colors.bg}`}>
                      <Icon className={`w-6 h-6 ${colors.icon}`} />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-lg">{selectedSkill.name}</h4>
                      <div className="flex mt-1">
                        {getLevelStars(selectedSkill.level, selectedSkill.maxLevel)}
                      </div>
                    </div>
                  </div>

                  <p className="text-neutral-400 text-sm mb-4">{selectedSkill.description}</p>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-500">Level Progress</span>
                      <span className={colors.text}>{selectedSkill.xpEarned}/{selectedSkill.xpRequired} XP</span>
                    </div>
                    <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${colors.progress} rounded-full transition-all duration-500`}
                        style={{ width: `${getProgress(selectedSkill)}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-neutral-800 rounded-lg text-sm">
                    <p className="text-neutral-400">
                      Complete training sessions focusing on <span className={colors.text}>{selectedSkill.name.toLowerCase()}</span> to earn XP and level up this skill.
                    </p>
                  </div>

                  <button
                    onClick={() => setSelectedSkill(null)}
                    className="w-full mt-4 py-3 border border-neutral-700 text-neutral-400 rounded-lg hover:bg-neutral-800 transition-colors"
                  >
                    Close
                  </button>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillTree;
