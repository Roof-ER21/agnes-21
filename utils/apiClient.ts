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

    for (const item of pending) {
      try {
        if (item.type === 'session') {
          await sessionsApi.create(item.data);
        } else if (item.type === 'session_update') {
          await sessionsApi.update(item.data.sessionId, item.data);
        } else if (item.type === 'xp') {
          await progressApi.awardXp(item.data.xp);
        }
      } catch {
        failed.push(item);
      }
    }

    // Put failed items back
    if (failed.length > 0) {
      localStorage.setItem('agnes_pending_sync', JSON.stringify(failed));
    }

    return { synced: pending.length - failed.length, failed: failed.length };
  },
};
