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
