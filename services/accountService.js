const Medication = require('../models/Medication');
const MedicationDose = require('../models/MedicationDose');
const MoodEntry = require('../models/Moodentry');
const ReportShare = require('../models/ReportShare');
const SleepLog = require('../models/SleepLog');
const SymptomLog = require('../models/SymptomLog');
const Tag = require('../models/Tag');
const ThoughtRecord = require('../models/ThoughtRecord');

const WELLBEING_GOALS = ['mood', 'stress', 'sleep', 'routine', 'medication'];
const DEFAULT_PREFERENCES = Object.freeze({
  goals: ['mood'],
  reminderTime: '20:00',
  gentlePrompts: true,
  compactMotion: false,
  locale: 'en',
  completedOnboarding: false,
});

const publicPreferences = (preferences = {}) => ({
  ...DEFAULT_PREFERENCES,
  ...(typeof preferences.toObject === 'function' ? preferences.toObject() : preferences),
});

const publicUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  profileImage: user.profileImage || '',
  preferences: publicPreferences(user.preferences),
});

const validateProfileImage = (value) => {
  if (value === null || value === '') return { value: '' };
  if (typeof value !== 'string' || !/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value)) {
    return { error: 'Profile picture must be a PNG, JPEG, or WebP image' };
  }
  if (value.length > 600000) return { error: 'Profile picture is too large' };
  return { value };
};

const validatePreferences = (input = {}, current = {}) => {
  const next = { ...DEFAULT_PREFERENCES, ...publicPreferences(current), ...input };
  const goals = [...new Set(Array.isArray(next.goals) ? next.goals : [])];
  if (!goals.length || goals.length > 3 || goals.some((goal) => !WELLBEING_GOALS.includes(goal))) {
    return { error: 'Choose between one and three valid wellbeing goals' };
  }
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(next.reminderTime)) {
    return { error: 'Choose a valid reflection time' };
  }
  if (!['en', 'bn'].includes(next.locale)) {
    return { error: 'Choose a supported language' };
  }
  return {
    value: {
      goals,
      reminderTime: next.reminderTime,
      gentlePrompts: Boolean(next.gentlePrompts),
      compactMotion: Boolean(next.compactMotion),
      locale: next.locale,
      completedOnboarding: Boolean(next.completedOnboarding),
    },
  };
};

const loadAccountRecords = async (userId) => {
  const [moods, symptoms, sleep, medications, medicationDoses, tags, thoughtRecords, reportShares] = await Promise.all([
    MoodEntry.find({ user: userId }).sort({ createdAt: 1 }).lean(),
    SymptomLog.find({ user: userId }).sort({ createdAt: 1 }).lean(),
    SleepLog.find({ user: userId }).sort({ createdAt: 1 }).lean(),
    Medication.find({ user: userId }).sort({ createdAt: 1 }).lean(),
    MedicationDose.find({ user: userId }).sort({ date: 1 }).lean(),
    Tag.find({ user: userId }).sort({ _id: 1 }).lean(),
    ThoughtRecord.find({ user: userId }).sort({ createdAt: 1 }).lean(),
    ReportShare.find({ user: userId }).select('-tokenHash').sort({ createdAt: 1 }).lean(),
  ]);
  return { moods, symptoms, sleep, medications, medicationDoses, tags, thoughtRecords, reportShares };
};

const buildAccountExport = async (user) => ({
  exportedAt: new Date().toISOString(),
  account: {
    id: user._id,
    name: user.name,
    email: user.email,
    profileImage: user.profileImage || '',
    preferences: publicPreferences(user.preferences),
    createdAt: user.createdAt,
  },
  records: await loadAccountRecords(user._id),
});

const deleteAccountRecords = async (userId) => Promise.all([
  MoodEntry.deleteMany({ user: userId }),
  SymptomLog.deleteMany({ user: userId }),
  SleepLog.deleteMany({ user: userId }),
  Medication.deleteMany({ user: userId }),
  MedicationDose.deleteMany({ user: userId }),
  Tag.deleteMany({ user: userId }),
  ThoughtRecord.deleteMany({ user: userId }),
  ReportShare.deleteMany({ user: userId }),
]);

module.exports = {
  DEFAULT_PREFERENCES,
  buildAccountExport,
  deleteAccountRecords,
  publicPreferences,
  publicUser,
  validatePreferences,
  validateProfileImage,
};
