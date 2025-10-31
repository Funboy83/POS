'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
});

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * AuthProvider - Isolates Firebase auth logic at the app level
 * This prevents auth listeners from being created multiple times
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    // Prevent multiple initializations
    if (initialized.current) return;

    console.log('🔥 Initializing Firebase Auth Provider...');
    initialized.current = true;

    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        console.log('🔍 Auth Provider - State changed:', currentUser?.email || 'No user');
        setUser(currentUser);
        setError(null);
        setLoading(false);
      },
      (authError) => {
        console.error('🚨 Auth Provider - Error:', authError);
        setError(authError.message);
        setLoading(false);
      }
    );

    return () => {
      console.log('🔄 Cleaning up Auth Provider');
      unsubscribe();
      initialized.current = false;
    };
  }, []);

  const value = {
    user,
    loading,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}