const {
  createSymptomLog,
  deleteSymptomLog,
  getSymptomLogs,
  updateSymptomLog,
} = require('../controllers/symptomController');
const { createProtectedCrudRouter } = require('./protectedCrudRouter');

module.exports = createProtectedCrudRouter({
  create: createSymptomLog,
  list: getSymptomLogs,
  update: updateSymptomLog,
  remove: deleteSymptomLog,
});
