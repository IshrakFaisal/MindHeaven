import test from 'node:test';
import assert from 'node:assert/strict';
import { APP_NAV_ITEMS, FEATURE_AREAS } from '../src/features/catalog.js';

test('the frontend is organized into eleven cohesive top-level feature areas', () => {
  assert.equal(FEATURE_AREAS.length, 11);
  assert.deepEqual(FEATURE_AREAS.map((feature) => feature.id), [
    'public-experience',
    'account-privacy',
    'today-check-in',
    'mood-journal-context',
    'body-signals',
    'sleep',
    'medication',
    'insights-reports-sharing',
    'care-toolkit',
    'wellness',
    'platform-foundation',
  ]);
});

test('navigation identifiers and labels retain their established contract', () => {
  assert.deepEqual(APP_NAV_ITEMS.map(({ id, label }) => [id, label]), [
    ['overview', 'Today'],
    ['mood', 'Journal'],
    ['symptoms', 'Body signals'],
    ['sleep', 'Sleep'],
    ['medications', 'Medication'],
    ['reports', 'Insights'],
    ['wellness', 'Wellness'],
    ['care', 'Care toolkit'],
    ['profile', 'Privacy & profile'],
  ]);
});
