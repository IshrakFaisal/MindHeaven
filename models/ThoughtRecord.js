const mongoose = require('mongoose');

const thoughtRecordSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  situation: { type: String, required: true, trim: true, maxlength: 500 },
  automaticThought: { type: String, required: true, trim: true, maxlength: 1200 },
  emotion: { type: String, required: true, trim: true, maxlength: 100 },
  intensity: { type: Number, required: true, min: 1, max: 10 },
  evidenceFor: { type: String, trim: true, maxlength: 1200, default: '' },
  evidenceAgainst: { type: String, trim: true, maxlength: 1200, default: '' },
  balancedThought: { type: String, required: true, trim: true, maxlength: 1200 },
  afterIntensity: { type: Number, required: true, min: 1, max: 10 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

thoughtRecordSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('ThoughtRecord', thoughtRecordSchema);
