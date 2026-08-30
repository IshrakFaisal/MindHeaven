const Medication = require('../models/Medication');
const MoodEntry = require('../models/Moodentry');
const SleepLog = require('../models/SleepLog');
const SymptomLog = require('../models/SymptomLog');
const {
  average,
  buildMoodAnalytics,
  getCustomRangeWindow,
  getRangeWindow,
} = require('./analyticsService');
const { buildCorrelationInsights } = require('./insightService');

const resolveWindow = (options, now = new Date()) => {
  if (typeof options === 'object' && options?.start && options?.end) {
    return getCustomRangeWindow(options.start, options.end);
  }
  const range = typeof options === 'string' ? options : options?.range;
  return getRangeWindow(range || 'week', now);
};

const getMoodTrends = async (userId, options, now = new Date()) => {
  const window = resolveWindow(options, now);
  const entries = await MoodEntry.find({
    user: userId,
    createdAt: { $gte: window.startDate, $lte: window.endDate },
  })
    .sort({ createdAt: 1 })
    .lean();

  return buildMoodAnalytics(entries, window.range, now, window.range === 'custom' ? window : null);
};

const getReportData = async (user, options, now = new Date()) => {
  const window = resolveWindow(options, now);
  const dateFilter = {
    user: user._id,
    createdAt: { $gte: window.startDate, $lte: window.endDate },
  };

  const [moods, sleepLogs, symptomLogs, medications] = await Promise.all([
    MoodEntry.find(dateFilter).sort({ createdAt: -1 }).lean(),
    SleepLog.find(dateFilter).sort({ createdAt: -1 }).lean(),
    SymptomLog.find(dateFilter).sort({ createdAt: -1 }).lean(),
    Medication.find({ user: user._id }).sort({ createdAt: -1 }).lean(),
  ]);

  const analytics = buildMoodAnalytics(
    moods,
    window.range,
    now,
    window.range === 'custom' ? window : null,
  );
  const correlations = buildCorrelationInsights({ moods, sleepLogs, symptomLogs });

  return {
    generatedAt: now.toISOString(),
    user: {
      name: user.name,
      email: user.email,
    },
    analytics,
    correlations,
    moods,
    sleepLogs,
    symptomLogs,
    medications,
    averages: {
      sleepDuration: average(sleepLogs.map((entry) => Number(entry.sleepDuration))),
      sleepQuality: average(sleepLogs.map((entry) => Number(entry.sleepQuality))),
      anxietyLevel: average(symptomLogs.map((entry) => Number(entry.anxietyLevel))),
      energyLevel: average(symptomLogs.map((entry) => Number(entry.energyLevel))),
      appetite: average(symptomLogs.map((entry) => Number(entry.appetite))),
    },
  };
};

module.exports = { getMoodTrends, getReportData, resolveWindow };
