import test from 'node:test';
import assert from 'node:assert/strict';
import { ACTIVITY_RESET_KEY, resetPrototypeActivity, prototypeActivityResetPending, synchronizePrototypeActivity } from '../site/logout-reset.js';
import { readFollowing, setPersonFollowed } from '../site/people-follow-state.js';
import { readFollowedCollections, setCollectionFollowed } from '../site/collection-follow-state.js';
import { readBadgeState, recordBadgeActivity } from '../site/badge-state.js';
import { readPredictionResults, previewPredictionResults } from '../site/prediction-result-state.js';
import { readFeedPreferences } from '../site/feed-preferences.js';
import { saveSelectedTopics } from '../site/feed-personalization.js';
import { saveRecommendationFeedback } from '../site/recommendation-feedback.js';
import { createCommentStore, sampleComments } from '../site/comments-state.js';
import { readArticleFeedback, saveArticleFeedback } from '../site/article-feedback-state.js';
import { digestUpdates, readDigestState, catchUpDigest } from '../site/hunter-digest-state.js';
import { viewedCollectionStories, markCollectionStoryViewed } from '../site/collection-update-state.js';
import { readOnboardingDraft, saveOnboardingDraft } from '../site/onboarding-state.js';

function memoryStorage() {
  const values = new Map();
  return {
    get length() { return values.size; },
    key: index => [...values.keys()][index] ?? null,
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
  };
}
const stores = () => ({ localStorage: memoryStorage(), sessionStorage: memoryStorage() });

test('logout resets saved member activity and returns real state readers to empty defaults', () => {
  const storage = stores(), local = storage.localStorage, session = storage.sessionStorage;
  setCollectionFollowed(local, 'collection-evidence-based-beauty.html', true);
  setPersonFollowed(local, 'maya-chen', true);
  saveSelectedTopics(['beauty'], local);
  saveRecommendationFeedback('trend.html', 'collection-longevity.html', 'less', local);
  recordBadgeActivity(local, { type: 'call', id: 'retail-events', call: 'in' }, '2026-11-12');
  previewPredictionResults(local, { 'retail-events': 'in' });
  markCollectionStoryViewed(local, 'trend-skin-longevity.html');
  const rows = digestUpdates(readFollowedCollections(local), readDigestState(local));
  assert.ok(rows.length);
  catchUpDigest(local, rows);
  saveOnboardingDraft({ topics: ['beauty'], collections: ['collection-evidence-based-beauty.html'], people: ['maya-chen'] }, session);
  session.setItem('saved-stories', '[{"id":"trt","href":"trend.html"}]');
  session.setItem('prediction-calls', '{"retail-events":"in","skin-longevity":"out"}');
  session.setItem('prediction-deck', '{"coverDone":true,"skipped":["telehealth-trt"],"flipped":"ai-holidays"}');
  session.setItem('profile-comparison-example-calls', '{"profile-example-samantha-agate-in":"out"}');
  session.setItem('predictions-return', '{"predictionId":"retail-events"}');
  const comments = createCommentStore({ storage: local, signedIn: () => true, id: () => 'my-comment' });
  comments.post('trend.html', 'My local comment');
  saveArticleFeedback(local, 'trend.html', { sentiment: 'up', reasons: ['Informative'], comment: 'Helpful' });

  assert.equal(resetPrototypeActivity(storage), true);
  assert.deepEqual(readFollowing(local), []);
  assert.deepEqual(readFollowedCollections(local), []);
  assert.deepEqual(readFeedPreferences(true, { member: local }), { topics: [], feedback: { hiddenStories: [], preferredCollections: [] } });
  assert.deepEqual(readBadgeState(local).earned, {});
  assert.deepEqual(readBadgeState(local).calls, {});
  assert.deepEqual(readPredictionResults(local), []);
  assert.deepEqual(viewedCollectionStories(local), []);
  assert.deepEqual(readDigestState(local).caughtUp, {});
  assert.deepEqual(readOnboardingDraft(local, session), { topics: [], collections: [], people: [] });
  for (const key of ['saved-stories', 'prediction-calls', 'prediction-deck', 'profile-comparison-example-calls', 'predictions-return']) assert.equal(session.getItem(key), null, key);
  assert.deepEqual(comments.read('trend.html'), sampleComments('trend.html'), 'only fictional public comments remain');
  assert.equal(readArticleFeedback(local, 'trend.html'), null);
  assert.equal(resetPrototypeActivity(storage), true, 'reset is safe to repeat');
});

test('all story drafts and feedback reset without skipping adjacent storage entries', () => {
  const storage = stores();
  for (const story of ['trend.html', 'trend-skin-longevity.html', 'trend-sleep-earbuds.html']) {
    storage.localStorage.setItem(`trendhunter.comments.v1:${story}`, '[]');
    storage.localStorage.setItem(`trendhunter.article-feedback.v1:${story}`, '{}');
    storage.sessionStorage.setItem(`trendhunter.comment-draft:${story}:new`, 'Unfinished');
    storage.sessionStorage.setItem(`answer-thread:${story}`, '["question"]');
  }
  storage.localStorage.setItem('trendhunter.people-updates-preview.v1', 'true');
  storage.localStorage.setItem('trendhunter.collection-updates-preview.v1', 'true');
  storage.sessionStorage.setItem('trendhunter.guest-recommendation-feedback.v1', '{}');
  assert.equal(resetPrototypeActivity(storage), true);
  assert.equal(storage.localStorage.length, 1, 'only the reset revision remains');
  assert.equal(storage.sessionStorage.length, 1, 'only the reset revision remains');
  assert.equal(prototypeActivityResetPending(storage), false);
});

test('reset preserves profile identity, theme, access and unrelated same-origin data', () => {
  const storage = stores();
  storage.localStorage.setItem('theme', 'light');
  storage.localStorage.setItem('another-app', 'keep');
  storage.localStorage.setItem('trendhunter.unrelated-setting', 'keep');
  for (const key of ['profile-name', 'profile-photo', 'trendhunter.demo-access.v1']) storage.sessionStorage.setItem(key, `keep-${key}`);
  assert.equal(resetPrototypeActivity(storage), true);
  assert.equal(storage.localStorage.getItem('theme'), 'light');
  assert.equal(storage.localStorage.getItem('another-app'), 'keep');
  assert.equal(storage.localStorage.getItem('trendhunter.unrelated-setting'), 'keep');
  for (const key of ['profile-name', 'profile-photo', 'trendhunter.demo-access.v1']) assert.equal(storage.sessionStorage.getItem(key), `keep-${key}`);
});

test('failed storage removal reports failure and still clears the other store', () => {
  const storage = stores();
  storage.sessionStorage.setItem('saved-stories', '[{}]');
  storage.localStorage.removeItem = () => { throw Error('Blocked'); };
  assert.equal(resetPrototypeActivity(storage), false);
  assert.equal(storage.sessionStorage.getItem('saved-stories'), null);
});

test('logout invalidates old votes, saves and auth in another tab before signing in again', () => {
  const firstTab = stores();
  const otherTab = { localStorage: firstTab.localStorage, sessionStorage: memoryStorage() };
  for (const tab of [firstTab, otherTab]) {
    tab.sessionStorage.setItem('signed-in', 'true');
    tab.sessionStorage.setItem('saved-stories', '[{"id":"trt"}]');
    tab.sessionStorage.setItem('prediction-calls', '{"retail-events":"in"}');
    tab.sessionStorage.setItem('prediction-deck', '{"coverDone":true}');
    tab.sessionStorage.setItem('trendhunter.comment-draft:trend.html:new', 'Old draft');
  }
  recordBadgeActivity(firstTab.localStorage, { type: 'call', id: 'retail-events', call: 'in' }, '2026-11-12');
  setCollectionFollowed(firstTab.localStorage, 'collection-evidence-based-beauty.html', true);
  setPersonFollowed(firstTab.localStorage, 'maya-chen', true);
  assert.equal(prototypeActivityResetPending(otherTab), false);

  assert.equal(resetPrototypeActivity(firstTab), true);
  assert.equal(firstTab.sessionStorage.getItem('signed-in'), null);
  assert.equal(prototypeActivityResetPending(otherTab), true);
  assert.equal(synchronizePrototypeActivity(otherTab), true);
  for (const key of ['signed-in', 'saved-stories', 'prediction-calls', 'prediction-deck', 'trendhunter.comment-draft:trend.html:new']) {
    assert.equal(otherTab.sessionStorage.getItem(key), null, key);
  }
  assert.equal(prototypeActivityResetPending(otherTab), false);
  assert.deepEqual(readBadgeState(otherTab.localStorage).earned, {});
  assert.deepEqual(readFollowing(otherTab.localStorage), []);
  assert.deepEqual(readFollowedCollections(otherTab.localStorage), []);
  assert.deepEqual(digestUpdates(readFollowedCollections(otherTab.localStorage), readDigestState(otherTab.localStorage)), []);
  assert.equal(synchronizePrototypeActivity(otherTab), true, 'repeat synchronization is harmless');
});

test('a stale tab cannot erase new activity created after logout', () => {
  const firstTab = stores();
  const staleTab = { localStorage: firstTab.localStorage, sessionStorage: memoryStorage() };
  assert.equal(resetPrototypeActivity(firstTab), true);
  setCollectionFollowed(firstTab.localStorage, 'collection-evidence-based-beauty.html', true);
  setPersonFollowed(firstTab.localStorage, 'maya-chen', true);
  recordBadgeActivity(firstTab.localStorage, { type: 'call', id: 'retail-events', call: 'in' }, '2026-11-12');
  assert.equal(synchronizePrototypeActivity(staleTab), true);
  assert.deepEqual(readFollowedCollections(firstTab.localStorage), ['collection-evidence-based-beauty.html']);
  assert.deepEqual(readFollowing(firstTab.localStorage), ['maya-chen']);
  assert.ok(Object.keys(readBadgeState(firstTab.localStorage).earned).length);

  firstTab.sessionStorage.setItem('signed-in', 'true');
  firstTab.sessionStorage.setItem('prediction-calls', '{"retail-events":"in"}');
  assert.equal(synchronizePrototypeActivity(firstTab), true);
  assert.equal(firstTab.sessionStorage.getItem('signed-in'), 'true');
  assert.equal(firstTab.sessionStorage.getItem('prediction-calls'), '{"retail-events":"in"}');
});

test('failed tab synchronization stays pending and can be retried', () => {
  const storage = stores();
  storage.localStorage.setItem(ACTIVITY_RESET_KEY, 'new-reset');
  storage.sessionStorage.setItem('prediction-calls', '{"retail-events":"in"}');
  const remove = storage.sessionStorage.removeItem;
  storage.sessionStorage.removeItem = () => { throw Error('Blocked'); };
  assert.equal(synchronizePrototypeActivity(storage), false);
  assert.equal(prototypeActivityResetPending(storage), true);
  storage.sessionStorage.removeItem = remove;
  assert.equal(synchronizePrototypeActivity(storage), true);
  assert.equal(storage.sessionStorage.getItem('prediction-calls'), null);
  assert.equal(prototypeActivityResetPending(storage), false);
});
