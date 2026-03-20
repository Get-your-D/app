import { JSX } from 'react';
import OnboardingSlider from '@/components/onboarding/onboarding-slider';

export default function OnboardingPage(): JSX.Element {
  return (
    <main className="flex h-dvh flex-col overflow-hidden bg-base-100">
      <OnboardingSlider />
    </main>
  );
}
