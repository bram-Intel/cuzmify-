'use client';

import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function PostLoginDispatcher() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const explicitCallback = searchParams.get('callbackUrl');
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/login');
      return;
    }

    // If a specific studio or editor destination was requested with params, respect it
    if (explicitCallback && (explicitCallback.includes('/editor') || explicitCallback.includes('/studio'))) {
      router.push(explicitCallback);
      return;
    }

    // Otherwise check if this user already has sites
    fetch('/api/sites')
      .then((res) => res.json())
      .then((data) => {
        if (data?.sites && data.sites.length > 0) {
          // Returning user with existing sites
          router.push(explicitCallback || '/dashboard');
        } else {
          // Brand-new user: route to Onboarding wizard!
          router.push('/onboarding');
        }
      })
      .catch(() => {
        router.push('/onboarding');
      });
  }, [session, status, explicitCallback, router]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#FFFFFF]">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-2 border-[#0D5771] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-[#64748B] text-xs font-mono">Personalizing your Cuzmify workspace…</p>
      </div>
    </div>
  );
}
