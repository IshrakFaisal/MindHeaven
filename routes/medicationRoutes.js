const express = require('express');
const router = express.Router();
const {
  clearMedicationDose,
  createMedication,
  deleteMedication,
  getMedicationDoses,
  getMedications,
  setMedicationDose,
  updateMedication,
} = require('../controllers/medicationController');
const { protect } = require('../middleware/authmiddleware');

router.post('/', protect, createMedication);
router.get('/', protect, getMedications);
router.get('/doses', protect, getMedicationDoses);
router.put('/:id/doses/:date', protect, setMedicationDose);
router.delete('/:id/doses/:date', protect, clearMedicationDose);
router.patch('/:id', protect, updateMedication);
router.delete('/:id', protect, deleteMedication);

module.exports = router;
