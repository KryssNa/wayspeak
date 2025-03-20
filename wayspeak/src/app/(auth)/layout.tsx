'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/lib/redux/hooks/hooks';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, token } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // If user is already authenticated, redirect to dashboard
    if (isAuthenticated && token) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, token, router]);

  return (
    <>
      {children}
    </>
  );
}
