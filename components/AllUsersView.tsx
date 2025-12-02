/**
 * All Users View Component for Managers
 * Shows all registered users and their training sessions
 */

import React, { useState, useEffect } from 'react';
import { getUsers, User } from '../utils/auth';
import { getSessions, SessionData } from '../utils/sessionStorage';
import { ArrowLeft, Users as UsersIcon, Video, MessageSquare, Trophy, Calendar, Clock, Search } from 'lucide-react';
import { DifficultyLevel, PitchMode } from '../types';

interface AllUsersViewProps {
  onBack: () => void;
}

interface UserWithSessions {
  user: User;
  sessions: SessionData[];
  totalSessions: number;
  averageScore: number;
  totalMinutes: number;
}

const AllUsersView: React.FC<AllUsersViewProps> = ({ onBack }) => {
  const [usersWithSessions, setUsersWithSessions] = useState<UserWithSessions[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWithSessions | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllUsersData();
  }, []);

  const loadAllUsersData = () => {
    setLoading(true);
    const users = getUsers();

    const usersData: UserWithSessions[] = users.map(user => {
      const sessions = getSessions(user.id);
      const sessionsWithScores = sessions.filter(s => s.finalScore !== undefined);
      const averageScore = sessionsWithScores.length > 0
        ? Math.round(sessionsWithScores.reduce((sum, s) => sum + (s.finalScore || 0), 0) / sessionsWithScores.length)
        : 0;
      const totalMinutes = Math.round(sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / 60);

      return {
        user,
        sessions,
        totalSessions: sessions.length,
        averageScore,
        totalMinutes
      };
    });

    // Sort by most active (most sessions)
    usersData.sort((a, b) => b.totalSessions - a.totalSessions);

    setUsersWithSessions(usersData);
    setLoading(false);
  };

  const filteredUsers = usersWithSessions.filter(({ user }) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDifficultyColor = (difficulty: DifficultyLevel): string => {
    switch (difficulty) {
      case DifficultyLevel.ROOKIE:
        return 'text-green-400 bg-green-900/20';
      case DifficultyLevel.PRO:
        return 'text-yellow-400 bg-yellow-900/20';
      case DifficultyLevel.ELITE:
        return 'text-red-400 bg-red-900/20';
    }
  };

  const getModeIcon = (mode: PitchMode) => {
    switch (mode) {
      case PitchMode.COACH:
        return '📚';
      case PitchMode.ROLEPLAY:
        return '🎭';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-neutral-400">Loading users...</p>
        </div>
      </div>
    );
  }

  // Detail view for selected user
  if (selectedUser) {
    return (
      <div className="min-h-screen overflow-y-auto bg-black text-white p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => setSelectedUser(null)}
              className="group flex items-center space-x-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-red-900/50 rounded-full transition-all duration-300"
            >
              <ArrowLeft className="w-4 h-4 text-neutral-400 group-hover:text-red-500" />
              <span className="text-sm font-mono uppercase tracking-wider text-neutral-400 group-hover:text-white">
                Back to All Users
              </span>
            </button>
          </div>

          {/* User Info Header */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 mb-6">
            <div className="flex items-center space-x-4">
              <div className="text-5xl">{selectedUser.user.avatar}</div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-2">{selectedUser.user.name}</h2>
                <div className="flex items-center space-x-4 text-sm text-neutral-400">
                  <div className="flex items-center space-x-1">
                    <span className="px-2 py-1 rounded bg-neutral-800 text-neutral-300">
                      {selectedUser.user.role === 'manager' ? '👔 Manager' : '🎯 Sales Rep'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {new Date(selectedUser.user.createdAt).toLocaleDateString()}</span>
                  </div>
                  {selectedUser.user.lastLogin && (
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>Last active {new Date(selectedUser.user.lastLogin).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="flex space-x-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-500">{selectedUser.totalSessions}</div>
                  <div className="text-xs text-neutral-400 uppercase">Sessions</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-500">{selectedUser.averageScore}</div>
                  <div className="text-xs text-neutral-400 uppercase">Avg Score</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-500">{selectedUser.totalMinutes}</div>
                  <div className="text-xs text-neutral-400 uppercase">Minutes</div>
                </div>
              </div>
            </div>
          </div>

          {/* Sessions List */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-red-500" />
              <span>Training Sessions</span>
              <span className="text-sm text-neutral-500">({selectedUser.sessions.length})</span>
            </h3>

            {selectedUser.sessions.length === 0 ? (
              <div className="text-center py-12 text-neutral-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No training sessions yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {[...selectedUser.sessions].reverse().map((session) => (
                  <div
                    key={session.sessionId}
                    className="bg-neutral-800 border border-neutral-700 rounded-lg p-4 hover:border-neutral-600 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">{getModeIcon(session.mode)}</div>
                        <div>
                          <div className="font-medium text-white">{session.mode} Mode</div>
                          <div className="text-xs text-neutral-400">
                            {new Date(session.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(session.difficulty)}`}>
                          {session.difficulty}
                        </span>
                        {session.finalScore !== undefined && (
                          <span className="px-3 py-1 rounded bg-yellow-900/20 text-yellow-400 font-bold text-sm">
                            {session.finalScore}/100
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Transcript preview */}
                    {session.transcript.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <div className="text-xs text-neutral-400 uppercase font-medium mb-2">
                          Transcript ({session.transcript.length} messages)
                        </div>
                        <div className="bg-neutral-900 rounded p-3 max-h-40 overflow-y-auto space-y-2">
                          {session.transcript.slice(0, 5).map((msg, idx) => (
                            <div key={idx} className="text-sm">
                              <span className={msg.role === 'agnes' ? 'text-red-400' : 'text-blue-400'}>
                                {msg.role === 'agnes' ? 'Agnes' : selectedUser.user.name}:
                              </span>
                              <span className="text-neutral-300 ml-2">
                                {msg.text.substring(0, 100)}{msg.text.length > 100 ? '...' : ''}
                              </span>
                            </div>
                          ))}
                          {session.transcript.length > 5 && (
                            <div className="text-xs text-neutral-500 italic">
                              + {session.transcript.length - 5} more messages
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Session stats */}
                    <div className="mt-3 flex items-center space-x-4 text-xs text-neutral-400">
                      {session.duration && (
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{Math.round(session.duration / 60)} min</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <MessageSquare className="w-3 h-3" />
                        <span>{session.transcript.length} exchanges</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main users list view
  return (
    <div className="min-h-screen overflow-y-auto bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={onBack}
              className="group flex items-center space-x-2 px-4 py-2 mb-4 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-red-900/50 rounded-full transition-all duration-300"
            >
              <ArrowLeft className="w-4 h-4 text-neutral-400 group-hover:text-red-500" />
              <span className="text-sm font-mono uppercase tracking-wider text-neutral-400 group-hover:text-white">
                Back
              </span>
            </button>
            <h1 className="text-4xl font-bold flex items-center space-x-3">
              <UsersIcon className="w-10 h-10 text-red-500" />
              <span>All Users</span>
            </h1>
            <p className="text-neutral-400 text-lg mt-2">
              {usersWithSessions.length} total users • {usersWithSessions.filter(u => u.totalSessions > 0).length} active
            </p>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search users..."
              className="pl-10 pr-4 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-red-500 w-64"
            />
          </div>
        </div>

        {/* Users Grid */}
        {filteredUsers.length === 0 ? (
          <div className="text-center py-20 text-neutral-500">
            <UsersIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No users found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map(({ user, sessions, totalSessions, averageScore, totalMinutes }) => (
              <div
                key={user.id}
                onClick={() => setSelectedUser({ user, sessions, totalSessions, averageScore, totalMinutes })}
                className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 hover:border-red-900/50 hover:bg-neutral-800 transition-all cursor-pointer group"
              >
                {/* Avatar & Name */}
                <div className="flex items-center space-x-3 mb-4">
                  <div className="text-4xl">{user.avatar}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-white truncate group-hover:text-red-400 transition-colors">
                      {user.name}
                    </h3>
                    <div className="text-xs text-neutral-400">
                      {user.role === 'manager' ? '👔 Manager' : '🎯 Sales Rep'}
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-neutral-800 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-red-500">{totalSessions}</div>
                    <div className="text-[10px] text-neutral-400 uppercase mt-1">Sessions</div>
                  </div>
                  <div className="bg-neutral-800 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-yellow-500">{averageScore}</div>
                    <div className="text-[10px] text-neutral-400 uppercase mt-1">Score</div>
                  </div>
                  <div className="bg-neutral-800 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-blue-500">{totalMinutes}</div>
                    <div className="text-[10px] text-neutral-400 uppercase mt-1">Minutes</div>
                  </div>
                </div>

                {/* Last Activity */}
                <div className="text-xs text-neutral-500 flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                  {user.lastLogin && (
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(user.lastLogin).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AllUsersView;
