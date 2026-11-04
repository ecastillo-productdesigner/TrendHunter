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

import { COLLECTION_READ_KEY, unreadCollectionStories, markCollectionStoryViewed } from '../site/collection-update-state.js';
import { interestLevel } from '../site/collection-data.js';

test('collection update counts clear one viewed story at a time and do not affect other collections', () => {
  const storage = memoryStorage();
  const original = unreadCollectionStories(storage, beauty);
  assert.equal(original.length, 3);
  assert.equal(unreadCollectionStories(storage, longevity).length, 0);
  assert.equal(markCollectionStoryViewed(storage, original[0]), true);
  assert.equal(unreadCollectionStories(storage, beauty).length, 2);
  assert.equal(markCollectionStoryViewed(storage, original[0]), true);
  assert.equal(unreadCollectionStories(storage, beauty).length, 2);
  original.slice(1).forEach(href => markCollectionStoryViewed(storage, href));
  assert.deepEqual(unreadCollectionStories(storage, beauty), []);
  assert.equal(unreadCollectionStories(storage, 'collection-retailtainment-hubs.html').length, 2);
  assert.equal(markCollectionStoryViewed(storage, 'unknown.html'), false);
});
test('invalid unread storage and failed writes retain a usable update state', () => {
  const storage = memoryStorage();
  storage.setItem(COLLECTION_READ_KEY, '{bad json');
  assert.equal(unreadCollectionStories(storage, beauty).length, 3);
  const unavailable = { getItem: () => '[]', setItem() { throw new Error('Storage unavailable'); } };
  assert.equal(markCollectionStoryViewed(unavailable, 'trend-skin-longevity.html'), false);
  assert.equal(unreadCollectionStories(unavailable, beauty).length, 3);
});
test('chevron illumination follows quarter thresholds including boundaries and clamping', () => {
  for (const [value, expected] of [[-1,1],[0,1],[25,1],[25.1,2],[50,2],[50.1,3],[75,3],[75.1,4],[100,4],[200,4],['bad',1]]) {
    assert.equal(interestLevel(value), expected);
  }
});

import { unnoticedCollectionStories, acknowledgeCollectionUpdates } from '../site/collection-update-state.js';
import { COLLECTION_STORIES } from '../site/collection-story-data.js';
import { COLLECTIONS } from '../site/collection-data.js';
import { followedStoryList } from '../site/followed-story-filter.js';
test('opening Collections clears the dot without clearing unread stories, and later releases can signal again', () => {
  const storage = memoryStorage();
  const unread = unreadCollectionStories(storage, beauty);
  assert.equal(unnoticedCollectionStories(storage, unread).length, 3);
  assert.equal(acknowledgeCollectionUpdates(storage, unread), true);
  assert.deepEqual(unnoticedCollectionStories(storage, unread), []);
  assert.equal(unreadCollectionStories(storage, beauty).length, 3);
  assert.equal(unnoticedCollectionStories(storage, [...unread, 'trend-retailtainment.html']).length, 1);
});
test('All deduplicates stories and the followed collection filter excludes unrelated memberships', () => {
  const followed = [beauty, 'collection-back-to-school-transitions.html'];
  const all = followedStoryList(COLLECTION_STORIES, followed);
  assert.equal(new Set(all.map(story => story.href)).size, all.length);
  assert.equal(all.every(story => story.collections.some(href => followed.includes(href))), true);
  const school = followedStoryList(COLLECTION_STORIES, followed, followed[1]);
  assert.equal(school.length, 4);
  assert.equal(school.every(story => story.collections.includes(followed[1]) && story.collectionHref === followed[1]), true);
  assert.deepEqual(followedStoryList(COLLECTION_STORIES, followed, 'collection-retailtainment-hubs.html'), []);
  const ranked = followedStoryList(COLLECTION_STORIES, followed, 'all', [school[3].href]);
  assert.equal(ranked[0].href, school[3].href);
  assert.equal(COLLECTIONS.every(collection => COLLECTION_STORIES.some(story => story.collections.includes(collection.href))), true);
});
