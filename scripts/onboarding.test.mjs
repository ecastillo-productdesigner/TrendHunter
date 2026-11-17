import test from 'node:test';
import assert from 'node:assert/strict';
import { ONBOARDING_DRAFT_KEY, ONBOARDING_FOCUS_KEY, ONBOARDING_FOCUS_PROMPTS, ONBOARDING_FOCUS_MAX_LENGTH, readOnboardingFocus, ONBOARDING_ANSWERS_KEY, ONBOARDING_QUESTIONS, TOPICS, readOnboardingAnswers, readOnboardingDraft, saveOnboardingDraft, onboardingCollections, onboardingCreators, completeOnboarding, onboardingSelectionCount, skipOnboardingStep, skipOnboardingQuestion, onboardingHasPicks, readOnboardingRoute, onboardingStepHash } from '../site/onboarding-state.js';
import { TOPIC_STORAGE_KEY, readSelectedTopics } from '../site/feed-personalization.js';
import { FOLLOWED_COLLECTIONS_KEY, readFollowedCollections } from '../site/collection-follow-state.js';
import { PEOPLE_FOLLOW_KEY, readFollowing } from '../site/people-follow-state.js';
const memory = () => { const values = new Map(); return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) }; };
test('back/reload retains draft choices without applying unfinished follows', () => {
  const storage = memory(), session = memory();
  const draft = { topics: ['tech'], collections: ['collection-ai-everyday-life.html'], people: ['nadia-patel'], answers: {}, focus: { text: '', prompt: '' } };
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
  assert.deepEqual(draft, { topics: [], collections: [], people: [], answers: {}, focus: { text: '', prompt: '' } });
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
  assert.deepEqual(draft, { topics: [], collections: [], people: [], answers: {}, focus: { text: '', prompt: '' } });
  assert.equal(completeOnboarding(draft, storage, session), true);
  assert.deepEqual(readSelectedTopics(storage), ['travel']);
  assert.deepEqual(readFollowedCollections(storage), ['collection-solo-travel.html']);
  assert.deepEqual(readFollowing(storage), ['nadia-patel']);
});
test('skipping clears only that step, survives reload and preserves other picks and saved follows', () => {
  const storage = memory(), session = memory();
  storage.setItem(FOLLOWED_COLLECTIONS_KEY, '["collection-solo-travel.html"]');
  const draft = { topics: ['beauty'], collections: ['collection-evidence-based-beauty.html'], people: ['owen-brooks'], answers: {}, focus: { text: '', prompt: '' } };
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
  assert.deepEqual(readOnboardingDraft(storage, session), { topics: ['tech'], collections: [], people: [], answers: {}, focus: { text: '', prompt: '' } });
  assert.equal(completeOnboarding({}, storage, session), true);
  assert.deepEqual(readSelectedTopics(storage), []);
});
test('a failed follow save rolls all preferences back and retains the retry draft', () => {
  const storage = memory(), session = memory();
  storage.setItem(TOPIC_STORAGE_KEY, '["travel"]');
  storage.setItem(FOLLOWED_COLLECTIONS_KEY, '["collection-solo-travel.html"]');
  const draft = { topics: ['tech'], collections: [], people: ['nadia-patel'], answers: {}, focus: { text: '', prompt: '' } };
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
  const draft = { topics: ['home-living', 'family-parenting'], collections: ['collection-smart-home-energy.html'], people: ['owen-brooks'], answers: {}, focus: { text: '', prompt: '' } };
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
test('only a completely empty onboarding bypasses the summary, including after clearing edits', () => {
  assert.equal(onboardingHasPicks({ topics: [], collections: [], people: [], answers: {}, focus: { text: '', prompt: '' } }), false);
  for (const draft of [{ topics: ['tech'] }, { collections: ['collection-solo-travel.html'] }, { people: ['owen-brooks'], answers: {}, focus: { text: '', prompt: '' } }]) assert.equal(onboardingHasPicks(draft), true);
  const cleared = skipOnboardingStep({ people: ['owen-brooks'], answers: {}, focus: { text: '', prompt: '' } }, 'trend-setters');
  assert.equal(onboardingHasPicks(cleared), false);
  assert.equal(onboardingHasPicks({ people: ['jamie-park'], answers: {}, focus: { text: '', prompt: '' } }), false);
});

test('vibe answers survive reload without applying incomplete preferences and only accept known options', () => {
  const storage = memory(), session = memory();
  assert.equal(ONBOARDING_QUESTIONS.length, 5);
  assert.ok(ONBOARDING_QUESTIONS.every(question => question.options.length === 3));
  saveOnboardingDraft({ answers: { intent: 'rabbit-hole', energy: 'cozy', soundtrack: 'invalid', unknown: 'spa' }, focus: { text: '', prompt: '' } }, session);
  const draft = readOnboardingDraft(storage, session);
  assert.deepEqual(draft.answers, { intent: 'rabbit-hole', energy: 'cozy' });
  assert.equal(onboardingSelectionCount(draft, 'vibe'), 2);
  assert.equal(onboardingHasPicks(draft), true, 'answers alone must reach review');
  assert.deepEqual(readOnboardingAnswers(storage), {}, 'draft answers are not committed yet');
  assert.equal(onboardingHasPicks(skipOnboardingStep(draft, 'vibe')), false);
  assert.deepEqual(draft.answers, { intent: 'rabbit-hole', energy: 'cozy' }, 'Skip does not mutate the source draft');
});

test('older drafts remain compatible and skipping vibe clears only its draft answers', () => {
  const storage = memory(), session = memory();
  session.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify({ topics: ['beauty'], collections: [], people: [] }));
  const draft = readOnboardingDraft(storage, session);
  assert.deepEqual(draft.answers, {});
  draft.answers = { 'free-hour': 'spa' };
  const skipped = skipOnboardingStep(draft, 'vibe');
  saveOnboardingDraft(skipped, session);
  assert.deepEqual(readOnboardingDraft(storage, session).answers, {});
  assert.deepEqual(readOnboardingDraft(storage, session).topics, ['beauty']);
});

test('completion updates answered questions and preserves skipped existing answers', () => {
  const storage = memory(), session = memory();
  storage.setItem(ONBOARDING_ANSWERS_KEY, JSON.stringify({ energy: 'new-me', 'free-hour': 'spa', unexpected: 'ignore' }));
  assert.equal(completeOnboarding({ answers: { energy: 'cozy', intent: 'rabbit-hole' }, focus: { text: '', prompt: '' } }, storage, session), true);
  assert.deepEqual(readOnboardingAnswers(storage), { intent: 'rabbit-hole', energy: 'cozy', 'free-hour': 'spa' });
  assert.equal(completeOnboarding({}, storage, session), true);
  assert.deepEqual(readOnboardingAnswers(storage), { intent: 'rabbit-hole', energy: 'cozy', 'free-hour': 'spa' });
});

test('failed answer persistence rolls back prior preference writes and retains the retry draft', () => {
  const storage = memory(), session = memory();
  storage.setItem(TOPIC_STORAGE_KEY, '["travel"]');
  storage.setItem(FOLLOWED_COLLECTIONS_KEY, '["collection-solo-travel.html"]');
  storage.setItem(ONBOARDING_ANSWERS_KEY, '{"energy":"cozy"}');
  const draft = { topics: ['beauty'], collections: [], people: [], answers: { energy: 'new-me' }, focus: { text: '', prompt: '' } };
  saveOnboardingDraft(draft, session);
  const faulty = { ...storage, setItem(key, value) { if (key === ONBOARDING_ANSWERS_KEY) throw Error('full'); storage.setItem(key, value); } };
  assert.equal(completeOnboarding(draft, faulty, session), false);
  assert.deepEqual(readSelectedTopics(storage), ['travel']);
  assert.deepEqual(readFollowedCollections(storage), ['collection-solo-travel.html']);
  assert.deepEqual(readFollowing(storage), []);
  assert.deepEqual(readOnboardingAnswers(storage), { energy: 'cozy' });
  assert.deepEqual(readOnboardingDraft(storage, session), draft);
});

test('free-text focus and its prompt survive reload and commit only on completion', () => {
  const storage = memory(), session = memory();
  const focus = { text: '  Creative weekend plans  ', prompt: 'daily-trend' };
  saveOnboardingDraft({ focus }, session);
  const draft = readOnboardingDraft(storage, session);
  assert.deepEqual(draft.focus, focus, 'typing whitespace is preserved in the draft');
  assert.deepEqual(readOnboardingFocus(storage), { text: '', prompt: '' });
  assert.equal(onboardingSelectionCount(draft, 'focus'), 1);
  assert.equal(onboardingHasPicks(draft), true, 'a focus-only response still reaches review');
  assert.equal(completeOnboarding(draft, storage, session), true);
  assert.deepEqual(readOnboardingFocus(storage), { text: 'Creative weekend plans', prompt: 'daily-trend' });
});

test('blank text or a prompt alone is not a focus response; Skip clears only that draft step', () => {
  const storage = memory(), session = memory();
  assert.equal(onboardingHasPicks({ focus: { text: ' \t ', prompt: 'here-to' } }), false);
  const draft = { topics: ['tech'], answers: { energy: 'cozy' }, focus: { text: 'Something new', prompt: 'here-to' } };
  const skipped = skipOnboardingStep(draft, 'focus');
  assert.deepEqual(skipped.focus, { text: '', prompt: '' });
  assert.deepEqual(skipped.topics, ['tech']);
  assert.deepEqual(skipped.answers, { energy: 'cozy' });
  assert.equal(draft.focus.text, 'Something new', 'Skip does not mutate the previous draft');
  storage.setItem(ONBOARDING_FOCUS_KEY, '{"text":"Existing focus","prompt":"talk-for-hours"}');
  assert.equal(completeOnboarding(skipped, storage, session), true);
  assert.deepEqual(readOnboardingFocus(storage), { text: 'Existing focus', prompt: 'talk-for-hours' });
});

test('focus normalizes old or invalid drafts and prompt labels remain two or three words', () => {
  const storage = memory(), session = memory();
  session.setItem(ONBOARDING_DRAFT_KEY, '{"topics":["tech"]}');
  assert.deepEqual(readOnboardingDraft(storage, session).focus, { text: '', prompt: '' });
  saveOnboardingDraft({ focus: { text: 'x'.repeat(ONBOARDING_FOCUS_MAX_LENGTH + 100), prompt: 'unknown' } }, session);
  const focus = readOnboardingDraft(storage, session).focus;
  assert.equal(focus.text.length, ONBOARDING_FOCUS_MAX_LENGTH);
  assert.equal(focus.prompt, '');
  storage.setItem(ONBOARDING_FOCUS_KEY, '{not json');
  assert.deepEqual(readOnboardingFocus(storage), { text: '', prompt: '' });
  assert.equal(ONBOARDING_FOCUS_PROMPTS.length, 4);
  assert.ok(ONBOARDING_FOCUS_PROMPTS.every(prompt => [2, 3].includes(prompt.label.split(/\s+/).length)));
});

test('a failed focus save rolls back every preference and keeps the typed response for retry', () => {
  const storage = memory(), session = memory();
  storage.setItem(TOPIC_STORAGE_KEY, '["travel"]');
  storage.setItem(FOLLOWED_COLLECTIONS_KEY, '["collection-solo-travel.html"]');
  storage.setItem(PEOPLE_FOLLOW_KEY, '["maya-chen"]');
  storage.setItem(ONBOARDING_ANSWERS_KEY, '{"energy":"cozy"}');
  storage.setItem(ONBOARDING_FOCUS_KEY, '{"text":"Original focus","prompt":"here-to"}');
  const draft = readOnboardingDraft(storage, session);
  draft.topics = ['tech']; draft.people = ['nadia-patel']; draft.answers = { energy: 'new-me' };
  draft.focus = { text: 'New inspiration', prompt: 'weekly-needs' };
  saveOnboardingDraft(draft, session);
  const faulty = { ...storage, setItem(key, value) { if (key === ONBOARDING_FOCUS_KEY) throw Error('full'); storage.setItem(key, value); } };
  assert.equal(completeOnboarding(draft, faulty, session), false);
  assert.deepEqual(readSelectedTopics(storage), ['travel']);
  assert.deepEqual(readFollowedCollections(storage), ['collection-solo-travel.html']);
  assert.deepEqual(readFollowing(storage), ['maya-chen']);
  assert.deepEqual(readOnboardingAnswers(storage), { energy: 'cozy' });
  assert.deepEqual(readOnboardingFocus(storage), { text: 'Original focus', prompt: 'here-to' });
  assert.deepEqual(readOnboardingDraft(storage, session), draft);
});


test('question routes preserve current position and review edits across reload, including legacy links', () => {
  assert.deepEqual(readOnboardingRoute('#vibe'), { step: 'vibe', questionIndex: 0, editingReview: false });
  assert.deepEqual(readOnboardingRoute('#vibe/edit'), { step: 'vibe', questionIndex: 0, editingReview: true });
  assert.deepEqual(readOnboardingRoute('#focus/edit'), { step: 'focus', questionIndex: 0, editingReview: true });
  for (let questionIndex = 0; questionIndex < ONBOARDING_QUESTIONS.length; questionIndex++) {
    for (const editingReview of [false, true]) {
      const route = onboardingStepHash('vibe', { questionIndex, editingReview });
      assert.deepEqual(readOnboardingRoute(route), { step: 'vibe', questionIndex, editingReview });
    }
  }
  assert.deepEqual(readOnboardingRoute('#vibe/unknown'), { step: 'vibe', questionIndex: 0, editingReview: false });
  assert.deepEqual(readOnboardingRoute('#unknown'), { step: 'topics', questionIndex: 0, editingReview: false });
  assert.equal(onboardingStepHash('review', { editingReview: true }), '#review');
});

test('skipping a single question preserves other answers, follows and focus across reload', () => {
  const storage = memory(), session = memory();
  const draft = {
    topics: ['tech'], collections: ['collection-ai-everyday-life.html'], people: ['nadia-patel'],
    answers: { intent: 'rabbit-hole', energy: 'cozy', soundtrack: 'hype-track' },
    focus: { text: 'Creative weekends', prompt: 'here-to' },
  };
  const skipped = skipOnboardingQuestion(draft, 1);
  saveOnboardingDraft(skipped, session);
  assert.deepEqual(readOnboardingDraft(storage, session), { ...draft, answers: { intent: 'rabbit-hole', soundtrack: 'hype-track' } });
  assert.equal(draft.answers.energy, 'cozy', 'skipping does not mutate the previous draft');
  assert.deepEqual(skipOnboardingQuestion(skipped, 1), skipped, 'unanswered questions can be skipped');
  assert.deepEqual(skipOnboardingQuestion(draft, 100), draft, 'an invalid position cannot clear another answer');
  const allSkipped = ONBOARDING_QUESTIONS.reduce((result, _, index) => skipOnboardingQuestion(result, index), { answers: draft.answers });
  assert.equal(onboardingHasPicks(allSkipped), false, 'skipping all questions remains optional');
});
