import test from 'node:test';
import assert from 'node:assert/strict';
import { BREATHING_EXERCISES, MEDITATION_SESSIONS, createSessionClock, formatSessionTime, getBreathingFrame, getMeditationFrame, meditationDuration } from '../src/lib/wellness.js';

test('all breathing presets complete whole cycles in the offered durations', () => {
  assert.equal(new Set(BREATHING_EXERCISES.map((item) => item.id)).size, BREATHING_EXERCISES.length);
  for (const exercise of BREATHING_EXERCISES) {
    assert.deepEqual(exercise.phases.map((phase) => phase.direction), ['in', 'out']);
    const cycleSeconds = exercise.phases.reduce((sum, phase) => sum + phase.seconds, 0);
    for (const seconds of [60, 180, 300]) assert.equal(seconds % cycleSeconds, 0);
  }
});

test('breathing switches precisely at phase boundaries and resets each cycle', () => {
  const practice = BREATHING_EXERCISES[0];
  const initial = getBreathingFrame(practice, 0);
  assert.equal(initial.direction, 'in');
  assert.equal(initial.remainingMs, 3000);
  assert.equal(initial.scale, 0.76);
  assert.equal(getBreathingFrame(practice, 2999).direction, 'in');
  const out = getBreathingFrame(practice, 3000);
  assert.equal(out.direction, 'out');
  assert.equal(out.scale, 1);
  assert.notEqual(out.key, initial.key);
  const next = getBreathingFrame(practice, 6000);
  assert.equal(next.direction, 'in');
  assert.equal(next.cycle, 2);
  assert.notEqual(next.key, initial.key);
});

test('all meditation sessions have valid, contiguous, timed written guidance', () => {
  assert.deepEqual(MEDITATION_SESSIONS.map(meditationDuration), [180, 300, 480]);
  assert.equal(new Set(MEDITATION_SESSIONS.map((item) => item.id)).size, MEDITATION_SESSIONS.length);
  for (const practice of MEDITATION_SESSIONS) {
    let startMs = 0;
    practice.steps.forEach((step, index) => {
      assert.ok(step.seconds > 0 && step.title && step.text);
      assert.equal(getMeditationFrame(practice, startMs).index, index);
      assert.equal(getMeditationFrame(practice, startMs + step.seconds * 1000 - 1).index, index);
      startMs += step.seconds * 1000;
    });
    const final = getMeditationFrame(practice, startMs + 5000);
    assert.equal(final.index, practice.steps.length - 1);
    assert.equal(final.remainingMs, 0);
  }
});

test('session clock starts, pauses without losing time, and resumes', () => {
  let now = 0;
  const clock = createSessionClock(60000, () => now);
  assert.equal(clock.snapshot().status, 'idle');
  assert.equal(clock.start().status, 'running');
  now = 1250;
  assert.equal(clock.pause().elapsedMs, 1250);
  now = 20000;
  assert.equal(clock.snapshot().elapsedMs, 1250);
  assert.equal(clock.start().status, 'running');
  now = 21750;
  assert.equal(clock.snapshot().elapsedMs, 3000);
  assert.equal(clock.snapshot().remainingMs, 57000);
});

test('double start does not restart and delayed ticks do not cause timer drift', () => {
  let now = 100;
  const clock = createSessionClock(60000, () => now);
  clock.start();
  now = 5000;
  clock.start();
  now = 18123;
  assert.equal(clock.snapshot().elapsedMs, 18023);
});

test('completion is clamped, stable, and cannot be resumed without resetting', () => {
  let now = 0;
  const clock = createSessionClock(60000, () => now);
  clock.start();
  now = 67000;
  assert.deepEqual(clock.snapshot(), { status: 'completed', elapsedMs: 60000, durationMs: 60000, remainingMs: 0 });
  assert.equal(clock.pause().status, 'completed');
  assert.equal(clock.start().status, 'completed');
  assert.equal(clock.reset().status, 'idle');
  assert.equal(clock.snapshot().elapsedMs, 0);
  assert.equal(clock.start().status, 'running');
  now = 68000;
  assert.equal(clock.snapshot().elapsedMs, 1000);
});

test('reset stops active and paused practices without carrying elapsed time', () => {
  let now = 0;
  const clock = createSessionClock(60000, () => now);
  clock.start();
  now = 5000;
  clock.reset();
  now = 8000;
  assert.equal(clock.snapshot().elapsedMs, 0);
  clock.start();
  now = 10000;
  clock.pause();
  assert.equal(clock.reset().remainingMs, 60000);
  assert.equal(clock.pause().status, 'idle');
});

test('invalid session durations are rejected and time formatting never goes negative', () => {
  for (const value of [0, -1, NaN, Infinity, undefined]) assert.throws(() => createSessionClock(value), RangeError);
  assert.equal(formatSessionTime(180000), '3:00');
  assert.equal(formatSessionTime(59001), '1:00');
  assert.equal(formatSessionTime(999), '0:01');
  assert.equal(formatSessionTime(-1), '0:00');
  assert.equal(formatSessionTime(1250, 'down'), '0:01');
  assert.equal(formatSessionTime(60000 - 1250), '0:59');
});
