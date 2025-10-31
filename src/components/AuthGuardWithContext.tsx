'use client';

import React, { useEffect, useRef } from 'react';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * AuthGuard using Context Pattern
 * Alternative implementation that uses AuthProvider context
 */
export default function AuthGuardWithContext({ children }: AuthGuardProps) {
  const { user, loading, error } = useAuth();
  const hasRedirected = useRef(false);
  const router = useRouter();

  // Reset redirect flag when user authenticates
  useEffect(() => {
    if (user) {
      hasRedirected.current = false;
    }
  }, [user]);

  // Redirect logic - isolated in separate useEffect
  useEffect(() => {
    if (!loading && !user && !hasRedirected.current) {
      console.log('🚪 Context AuthGuard - No authentication, redirecting...');
      hasRedirected.current = true;

      const redirectTimer = setTimeout(() => {
        if (!auth.currentUser) {
          const returnUrl = window.location.pathname + window.location.search;
          router.push(`https://login.nneenterpriseinc.com?returnUrl=${encodeURIComponent(returnUrl)}`);
        }
      }, 1000);

      return () => clearTimeout(redirectTimer);
    }
  }, [user, loading, router]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-gradient-to-br from-red-50 to-red-100">
        <h2 className="text-red-800 font-bold">Authentication Error</h2>
        <p className="text-red-700">{error}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-red-600 text-white rounded">
          Retry
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="text-slate-600 font-medium">Verifying authentication...</p>
      </div>
    );
  }

  if (user) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      <p className="text-slate-600 font-medium">Redirecting to login...</p>
    </div>
  );
}