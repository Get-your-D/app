import { JSX } from 'react';
import { FeatureSlide } from './slides-data';

interface FeatureSlideProps {
  slide: FeatureSlide;
}

export default function FeatureSlideComponent({ slide }: FeatureSlideProps): JSX.Element {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 px-8 text-center">
      <span className="text-7xl">{slide.emoji}</span>
      <h2 className="text-2xl font-bold text-base-content">{slide.title}</h2>
      <p className="text-base text-base-content/70">{slide.description}</p>
    </div>
  );
}
