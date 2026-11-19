import { COLLECTIONS } from './onboarding-data.js?v=three-questions-9';
import { readSelectedTopics, readFollowedCollections } from './onboarding-preferences.js?v=three-questions-9';
import { ONBOARDING_QUESTION_GROUPS } from './onboarding-questions.js?v=three-questions-9';
export { ONBOARDING_QUESTION_GROUPS };

export const ONBOARDING_DRAFT_KEY = 'trendhunter.onboarding-draft.v3';
export const ONBOARDING_COMPLETE_KEY = 'trendhunter.onboarding-complete.v1';
export const ONBOARDING_ANSWERS_KEY = 'trendhunter.onboarding-answers.v1';
export const STEPS = [...ONBOARDING_QUESTION_GROUPS.map(group => group.id), 'suggested-hunts'];
const topicIds = new Set(['wellness', 'beauty', 'food-drink', 'fitness', 'home-living', 'tech', 'family-parenting', 'culture', 'travel']);
const collectionIds = new Set(COLLECTIONS.map(collection => collection.href));
const uniqueKnown = (values, known) => Array.isArray(values) ? [...new Set(values.filter(value => known.has(value)))] : [];
const collectionHref = slug => slug === 'group-friend-events' ? 'collection.html' : `collection-${slug}.html`;

export function onboardingQuestions(topics = [], preferredCollections = []) {
  const selected = uniqueKnown(topics, topicIds);
  const followed = uniqueKnown(preferredCollections, collectionIds);
  return ONBOARDING_QUESTION_GROUPS.map(group => {
    // Explicit collection follows take priority, then saved topics; list order breaks ties.
    const ranked = group.questions.map((question, index) => ({
      question, index,
      follows: question.interests.filter(slug => followed.includes(collectionHref(slug))).length,
      topics: question.topics.filter(topic => selected.includes(topic)).length,
      first: selected.findIndex(topic => question.topics.includes(topic)),
    })).sort((a, b) => b.follows - a.follows || b.topics - a.topics || (a.first < 0 ? selected.length : a.first) - (b.first < 0 ? selected.length : b.first) || a.index - b.index);
    return { ...ranked[0].question, groupId: group.id, group: group.label };
  });
}
export function onboardingQuestion(topics = [], step = STEPS[0], preferredCollections = []) {
  return onboardingQuestions(topics, preferredCollections).find(question => question.groupId === step) || null;
}
export const onboardingSteps = () => [...STEPS];
export function readOnboardingRoute(hash = '') {
  const requested = String(hash).replace(/^#/, '').split('/')[0];
  const aliases = { topics: STEPS[0], 'about-you': STEPS[0], vibe: STEPS[0], focus: STEPS[0], collections: 'experiences', 'trend-setters': 'experiences', review: 'suggested-hunts' };
  const step = aliases[requested] || requested;
  return { step: STEPS.includes(step) ? step : STEPS[0] };
}
export const onboardingStepHash = step => `#${STEPS.includes(step) ? step : STEPS[0]}`;
export function cleanOnboardingAnswers(value = {}, questions = ONBOARDING_QUESTION_GROUPS.flatMap(group => group.questions)) {
  return Object.fromEntries(questions.flatMap(question => question.options.some(([id]) => id === value?.[question.id]) ? [[question.id, value[question.id]]] : []));
}
export function readOnboardingAnswers(storage) {
  try { return cleanOnboardingAnswers(JSON.parse(storage.getItem(ONBOARDING_ANSWERS_KEY) || '{}')); }
  catch { return {}; }
}
export function cleanDraft(value = {}) {
  const topics = uniqueKnown(value?.topics, topicIds);
  const preferredCollections = uniqueKnown(value?.preferredCollections, collectionIds);
  const furthest = Number.isInteger(value?.furthest) ? Math.max(0, Math.min(STEPS.length - 1, value.furthest)) : 0;
  return { topics, preferredCollections, answers: cleanOnboardingAnswers(value?.answers, onboardingQuestions(topics, preferredCollections)), furthest };
}
export function readOnboardingDraft(storage, session) {
  try {
    const saved = JSON.parse(session.getItem(ONBOARDING_DRAFT_KEY) || 'null');
    if (saved) return cleanDraft(saved);
  } catch {}
  // Snapshot only existing interests for topic matching; never preselect answers.
  return cleanDraft({ topics: readSelectedTopics(storage), preferredCollections: readFollowedCollections(storage) });
}
export function resetOnboardingDraft(session, storage) {
  try { session.removeItem(ONBOARDING_DRAFT_KEY); session.removeItem(ONBOARDING_COMPLETE_KEY); } catch {}
  return readOnboardingDraft(storage, session);
}
export function saveOnboardingDraft(draft, session) {
  try { session.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify(cleanDraft(draft))); return true; }
  catch { return false; }
}
export function onboardingSelectionCount(draft, step) {
  const clean = cleanDraft(draft);
  const question = onboardingQuestion(clean.topics, step, clean.preferredCollections);
  return question && clean.answers[question.id] ? 1 : 0;
}
export function skipOnboardingStep(draft, step) {
  const clean = cleanDraft(draft);
  const question = onboardingQuestion(clean.topics, step, clean.preferredCollections);
  if (question) delete clean.answers[question.id];
  return clean;
}
export function onboardingCollections(topics = [], answers = {}, preferredCollections = []) {
  const questions = onboardingQuestions(topics, preferredCollections);
  let groups = questions.flatMap(question => {
    const option = question.options.find(([id]) => id === answers?.[question.id]);
    return option ? [option[2]] : [];
  });
  if (!groups.length) groups = questions.map(question => question.related);
  // Round-robin matches so each answered group contributes before further suggestions.
  const ranked = Array.from({ length: Math.max(...groups.map(group => group.length)) }, (_, index) => groups.map(group => group[index]).filter(Boolean)).flat();
  const related = ['longevity', 'food-as-an-experience', 'budgeted-living', 'smart-home-energy'];
  const slugs = [...new Set(ranked)];
  for (const slug of related) { if (slugs.length >= 4) break; if (!slugs.includes(slug)) slugs.push(slug); }
  return slugs.map(collectionHref).map(href => COLLECTIONS.find(collection => collection.href === href)).filter(Boolean);
}
export function completeOnboarding(draft, storage, session, { keepDraft = false } = {}) {
  const clean = cleanDraft(draft);
  const questions = onboardingQuestions(clean.topics, clean.preferredCollections);
  const answers = cleanOnboardingAnswers({ ...readOnboardingAnswers(storage), ...clean.answers }, questions);
  let previous;
  try {
    previous = storage.getItem(ONBOARDING_ANSWERS_KEY);
    storage.setItem(ONBOARDING_ANSWERS_KEY, JSON.stringify(answers));
  } catch {
    if (previous !== undefined) try { if (previous === null) storage.removeItem(ONBOARDING_ANSWERS_KEY); else storage.setItem(ONBOARDING_ANSWERS_KEY, previous); } catch {}
    return false;
  }
  // Questions save responses only. Recommendations never create implicit collection follows.
  try { session.setItem(ONBOARDING_COMPLETE_KEY, 'true'); if (!keepDraft) session.removeItem(ONBOARDING_DRAFT_KEY); } catch {}
  return true;
}
