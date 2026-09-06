import test from 'node:test';
import assert from 'node:assert/strict';
import { createTranslator, translate } from '../src/lib/i18n.js';

test('Bangla translations cover core navigation and preserve explicit fallbacks', () => {
  assert.equal(translate('bn', 'nav.mood', 'Journal'), 'জার্নাল');
  assert.equal(translate('bn', 'missing.key', 'Readable fallback'), 'Readable fallback');
  assert.equal(createTranslator('en')('nav.mood', 'Journal'), 'Journal');
});
