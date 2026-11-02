import test from 'node:test';
import assert from 'node:assert/strict';
import { shareWithSystem } from '../site/system-share.js';

const data = { title: 'A Trend Hunter story', url: 'https://example.test/story.html' };

test('native sharing is invoked immediately with the exact story data', async () => {
  let invoked = false;
  const pending = shareWithSystem(data, {
    canShare: value => { assert.equal(value, data); return true; },
    share: value => { invoked = true; assert.equal(value, data); return Promise.resolve(); },
  });
  assert.equal(invoked, true, 'the API must run within the original user gesture');
  assert.equal(await pending, 'shared');
});

test('unsupported sharing falls back without attempting a native call', async () => {
  assert.equal(await shareWithSystem(data, {}), 'unavailable');
  assert.equal(await shareWithSystem(data, {
    canShare: () => false,
    share: () => assert.fail('unsupported content must not be shared'),
  }), 'unavailable');
});

test('cancelling native sharing does not open the fallback', async () => {
  assert.equal(await shareWithSystem(data, {
    share: () => Promise.reject(Object.assign(new Error('Cancelled'), { name: 'AbortError' })),
  }), 'cancelled');
});

test('a rejected or blocked share uses the fallback', async () => {
  for (const name of ['NotAllowedError', 'DataError', 'TypeError']) {
    assert.equal(await shareWithSystem(data, {
      share: () => Promise.reject(Object.assign(new Error(name), { name })),
    }), 'unavailable');
  }
});
