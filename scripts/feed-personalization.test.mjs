import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { TOPIC_STORAGE_KEY, readSelectedTopics, saveSelectedTopics, personalizeStorySlots } from '../site/feed-personalization.js';

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
