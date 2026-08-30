const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const {
  buildAccountExport,
  deleteAccountRecords,
  publicPreferences,
  publicUser,
  validatePreferences,
  validateProfileImage,
} = require('../services/accountService');
const { sendError } = require('../utils/httpError');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name?.trim() || !email?.trim() || !password || password.length < 6) {
      return res.status(400).json({
        message: 'Name, email, and a password of at least 6 characters are required',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    res.status(201).json({
      ...publicUser(newUser),
      token: generateToken(newUser._id),
    });
  } catch (error) {
    return sendError(res, error);
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    res.status(200).json({
      ...publicUser(user),
      token: generateToken(user._id),
    });
  } catch (error) {
    return sendError(res, error);
  }
};

const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.name = req.body.name?.trim() || user.name;
    user.email = req.body.email?.trim().toLowerCase() || user.email;
    if (Object.prototype.hasOwnProperty.call(req.body, 'profileImage')) {
      const image = validateProfileImage(req.body.profileImage);
      if (image.error) return res.status(400).json({ message: image.error });
      user.profileImage = image.value;
    }

    const updatedUser = await user.save();

    res.status(200).json(publicUser(updatedUser));
  } catch (error) {
    return sendError(res, error);
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({
        message: 'Current password and a new password of at least 6 characters are required',
      });
    }

    const user = await User.findById(req.user._id);

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    return sendError(res, error);
  }
};

const getPreferences = async (req, res) => {
  return res.status(200).json(publicPreferences(req.user.preferences));
};

const updatePreferences = async (req, res) => {
  try {
    const result = validatePreferences(req.body, req.user.preferences);
    if (result.error) return res.status(400).json({ message: result.error });
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { preferences: result.value },
      { returnDocument: 'after', runValidators: true },
    );
    return res.status(200).json(publicPreferences(user.preferences));
  } catch (error) {
    return sendError(res, error);
  }
};

const exportAccountData = async (req, res) => {
  try {
    const payload = await buildAccountExport(req.user);
    const filename = `mindhaven-data-${new Date().toISOString().slice(0, 10)}.json`;
    res.set({
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, no-store',
    });
    return res.status(200).send(JSON.stringify(payload, null, 2));
  } catch (error) {
    return sendError(res, error);
  }
};

const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ message: 'Password is required to delete your account' });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Password is incorrect' });

    await deleteAccountRecords(user._id);
    await User.deleteOne({ _id: user._id });
    return res.status(200).json({ message: 'Account and personal records deleted' });
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = {
  changePassword,
  deleteAccount,
  exportAccountData,
  getPreferences,
  loginUser,
  registerUser,
  updateProfile,
  updatePreferences,
};
