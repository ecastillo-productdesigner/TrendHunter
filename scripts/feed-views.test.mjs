import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { feedViews, resolveFeedView } from '../site/feed-view-state.js';

test('public tabs expose Discover and Movers while private feeds require sign-in', () => {
  assert.deepEqual(Object.values(feedViews(false)), ['Discover', 'Movers']);
  assert.deepEqual(Object.values(feedViews(true)), ['For You', 'Collections', 'Following', 'Moving']);
  for (const view of ['collections', 'following']) {
    assert.equal(resolveFeedView(view, false), 'for-you');
    assert.equal(resolveFeedView(view, true), view);
  }
  assert.equal(resolveFeedView('trending', false), 'for-you');
  assert.equal(resolveFeedView('trending', true), 'for-you');
});

test('public and legacy route aliases resolve without creating duplicate view state', () => {
  for (const signedIn of [false, true]) {
    for (const value of ['discover', 'feed', 'for-you', 'unknown', '']) assert.equal(resolveFeedView(value, signedIn), 'for-you');
    for (const value of ['moving', 'movers', 'trending-up', 'trending-down']) assert.equal(resolveFeedView(value, signedIn), 'moving');
  }
});

test('active CTA hides at zero, returns with a valid call and hides again after reset', async () => {
  const source = await readFile(new URL('../site/open-predictions.js', import.meta.url), 'utf8');
  const link = { hidden: false };
  const label = { textContent: '', closest: () => link };
  let calls = {};
  const listeners = new Map();
  vm.runInNewContext(source, {
    CALLS_KEY: 'calls',
    openPredictionList: () => [{ id: 'sample' }],
    sessionStorage: { getItem: () => JSON.stringify(calls) },
    window: { addEventListener: (name, cb) => listeners.set(name, cb) },
    document: { querySelector: () => null, querySelectorAll: () => [label], addEventListener: (name, cb) => listeners.set(name, cb) },
  });
  assert.equal(link.hidden, true);
  calls = { sample: 'skip' };
  listeners.get('prediction-call')();
  assert.equal(link.hidden, true);
  calls = { sample: 'out' };
  listeners.get('prediction-call')();
  assert.equal(link.hidden, false);
  assert.equal(label.textContent, '(1)');
  calls = {};
  listeners.get('pageshow')();
  assert.equal(link.hidden, true);
});
