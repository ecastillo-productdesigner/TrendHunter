// Browser-local recommendation feedback for the prototype; no account service.
export const RECOMMENDATION_FEEDBACK_KEY = 'trendhunter.recommendation-feedback.v1';
const cleanLinks = values => Array.isArray(values) ? [...new Set(values.filter(value => typeof value === 'string' && /^[a-z0-9-]+\.html$/.test(value)))] : [];
export function readRecommendationFeedback(storage) {
  try {
    const value = JSON.parse((storage ?? globalThis.localStorage).getItem(RECOMMENDATION_FEEDBACK_KEY) || '{}');
    return { hiddenStories: cleanLinks(value.hiddenStories), preferredCollections: cleanLinks(value.preferredCollections) };
  } catch { return { hiddenStories: [], preferredCollections: [] }; }
}
export function saveRecommendationFeedback(story, collection, action, storage) {
  const value = readRecommendationFeedback(storage);
  if (!cleanLinks([story]).length || !cleanLinks([collection]).length || !['more', 'less', 'undo'].includes(action)) return null;
  if (action === 'less') {
    value.hiddenStories = value.hiddenStories.includes(story) ? value.hiddenStories.filter(href => href !== story) : [...value.hiddenStories, story];
    value.preferredCollections = value.preferredCollections.filter(href => href !== collection);
  }
  else {
    value.hiddenStories = value.hiddenStories.filter(href => href !== story);
    if (action === 'more') value.preferredCollections = value.preferredCollections.includes(collection) ? value.preferredCollections.filter(href => href !== collection) : [...value.preferredCollections, collection];
  }
  try { (storage ?? globalThis.localStorage).setItem(RECOMMENDATION_FEEDBACK_KEY, JSON.stringify(value)); return value; }
  catch { return null; }
}
export function resetRecommendationFeedback(storage) {
  try {
    (storage ?? globalThis.localStorage).removeItem(RECOMMENDATION_FEEDBACK_KEY);
    return true;
  } catch { return false; }
}
export function rankRecommendationSlots(items, feedback, collectionFor) {
  const stories = items.map((item, index) => ({ item, index, collection: collectionFor(item) }))
    .filter(item => item.collection !== null)
    .sort((a, b) => Number(feedback.preferredCollections.includes(b.collection)) - Number(feedback.preferredCollections.includes(a.collection)) || a.index - b.index);
  let next = 0;
  return items.map(item => collectionFor(item) === null ? item : stories[next++].item);
}
// Keep recommendation stories after the opening three; discovery modules keep their slots.
export function placeRecommendations(items, metadataFor) {
  const stories = items.filter(item => metadataFor(item) !== null);
  const recommended = stories.filter(item => metadataFor(item).recommended);
  const ranked = stories.filter(item => !metadataFor(item).recommended);
  recommended.forEach((item,index) => ranked.splice(Math.min(3+index*5,ranked.length),0,item));
  let next = 0;
  return items.map(item => metadataFor(item) === null ? item : ranked[next++]);
}
