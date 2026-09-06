const express = require('express');
const { downloadReport, getInsights, getMoodTrends } = require('../controllers/reportController');
const { protect } = require('../middleware/authmiddleware');

const router = express.Router();

router.get('/mood-trends', protect, getMoodTrends);
router.get('/export', protect, downloadReport);
router.get('/insights', protect, getInsights);

module.exports = router;
