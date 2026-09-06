const mongoose = require('mongoose');

const reportShareSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  tokenHash: { type: String, required: true, unique: true, index: true },
  tokenPreview: { type: String, required: true },
  label: { type: String, trim: true, maxlength: 80, default: 'Wellbeing report' },
  range: { type: String, enum: ['week', 'month', 'year', 'custom'], default: 'month' },
  start: { type: String, default: '' },
  end: { type: String, default: '' },
  sections: {
    type: [String],
    enum: ['sleep', 'symptoms', 'medication', 'insights'],
    default: ['sleep', 'symptoms', 'medication', 'insights'],
  },
  expiresAt: { type: Date, required: true, index: true },
  revokedAt: { type: Date, default: null },
  accessCount: { type: Number, default: 0, min: 0 },
  lastAccessedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

reportShareSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('ReportShare', reportShareSchema);
