import React, { useState, useEffect } from 'react';
import { Trophy, Users, Flame, Target, Clock, Crown, Medal, Award, Plus, Calendar, Zap } from 'lucide-react';

export interface TeamContest {
  id: string;
  title: string;
  description: string;
  type: 'sessions' | 'xp' | 'score' | 'streak';
  target: number;
  startDate: string;
  endDate: string;
  prize: string;
  participants: { id: string; name: string; value: number }[];
  status: 'active' | 'upcoming' | 'completed';
  createdBy: string;
}

interface TeamContestsProps {
  userId: string;
  userName: string;
  isManager?: boolean;
}

const CONTEST_TYPES = [
  { id: 'sessions', label: 'Most Sessions', icon: Target, color: 'cyan' },
  { id: 'xp', label: 'Most XP', icon: Zap, color: 'yellow' },
  { id: 'score', label: 'Highest Avg Score', icon: Trophy, color: 'green' },
  { id: 'streak', label: 'Longest Streak', icon: Flame, color: 'orange' }
];

const TeamContests: React.FC<TeamContestsProps> = ({ userId, userName, isManager = false }) => {
  const [contests, setContests] = useState<TeamContest[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState<'active' | 'upcoming' | 'completed'>('active');
  const [newContest, setNewContest] = useState({
    title: '',
    description: '',
    type: 'sessions' as TeamContest['type'],
    target: 10,
    startDate: '',
    endDate: '',
    prize: ''
  });

  // Load contests from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('agnes_team_contests');
    if (stored) {
      setContests(JSON.parse(stored));
    } else {
      // Initialize with a sample contest
      const sampleContests: TeamContest[] = [
        {
          id: 'contest_1',
          title: 'December Training Challenge',
          description: 'Complete the most training sessions this month!',
          type: 'sessions',
          target: 20,
          startDate: '2025-12-01',
          endDate: '2025-12-31',
          prize: 'Featured on Leaderboard + Bragging Rights',
          participants: [],
          status: 'active',
          createdBy: 'system'
        }
      ];
      localStorage.setItem('agnes_team_contests', JSON.stringify(sampleContests));
      setContests(sampleContests);
    }
  }, []);

  const saveContests = (updated: TeamContest[]) => {
    localStorage.setItem('agnes_team_contests', JSON.stringify(updated));
    setContests(updated);
  };

  const joinContest = (contestId: string) => {
    const updated = contests.map(c => {
      if (c.id === contestId && !c.participants.some(p => p.id === userId)) {
        return {
          ...c,
          participants: [...c.participants, { id: userId, name: userName, value: 0 }]
        };
      }
      return c;
    });
    saveContests(updated);
  };

  const createContest = () => {
    if (!newContest.title || !newContest.startDate || !newContest.endDate) return;

    const contest: TeamContest = {
      id: `contest_${Date.now()}`,
      ...newContest,
      participants: [{ id: userId, name: userName, value: 0 }],
      status: new Date(newContest.startDate) > new Date() ? 'upcoming' : 'active',
      createdBy: userId
    };

    saveContests([...contests, contest]);
    setShowCreateModal(false);
    setNewContest({
      title: '',
      description: '',
      type: 'sessions',
      target: 10,
      startDate: '',
      endDate: '',
      prize: ''
    });
  };

  const getTypeInfo = (type: string) => {
    return CONTEST_TYPES.find(t => t.id === type) || CONTEST_TYPES[0];
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      cyan: { bg: 'bg-cyan-900/20', text: 'text-cyan-400', border: 'border-cyan-500/30' },
      yellow: { bg: 'bg-yellow-900/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
      green: { bg: 'bg-green-900/20', text: 'text-green-400', border: 'border-green-500/30' },
      orange: { bg: 'bg-orange-900/20', text: 'text-orange-400', border: 'border-orange-500/30' }
    };
    return colors[color] || colors.cyan;
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2: return <Medal className="w-5 h-5 text-gray-400" />;
      case 3: return <Medal className="w-5 h-5 text-amber-600" />;
      default: return <Award className="w-4 h-4 text-neutral-500" />;
    }
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  const filteredContests = contests.filter(c => c.status === filter);
  const userContests = contests.filter(c => c.participants.some(p => p.id === userId));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-yellow-500 uppercase tracking-[0.2em]">
          Team Contests
        </h3>
        {isManager && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-1 text-xs text-neutral-400 hover:text-white transition-colors"
          >
            <Plus className="w-3 h-3" />
            <span>Create</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2">
        {(['active', 'upcoming', 'completed'] as const).map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
              filter === status
                ? 'bg-red-600 text-white'
                : 'bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Contests List */}
      {filteredContests.length === 0 ? (
        <div className="p-6 border border-dashed border-neutral-700 rounded-xl text-center">
          <Trophy className="w-8 h-8 text-neutral-600 mx-auto mb-3" />
          <p className="text-neutral-500 text-sm">No {filter} contests</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredContests.map(contest => {
            const typeInfo = getTypeInfo(contest.type);
            const colors = getColorClasses(typeInfo.color);
            const isJoined = contest.participants.some(p => p.id === userId);
            const sortedParticipants = [...contest.participants].sort((a, b) => b.value - a.value);
            const daysRemaining = getDaysRemaining(contest.endDate);

            return (
              <div
                key={contest.id}
                className={`p-4 rounded-xl border ${colors.border} ${colors.bg} transition-all duration-300`}
              >
                {/* Contest Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${colors.bg}`}>
                      <typeInfo.icon className={`w-5 h-5 ${colors.text}`} />
                    </div>
                    <div>
                      <h4 className="text-white font-bold">{contest.title}</h4>
                      <p className="text-neutral-400 text-xs">{contest.description}</p>
                    </div>
                  </div>
                  {contest.status === 'active' && (
                    <div className="flex items-center space-x-1 text-neutral-500 text-xs">
                      <Clock className="w-3 h-3" />
                      <span>{daysRemaining}d left</span>
                    </div>
                  )}
                </div>

                {/* Prize */}
                {contest.prize && (
                  <div className="mb-3 px-3 py-2 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                    <span className="text-yellow-400 text-xs">
                      <Trophy className="w-3 h-3 inline mr-1" />
                      Prize: {contest.prize}
                    </span>
                  </div>
                )}

                {/* Leaderboard Preview */}
                {sortedParticipants.length > 0 && (
                  <div className="mb-3">
                    <div className="text-neutral-500 text-xs uppercase tracking-wider mb-2">Top Performers</div>
                    <div className="space-y-2">
                      {sortedParticipants.slice(0, 3).map((participant, index) => (
                        <div
                          key={participant.id}
                          className={`flex items-center justify-between p-2 rounded-lg ${
                            participant.id === userId ? 'bg-red-900/20 border border-red-500/30' : 'bg-neutral-800/50'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            {getRankIcon(index + 1)}
                            <span className={`text-sm ${participant.id === userId ? 'text-red-400 font-bold' : 'text-white'}`}>
                              {participant.name}
                            </span>
                          </div>
                          <span className={`text-sm font-bold ${colors.text}`}>
                            {participant.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-neutral-700">
                  <div className="flex items-center space-x-2 text-neutral-500 text-xs">
                    <Users className="w-3 h-3" />
                    <span>{contest.participants.length} participants</span>
                  </div>

                  {contest.status === 'active' || contest.status === 'upcoming' ? (
                    isJoined ? (
                      <span className="text-green-400 text-xs">Joined</span>
                    ) : (
                      <button
                        onClick={() => joinContest(contest.id)}
                        className="px-3 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-500 transition-colors"
                      >
                        Join Contest
                      </button>
                    )
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Contest Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h4 className="text-white font-bold text-lg mb-6">Create Team Contest</h4>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="text-neutral-400 text-xs uppercase tracking-wider mb-2 block">
                  Contest Title
                </label>
                <input
                  type="text"
                  value={newContest.title}
                  onChange={e => setNewContest(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:border-red-500 focus:outline-none"
                  placeholder="e.g., December Training Sprint"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-neutral-400 text-xs uppercase tracking-wider mb-2 block">
                  Description
                </label>
                <textarea
                  value={newContest.description}
                  onChange={e => setNewContest(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:border-red-500 focus:outline-none resize-none"
                  rows={2}
                  placeholder="What's this contest about?"
                />
              </div>

              {/* Type */}
              <div>
                <label className="text-neutral-400 text-xs uppercase tracking-wider mb-2 block">
                  Contest Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CONTEST_TYPES.map(type => {
                    const colors = getColorClasses(type.color);
                    const isSelected = newContest.type === type.id;
                    return (
                      <button
                        key={type.id}
                        onClick={() => setNewContest(prev => ({ ...prev, type: type.id as TeamContest['type'] }))}
                        className={`p-3 rounded-lg border text-left ${
                          isSelected ? colors.border + ' ' + colors.bg : 'border-neutral-700'
                        } transition-all`}
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

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-400 text-xs uppercase tracking-wider mb-2 block">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={newContest.startDate}
                    onChange={e => setNewContest(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-neutral-400 text-xs uppercase tracking-wider mb-2 block">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={newContest.endDate}
                    onChange={e => setNewContest(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Prize */}
              <div>
                <label className="text-neutral-400 text-xs uppercase tracking-wider mb-2 block">
                  Prize (Optional)
                </label>
                <input
                  type="text"
                  value={newContest.prize}
                  onChange={e => setNewContest(prev => ({ ...prev, prize: e.target.value }))}
                  className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:border-red-500 focus:outline-none"
                  placeholder="e.g., Gift card, Day off, etc."
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-3 border border-neutral-700 text-neutral-400 rounded-lg hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createContest}
                className="flex-1 py-3 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors font-medium"
              >
                Create Contest
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamContests;
