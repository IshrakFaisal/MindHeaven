const User = require('../models/user');
const { sendError } = require('../utils/httpError');

const pendingTherapists = async (req, res) => {
  try {
    const therapists = await User.find({
      role: 'therapist',
      'therapistProfile.verificationStatus': 'pending',
    }).select('name email therapistProfile createdAt').sort({ createdAt: 1 }).lean();
    return res.status(200).json(therapists);
  } catch (error) {
    return sendError(res, error);
  }
};

const approveTherapist = async (req, res) => {
  try {
    const therapist = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'therapist', 'therapistProfile.verificationStatus': 'pending' },
      { 'therapistProfile.verificationStatus': 'verified', 'therapistProfile.verifiedAt': new Date() },
      { returnDocument: 'after' },
    ).select('name email therapistProfile');
    if (!therapist) return res.status(404).json({ message: 'Pending therapist account not found' });
    return res.status(200).json({
      message: `${therapist.name} has been approved.`,
      therapist: { _id: therapist._id, name: therapist.name, email: therapist.email, therapistProfile: therapist.therapistProfile },
    });
  } catch (error) {
    return sendError(res, error);
  }
};

const declineTherapist = async (req, res) => {
  try {
    const therapist = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'therapist', 'therapistProfile.verificationStatus': 'pending' },
      { 'therapistProfile.verificationStatus': 'rejected', 'therapistProfile.verifiedAt': null },
      { returnDocument: 'after' },
    ).select('name');
    if (!therapist) return res.status(404).json({ message: 'Pending therapist account not found' });
    return res.status(200).json({ message: `${therapist.name}'s request was declined.` });
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = { approveTherapist, declineTherapist, pendingTherapists };
