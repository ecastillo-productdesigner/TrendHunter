import test from 'node:test';
import { collectionUpdatePreviewPending, showCollectionUpdatesPreview, dismissCollectionUpdatesPreview } from '../site/collection-update-state.js';
import assert from 'node:assert/strict';
import { FOLLOWED_COLLECTIONS_KEY, readFollowedCollections, setCollectionFollowed, recommendedCollections } from '../site/collection-follow-state.js';

const memoryStorage = () => {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
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
import { COLLECTION_CARDS_SEEN_KEY, unseenCollectionCards, markCollectionCardSeen } from '../site/collection-update-state.js';
import { readFile } from 'node:fs/promises';

test('seeing a card persists without claiming the article was read or clearing offscreen stories', () => {
  const storage = memoryStorage();
  const fresh = unreadCollectionStories(storage, beauty);
  assert.equal(markCollectionCardSeen(storage, fresh[0]), true);
  assert.deepEqual(unseenCollectionCards(storage, fresh), fresh.slice(1));
  assert.deepEqual(unreadCollectionStories(storage, beauty), fresh);
  assert.equal(markCollectionCardSeen(storage, 'unknown.html'), false);
  storage.setItem(COLLECTION_CARDS_SEEN_KEY, '{bad json');
  assert.equal(markCollectionCardSeen(storage, fresh[1]), true);
  assert.deepEqual(unseenCollectionCards(storage, fresh), [fresh[0],fresh[2]]);
  const blocked = { getItem:()=>null, setItem() { throw Error('Blocked'); } };
  assert.equal(markCollectionCardSeen(blocked, fresh[0]), false);
});

test('each collection detail lists its complete story membership, including article-primary assignments', async () => {
  for (const collection of COLLECTIONS) {
    const page = await readFile(new URL(`../site/${collection.href}`,import.meta.url),'utf8');
    const section = page.match(/<section class="collection-trends"[\s\S]*?<\/section>/)[0];
    const listed = [...section.matchAll(/href="(trend[^"]*\.html)"/g)].map(match => match[1]);
    const expected = COLLECTION_STORIES.filter(story => story.collections.includes(collection.href)).map(story => story.href);
    assert.deepEqual(listed.sort(), expected.sort(), collection.name);
    assert.equal(new Set(listed).size, listed.length);
  }
  for (const story of COLLECTION_STORIES) {
    const page = await readFile(new URL(`../site/${story.href}`,import.meta.url),'utf8');
    const primary = page.match(/<a href="([^"]+)" class="article-collection"/);
    if (primary) assert.ok(story.collections.includes(primary[1]), story.href);
  }
});
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

test('manual Collections dot preview can be dismissed without changing real update history or follows', () => {
  const storage = memoryStorage();
  setCollectionFollowed(storage,beauty,true);
  const unread = unreadCollectionStories(storage,beauty);
  acknowledgeCollectionUpdates(storage,unread);
  const followed = readFollowedCollections(storage);
  assert.equal(collectionUpdatePreviewPending(storage),false);
  assert.equal(showCollectionUpdatesPreview(storage),true);
  assert.equal(collectionUpdatePreviewPending(storage),true);
  assert.deepEqual(unnoticedCollectionStories(storage,unread),[]);
  assert.deepEqual(readFollowedCollections(storage),followed);
  assert.equal(dismissCollectionUpdatesPreview(storage),true);
  assert.equal(collectionUpdatePreviewPending(storage),false);
  assert.deepEqual(unreadCollectionStories(storage,beauty),unread);
});
