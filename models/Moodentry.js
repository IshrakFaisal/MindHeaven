const mongoose = require('mongoose');

const moodEntrySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  moodValue: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
  },
  moodType: {
    type: String,
    enum: ['emoji', 'numeric', 'color'],
    default: 'numeric',
  },
  title: {
    type: String,
    default: '',
    trim: true,
    maxlength: 120,
  },
  note: {
    type: String,
    default: '',
    trim: true,
    maxlength: 1000,
  },
  checkInId: {
    type: String,
    default: null,
    index: true,
  },
  entryDate: {
    type: String,
    match: /^\d{4}-\d{2}-\d{2}$/,
    default: null,
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('MoodEntry', moodEntrySchema);
