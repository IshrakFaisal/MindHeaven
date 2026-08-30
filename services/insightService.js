const MoodEntry = require('../models/Moodentry');
const SleepLog = require('../models/SleepLog');
const SymptomLog = require('../models/SymptomLog');
const { average, round } = require('./analyticsService');

const MINIMUM_PAIRED_DAYS = 5;
const INSIGHT_METHOD = 'Daily averages are paired by calendar day, then compared using a Pearson coefficient or a simple sleep-group average.';
const INSIGHT_LIMITATION = 'Small samples, missing days, and other life factors can change this pattern. Treat it as a reflection prompt, not clinical evidence.';
const dayKey = (value) => new Date(value).toISOString().slice(0, 10);

const bucketAverage = (entries, valueKey) => {
  const buckets = new Map();
  entries.forEach((entry) => {
    const key = dayKey(entry.createdAt);
    const value = Number(entry[valueKey]);
    if (!Number.isFinite(value)) return;
    const values = buckets.get(key) || [];
    values.push(value);
    buckets.set(key, values);
  });
  return new Map([...buckets].map(([key, values]) => [key, average(values)]));
};

const pairDailyValues = (moods, records, recordKey) => {
  const moodByDay = bucketAverage(moods, 'moodValue');
  const recordByDay = bucketAverage(records, recordKey);
  return [...moodByDay]
    .filter(([key]) => recordByDay.has(key))
    .map(([key, mood]) => ({ key, mood, value: recordByDay.get(key) }));
};

const pearson = (pairs) => {
  if (pairs.length < 2) return null;
  const meanX = average(pairs.map((pair) => pair.value));
  const meanY = average(pairs.map((pair) => pair.mood));
  const numerator = pairs.reduce((sum, pair) => sum + (pair.value - meanX) * (pair.mood - meanY), 0);
  const denominatorX = Math.sqrt(pairs.reduce((sum, pair) => sum + (pair.value - meanX) ** 2, 0));
  const denominatorY = Math.sqrt(pairs.reduce((sum, pair) => sum + (pair.mood - meanY) ** 2, 0));
  if (!denominatorX || !denominatorY) return null;
  return round(numerator / (denominatorX * denominatorY), 2);
};

const gatheringInsight = (id, title, sampleSize) => ({
  id,
  title,
  status: 'gathering',
  sampleSize,
  minimumSampleSize: MINIMUM_PAIRED_DAYS,
  evidenceLevel: 'gathering',
  method: INSIGHT_METHOD,
  limitation: INSIGHT_LIMITATION,
  statement: `Keep logging until at least ${MINIMUM_PAIRED_DAYS} days contain both measurements.`,
  detail: `${sampleSize} paired day${sampleSize === 1 ? '' : 's'} available so far.`,
});

const buildSleepInsight = (moods, sleepLogs) => {
  const pairs = pairDailyValues(moods, sleepLogs, 'sleepDuration');
  if (pairs.length < MINIMUM_PAIRED_DAYS) return gatheringInsight('sleep-mood', 'Sleep and mood', pairs.length);

  const rested = pairs.filter((pair) => pair.value >= 7);
  const shorter = pairs.filter((pair) => pair.value < 7);
  const coefficient = pearson(pairs);
  if (rested.length >= 2 && shorter.length >= 2) {
    const restedMood = average(rested.map((pair) => pair.mood));
    const shorterMood = average(shorter.map((pair) => pair.mood));
    const difference = round(restedMood - shorterMood);
    const direction = difference > 0 ? 'higher' : difference < 0 ? 'lower' : 'about the same';
    return {
      id: 'sleep-mood',
      title: 'Sleep and mood',
      status: 'ready',
      sampleSize: pairs.length,
      minimumSampleSize: MINIMUM_PAIRED_DAYS,
      evidenceLevel: 'exploratory',
      method: INSIGHT_METHOD,
      limitation: INSIGHT_LIMITATION,
      statement: difference === 0
        ? 'Average mood was about the same across the two sleep groups.'
        : `Average mood was ${Math.abs(difference)} points ${direction} on days with at least 7 hours of sleep.`,
      detail: `${rested.length} rested days averaged ${restedMood}/10; ${shorter.length} shorter-sleep days averaged ${shorterMood}/10.`,
      evidence: { coefficient, difference, restedDays: rested.length, shorterSleepDays: shorter.length },
    };
  }

  return {
    id: 'sleep-mood',
    title: 'Sleep and mood',
    status: 'ready',
    sampleSize: pairs.length,
    minimumSampleSize: MINIMUM_PAIRED_DAYS,
    evidenceLevel: 'exploratory',
    method: INSIGHT_METHOD,
    limitation: INSIGHT_LIMITATION,
    statement: coefficient === null
      ? 'Your sleep duration has not varied enough to compare it with mood yet.'
      : `The sleep-mood correlation in this period was ${coefficient}.`,
    detail: 'More days in both sleep groups will make this comparison easier to interpret.',
    evidence: { coefficient },
  };
};

const buildAnxietyInsight = (moods, symptomLogs) => {
  const pairs = pairDailyValues(moods, symptomLogs, 'anxietyLevel');
  if (pairs.length < MINIMUM_PAIRED_DAYS) return gatheringInsight('anxiety-mood', 'Anxiety and mood', pairs.length);
  const coefficient = pearson(pairs);
  let relationship = 'showed little consistent movement together';
  if (coefficient !== null && coefficient <= -0.35) relationship = 'generally moved in opposite directions';
  if (coefficient !== null && coefficient >= 0.35) relationship = 'generally moved in the same direction';
  return {
    id: 'anxiety-mood',
    title: 'Anxiety and mood',
    status: 'ready',
    sampleSize: pairs.length,
    minimumSampleSize: MINIMUM_PAIRED_DAYS,
    evidenceLevel: 'exploratory',
    method: INSIGHT_METHOD,
    limitation: INSIGHT_LIMITATION,
    statement: `Recorded anxiety and mood ${relationship}.`,
    detail: coefficient === null
      ? 'There was not enough variation to calculate a coefficient.'
      : `Correlation coefficient: ${coefficient}, based on ${pairs.length} paired days.`,
    evidence: { coefficient },
  };
};

const buildCorrelationInsights = ({ moods = [], sleepLogs = [], symptomLogs = [] }) => ({
  minimumSampleSize: MINIMUM_PAIRED_DAYS,
  insights: [buildSleepInsight(moods, sleepLogs), buildAnxietyInsight(moods, symptomLogs)],
  disclaimer: 'These are descriptive correlations from personal logs. They do not establish cause or provide a diagnosis.',
});

const getCorrelationInsights = async (userId, days = 90, now = new Date()) => {
  const numericDays = Math.min(365, Math.max(14, Number(days) || 90));
  const startDate = new Date(now);
  startDate.setUTCDate(startDate.getUTCDate() - (numericDays - 1));
  startDate.setUTCHours(0, 0, 0, 0);
  const filter = { user: userId, createdAt: { $gte: startDate, $lte: now } };
  const [moods, sleepLogs, symptomLogs] = await Promise.all([
    MoodEntry.find(filter).lean(),
    SleepLog.find(filter).lean(),
    SymptomLog.find(filter).lean(),
  ]);
  return {
    generatedAt: now.toISOString(),
    days: numericDays,
    startDate: startDate.toISOString(),
    endDate: now.toISOString(),
    ...buildCorrelationInsights({ moods, sleepLogs, symptomLogs }),
  };
};

module.exports = {
  MINIMUM_PAIRED_DAYS,
  buildCorrelationInsights,
  getCorrelationInsights,
  pairDailyValues,
  pearson,
};
