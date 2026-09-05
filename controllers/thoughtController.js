const ThoughtRecord = require('../models/ThoughtRecord');
const { sendError } = require('../utils/httpError');
const { pickDefined } = require('../utils/controllerHelpers');

const fields = [
  'situation',
  'automaticThought',
  'emotion',
  'intensity',
  'evidenceFor',
  'evidenceAgainst',
  'balancedThought',
  'afterIntensity',
];

const cleanBody = (body = {}) => pickDefined(body, fields);

const createThoughtRecord = async (req, res) => {
  try {
    const record = await ThoughtRecord.create({ user: req.user._id, ...cleanBody(req.body) });
    return res.status(201).json(record);
  } catch (error) {
    return sendError(res, error);
  }
};

const getThoughtRecords = async (req, res) => {
  try {
    const records = await ThoughtRecord.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();
    return res.status(200).json(records);
  } catch (error) {
    return sendError(res, error);
  }
};

const updateThoughtRecord = async (req, res) => {
  try {
    const record = await ThoughtRecord.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { ...cleanBody(req.body), updatedAt: new Date() },
      { returnDocument: 'after', runValidators: true },
    );
    if (!record) return res.status(404).json({ message: 'Thought record not found' });
    return res.status(200).json(record);
  } catch (error) {
    return sendError(res, error);
  }
};

const deleteThoughtRecord = async (req, res) => {
  try {
    const record = await ThoughtRecord.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!record) return res.status(404).json({ message: 'Thought record not found' });
    return res.status(200).json({ message: 'Thought record deleted' });
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = { createThoughtRecord, deleteThoughtRecord, getThoughtRecords, updateThoughtRecord };
