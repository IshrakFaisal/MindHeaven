const express = require('express');
const router = express.Router();
const { createTag, getTagsForMoodEntry } = require('../controllers/tagController');
const { protect } = require('../middleware/authmiddleware');

router.post('/', protect, createTag);
router.get('/mood/:moodEntryId', protect, getTagsForMoodEntry);

module.exports = router;
