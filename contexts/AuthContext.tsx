/**
 * Authentication Context for Agnes-21
 * Provides global auth state and functions
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  User,
  getCurrentUser,
  login as loginUser,
  logout as logoutUser,
  updateSessionActivity,
  isSessionExpired
} from '../utils/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (name: string, pin: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = () => {
      const currentUser = getCurrentUser();
      if (currentUser && !isSessionExpired()) {
        setUser(currentUser);
      } else if (currentUser) {
        // Session expired
        logoutUser();
        setUser(null);
      }
      setIsLoading(false);
    };

    checkSession();
  }, []);

  // Auto-logout on session expiry
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      if (isSessionExpired()) {
        logout();
        alert('Session expired due to inactivity. Please log in again.');
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [user]);

  // Update session activity on user interactions
  useEffect(() => {
    if (!user) return;

    const resetTimer = () => {
      updateSessionActivity();
    };

    // Listen to user activity
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keypress', resetTimer);
    window.addEventListener('click', resetTimer);
    window.addEventListener('scroll', resetTimer);

    return () => {
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keypress', resetTimer);
      window.removeEventListener('click', resetTimer);
      window.removeEventListener('scroll', resetTimer);
    };
  }, [user]);

  const login = useCallback(async (name: string, pin: string) => {
    const result = loginUser(name, pin);

    if (result.success && result.user) {
      setUser(result.user);
      return { success: true };
    }

    return { success: false, error: result.error };
  }, []);

  const logout = useCallback(() => {
    logoutUser();
    setUser(null);
  }, []);

  const refreshUser = useCallback(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
