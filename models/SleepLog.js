const mongoose = require('mongoose');

const sleepLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sleepDuration: {
    type: Number,
    required: true,
    min: 0,
    max: 24,
  },
  sleepQuality: {
    type: Number,
    min: 1,
    max: 10,
  },
  sleepDate: {
    type: String,
    match: /^\d{4}-\d{2}-\d{2}$/,
    default: null,
  },
  bedtime: {
    type: String,
    match: /^([01]\d|2[0-3]):[0-5]\d$/,
    default: null,
  },
  wakeTime: {
    type: String,
    match: /^([01]\d|2[0-3]):[0-5]\d$/,
    default: null,
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

module.exports = mongoose.model('SleepLog', sleepLogSchema);
