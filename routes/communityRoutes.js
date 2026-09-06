const express = require('express');
const {
  createCommunityPost,
  deleteCommunityPost,
  listCommunityPosts,
  reportCommunityPost,
  respondToCommunityPost,
  updateCommunityPost,
  updateCommunityResponse,
} = require('../controllers/communityController');
const { protect } = require('../middleware/authmiddleware');

const router = express.Router();

router.use(protect);
router.route('/').get(listCommunityPosts).post(createCommunityPost);
router.route('/:id').patch(updateCommunityPost).delete(deleteCommunityPost);
router.post('/:id/response', respondToCommunityPost);
router.patch('/:id/response', updateCommunityResponse);
router.post('/:id/report', reportCommunityPost);

module.exports = router;
