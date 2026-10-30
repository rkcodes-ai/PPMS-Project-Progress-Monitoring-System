import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserProfile, RoleEnum } from '../types';
import { authApi } from '../api/auth';

interface AuthContextType {
  user: UserProfile | null;
  activeRole: RoleEnum | null;
  availableRoles: RoleEnum[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username_or_email: string, password: string) => Promise<void>;
  switchRole: (targetRole: RoleEnum) => Promise<void>;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);


export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const initAuth = async () => {
    const token = localStorage.getItem('ppms_token');
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const profile = await authApi.getMe();
      setUser(profile);
      localStorage.setItem('ppms_user', JSON.stringify(profile));
    } catch {
      localStorage.removeItem('ppms_token');
      localStorage.removeItem('ppms_user');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const login = async (username_or_email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await authApi.login(username_or_email, password);
      localStorage.setItem('ppms_token', data.access_token);
      localStorage.setItem('ppms_user', JSON.stringify(data.user));
      setUser(data.user);
    } finally {
      setIsLoading(false);
    }
  };

  const switchRole = async (targetRole: RoleEnum) => {
    setIsLoading(true);
    try {
      const data = await authApi.switchRole(targetRole);
      localStorage.setItem('ppms_token', data.access_token);
      localStorage.setItem('ppms_user', JSON.stringify(data.user));
      setUser(data.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('ppms_token');
      localStorage.removeItem('ppms_user');
      setUser(null);
      window.location.href = '/login';
    }
  };

  const refetchUser = async () => {
    try {
      const profile = await authApi.getMe();
      setUser(profile);
      localStorage.setItem('ppms_user', JSON.stringify(profile));
    } catch {
      // Token expired or invalid
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        activeRole: user?.active_role || null,
        availableRoles: user?.available_roles || [],
        isAuthenticated: !!user,
        isLoading,
        login,
        switchRole,
        logout,
        refetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
