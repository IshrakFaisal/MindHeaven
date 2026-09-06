const mongoose = require('mongoose');

const therapistResponseSchema = new mongoose.Schema({
  therapist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  body: { type: String, required: true, trim: true, maxlength: 3000 },
  respondedAt: { type: Date, default: Date.now },
}, { _id: false });

const reportSchema = new mongoose.Schema({
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reason: {
    type: String,
    enum: ['unsafe', 'harassment', 'misinformation', 'spam', 'other'],
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const communityPostSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  anonymousAlias: { type: String, required: true, trim: true, maxlength: 80 },
  topic: {
    type: String,
    enum: ['anxiety', 'stress', 'sleep', 'relationships', 'grief', 'work-study', 'self-esteem', 'other'],
    required: true,
  },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  body: { type: String, required: true, trim: true, maxlength: 3000 },
  visibility: { type: String, enum: ['public', 'private'], default: 'public', index: true },
  therapistResponse: { type: therapistResponseSchema, default: null },
  reports: { type: [reportSchema], default: [] },
  hiddenByModeration: { type: Boolean, default: false, index: true },
}, { timestamps: true });

communityPostSchema.index({ visibility: 1, createdAt: -1 });
communityPostSchema.index({ author: 1, createdAt: -1 });

module.exports = mongoose.model('CommunityPost', communityPostSchema);
