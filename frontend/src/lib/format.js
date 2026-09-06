export const formatDate = (value, options = {}) => {
  if (!value) return 'Not recorded';

  // Components use `year: true` as a convenient display flag. Intl expects
  // the literal values "numeric" or "2-digit", so normalize the flag before
  // passing the options through to the browser formatter.
  const { year, ...dateOptions } = options;

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: year === true ? 'numeric' : year,
    ...dateOptions,
  }).format(new Date(value));
};

export const localDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const recentDateRange = (days = 7, endDate = new Date()) => {
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - Math.max(0, days - 1));
  return { start: localDateKey(startDate), end: localDateKey(endDate) };
};

export const formatRelativeDate = (value) => {
  const date = new Date(value);
  const today = new Date();
  const dayMs = 24 * 60 * 60 * 1000;
  const difference = Math.floor(
    (new Date(today.getFullYear(), today.getMonth(), today.getDate()) -
      new Date(date.getFullYear(), date.getMonth(), date.getDate())) /
      dayMs,
  );

  if (difference === 0) return 'Today';
  if (difference === 1) return 'Yesterday';
  if (difference < 7) return `${difference} days ago`;
  return formatDate(value);
};

export const average = (values) => {
  const usable = values.map(Number).filter(Number.isFinite);
  if (!usable.length) return null;
  return Math.round((usable.reduce((sum, value) => sum + value, 0) / usable.length) * 10) / 10;
};

export const moodLabel = (value) => {
  if (value >= 9) return 'Thriving';
  if (value >= 7) return 'Good';
  if (value >= 5) return 'Steady';
  if (value >= 3) return 'Low';
  return 'Struggling';
};

export const moodEmoji = (value) => {
  if (value >= 9) return '🌟';
  if (value >= 7) return '🙂';
  if (value >= 5) return '😐';
  if (value >= 3) return '😕';
  return '🌧️';
};

const moodColors = [
  '#c98690', '#d99898', '#dfa78f', '#e5b886', '#ddc68b',
  '#c8ce96', '#a9cda8', '#88c3b2', '#66b5a7', '#3e9b8d',
];

export const moodColor = (value) => {
  const index = Math.min(9, Math.max(0, Math.round(Number(value) || 1) - 1));
  return moodColors[index];
};
