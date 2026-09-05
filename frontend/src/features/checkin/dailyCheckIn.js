import { localDateKey } from '../../lib/format.js';

export const recordDateKey = (record) => {
  if (!record) return '';
  if (record.entryDate) return record.entryDate;
  if (record.sleepDate) return record.sleepDate;
  return record.createdAt ? localDateKey(new Date(record.createdAt)) : '';
};

export const findRecordForDate = (records = [], dateKey = localDateKey()) => (
  [...records]
    .filter((record) => recordDateKey(record) === dateKey)
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))[0] || null
);

export const getDailyCheckIn = (data = {}, dateKey = localDateKey()) => {
  const mood = findRecordForDate(data.moods, dateKey);
  return {
    dateKey,
    mood,
    symptoms: findRecordForDate(data.symptoms, dateKey),
    sleep: findRecordForDate(data.sleep, dateKey),
    tags: mood ? (data.tagsByMood?.[mood._id] || []).map((tag) => tag.label) : [],
  };
};
