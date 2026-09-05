const CommunityPost = require('../models/CommunityPost');
const {
  COMMUNITY_TOPICS,
  REPORT_REASONS,
  buildCommunityFilter,
  createAnonymousAlias,
  isVerifiedTherapist,
  serializeCommunityPost,
} = require('../services/communityService');
const { sendError } = require('../utils/httpError');

const populateTherapist = (query) => query.populate({
  path: 'therapistResponse.therapist',
  select: 'name role therapistProfile.specialization therapistProfile.workplace therapistProfile.verificationStatus',
});

const cleanPostBody = (body = {}) => ({
  title: typeof body.title === 'string' ? body.title.trim() : '',
  body: typeof body.body === 'string' ? body.body.trim() : '',
  topic: body.topic,
  visibility: body.visibility || 'public',
});

const validatePostBody = (body, { partial = false } = {}) => {
  const value = cleanPostBody(body);
  if (!partial && (!value.title || !value.body)) return { error: 'A title and message are required' };
  if (Object.prototype.hasOwnProperty.call(body, 'title') && !value.title) return { error: 'A title is required' };
  if (Object.prototype.hasOwnProperty.call(body, 'body') && !value.body) return { error: 'A message is required' };
  if ((!partial || Object.prototype.hasOwnProperty.call(body, 'topic')) && !COMMUNITY_TOPICS.includes(value.topic)) {
    return { error: 'Choose a valid topic' };
  }
  if ((!partial || Object.prototype.hasOwnProperty.call(body, 'visibility')) && !['public', 'private'].includes(value.visibility)) {
    return { error: 'Choose public or private visibility' };
  }

  const allowed = {};
  ['title', 'body', 'topic', 'visibility'].forEach((field) => {
    if (!partial || Object.prototype.hasOwnProperty.call(body, field)) allowed[field] = value[field];
  });
  return { value: allowed };
};

const listCommunityPosts = async (req, res) => {
  try {
    const scope = req.query.scope === 'mine' ? 'mine' : 'all';
    const status = ['open', 'answered'].includes(req.query.status) ? req.query.status : 'all';
    const filter = buildCommunityFilter(req.user, scope, status);
    if (COMMUNITY_TOPICS.includes(req.query.topic)) filter.topic = req.query.topic;
    const posts = await populateTherapist(
      CommunityPost.find(filter).sort({ createdAt: -1 }),
    ).lean();
    return res.status(200).json(posts.map((post) => serializeCommunityPost(post, req.user)));
  } catch (error) {
    return sendError(res, error);
  }
};

const createCommunityPost = async (req, res) => {
  try {
    if (req.body.acknowledgedNotEmergency !== true) {
      return res.status(400).json({ message: 'Confirm that this community is not an emergency service before posting' });
    }
    const result = validatePostBody(req.body);
    if (result.error) return res.status(400).json({ message: result.error });
    const post = await CommunityPost.create({
      author: req.user._id,
      anonymousAlias: createAnonymousAlias(),
      ...result.value,
    });
    return res.status(201).json(serializeCommunityPost(post, req.user));
  } catch (error) {
    return sendError(res, error);
  }
};

const updateCommunityPost = async (req, res) => {
  try {
    const result = validatePostBody(req.body, { partial: true });
    if (result.error) return res.status(400).json({ message: result.error });
    const post = await populateTherapist(CommunityPost.findOneAndUpdate(
      { _id: req.params.id, author: req.user._id, hiddenByModeration: false },
      result.value,
      { returnDocument: 'after', runValidators: true },
    ));
    if (!post) return res.status(404).json({ message: 'Community post not found' });
    return res.status(200).json(serializeCommunityPost(post, req.user));
  } catch (error) {
    return sendError(res, error);
  }
};

const deleteCommunityPost = async (req, res) => {
  try {
    const post = await CommunityPost.findOneAndDelete({ _id: req.params.id, author: req.user._id });
    if (!post) return res.status(404).json({ message: 'Community post not found' });
    return res.status(200).json({ message: 'Community post deleted' });
  } catch (error) {
    return sendError(res, error);
  }
};

const respondToCommunityPost = async (req, res) => {
  try {
    if (!isVerifiedTherapist(req.user)) {
      return res.status(403).json({ message: 'Only verified professional therapists can respond' });
    }
    const body = typeof req.body.body === 'string' ? req.body.body.trim() : '';
    if (!body) return res.status(400).json({ message: 'A professional response is required' });

    const post = await populateTherapist(CommunityPost.findOneAndUpdate(
      {
        _id: req.params.id,
        hiddenByModeration: false,
        author: { $ne: req.user._id },
        therapistResponse: null,
      },
      { therapistResponse: { therapist: req.user._id, body, respondedAt: new Date() } },
      { returnDocument: 'after', runValidators: true },
    ));
    if (!post) {
      return res.status(409).json({ message: 'This post is unavailable or already has a therapist response' });
    }
    return res.status(201).json(serializeCommunityPost(post, req.user));
  } catch (error) {
    return sendError(res, error);
  }
};

const updateCommunityResponse = async (req, res) => {
  try {
    if (!isVerifiedTherapist(req.user)) {
      return res.status(403).json({ message: 'Only verified professional therapists can update a response' });
    }
    const body = typeof req.body.body === 'string' ? req.body.body.trim() : '';
    if (!body) return res.status(400).json({ message: 'A professional response is required' });
    const post = await populateTherapist(CommunityPost.findOneAndUpdate(
      { _id: req.params.id, 'therapistResponse.therapist': req.user._id },
      { 'therapistResponse.body': body, 'therapistResponse.respondedAt': new Date() },
      { returnDocument: 'after', runValidators: true },
    ));
    if (!post) return res.status(404).json({ message: 'Your professional response was not found' });
    return res.status(200).json(serializeCommunityPost(post, req.user));
  } catch (error) {
    return sendError(res, error);
  }
};

const reportCommunityPost = async (req, res) => {
  try {
    if (!REPORT_REASONS.includes(req.body.reason)) {
      return res.status(400).json({ message: 'Choose a valid report reason' });
    }
    const visibility = buildCommunityFilter(req.user);
    const post = await CommunityPost.findOneAndUpdate(
      {
        _id: req.params.id,
        ...visibility,
        author: { $ne: req.user._id },
        reports: { $not: { $elemMatch: { reporter: req.user._id } } },
      },
      { $push: { reports: { reporter: req.user._id, reason: req.body.reason, createdAt: new Date() } } },
      { returnDocument: 'after', runValidators: true },
    );
    if (!post) return res.status(409).json({ message: 'This post is unavailable or you already reported it' });
    return res.status(200).json({ message: 'Report received. Thank you for helping keep the community safe.' });
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = {
  createCommunityPost,
  deleteCommunityPost,
  listCommunityPosts,
  reportCommunityPost,
  respondToCommunityPost,
  updateCommunityPost,
  updateCommunityResponse,
};
