export const FEATURE_AREAS = Object.freeze([
  { id: 'public-experience', label: 'Public Experience', pages: ['auth', 'shared-report'] },
  { id: 'account-privacy', label: 'Account & Privacy', pages: ['profile'] },
  { id: 'today-check-in', label: 'Today & Daily Check-In', pages: ['overview', 'checkin'] },
  { id: 'mood-journal-context', label: 'Mood Journal & Context', pages: ['mood'] },
  { id: 'body-signals', label: 'Body Signals', pages: ['symptoms'] },
  { id: 'sleep', label: 'Sleep', pages: ['sleep'] },
  { id: 'medication', label: 'Medication', pages: ['medications'] },
  { id: 'insights-reports-sharing', label: 'Insights, Reports & Sharing', pages: ['reports'] },
  { id: 'care-toolkit', label: 'Care Toolkit', pages: ['care'] },
  { id: 'wellness', label: 'Wellness', pages: ['wellness'] },
  { id: 'platform-foundation', label: 'Platform & Foundation', pages: [] },
]);

export const APP_NAV_ITEMS = Object.freeze([
  { id: 'overview', label: 'Today', short: 'Today', icon: 'calendar' },
  { id: 'mood', label: 'Journal', short: 'Journal', icon: 'mood' },
  { id: 'symptoms', label: 'Body signals', short: 'Body', icon: 'activity' },
  { id: 'sleep', label: 'Sleep', short: 'Sleep', icon: 'sleep' },
  { id: 'medications', label: 'Medication', short: 'Meds', icon: 'medication' },
  { id: 'reports', label: 'Insights', short: 'Insights', icon: 'reports' },
  { id: 'wellness', label: 'Wellness', short: 'Wellness', icon: 'wellness' },
  { id: 'care', label: 'Care toolkit', short: 'Care', icon: 'care' },
  { id: 'profile', label: 'Privacy & profile', short: 'Profile', icon: 'profile' },
]);
