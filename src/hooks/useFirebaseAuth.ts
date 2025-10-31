'use client';

import { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

/**
 * Custom hook to handle Firebase authentication
 * Isolates Firebase auth logic to prevent infinite loops
 */
export function useFirebaseAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const listenerInitialized = useRef(false);

  useEffect(() => {
    // Prevent multiple listener initialization
    if (listenerInitialized.current) {
      return;
    }

    console.log('🔍 Initializing Firebase auth listener...');
    listenerInitialized.current = true;

    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        console.log('🔍 Auth state changed:', currentUser?.email || 'No user');
        
        if (currentUser) {
          console.log('✅ User authenticated:', currentUser.email);
          setUser(currentUser);
          setError(null);
        } else {
          console.log('❌ No authenticated user');
          setUser(null);
        }
        
        setLoading(false);
      },
      (authError) => {
        console.error('🚨 Auth error:', authError);
        setError(authError.message);
        setLoading(false);
        listenerInitialized.current = false; // Allow retry on error
      }
    );

    // Cleanup function
    return () => {
      console.log('🔄 Cleaning up Firebase auth listener');
      unsubscribe();
      listenerInitialized.current = false;
    };
  }, []); // Empty dependency array - only run once

  return { user, loading, error };
}