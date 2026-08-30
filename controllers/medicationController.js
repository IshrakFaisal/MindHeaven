const Medication = require('../models/Medication');
const MedicationDose = require('../models/MedicationDose');
const { sendError } = require('../utils/httpError');
const { applyDefined } = require('../utils/controllerHelpers');

const MEDICATION_UPDATE_FIELDS = ['medicationName', 'dosage', 'schedule', 'reminderTime', 'active'];

const isValidDateKey = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};

const createMedication = async (req, res) => {
  try {
    const { medicationName, dosage, schedule, reminderTime, active } = req.body;

    const medication = await Medication.create({
      user: req.user._id,
      medicationName,
      dosage,
      schedule,
      reminderTime,
      active,
    });

    res.status(201).json(medication);
  } catch (error) {
    return sendError(res, error);
  }
};

const getMedications = async (req, res) => {
  try {
    const medications = await Medication.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(medications);
  } catch (error) {
    return sendError(res, error);
  }
};

const getMedicationDoses = async (req, res) => {
  try {
    const end = req.query.end || new Date().toISOString().slice(0, 10);
    const defaultStart = new Date(`${end}T00:00:00.000Z`);
    defaultStart.setUTCDate(defaultStart.getUTCDate() - 6);
    const start = req.query.start || defaultStart.toISOString().slice(0, 10);

    if (!isValidDateKey(start) || !isValidDateKey(end) || start > end) {
      return res.status(400).json({ message: 'Dose history requires a valid start and end date' });
    }

    const span = (new Date(`${end}T00:00:00.000Z`) - new Date(`${start}T00:00:00.000Z`)) / 86400000;
    if (span > 365) return res.status(400).json({ message: 'Dose history is limited to 366 days' });

    const doses = await MedicationDose.find({
      user: req.user._id,
      date: { $gte: start, $lte: end },
    }).sort({ date: -1, recordedAt: -1 });
    return res.status(200).json(doses);
  } catch (error) {
    return sendError(res, error);
  }
};

const setMedicationDose = async (req, res) => {
  try {
    const { id, date } = req.params;
    const { status } = req.body;
    if (!isValidDateKey(date)) return res.status(400).json({ message: 'Dose date must use YYYY-MM-DD format' });
    if (!['taken', 'skipped'].includes(status)) {
      return res.status(400).json({ message: 'Dose status must be taken or skipped' });
    }

    const medication = await Medication.findOne({ _id: id, user: req.user._id });
    if (!medication) return res.status(404).json({ message: 'Medication not found' });

    const dose = await MedicationDose.findOneAndUpdate(
      { user: req.user._id, medication: medication._id, date },
      { $set: { status, recordedAt: new Date() } },
      { returnDocument: 'after', upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );
    return res.status(200).json(dose);
  } catch (error) {
    return sendError(res, error);
  }
};

const clearMedicationDose = async (req, res) => {
  try {
    const { id, date } = req.params;
    if (!isValidDateKey(date)) return res.status(400).json({ message: 'Dose date must use YYYY-MM-DD format' });
    const medication = await Medication.findOne({ _id: id, user: req.user._id });
    if (!medication) return res.status(404).json({ message: 'Medication not found' });
    await MedicationDose.deleteOne({ user: req.user._id, medication: medication._id, date });
    return res.status(200).json({ message: 'Dose status cleared' });
  } catch (error) {
    return sendError(res, error);
  }
};

const updateMedication = async (req, res) => {
  try {
    const medication = await Medication.findOne({ _id: req.params.id, user: req.user._id });
    if (!medication) return res.status(404).json({ message: 'Medication not found' });
    applyDefined(medication, req.body, MEDICATION_UPDATE_FIELDS);
    await medication.save();
    return res.status(200).json(medication);
  } catch (error) {
    return sendError(res, error);
  }
};

const deleteMedication = async (req, res) => {
  try {
    const medication = await Medication.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!medication) return res.status(404).json({ message: 'Medication not found' });
    await MedicationDose.deleteMany({ user: req.user._id, medication: medication._id });
    return res.status(200).json({ message: 'Medication deleted' });
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = {
  clearMedicationDose,
  createMedication,
  deleteMedication,
  getMedicationDoses,
  getMedications,
  isValidDateKey,
  setMedicationDose,
  updateMedication,
};
