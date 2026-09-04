const MoodEntry = require('../models/Moodentry');
const Tag = require('../models/Tag');
const { sendError } = require('../utils/httpError');
const { applyDefined, normalizeLabels, sendRangeAwareError } = require('../utils/controllerHelpers');
const { findDailyRecord, normalizeEntryDate, parseRecordedAt } = require('../utils/dailyRecord');

const MOOD_UPDATE_FIELDS = ['moodValue', 'moodType', 'title', 'note'];

const createMoodEntry = async (req, res) => {
  let moodEntry = null;
  try {
    const {
      moodValue,
      moodType,
      title,
      note,
      checkInId,
      entryDate: requestedEntryDate,
      recordedAt,
      tags = [],
    } = req.body;
    const createdAt = parseRecordedAt(recordedAt);
    const entryDate = normalizeEntryDate(requestedEntryDate, createdAt);
    const existingEntry = await findDailyRecord(MoodEntry, req.user._id, entryDate);

    if (existingEntry) {
      return res.status(409).json({
        message: 'A check-in already exists for this date. Edit the existing entry instead.',
        existingId: existingEntry._id,
      });
    }

    moodEntry = await MoodEntry.create({
      user: req.user._id,
      moodValue,
      moodType,
      title,
      note,
      checkInId,
      entryDate,
      createdAt,
    });

    const labels = normalizeLabels(tags);
    if (labels.length) {
      await Tag.insertMany(labels.map((label) => ({ user: req.user._id, moodEntry: moodEntry._id, label })));
    }

    return res.status(201).json(moodEntry);
  } catch (error) {
    if (moodEntry) await Promise.all([
      Tag.deleteMany({ user: req.user._id, moodEntry: moodEntry._id }),
      MoodEntry.deleteOne({ _id: moodEntry._id }),
    ]);
    return sendRangeAwareError(res, error);
  }
};

const getMoodEntries = async (req, res) => {
  try {
    const filter = { user: req.user._id };
    const query = req.query.q?.trim();
    if (query) {
      const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { title: { $regex: escaped, $options: 'i' } },
        { note: { $regex: escaped, $options: 'i' } },
      ];
    }

    const moodEntries = await MoodEntry.find(filter).sort({ createdAt: -1 });
    res.status(200).json(moodEntries);
  } catch (error) {
    return sendError(res, error);
  }
};

const updateMoodEntry = async (req, res) => {
  try {
    const moodEntry = await MoodEntry.findOne({ _id: req.params.id, user: req.user._id });
    if (!moodEntry) return res.status(404).json({ message: 'Mood entry not found' });

    applyDefined(moodEntry, req.body, MOOD_UPDATE_FIELDS);
    await moodEntry.save();

    if (Array.isArray(req.body.tags)) {
      const labels = normalizeLabels(req.body.tags);
      await Tag.deleteMany({ user: req.user._id, moodEntry: moodEntry._id });
      if (labels.length) {
        await Tag.insertMany(labels.map((label) => ({ user: req.user._id, moodEntry: moodEntry._id, label })));
      }
    }

    return res.status(200).json(moodEntry);
  } catch (error) {
    return sendError(res, error);
  }
};

const deleteMoodEntry = async (req, res) => {
  try {
    const moodEntry = await MoodEntry.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!moodEntry) return res.status(404).json({ message: 'Mood entry not found' });
    await Tag.deleteMany({ user: req.user._id, moodEntry: moodEntry._id });
    return res.status(200).json({ message: 'Mood entry deleted' });
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = { createMoodEntry, deleteMoodEntry, getMoodEntries, updateMoodEntry };
