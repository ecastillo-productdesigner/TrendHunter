import test from 'node:test';
import assert from 'node:assert/strict';
import { closeBadgeDialog } from '../site/badge-dialog-motion.js';

function fixture(reduced = false) {
  let finish;
  const animation = { finished: new Promise(resolve => { finish = resolve; }), cancel() {} };
  const dialog = {
    open: true, dataset: {}, closes: 0,
    ownerDocument: { defaultView: { matchMedia: () => ({ matches: reduced }), getComputedStyle: () => ({ getPropertyValue: () => '600ms' }) } },
    getAnimations: () => [],
    animate(frames, options) { this.frames = frames; this.options = options; return animation; },
    close() { this.open = false; this.closes++; },
  };
  return { dialog, finish };
}
test('dismissal waits for the reversed opening flip and repeated close requests share it', async () => {
  const { dialog, finish } = fixture();
  const first = closeBadgeDialog(dialog), second = closeBadgeDialog(dialog);
  assert.equal(first, second); assert.equal(dialog.open, true); assert.equal(dialog.dataset.closing, 'true');
  assert.equal(dialog.options.duration, 300);
  assert.equal(dialog.frames.at(-1).transform, 'perspective(960px) rotateY(-90deg)');
  finish(); await first;
  assert.equal(dialog.open, false); assert.equal(dialog.closes, 1); assert.equal(dialog.dataset.closing, undefined);
});
test('reduced motion closes immediately', async () => {
  const { dialog } = fixture(true);
  await closeBadgeDialog(dialog);
  assert.equal(dialog.open, false); assert.equal(dialog.frames, undefined);
});
