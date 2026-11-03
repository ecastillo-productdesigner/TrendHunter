// Illustrative topic metadata ranks the existing demo stories; no account service is connected.
export const TOPIC_STORAGE_KEY = 'trendhunter.selected-topics.v1';
const topicIds = new Set(['beauty', 'books', 'food-drink', 'wellness', 'style', 'tech', 'fitness', 'culture', 'travel']);
const cleanTopics = value => Array.isArray(value) ? [...new Set(value.filter(id => topicIds.has(id)))] : [];

export function readSelectedTopics(storage) {
  try { return cleanTopics(JSON.parse((storage ?? globalThis.localStorage).getItem(TOPIC_STORAGE_KEY) || '[]')); }
  catch { return []; }
}

export function saveSelectedTopics(topics, storage) {
  const clean = cleanTopics(topics);
  try { (storage ?? globalThis.localStorage).setItem(TOPIC_STORAGE_KEY, JSON.stringify(clean)); }
  catch { return null; }
  return clean;
}

// Fill only story slots. Discovery modules, controls and their three-story cadence stay in place.
export function personalizeStorySlots(items, selectedTopics, topicsFor) {
  const selected = new Set(cleanTopics(selectedTopics));
  if (!selected.size) return [...items];
  const stories = items.map((item, index) => ({ item, index, topics: topicsFor(item) }))
    .filter(story => story.topics !== null)
    .map(story => ({ ...story, score: story.topics.filter(topic => selected.has(topic)).length }))
    .sort((a, b) => b.score - a.score || a.index - b.index);
  let next = 0;
  return items.map(item => topicsFor(item) === null ? item : stories[next++].item);
}
