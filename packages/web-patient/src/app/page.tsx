'use client';

import { JSX, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isLoggedIn } from '@/lib/auth';

export default function RootPage(): JSX.Element {
  const router = useRouter();

  useEffect(() => {
    if (isLoggedIn()) {
      router.replace('/home');
    } else {
      router.replace('/onboarding');
    }
  }, [router]);

  return <div className="min-h-screen bg-base-100" />;
}
