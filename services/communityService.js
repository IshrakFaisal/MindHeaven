const COMMUNITY_TOPICS = Object.freeze([
  'anxiety',
  'stress',
  'sleep',
  'relationships',
  'grief',
  'work-study',
  'self-esteem',
  'other',
]);

const REPORT_REASONS = Object.freeze(['unsafe', 'harassment', 'misinformation', 'spam', 'other']);

const ALIAS_ADJECTIVES = ['Calm', 'Brave', 'Gentle', 'Hopeful', 'Quiet', 'Steady', 'Thoughtful', 'Warm'];
const ALIAS_NOUNS = ['Banyan', 'Dove', 'Meadow', 'River', 'Shapla', 'Sky', 'Sunrise', 'TeaLeaf'];

const isVerifiedTherapist = (user) => (
  user?.role === 'therapist' && user?.therapistProfile?.verificationStatus === 'verified'
);

const createAnonymousAlias = (random = Math.random) => {
  const adjective = ALIAS_ADJECTIVES[Math.floor(random() * ALIAS_ADJECTIVES.length)];
  const noun = ALIAS_NOUNS[Math.floor(random() * ALIAS_NOUNS.length)];
  const suffix = String(Math.floor(random() * 10000)).padStart(4, '0');
  return `${adjective} ${noun} ${suffix}`;
};

const buildCommunityFilter = (user, scope = 'all', status = 'all') => {
  const filter = { hiddenByModeration: false };
  if (scope === 'mine') {
    filter.author = user._id;
  } else if (!isVerifiedTherapist(user)) {
    filter.$or = [{ visibility: 'public' }, { author: user._id }];
  }

  if (status === 'open') filter.therapistResponse = null;
  if (status === 'answered') filter.therapistResponse = { $ne: null };
  return filter;
};

const therapistPublicProfile = (therapist) => {
  if (!therapist) return null;
  const profile = therapist.therapistProfile || {};
  return {
    name: therapist.name,
    specialization: profile.specialization || '',
    workplace: profile.workplace || '',
    verified: therapist.role === 'therapist' && profile.verificationStatus === 'verified',
  };
};

const serializeCommunityPost = (source, viewer) => {
  const post = typeof source.toObject === 'function' ? source.toObject() : source;
  const authorId = post.author?._id || post.author;
  const isOwner = String(authorId) === String(viewer?._id);
  const response = post.therapistResponse
    ? {
      body: post.therapistResponse.body,
      respondedAt: post.therapistResponse.respondedAt,
      therapist: therapistPublicProfile(post.therapistResponse.therapist),
    }
    : null;

  return {
    _id: post._id,
    anonymousAlias: post.anonymousAlias,
    topic: post.topic,
    title: post.title,
    body: post.body,
    visibility: post.visibility,
    therapistResponse: response,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    isOwner,
    canRespond: isVerifiedTherapist(viewer) && !isOwner && !response,
  };
};

module.exports = {
  COMMUNITY_TOPICS,
  REPORT_REASONS,
  buildCommunityFilter,
  createAnonymousAlias,
  isVerifiedTherapist,
  serializeCommunityPost,
};
