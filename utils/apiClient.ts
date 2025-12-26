/**
 * API Client for Agnes-21 Backend
 * Handles all communication with the backend server
 */

const API_BASE = '/api';

// Token management
let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    localStorage.setItem('agnes_auth_token', token);
  } else {
    localStorage.removeItem('agnes_auth_token');
  }
};

export const getAuthToken = (): string | null => {
  if (!authToken) {
    authToken = localStorage.getItem('agnes_auth_token');
  }
  return authToken;
};

// Generic fetch wrapper
const apiFetch = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getAuthToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
};

// Auth API
export const authApi = {
  login: async (name: string, pin: string) => {
    const result = await apiFetch<{
      token: string;
      user: {
        id: string;
        name: string;
        role: string;
        division: string;
        avatar: string;
        totalXp: number;
        currentLevel: number;
        currentStreak: number;
        longestStreak: number;
      };
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ name, pin }),
    });
    setAuthToken(result.token);
    return result;
  },

  register: async (name: string, pin: string, role = 'trainee', avatar = '👤', division = 'insurance') => {
    const result = await apiFetch<{
      token: string;
      user: {
        id: string;
        name: string;
        role: string;
        division: string;
        avatar: string;
        totalXp: number;
        currentLevel: number;
        currentStreak: number;
        longestStreak: number;
      };
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, pin, role, avatar, division }),
    });
    setAuthToken(result.token);
    return result;
  },

  getMe: async () => {
    return apiFetch<{
      id: string;
      name: string;
      role: string;
      division: string;
      avatar: string;
      totalXp: number;
      currentLevel: number;
      currentStreak: number;
      longestStreak: number;
    }>('/auth/me');
  },

  logout: () => {
    setAuthToken(null);
  },
};

// Sessions API
export const sessionsApi = {
  create: async (data: {
    mode: string;
    difficulty: string;
    scriptId?: string;
    scriptName?: string;
    isMiniModule?: boolean;
  }) => {
    return apiFetch<{
      id: string;
      sessionId: string;
      message: string;
    }>('/sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (
    sessionId: string,
    data: {
      finalScore?: number;
      duration?: number;
      xpEarned?: number;
      transcript?: unknown;
    }
  ) => {
    return apiFetch<{ message: string }>(`/sessions/${sessionId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  list: async (limit = 50, offset = 0) => {
    return apiFetch<Array<{
      id: string;
      sessionId: string;
      userId: string;
      mode: string;
      difficulty: string;
      scriptId?: string;
      scriptName?: string;
      isMiniModule: boolean;
      duration?: number;
      finalScore?: number;
      xpEarned: number;
      transcript?: unknown;
      createdAt: string;
      completedAt?: string;
    }>>(`/sessions?limit=${limit}&offset=${offset}`);
  },

  get: async (sessionId: string) => {
    return apiFetch<{
      id: string;
      sessionId: string;
      userId: string;
      mode: string;
      difficulty: string;
      scriptId?: string;
      scriptName?: string;
      isMiniModule: boolean;
      duration?: number;
      finalScore?: number;
      xpEarned: number;
      transcript?: unknown;
      createdAt: string;
      completedAt?: string;
    }>(`/sessions/${sessionId}`);
  },
};

// Progress API
export const progressApi = {
  get: async () => {
    return apiFetch<{
      totalXp: number;
      currentLevel: number;
      xpToNextLevel: number;
      progressPercentage: number;
      currentStreak: number;
      longestStreak: number;
      lastPracticeDate?: string;
    }>('/progress');
  },

  awardXp: async (xp: number) => {
    return apiFetch<{
      xpAwarded: number;
      totalXp: number;
      previousLevel: number;
      newLevel: number;
      leveledUp: boolean;
      currentStreak: number;
      longestStreak: number;
    }>('/progress/xp', {
      method: 'PUT',
      body: JSON.stringify({ xp }),
    });
  },
};

// Leaderboard API
export const leaderboardApi = {
  get: async () => {
    return apiFetch<Array<{
      rank: number;
      id: string;
      name: string;
      avatar: string;
      totalXp: number;
      currentLevel: number;
      currentStreak: number;
      longestStreak: number;
    }>>('/leaderboard');
  },

  getWeekly: async () => {
    return apiFetch<Array<{
      rank: number;
      id: string;
      name: string;
      avatar: string;
      currentLevel: number;
      weeklyXp: number;
      sessionsCount: number;
    }>>('/leaderboard/weekly');
  },
};

// Analytics API (Manager only)
export const analyticsApi = {
  getTeamStats: async () => {
    return apiFetch<{
      totalUsers: number;
      totalSessions: number;
      averageScore: number;
      totalXpEarned: number;
      activeUsersLast7Days: number;
    }>('/analytics/team');
  },

  getSessionStats: async () => {
    return apiFetch<{
      byDifficulty: Array<{
        difficulty: string;
        count: number;
        avgScore: number;
      }>;
      byMode: Array<{
        mode: string;
        count: number;
        avgScore: number;
      }>;
      recentSessions: Array<{
        id: string;
        sessionId: string;
        userId: string;
        mode: string;
        difficulty: string;
        scriptName?: string;
        finalScore?: number;
        duration?: number;
        createdAt: string;
      }>;
    }>('/analytics/sessions');
  },

  getTrends: async () => {
    return apiFetch<{
      dailySessions: Array<{
        date: string;
        count: number;
        avgScore: number;
        totalXp: number;
      }>;
      topPerformers: Array<{
        userId: string;
        name: string;
        avatar: string;
        sessionsCount: number;
        totalXp: number;
        avgScore: number;
      }>;
    }>('/analytics/trends');
  },

  getAllUsers: async () => {
    return apiFetch<Array<{
      id: string;
      name: string;
      email?: string;
      role: string;
      avatar: string;
      totalXp: number;
      currentLevel: number;
      currentStreak: number;
      longestStreak: number;
      lastPracticeDate?: string;
      createdAt: string;
      lastLogin?: string;
    }>>('/analytics/users');
  },
};

// Admin API (Manager only) - User CRUD operations
export const adminApi = {
  // Create new user
  createUser: async (data: { name: string; pin: string; role?: string; avatar?: string; division?: string }) => {
    return apiFetch<{
      success: boolean;
      user: {
        id: string;
        name: string;
        role: string;
        division: string;
        avatar: string;
        totalXp: number;
        currentLevel: number;
        currentStreak: number;
        longestStreak: number;
      };
    }>('/auth/admin/create-user', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update user info
  updateUser: async (userId: string, data: { name?: string; role?: string; avatar?: string; division?: string }) => {
    return apiFetch<{
      success: boolean;
      user: {
        id: string;
        name: string;
        role: string;
        division: string;
        avatar: string;
        totalXp: number;
        currentLevel: number;
        currentStreak: number;
        longestStreak: number;
      };
    }>(`/auth/admin/user/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Reset user PIN
  resetPin: async (userId: string, newPin?: string) => {
    return apiFetch<{
      success: boolean;
      message: string;
      newPin?: string;
    }>(`/auth/admin/user/${userId}/reset-pin`, {
      method: 'PUT',
      body: JSON.stringify({ newPin }),
    });
  },

  // Delete user
  deleteUser: async (userId: string) => {
    return apiFetch<{
      success: boolean;
      message: string;
    }>(`/auth/admin/user/${userId}`, {
      method: 'DELETE',
    });
  },

  // Get all users
  getUsers: async () => {
    return apiFetch<Array<{
      id: string;
      name: string;
      role: string;
      division: string;
      avatar: string;
      totalXp: number;
      currentLevel: number;
      currentStreak: number;
      longestStreak: number;
      createdAt: string;
      lastLogin?: string;
    }>>('/auth/admin/users');
  },
};

// Health check
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    await apiFetch<{ status: string }>('/health');
    return true;
  } catch {
    return false;
  }
};

// Sync utilities for offline-first
export const syncUtils = {
  // Check if we have pending data to sync
  hasPendingSync: (): boolean => {
    const pending = localStorage.getItem('agnes_pending_sync');
    return !!pending && JSON.parse(pending).length > 0;
  },

  // Add item to pending sync queue
  addToPendingSync: (item: { type: string; data: unknown }) => {
    const pending = JSON.parse(localStorage.getItem('agnes_pending_sync') || '[]');
    pending.push({ ...item, timestamp: Date.now() });
    localStorage.setItem('agnes_pending_sync', JSON.stringify(pending));
  },

  // Get and clear pending sync items
  getPendingSync: () => {
    const pending = JSON.parse(localStorage.getItem('agnes_pending_sync') || '[]');
    localStorage.removeItem('agnes_pending_sync');
    return pending;
  },

  // Sync all pending items
  syncPending: async () => {
    const pending = syncUtils.getPendingSync();
    const failed: typeof pending = [];
    const syncedUserIds: string[] = [];

    for (const item of pending) {
      try {
        if (item.type === 'session') {
          await sessionsApi.create(item.data);
        } else if (item.type === 'session_update') {
          await sessionsApi.update(item.data.sessionId, item.data);
        } else if (item.type === 'xp') {
          await progressApi.awardXp(item.data.xp);
        } else if (item.type === 'user_create') {
          // Sync offline-created user to API
          try {
            await adminApi.createUser({
              name: item.data.name,
              pin: item.data.pin,
              role: item.data.role,
              division: item.data.division,
              avatar: item.data.avatar,
            });
            syncedUserIds.push(item.data.localId);
          } catch (userError) {
            // Check if user already exists (409 conflict or similar)
            const errorMsg = userError instanceof Error ? userError.message : '';
            if (errorMsg.includes('exists') || errorMsg.includes('409')) {
              // User already exists, mark as synced anyway
              syncedUserIds.push(item.data.localId);
            } else {
              throw userError;
            }
          }
        }
      } catch {
        failed.push(item);
      }
    }

    // Put failed items back
    if (failed.length > 0) {
      localStorage.setItem('agnes_pending_sync', JSON.stringify(failed));
    }

    return {
      synced: pending.length - failed.length,
      failed: failed.length,
      syncedUserIds
    };
  },

  // Mark local users as synced
  markUsersSynced: (userIds: string[]) => {
    const usersStr = localStorage.getItem('agnes_users');
    if (!usersStr) return;

    const users = JSON.parse(usersStr);
    const updatedUsers = users.map((u: { id: string; pendingSync?: boolean }) => {
      if (userIds.includes(u.id)) {
        return { ...u, pendingSync: false };
      }
      return u;
    });
    localStorage.setItem('agnes_users', JSON.stringify(updatedUsers));
  },

  // Get count of users pending sync
  getPendingUserCount: (): number => {
    const usersStr = localStorage.getItem('agnes_users');
    if (!usersStr) return 0;

    const users = JSON.parse(usersStr);
    return users.filter((u: { pendingSync?: boolean }) => u.pendingSync === true).length;
  },

  // Find and queue orphan localStorage users that aren't in the API database
  // This handles users created before the sync feature was added
  findAndQueueOrphanUsers: async (): Promise<{ found: number; queued: number }> => {
    const usersStr = localStorage.getItem('agnes_users');
    if (!usersStr) return { found: 0, queued: 0 };

    const localUsers = JSON.parse(usersStr);
    let found = 0;
    let queued = 0;

    try {
      // Fetch all users from API
      const apiUsers = await analyticsApi.getAllUsers();
      const apiUserNames = new Set(apiUsers.map(u => u.name.toLowerCase()));

      // Find local users that don't exist in API (by name match)
      const orphanUsers = localUsers.filter((localUser: { name: string; pendingSync?: boolean; pinHash?: string }) => {
        const isOrphan = !apiUserNames.has(localUser.name.toLowerCase());
        const notAlreadyPending = localUser.pendingSync !== true;
        return isOrphan && notAlreadyPending && localUser.pinHash; // Must have pinHash (local-created)
      });

      found = orphanUsers.length;

      // Queue orphan users for sync
      for (const orphan of orphanUsers) {
        // We can't sync without the original PIN, so we'll generate a temporary one
        // The user will need to reset their PIN after sync
        const tempPin = Math.floor(1000 + Math.random() * 9000).toString();

        syncUtils.addToPendingSync({
          type: 'user_create',
          data: {
            localId: orphan.id,
            name: orphan.name,
            pin: tempPin,
            role: orphan.role || 'trainee',
            division: orphan.division || 'insurance',
            avatar: orphan.avatar || '👤',
          }
        });

        queued++;
      }

      // Mark these users as pendingSync in localStorage
      if (queued > 0) {
        const updatedUsers = localUsers.map((u: { id: string; pendingSync?: boolean }) => {
          const isOrphan = orphanUsers.some((o: { id: string }) => o.id === u.id);
          if (isOrphan) {
            return { ...u, pendingSync: true, needsPinReset: true };
          }
          return u;
        });
        localStorage.setItem('agnes_users', JSON.stringify(updatedUsers));
      }

      return { found, queued };
    } catch (error) {
      console.warn('Failed to check for orphan users:', error);
      return { found: 0, queued: 0 };
    }
  },
};
