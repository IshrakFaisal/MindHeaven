const VALID_RANGES = new Set(['week', 'month', 'year']);

const round = (value, digits = 1) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return null;
  }

  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

const average = (values) => {
  const numericValues = values.filter((value) => Number.isFinite(value));
  if (!numericValues.length) return null;

  return round(
    numericValues.reduce((total, value) => total + value, 0) / numericValues.length,
  );
};

const startOfUtcDay = (date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

const addUtcDays = (date, days) => {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
};

const addUtcMonths = (date, months) => {
  const result = new Date(date);
  result.setUTCMonth(result.getUTCMonth() + months);
  return result;
};

const formatDayKey = (date) => date.toISOString().slice(0, 10);
const formatMonthKey = (date) => date.toISOString().slice(0, 7);

const formatDayLabel = (date) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date);

const formatMonthLabel = (date) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: '2-digit',
    timeZone: 'UTC',
  }).format(date);

const formatLongDate = (date) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);

const getRangeWindow = (range = 'week', now = new Date()) => {
  if (!VALID_RANGES.has(range)) {
    throw new RangeError('Range must be week, month, or year');
  }

  const endDate = new Date(now);

  if (range === 'year') {
    const currentMonth = new Date(
      Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), 1),
    );

    return {
      range,
      startDate: addUtcMonths(currentMonth, -11),
      endDate,
      bucketCount: 12,
      bucketUnit: 'month',
      label: 'Last 12 months',
    };
  }

  const bucketCount = range === 'week' ? 7 : 30;
  const currentDay = startOfUtcDay(endDate);

  return {
    range,
    startDate: addUtcDays(currentDay, -(bucketCount - 1)),
    endDate,
    bucketCount,
    bucketUnit: 'day',
    label: range === 'week' ? 'Last 7 days' : 'Last 30 days',
  };
};

const getCustomRangeWindow = (start, end) => {
  if (!start || !end) throw new RangeError('Both start and end dates are required');
  const startDate = startOfUtcDay(new Date(`${start}T00:00:00.000Z`));
  const endDay = startOfUtcDay(new Date(`${end}T00:00:00.000Z`));
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDay.getTime())) {
    throw new RangeError('Start and end must be valid dates');
  }
  if (endDay < startDate) throw new RangeError('End date must be on or after start date');

  const bucketCount = Math.round((endDay - startDate) / (24 * 60 * 60 * 1000)) + 1;
  if (bucketCount > 366) throw new RangeError('Custom date range cannot exceed 366 days');

  const endDate = new Date(endDay);
  endDate.setUTCHours(23, 59, 59, 999);
  return {
    range: 'custom',
    startDate,
    endDate,
    bucketCount,
    bucketUnit: 'day',
    label: `${formatLongDate(startDate)} - ${formatLongDate(endDay)}`,
  };
};

const buildEmptyBuckets = (window) => {
  return Array.from({ length: window.bucketCount }, (_, index) => {
    const date =
      window.bucketUnit === 'month'
        ? addUtcMonths(window.startDate, index)
        : addUtcDays(window.startDate, index);

    return {
      key: window.bucketUnit === 'month' ? formatMonthKey(date) : formatDayKey(date),
      period: date.toISOString(),
      label: window.bucketUnit === 'month' ? formatMonthLabel(date) : formatDayLabel(date),
      values: [],
    };
  });
};

const getTrend = (series) => {
  const populated = series.filter((point) => point.average !== null);
  if (populated.length < 2) {
    return { direction: 'not-enough-data', change: null };
  }

  const change = round(
    populated[populated.length - 1].average - populated[0].average,
  );

  if (change > 0.25) return { direction: 'improving', change };
  if (change < -0.25) return { direction: 'declining', change };
  return { direction: 'steady', change };
};

const buildMoodAnalytics = (entries, range = 'week', now = new Date(), customWindow = null) => {
  const window = customWindow || getRangeWindow(range, now);
  const buckets = buildEmptyBuckets(window);
  const bucketsByKey = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  const filteredEntries = entries.filter((entry) => {
    const createdAt = new Date(entry.createdAt);
    return createdAt >= window.startDate && createdAt <= window.endDate;
  });

  filteredEntries.forEach((entry) => {
    const createdAt = new Date(entry.createdAt);
    const key =
      window.bucketUnit === 'month' ? formatMonthKey(createdAt) : formatDayKey(createdAt);
    const bucket = bucketsByKey.get(key);

    if (bucket && Number.isFinite(Number(entry.moodValue))) {
      bucket.values.push(Number(entry.moodValue));
    }
  });

  const series = buckets.map(({ values, ...bucket }) => ({
    ...bucket,
    average: average(values),
    count: values.length,
  }));
  const moodValues = filteredEntries.map((entry) => Number(entry.moodValue));

  return {
    range: window.range,
    rangeLabel: window.label,
    startDate: window.startDate.toISOString(),
    endDate: window.endDate.toISOString(),
    totalEntries: filteredEntries.length,
    averageMood: average(moodValues),
    highestMood: moodValues.length ? Math.max(...moodValues) : null,
    lowestMood: moodValues.length ? Math.min(...moodValues) : null,
    trend: getTrend(series),
    series,
  };
};

module.exports = {
  VALID_RANGES,
  average,
  buildMoodAnalytics,
  getCustomRangeWindow,
  getRangeWindow,
  round,
};
