// company-website/src/context/AuthContext.tsx
"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation'; // Use useRouter and usePathname for App Router
import Cookies from 'js-cookie';
import api from '@/lib/api';

// Define types for user and context
interface User {
  id: string;
  email: string;
  name?: string;
  role: 'ADMIN' | 'EDITOR' | 'VIEWER';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname(); // Get current pathname

  // Load user session from cookie on mount
  useEffect(() => {
    const loadUser = async () => {
      const storedToken = Cookies.get('token');
      if (storedToken) {
        setToken(storedToken);
        try {
          // Verify token by fetching user data from backend
          const response = await api.get('/auth/me', {
            headers: { Authorization: `Bearer ${storedToken}` }
          });
          setUser(response.data);
        } catch (err) {
          console.error("Failed to load user from token:", err);
          logout(); // Invalid token, log out
        }
      }
      setIsLoading(false);
    };
    loadUser();
  }, []); // Run once on component mount

  // Redirect logic for authenticated/unauthenticated users
  useEffect(() => {
    if (!isLoading) { // Only run after loading state is resolved
      if (user && pathname === '/login') {
        router.push('/dashboard'); // Redirect logged-in users from login page
      } else if (!user && pathname !== '/login') {
        router.push('/login'); // Redirect unauthenticated users to login page
      }
    }
  }, [isLoading, user, pathname, router]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user: userData, token: jwtToken } = response.data;

      Cookies.set('token', jwtToken, { expires: 7, secure: process.env.NODE_ENV === 'production' }); // Store token securely
      setToken(jwtToken);
      setUser(userData);
      router.push('/dashboard'); // Redirect to dashboard
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Login failed';
      setError(errorMessage);
      throw new Error(errorMessage); // Re-throw to allow component to catch
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    Cookies.remove('token');
    setToken(null);
    setUser(null);
    router.push('/login'); // Redirect to login
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading, error }}>
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