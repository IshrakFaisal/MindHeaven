import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMoodWeek, buildTodayChecklist } from '../src/lib/overview.js';

const now = new Date(2026, 7, 27, 14);
const today = new Date(2026, 7, 27, 10).toISOString();
const yesterday = new Date(2026, 7, 26, 10).toISOString();
const empty = () => ({ moods: [], sleep: [], symptoms: [], medications: [], medicationDoses: [] });

test('an empty day starts at zero and medication is optional without a schedule', () => {
  const result = buildTodayChecklist(empty(), now);
  assert.equal(result.completed, 0);
  assert.equal(result.total, 3);
  assert.equal(result.percent, 0);
  assert.equal(result.nextStep.id, 'mood');
  assert.equal(result.steps[3].optional, true);
  assert.equal(result.steps[3].done, false);
});

test('today checklist ignores previous days and uses the latest entry without sorting source data', () => {
  const data = empty();
  data.moods = [
    { moodValue: 4, createdAt: today },
    { moodValue: 9, createdAt: yesterday },
    { moodValue: 7, createdAt: new Date(2026, 7, 27, 13).toISOString() },
  ];
  const before = structuredClone(data);
  const result = buildTodayChecklist(data, now);
  assert.equal(result.steps[0].detail, '7/10 · Good');
  assert.equal(result.completed, 1);
  assert.equal(result.nextStep.id, 'sleep');
  assert.deepEqual(data, before);
});

test('completed mood, sleep and signals finish the checklist without medication', () => {
  const data = empty();
  data.moods = [{ moodValue: 8, createdAt: today }];
  data.sleep = [{ sleepDuration: 7.5, sleepQuality: 7, createdAt: today }];
  data.symptoms = [{ anxietyLevel: 3, energyLevel: 7, createdAt: today }];
  const result = buildTodayChecklist(data, now);
  assert.equal(result.completed, 3);
  assert.equal(result.percent, 100);
  assert.equal(result.nextStep, undefined);
});

test('today checklist describes connected body signals in the new format', () => {
  const data = empty();
  data.symptoms = [{ sensations: ['tight', 'fluttery'], emotion: 'uneasy', createdAt: today }];
  const result = buildTodayChecklist(data, now);
  assert.equal(result.steps[2].detail, 'Tight + Fluttery · Uneasy');
});

test('medication progress counts only distinct active schedules recorded today', () => {
  const data = empty();
  data.medications = [{ _id: 'one' }, { _id: 'two', active: true }, { _id: 'old', active: false }];
  data.medicationDoses = [
    { medication: 'one', date: '2026-08-27', status: 'taken' },
    { medication: 'one', date: '2026-08-27', status: 'taken' },
    { medication: 'old', date: '2026-08-27', status: 'taken' },
    { medication: 'two', date: '2026-08-26', status: 'taken' },
  ];
  let result = buildTodayChecklist(data, now);
  assert.equal(result.total, 4);
  assert.equal(result.steps[3].detail, '1 of 2 dose decisions recorded');
  assert.equal(result.steps[3].done, false);
  data.medicationDoses.push({ medication: { _id: 'two' }, date: '2026-08-27', status: 'skipped' });
  result = buildTodayChecklist(data, now);
  assert.equal(result.steps[3].done, true);
  assert.equal(result.completed, 1);
});

test('empty weekly charts have seven local days and no fabricated zero mood scores', () => {
  const week = buildMoodWeek([], now);
  assert.equal(week.length, 7);
  assert.equal(week[0].key, '2026-08-21');
  assert.equal(week[6].key, '2026-08-27');
  assert.ok(week.every((day) => day.average === null && day.count === 0));
});

test('weekly mood data preserves gaps, averages multiple check-ins, and excludes outside dates', () => {
  const week = buildMoodWeek([
    { moodValue: 7, createdAt: today },
    { moodValue: 9, createdAt: new Date(2026, 7, 27, 11).toISOString() },
    { moodValue: 5, createdAt: yesterday },
    { moodValue: 1, createdAt: new Date(2026, 7, 20, 23).toISOString() },
    { moodValue: 2, createdAt: new Date(2026, 7, 28, 0).toISOString() },
  ], now);
  assert.equal(week[6].average, 8);
  assert.equal(week[6].count, 2);
  assert.equal(week[5].average, 5);
  assert.equal(week[4].average, null);
  assert.equal(week.reduce((count, day) => count + day.count, 0), 3);
});
