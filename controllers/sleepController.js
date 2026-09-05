const SleepLog = require('../models/SleepLog');
const { sendError } = require('../utils/httpError');
const { applyDefined } = require('../utils/controllerHelpers');

const SLEEP_UPDATE_FIELDS = ['sleepDuration', 'sleepQuality', 'sleepDate', 'bedtime', 'wakeTime'];

const createSleepLog = async (req, res) => {
  try {
    const { sleepDuration, sleepQuality, sleepDate, bedtime, wakeTime, checkInId } = req.body;

    const sleepLog = await SleepLog.create({
      user: req.user._id,
      sleepDuration,
      sleepQuality,
      sleepDate,
      bedtime,
      wakeTime,
      checkInId,
    });

    res.status(201).json(sleepLog);
  } catch (error) {
    return sendError(res, error);
  }
};

const getSleepLogs = async (req, res) => {
  try {
    const sleepLogs = await SleepLog.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(sleepLogs);
  } catch (error) {
    return sendError(res, error);
  }
};

const updateSleepLog = async (req, res) => {
  try {
    const sleepLog = await SleepLog.findOne({ _id: req.params.id, user: req.user._id });
    if (!sleepLog) return res.status(404).json({ message: 'Sleep log not found' });
    applyDefined(sleepLog, req.body, SLEEP_UPDATE_FIELDS);
    await sleepLog.save();
    return res.status(200).json(sleepLog);
  } catch (error) {
    return sendError(res, error);
  }
};

const deleteSleepLog = async (req, res) => {
  try {
    const sleepLog = await SleepLog.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!sleepLog) return res.status(404).json({ message: 'Sleep log not found' });
    return res.status(200).json({ message: 'Sleep log deleted' });
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = { createSleepLog, deleteSleepLog, getSleepLogs, updateSleepLog };
