import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBodySignalPatterns } from '../src/lib/bodySignals.js';

test('body signal patterns stay empty while observations are too sparse', () => {
  const result = buildBodySignalPatterns([
    { sensations: ['tight'], emotion: 'uneasy', bodyAreas: ['chest'] },
    { sensations: ['warm'], emotion: 'calm', bodyAreas: ['head'] },
  ]);

  assert.equal(result.sampleSize, 2);
  assert.deepEqual(result.observations, []);
});

test('body signal patterns describe repeated mood, context, and area links', () => {
  const result = buildBodySignalPatterns([
    { sensations: ['tight'], emotion: 'uneasy', trigger: 'work-study', bodyAreas: ['chest'] },
    { sensations: ['tight'], emotion: 'uneasy', trigger: 'work-study', bodyAreas: ['chest'] },
    { sensations: ['tight'], emotion: 'calm', trigger: 'rest', bodyAreas: ['shoulders'] },
  ]);

  assert.equal(result.sampleSize, 3);
  assert.match(result.observations[0].statement, /Tight showed up with uneasy in 2 of 3 tight logs/);
  assert.match(result.observations[1].statement, /Tight appeared 2 times around work or study/);
  assert.match(result.observations[2].statement, /Chest was the most repeated area/);
});
