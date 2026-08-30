import test from 'node:test';
import assert from 'node:assert/strict';
import { SUPPORT_RESOURCES } from '../src/features/care/supportResources.js';

test('care resources retain the verified Bangladesh contact contract', () => {
  assert.deepEqual(SUPPORT_RESOURCES.map(({ name, number, href }) => ({ name, number, href })), [
    { name: 'National Emergency Service', number: '999', href: 'tel:999' },
    { name: 'Shasthyo Batayon', number: '16263', href: 'tel:16263' },
    { name: 'National Institute of Mental Health', number: '01730 333789', href: 'tel:+8801730333789' },
  ]);
});
