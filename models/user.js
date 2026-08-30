const mongoose = require('mongoose');

const preferenceSchema = new mongoose.Schema({
  goals: {
    type: [String],
    enum: ['mood', 'stress', 'sleep', 'routine', 'medication'],
    default: ['mood'],
    validate: {
      validator: (value) => value.length >= 1 && value.length <= 3,
      message: 'Choose between one and three wellbeing goals',
    },
  },
  reminderTime: {
    type: String,
    default: '20:00',
    match: [/^(?:[01]\d|2[0-3]):[0-5]\d$/, 'Please use a valid 24-hour time'],
  },
  gentlePrompts: { type: Boolean, default: true },
  compactMotion: { type: Boolean, default: false },
  locale: { type: String, enum: ['en', 'bn'], default: 'en' },
  completedOnboarding: { type: Boolean, default: false },
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 80,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address'],
  },
  password: {
    type: String,
    required: true,
  },
  profileImage: {
    type: String,
    default: '',
    maxlength: 600000,
  },
  preferences: {
    type: preferenceSchema,
    default: () => ({}),
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', userSchema);
