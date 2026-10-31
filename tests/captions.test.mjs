import { test } from 'node:test';
import assert from 'node:assert/strict';
import { splitCaptions } from '../dashboard/captions.mjs';
test('caption sections copy only their own text and preserve blank lines', () => {
  const result = splitCaptions('====\nINSTAGRAM\n====\n\nFirst line.\n\nSecond line.\n\n----\n\n====\nYOUTUBE\n====\n\nTitle:\nMy title\n\nDescription:\nFirst paragraph.\n\nSecond paragraph.\n');
  assert.deepEqual(result, {instagram:'First line.\n\nSecond line.', title:'My title', description:'First paragraph.\n\nSecond paragraph.', fallback:''});
});
test('unstructured captions stay available rather than disappearing', () => {
  assert.equal(splitCaptions('A simple caption.').fallback, 'A simple caption.');
});
