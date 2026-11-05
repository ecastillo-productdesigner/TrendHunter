import test from 'node:test';
import assert from 'node:assert/strict';
import { ONBOARDING_DRAFT_KEY, TOPICS, readOnboardingDraft, saveOnboardingDraft, onboardingCollections, onboardingCreators, completeOnboarding, onboardingSelectionCount, skipOnboardingStep } from '../site/onboarding-state.js';
import { TOPIC_STORAGE_KEY, readSelectedTopics } from '../site/feed-personalization.js';
import { FOLLOWED_COLLECTIONS_KEY, readFollowedCollections } from '../site/collection-follow-state.js';
import { PEOPLE_FOLLOW_KEY, readFollowing } from '../site/people-follow-state.js';
const memory = () => { const values = new Map(); return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) }; };
test('back/reload retains draft choices without applying unfinished follows', () => {
  const storage = memory(), session = memory();
  const draft = { topics: ['tech'], collections: ['collection-ai-everyday-life.html'], people: ['nadia-patel'] };
  assert.equal(saveOnboardingDraft(draft, session), true);
  assert.deepEqual(readOnboardingDraft(storage, session), draft);
  assert.deepEqual(readSelectedTopics(storage), []);
  assert.deepEqual(readFollowing(storage), []);
});
test('completion feeds the existing topic, collection and people stores and preserves calls', () => {
  const storage = memory(), session = memory();
  storage.setItem(PEOPLE_FOLLOW_KEY, '["jamie-park"]');
  session.setItem('prediction-calls', '{"retail-events":"in"}');
  const draft = readOnboardingDraft(storage, session);
  assert.deepEqual(draft, { topics: [], collections: [], people: [] });
  draft.topics.push('beauty'); draft.collections.push('collection-evidence-based-beauty.html'); draft.people.push('nadia-patel');
  saveOnboardingDraft(draft, session);
  assert.equal(completeOnboarding(draft, storage, session), true);
  assert.deepEqual(readSelectedTopics(storage), ['beauty']);
  assert.deepEqual(readFollowedCollections(storage), ['collection-evidence-based-beauty.html']);
  assert.deepEqual(readFollowing(storage), ['jamie-park', 'nadia-patel']);
  assert.equal(session.getItem('prediction-calls'), '{"retail-events":"in"}');
  assert.equal(session.getItem(ONBOARDING_DRAFT_KEY), null);
});
test('fresh onboarding has no preselected values and skipping preserves existing preferences', () => {
  const storage = memory(), session = memory();
  storage.setItem(TOPIC_STORAGE_KEY, '["travel"]');
  storage.setItem(FOLLOWED_COLLECTIONS_KEY, '["collection-solo-travel.html"]');
  storage.setItem(PEOPLE_FOLLOW_KEY, '["nadia-patel"]');
  const draft = readOnboardingDraft(storage, session);
  assert.deepEqual(draft, { topics: [], collections: [], people: [] });
  assert.equal(completeOnboarding(draft, storage, session), true);
  assert.deepEqual(readSelectedTopics(storage), ['travel']);
  assert.deepEqual(readFollowedCollections(storage), ['collection-solo-travel.html']);
  assert.deepEqual(readFollowing(storage), ['nadia-patel']);
});
test('skipping clears only that step, survives reload and preserves other picks and saved follows', () => {
  const storage = memory(), session = memory();
  storage.setItem(FOLLOWED_COLLECTIONS_KEY, '["collection-solo-travel.html"]');
  const draft = { topics: ['beauty'], collections: ['collection-evidence-based-beauty.html'], people: ['owen-brooks'] };
  const skipped = skipOnboardingStep(draft, 'collections');
  saveOnboardingDraft(skipped, session);
  const restored = readOnboardingDraft(storage, session);
  assert.equal(onboardingSelectionCount(restored, 'collections'), 0);
  assert.equal(onboardingSelectionCount(restored, 'topics'), 1);
  assert.equal(onboardingSelectionCount(restored, 'trend-setters'), 1);
  assert.deepEqual(draft.collections, ['collection-evidence-based-beauty.html']);
  assert.equal(completeOnboarding(restored, storage, session), true);
  assert.deepEqual(readFollowedCollections(storage), ['collection-solo-travel.html']);
});
test('skipping every step permits an empty completion and corrupt draft values are filtered', () => {
  const storage = memory(), session = memory();
  session.setItem(ONBOARDING_DRAFT_KEY, '{"topics":["nope","tech","tech"],"people":["unknown"]}');
  assert.deepEqual(readOnboardingDraft(storage, session), { topics: ['tech'], collections: [], people: [] });
  assert.equal(completeOnboarding({}, storage, session), true);
  assert.deepEqual(readSelectedTopics(storage), []);
});
test('a failed follow save rolls all preferences back and retains the retry draft', () => {
  const storage = memory(), session = memory();
  storage.setItem(TOPIC_STORAGE_KEY, '["travel"]');
  storage.setItem(FOLLOWED_COLLECTIONS_KEY, '["collection-solo-travel.html"]');
  const draft = { topics: ['tech'], collections: [], people: ['nadia-patel'] };
  saveOnboardingDraft(draft, session);
  const faulty = { ...storage, setItem(key, value) { if (key === PEOPLE_FOLLOW_KEY) throw new Error('full'); storage.setItem(key, value); } };
  assert.equal(completeOnboarding(draft, faulty, session), false);
  assert.deepEqual(readSelectedTopics(storage), ['travel']);
  assert.deepEqual(readFollowedCollections(storage), ['collection-solo-travel.html']);
  assert.deepEqual(readOnboardingDraft(storage, session), draft);
});
test('suggestions use unique real collections and preserve selected choices when topics change', () => {
  const result = onboardingCollections(['tech'], ['collection-solo-travel.html']);
  assert.equal(result[0].href, 'collection-ai-everyday-life.html');
  assert.equal(new Set(result.map(value => value.href)).size, result.length);
  assert.ok(result.some(value => value.href === 'collection-solo-travel.html'));
  assert.ok(onboardingCreators(['jamie-park']).every(person => person.kind === 'creators'));
});

test('current interests cover home and family and retain a retry draft until navigation succeeds', () => {
  const storage = memory(), session = memory();
  assert.deepEqual(TOPICS.map(topic => topic.name), ['Health & Wellness', 'Beauty & Skincare', 'Food & Drink', 'Fitness', 'Home & Living', 'Tech & AI', 'Family & Parenting', 'Culture & Experiences', 'Travel']);
  const draft = { topics: ['home-living', 'family-parenting'], collections: ['collection-smart-home-energy.html'], people: ['owen-brooks'] };
  saveOnboardingDraft(draft, session);
  assert.equal(completeOnboarding(draft, storage, session, { keepDraft: true }), true);
  assert.deepEqual(readSelectedTopics(storage), draft.topics);
  assert.deepEqual(readOnboardingDraft(storage, session), draft);
  assert.equal(onboardingCollections(['home-living'])[0].href, 'collection-smart-home-energy.html');
  assert.equal(onboardingCollections(['family-parenting'])[0].href, 'collection-back-to-school-transitions.html');
});
