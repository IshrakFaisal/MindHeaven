const {
  createMoodEntry,
  deleteMoodEntry,
  getMoodEntries,
  updateMoodEntry,
} = require('../controllers/moodController');
const { createProtectedCrudRouter } = require('./protectedCrudRouter');

module.exports = createProtectedCrudRouter({
  create: createMoodEntry,
  list: getMoodEntries,
  update: updateMoodEntry,
  remove: deleteMoodEntry,
});
