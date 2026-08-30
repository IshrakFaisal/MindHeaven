import test from 'node:test';
import assert from 'node:assert/strict';
import { downloadBlob } from '../src/lib/download.js';

test('blob downloads keep the established create, click, remove, and revoke sequence', () => {
  const calls = [];
  const link = {
    click: () => calls.push('click'),
    remove: () => calls.push('remove'),
  };
  const originalDocument = globalThis.document;
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;
  globalThis.document = {
    createElement: (tag) => { calls.push(`create:${tag}`); return link; },
    body: { appendChild: () => calls.push('append') },
  };
  URL.createObjectURL = () => { calls.push('url'); return 'blob:test'; };
  URL.revokeObjectURL = (url) => calls.push(`revoke:${url}`);

  try {
    downloadBlob({}, 'report.pdf');
    assert.equal(link.href, 'blob:test');
    assert.equal(link.download, 'report.pdf');
    assert.deepEqual(calls, ['url', 'create:a', 'append', 'click', 'remove', 'revoke:blob:test']);
  } finally {
    globalThis.document = originalDocument;
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  }
});
