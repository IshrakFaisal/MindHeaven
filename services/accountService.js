const Medication = require('../models/Medication');
const MedicationDose = require('../models/MedicationDose');
const MoodEntry = require('../models/Moodentry');
const ReportShare = require('../models/ReportShare');
const SleepLog = require('../models/SleepLog');
const SymptomLog = require('../models/SymptomLog');
const Tag = require('../models/Tag');
const ThoughtRecord = require('../models/ThoughtRecord');
const CommunityPost = require('../models/CommunityPost');

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

const therapistProfileObject = (profile = {}) => (
  typeof profile.toObject === 'function' ? profile.toObject() : profile
);

const publicTherapistProfile = (user) => {
  if (user.role !== 'therapist') return null;
  const profile = therapistProfileObject(user.therapistProfile);
  return {
    specialization: profile.specialization || '',
    workplace: profile.workplace || '',
    registrationAuthority: profile.registrationAuthority || '',
    registrationNumber: profile.registrationNumber || '',
    verificationStatus: profile.verificationStatus || 'pending',
    verifiedAt: profile.verifiedAt || null,
  };
};

const publicUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  profileImage: user.profileImage || '',
  role: user.role || 'member',
  therapistProfile: publicTherapistProfile(user),
  preferences: publicPreferences(user.preferences),
});

const validateTherapistRegistration = (input = {}) => {
  const role = input.role || 'member';
  if (!['member', 'therapist'].includes(role)) return { error: 'Choose a valid account type' };
  if (role === 'member') return { value: { role, therapistProfile: {} } };

  const profile = input.therapistProfile || {};
  const specialization = profile.specialization?.trim();
  // Keep accepting optional legacy registration details without requiring them at signup.
  const registrationAuthority = profile.registrationAuthority?.trim() || '';
  const registrationNumber = profile.registrationNumber?.trim() || '';
  const workplace = profile.workplace?.trim() || '';
  if (!specialization) {
    return { error: 'Professional accounts require a specialization' };
  }
  return {
    value: {
      role,
      therapistProfile: {
        specialization: specialization.slice(0, 120),
        registrationAuthority: registrationAuthority.slice(0, 120),
        registrationNumber: registrationNumber.slice(0, 80),
        workplace: workplace.slice(0, 160),
        verificationStatus: 'pending',
        verifiedAt: null,
      },
    },
  };
};

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
  const [moods, symptoms, sleep, medications, medicationDoses, tags, thoughtRecords, reportShares, communityPosts, therapistResponses] = await Promise.all([
    MoodEntry.find({ user: userId }).sort({ createdAt: 1 }).lean(),
    SymptomLog.find({ user: userId }).sort({ createdAt: 1 }).lean(),
    SleepLog.find({ user: userId }).sort({ createdAt: 1 }).lean(),
    Medication.find({ user: userId }).sort({ createdAt: 1 }).lean(),
    MedicationDose.find({ user: userId }).sort({ date: 1 }).lean(),
    Tag.find({ user: userId }).sort({ _id: 1 }).lean(),
    ThoughtRecord.find({ user: userId }).sort({ createdAt: 1 }).lean(),
    ReportShare.find({ user: userId }).select('-tokenHash').sort({ createdAt: 1 }).lean(),
    CommunityPost.find({ author: userId }).select('-reports').sort({ createdAt: 1 }).lean(),
    CommunityPost.find({ 'therapistResponse.therapist': userId }).select('title anonymousAlias therapistResponse createdAt').sort({ createdAt: 1 }).lean(),
  ]);
  return { moods, symptoms, sleep, medications, medicationDoses, tags, thoughtRecords, reportShares, communityPosts, therapistResponses };
};

const buildAccountExport = async (user) => ({
  exportedAt: new Date().toISOString(),
  account: {
    id: user._id,
    name: user.name,
    email: user.email,
    profileImage: user.profileImage || '',
    role: user.role || 'member',
    therapistProfile: publicTherapistProfile(user),
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
  CommunityPost.deleteMany({ author: userId }),
  CommunityPost.updateMany({ 'therapistResponse.therapist': userId }, { $set: { therapistResponse: null } }),
  CommunityPost.updateMany({}, { $pull: { reports: { reporter: userId } } }),
]);

module.exports = {
  DEFAULT_PREFERENCES,
  buildAccountExport,
  deleteAccountRecords,
  publicPreferences,
  publicTherapistProfile,
  publicUser,
  validateTherapistRegistration,
  validatePreferences,
  validateProfileImage,
};
