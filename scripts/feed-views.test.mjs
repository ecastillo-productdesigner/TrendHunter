import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { feedViews, resolveFeedView } from '../site/feed-view-state.js';
import { changingCollectionUpdates } from '../site/changing-collections.js';
import { COLLECTIONS } from '../site/collection-data.js';
import { COLLECTION_STORIES } from '../site/collection-story-data.js';

test('changing collection panels cover the catalog and link only to their own stories', () => {
  const updates = changingCollectionUpdates();
  assert.equal(updates.length, COLLECTIONS.length);
  assert.equal(new Set(updates.map(collection => collection.href)).size, updates.length);
  assert.ok(updates.some(collection => collection.direction === 'falling'));
  for (const collection of updates) {
    assert.ok(collection.stories.length > 0 && collection.stories.length <= 3);
    assert.equal(new Set(collection.stories.map(story => story.href)).size, collection.stories.length);
    for (const story of [...collection.stories, ...collection.moreStories]) {
      assert.ok(story.collections.includes(collection.href), `${story.href} does not belong to ${collection.href}`);
      assert.ok(COLLECTION_STORIES.some(original => original.href === story.href));
    }
  }
  assert.ok(updates.some(collection => collection.moreStories.length));
  assert.ok(updates.some(collection => !collection.moreStories.length));
});

test('public tabs expose Discover and What’s Changing while private feeds require sign-in', () => {
  assert.deepEqual(Object.values(feedViews(false)), ['Discover', 'What’s Changing']);
  assert.deepEqual(Object.values(feedViews(true)), ['For You', 'Collections', 'Following', 'What’s Changing']);
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
