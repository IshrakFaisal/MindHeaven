const Tag = require('../models/Tag');
const MoodEntry = require('../models/Moodentry');
const { sendError } = require('../utils/httpError');

const createTag = async (req, res) => {
  try {
    const { moodEntry, label } = req.body;

    const ownedMoodEntry = await MoodEntry.exists({
      _id: moodEntry,
      user: req.user._id,
    });

    if (!ownedMoodEntry) {
      return res.status(404).json({ message: 'Mood entry not found' });
    }

    const tag = await Tag.create({
      user: req.user._id,
      moodEntry,
      label,
    });

    res.status(201).json(tag);
  } catch (error) {
    return sendError(res, error);
  }
};

const getTagsForMoodEntry = async (req, res) => {
  try {
    const tags = await Tag.find({
      user: req.user._id,
      moodEntry: req.params.moodEntryId,
    });
    res.status(200).json(tags);
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = { createTag, getTagsForMoodEntry };
