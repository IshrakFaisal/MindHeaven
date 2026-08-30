const { getMoodTrends: loadMoodTrends, getReportData } = require('../services/reportService');
const { buildMindHavenReport } = require('../utils/mindHavenReport');
const { getCorrelationInsights } = require('../services/insightService');
const { sendError } = require('../utils/httpError');
const { sendRangeAwareError } = require('../utils/controllerHelpers');

const getMoodTrends = async (req, res) => {
  try {
    const options = req.query.start || req.query.end
      ? { start: req.query.start, end: req.query.end }
      : { range: req.query.range || 'week' };
    const analytics = await loadMoodTrends(req.user._id, options);
    return res.status(200).json(analytics);
  } catch (error) {
    return sendRangeAwareError(res, error);
  }
};

const downloadReport = async (req, res) => {
  try {
    const options = req.query.start || req.query.end
      ? { start: req.query.start, end: req.query.end }
      : { range: req.query.range || 'month' };
    const reportData = await getReportData(req.user, options);
    const pdf = buildMindHavenReport(reportData);
    const reportDate = new Date().toISOString().slice(0, 10);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="mindhaven-report-${reportDate}.pdf"`,
      'Content-Length': pdf.length,
      'Cache-Control': 'private, no-store',
    });
    return res.status(200).end(pdf);
  } catch (error) {
    return sendRangeAwareError(res, error);
  }
};

const getInsights = async (req, res) => {
  try {
    const insights = await getCorrelationInsights(req.user._id, req.query.days || 90);
    return res.status(200).json(insights);
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = { downloadReport, getInsights, getMoodTrends };
