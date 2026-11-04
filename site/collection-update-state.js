// Fixed sample releases demonstrate occasional updates; these are not live publication events.
// Only followed collections are eligible. Viewed story state is browser-local in this prototype.
export const COLLECTION_READ_KEY = 'trendhunter.collection-stories-viewed.v1';
export const COLLECTION_RELEASES = Object.freeze({
  'collection-evidence-based-beauty.html': ['trend-skin-longevity.html', 'trend-neurocosmetics.html', 'trend-evening-wellness-rituals.html'],
  'collection-retailtainment-hubs.html': ['trend-retailtainment.html', 'trend-gen-z-stores.html'],
  'collection-solo-travel.html': ['trend-travel-advisors.html'],
  'collection-andropause-hormonal-midlife.html': ['trend.html'],
});
const knownStories = new Set(Object.values(COLLECTION_RELEASES).flat());

export function viewedCollectionStories(storage) {
  try {
    const saved = JSON.parse(storage.getItem(COLLECTION_READ_KEY) || '[]');
    return Array.isArray(saved) ? [...new Set(saved.filter(href => knownStories.has(href)))] : [];
  } catch { return []; }
}
export function unreadCollectionStories(storage, collectionHref) {
  const viewed = new Set(viewedCollectionStories(storage));
  return (COLLECTION_RELEASES[collectionHref] || []).filter(href => !viewed.has(href));
}
export function markCollectionStoryViewed(storage, href) {
  if (!knownStories.has(href)) return false;
  try {
    storage.setItem(COLLECTION_READ_KEY, JSON.stringify([...new Set([...viewedCollectionStories(storage), href])]));
    return true;
  } catch { return false; }
}

export const COLLECTION_UPDATES_SEEN_KEY = 'trendhunter.collection-updates-noticed.v1';
export function unnoticedCollectionStories(storage, unreadStories) {
  let seen = [];
  try {
    const saved = JSON.parse(storage.getItem(COLLECTION_UPDATES_SEEN_KEY) || '[]');
    if (Array.isArray(saved)) seen = saved;
  } catch {}
  return [...new Set(unreadStories)].filter(href => !seen.includes(href));
}
export function acknowledgeCollectionUpdates(storage, stories) {
  try {
    const previous = JSON.parse(storage.getItem(COLLECTION_UPDATES_SEEN_KEY) || '[]');
    const next = [...new Set([...(Array.isArray(previous) ? previous : []), ...stories])].filter(href => knownStories.has(href));
    storage.setItem(COLLECTION_UPDATES_SEEN_KEY, JSON.stringify(next));
    return true;
  } catch { return false; }
}
