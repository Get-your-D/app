'use client';

import { JSX, useEffect, useState, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { isLoggedIn } from '@/lib/auth';
import Dock from '@/components/dock';

export default function AppLayout({ children }: { children: React.ReactNode }): JSX.Element {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace('/onboarding');
    } else {
      startTransition(() => setReady(true));
    }
  }, [router]);

  if (!ready) {
    return (
      <div className="flex h-dvh items-center justify-center bg-base-100">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col bg-base-100">
      <main className="flex-1 overflow-y-auto pb-20">{children}</main>
      <Dock />
    </div>
  );
}
