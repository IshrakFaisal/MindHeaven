const {
  createSleepLog,
  deleteSleepLog,
  getSleepLogs,
  updateSleepLog,
} = require('../controllers/sleepController');
const { createProtectedCrudRouter } = require('./protectedCrudRouter');

module.exports = createProtectedCrudRouter({
  create: createSleepLog,
  list: getSleepLogs,
  update: updateSleepLog,
  remove: deleteSleepLog,
});
