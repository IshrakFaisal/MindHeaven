const express = require('express');
const { createDailyCheckIn } = require('../controllers/checkInController');
const { protect } = require('../middleware/authmiddleware');

const router = express.Router();

router.post('/', protect, createDailyCheckIn);

module.exports = router;
