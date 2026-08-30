const SymptomLog = require('../models/SymptomLog');
const { sendError } = require('../utils/httpError');

const { applyDefined } = require('../utils/controllerHelpers');

const SYMPTOM_UPDATE_FIELDS = ['anxietyLevel', 'sleepQuality', 'energyLevel', 'appetite'];

const createSymptomLog = async (req, res) => {
  try {
    const { anxietyLevel, sleepQuality, energyLevel, appetite, checkInId } = req.body;

    const symptomLog = await SymptomLog.create({
      user: req.user._id,
      anxietyLevel,
      sleepQuality,
      energyLevel,
      appetite,
      checkInId,
    });

    res.status(201).json(symptomLog);
  } catch (error) {
    return sendError(res, error);
  }
};

const getSymptomLogs = async (req, res) => {
  try {
    const symptomLogs = await SymptomLog.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(symptomLogs);
  } catch (error) {
    return sendError(res, error);
  }
};

const updateSymptomLog = async (req, res) => {
  try {
    const symptomLog = await SymptomLog.findOne({ _id: req.params.id, user: req.user._id });
    if (!symptomLog) return res.status(404).json({ message: 'Symptom log not found' });
    applyDefined(symptomLog, req.body, SYMPTOM_UPDATE_FIELDS);
    await symptomLog.save();
    return res.status(200).json(symptomLog);
  } catch (error) {
    return sendError(res, error);
  }
};

const deleteSymptomLog = async (req, res) => {
  try {
    const symptomLog = await SymptomLog.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!symptomLog) return res.status(404).json({ message: 'Symptom log not found' });
    return res.status(200).json({ message: 'Symptom log deleted' });
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = { createSymptomLog, deleteSymptomLog, getSymptomLogs, updateSymptomLog };
