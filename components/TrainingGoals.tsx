import React, { useState, useEffect } from 'react';
import { Target, Calendar, Flame, Trophy, ChevronRight, Check, Plus } from 'lucide-react';

export interface TrainingGoal {
  id: string;
  type: 'sessions' | 'score' | 'streak' | 'xp';
  target: number;
  current: number;
  period: 'daily' | 'weekly' | 'monthly';
  createdAt: string;
}

interface TrainingGoalsProps {
  userId: string;
  onClose?: () => void;
}

const GOAL_TYPES = [
  { id: 'sessions', label: 'Training Sessions', icon: Target, color: 'cyan', unit: 'sessions' },
  { id: 'score', label: 'Average Score', icon: Trophy, color: 'yellow', unit: 'points' },
  { id: 'streak', label: 'Streak Days', icon: Flame, color: 'orange', unit: 'days' },
  { id: 'xp', label: 'XP Earned', icon: Calendar, color: 'purple', unit: 'XP' }
];

const PERIOD_OPTIONS = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' }
];

const TrainingGoals: React.FC<TrainingGoalsProps> = ({ userId, onClose }) => {
  const [goals, setGoals] = useState<TrainingGoal[]>([]);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoalType, setNewGoalType] = useState<string>('sessions');
  const [newGoalTarget, setNewGoalTarget] = useState<number>(5);
  const [newGoalPeriod, setNewGoalPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  // Load goals from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`agnes_goals_${userId}`);
    if (stored) {
      setGoals(JSON.parse(stored));
    }
  }, [userId]);

  // Save goals to localStorage
  const saveGoals = (updatedGoals: TrainingGoal[]) => {
    localStorage.setItem(`agnes_goals_${userId}`, JSON.stringify(updatedGoals));
    setGoals(updatedGoals);
  };

  const addGoal = () => {
    const newGoal: TrainingGoal = {
      id: `goal_${Date.now()}`,
      type: newGoalType as TrainingGoal['type'],
      target: newGoalTarget,
      current: 0,
      period: newGoalPeriod,
      createdAt: new Date().toISOString()
    };
    saveGoals([...goals, newGoal]);
    setShowAddGoal(false);
    setNewGoalType('sessions');
    setNewGoalTarget(5);
    setNewGoalPeriod('weekly');
  };

  const removeGoal = (goalId: string) => {
    saveGoals(goals.filter(g => g.id !== goalId));
  };

  const getGoalTypeInfo = (type: string) => {
    return GOAL_TYPES.find(t => t.id === type) || GOAL_TYPES[0];
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string; progress: string }> = {
      cyan: { bg: 'bg-cyan-900/20', text: 'text-cyan-400', border: 'border-cyan-500/30', progress: 'bg-cyan-500' },
      yellow: { bg: 'bg-yellow-900/20', text: 'text-yellow-400', border: 'border-yellow-500/30', progress: 'bg-yellow-500' },
      orange: { bg: 'bg-orange-900/20', text: 'text-orange-400', border: 'border-orange-500/30', progress: 'bg-orange-500' },
      purple: { bg: 'bg-purple-900/20', text: 'text-purple-400', border: 'border-purple-500/30', progress: 'bg-purple-500' }
    };
    return colors[color] || colors.cyan;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-yellow-500 uppercase tracking-[0.2em]">
          Training Goals
        </h3>
        <button
          onClick={() => setShowAddGoal(true)}
          className="flex items-center space-x-1 text-xs text-neutral-400 hover:text-white transition-colors"
        >
          <Plus className="w-3 h-3" />
          <span>Add Goal</span>
        </button>
      </div>

      {/* Goals List */}
      {goals.length === 0 ? (
        <div className="p-6 border border-dashed border-neutral-700 rounded-xl text-center">
          <Target className="w-8 h-8 text-neutral-600 mx-auto mb-3" />
          <p className="text-neutral-500 text-sm mb-3">No goals set yet</p>
          <button
            onClick={() => setShowAddGoal(true)}
            className="text-red-500 text-sm hover:text-red-400 transition-colors"
          >
            Set your first goal
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map(goal => {
            const typeInfo = getGoalTypeInfo(goal.type);
            const colors = getColorClasses(typeInfo.color);
            const progress = Math.min((goal.current / goal.target) * 100, 100);
            const isComplete = goal.current >= goal.target;

            return (
              <div
                key={goal.id}
                className={`relative p-4 rounded-xl border ${colors.border} ${colors.bg} transition-all duration-300`}
              >
                {isComplete && (
                  <div className="absolute top-2 right-2">
                    <span className="flex items-center space-x-1 text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">
                      <Check className="w-3 h-3" />
                      <span>Done</span>
                    </span>
                  </div>
                )}

                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${colors.bg}`}>
                    <typeInfo.icon className={`w-4 h-4 ${colors.text}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-white text-sm font-medium">{typeInfo.label}</span>
                      <span className="text-neutral-500 text-xs capitalize">({goal.period})</span>
                    </div>

                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`text-lg font-bold ${colors.text}`}>{goal.current}</span>
                      <span className="text-neutral-600">/</span>
                      <span className="text-neutral-400">{goal.target} {typeInfo.unit}</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${colors.progress} rounded-full transition-all duration-500`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => removeGoal(goal.id)}
                    className="text-neutral-600 hover:text-red-500 text-xs transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Goal Modal */}
      {showAddGoal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-6 max-w-md w-full">
            <h4 className="text-white font-bold text-lg mb-6">Set New Goal</h4>

            {/* Goal Type */}
            <div className="mb-4">
              <label className="text-neutral-400 text-xs uppercase tracking-wider mb-2 block">
                Goal Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {GOAL_TYPES.map(type => {
                  const colors = getColorClasses(type.color);
                  const isSelected = newGoalType === type.id;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setNewGoalType(type.id)}
                      className={`p-3 rounded-lg border ${isSelected ? colors.border + ' ' + colors.bg : 'border-neutral-700'} transition-all`}
                    >
                      <type.icon className={`w-4 h-4 ${isSelected ? colors.text : 'text-neutral-500'} mb-1`} />
                      <span className={`text-xs ${isSelected ? 'text-white' : 'text-neutral-400'}`}>
                        {type.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Target */}
            <div className="mb-4">
              <label className="text-neutral-400 text-xs uppercase tracking-wider mb-2 block">
                Target
              </label>
              <input
                type="number"
                value={newGoalTarget}
                onChange={e => setNewGoalTarget(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:border-red-500 focus:outline-none"
                min="1"
              />
            </div>

            {/* Period */}
            <div className="mb-6">
              <label className="text-neutral-400 text-xs uppercase tracking-wider mb-2 block">
                Time Period
              </label>
              <div className="flex space-x-2">
                {PERIOD_OPTIONS.map(period => (
                  <button
                    key={period.id}
                    onClick={() => setNewGoalPeriod(period.id as TrainingGoal['period'])}
                    className={`flex-1 py-2 px-3 rounded-lg border ${
                      newGoalPeriod === period.id
                        ? 'border-red-500 bg-red-900/20 text-white'
                        : 'border-neutral-700 text-neutral-400'
                    } transition-all text-sm`}
                  >
                    {period.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3">
              <button
                onClick={() => setShowAddGoal(false)}
                className="flex-1 py-3 border border-neutral-700 text-neutral-400 rounded-lg hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addGoal}
                className="flex-1 py-3 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors font-medium"
              >
                Add Goal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainingGoals;
