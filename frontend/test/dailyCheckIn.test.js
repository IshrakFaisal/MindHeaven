import test from 'node:test';
import assert from 'node:assert/strict';
import { findRecordForDate, getDailyCheckIn, recordDateKey } from '../src/features/checkin/dailyCheckIn.js';

test('daily check-in records prefer an explicit calendar date', () => {
  const record = { entryDate: '2026-08-31', createdAt: '2026-08-30T19:15:00.000Z' };
  assert.equal(recordDateKey(record), '2026-08-31');
  assert.equal(findRecordForDate([record], '2026-08-31'), record);
});

test('daily check-in joins mood, body, sleep, and tags for one date', () => {
  const mood = { _id: 'm1', entryDate: '2026-08-31', createdAt: '2026-08-31T12:00:00.000Z' };
  const symptoms = { _id: 's1', entryDate: '2026-08-31', createdAt: '2026-08-31T12:00:00.000Z' };
  const sleep = { _id: 'sl1', sleepDate: '2026-08-31', createdAt: '2026-08-31T12:00:00.000Z' };
  const result = getDailyCheckIn({ moods: [mood], symptoms: [symptoms], sleep: [sleep], tagsByMood: { m1: [{ label: 'work' }] } }, '2026-08-31');

  assert.equal(result.mood, mood);
  assert.equal(result.symptoms, symptoms);
  assert.equal(result.sleep, sleep);
  assert.deepEqual(result.tags, ['work']);
});
