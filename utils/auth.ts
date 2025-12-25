/**
 * Authentication Utilities for Agnes-21
 * Handles PIN-based authentication with backend API + localStorage fallback
 */

import CryptoJS from 'crypto-js';
import { authApi, getAuthToken, setAuthToken } from './apiClient';

export interface User {
  id: string;
  name: string;
  role: 'trainee' | 'insurance_manager' | 'retail_manager' | 'manager';
  division: 'insurance' | 'retail';
  pinHash?: string;
  avatar: string;
  createdAt?: Date;
  lastLogin?: Date;
  totalXp?: number;
  currentLevel?: number;
  currentStreak?: number;
  longestStreak?: number;
}

interface LoginAttempt {
  count: number;
  lastAttempt: number;
}

const USERS_KEY = 'agnes_users';
const LOGIN_ATTEMPTS_KEY = 'agnes_login_attempts';
const CURRENT_USER_KEY = 'agnes_current_user';
const SESSION_EXPIRY_KEY = 'agnes_session_expiry';

// Security constants
const SALT = 'agnes21-secure-salt-v1';
const ITERATIONS = 10000;
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

/**
 * Hash PIN using PBKDF2
 */
export const hashPIN = (pin: string): string => {
  return CryptoJS.PBKDF2(pin, SALT, {
    keySize: 256 / 32,
    iterations: ITERATIONS
  }).toString();
};

/**
 * Verify PIN against stored hash
 */
export const verifyPIN = (pin: string, storedHash: string): boolean => {
  const hash = hashPIN(pin);
  return hash === storedHash;
};

/**
 * Validate PIN format (4-6 digits, no sequential/repeated)
 */
export const validatePIN = (pin: string): { valid: boolean; error?: string } => {
  if (pin.length < 4 || pin.length > 6) {
    return { valid: false, error: 'PIN must be 4-6 digits' };
  }

  if (!/^\d+$/.test(pin)) {
    return { valid: false, error: 'PIN must contain only numbers' };
  }

  const isSequential = (str: string): boolean => {
    for (let i = 0; i < str.length - 1; i++) {
      const diff = parseInt(str[i + 1]) - parseInt(str[i]);
      if (Math.abs(diff) !== 1) return false;
    }
    return true;
  };

  if (isSequential(pin) || isSequential(pin.split('').reverse().join(''))) {
    return { valid: false, error: 'PIN cannot be sequential (1234, 4321, etc.)' };
  }

  if (new Set(pin).size === 1) {
    return { valid: false, error: 'PIN cannot be all the same digit' };
  }

  return { valid: true };
};

/**
 * Check rate limiting on login attempts
 */
export const checkRateLimit = (): { allowed: boolean; timeRemaining?: number } => {
  const attemptsStr = localStorage.getItem(LOGIN_ATTEMPTS_KEY);
  const attempts: LoginAttempt = attemptsStr
    ? JSON.parse(attemptsStr)
    : { count: 0, lastAttempt: 0 };

  const now = Date.now();

  if (now - attempts.lastAttempt > LOCKOUT_DURATION) {
    attempts.count = 0;
    localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(attempts));
    return { allowed: true };
  }

  if (attempts.count >= MAX_ATTEMPTS) {
    const timeRemaining = Math.ceil((LOCKOUT_DURATION - (now - attempts.lastAttempt)) / 1000 / 60);
    return { allowed: false, timeRemaining };
  }

  return { allowed: true };
};

/**
 * Record failed login attempt
 */
export const recordFailedAttempt = (): void => {
  const attemptsStr = localStorage.getItem(LOGIN_ATTEMPTS_KEY);
  const attempts: LoginAttempt = attemptsStr
    ? JSON.parse(attemptsStr)
    : { count: 0, lastAttempt: 0 };

  attempts.count++;
  attempts.lastAttempt = Date.now();
  localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(attempts));
};

/**
 * Reset login attempts after successful login
 */
export const resetLoginAttempts = (): void => {
  localStorage.removeItem(LOGIN_ATTEMPTS_KEY);
};

/**
 * Get all users from localStorage (for offline/fallback)
 */
export const getUsers = (): User[] => {
  try {
    const usersStr = localStorage.getItem(USERS_KEY);
    if (!usersStr) return [];

    const users = JSON.parse(usersStr);
    return users.map((u: any) => ({
      ...u,
      division: u.division || 'insurance', // Default for legacy users
      createdAt: new Date(u.createdAt),
      lastLogin: u.lastLogin ? new Date(u.lastLogin) : undefined
    }));
  } catch (error) {
    console.error('Failed to get users:', error);
    return [];
  }
};

/**
 * Find user by name in localStorage
 */
export const findUserByName = (name: string): User | null => {
  const users = getUsers();
  return users.find(u => u.name.toLowerCase() === name.toLowerCase()) || null;
};

/**
 * Generate unique user ID
 */
const generateUserId = (): string => {
  return `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Create new user - tries API first, falls back to localStorage
 */
export const createUser = async (
  name: string,
  pin: string,
  role: 'trainee' | 'insurance_manager' | 'retail_manager' | 'manager',
  avatar: string,
  division: 'insurance' | 'retail' = 'insurance'
): Promise<User> => {
  const pinValidation = validatePIN(pin);
  if (!pinValidation.valid) {
    throw new Error(pinValidation.error);
  }

  // Try API first
  try {
    const result = await authApi.register(name, pin, role, avatar, division);
    const user: User = {
      id: result.user.id,
      name: result.user.name,
      role: result.user.role as User['role'],
      division: result.user.division as User['division'],
      avatar: result.user.avatar,
      totalXp: result.user.totalXp,
      currentLevel: result.user.currentLevel,
      currentStreak: result.user.currentStreak,
      longestStreak: result.user.longestStreak,
      createdAt: new Date(),
    };

    // Also save to localStorage for offline access
    const users = getUsers();
    users.push({ ...user, pinHash: hashPIN(pin) });
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    // Save current user
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    localStorage.setItem(SESSION_EXPIRY_KEY, (Date.now() + SESSION_TIMEOUT).toString());

    return user;
  } catch (apiError) {
    console.warn('API registration failed, using localStorage:', apiError);

    // Fallback to localStorage
    const users = getUsers();
    if (findUserByName(name)) {
      throw new Error('Username already exists');
    }

    const newUser: User = {
      id: generateUserId(),
      name,
      role,
      division,
      pinHash: hashPIN(pin),
      avatar,
      createdAt: new Date(),
    };

    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    return newUser;
  }
};

/**
 * Login user - tries API first, falls back to localStorage
 */
export const login = async (
  name: string,
  pin: string
): Promise<{ success: boolean; user?: User; error?: string }> => {
  // Check rate limit
  const rateLimit = checkRateLimit();
  if (!rateLimit.allowed) {
    return {
      success: false,
      error: `Too many failed attempts. Try again in ${rateLimit.timeRemaining} minutes.`
    };
  }

  // Try API first
  try {
    const result = await authApi.login(name, pin);
    const user: User = {
      id: result.user.id,
      name: result.user.name,
      role: result.user.role as User['role'],
      division: result.user.division as User['division'],
      avatar: result.user.avatar,
      totalXp: result.user.totalXp,
      currentLevel: result.user.currentLevel,
      currentStreak: result.user.currentStreak,
      longestStreak: result.user.longestStreak,
      lastLogin: new Date(),
    };

    resetLoginAttempts();
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    localStorage.setItem(SESSION_EXPIRY_KEY, (Date.now() + SESSION_TIMEOUT).toString());

    return { success: true, user };
  } catch (apiError: any) {
    console.warn('API login failed, trying localStorage:', apiError);

    // Fallback to localStorage
    const user = findUserByName(name);
    if (!user) {
      recordFailedAttempt();
      return { success: false, error: 'Invalid username or PIN' };
    }

    if (!user.pinHash || !verifyPIN(pin, user.pinHash)) {
      recordFailedAttempt();
      return { success: false, error: 'Invalid username or PIN' };
    }

    // Update last login
    const users = getUsers();
    const userIndex = users.findIndex(u => u.id === user.id);
    if (userIndex !== -1) {
      users[userIndex].lastLogin = new Date();
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      user.lastLogin = new Date();
    }

    resetLoginAttempts();
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    localStorage.setItem(SESSION_EXPIRY_KEY, (Date.now() + SESSION_TIMEOUT).toString());

    return { success: true, user };
  }
};

/**
 * Logout current user
 */
export const logout = (): void => {
  authApi.logout(); // Clear API token
  localStorage.removeItem(CURRENT_USER_KEY);
  localStorage.removeItem(SESSION_EXPIRY_KEY);
};

/**
 * Get current logged-in user
 */
export const getCurrentUser = (): User | null => {
  try {
    const userStr = localStorage.getItem(CURRENT_USER_KEY);
    if (!userStr) return null;

    const user = JSON.parse(userStr);

    // Check session expiry
    const expiryStr = localStorage.getItem(SESSION_EXPIRY_KEY);
    if (expiryStr && Date.now() > parseInt(expiryStr)) {
      logout();
      return null;
    }

    return {
      ...user,
      createdAt: user.createdAt ? new Date(user.createdAt) : undefined,
      lastLogin: user.lastLogin ? new Date(user.lastLogin) : undefined
    };
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
};

/**
 * Update session activity (reset timeout)
 */
export const updateSessionActivity = (): void => {
  const user = getCurrentUser();
  if (user) {
    localStorage.setItem(SESSION_EXPIRY_KEY, (Date.now() + SESSION_TIMEOUT).toString());
  }
};

/**
 * Check if session is expired
 */
export const isSessionExpired = (): boolean => {
  const expiryStr = localStorage.getItem(SESSION_EXPIRY_KEY);
  if (!expiryStr) return true;
  return Date.now() > parseInt(expiryStr);
};

/**
 * Check if user is authenticated with valid API token
 */
export const hasValidToken = (): boolean => {
  return !!getAuthToken();
};

/**
 * Random emoji avatars
 */
export const AVATAR_EMOJIS = [
  '👨', '👩', '🧑', '👦', '👧',
  '👨‍💼', '👩‍💼', '👨‍🏫', '👩‍🏫', '👨‍🎓', '👩‍🎓',
  '🦸‍♂️', '🦸‍♀️', '🧙‍♂️', '🧙‍♀️', '🤵', '👰',
  '🎯', '⚡', '🔥', '💎', '⭐', '🏆'
];

/**
 * Get random avatar emoji
 */
export const getRandomAvatar = (): string => {
  return AVATAR_EMOJIS[Math.floor(Math.random() * AVATAR_EMOJIS.length)];
};
