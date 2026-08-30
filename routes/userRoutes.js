const express = require('express');
const router = express.Router();
const {
  changePassword,
  deleteAccount,
  exportAccountData,
  getPreferences,
  loginUser,
  registerUser,
  updateProfile,
  updatePreferences,
} = require('../controllers/userController');
const { protect } = require('../middleware/authmiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.get('/preferences', protect, getPreferences);
router.put('/preferences', protect, updatePreferences);
router.get('/export', protect, exportAccountData);
router.delete('/account', protect, deleteAccount);

module.exports = router;
