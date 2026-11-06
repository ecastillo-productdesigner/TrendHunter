import { COLLECTIONS } from './collection-data.js';

// Curated public follow events for fictional community profiles. They do not expose the
// visitor's collection follows, bookmarks, or any private account activity.
const publicFollows = new Map([
  ['jamie-park', 'collection-evidence-based-beauty.html'],
  ['morgan-lee', 'collection-clean-living-control.html'],
  ['alex-rivera', 'collection-retailtainment-hubs.html'],
  ['taylor-brooks', 'collection-longevity.html'],
  ['quinn-ellis', 'collection-evidence-based-beauty.html'],
  ['casey-reed', 'collection-longevity.html'],
  ['riley-chen', 'collection-evidence-based-beauty.html'],
]);

export function collectionFollowActivity(personId) {
  const collection = COLLECTIONS.find(value => value.href === publicFollows.get(personId));
  return collection ? { id: `${personId}:followed:${collection.href}`, collection } : null;
}

export function interleaveCollectionFollows(activity, follows) {
  const remaining = follows.slice(0, 3);
  const rows = activity.flatMap((row, index) => {
    const follow = index >= 1 && (index - 1) % 4 === 0 ? remaining.shift() : null;
    return follow ? [row, follow] : [row];
  });
  // A person with little other public activity can still surface one follow.
  if (remaining.length === follows.slice(0, 3).length && remaining.length) rows.push(remaining[0]);
  return rows;
}
