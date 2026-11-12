// Prototype-only blank slate on explicit Log Out. Keep the reader's identity,
// appearance preference and demo access separate from saved activity.
export const ACTIVITY_RESET_KEY = 'trendhunter.activity-reset.v1';
const localKeys = [
  'trendhunter.followed-collections.v1',
  'trendhunter.followed-people.v1',
  'trendhunter.selected-topics.v1',
  'trendhunter.recommendation-feedback.v1',
  'trendhunter.member-achievements.v1',
  'trendhunter.prediction-results-demo.v1',
  'trendhunter.collection-stories-viewed.v1',
  'trendhunter.collection-cards-seen.v1',
  'trendhunter.collection-updates-noticed.v1',
  'trendhunter.collection-updates-preview.v1',
  'trendhunter.people-updates-seen.v1',
  'trendhunter.people-updates-preview.v1',
  'trendhunter.hunter-digest.v1',
  'trendhunter.hunter-digest-dismissed.v1',
  'trendhunter.onboarding-complete.v1',
  'feature-announcement-following-v1-dismissed',
];
const sessionKeys = [
  'signed-in',
  'saved-stories',
  'prediction-calls',
  'prediction-deck',
  'profile-comparison-example-calls',
  'predictions-return',
  'return-to',
  'sign-in-email',
  'sign-in-challenge',
  'trendhunter.pending-person-follow',
  'trendhunter.onboarding-draft.v2',
  'trendhunter.account-setup-next.v1',
  'trendhunter.feature-announcement-preview.v1',
  'trendhunter.guest-topics.v1',
  'trendhunter.guest-recommendation-feedback.v1',
];
const localPrefixes = ['trendhunter.comments.v1:', 'trendhunter.article-feedback.v1:'];
const sessionPrefixes = ['trendhunter.comment-draft:', 'answer-thread:'];

function clearActivity(storage, keys, prefixes) {
  let cleared = true;
  const remove = new Set(keys);
  try {
    // Snapshot first: removing while enumerating Storage skips adjacent keys.
    for (let index = 0; index < storage.length; index++) {
      const key = storage.key(index);
      if (key && prefixes.some(prefix => key.startsWith(prefix))) remove.add(key);
    }
  } catch { cleared = false; }
  for (const key of remove) {
    try { storage.removeItem(key); }
    catch { cleared = false; }
  }
  return cleared;
}

export function resetPrototypeActivity(stores = globalThis) {
  let cleared = true;
  for (const [name, keys, prefixes] of [
    ['localStorage', localKeys, localPrefixes],
    ['sessionStorage', sessionKeys, sessionPrefixes],
  ]) {
    try { if (!clearActivity(stores[name], keys, prefixes)) cleared = false; }
    catch { cleared = false; }
  }
  if (cleared) {
    try {
      // A shared revision invalidates tab-local votes/bookmarks in other tabs.
      // Write it last, once the shared member activity has been cleared.
      const revision = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
      stores.localStorage.setItem(ACTIVITY_RESET_KEY, revision);
      stores.sessionStorage.setItem(ACTIVITY_RESET_KEY, revision);
    } catch { cleared = false; }
  }
  return cleared;
}

export function prototypeActivityResetPending(stores = globalThis) {
  try {
    return stores.localStorage.getItem(ACTIVITY_RESET_KEY) !== stores.sessionStorage.getItem(ACTIVITY_RESET_KEY);
  } catch { return false; }
}

// A stale tab clears only its own activity, never another tab's new follows or
// badge progress created after the shared reset. Also handles restored/Back pages.
export function synchronizePrototypeActivity(stores = globalThis) {
  if (!prototypeActivityResetPending(stores)) return true;
  try {
    const revision = stores.localStorage.getItem(ACTIVITY_RESET_KEY);
    if (!clearActivity(stores.sessionStorage, sessionKeys, sessionPrefixes)) return false;
    if (revision === null) stores.sessionStorage.removeItem(ACTIVITY_RESET_KEY);
    else stores.sessionStorage.setItem(ACTIVITY_RESET_KEY, revision);
    return true;
  } catch { return false; }
}
