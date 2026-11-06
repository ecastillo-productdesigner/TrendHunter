// Private browser-local prototype feedback. A production service can replace this store.
export const ARTICLE_FEEDBACK_LIMIT = 1000;
export const ARTICLE_FEEDBACK_REASONS = Object.freeze({
  up: ['Factually correct', 'Easy to understand', 'Informative', 'Creative / Interesting', 'Other'],
  down: ['Factually incorrect', 'Hard to understand', 'Not informative', 'Not interesting', 'Other'],
});
const prefix = 'trendhunter.article-feedback.v1:';
const validStory = story => /^(?:trend(?:-[a-z0-9-]+)?|prediction-analysis-[a-z0-9-]+)\.html$/.test(story);
function clean(value) {
  if (!value || !['up', 'down'].includes(value.sentiment)) return null;
  return {
    sentiment: value.sentiment,
    reasons: [...new Set((Array.isArray(value.reasons) ? value.reasons : []).filter(reason => ARTICLE_FEEDBACK_REASONS[value.sentiment].includes(reason)))],
    comment: typeof value.comment === 'string' ? value.comment.trim().slice(0, ARTICLE_FEEDBACK_LIMIT) : '',
  };
}
export function readArticleFeedback(storage, story) {
  if (!validStory(story)) return null;
  try { return clean(JSON.parse(storage.getItem(prefix + story) || 'null')); } catch { return null; }
}
export function saveArticleFeedback(storage, story, value) {
  if (!validStory(story)) throw new Error('INVALID_STORY');
  const record = clean(value);
  if (value !== null && (!record || String(value.comment || '').trim().length > ARTICLE_FEEDBACK_LIMIT)) throw new Error('INVALID_FEEDBACK');
  storage.setItem(prefix + story, JSON.stringify(record));
  return record;
}
