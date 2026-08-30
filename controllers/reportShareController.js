const crypto = require('crypto');
const ReportShare = require('../models/ReportShare');
const User = require('../models/user');
const { getReportData, resolveWindow } = require('../services/reportService');
const { buildMindHavenReport } = require('../utils/mindHavenReport');
const { sendError } = require('../utils/httpError');
const { sendRangeAwareError } = require('../utils/controllerHelpers');

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
const SHARE_SECTION_IDS = Object.freeze(['sleep', 'symptoms', 'medication', 'insights']);
const DEFAULT_SHARE_SECTIONS = Object.freeze([...SHARE_SECTION_IDS]);

const normalizeShareSections = (sections) => {
  if (!Array.isArray(sections)) return [...DEFAULT_SHARE_SECTIONS];
  return [...new Set(sections.filter((section) => SHARE_SECTION_IDS.includes(section)))];
};

const filterSharedReport = (report, sections) => {
  const visible = new Set(normalizeShareSections(sections));
  const insightItems = visible.has('insights')
    ? (report.correlations?.insights || []).filter((insight) => (
      (insight.id !== 'sleep-mood' || visible.has('sleep'))
      && (insight.id !== 'anxiety-mood' || visible.has('symptoms'))
    ))
    : [];
  return {
    ...report,
    correlations: { ...report.correlations, insights: insightItems },
    sleepLogs: visible.has('sleep') ? report.sleepLogs : [],
    symptomLogs: visible.has('symptoms') ? report.symptomLogs : [],
    medications: visible.has('medication') ? report.medications : [],
    averages: {
      ...report.averages,
      sleepDuration: visible.has('sleep') ? report.averages.sleepDuration : null,
      sleepQuality: visible.has('sleep') ? report.averages.sleepQuality : null,
      anxietyLevel: visible.has('symptoms') ? report.averages.anxietyLevel : null,
      energyLevel: visible.has('symptoms') ? report.averages.energyLevel : null,
      appetite: visible.has('symptoms') ? report.averages.appetite : null,
    },
    sharedSections: [...visible],
  };
};

const shareOptions = (share) => (
  share.range === 'custom'
    ? { start: share.start, end: share.end }
    : { range: share.range }
);

const serializeShare = (share) => ({
  _id: share._id,
  label: share.label,
  range: share.range,
  start: share.start,
  end: share.end,
  sections: normalizeShareSections(share.sections),
  tokenPreview: share.tokenPreview,
  expiresAt: share.expiresAt,
  revokedAt: share.revokedAt,
  accessCount: share.accessCount || 0,
  lastAccessedAt: share.lastAccessedAt || null,
  createdAt: share.createdAt,
});

const findPublicShare = async (token) => {
  if (!token || token.length < 32) return null;
  return ReportShare.findOne({
    tokenHash: hashToken(token),
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  }).lean();
};

const createReportShare = async (req, res) => {
  try {
    const range = req.body.range || 'month';
    const options = range === 'custom'
      ? { start: req.body.start, end: req.body.end }
      : { range };
    const window = resolveWindow(options);
    const expiryDays = Math.min(30, Math.max(1, Number(req.body.expiryDays) || 7));
    const rawToken = crypto.randomBytes(32).toString('base64url');
    const share = await ReportShare.create({
      user: req.user._id,
      tokenHash: hashToken(rawToken),
      tokenPreview: rawToken.slice(-6),
      label: req.body.label?.trim() || `${window.label || 'Wellbeing'} report`,
      range: window.range,
      start: window.range === 'custom' ? req.body.start : '',
      end: window.range === 'custom' ? req.body.end : '',
      sections: normalizeShareSections(req.body.sections),
      expiresAt: new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000),
    });
    return res.status(201).json({ ...serializeShare(share), token: rawToken });
  } catch (error) {
    return sendRangeAwareError(res, error);
  }
};

const listReportShares = async (req, res) => {
  try {
    const shares = await ReportShare.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(30).lean();
    return res.status(200).json(shares.map(serializeShare));
  } catch (error) {
    return sendError(res, error);
  }
};

const revokeReportShare = async (req, res) => {
  try {
    const share = await ReportShare.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { revokedAt: new Date() },
      { returnDocument: 'after' },
    );
    if (!share) return res.status(404).json({ message: 'Shared report not found' });
    return res.status(200).json(serializeShare(share));
  } catch (error) {
    return sendError(res, error);
  }
};

const getPublicReport = async (req, res) => {
  try {
    const share = await findPublicShare(req.params.token);
    if (!share) return res.status(404).json({ message: 'This report link is invalid, expired, or revoked' });
    const user = await User.findById(share.user).select('name email').lean();
    if (!user) return res.status(404).json({ message: 'This report is no longer available' });
    const report = filterSharedReport(await getReportData(user, shareOptions(share)), share.sections);
    const accessedAt = new Date();
    await ReportShare.updateOne({ _id: share._id }, { $inc: { accessCount: 1 }, lastAccessedAt: accessedAt });
    return res.status(200).json({ share: serializeShare({ ...share, accessCount: (share.accessCount || 0) + 1, lastAccessedAt: accessedAt }), report });
  } catch (error) {
    return sendError(res, error);
  }
};

const downloadPublicReport = async (req, res) => {
  try {
    const share = await findPublicShare(req.params.token);
    if (!share) return res.status(404).json({ message: 'This report link is invalid, expired, or revoked' });
    const user = await User.findById(share.user).select('name email').lean();
    if (!user) return res.status(404).json({ message: 'This report is no longer available' });
    const report = filterSharedReport(await getReportData(user, shareOptions(share)), share.sections);
    await ReportShare.updateOne({ _id: share._id }, { $inc: { accessCount: 1 }, lastAccessedAt: new Date() });
    const pdf = buildMindHavenReport(report);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="mindhaven-shared-report-${new Date().toISOString().slice(0, 10)}.pdf"`,
      'Cache-Control': 'private, no-store',
    });
    return res.status(200).send(pdf);
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = {
  createReportShare,
  downloadPublicReport,
  getPublicReport,
  listReportShares,
  revokeReportShare,
  filterSharedReport,
  normalizeShareSections,
};
