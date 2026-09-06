const { randomUUID } = require('crypto');
const MoodEntry = require('../models/Moodentry');
const SleepLog = require('../models/SleepLog');
const SymptomLog = require('../models/SymptomLog');
const Tag = require('../models/Tag');
const { applyDefined, normalizeLabels, sendRangeAwareError } = require('../utils/controllerHelpers');
const { findDailyRecord, normalizeEntryDate, parseRecordedAt } = require('../utils/dailyRecord');

const isScore = (value) => Number.isFinite(Number(value)) && Number(value) >= 1 && Number(value) <= 10;

const createDailyCheckIn = async (req, res) => {
  const created = { mood: null, symptoms: null, sleep: null };
  const inserted = { mood: false, symptoms: false, sleep: false };

  try {
    const { mood, symptoms, sleep, tags = [], recordedAt, entryDate: requestedEntryDate } = req.body;
    if (!mood || !isScore(mood.moodValue)) {
      return res.status(400).json({ message: 'A mood score from 1 to 10 is required' });
    }

    if (symptoms) {
      const symptomValues = [
        symptoms.anxietyLevel,
        symptoms.sleepQuality,
        symptoms.energyLevel,
        symptoms.appetite,
      ];
      if (!symptomValues.every(isScore)) {
        return res.status(400).json({ message: 'All symptom scores must be from 1 to 10' });
      }
    }

    if (sleep && (!Number.isFinite(Number(sleep.sleepDuration)) || Number(sleep.sleepDuration) < 0 || Number(sleep.sleepDuration) > 24)) {
      return res.status(400).json({ message: 'Sleep duration must be from 0 to 24 hours' });
    }

    const createdAt = parseRecordedAt(recordedAt);
    const entryDate = normalizeEntryDate(requestedEntryDate, createdAt);
    const [existingMood, existingSymptoms, existingSleep] = await Promise.all([
      findDailyRecord(MoodEntry, req.user._id, entryDate),
      findDailyRecord(SymptomLog, req.user._id, entryDate),
      findDailyRecord(SleepLog, req.user._id, entryDate, ['sleepDate']),
    ]);
    const wasExisting = Boolean(existingMood || existingSymptoms || existingSleep);
    const checkInId = existingMood?.checkInId || existingSymptoms?.checkInId || existingSleep?.checkInId || randomUUID();

    if (existingMood) {
      created.mood = existingMood;
      applyDefined(created.mood, {
        moodValue: mood.moodValue,
        moodType: mood.moodType || existingMood.moodType || 'numeric',
        title: mood.title,
        note: mood.note,
      }, ['moodValue', 'moodType', 'title', 'note']);
      created.mood.checkInId = checkInId;
      created.mood.entryDate = entryDate;
      await created.mood.save();
    } else {
      created.mood = await MoodEntry.create({
        user: req.user._id,
        moodValue: mood.moodValue,
        moodType: mood.moodType || 'numeric',
        title: mood.title,
        note: mood.note,
        checkInId,
        entryDate,
        createdAt,
      });
      inserted.mood = true;
    }

    if (symptoms) {
      if (existingSymptoms) {
        created.symptoms = existingSymptoms;
        applyDefined(created.symptoms, symptoms, ['anxietyLevel', 'sleepQuality', 'energyLevel', 'appetite']);
        created.symptoms.checkInId = checkInId;
        created.symptoms.entryDate = entryDate;
        await created.symptoms.save();
      } else {
        created.symptoms = await SymptomLog.create({
          user: req.user._id,
          anxietyLevel: symptoms.anxietyLevel,
          sleepQuality: symptoms.sleepQuality,
          energyLevel: symptoms.energyLevel,
          appetite: symptoms.appetite,
          checkInId,
          entryDate,
          createdAt,
        });
        inserted.symptoms = true;
      }
    }

    if (sleep) {
      if (existingSleep) {
        created.sleep = existingSleep;
        applyDefined(created.sleep, sleep, ['sleepDuration', 'sleepQuality']);
        created.sleep.checkInId = checkInId;
        created.sleep.entryDate = entryDate;
        created.sleep.sleepDate = entryDate;
        await created.sleep.save();
      } else {
        created.sleep = await SleepLog.create({
          user: req.user._id,
          sleepDuration: sleep.sleepDuration,
          sleepQuality: sleep.sleepQuality,
          sleepDate: entryDate,
          checkInId,
          entryDate,
          createdAt,
        });
        inserted.sleep = true;
      }
    }

    const labels = normalizeLabels(tags);
    await Tag.deleteMany({ user: req.user._id, moodEntry: created.mood._id });
    const createdTags = labels.length
      ? await Tag.insertMany(labels.map((label) => ({
          user: req.user._id,
          moodEntry: created.mood._id,
          label,
        })))
      : [];

    return res.status(wasExisting ? 200 : 201).json({
      checkInId,
      updated: wasExisting,
      mood: created.mood,
      symptoms: created.symptoms,
      sleep: created.sleep,
      tags: createdTags,
    });
  } catch (error) {
    await Promise.all([
      inserted.mood && created.mood ? MoodEntry.deleteOne({ _id: created.mood._id }) : null,
      inserted.symptoms && created.symptoms ? SymptomLog.deleteOne({ _id: created.symptoms._id }) : null,
      inserted.sleep && created.sleep ? SleepLog.deleteOne({ _id: created.sleep._id }) : null,
      inserted.mood && created.mood ? Tag.deleteMany({ moodEntry: created.mood._id }) : null,
    ].filter(Boolean));
    return sendRangeAwareError(res, error);
  }
};

module.exports = { createDailyCheckIn };
