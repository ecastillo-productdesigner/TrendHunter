import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { TOPIC_STORAGE_KEY, readSelectedTopics, saveSelectedTopics, personalizeStorySlots } from '../site/feed-personalization.js';
import { feedPreferenceStorage, readFeedPreferences, GUEST_TOPIC_STORAGE_KEY, GUEST_FEEDBACK_STORAGE_KEY } from '../site/feed-preferences.js';
import { guestFeedOrder } from '../site/guest-feed-order.js';

const html = await readFile(new URL('../site/feed.html', import.meta.url), 'utf8');
const stories = [...html.matchAll(/<article class="trend-card trend-card--editorial"[^>]*data-topics="([^"]+)"[^>]*>([\s\S]*?)<\/article>/g)]
  .map(([, tags, body]) => ({ topics: tags.split(' '), href: body.match(/class="trend-card-title-link" href="([^"]+)"/)[1] }));
const topicsFor = item => item.topics ?? null;

test('travel and fitness interests prioritize matching real feed stories without losing others', () => {
  assert.equal(stories.length, 19);
  assert.equal(personalizeStorySlots(stories, ['travel'], topicsFor)[0].href, 'trend-travel-advisors.html');
  const fitness = personalizeStorySlots(stories, ['fitness'], topicsFor);
  assert.deepEqual(fitness.slice(0, 2).map(story => story.href), ['trend-weekend-walking.html', 'trend-weighted-walking.html']);
  assert.equal(new Set(fitness).size, 19);
  assert.deepEqual(personalizeStorySlots(stories, ['books'], topicsFor), stories);
});

test('multiple interests reward stronger matches while preserving ties and discovery module positions', () => {
  const answers = { module: 'answers' };
  const picker = { module: 'topics' };
  const items = [...stories.slice(0, 15), answers, ...stories.slice(15, 18), picker, stories[18]];
  const ranked = personalizeStorySlots(items, ['tech', 'wellness'], topicsFor);
  assert.deepEqual(ranked.slice(0, 2).map(story => story.href), ['trend-teen-phone-sleep.html', 'trend-sleep-earbuds.html']);
  assert.equal(ranked[15], answers);
  assert.equal(ranked[19], picker);
  assert.equal(ranked.slice(16, 19).length, 3);
  assert.deepEqual(items.slice(0, 15), stories.slice(0, 15), 'sorting must not mutate the original order');
});

test('saved preferences round-trip and ignore duplicates, unknown values and malformed storage', () => {
  let value;
  const storage = { getItem: key => { assert.equal(key, TOPIC_STORAGE_KEY); return value; }, setItem: (key, next) => { assert.equal(key, TOPIC_STORAGE_KEY); value = next; } };
  assert.deepEqual(saveSelectedTopics(['travel', 'travel', 'unknown', 'fitness'], storage), ['travel', 'fitness']);
  assert.deepEqual(readSelectedTopics(storage), ['travel', 'fitness']);
  for (const invalid of ['bad json', '{}', 'null']) { value = invalid; assert.deepEqual(readSelectedTopics(storage), []); }
});

test('a blocked preference write reports failure so the UI can avoid a false success', () => {
  assert.equal(saveSelectedTopics(['travel'], { setItem() { throw new Error('Blocked'); } }), null);
});

const { readRecommendationFeedback, saveRecommendationFeedback, resetRecommendationFeedback, rankRecommendationSlots, placeRecommendations } = await import('../site/recommendation-feedback.js');

test('recommendation feedback persists independently and hiding a story can be undone', () => {
  let value = '{}';
  const storage = { getItem: () => value, setItem: (_, next) => { value = next; } };
  saveRecommendationFeedback('trend.html', 'collection-longevity.html', 'more', storage);
  saveRecommendationFeedback('trend.html', 'collection-longevity.html', 'less', storage);
  assert.deepEqual(readRecommendationFeedback(storage), { hiddenStories: ['trend.html'], preferredCollections: [] });
  saveRecommendationFeedback('trend.html', 'collection-longevity.html', 'undo', storage);
  assert.deepEqual(readRecommendationFeedback(storage).hiddenStories, []);
  assert.equal(saveRecommendationFeedback('https://example.com', 'collection.html', 'more', storage), null);
  assert.equal(saveRecommendationFeedback('trend.html', 'collection.html', 'more', { getItem: () => '{}', setItem() { throw Error('Blocked'); } }), null);
});

test('either thumb toggles off on a second click and reset clears feedback only', () => {
  const values = new Map();
  const storage = { getItem:key=>values.get(key), setItem:(key,value)=>values.set(key,value), removeItem:key=>values.delete(key) };
  storage.setItem('trendhunter.selected-topics.v1', '["travel"]');
  for (const action of ['more','less']) {
    saveRecommendationFeedback('trend.html','collection-longevity.html',action,storage);
    saveRecommendationFeedback('trend.html','collection-longevity.html',action,storage);
    assert.deepEqual(readRecommendationFeedback(storage),{ hiddenStories:[],preferredCollections:[] });
  }
  saveRecommendationFeedback('trend.html','collection-longevity.html','less',storage);
  assert.equal(resetRecommendationFeedback(storage),true);
  assert.deepEqual(readRecommendationFeedback(storage),{ hiddenStories:[],preferredCollections:[] });
  assert.equal(storage.getItem('trendhunter.selected-topics.v1'),'["travel"]');
  assert.equal(resetRecommendationFeedback({ removeItem() { throw Error('Blocked'); } }),false);
});

test('more-like-this prioritizes the selected collection while preserving discovery slots and ties', () => {
  const items = [{ id: 'a', collection: 'one.html' }, { module: 'answers' }, { id: 'b', collection: 'two.html' }, { id: 'c', collection: 'two.html' }];
  const ranked = rankRecommendationSlots(items, { preferredCollections: ['two.html'] }, item => item.collection ?? null);
  assert.deepEqual(ranked.map(item => item.id || item.module), ['b', 'answers', 'c', 'a']);
  assert.equal(ranked[1], items[1]);
  assert.equal(new Set(ranked).size, items.length);
  assert.deepEqual(items.map(item => item.id || item.module), ['a', 'answers', 'b', 'c']);
});
test('recommendations follow the first three stories while discovery modules keep their slots', () => {
  const stories=Array.from({length:10},(_,i)=>({story:`${i}.html`,recommended:i===0||i===4}));
  const module={module:true};
  const items=[...stories.slice(0,3),module,...stories.slice(3)];
  const ranked=placeRecommendations(items,item=>item.module?null:item);
  assert.equal(ranked[3],module);
  const rankedStories=ranked.filter(item=>!item.module);
  assert.equal(rankedStories.slice(0,3).some(item=>item.recommended),false);
  assert.deepEqual(rankedStories.map((item,index)=>item.recommended?index:null).filter(index=>index!==null),[3,8]);
  assert.equal(new Set(ranked).size,items.length);
});

test('home and family interests rank matching catalogue stories in existing slots', () => {
  assert.equal(personalizeStorySlots(stories, ['home-living'], topicsFor)[0].href, 'trend-whole-house-water.html');
  assert.equal(personalizeStorySlots(stories, ['family-parenting'], topicsFor)[0].href, 'trend-school-routines.html');
});

const memoryStorage = () => {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
};
test('signing out excludes account interests and feedback without deleting them', () => {
  const stores = { member: memoryStorage(), guest: memoryStorage() };
  const account = feedPreferenceStorage(true, stores);
  saveSelectedTopics(['travel'], account);
  saveRecommendationFeedback('trend.html', 'collection-longevity.html', 'less', account);
  assert.deepEqual(readFeedPreferences(false, stores), { topics: [], feedback: { hiddenStories: [], preferredCollections: [] } });
  const member = readFeedPreferences(true, stores);
  assert.deepEqual(member.topics, ['travel']);
  assert.deepEqual(member.feedback.hiddenStories, ['trend.html']);
  assert.deepEqual(readFeedPreferences(false, stores).topics, []);
  assert.deepEqual(readFeedPreferences(true, stores), member, 'signing back in restores the same account choices');
});
test('explicit guest choices persist for the visit and cannot overwrite account preferences', () => {
  const stores = { member: memoryStorage(), guest: memoryStorage() };
  saveSelectedTopics(['travel'], feedPreferenceStorage(true, stores));
  saveRecommendationFeedback('member.html', 'collection-longevity.html', 'more', feedPreferenceStorage(true, stores));
  const before = readFeedPreferences(true, stores);
  const guest = feedPreferenceStorage(false, stores);
  saveSelectedTopics(['fitness'], guest);
  saveRecommendationFeedback('guest.html', 'collection-peptides.html', 'less', guest);
  assert.deepEqual(readFeedPreferences(false, stores).topics, ['fitness']);
  assert.deepEqual(readFeedPreferences(false, stores).feedback.hiddenStories, ['guest.html']);
  assert.ok(stores.guest.getItem(GUEST_TOPIC_STORAGE_KEY));
  assert.ok(stores.guest.getItem(GUEST_FEEDBACK_STORAGE_KEY));
  assert.equal(stores.guest.getItem(TOPIC_STORAGE_KEY), null);
  resetRecommendationFeedback(guest);
  saveSelectedTopics([], guest);
  assert.deepEqual(readFeedPreferences(true, stores), before);
  assert.deepEqual(readFeedPreferences(false, { ...stores, guest: memoryStorage() }).topics, []);
});
test('blocked guest storage falls back to public discovery rather than account preferences', () => {
  const member = memoryStorage();
  saveSelectedTopics(['travel'], member);
  const guest = { getItem() { throw Error('Blocked'); } };
  assert.deepEqual(readFeedPreferences(false, { member, guest }), { topics: [], feedback: { hiddenStories: [], preferredCollections: [] } });
});
test('guest feed leads with stories, collections, optional topics, video, predictions, then writers', () => {
  const stories = Array.from({ length: 19 }, (_, i) => ({ kind: 'story', id: i }));
  const modules = ['complete', 'writers', 'other', 'videos', 'predictions', 'topics', 'collections', 'account'].map(kind => ({ kind }));
  const items = [...modules, ...stories];
  const result = guestFeedOrder(items, item => item.kind);
  assert.deepEqual(result.slice(0, 5), [...stories.slice(0, 3), modules[6], modules[5]]);
  assert.ok(result.indexOf(modules[3]) < result.indexOf(modules[4]));
  assert.ok(result.indexOf(modules[4]) < result.indexOf(modules[1]));
  assert.ok(result.indexOf(modules[1]) < result.indexOf(modules[7]));
  assert.equal(result.at(-1), modules[0]);
  assert.equal(new Set(result).size, items.length, 'live modules must appear exactly once');
  assert.deepEqual(result.filter(item => item.kind === 'story'), stories);
  assert.deepEqual(items.slice(0, modules.length), modules, 'signed-in ordering input is not mutated');
});
