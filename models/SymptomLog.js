const mongoose = require('mongoose');

const symptomLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  anxietyLevel: {
    type: Number,
    min: 1,
    max: 10,
  },
  sleepQuality: {
    type: Number,
    min: 1,
    max: 10,
  },
  energyLevel: {
    type: Number,
    min: 1,
    max: 10,
  },
  appetite: {
    type: Number,
    min: 1,
    max: 10,
  },
  checkInId: {
    type: String,
    default: null,
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('SymptomLog', symptomLogSchema);
