'use client';

import { JSX, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FEATURE_SLIDES } from './slides-data';
import FeatureSlideComponent from './feature-slide';
import { isLoggedIn, login } from '@/lib/auth';

const TOTAL_SCREENS = 4;
const DOT_KEYS = ['dot-0', 'dot-1', 'dot-2', 'dot-3'];

export default function OnboardingSlider(): JSX.Element {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const pointerStartX = useRef<number | null>(null);

  useEffect(() => {
    if (isLoggedIn()) {
      router.replace('/home');
    }
  }, [router]);

  function goToNext(): void {
    setCurrentIndex((i) => Math.min(i + 1, TOTAL_SCREENS - 1));
  }

  function goToPrev(): void {
    setCurrentIndex((i) => Math.max(i - 1, 0));
  }

  function handlePointerDown(e: React.PointerEvent): void {
    pointerStartX.current = e.clientX;
  }

  function handlePointerUp(e: React.PointerEvent): void {
    if (pointerStartX.current === null) return;
    const delta = pointerStartX.current - e.clientX;
    if (delta > 50) goToNext();
    else if (delta < -50) goToPrev();
    pointerStartX.current = null;
  }

  function handleCTA(): void {
    login();
    router.push('/home');
  }

  return (
    <div className="flex h-full flex-col">
      <div
        className="flex-1 overflow-hidden touch-none select-none"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        <div
          className="flex h-full"
          style={{
            width: `${TOTAL_SCREENS * 100}%`,
            transform: `translateX(${(-100 / TOTAL_SCREENS) * currentIndex}%)`,
            transition: 'transform 300ms ease-in-out',
          }}
        >
          {FEATURE_SLIDES.map((slide) => (
            <div key={slide.id} className="h-full" style={{ width: `${100 / TOTAL_SCREENS}%` }}>
              <FeatureSlideComponent slide={slide} />
            </div>
          ))}
          <div className="h-full" style={{ width: `${100 / TOTAL_SCREENS}%` }}>
            <div className="flex h-full flex-col items-center justify-center gap-6 px-8 text-center">
              <span className="text-7xl">🏥</span>
              <h2 className="text-2xl font-bold text-base-content">MyHealth</h2>
              <p className="text-base text-base-content/70">Your personal health companion</p>
              <div className="flex w-full flex-col gap-3 pt-4">
                <button type="button" className="btn btn-primary btn-block" onClick={handleCTA}>
                  Get Started
                </button>
                <button type="button" className="btn btn-ghost btn-block" onClick={handleCTA}>
                  Log In
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-2 pb-8 pt-4">
        {DOT_KEYS.map((key, i) => (
          <span
            key={key}
            className={`h-2 w-2 rounded-full transition-colors ${i === currentIndex ? 'bg-primary' : 'bg-base-300'}`}
          />
        ))}
      </div>

      {currentIndex < TOTAL_SCREENS - 1 && (
        <div className="px-8 pb-8">
          <button type="button" className="btn btn-primary btn-block" onClick={goToNext}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}
