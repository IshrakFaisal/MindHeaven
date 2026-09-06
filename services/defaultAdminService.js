const bcrypt = require('bcryptjs');
const User = require('../models/user');

const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'admin123';

const ensureDefaultAdmin = async () => {
  const existingAdmin = await User.findOne({ role: 'admin' });
  if (existingAdmin) return existingAdmin;

  const password = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const existingAccount = await User.findOne({ email: ADMIN_EMAIL });
  if (existingAccount) {
    existingAccount.role = 'admin';
    existingAccount.password = password;
    await existingAccount.save();
    return existingAccount;
  }

  return User.create({
    name: 'MindHaven Admin',
    email: ADMIN_EMAIL,
    password,
    role: 'admin',
  });
};

module.exports = { ensureDefaultAdmin };
