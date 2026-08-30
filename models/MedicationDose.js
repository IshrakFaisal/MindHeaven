const mongoose = require('mongoose');

const medicationDoseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  medication: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medication',
    required: true,
    index: true,
  },
  date: {
    type: String,
    required: true,
    match: [/^\d{4}-\d{2}-\d{2}$/, 'Dose date must use YYYY-MM-DD format'],
  },
  status: {
    type: String,
    enum: ['taken', 'skipped'],
    required: true,
  },
  recordedAt: {
    type: Date,
    default: Date.now,
  },
});

medicationDoseSchema.index({ user: 1, medication: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('MedicationDose', medicationDoseSchema);
