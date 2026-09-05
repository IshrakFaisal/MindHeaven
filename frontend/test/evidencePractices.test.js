import test from 'node:test';
import assert from 'node:assert/strict';
import { EVIDENCE_PRACTICES } from '../src/features/care/evidencePractices.js';

test('care practices disclose a source and keep instructions concise', () => {
  assert.equal(EVIDENCE_PRACTICES.length, 3);
  EVIDENCE_PRACTICES.forEach((practice) => {
    assert.match(practice.sourceUrl, /^https:\/\//);
    assert.ok(practice.steps.length >= 3);
    assert.ok(practice.steps.every((step) => step.length < 180));
  });
});
