import React from 'react';
import { Zap, MessageSquare, Target, Clock, Flame, Award } from 'lucide-react';

export interface MiniModule {
  id: string;
  title: string;
  description: string;
  duration: string;
  icon: React.ReactNode;
  color: string;
  focusArea: string;
  xpBonus: number;
}

// Insurance-specific mini-module metadata
const INSURANCE_MINI_MODULES: MiniModule[] = [
  {
    id: 'opening',
    title: 'Just Opening',
    description: 'Master the 5 non-negotiables in 30 seconds',
    duration: '30 sec',
    icon: <Zap className="w-5 h-5" />,
    color: 'cyan',
    focusArea: 'opening',
    xpBonus: 25
  },
  {
    id: 'objection-gauntlet',
    title: 'Objection Gauntlet',
    description: 'Handle insurance objections rapid-fire',
    duration: '2 min',
    icon: <Flame className="w-5 h-5" />,
    color: 'orange',
    focusArea: 'objections',
    xpBonus: 50
  },
  {
    id: 'closing',
    title: 'Close the Inspection',
    description: 'Get the homeowner to agree to the inspection',
    duration: '1 min',
    icon: <Target className="w-5 h-5" />,
    color: 'green',
    focusArea: 'closing',
    xpBonus: 35
  },
  {
    id: 'rapport',
    title: 'Build Rapport',
    description: 'Connect with homeowners about storm damage',
    duration: '45 sec',
    icon: <MessageSquare className="w-5 h-5" />,
    color: 'purple',
    focusArea: 'rapport',
    xpBonus: 30
  }
];

// Retail-specific mini-module metadata
const RETAIL_MINI_MODULES: MiniModule[] = [
  {
    id: 'opening',
    title: 'Retail Opening',
    description: 'Nail your introduction and value prop',
    duration: '30 sec',
    icon: <Zap className="w-5 h-5" />,
    color: 'cyan',
    focusArea: 'opening',
    xpBonus: 25
  },
  {
    id: 'objection-gauntlet',
    title: 'Retail Objections',
    description: 'Handle customer pushback rapid-fire',
    duration: '2 min',
    icon: <Flame className="w-5 h-5" />,
    color: 'orange',
    focusArea: 'objections',
    xpBonus: 50
  },
  {
    id: 'closing',
    title: 'Set the Appointment',
    description: 'Get the customer to commit to a time',
    duration: '1 min',
    icon: <Target className="w-5 h-5" />,
    color: 'green',
    focusArea: 'closing',
    xpBonus: 35
  },
  {
    id: 'rapport',
    title: 'Quick Connect',
    description: 'Build instant rapport at the door',
    duration: '45 sec',
    icon: <MessageSquare className="w-5 h-5" />,
    color: 'purple',
    focusArea: 'rapport',
    xpBonus: 30
  }
];

// Legacy export for backwards compatibility
export const MINI_MODULES = INSURANCE_MINI_MODULES;

// Get mini-modules by division
export const getMiniModulesByDivision = (division: 'insurance' | 'retail'): MiniModule[] => {
  return division === 'retail' ? RETAIL_MINI_MODULES : INSURANCE_MINI_MODULES;
};

interface MiniModulesProps {
  onSelectModule: (module: MiniModule) => void;
  completedToday: string[];
  division?: 'insurance' | 'retail';
}

const MiniModules: React.FC<MiniModulesProps> = ({ onSelectModule, completedToday, division = 'insurance' }) => {
  const modules = getMiniModulesByDivision(division);
  const getColorClasses = (color: string, isCompleted: boolean) => {
    if (isCompleted) {
      return {
        border: 'border-green-500/50',
        bg: 'bg-green-900/20',
        icon: 'bg-green-600 text-white',
        text: 'text-green-400'
      };
    }

    const colors: Record<string, { border: string; bg: string; icon: string; text: string }> = {
      cyan: {
        border: 'border-cyan-500/30 hover:border-cyan-500/60',
        bg: 'hover:bg-cyan-900/10',
        icon: 'bg-cyan-600/20 text-cyan-400 group-hover:bg-cyan-600 group-hover:text-white',
        text: 'text-cyan-400'
      },
      orange: {
        border: 'border-orange-500/30 hover:border-orange-500/60',
        bg: 'hover:bg-orange-900/10',
        icon: 'bg-orange-600/20 text-orange-400 group-hover:bg-orange-600 group-hover:text-white',
        text: 'text-orange-400'
      },
      green: {
        border: 'border-green-500/30 hover:border-green-500/60',
        bg: 'hover:bg-green-900/10',
        icon: 'bg-green-600/20 text-green-400 group-hover:bg-green-600 group-hover:text-white',
        text: 'text-green-400'
      },
      purple: {
        border: 'border-purple-500/30 hover:border-purple-500/60',
        bg: 'hover:bg-purple-900/10',
        icon: 'bg-purple-600/20 text-purple-400 group-hover:bg-purple-600 group-hover:text-white',
        text: 'text-purple-400'
      }
    };
    return colors[color] || colors.cyan;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-yellow-500 uppercase tracking-[0.2em]">
          Quick Practice
        </h3>
        <div className="flex items-center space-x-2 text-xs text-neutral-500">
          <Award className="w-3 h-3" />
          <span>{completedToday.length}/{modules.length} today</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {modules.map((module) => {
          const isCompleted = completedToday.includes(module.id);
          const colors = getColorClasses(module.color, isCompleted);

          return (
            <button
              key={module.id}
              onClick={() => !isCompleted && onSelectModule(module)}
              disabled={isCompleted}
              className={`group relative p-4 rounded-xl border ${colors.border} ${colors.bg} bg-neutral-900/50 text-left transition-all duration-300 ${isCompleted ? 'opacity-70 cursor-default' : 'cursor-pointer'}`}
            >
              {isCompleted && (
                <div className="absolute top-2 right-2">
                  <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">Done</span>
                </div>
              )}

              <div className={`inline-flex p-2 rounded-lg ${colors.icon} transition-all duration-300 mb-3`}>
                {module.icon}
              </div>

              <h4 className="font-bold text-white text-sm mb-1">{module.title}</h4>
              <p className="text-neutral-400 text-xs mb-2">{module.description}</p>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1 text-neutral-500">
                  <Clock className="w-3 h-3" />
                  <span className="text-xs">{module.duration}</span>
                </div>
                <span className={`text-xs font-bold ${colors.text}`}>+{module.xpBonus} XP</span>
              </div>
            </button>
          );
        })}
      </div>

      {completedToday.length === modules.length && (
        <div className="p-3 bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border border-yellow-500/30 rounded-lg text-center">
          <span className="text-yellow-400 text-sm font-medium">
            🎉 All quick practices completed today! +100 Bonus XP
          </span>
        </div>
      )}
    </div>
  );
};

export default MiniModules;
