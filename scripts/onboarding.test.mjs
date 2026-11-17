import test from 'node:test';
import assert from 'node:assert/strict';
import { ONBOARDING_DRAFT_KEY, ONBOARDING_ANSWERS_KEY, ONBOARDING_QUESTION_GROUPS, TOPICS, cleanDraft, resetOnboardingDraft, readOnboardingAnswers, readOnboardingDraft, saveOnboardingDraft, onboardingCollections, completeOnboarding, onboardingSelectionCount, skipOnboardingStep, onboardingQuestion, onboardingSteps, readOnboardingRoute, onboardingStepHash } from '../site/onboarding-state.js';
import { onboardingHunts, onboardingArticles } from '../site/onboarding-hunts.js';
import { COLLECTIONS } from '../site/onboarding-data.js';
import { TOPIC_STORAGE_KEY, readSelectedTopics, FOLLOWED_COLLECTIONS_KEY, readFollowedCollections } from '../site/onboarding-preferences.js';
const PEOPLE_FOLLOW_KEY = 'trendhunter.followed-people.v1';
const readFollowing = storage => JSON.parse(storage.getItem(PEOPLE_FOLLOW_KEY) || '[]');
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
test('suggestions use unique real collections and discard off-topic selections after interests change', () => {
  const result = onboardingCollections(['tech']);
  assert.equal(result[0].href, 'collection-ai-everyday-life.html');
  assert.equal(new Set(result.map(value => value.href)).size, result.length);
  assert.ok(!result.some(value => value.href === 'collection-solo-travel.html'));
  assert.deepEqual(cleanDraft({ topics: ['tech'], collections: ['collection-solo-travel.html'] }).collections, []);
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
  assert.deepEqual(onboardingCollections(['travel']).map(item => item.href), ['collection-adventure-active-travel.html', 'collection-solo-travel.html', 'collection-food-as-an-experience.html', 'collection.html']);
  assert.deepEqual(onboardingCollections(['home-living']).map(item => item.href), ['collection-smart-home-energy.html', 'collection-tactile-home-design.html', 'collection-budgeted-living.html', 'collection-everyday-living.html']);
  const blended = onboardingCollections(['travel', 'beauty', 'tech']);
  assert.deepEqual(blended.slice(0,3).map(item => item.href), ['collection-adventure-active-travel.html', 'collection-evidence-based-beauty.html', 'collection-ai-everyday-life.html']);
  assert.ok(!blended.some(item => item.href === 'collection-back-to-school-transitions.html'));
  assert.ok(onboardingCollections(['culture']).some(item => item.href === 'collection.html'));
  assert.equal(onboardingCollections([]).length, 8);
});
test('every interest maps to exactly one of the supplied question groups', () => {
  const expected = {
    wellness: 'wellness-try', beauty: 'mind-body-style', fitness: 'morning-routine',
    'food-drink': 'dinner-style', 'home-living': 'life-upgrade', tech: 'open-tabs', 'family-parenting': 'everyday-treat',
    culture: 'experiences-style', travel: 'dream-trip',
  };
  assert.deepEqual(ONBOARDING_QUESTION_GROUPS.flatMap(group => group.topics).sort(), TOPICS.map(topic => topic.id).sort());
  for (const [topic, id] of Object.entries(expected)) {
    const question = onboardingQuestion([topic]);
    assert.equal(question.id, id, topic);
    assert.equal(question.options.length, 3);
  }
});

test('multiple interests produce just one stable question; majority wins and ties honor first selection', () => {
  assert.equal(onboardingQuestion(['wellness', 'travel', 'tech', 'home-living']).id, 'open-tabs');
  assert.equal(onboardingQuestion(['travel', 'wellness']).id, 'dream-trip');
  assert.equal(onboardingQuestion(['wellness', 'travel']).id, 'wellness-try');
  assert.equal(onboardingQuestion(['tech', 'tech', 'wellness', 'fitness', 'unknown']).id, 'wellness-try', 'duplicates cannot inflate a group');
  const topics = ['travel', 'wellness', 'tech'];
  assert.deepEqual(onboardingQuestion(topics), onboardingQuestion(JSON.parse(JSON.stringify(topics))), 'reload cannot reroll the question');
  assert.equal(onboardingQuestion([]), null);
  assert.equal(onboardingQuestion(['unknown']), null);
});

test('one About you page replaces both old pages and is bypassed when interests are skipped', () => {
  assert.deepEqual(onboardingSteps(['wellness']), ['topics', 'about-you', 'collections', 'suggested-hunts']);
  assert.deepEqual(onboardingSteps([]), ['topics', 'collections', 'suggested-hunts']);
  assert.deepEqual(readOnboardingRoute('#about-you/edit'), { step: 'about-you', editingReview: true });
  for (const route of ['#vibe', '#vibe/energy', '#focus']) assert.deepEqual(readOnboardingRoute(route), { step: 'about-you', editingReview: false });
  for (const route of ['#vibe/edit', '#vibe/energy/edit', '#focus/edit']) assert.deepEqual(readOnboardingRoute(route), { step: 'about-you', editingReview: true });
  assert.deepEqual(readOnboardingRoute('#unknown/edit'), { step: 'topics', editingReview: false });
  for (const step of onboardingSteps(['travel'])) for (const editingReview of [false, true]) {
    assert.deepEqual(readOnboardingRoute(onboardingStepHash(step, { editingReview })), { step, editingReview: step !== 'suggested-hunts' && editingReview });
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
  const draft = { topics: ['beauty'], answers: { 'mind-body-style': 'optimize' } };
  assert.deepEqual(cleanDraft({ ...draft, topics: ['beauty', 'fitness'] }).answers, draft.answers);
  assert.deepEqual(cleanDraft({ ...draft, topics: ['tech'] }).answers, {});
  assert.deepEqual(cleanDraft({ ...draft, topics: [] }).answers, {});
  assert.deepEqual(cleanDraft({ topics: ['travel'], answers: { 'experiences-style': 'invalid' } }).answers, {});
});

test('Skip clears its response and revalidates collection choices; skipping interests discards the dependent response', () => {
  const draft = { topics: ['beauty'], collections: ['collection-biohackers-body.html'], answers: { 'mind-body-style': 'optimize' } };
  const skipped = skipOnboardingStep(draft, 'about-you');
  assert.deepEqual(skipped, { ...draft, answers: {}, collections: [] });
  assert.deepEqual(draft.answers, { 'mind-body-style': 'optimize' }, 'skip does not mutate the previous draft');
  assert.deepEqual(skipOnboardingStep(draft, 'topics'), { ...draft, topics: [], answers: {} });
  assert.equal(onboardingSelectionCount({ answers: draft.answers }, 'about-you'), 0, 'an answer without matching interests is discarded');
});

test('completion persists one relevant answer, supports a changed group, and preserves a skipped matching answer', () => {
  const storage = memory(), session = memory();
  assert.equal(completeOnboarding({ topics: ['beauty'], answers: { 'mind-body-style': 'optimize' } }, storage, session), true);
  assert.deepEqual(readOnboardingAnswers(storage), { 'mind-body-style': 'optimize' });
  assert.equal(completeOnboarding({ topics: ['beauty', 'fitness'] }, storage, session), true);
  assert.deepEqual(readOnboardingAnswers(storage), { 'mind-body-style': 'optimize' });
  assert.equal(completeOnboarding({ topics: ['culture'], answers: { 'experiences-style': 'planner' } }, storage, session), true);
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


test('all ten supplied questions are reachable and every answer maps only to existing collections', () => {
  assert.deepEqual(ONBOARDING_QUESTION_GROUPS.map(group => group.questions.length), [3, 4, 3]);
  const questions = ONBOARDING_QUESTION_GROUPS.flatMap(group => group.questions);
  assert.ok(questions.every(question => question.options.length === 3), 'every question always offers exactly three choices');
  const reached = new Set();
  for (const group of ONBOARDING_QUESTION_GROUPS) {
    for (let mask = 1; mask < 2 ** group.topics.length; mask++) {
      const topics = group.topics.filter((_, i) => mask & (1 << i));
      const question = onboardingQuestion(topics);
      reached.add(question.id);
      for (const [value, , matches] of question.options) {
        const answers = { [question.id]: value };
        const results = onboardingCollections(topics, answers);
        assert.equal(new Set(results.map(item => item.href)).size, results.length);
        assert.ok(results.every(item => COLLECTIONS.some(collection => collection.href === item.href)));
        assert.ok(results.length >= 4, 'every answer offers at least four direct or related collections');
        assert.deepEqual(results.slice(0, matches.length).map(item => item.href), matches.map(slug => slug === 'group-friend-events' ? 'collection.html' : `collection-${slug}.html`), 'direct answer matches come first');
        const draft = cleanDraft({ topics, answers, collections: COLLECTIONS.map(item => item.href) });
        assert.deepEqual(draft.collections, COLLECTIONS.filter(item => results.some(match => match.href === item.href)).map(item => item.href));
      }
    }
  }
  assert.deepEqual([...reached].sort(), questions.map(question => question.id).sort());
});

test('answer changes replace collection suggestions and discard previously selected unrelated collections', () => {
  const topics = ['wellness'];
  const sleep = { 'wellness-try': 'sleep-tape' };
  const cold = { 'wellness-try': 'cold-plunge' };
  assert.deepEqual(onboardingCollections(topics, sleep).map(item => item.href), ['collection-sleep-medicine.html', 'collection-health-technology.html', 'collection-nervous-system-gym.html', 'collection-regulated-living.html']);
  assert.deepEqual(onboardingCollections(topics, cold).map(item => item.href), ['collection-biohackers-body.html', 'collection-nervous-system-gym.html', 'collection-wellness-maxxing.html', 'collection-health-technology.html']);
  const changed = cleanDraft({ topics, answers: cold, collections: ['collection-sleep-medicine.html'] });
  assert.deepEqual(changed.collections, []);
  assert.deepEqual(changed.answers, cold);
  assert.deepEqual(onboardingCollections(['travel'], { 'dream-trip': 'food-trip' })[0].href, 'collection-food-as-an-experience.html');
  const withUnrelatedInterest = onboardingCollections(['wellness', 'tech'], sleep);
  assert.deepEqual(withUnrelatedInterest.map(item => item.href), ['collection-sleep-medicine.html', 'collection-health-technology.html', 'collection-nervous-system-gym.html', 'collection-regulated-living.html']);
});

test('skipped or invalid answers use topic suggestions and learning uses adjacent cultural interests', () => {
  assert.deepEqual(onboardingCollections(['tech'], { 'open-tabs': 'invalid' }), onboardingCollections(['tech']));
  assert.deepEqual(onboardingCollections(['wellness'], { 'dream-trip': 'adventure' }), onboardingCollections(['wellness']));
  assert.equal(onboardingCollections(['culture', 'travel'], { 'say-yes': 'learning' }).length, 4);
  assert.deepEqual(onboardingCollections(['culture', 'travel'], { 'say-yes': 'social-plans' }).slice(0, 2).map(item => item.href), ['collection.html', 'collection-food-as-an-experience.html']);
  const skipped = skipOnboardingStep({ topics: ['wellness'], answers: { 'wellness-try': 'sleep-tape' }, collections: ['collection-sleep-medicine.html'] }, 'about-you');
  assert.deepEqual(skipped.answers, {});
  assert.deepEqual(onboardingCollections(skipped.topics, skipped.answers), onboardingCollections(['wellness']));
});


test('Suggested Hunts replaces Great picks with four unique safe links for all answers and skipped flows', () => {
  assert.deepEqual(readOnboardingRoute('#review'), { step: 'suggested-hunts', editingReview: false });
  const drafts = [{}, { topics: ['travel'] }];
  for (const group of ONBOARDING_QUESTION_GROUPS) for (const question of group.questions) for (const [value] of question.options) drafts.push({ topics: question.topics, answers: { [question.id]: value } });
  for (const draft of drafts) {
    const hunts = onboardingHunts(draft);
    assert.equal(hunts.length, 4);
    assert.equal(new Set(hunts.map(hunt => hunt.question)).size, 4);
    for (const hunt of hunts) {
      const url = new URL(hunt.href, 'https://prototype.test/');
      assert.equal(url.origin, 'https://ecastillo-productdesigner.github.io');
      assert.equal(url.pathname, '/TrendHunter/answers.html');
      assert.equal(url.searchParams.get('q'), hunt.question);
    }
  }
  const sleep = onboardingHunts({ topics: ['wellness'], answers: { 'wellness-try': 'sleep-tape' }, collections: ['collection-sleep-medicine.html'] });
  assert.ok(sleep.some(hunt => /sleep/i.test(hunt.question)));
  const learning = onboardingHunts({ topics: ['culture', 'travel'], answers: { 'say-yes': 'learning' } });
  assert.ok(learning.every(hunt => /learn|reading|book/i.test(hunt.question)));
});


test('article alternatives reuse real matching stories and prioritize selected collections', () => {
  for (const group of ONBOARDING_QUESTION_GROUPS) for (const question of group.questions) for (const [value] of question.options) {
    const draft = { topics: question.topics, answers: { [question.id]: value } };
    const stories = onboardingArticles(draft);
    const matches = onboardingCollections(draft.topics, draft.answers).map(collection => collection.href);
    assert.equal(stories.length, 2);
    assert.equal(new Set(stories.map(story => story.href)).size, 2);
    assert.ok(stories.every(story => story.image && story.title && story.collections.some(href => matches.includes(href))));
  }
  const stories = onboardingArticles({ topics: ['wellness'], answers: { 'wellness-try': 'sleep-tape' }, collections: ['collection-sleep-medicine.html'] });
  assert.ok(stories.every(story => story.collections.includes('collection-sleep-medicine.html')));
});


test('logo restart clears the onboarding draft and completion marker and survives reload', () => {
  const storage = memory(), session = memory();
  storage.setItem(FOLLOWED_COLLECTIONS_KEY, '["collection-solo-travel.html"]');
  saveOnboardingDraft({ topics: ['wellness'], answers: { 'wellness-try': 'sleep-tape' }, collections: ['collection-sleep-medicine.html'] }, session);
  session.setItem('trendhunter.onboarding-complete.v1', 'true');
  assert.deepEqual(resetOnboardingDraft(session), { topics: [], collections: [], answers: {} });
  assert.equal(session.getItem(ONBOARDING_DRAFT_KEY), null);
  assert.equal(session.getItem('trendhunter.onboarding-complete.v1'), null);
  assert.deepEqual(readOnboardingDraft(storage, session), { topics: [], collections: [], answers: {} });
  assert.deepEqual(readFollowedCollections(storage), ['collection-solo-travel.html']);
});
