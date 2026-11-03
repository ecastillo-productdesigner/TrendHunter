import { COLLECTIONS, RECOMMENDED_COLLECTIONS } from './collection-data.js';

export const FOLLOWED_COLLECTIONS_KEY = 'trendhunter.followed-collections.v1';
const known = new Set(COLLECTIONS.map(collection => collection.href));

export function readFollowedCollections(storage) {
  try {
    const saved = JSON.parse(storage.getItem(FOLLOWED_COLLECTIONS_KEY) || '[]');
    return Array.isArray(saved) ? [...new Set(saved.filter(href => known.has(href)))] : [];
  } catch { return []; }
}

export function setCollectionFollowed(storage, href, following) {
  if (!known.has(href)) return null;
  const previous = readFollowedCollections(storage);
  const next = following
    ? previous.includes(href) ? previous : [...previous, href]
    : previous.filter(value => value !== href);
  try {
    storage.setItem(FOLLOWED_COLLECTIONS_KEY, JSON.stringify(next));
    return next;
  } catch { return null; }
}

export function recommendedCollections(followed, limit = 4) {
  const chosen = new Set(followed);
  const priority = [...RECOMMENDED_COLLECTIONS, ...COLLECTIONS.map(collection => collection.href)];
  return [...new Set(priority)].filter(href => !chosen.has(href)).slice(0, limit)
    .map(href => COLLECTIONS.find(collection => collection.href === href));
}
