'use client';

import React, { useEffect, useRef } from 'react';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  // Use isolated Firebase auth hook
  const { user, loading, error } = useFirebaseAuth();
  const hasRedirected = useRef(false); // Prevent multiple redirects
  const router = useRouter();

  // Reset redirect flag when user authenticates
  useEffect(() => {
    if (user) {
      console.log('✅ User authenticated, resetting redirect flag');
      hasRedirected.current = false;
    }
  }, [user]);

  // Redirect to login if no user (only once)
  useEffect(() => {
    if (!loading && !user && !hasRedirected.current) {
      console.log('🚪 No authentication, redirecting to login...');
      hasRedirected.current = true; // Prevent further redirects

      const redirectTimer = setTimeout(() => {
        if (!auth.currentUser) {
          console.log('🚪 Redirecting to login page...');
          // Store the return URL for after login
          const returnUrl = window.location.pathname + window.location.search;
          
          // --- FIXED: Use Next.js router instead of window.location.href ---
          router.push(`https://login-nneenterprise.web.app?returnUrl=${encodeURIComponent(returnUrl)}`);
        }
      }, 1000);

      return () => clearTimeout(redirectTimer);
    }
  }, [user, loading, router]); // Add router to the dependency array

  // Handle authentication error
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-gradient-to-br from-red-50 via-red-100 to-red-200">
        <div className="text-red-600 text-6xl">⚠️</div>
        <h2 className="text-red-800 font-bold text-xl">Authentication Error</h2>
        <p className="text-red-700 font-medium text-center max-w-md">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="text-slate-600 font-medium">Verifying authentication...</p>
      </div>
    );
  }

  // User authenticated - show protected content
  if (user) {
    console.log('🔐 Rendering protected content for:', user.email);
    return <>{children}</>;
  }

  // No user - show redirecting state (redirect happens in useEffect)
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      <p className="text-slate-600 font-medium">Redirecting to login...</p>
    </div>
  );
}
