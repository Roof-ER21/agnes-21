/**
 * All Users View Component for Managers
 * Shows all registered users and their training sessions
 * Includes CRUD operations for user management
 */

import React, { useState, useEffect } from 'react';
import { getUsers, User } from '../utils/auth';
import { getSessions, SessionData } from '../utils/sessionStorage';
import { analyticsApi, sessionsApi, adminApi } from '../utils/apiClient';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowLeft,
  Users as UsersIcon,
  Video,
  MessageSquare,
  Trophy,
  Calendar,
  Clock,
  Search,
  Loader2,
  AlertCircle,
  Plus,
  Edit2,
  Key,
  Trash2,
  X,
  Check,
  RefreshCw
} from 'lucide-react';
import { DifficultyLevel, PitchMode } from '../types';

// Available avatars for selection
const AVATARS = ['👤', '🦅', '🐉', '⚡', '🔥', '⚔️', '🌪️', '❄️', '💥', '🛡️', '🎯', '🏆', '💎', '👑', '🌟', '🚀'];

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

// Modal types
type ModalType = 'create' | 'edit' | 'resetPin' | 'delete' | null;

interface ModalState {
  type: ModalType;
  user?: User;
}

const AllUsersView: React.FC<AllUsersViewProps> = ({ onBack }) => {
  const { user: currentUser } = useAuth();
  const [usersWithSessions, setUsersWithSessions] = useState<UserWithSessions[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWithSessions | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Modal state
  const [modal, setModal] = useState<ModalState>({ type: null });
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form state for create/edit
  const [formData, setFormData] = useState({
    name: '',
    pin: '',
    role: 'trainee' as 'trainee' | 'insurance_manager' | 'retail_manager' | 'manager',
    division: 'insurance' as 'insurance' | 'retail',
    avatar: '👤'
  });

  // Generated PIN state for reset
  const [generatedPin, setGeneratedPin] = useState<string | null>(null);

  useEffect(() => {
    loadAllUsersData();
  }, []);

  const loadAllUsersData = async () => {
    setLoading(true);
    setApiError(null);

    try {
      // Try to fetch from API first
      const apiUsers = await analyticsApi.getAllUsers();

      const usersData: UserWithSessions[] = apiUsers.map(apiUser => {
        // Transform API user to local User type
        const user: User = {
          id: apiUser.id,
          name: apiUser.name,
          role: apiUser.role as User['role'],
          division: (apiUser.division || 'insurance') as User['division'],
          avatar: apiUser.avatar,
          totalXp: apiUser.totalXp,
          currentLevel: apiUser.currentLevel,
          currentStreak: apiUser.currentStreak,
          longestStreak: apiUser.longestStreak,
          createdAt: apiUser.createdAt ? new Date(apiUser.createdAt) : new Date(),
          lastLogin: apiUser.lastLogin ? new Date(apiUser.lastLogin) : undefined,
        };

        // For now, sessions will be empty - we'll fetch them when user is selected
        return {
          user,
          sessions: [],
          totalSessions: 0, // Will be updated when sessions are fetched
          averageScore: 0,
          totalMinutes: 0
        };
      });

      // Sort by XP (most active)
      usersData.sort((a, b) => (b.user.totalXp || 0) - (a.user.totalXp || 0));

      setUsersWithSessions(usersData);
    } catch (error) {
      console.warn('Failed to fetch users from API, using localStorage:', error);
      // Provide specific error messages based on the error type
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('401') || errorMessage.includes('token')) {
        setApiError('Session expired - please log in again');
      } else if (errorMessage.includes('403') || errorMessage.includes('Manager')) {
        setApiError('Manager access required');
      } else if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
        setApiError('Server unavailable - using offline data');
      } else {
        setApiError('Using offline data');
      }

      // Fallback to localStorage
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
    } finally {
      setLoading(false);
    }
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

  // ============================================
  // CRUD HANDLERS
  // ============================================

  const openCreateModal = () => {
    setFormData({ name: '', pin: '', role: 'trainee', division: 'insurance', avatar: '👤' });
    setModalError(null);
    setModal({ type: 'create' });
  };

  const openEditModal = (user: User) => {
    setFormData({
      name: user.name,
      pin: '',
      role: user.role,
      division: user.division || 'insurance',
      avatar: user.avatar
    });
    setModalError(null);
    setModal({ type: 'edit', user });
  };

  const openResetPinModal = (user: User) => {
    setGeneratedPin(null);
    setModalError(null);
    setFormData({ ...formData, pin: '' });
    setModal({ type: 'resetPin', user });
  };

  const openDeleteModal = (user: User) => {
    setModalError(null);
    setModal({ type: 'delete', user });
  };

  const closeModal = () => {
    setModal({ type: null });
    setModalError(null);
    setGeneratedPin(null);
  };

  const handleCreateUser = async () => {
    if (!formData.name.trim()) {
      setModalError('Name is required');
      return;
    }
    if (!formData.pin || formData.pin.length !== 4 || !/^\d{4}$/.test(formData.pin)) {
      setModalError('PIN must be exactly 4 digits');
      return;
    }

    setModalLoading(true);
    setModalError(null);

    try {
      await adminApi.createUser({
        name: formData.name.trim(),
        pin: formData.pin,
        role: formData.role,
        division: formData.division,
        avatar: formData.avatar
      });
      closeModal();
      loadAllUsersData(); // Refresh the list
    } catch (error) {
      setModalError(error instanceof Error ? error.message : 'Failed to create user');
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!modal.user) return;
    if (!formData.name.trim()) {
      setModalError('Name is required');
      return;
    }

    setModalLoading(true);
    setModalError(null);

    try {
      await adminApi.updateUser(modal.user.id, {
        name: formData.name.trim(),
        role: formData.role,
        division: formData.division,
        avatar: formData.avatar
      });
      closeModal();
      loadAllUsersData(); // Refresh the list
    } catch (error) {
      setModalError(error instanceof Error ? error.message : 'Failed to update user');
    } finally {
      setModalLoading(false);
    }
  };

  const handleResetPin = async (useGenerated: boolean) => {
    if (!modal.user) return;
    if (!useGenerated && (!formData.pin || formData.pin.length !== 4 || !/^\d{4}$/.test(formData.pin))) {
      setModalError('PIN must be exactly 4 digits');
      return;
    }

    setModalLoading(true);
    setModalError(null);

    try {
      const result = await adminApi.resetPin(modal.user.id, useGenerated ? undefined : formData.pin);
      if (result.newPin) {
        setGeneratedPin(result.newPin);
      } else {
        closeModal();
        loadAllUsersData();
      }
    } catch (error) {
      setModalError(error instanceof Error ? error.message : 'Failed to reset PIN');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!modal.user) return;

    setModalLoading(true);
    setModalError(null);

    try {
      await adminApi.deleteUser(modal.user.id);
      closeModal();
      loadAllUsersData(); // Refresh the list
    } catch (error) {
      setModalError(error instanceof Error ? error.message : 'Failed to delete user');
    } finally {
      setModalLoading(false);
    }
  };

  // ============================================
  // MODAL RENDERING
  // ============================================

  const renderModal = () => {
    if (!modal.type) return null;

    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-md shadow-2xl">
          {/* Create User Modal */}
          {modal.type === 'create' && (
            <>
              <div className="flex items-center justify-between p-6 border-b border-neutral-800">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Plus className="w-5 h-5 text-green-500" />
                  Create New User
                </h2>
                <button onClick={closeModal} className="text-neutral-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:outline-none focus:border-red-500"
                    placeholder="Enter user name"
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">4-Digit PIN</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={formData.pin}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '') })}
                    className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:outline-none focus:border-red-500"
                    placeholder="0000"
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Division</label>
                  <select
                    value={formData.division}
                    onChange={(e) => setFormData({ ...formData, division: e.target.value as 'insurance' | 'retail' })}
                    className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:outline-none focus:border-red-500"
                  >
                    <option value="insurance">Insurance</option>
                    <option value="retail">Retail</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'trainee' | 'insurance_manager' | 'retail_manager' | 'manager' })}
                    className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:outline-none focus:border-red-500"
                  >
                    <option value="trainee">Sales Rep (Trainee)</option>
                    <option value="insurance_manager">Insurance Manager</option>
                    <option value="retail_manager">Retail Manager</option>
                    <option value="manager">Admin (All Divisions)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Avatar</label>
                  <div className="flex flex-wrap gap-2">
                    {AVATARS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => setFormData({ ...formData, avatar: emoji })}
                        className={`text-2xl p-2 rounded-lg transition-all ${
                          formData.avatar === emoji
                            ? 'bg-red-600 ring-2 ring-red-400'
                            : 'bg-neutral-800 hover:bg-neutral-700'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
                {modalError && (
                  <div className="text-red-400 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {modalError}
                  </div>
                )}
              </div>
              <div className="flex gap-3 p-6 border-t border-neutral-800">
                <button
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateUser}
                  disabled={modalLoading}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {modalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Create User
                </button>
              </div>
            </>
          )}

          {/* Edit User Modal */}
          {modal.type === 'edit' && modal.user && (
            <>
              <div className="flex items-center justify-between p-6 border-b border-neutral-800">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-blue-500" />
                  Edit User: {modal.user.name}
                </h2>
                <button onClick={closeModal} className="text-neutral-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Division</label>
                  <select
                    value={formData.division}
                    onChange={(e) => setFormData({ ...formData, division: e.target.value as 'insurance' | 'retail' })}
                    className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:outline-none focus:border-red-500"
                  >
                    <option value="insurance">Insurance</option>
                    <option value="retail">Retail</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'trainee' | 'insurance_manager' | 'retail_manager' | 'manager' })}
                    className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:outline-none focus:border-red-500"
                  >
                    <option value="trainee">Sales Rep (Trainee)</option>
                    <option value="insurance_manager">Insurance Manager</option>
                    <option value="retail_manager">Retail Manager</option>
                    <option value="manager">Admin (All Divisions)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Avatar</label>
                  <div className="flex flex-wrap gap-2">
                    {AVATARS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => setFormData({ ...formData, avatar: emoji })}
                        className={`text-2xl p-2 rounded-lg transition-all ${
                          formData.avatar === emoji
                            ? 'bg-red-600 ring-2 ring-red-400'
                            : 'bg-neutral-800 hover:bg-neutral-700'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
                {modalError && (
                  <div className="text-red-400 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {modalError}
                  </div>
                )}
              </div>
              <div className="flex gap-3 p-6 border-t border-neutral-800">
                <button
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateUser}
                  disabled={modalLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {modalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Save Changes
                </button>
              </div>
            </>
          )}

          {/* Reset PIN Modal */}
          {modal.type === 'resetPin' && modal.user && (
            <>
              <div className="flex items-center justify-between p-6 border-b border-neutral-800">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Key className="w-5 h-5 text-yellow-500" />
                  Reset PIN: {modal.user.name}
                </h2>
                <button onClick={closeModal} className="text-neutral-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                {generatedPin ? (
                  <div className="text-center py-4">
                    <div className="text-green-400 mb-2 flex items-center justify-center gap-2">
                      <Check className="w-5 h-5" />
                      PIN Reset Successfully!
                    </div>
                    <div className="text-4xl font-mono font-bold tracking-widest bg-neutral-800 rounded-lg py-4">
                      {generatedPin}
                    </div>
                    <p className="text-sm text-neutral-400 mt-3">
                      Share this PIN with {modal.user.name}. It won't be shown again.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="text-center text-neutral-400 mb-4">
                      Choose how to reset the PIN:
                    </div>
                    <button
                      onClick={() => handleResetPin(true)}
                      disabled={modalLoading}
                      className="w-full px-4 py-3 bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-600/50 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <RefreshCw className={`w-4 h-4 ${modalLoading ? 'animate-spin' : ''}`} />
                      Generate Random PIN
                    </button>
                    <div className="text-center text-neutral-500 text-sm">or</div>
                    <div>
                      <label className="block text-sm text-neutral-400 mb-1">Set Specific PIN</label>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          maxLength={4}
                          value={formData.pin}
                          onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '') })}
                          className="flex-1 px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:outline-none focus:border-yellow-500"
                          placeholder="0000"
                        />
                        <button
                          onClick={() => handleResetPin(false)}
                          disabled={modalLoading || formData.pin.length !== 4}
                          className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 rounded-lg transition-colors disabled:opacity-50"
                        >
                          Set PIN
                        </button>
                      </div>
                    </div>
                  </>
                )}
                {modalError && (
                  <div className="text-red-400 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {modalError}
                  </div>
                )}
              </div>
              <div className="p-6 border-t border-neutral-800">
                <button
                  onClick={closeModal}
                  className="w-full px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors"
                >
                  {generatedPin ? 'Done' : 'Cancel'}
                </button>
              </div>
            </>
          )}

          {/* Delete User Modal */}
          {modal.type === 'delete' && modal.user && (
            <>
              <div className="flex items-center justify-between p-6 border-b border-neutral-800">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-red-500" />
                  Delete User
                </h2>
                <button onClick={closeModal} className="text-neutral-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="text-center">
                  <div className="text-5xl mb-3">{modal.user.avatar}</div>
                  <div className="text-lg font-bold">{modal.user.name}</div>
                  <div className="text-sm text-neutral-400">
                    {modal.user.role === 'manager' ? 'Admin' :
                     modal.user.role === 'insurance_manager' ? 'Insurance Manager' :
                     modal.user.role === 'retail_manager' ? 'Retail Manager' : 'Sales Rep'}
                    {' • '}
                    {modal.user.division === 'retail' ? 'Retail' : 'Insurance'}
                  </div>
                </div>
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-center">
                  <p className="text-red-400">
                    Are you sure you want to delete this user?
                  </p>
                  <p className="text-sm text-neutral-400 mt-2">
                    This will permanently remove the user and all their training sessions.
                    This action cannot be undone.
                  </p>
                </div>
                {modalError && (
                  <div className="text-red-400 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {modalError}
                  </div>
                )}
              </div>
              <div className="flex gap-3 p-6 border-t border-neutral-800">
                <button
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUser}
                  disabled={modalLoading}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {modalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Delete User
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-red-500 mx-auto mb-4 animate-spin" />
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
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded ${
                      selectedUser.user.division === 'retail'
                        ? 'bg-purple-900/30 text-purple-300'
                        : 'bg-blue-900/30 text-blue-300'
                    }`}>
                      {selectedUser.user.division === 'retail' ? '🏪 Retail' : '🏢 Insurance'}
                    </span>
                    <span className="px-2 py-1 rounded bg-neutral-800 text-neutral-300">
                      {selectedUser.user.role === 'manager' ? '👔 Admin' :
                       selectedUser.user.role === 'insurance_manager' ? '👔 Ins Manager' :
                       selectedUser.user.role === 'retail_manager' ? '👔 Ret Manager' : '🎯 Sales Rep'}
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
              {usersWithSessions.length} total users • {usersWithSessions.filter(u => u.totalSessions > 0 || u.user.totalXp).length} active
              {apiError && (
                <span className="ml-2 text-yellow-500 text-sm">
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  {apiError}
                </span>
              )}
            </p>
          </div>

          {/* Search and Create */}
          <div className="flex items-center gap-4">
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
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg transition-colors font-semibold"
            >
              <Plus className="w-5 h-5" />
              Create User
            </button>
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
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        user.division === 'retail'
                          ? 'bg-purple-900/30 text-purple-400'
                          : 'bg-blue-900/30 text-blue-400'
                      }`}>
                        {user.division === 'retail' ? '🏪 Retail' : '🏢 Insurance'}
                      </span>
                      <span className="text-xs text-neutral-400">
                        {user.role === 'manager' ? '👔 Admin' :
                         user.role === 'insurance_manager' ? '👔 Ins Mgr' :
                         user.role === 'retail_manager' ? '👔 Ret Mgr' : '🎯 Rep'}
                      </span>
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

                {/* Action Buttons */}
                <div className="flex gap-2 mt-4 pt-4 border-t border-neutral-800">
                  <button
                    onClick={(e) => { e.stopPropagation(); openEditModal(user); }}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/50 text-blue-400 rounded-lg text-sm transition-colors"
                    title="Edit user"
                  >
                    <Edit2 className="w-3 h-3" />
                    Edit
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); openResetPinModal(user); }}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-600/50 text-yellow-400 rounded-lg text-sm transition-colors"
                    title="Reset PIN"
                  >
                    <Key className="w-3 h-3" />
                    PIN
                  </button>
                  {user.id !== currentUser?.id && (
                    <button
                      onClick={(e) => { e.stopPropagation(); openDeleteModal(user); }}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-600/50 text-red-400 rounded-lg text-sm transition-colors"
                      title="Delete user"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Render Modals */}
        {renderModal()}
      </div>
    </div>
  );
};

export default AllUsersView;
