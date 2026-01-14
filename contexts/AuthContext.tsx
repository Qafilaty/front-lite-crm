import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/apiService';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, firebaseToken?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // تحميل الجلسة عند بدء التطبيق
  useEffect(() => {
    const loadSession = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const result = await authService.getCurrentUser();
          if (result.success && result.user) {
            setUser(result.user as any);
          } else {
            // Token غير صالح، احذفه
            localStorage.removeItem('authToken');
          }
        } catch (error) {
          console.error('Error loading session:', error);
          localStorage.removeItem('authToken');
        }
      }
      setIsLoading(false);
    };

    loadSession();
  }, []);

  const login = async (email: string, password: string, firebaseToken?: string) => {
    try {
      const result = await authService.login(email, password, firebaseToken);
      if (result.success && result.user) {
        setUser(result.user as any);
        return { success: true };
      }
      return { success: false, error: result.error || 'فشل تسجيل الدخول' };
    } catch (error: any) {
      return { success: false, error: error.message || 'حدث خطأ أثناء تسجيل الدخول' };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('authToken');
    }
  };

  const refreshUser = async () => {
    try {
      const result = await authService.getCurrentUser();
      if (result.success && result.user) {
        setUser(result.user as any);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
