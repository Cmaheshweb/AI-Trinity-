'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import {
  getAccessToken,
  loginUser,
  logoutUser,
  registerUser,
  fetchUserProfile,
} from '../lib/auth';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (credentials: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        const token = getAccessToken();
        if (token) {
          const profile = await fetchUserProfile();
          setUser(profile);
        }
      } catch (error) {
        console.error('Error loading user:', error);
        setUser(null);
        logoutUser(); // Clear token if loading user fails
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const handleLogin = async (credentials: any) => {
    setLoading(true);
    try {
      const userProfile = await loginUser(credentials);
      setUser(userProfile);
      router.push('/dashboard'); // Redirect to dashboard on successful login
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (data: any) => {
    setLoading(true);
    try {
      await registerUser(data);
      router.push('/login?registered=true'); // Redirect to login after registration
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logoutUser();
    setUser(null);
    router.push('/login'); // Redirect to login on logout
  };

  const refetchUser = async () => {
    setLoading(true);
    try {
      const profile = await fetchUserProfile();
      setUser(profile);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login: handleLogin,
        register: handleRegister,
        logout: handleLogout,
        refetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};