import test from 'node:test';
import assert from 'node:assert/strict';
import { ONBOARDING_DRAFT_KEY, ONBOARDING_ANSWERS_KEY, ONBOARDING_QUESTION_GROUPS, TOPICS, cleanDraft, readOnboardingAnswers, readOnboardingDraft, saveOnboardingDraft, onboardingCollections, completeOnboarding, onboardingSelectionCount, skipOnboardingStep, onboardingHasPicks, onboardingQuestion, onboardingSteps, readOnboardingRoute, onboardingStepHash } from '../site/onboarding-state.js';
import { TOPIC_STORAGE_KEY, readSelectedTopics } from '../site/feed-personalization.js';
import { FOLLOWED_COLLECTIONS_KEY, readFollowedCollections } from '../site/collection-follow-state.js';
import { PEOPLE_FOLLOW_KEY, readFollowing } from '../site/people-follow-state.js';
const memory = () => { const values = new Map(); return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) }; };
test('back/reload retains draft choices without applying unfinished follows', () => {
  const storage = memory(), session = memory();
  const draft = { topics: ['tech'], collections: ['collection-ai-everyday-life.html'], answers: {} };
  assert.equal(saveOnboardingDraft(draft, session), true);
  assert.deepEqual(readOnboardingDraft(storage, session), draft);
  assert.deepEqual(readSelectedTopics(storage), []);
  assert.deepEqual(readFollowing(storage), []);
});
test('completion applies topics and collections while preserving existing writer follows and calls', () => {
  const storage = memory(), session = memory();
  storage.setItem(PEOPLE_FOLLOW_KEY, '["jamie-park"]');
  session.setItem('prediction-calls', '{"retail-events":"in"}');
  const draft = readOnboardingDraft(storage, session);
  assert.deepEqual(draft, { topics: [], collections: [], answers: {} });
  draft.topics.push('beauty'); draft.collections.push('collection-evidence-based-beauty.html');
  saveOnboardingDraft(draft, session);
  assert.equal(completeOnboarding(draft, storage, session), true);
  assert.deepEqual(readSelectedTopics(storage), ['beauty']);
  assert.deepEqual(readFollowedCollections(storage), ['collection-evidence-based-beauty.html']);
  assert.deepEqual(readFollowing(storage), ['jamie-park']);
  assert.equal(session.getItem('prediction-calls'), '{"retail-events":"in"}');
  assert.equal(session.getItem(ONBOARDING_DRAFT_KEY), null);
});
test('fresh onboarding has no preselected values and skipping preserves existing preferences', () => {
  const storage = memory(), session = memory();
  storage.setItem(TOPIC_STORAGE_KEY, '["travel"]');
  storage.setItem(FOLLOWED_COLLECTIONS_KEY, '["collection-solo-travel.html"]');
  storage.setItem(PEOPLE_FOLLOW_KEY, '["nadia-patel"]');
  const draft = readOnboardingDraft(storage, session);
  assert.deepEqual(draft, { topics: [], collections: [], answers: {} });
  assert.equal(completeOnboarding(draft, storage, session), true);
  assert.deepEqual(readSelectedTopics(storage), ['travel']);
  assert.deepEqual(readFollowedCollections(storage), ['collection-solo-travel.html']);
  assert.deepEqual(readFollowing(storage), ['nadia-patel']);
});
test('skipping clears only that step, survives reload and preserves other picks and saved follows', () => {
  const storage = memory(), session = memory();
  storage.setItem(FOLLOWED_COLLECTIONS_KEY, '["collection-solo-travel.html"]');
  const draft = { topics: ['beauty'], collections: ['collection-evidence-based-beauty.html'], answers: {} };
  const skipped = skipOnboardingStep(draft, 'collections');
  saveOnboardingDraft(skipped, session);
  const restored = readOnboardingDraft(storage, session);
  assert.equal(onboardingSelectionCount(restored, 'collections'), 0);
  assert.equal(onboardingSelectionCount(restored, 'topics'), 1);
  assert.deepEqual(draft.collections, ['collection-evidence-based-beauty.html']);
  assert.equal(completeOnboarding(restored, storage, session), true);
  assert.deepEqual(readFollowedCollections(storage), ['collection-solo-travel.html']);
});
test('skipping every step permits an empty completion and corrupt draft values are filtered', () => {
  const storage = memory(), session = memory();
  session.setItem(ONBOARDING_DRAFT_KEY, '{"topics":["nope","tech","tech"],"people":["unknown"]}');
  assert.deepEqual(readOnboardingDraft(storage, session), { topics: ['tech'], collections: [], answers: {} });
  assert.equal(completeOnboarding({}, storage, session), true);
  assert.deepEqual(readSelectedTopics(storage), []);
});
test('a failed follow save rolls all preferences back and retains the retry draft', () => {
  const storage = memory(), session = memory();
  storage.setItem(TOPIC_STORAGE_KEY, '["travel"]');
  storage.setItem(FOLLOWED_COLLECTIONS_KEY, '["collection-solo-travel.html"]');
  const draft = { topics: ['tech'], collections: [], answers: {} };
  saveOnboardingDraft(draft, session);
  const faulty = { ...storage, setItem(key, value) { if (key === FOLLOWED_COLLECTIONS_KEY) throw new Error('full'); storage.setItem(key, value); } };
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
});

test('current interests cover home and family and retain a retry draft until navigation succeeds', () => {
  const storage = memory(), session = memory();
  assert.deepEqual(TOPICS.map(topic => topic.name), ['Health & Wellness', 'Beauty & Skincare', 'Food & Drink', 'Fitness', 'Home & Living', 'Tech & AI', 'Family & Parenting', 'Culture & Experiences', 'Travel']);
  const draft = { topics: ['home-living', 'family-parenting'], collections: ['collection-smart-home-energy.html'], answers: {} };
  saveOnboardingDraft(draft, session);
  assert.equal(completeOnboarding(draft, storage, session, { keepDraft: true }), true);
  assert.deepEqual(readSelectedTopics(storage), draft.topics);
  assert.deepEqual(readOnboardingDraft(storage, session), draft);
  assert.equal(onboardingCollections(['home-living'])[0].href, 'collection-smart-home-energy.html');
  assert.equal(onboardingCollections(['family-parenting'])[0].href, 'collection-back-to-school-transitions.html');
});

test('personalized collection suggestions contain matches only and balance multiple interests', () => {
  assert.deepEqual(onboardingCollections(['travel']).map(item => item.href), ['collection-adventure-active-travel.html', 'collection-solo-travel.html']);
  assert.deepEqual(onboardingCollections(['home-living']).map(item => item.href), ['collection-smart-home-energy.html', 'collection-tactile-home-design.html', 'collection-budgeted-living.html', 'collection-everyday-living.html']);
  const blended = onboardingCollections(['travel', 'beauty', 'tech']);
  assert.deepEqual(blended.slice(0,3).map(item => item.href), ['collection-adventure-active-travel.html', 'collection-evidence-based-beauty.html', 'collection-ai-everyday-life.html']);
  assert.ok(!blended.some(item => item.href === 'collection-back-to-school-transitions.html'));
  assert.ok(onboardingCollections(['culture']).some(item => item.href === 'collection.html'));
  assert.equal(onboardingCollections([]).length, 8);
});
test('only current topic, answer and collection picks reach review; removed writer drafts are ignored', () => {
  assert.equal(onboardingHasPicks({ topics: [], collections: [], answers: {} }), false);
  assert.equal(onboardingHasPicks({ topics: ['tech'] }), true);
  assert.equal(onboardingHasPicks({ collections: ['collection-solo-travel.html'] }), true);
  assert.equal(onboardingHasPicks({ people: ['owen-brooks'] }), false);
  const cleared = skipOnboardingStep({ topics: ['tech'] }, 'topics');
  assert.equal(onboardingHasPicks(cleared), false);
});

test('every interest maps to exactly one of the supplied question groups', () => {
  const expected = {
    wellness: 'mind-body-style', beauty: 'mind-body-style', fitness: 'mind-body-style',
    'food-drink': 'everyday-treat', 'home-living': 'everyday-treat', tech: 'everyday-treat', 'family-parenting': 'everyday-treat',
    culture: 'experiences-style', travel: 'experiences-style',
  };
  assert.deepEqual(ONBOARDING_QUESTION_GROUPS.flatMap(group => group.topics).sort(), TOPICS.map(topic => topic.id).sort());
  for (const [topic, id] of Object.entries(expected)) {
    const question = onboardingQuestion([topic]);
    assert.equal(question.id, id, topic);
    assert.ok(question.options.length >= 2 && question.options.length <= 3);
  }
});

test('multiple interests produce just one stable question; majority wins and ties honor first selection', () => {
  assert.equal(onboardingQuestion(['wellness', 'travel', 'tech', 'home-living']).id, 'everyday-treat');
  assert.equal(onboardingQuestion(['travel', 'wellness']).id, 'experiences-style');
  assert.equal(onboardingQuestion(['wellness', 'travel']).id, 'mind-body-style');
  assert.equal(onboardingQuestion(['tech', 'tech', 'wellness', 'fitness', 'unknown']).id, 'mind-body-style', 'duplicates cannot inflate a group');
  const topics = ['travel', 'wellness', 'tech'];
  assert.deepEqual(onboardingQuestion(topics), onboardingQuestion(JSON.parse(JSON.stringify(topics))), 'reload cannot reroll the question');
  assert.equal(onboardingQuestion([]), null);
  assert.equal(onboardingQuestion(['unknown']), null);
});

test('one About you page replaces both old pages and is bypassed when interests are skipped', () => {
  assert.deepEqual(onboardingSteps(['wellness']), ['topics', 'about-you', 'collections', 'review']);
  assert.deepEqual(onboardingSteps([]), ['topics', 'collections', 'review']);
  assert.deepEqual(readOnboardingRoute('#about-you/edit'), { step: 'about-you', editingReview: true });
  for (const route of ['#vibe', '#vibe/energy', '#focus']) assert.deepEqual(readOnboardingRoute(route), { step: 'about-you', editingReview: false });
  for (const route of ['#vibe/edit', '#vibe/energy/edit', '#focus/edit']) assert.deepEqual(readOnboardingRoute(route), { step: 'about-you', editingReview: true });
  assert.deepEqual(readOnboardingRoute('#unknown/edit'), { step: 'topics', editingReview: false });
  for (const step of onboardingSteps(['travel'])) for (const editingReview of [false, true]) {
    assert.deepEqual(readOnboardingRoute(onboardingStepHash(step, { editingReview })), { step, editingReview: step !== 'review' && editingReview });
  }
});

test('only the applicable answer survives draft reload; removed vibe and free-text fields cannot leak into review', () => {
  const storage = memory(), session = memory();
  saveOnboardingDraft({ topics: ['beauty'], answers: { 'mind-body-style': 'feel-good', 'everyday-treat': 'guilty', energy: 'cozy' }, focus: { text: 'Old free text', prompt: 'here-to' } }, session);
  assert.deepEqual(readOnboardingDraft(storage, session), { topics: ['beauty'], collections: [], answers: { 'mind-body-style': 'feel-good' } });
  assert.equal(onboardingSelectionCount(readOnboardingDraft(storage, session), 'about-you'), 1);
  assert.deepEqual(readOnboardingAnswers(storage), {}, 'unfinished answers are not committed');
  session.setItem(ONBOARDING_DRAFT_KEY, '{"topics":["tech"],"answers":{"energy":"cozy"},"focus":{"text":"Old response"}}');
  assert.deepEqual(readOnboardingDraft(storage, session).answers, {});
});

test('changing the winning interest group clears a stale answer, while compatible edits retain it', () => {
  const draft = { topics: ['wellness'], answers: { 'mind-body-style': 'optimize' } };
  assert.deepEqual(cleanDraft({ ...draft, topics: ['wellness', 'fitness'] }).answers, draft.answers);
  assert.deepEqual(cleanDraft({ ...draft, topics: ['tech'] }).answers, {});
  assert.deepEqual(cleanDraft({ ...draft, topics: [] }).answers, {});
  assert.deepEqual(cleanDraft({ topics: ['travel'], answers: { 'experiences-style': 'invalid' } }).answers, {});
});

test('Skip question clears only its draft response; skipping interests also discards the dependent response', () => {
  const draft = { topics: ['wellness'], collections: ['collection-longevity.html'], answers: { 'mind-body-style': 'optimize' } };
  const skipped = skipOnboardingStep(draft, 'about-you');
  assert.deepEqual(skipped, { ...draft, answers: {} });
  assert.deepEqual(draft.answers, { 'mind-body-style': 'optimize' }, 'skip does not mutate the previous draft');
  assert.deepEqual(skipOnboardingStep(draft, 'topics'), { ...draft, topics: [], answers: {} });
  assert.equal(onboardingHasPicks({ answers: draft.answers }), false, 'a response without matching interests cannot create a review panel');
});

test('completion persists one relevant answer, supports a changed group, and preserves a skipped matching answer', () => {
  const storage = memory(), session = memory();
  assert.equal(completeOnboarding({ topics: ['wellness'], answers: { 'mind-body-style': 'optimize' } }, storage, session), true);
  assert.deepEqual(readOnboardingAnswers(storage), { 'mind-body-style': 'optimize' });
  assert.equal(completeOnboarding({ topics: ['fitness'] }, storage, session), true);
  assert.deepEqual(readOnboardingAnswers(storage), { 'mind-body-style': 'optimize' });
  assert.equal(completeOnboarding({ topics: ['travel'], answers: { 'experiences-style': 'planner' } }, storage, session), true);
  assert.deepEqual(readOnboardingAnswers(storage), { 'experiences-style': 'planner' });
  assert.equal(completeOnboarding({ topics: ['tech'] }, storage, session), true);
  assert.deepEqual(readOnboardingAnswers(storage), {}, 'a skipped different-group question cannot retain an unrelated answer');
  storage.setItem(ONBOARDING_ANSWERS_KEY, '{not json');
  assert.deepEqual(readOnboardingAnswers(storage), {});
});

test('failed answer persistence rolls back topics and follows and retains the applicable retry answer', () => {
  const storage = memory(), session = memory();
  storage.setItem(TOPIC_STORAGE_KEY, '["travel"]');
  storage.setItem(FOLLOWED_COLLECTIONS_KEY, '["collection-solo-travel.html"]');
  storage.setItem(ONBOARDING_ANSWERS_KEY, '{"experiences-style":"anything"}');
  const draft = { topics: ['beauty'], collections: [], answers: { 'mind-body-style': 'feel-good' } };
  saveOnboardingDraft(draft, session);
  const faulty = { ...storage, setItem(key, value) { if (key === ONBOARDING_ANSWERS_KEY) throw Error('full'); storage.setItem(key, value); } };
  assert.equal(completeOnboarding(draft, faulty, session), false);
  assert.deepEqual(readSelectedTopics(storage), ['travel']);
  assert.deepEqual(readFollowedCollections(storage), ['collection-solo-travel.html']);
  assert.deepEqual(readFollowing(storage), []);
  assert.deepEqual(readOnboardingAnswers(storage), { 'experiences-style': 'anything' });
  assert.deepEqual(readOnboardingDraft(storage, session), draft);
});

test('removed Trendsetters links return to Collections and old draft writers cannot be followed by completion', () => {
  assert.deepEqual(readOnboardingRoute('#trend-setters'), { step: 'collections', editingReview: false });
  const storage = memory(), session = memory();
  storage.setItem(PEOPLE_FOLLOW_KEY, '["maya-chen"]');
  session.setItem(ONBOARDING_DRAFT_KEY, '{"topics":["wellness"],"people":["nadia-patel"]}');
  const draft = readOnboardingDraft(storage, session);
  assert.equal(Object.hasOwn(draft, 'people'), false);
  assert.equal(completeOnboarding(draft, storage, session), true);
  assert.deepEqual(readFollowing(storage), ['maya-chen']);
});
