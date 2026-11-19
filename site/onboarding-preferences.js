import { COLLECTIONS } from './onboarding-data.js?v=three-questions-9';

// Browser-local demo preferences. Separate origins do not share this storage.
export const TOPIC_STORAGE_KEY = 'trendhunter.selected-topics.v1';
export const FOLLOWED_COLLECTIONS_KEY = 'trendhunter.followed-collections.v1';
const topics = new Set(['wellness', 'beauty', 'food-drink', 'fitness', 'home-living', 'tech', 'family-parenting', 'culture', 'travel']);
const collections = new Set(COLLECTIONS.map(collection => collection.href));
function readKnown(storage, key, known) {
  try {
    const values = JSON.parse(storage.getItem(key) || '[]');
    return Array.isArray(values) ? [...new Set(values.filter(value => known.has(value)))] : [];
  } catch { return []; }
}
export const readSelectedTopics = storage => readKnown(storage, TOPIC_STORAGE_KEY, topics);
export const readFollowedCollections = storage => readKnown(storage, FOLLOWED_COLLECTIONS_KEY, collections);
