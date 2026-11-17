import { COLLECTIONS } from './collection-data.js';
import { PEOPLE } from './people-data.js';
import { TOPIC_STORAGE_KEY, readSelectedTopics } from './feed-personalization.js?v=topics-9';
import { FOLLOWED_COLLECTIONS_KEY, readFollowedCollections } from './collection-follow-state.js';
import { PEOPLE_FOLLOW_KEY, readFollowing } from './people-follow-state.js';

// Curated prototype suggestions and fictional creators; no live popularity claims.
export const ONBOARDING_DRAFT_KEY = 'trendhunter.onboarding-draft.v2';
export const ONBOARDING_COMPLETE_KEY = 'trendhunter.onboarding-complete.v1';
export const ONBOARDING_ANSWERS_KEY = 'trendhunter.onboarding-answers.v1';
export const ONBOARDING_FOCUS_KEY = 'trendhunter.onboarding-focus.v1';
export const ONBOARDING_FOCUS_MAX_LENGTH = 500;
export const ONBOARDING_FOCUS_PROMPTS = [
  { id: 'daily-trend', label: 'Daily trend', question: 'If we could send you one perfect trend every morning, what would it be about?', placeholder: 'My perfect morning trend would be about…' },
  { id: 'here-to', label: 'Here to…', question: 'Finish the sentence: “I came here to…”', placeholder: 'I came here to…' },
  { id: 'talk-for-hours', label: 'Talk for hours', question: 'What’s a topic you could talk about for an hour without getting bored?', placeholder: 'I could talk for hours about…' },
  { id: 'weekly-needs', label: 'This week’s needs', question: 'Rank these by how much you need them this week: rest, inspiration, a good deal, a new obsession.', placeholder: 'Put rest, inspiration, deals and obsessions in order…' },
];
export const ONBOARDING_QUESTIONS = [
  { id: 'intent', question: 'Are you here to improve yourself, upgrade your weekend, or dive down a rabbit hole?', options: [
    ['improve-yourself', 'Improve yourself'], ['upgrade-weekend', 'Upgrade your weekend'], ['rabbit-hole', 'Dive down a rabbit hole'],
  ] },
  { id: 'energy', question: 'Pick your current energy:', options: [
    ['new-me', 'New year, new me'], ['cozy', 'Cozy and unbothered'], ['group-chat', "Where’s the group chat going?"],
  ] },
  { id: 'soundtrack', question: 'If your week had a theme song, would it be a hype track, a slow burn, or total chaos?', options: [
    ['hype-track', 'A hype track'], ['slow-burn', 'A slow burn'], ['total-chaos', 'Total chaos'],
  ] },
  { id: 'free-hour', question: 'You’ve got one free hour and zero obligations. Spa, side project, or spontaneous plan?', options: [
    ['spa', 'Spa'], ['side-project', 'Side project'], ['spontaneous-plan', 'Spontaneous plan'],
  ] },
  { id: 'trend-signal', question: 'What makes a trend to you?', options: [
    ['everywhere', 'When it’s everywhere I look'], ['feels-like-me', 'When it just feels like me'], ['early-adopter', 'When I was into it before it blew up'],
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
export const STEPS = ['topics', 'vibe', 'focus', 'collections', 'trend-setters', 'review'];
export function readOnboardingRoute(hash = '') {
  const [requested, question, mode] = String(hash).replace(/^#/, '').split('/');
  const step = STEPS.includes(requested) ? requested : 'topics';
  return {
    step,
    editingReview: step !== 'review' && (question === 'edit' || mode === 'edit'),
    questionIndex: step === 'vibe' ? Math.max(0, ONBOARDING_QUESTIONS.findIndex(item => item.id === question)) : 0,
  };
}
export function onboardingStepHash(step, { questionIndex = 0, editingReview = false } = {}) {
  step = STEPS.includes(step) ? step : 'topics';
  const question = step === 'vibe' && questionIndex > 0 ? ONBOARDING_QUESTIONS[questionIndex]?.id : '';
  return `#${step}${question ? `/${question}` : ''}${editingReview && step !== 'review' ? '/edit' : ''}`;
}
const uniqueKnown = (values, known) => Array.isArray(values) ? [...new Set(values.filter(value => known.has(value)))] : [];
export function cleanOnboardingAnswers(value = {}) {
  return Object.fromEntries(ONBOARDING_QUESTIONS.flatMap(question => question.options.some(([id]) => id === value?.[question.id]) ? [[question.id, value[question.id]]] : []));
}
export function readOnboardingAnswers(storage) {
  try { return cleanOnboardingAnswers(JSON.parse(storage.getItem(ONBOARDING_ANSWERS_KEY) || '{}')); }
  catch { return {}; }
}
export function cleanOnboardingFocus(value = {}) {
  return {
    text: typeof value?.text === 'string' ? value.text.slice(0, ONBOARDING_FOCUS_MAX_LENGTH) : '',
    prompt: ONBOARDING_FOCUS_PROMPTS.some(prompt => prompt.id === value?.prompt) ? value.prompt : '',
  };
}
export function readOnboardingFocus(storage) {
  try { return cleanOnboardingFocus(JSON.parse(storage.getItem(ONBOARDING_FOCUS_KEY) || '{}')); }
  catch { return cleanOnboardingFocus(); }
}
export function cleanDraft(value = {}) {
  return {
    topics: uniqueKnown(value?.topics, new Set(TOPICS.map(topic => topic.id))),
    collections: uniqueKnown(value?.collections, new Set(COLLECTIONS.map(collection => collection.href))),
    people: uniqueKnown(value?.people, new Set(PEOPLE.map(person => person.id))),
    answers: cleanOnboardingAnswers(value?.answers),
    focus: cleanOnboardingFocus(value?.focus),
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
  if (step === 'vibe') return Object.keys(clean.answers).length;
  if (step === 'focus') return clean.focus.text.trim() ? 1 : 0;
  if (step === 'trend-setters') return clean.people.filter(id => PEOPLE.some(person => person.id === id && person.kind === 'creators')).length;
  return clean[step]?.length || 0;
}
export function skipOnboardingStep(draft, step) {
  const clean = cleanDraft(draft);
  const key = step === 'trend-setters' ? 'people' : step;
  if (step === 'vibe') clean.answers = {};
  else if (step === 'focus') clean.focus = cleanOnboardingFocus();
  else if (Object.hasOwn(clean, key)) clean[key] = [];
  return clean;
}
export function skipOnboardingQuestion(draft, questionIndex) {
  const clean = cleanDraft(draft);
  const question = ONBOARDING_QUESTIONS[questionIndex];
  if (question) delete clean.answers[question.id];
  return clean;
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
export function onboardingCreators(selected = []) {
  const ids = [...new Set(['nadia-patel', 'owen-brooks', 'daniel-reed', 'maya-chen', ...selected])];
  return ids.map(id => PEOPLE.find(person => person.id === id && person.kind === 'creators')).filter(Boolean);
}
export function completeOnboarding(draft, storage, session, { keepDraft = false } = {}) {
  const clean = cleanDraft(draft);
  // Onboarding adds follows; skipping a step never removes existing preferences.
  const topics = clean.topics.length ? clean.topics : readSelectedTopics(storage);
  const collections = [...new Set([...readFollowedCollections(storage), ...clean.collections])];
  const people = [...new Set([...readFollowing(storage), ...clean.people])];
  const answers = { ...readOnboardingAnswers(storage), ...clean.answers };
  const focus = clean.focus.text.trim() ? { ...clean.focus, text: clean.focus.text.trim() } : readOnboardingFocus(storage);
  const writes = [[TOPIC_STORAGE_KEY, topics], [FOLLOWED_COLLECTIONS_KEY, collections], [PEOPLE_FOLLOW_KEY, people], [ONBOARDING_ANSWERS_KEY, answers], [ONBOARDING_FOCUS_KEY, focus]];
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
