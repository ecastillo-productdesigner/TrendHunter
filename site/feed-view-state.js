// Account-specific labels share the existing feed routes and their saved state.
export function feedViews(signedIn) {
  return signedIn
    ? { 'for-you': 'For You', collections: 'Collections', following: 'Following', moving: 'Moving' }
    : { 'for-you': 'Discover', moving: 'Movers' };
}

export function resolveFeedView(value, signedIn) {
  const aliases = { discover: 'for-you', feed: 'for-you', movers: 'moving', 'trending-up': 'moving', 'trending-down': 'moving' };
  const view = aliases[value] || value;
  return Object.hasOwn(feedViews(signedIn), view) ? view : 'for-you';
}
