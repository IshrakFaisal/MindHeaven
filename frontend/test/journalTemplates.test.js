import test from 'node:test';
import assert from 'node:assert/strict';
import { applyJournalTemplate, JOURNAL_TEMPLATES } from '../src/features/journal/journalTemplates.js';

test('journal templates add structure without overwriting mood or context', () => {
  const form = { moodValue: 4, moodType: 'emoji', tags: 'work', title: '', note: '' };
  const result = applyJournalTemplate('difficult-moment', form);
  assert.equal(result.moodValue, 4);
  assert.equal(result.tags, 'work');
  assert.match(result.note, /What happened/);
  assert.equal(JOURNAL_TEMPLATES.length, 5);
});
