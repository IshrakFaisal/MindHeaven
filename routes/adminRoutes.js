const express = require('express');
const { approveTherapist, declineTherapist, pendingTherapists } = require('../controllers/adminController');
const { protect, requireAdmin } = require('../middleware/authmiddleware');

const router = express.Router();
router.use(protect, requireAdmin);
router.get('/therapists/pending', pendingTherapists);
router.patch('/therapists/:id/approve', approveTherapist);
router.patch('/therapists/:id/decline', declineTherapist);

module.exports = router;
