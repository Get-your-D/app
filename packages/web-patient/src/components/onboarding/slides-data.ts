export interface FeatureSlide {
  id: number;
  emoji: string;
  title: string;
  description: string;
}

export const FEATURE_SLIDES: FeatureSlide[] = [
  { id: 1, emoji: '🧪', title: 'Track Your Tests', description: 'View and monitor your lab test results all in one place' },
  { id: 2, emoji: '🔒', title: 'Manage Consents', description: 'Control who can access your health data with ease' },
  { id: 3, emoji: '💡', title: 'Stay Informed', description: 'Get insights and recommendations based on your results' },
];
