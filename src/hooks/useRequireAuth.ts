'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';

/**
 * Centralized authentication hook for admin pages.
 * Fetches session from /api/auth/me, populates Zustand store,
 * and redirects unauthenticated users to /login.
 *
 * Returns { org, isLoading } so pages can render loading states.
 */
export function useRequireAuth() {
  const { org, setOrg } = useAuthStore();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : Promise.reject('unauth')))
      .then((data) => {
        if (cancelled) return;
        if (data.authenticated && data.org) {
          setOrg(data.org);
        } else {
          router.push('/login');
        }
      })
      .catch(() => {
        if (!cancelled) router.push('/login');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [setOrg, router]);

  return { org, isLoading };
}
