import { COLLECTIONS } from './collection-data.js';
import { TOPIC_STORAGE_KEY, readSelectedTopics } from './feed-personalization.js?v=topics-9';
import { FOLLOWED_COLLECTIONS_KEY, readFollowedCollections } from './collection-follow-state.js';

// Curated prototype suggestions and fictional creators; no live popularity claims.
export const ONBOARDING_DRAFT_KEY = 'trendhunter.onboarding-draft.v2';
export const ONBOARDING_COMPLETE_KEY = 'trendhunter.onboarding-complete.v1';
export const ONBOARDING_ANSWERS_KEY = 'trendhunter.onboarding-answers.v1';
// One representative question from each supplied group. No random reroll on reload.
export const ONBOARDING_QUESTION_GROUPS = [
  { id: 'mind-body', label: 'Mind & Body', topics: ['wellness', 'beauty', 'fitness'], question: {
    id: 'mind-body-style',
    question: 'Are you an “optimize everything” person or a “whatever feels good” person?',
    options: [['optimize', 'Optimize everything'], ['feel-good', 'Whatever feels good']],
  } },
  { id: 'everyday-living', label: 'Everyday Living', topics: ['food-drink', 'home-living', 'tech', 'family-parenting'], question: {
    id: 'everyday-treat',
    question: 'How does a little treat make you feel?',
    options: [['guilty', 'Guilty'], ['ready', 'Like I can take on the day'], ['not-for-me', 'Not for me']],
  } },
  { id: 'experiences', label: 'Experiences', topics: ['culture', 'travel'], question: {
    id: 'experiences-style',
    question: 'Would your friends describe you as the planner, the wildcard, or the “I’m down for anything”?',
    options: [['planner', 'The planner'], ['wildcard', 'The wildcard'], ['anything', 'I’m down for anything']],
  } },
];
export const TOPICS = [
  ['wellness', 'Health & Wellness', 'spa'],
  ['beauty', 'Beauty & Skincare', 'health_and_beauty'],
  ['food-drink', 'Food & Drink', 'local_bar'],
  ['fitness', 'Fitness', 'directions_bike'],
  ['home-living', 'Home & Living', 'home'],
  ['tech', 'Tech & AI', 'head_mounted_device'],
  ['family-parenting', 'Family & Parenting', 'family_restroom'],
  ['culture', 'Culture & Experiences', 'public'],
  ['travel', 'Travel', 'flight'],
].map(([id, name, icon]) => ({ id, name, icon }));
export const STEPS = ['topics', 'about-you', 'collections', 'review'];
const uniqueKnown = (values, known) => Array.isArray(values) ? [...new Set(values.filter(value => known.has(value)))] : [];
export function onboardingQuestion(topics = []) {
  const selected = uniqueKnown(topics, new Set(TOPICS.map(topic => topic.id)));
  // Largest selected group wins; ties use the first interest the reader selected.
  const ranked = ONBOARDING_QUESTION_GROUPS.map(group => ({
    group,
    count: selected.filter(topic => group.topics.includes(topic)).length,
    first: selected.findIndex(topic => group.topics.includes(topic)),
  })).filter(item => item.count).sort((a, b) => b.count - a.count || a.first - b.first);
  const group = ranked[0]?.group;
  return group ? { ...group.question, group: group.label } : null;
}
export function onboardingSteps(topics = []) {
  return STEPS.filter(step => step !== 'about-you' || onboardingQuestion(topics));
}
export function readOnboardingRoute(hash = '') {
  const [requested, ...parts] = String(hash).replace(/^#/, '').split('/');
  const canonical = ['vibe', 'focus'].includes(requested) ? 'about-you' : requested === 'trend-setters' ? 'collections' : requested;
  const step = STEPS.includes(canonical) ? canonical : 'topics';
  return { step, editingReview: step === canonical && step !== 'review' && parts.includes('edit') };
}
export function onboardingStepHash(step, { editingReview = false } = {}) {
  step = STEPS.includes(step) ? step : 'topics';
  return `#${step}${editingReview && step !== 'review' ? '/edit' : ''}`;
}
export function cleanOnboardingAnswers(value = {}, question) {
  const candidates = question === undefined ? ONBOARDING_QUESTION_GROUPS.map(group => group.question) : question ? [question] : [];
  const answered = candidates.find(item => item.options.some(([id]) => id === value?.[item.id]));
  return answered ? { [answered.id]: value[answered.id] } : {};
}
export function readOnboardingAnswers(storage) {
  try { return cleanOnboardingAnswers(JSON.parse(storage.getItem(ONBOARDING_ANSWERS_KEY) || '{}')); }
  catch { return {}; }
}
export function cleanDraft(value = {}) {
  const topics = uniqueKnown(value?.topics, new Set(TOPICS.map(topic => topic.id)));
  return {
    topics,
    collections: uniqueKnown(value?.collections, new Set(COLLECTIONS.map(collection => collection.href))),
    answers: cleanOnboardingAnswers(value?.answers, onboardingQuestion(topics)),
  };
}
export function readOnboardingDraft(storage, session) {
  try {
    const saved = JSON.parse(session.getItem(ONBOARDING_DRAFT_KEY) || 'null');
    if (saved) return cleanDraft(saved);
  } catch {}
  // A new onboarding flow never preselects existing preferences or follows.
  return cleanDraft();
}
export function saveOnboardingDraft(draft, session) {
  try { session.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify(cleanDraft(draft))); return true; }
  catch { return false; }
}
export function onboardingSelectionCount(draft, step) {
  const clean = cleanDraft(draft);
  if (step === 'about-you') return Object.keys(clean.answers).length;
  return clean[step]?.length || 0;
}
export function skipOnboardingStep(draft, step) {
  const clean = cleanDraft(draft);
  const key = step;
  if (step === 'about-you') clean.answers = {};
  else if (Object.hasOwn(clean, key)) clean[key] = [];
  return cleanDraft(clean);
}
const suggestions = {
  beauty: ['evidence-based-beauty', 'beauty-from-within', 'longevity'],
  'home-living': ['smart-home-energy', 'tactile-home-design', 'budgeted-living', 'everyday-living'],
  'food-drink': ['protein-forward-eating', 'food-as-an-experience', 'modern-hydration-caffeine'],
  wellness: ['longevity', 'nervous-system-gym', 'sleep-medicine', 'preventive-health', 'her-health', 'metabolic-life', 'modern-anxiety-care', 'gut-brain-axis'],
  'family-parenting': ['back-to-school-transitions', 'mind-body-for-families', 'modern-anxiety-care'],
  tech: ['ai-everyday-life', 'health-technology', 'smart-home-energy'],
  fitness: ['fitness-reset', 'biohackers-body', 'cardio-and-its-health'],
  culture: ['retailtainment-hubs', 'group-friend-events', 'food-as-an-experience', 'everyday-living'],
  travel: ['adventure-active-travel', 'solo-travel'],
};
export function onboardingCollections(topics, selected = []) {
  const defaults = ['andropause-hormonal-midlife', 'back-to-school-transitions', 'beauty-from-within', 'biohackers-body', 'evidence-based-beauty', 'longevity', 'retailtainment-hubs', 'ai-everyday-life'];
  const groups = [...new Set(topics)].map(topic => suggestions[topic]).filter(Boolean);
  // Give every chosen interest a turn before adding more from the same interest.
  // Never fill a personalized list with unrelated defaults just to reach eight.
  const ranked = groups.length
    ? Array.from({ length: Math.max(...groups.map(group => group.length)) }, (_, index) => groups.map(group => group[index]).filter(Boolean)).flat()
    : defaults;
  const preferred = [...new Set(ranked)].slice(0, Math.max(8, groups.length)).map(slug => slug === 'group-friend-events' ? 'collection.html' : `collection-${slug}.html`);
  return [...new Set([...preferred, ...selected])].map(href => COLLECTIONS.find(collection => collection.href === href)).filter(Boolean);
}
export function onboardingHasPicks(draft) {
  return STEPS.slice(0, -1).some(step => onboardingSelectionCount(draft, step) > 0);
}
export function completeOnboarding(draft, storage, session, { keepDraft = false } = {}) {
  const clean = cleanDraft(draft);
  // Onboarding adds follows; skipping a step never removes existing preferences.
  const topics = clean.topics.length ? clean.topics : readSelectedTopics(storage);
  const collections = [...new Set([...readFollowedCollections(storage), ...clean.collections])];
  const answers = cleanOnboardingAnswers({ ...readOnboardingAnswers(storage), ...clean.answers }, onboardingQuestion(topics));
  const writes = [[TOPIC_STORAGE_KEY, topics], [FOLLOWED_COLLECTIONS_KEY, collections], [ONBOARDING_ANSWERS_KEY, answers]];
  const previous = new Map();
  try {
    for (const [key] of writes) previous.set(key, storage.getItem(key));
    for (const [key, value] of writes) storage.setItem(key, JSON.stringify(value));
  } catch {
    for (const [key, value] of previous) {
      try { if (value === null) storage.removeItem(key); else storage.setItem(key, value); } catch {}
    }
    return false;
  }
  try { session.setItem(ONBOARDING_COMPLETE_KEY, 'true'); if (!keepDraft) session.removeItem(ONBOARDING_DRAFT_KEY); } catch {}
  return true;
}
