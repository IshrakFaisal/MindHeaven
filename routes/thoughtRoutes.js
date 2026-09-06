const {
  createThoughtRecord,
  deleteThoughtRecord,
  getThoughtRecords,
  updateThoughtRecord,
} = require('../controllers/thoughtController');
const { createProtectedCrudRouter } = require('./protectedCrudRouter');

module.exports = createProtectedCrudRouter({
  create: createThoughtRecord,
  list: getThoughtRecords,
  update: updateThoughtRecord,
  remove: deleteThoughtRecord,
});
