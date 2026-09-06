require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/user');

const email = process.argv[2]?.trim().toLowerCase();

const verifyTherapist = async () => {
  if (!email) throw new Error('Usage: node scripts/verifyTherapist.js therapist@example.com');
  await connectDB();
  const user = await User.findOne({ email, role: 'therapist' });
  if (!user) throw new Error('Professional therapist account not found');

  user.therapistProfile.verificationStatus = 'verified';
  user.therapistProfile.verifiedAt = new Date();
  await user.save();
  console.log(`Verified therapist account: ${email}`);
};

verifyTherapist()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
