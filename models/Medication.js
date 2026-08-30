const mongoose = require('mongoose');

const medicationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  medicationName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120,
  },
  dosage: {
    type: String,
    trim: true,
    maxlength: 120,
  },
  schedule: {
    type: String,
    trim: true,
    maxlength: 240,
  },
  reminderTime: {
    type: String,
    default: '',
    validate: {
      validator: (value) => !value || /^([01]\d|2[0-3]):[0-5]\d$/.test(value),
      message: 'Reminder time must use HH:mm format',
    },
  },
  active: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Medication', medicationSchema);
