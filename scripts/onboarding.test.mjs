import test from 'node:test';
import assert from 'node:assert/strict';
import { ONBOARDING_DRAFT_KEY, ONBOARDING_COMPLETE_KEY, ONBOARDING_ANSWERS_KEY, ONBOARDING_QUESTION_GROUPS, STEPS, cleanDraft, resetOnboardingDraft, readOnboardingAnswers, readOnboardingDraft, saveOnboardingDraft, onboardingCollections, completeOnboarding, onboardingSelectionCount, skipOnboardingStep, onboardingQuestion, onboardingQuestions, onboardingSteps, readOnboardingRoute, onboardingStepHash } from '../site/onboarding-state.js';
import { onboardingHunts, onboardingArticles } from '../site/onboarding-hunts.js';
import { COLLECTIONS } from '../site/onboarding-data.js';
import { TOPIC_STORAGE_KEY, FOLLOWED_COLLECTIONS_KEY } from '../site/onboarding-preferences.js';
const memory = () => { const values = new Map(); return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) }; };
const href = slug => slug === 'group-friend-events' ? 'collection.html' : `collection-${slug}.html`;
const empty = { topics: [], preferredCollections: [], answers: {}, furthest: 0 };
const answered = draft => ({ ...draft, answers: Object.fromEntries(onboardingQuestions(draft.topics, draft.preferredCollections).map(question => [question.id, question.options[0][0]])) });

test('three question pages replace interest and collection selection for every visitor', () => {
  assert.deepEqual(STEPS, ['mind-body', 'everyday-living', 'experiences', 'suggested-hunts']);
  assert.deepEqual(onboardingSteps(), STEPS);
  assert.deepEqual(onboardingQuestions().map(q => q.name), ['Andropause & Hormonal Midlife', 'Food as an Experience', 'Budgeted Living']);
  assert.deepEqual(onboardingQuestions().map(q => q.groupId), STEPS.slice(0, 3));
});
test('the attached nine topics each have exactly four distinct hypothetical answers', () => {
  assert.deepEqual(ONBOARDING_QUESTION_GROUPS.map(group => group.questions.length), [3, 3, 3]);
  assert.deepEqual(ONBOARDING_QUESTION_GROUPS.flatMap(group => group.questions.map(q => q.name)), ['Andropause & Hormonal Midlife', 'Preventative Health', 'Mind & Body for Families', 'Food as an Experience', 'Getting Dressed as the Event', 'Planning With AI', 'Budgeted Living', 'Sober-Curious Living', 'Smart Home & Energy']);
  for (const group of ONBOARDING_QUESTION_GROUPS) for (const question of group.questions) {
    assert.equal(question.options.length, 4);
    assert.equal(new Set(question.options.map(([id]) => id)).size, 4);
    assert.equal(new Set(question.options.map(([, label]) => label)).size, 4);
    for (const [, , matches] of question.options) assert.ok(matches.every(slug => COLLECTIONS.some(collection => collection.href === href(slug))));
  }
});
test('saved topics choose one relevant question per group, in attachment order', () => {
  assert.deepEqual(onboardingQuestions(['tech']).map(q => q.id), ['midlife-wellbeing', 'planning-ai', 'smart-home']);
  assert.deepEqual(onboardingQuestions(['family-parenting']).map(q => q.id), ['family-wellbeing', 'planning-ai', 'budgeted-living']);
  assert.deepEqual(onboardingQuestions(['beauty']).map(q => q.id), ['preventative-health', 'getting-dressed', 'budgeted-living']);
  assert.equal(onboardingQuestions(['food-drink'])[2].id, 'sober-curious');
  const topics = ['tech', 'beauty', 'family-parenting'];
  assert.deepEqual(onboardingQuestions(topics), onboardingQuestions(JSON.parse(JSON.stringify(topics))));
});
test('explicit followed collections take priority and all nine question variants are reachable', () => {
  for (const group of ONBOARDING_QUESTION_GROUPS) for (const question of group.questions) {
    const selected = onboardingQuestion([], group.id, [href(question.interests[0])]);
    assert.equal(selected.id, question.id);
  }
  assert.equal(onboardingQuestion(['wellness'], 'mind-body', ['collection-mind-body-for-families.html']).id, 'family-wellbeing');
});
test('a fresh journey snapshots saved interests without preselecting answers or changing follows', () => {
  const storage = memory(), session = memory();
  storage.setItem(TOPIC_STORAGE_KEY, '["tech"]');
  storage.setItem(FOLLOWED_COLLECTIONS_KEY, '["collection-preventive-health.html"]');
  storage.setItem(ONBOARDING_ANSWERS_KEY, '{"planning-ai":"week"}');
  const draft = readOnboardingDraft(storage, session);
  assert.deepEqual(draft, { topics: ['tech'], preferredCollections: ['collection-preventive-health.html'], answers: {}, furthest: 0 });
  saveOnboardingDraft(draft, session);
  storage.setItem(TOPIC_STORAGE_KEY, '["travel"]');
  assert.deepEqual(readOnboardingDraft(storage, session), draft, 'reload keeps the original matching context stable');
});
test('all three answers survive Back/reload and old flow fields cannot reappear', () => {
  const storage = memory(), session = memory();
  const draft = answered(empty);
  assert.equal(saveOnboardingDraft(draft, session), true);
  assert.deepEqual(readOnboardingDraft(storage, session), draft);
  const clean = cleanDraft({ ...draft, topics: ['nope'], collections: ['collection.html'], people: ['maya-chen'], focus: { text: 'old' } });
  assert.deepEqual(clean, draft);
  session.setItem('trendhunter.onboarding-draft.v2', '{"topics":["travel"],"answers":{"energy":"cozy"}}');
  session.removeItem(ONBOARDING_DRAFT_KEY);
  assert.deepEqual(readOnboardingDraft(storage, session), empty);
});
test('answer changes retain the other two responses; Skip clears only the current question', () => {
  const draft = answered(empty);
  const questions = onboardingQuestions();
  const changed = cleanDraft({ ...draft, answers: { ...draft.answers, [questions[1].id]: questions[1].options[2][0] } });
  assert.equal(Object.keys(changed.answers).length, 3);
  const skipped = skipOnboardingStep(changed, 'everyday-living');
  assert.equal(Object.keys(skipped.answers).length, 2);
  assert.equal(skipped.answers[questions[1].id], undefined);
  assert.equal(skipped.answers[questions[0].id], changed.answers[questions[0].id]);
  assert.equal(onboardingSelectionCount(skipped, 'mind-body'), 1);
  assert.equal(onboardingSelectionCount(skipped, 'everyday-living'), 0);
  assert.equal(Object.keys(changed.answers).length, 3, 'skip does not mutate its input');
});
test('changing matching context discards inapplicable answers and filters invalid values', () => {
  const draft = answered(empty);
  const changed = cleanDraft({ ...draft, topics: ['family-parenting', 'tech', 'home-living'] });
  assert.deepEqual(changed.answers, {});
  assert.deepEqual(cleanDraft({ answers: { 'midlife-wellbeing': 'invalid', 'food-experiences': 'flavour' } }).answers, { 'food-experiences': 'flavour' });
});
test('new and legacy URLs resolve only to the three questions and hunts', () => {
  for (const step of STEPS) assert.deepEqual(readOnboardingRoute(onboardingStepHash(step)), { step });
  for (const hash of ['#topics', '#about-you', '#vibe/energy/edit', '#focus', '#unknown']) assert.deepEqual(readOnboardingRoute(hash), { step: 'mind-body' });
  assert.deepEqual(readOnboardingRoute('#collections'), { step: 'experiences' });
  assert.deepEqual(readOnboardingRoute('#review'), { step: 'suggested-hunts' });
});
test('each answered group contributes direct collection matches before related suggestions', () => {
  const draft = answered(empty);
  const results = onboardingCollections(draft.topics, draft.answers, draft.preferredCollections);
  const questions = onboardingQuestions();
  assert.deepEqual(results.slice(0,3).map(x => x.href), questions.map(q => href(q.options[0][2][0])));
  assert.ok(results.length >= 4);
  assert.equal(new Set(results.map(x => x.href)).size, results.length);
});
test('all 36 answers produce safe, relevant, complete hunt and article recommendations', () => {
  for (const group of ONBOARDING_QUESTION_GROUPS) for (const question of group.questions) for (const [value] of question.options) {
    const draft = cleanDraft({ preferredCollections: [href(question.interests[0])], answers: { [question.id]: value } });
    assert.equal(draft.answers[question.id], value);
    const matches = onboardingCollections(draft.topics, draft.answers, draft.preferredCollections);
    assert.ok(matches.length >= 4);
    const hunts = onboardingHunts(draft);
    assert.equal(hunts.length, 4);
    assert.equal(new Set(hunts.map(hunt => hunt.question)).size, 4);
    for (const hunt of hunts) {
      const url = new URL(hunt.href);
      assert.equal(url.origin, 'https://ecastillo-productdesigner.github.io');
      assert.equal(url.pathname, '/TrendHunter/answers.html');
      assert.equal(url.searchParams.get('q'), hunt.question);
    }
    const articles = onboardingArticles(draft);
    assert.equal(articles.length, 2);
    assert.equal(new Set(articles.map(article => article.href)).size, 2);
    assert.ok(articles.every(article => article.collections.some(href => matches.some(collection => collection.href === href))));
  }
});
test('skipping all questions still shows four hunts and two articles', () => {
  assert.equal(onboardingHunts(empty).length, 4);
  assert.equal(onboardingArticles(empty).length, 2);
  for (const step of STEPS.slice(0,3)) assert.equal(onboardingSelectionCount(empty, step), 0);
});
test('completion saves three responses while preserving topics, follows, profiles and predictions', () => {
  const storage = memory(), session = memory();
  storage.setItem(TOPIC_STORAGE_KEY, '["travel"]');
  storage.setItem(FOLLOWED_COLLECTIONS_KEY, '["collection-solo-travel.html"]');
  storage.setItem('trendhunter.followed-people.v1', '["maya-chen"]');
  storage.setItem('theme', 'light');
  session.setItem('prediction-calls', '{"retail-events":"in"}');
  const draft = answered(empty);
  saveOnboardingDraft(draft, session);
  assert.equal(completeOnboarding(draft, storage, session), true);
  assert.deepEqual(readOnboardingAnswers(storage), draft.answers);
  assert.equal(storage.getItem(TOPIC_STORAGE_KEY), '["travel"]');
  assert.equal(storage.getItem(FOLLOWED_COLLECTIONS_KEY), '["collection-solo-travel.html"]');
  assert.equal(storage.getItem('trendhunter.followed-people.v1'), '["maya-chen"]');
  assert.equal(storage.getItem('theme'), 'light');
  assert.equal(session.getItem('prediction-calls'), '{"retail-events":"in"}');
  assert.equal(session.getItem(ONBOARDING_COMPLETE_KEY), 'true');
  assert.equal(session.getItem(ONBOARDING_DRAFT_KEY), null);
});
test('skipping preserves matching committed answers and the final CTA can retain its retry draft', () => {
  const storage = memory(), session = memory();
  const draft = answered(empty);
  assert.equal(completeOnboarding(draft, storage, session), true);
  assert.equal(completeOnboarding(empty, storage, session), true);
  assert.deepEqual(readOnboardingAnswers(storage), draft.answers);
  saveOnboardingDraft(draft, session);
  assert.equal(completeOnboarding(draft, storage, session, { keepDraft: true }), true);
  assert.deepEqual(readOnboardingDraft(storage, session), draft);
});
test('a failed response save keeps the draft and original preferences available for retry', () => {
  const storage = memory(), session = memory();
  storage.setItem(ONBOARDING_ANSWERS_KEY, '{"food-experiences":"story"}');
  const draft = answered(empty);
  saveOnboardingDraft(draft, session);
  const failing = { ...storage, setItem(key, value) { if (key === ONBOARDING_ANSWERS_KEY) throw Error('full'); storage.setItem(key,value); } };
  assert.equal(completeOnboarding(draft, failing, session), false);
  assert.deepEqual(readOnboardingAnswers(storage), { 'food-experiences': 'story' });
  assert.deepEqual(readOnboardingDraft(storage, session), draft);
  assert.equal(session.getItem(ONBOARDING_COMPLETE_KEY), null);
});
test('logo restart clears all three draft answers and returns to the same saved-interest context', () => {
  const storage = memory(), session = memory();
  storage.setItem(TOPIC_STORAGE_KEY, '["tech"]');
  const draft = answered(readOnboardingDraft(storage, session));
  saveOnboardingDraft(draft,session);
  session.setItem(ONBOARDING_COMPLETE_KEY,'true');
  assert.deepEqual(resetOnboardingDraft(session,storage), { topics: ['tech'], preferredCollections: [], answers: {}, furthest: 0 });
  assert.equal(session.getItem(ONBOARDING_DRAFT_KEY),null);
  assert.equal(session.getItem(ONBOARDING_COMPLETE_KEY),null);
  assert.equal(storage.getItem(TOPIC_STORAGE_KEY),'["tech"]');
});

test('visited progress survives reload and untrusted progress values stay bounded', () => {
  const storage = memory(), session = memory();
  const draft = { ...answered(empty), furthest: 3 };
  saveOnboardingDraft(draft, session);
  assert.equal(readOnboardingDraft(storage, session).furthest, 3);
  assert.equal(cleanDraft({ furthest: 999 }).furthest, 3);
  assert.equal(cleanDraft({ furthest: -1 }).furthest, 0);
  assert.equal(cleanDraft({ furthest: '3' }).furthest, 0);
});
