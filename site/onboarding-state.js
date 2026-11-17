import { COLLECTIONS } from './onboarding-data.js';
import { TOPIC_STORAGE_KEY, readSelectedTopics, FOLLOWED_COLLECTIONS_KEY, readFollowedCollections } from './onboarding-preferences.js';

// Curated prototype suggestions; no live popularity claims.
export const ONBOARDING_DRAFT_KEY = 'trendhunter.onboarding-draft.v2';
export const ONBOARDING_COMPLETE_KEY = 'trendhunter.onboarding-complete.v1';
export const ONBOARDING_ANSWERS_KEY = 'trendhunter.onboarding-answers.v1';
// Supplied question bank; topic pairings choose one stable question from the winning group.
// Option tuples contain [stored value, visible label, matching prototype collection slugs].
export const ONBOARDING_QUESTION_GROUPS = [
  { id: 'mind-body', label: 'Mind & Body', topics: ['wellness', 'beauty', 'fitness'], questions: [
    { id: 'wellness-try', topics: ['wellness'], question: 'What’s one wellness thing you want to try?', options: [
      ['cold-plunge', 'Cold plunge', ['biohackers-body', 'nervous-system-gym']],
      ['red-light', 'Red light therapy', ['evidence-based-beauty', 'health-technology']],
      ['sleep-tape', 'Sleep tape', ['sleep-medicine']],
    ] },
    { id: 'mind-body-style', topics: ['beauty'], question: 'Do you optimize everything, or just do what feels good?', options: [
      ['optimize', 'Optimize everything', ['wellness-maxxing', 'biohackers-body', 'health-technology']],
      ['feel-good', 'Do what feels good', ['the-intuitive-body', 'nervous-system-gym']],
      ['balanced', 'A bit of both', ['longevity', 'the-intuitive-body']],
    ] },
    { id: 'morning-routine', topics: ['fitness'], question: 'Are your mornings a sacred ritual or snooze-button survival?', options: [
      ['ritual', 'Sacred ritual', ['fitness-reset', 'modern-hydration-caffeine', 'nervous-system-gym']],
      ['snooze', 'Snooze-button survival', ['sleep-medicine', 'modern-hydration-caffeine']],
      ['in-between', 'Somewhere in between', ['fitness-reset', 'modern-hydration-caffeine']],
    ] },
  ] },
  { id: 'everyday-living', label: 'Everyday Living', topics: ['food-drink', 'home-living', 'tech', 'family-parenting'], questions: [
    { id: 'life-upgrade', topics: ['home-living'], question: 'What’s the last thing you bought that made life better?', options: [
      ['home-upgrade', 'A home upgrade', ['tactile-home-design', 'smart-home-energy']],
      ['useful-gadget', 'A useful gadget', ['ai-everyday-life', 'smart-home-energy']],
      ['everyday-essential', 'An everyday essential', ['everyday-living', 'budgeted-living']],
    ] },
    { id: 'dinner-style', topics: ['food-drink'], question: 'For dinner, are you a meal-prep hero, takeout loyalist, or “I’ll figure it out at 7pm”?', options: [
      ['meal-prep', 'Meal-prep hero', ['protein-forward-eating', 'metabolic-life']],
      ['takeout', 'Takeout loyalist', ['food-as-an-experience']],
      ['figure-it-out', 'I’ll figure it out at 7pm', ['food-as-an-experience', 'everyday-living']],
    ] },
    { id: 'open-tabs', topics: ['tech'], question: 'How many tabs do you have open right now?', options: [
      ['few', '0–5 tabs', ['ai-everyday-life']],
      ['several', '6–20 tabs', ['ai-everyday-life']],
      ['many', '21+ tabs', ['ai-everyday-life']],
    ] },
    { id: 'everyday-treat', topics: ['family-parenting'], question: 'A little treat makes you feel: guilty, ready for the day, or not for me?', options: [
      ['guilty', 'Guilty', ['budgeted-living']],
      ['ready', 'Ready for the day', ['food-as-an-experience', 'modern-hydration-caffeine']],
      ['not-for-me', 'Not for me', ['everyday-living', 'regulated-living']],
    ] },
  ] },
  { id: 'experiences', label: 'Experiences', topics: ['culture', 'travel'], questions: [
    { id: 'dream-trip', topics: ['travel'], question: 'What’s your dream trip: big adventure, total relaxation, or eating your way through?', options: [
      ['adventure', 'Big adventure', ['adventure-active-travel']],
      ['relaxation', 'Total relaxation', ['solo-travel']],
      ['food-trip', 'Eating my way through', ['food-as-an-experience', 'adventure-active-travel', 'solo-travel']],
    ] },
    { id: 'experiences-style', topics: ['culture'], question: 'Your friends would call you: the planner, the wildcard, or down for anything?', options: [
      ['planner', 'The planner', ['group-friend-events']],
      ['wildcard', 'The wildcard', ['adventure-active-travel', 'group-friend-events']],
      ['anything', 'Down for anything', ['group-friend-events', 'food-as-an-experience']],
    ] },
    { id: 'say-yes', topics: ['culture', 'travel'], question: 'What do you want to say yes to more?', options: [
      ['learning', 'Learning & reading', ['group-friend-events', 'everyday-living', 'tactile-home-design', 'food-as-an-experience']],
      ['travel', 'Travel', ['adventure-active-travel', 'solo-travel']],
      ['social-plans', 'Social plans & GNO', ['group-friend-events', 'food-as-an-experience']],
    ] },
  ] },
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
export const STEPS = ['topics', 'about-you', 'collections', 'suggested-hunts'];
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
  if (!group) return null;
  const primaryTopic = selected.find(topic => group.topics.includes(topic));
  const question = group.questions.find(item => item.topics.length > 1 && item.topics.every(topic => selected.includes(topic)))
    || group.questions.find(item => item.topics.includes(primaryTopic));
  return { ...question, group: group.label };
}
export function onboardingSteps(topics = []) {
  return STEPS.filter(step => step !== 'about-you' || onboardingQuestion(topics));
}
export function readOnboardingRoute(hash = '') {
  const [requested, ...parts] = String(hash).replace(/^#/, '').split('/');
  const canonical = ['vibe', 'focus'].includes(requested) ? 'about-you' : requested === 'trend-setters' ? 'collections' : requested === 'review' ? 'suggested-hunts' : requested;
  const step = STEPS.includes(canonical) ? canonical : 'topics';
  return { step, editingReview: step === canonical && step !== 'suggested-hunts' && parts.includes('edit') };
}
export function onboardingStepHash(step, { editingReview = false } = {}) {
  step = STEPS.includes(step) ? step : 'topics';
  return `#${step}${editingReview && step !== 'suggested-hunts' ? '/edit' : ''}`;
}
export function cleanOnboardingAnswers(value = {}, question) {
  const candidates = question === undefined ? ONBOARDING_QUESTION_GROUPS.flatMap(group => group.questions) : question ? [question] : [];
  const answered = candidates.find(item => item.options.some(([id]) => id === value?.[item.id]));
  return answered ? { [answered.id]: value[answered.id] } : {};
}
export function readOnboardingAnswers(storage) {
  try { return cleanOnboardingAnswers(JSON.parse(storage.getItem(ONBOARDING_ANSWERS_KEY) || '{}')); }
  catch { return {}; }
}
export function cleanDraft(value = {}) {
  const topics = uniqueKnown(value?.topics, new Set(TOPICS.map(topic => topic.id)));
  const answers = cleanOnboardingAnswers(value?.answers, onboardingQuestion(topics));
  return {
    topics,
    collections: uniqueKnown(value?.collections, new Set(onboardingCollections(topics, answers).map(collection => collection.href))),
    answers,
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
export function resetOnboardingDraft(session) {
  try { session.removeItem(ONBOARDING_DRAFT_KEY); } catch {}
  try { session.removeItem(ONBOARDING_COMPLETE_KEY); } catch {}
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
// Curated neighboring interests fill a four-collection minimum after direct answer matches.
const relatedCollections = {
  'adventure-active-travel': ['solo-travel', 'food-as-an-experience', 'group-friend-events'],
  'solo-travel': ['adventure-active-travel', 'food-as-an-experience', 'group-friend-events'],
  'food-as-an-experience': ['group-friend-events', 'modern-hydration-caffeine', 'retailtainment-hubs'],
  'group-friend-events': ['food-as-an-experience', 'retailtainment-hubs', 'adventure-active-travel'],
  'sleep-medicine': ['health-technology', 'nervous-system-gym', 'regulated-living'],
  'health-technology': ['biohackers-body', 'sleep-medicine', 'preventive-health'],
  'biohackers-body': ['wellness-maxxing', 'health-technology', 'fitness-reset'],
  'nervous-system-gym': ['the-intuitive-body', 'sleep-medicine', 'modern-anxiety-care'],
  'the-intuitive-body': ['nervous-system-gym', 'gut-brain-axis', 'sleep-medicine'],
  'evidence-based-beauty': ['beauty-from-within', 'longevity', 'peptides'],
  'wellness-maxxing': ['biohackers-body', 'longevity', 'supplement-science'],
  longevity: ['preventive-health', 'wellness-maxxing', 'supplement-science'],
  'fitness-reset': ['cardio-and-its-health', 'biohackers-body', 'nervous-system-gym'],
  'modern-hydration-caffeine': ['protein-forward-eating', 'food-as-an-experience', 'metabolic-life'],
  'tactile-home-design': ['everyday-living', 'smart-home-energy', 'budgeted-living'],
  'smart-home-energy': ['tactile-home-design', 'everyday-living', 'ai-everyday-life'],
  'ai-everyday-life': ['smart-home-energy', 'health-technology', 'regulated-living'],
  'everyday-living': ['tactile-home-design', 'smart-home-energy', 'budgeted-living'],
  'budgeted-living': ['everyday-living', 'clean-living-control', 'tactile-home-design'],
  'protein-forward-eating': ['metabolic-life', 'gut-brain-axis', 'modern-hydration-caffeine'],
  'back-to-school-transitions': ['mind-body-for-families', 'everyday-living', 'modern-anxiety-care'],
};
const collectionHref = slug => slug === 'group-friend-events' ? 'collection.html' : `collection-${slug}.html`;
function expandCollections(slugs) {
  const expanded = [...new Set(slugs)];
  for (const slug of slugs) {
    for (const related of relatedCollections[slug] || []) {
      if (expanded.length >= 4) break;
      if (!expanded.includes(related)) expanded.push(related);
    }
    if (expanded.length >= 4) break;
  }
  return expanded.map(collectionHref).map(href => COLLECTIONS.find(collection => collection.href === href)).filter(Boolean);
}
export function onboardingCollections(topics = [], answers = {}) {
  const question = onboardingQuestion(topics);
  const answer = question?.options.find(([value]) => value === answers?.[question.id]);
  if (answer) return expandCollections(answer[2]);
  const defaults = ['andropause-hormonal-midlife', 'back-to-school-transitions', 'beauty-from-within', 'biohackers-body', 'evidence-based-beauty', 'longevity', 'retailtainment-hubs', 'ai-everyday-life'];
  const groups = [...new Set(topics)].map(topic => suggestions[topic]).filter(Boolean);
  // Give every chosen interest a turn before adding more from the same interest.
  // Never fill a personalized list with unrelated defaults just to reach eight.
  const ranked = groups.length
    ? Array.from({ length: Math.max(...groups.map(group => group.length)) }, (_, index) => groups.map(group => group[index]).filter(Boolean)).flat()
    : defaults;
  return expandCollections([...new Set(ranked)].slice(0, Math.max(8, groups.length)));
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
