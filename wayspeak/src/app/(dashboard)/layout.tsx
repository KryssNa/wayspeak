'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks/hooks';
import { getUserProfile } from '@/lib/redux/features/authSlice';
import { DashboardSidebar } from '@/components/layout/dashboard-sidebar';
import { DashboardHeader } from '@/components/layout/dashboard-header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading, token, user } = useAppSelector((state) => state.auth);
  const profileFetchedRef = useRef(false);

  useEffect(() => {
    // If not authenticated and not loading, redirect to login
    if (!isLoading && !isAuthenticated && !token) {
      router.push('/login');
      return;
    }

    // Only fetch user profile if we have a token, no user data yet, and haven't already tried to fetch
    if (token && !user && !profileFetchedRef.current && !isLoading) {
      profileFetchedRef.current = true; // Mark as fetched to prevent duplicate requests
      dispatch(getUserProfile());
    }
  }, [isAuthenticated, isLoading, token, router, dispatch, user]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated && !token) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <DashboardSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}