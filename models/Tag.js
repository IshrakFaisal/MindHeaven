const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  moodEntry: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MoodEntry',
    required: true,
  },
  label: {
    type: String,
    required: true,
    trim: true,
    maxlength: 40,
  },
});

module.exports = mongoose.model('Tag', tagSchema);
