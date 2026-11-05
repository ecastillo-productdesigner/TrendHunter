import { COLLECTIONS } from './collection-data.js';
import { PEOPLE } from './people-data.js';
import { TOPIC_STORAGE_KEY, readSelectedTopics } from './feed-personalization.js?v=topics-9';
import { FOLLOWED_COLLECTIONS_KEY, readFollowedCollections } from './collection-follow-state.js';
import { PEOPLE_FOLLOW_KEY, readFollowing } from './people-follow-state.js';

// Curated prototype suggestions and fictional creators; no live popularity claims.
export const ONBOARDING_DRAFT_KEY = 'trendhunter.onboarding-draft.v2';
export const ONBOARDING_COMPLETE_KEY = 'trendhunter.onboarding-complete.v1';
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
export const STEPS = ['topics', 'collections', 'trend-setters', 'review'];
const uniqueKnown = (values, known) => Array.isArray(values) ? [...new Set(values.filter(value => known.has(value)))] : [];
export function cleanDraft(value = {}) {
  return {
    topics: uniqueKnown(value?.topics, new Set(TOPICS.map(topic => topic.id))),
    collections: uniqueKnown(value?.collections, new Set(COLLECTIONS.map(collection => collection.href))),
    people: uniqueKnown(value?.people, new Set(PEOPLE.map(person => person.id))),
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
  if (step === 'trend-setters') return clean.people.filter(id => PEOPLE.some(person => person.id === id && person.kind === 'creators')).length;
  return clean[step]?.length || 0;
}
export function skipOnboardingStep(draft, step) {
  const clean = cleanDraft(draft);
  const key = step === 'trend-setters' ? 'people' : step;
  if (Object.hasOwn(clean, key)) clean[key] = [];
  return clean;
}
const suggestions = {
  beauty: ['evidence-based-beauty', 'beauty-from-within', 'longevity'],
  'home-living': ['smart-home-energy', 'tactile-home-design', 'budgeted-living', 'everyday-living'],
  'food-drink': ['protein-forward-eating', 'food-as-an-experience', 'modern-hydration-caffeine'],
  wellness: ['longevity', 'nervous-system-gym', 'sleep-medicine'],
  'family-parenting': ['back-to-school-transitions', 'mind-body-for-families', 'modern-anxiety-care'],
  tech: ['ai-everyday-life', 'health-technology', 'smart-home-energy'],
  fitness: ['fitness-reset', 'biohackers-body', 'cardio-and-its-health'],
  culture: ['retailtainment-hubs', 'everyday-living'],
  travel: ['adventure-active-travel', 'solo-travel'],
};
export function onboardingCollections(topics, selected = []) {
  const defaults = ['andropause-hormonal-midlife', 'back-to-school-transitions', 'beauty-from-within', 'biohackers-body', 'evidence-based-beauty', 'longevity', 'retailtainment-hubs', 'ai-everyday-life'];
  const preferred = [...new Set([...topics.flatMap(topic => suggestions[topic] || []), ...defaults])].slice(0, 8).map(slug => `collection-${slug}.html`);
  return [...new Set([...preferred, ...selected])].map(href => COLLECTIONS.find(collection => collection.href === href)).filter(Boolean);
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
  const writes = [[TOPIC_STORAGE_KEY, topics], [FOLLOWED_COLLECTIONS_KEY, collections], [PEOPLE_FOLLOW_KEY, people]];
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
