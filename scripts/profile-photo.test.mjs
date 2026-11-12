import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareProfilePhoto } from '../site/profile-photo.js';

function fixture(width, height, encode = () => 'data:image/jpeg;base64,preview') {
  const calls = [];
  const image = { width, height, close: () => calls.push('closed') };
  const context = { fillRect: (...args) => calls.push(['fill', ...args]), drawImage: (...args) => calls.push(['draw', ...args.slice(1)]) };
  const output = { getContext: () => context, toDataURL: (...args) => { calls.push(['encode', ...args]); return encode(); } };
  return { calls, output, options: { decode: async () => image, canvas: () => output } };
}

test('rejects unsupported, oversized, and unreadable files before saving', async () => {
  await assert.rejects(prepareProfilePhoto({ type: 'text/plain', size: 20 }), /Choose a JPG/);
  await assert.rejects(prepareProfilePhoto({ type: 'image/png', size: 10 * 1024 * 1024 + 1 }), /smaller than 10 MB/);
  await assert.rejects(prepareProfilePhoto({ type: 'image/png', size: 20 }, { decode: async () => { throw new Error('bad file'); } }), /could not be opened/);
});

for (const [width, height, crop] of [[1200, 800, [200, 0, 800, 800]], [800, 1200, [0, 200, 800, 800]], [800, 800, [0, 0, 800, 800]]]) {
  test(`centers a ${width}×${height} image in a compact 512px JPEG`, async () => {
    const f = fixture(width, height);
    assert.equal(await prepareProfilePhoto({ type: 'image/png', size: 200 }, f.options), 'data:image/jpeg;base64,preview');
    assert.equal(f.output.width, 512);
    assert.equal(f.output.height, 512);
    assert.deepEqual(f.calls, [ ['fill', 0, 0, 512, 512], ['draw', ...crop, 0, 0, 512, 512], ['encode', 'image/jpeg', .85], 'closed' ]);
  });
}

test('releases decoded image on invalid dimensions or encoding failure', async () => {
  const invalid = fixture(0, 200);
  await assert.rejects(prepareProfilePhoto({ type: 'image/jpeg', size: 20 }, invalid.options), /could not be opened/);
  assert.deepEqual(invalid.calls, ['closed']);
  const failed = fixture(200, 200, () => { throw new Error('encoding failed'); });
  await assert.rejects(prepareProfilePhoto({ type: 'image/webp', size: 20 }, failed.options), /encoding failed/);
  assert.equal(failed.calls.at(-1), 'closed');
});
