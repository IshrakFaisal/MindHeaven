export const WELLBEING_GOALS = [
  {
    id: 'mood',
    label: 'Understand my mood',
    shortLabel: 'Mood clarity',
    description: 'Notice emotional patterns and the context around them.',
  },
  {
    id: 'stress',
    label: 'Manage stress',
    shortLabel: 'Stress care',
    description: 'Track anxiety, energy, and the moments that feel heavy.',
  },
  {
    id: 'sleep',
    label: 'Improve my sleep',
    shortLabel: 'Better sleep',
    description: 'Connect rest, consistency, and how the next day feels.',
  },
  {
    id: 'routine',
    label: 'Build a steady routine',
    shortLabel: 'Steady routine',
    description: 'Use small daily check-ins to build gentle consistency.',
  },
  {
    id: 'medication',
    label: 'Stay consistent with medication',
    shortLabel: 'Medication routine',
    description: 'Keep schedules and daily dose decisions easy to review.',
  },
];

export const DEFAULT_PREFERENCES = {
  goals: ['mood'],
  reminderTime: '20:00',
  gentlePrompts: true,
  compactMotion: false,
  locale: 'en',
  completedOnboarding: false,
};

export const preferenceKey = (userId) => `mindhaven-preferences-${userId || 'local'}`;

export const readPreferences = (userId) => {
  try {
    const stored = localStorage.getItem(preferenceKey(userId));
    return stored ? { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) } : DEFAULT_PREFERENCES;
  } catch {
    return DEFAULT_PREFERENCES;
  }
};

export const writePreferences = (userId, preferences) => {
  const next = { ...DEFAULT_PREFERENCES, ...preferences };
  localStorage.setItem(preferenceKey(userId), JSON.stringify(next));
  return next;
};

export const primaryGoal = (preferences) =>
  WELLBEING_GOALS.find((goal) => goal.id === preferences?.goals?.[0]) || WELLBEING_GOALS[0];
