import { TOPIC_STORAGE_KEY, readSelectedTopics } from './feed-personalization.js?v=topics-9';
import { RECOMMENDATION_FEEDBACK_KEY, readRecommendationFeedback } from './recommendation-feedback.js';

// Account preferences survive sign-out, but Discover never reads or writes them.
// Guest choices are explicit, tab-local, and are never promoted into an account.
export const GUEST_TOPIC_STORAGE_KEY = 'trendhunter.guest-topics.v1';
export const GUEST_FEEDBACK_STORAGE_KEY = 'trendhunter.guest-recommendation-feedback.v1';
const guestKeys = {
  [TOPIC_STORAGE_KEY]: GUEST_TOPIC_STORAGE_KEY,
  [RECOMMENDATION_FEEDBACK_KEY]: GUEST_FEEDBACK_STORAGE_KEY,
};

export function feedPreferenceStorage(signedIn = globalThis.isSignedIn?.() === true || globalThis.document?.documentElement.dataset.auth === 'signed-in', stores = {}) {
  const storage = () => signedIn
    ? (stores.member ?? globalThis.localStorage)
    : (stores.guest ?? globalThis.sessionStorage);
  const keyFor = key => signedIn ? key : guestKeys[key];
  return {
    getItem: key => storage().getItem(keyFor(key)),
    setItem: (key, value) => storage().setItem(keyFor(key), value),
    removeItem: key => storage().removeItem(keyFor(key)),
  };
}

export function readFeedPreferences(signedIn, stores) {
  const storage = feedPreferenceStorage(signedIn, stores);
  return { topics: readSelectedTopics(storage), feedback: readRecommendationFeedback(storage) };
}
