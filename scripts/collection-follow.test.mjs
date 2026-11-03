import test from 'node:test';
import assert from 'node:assert/strict';
import { FOLLOWED_COLLECTIONS_KEY, readFollowedCollections, setCollectionFollowed, recommendedCollections } from '../site/collection-follow-state.js';

const memoryStorage = () => {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
};
const beauty = 'collection-evidence-based-beauty.html';
const longevity = 'collection-longevity.html';

test('follow persists, duplicate follow is idempotent, and unfollow returns to empty', () => {
  const storage = memoryStorage();
  assert.deepEqual(readFollowedCollections(storage), []);
  assert.deepEqual(setCollectionFollowed(storage, beauty, true), [beauty]);
  assert.deepEqual(readFollowedCollections(storage), [beauty]);
  assert.deepEqual(setCollectionFollowed(storage, beauty, true), [beauty]);
  assert.deepEqual(setCollectionFollowed(storage, longevity, true), [beauty, longevity]);
  setCollectionFollowed(storage, beauty, false);
  assert.deepEqual(readFollowedCollections(storage), [longevity]);
  setCollectionFollowed(storage, longevity, false);
  assert.deepEqual(readFollowedCollections(storage), []);
});
test('malformed or unknown stored identities cannot populate the followed list', () => {
  const storage = memoryStorage();
  storage.setItem(FOLLOWED_COLLECTIONS_KEY, '{bad json');
  assert.deepEqual(readFollowedCollections(storage), []);
  storage.setItem(FOLLOWED_COLLECTIONS_KEY, JSON.stringify([beauty, beauty, 'https://other.example', null]));
  assert.deepEqual(readFollowedCollections(storage), [beauty]);
  assert.equal(setCollectionFollowed(storage, 'unknown.html', true), null);
});
test('recommendations use the feed choices, exclude followed collections and refill to four', () => {
  assert.deepEqual(recommendedCollections([]).map(c => c.href), [beauty, 'collection-back-to-school-transitions.html', longevity, 'collection-peptides.html']);
  const recommendations = recommendedCollections([beauty, longevity]);
  assert.equal(recommendations.length, 4);
  assert.equal(recommendations.some(c => [beauty, longevity].includes(c.href)), false);
});
test('a failed save does not claim a collection was followed', () => {
  const storage = { getItem: () => '[]', setItem() { throw new Error('Storage unavailable'); } };
  assert.equal(setCollectionFollowed(storage, beauty, true), null);
  assert.deepEqual(readFollowedCollections(storage), []);
});
