import { ONBOARDING_FOCUS_KEY, ONBOARDING_ANSWERS_KEY, ONBOARDING_QUESTION_GROUPS, TOPICS, cleanOnboardingFocus, cleanOnboardingAnswers, onboardingQuestion, onboardingCollections } from './onboarding-state.js?v=main-onboarding-11';
import { readSelectedTopics } from './feed-personalization.js?v=topics-9';

export { ONBOARDING_FOCUS_KEY as MEMBER_INTEREST_KEY };
export const GUEST_INTEREST_KEY = 'trendhunter.guest-focus.v1';
export const GUEST_ANSWERS_KEY = 'trendhunter.guest-about-you.v1';
export const VIBE_ANSWERS_KEY = 'trendhunter.vibe-answers.v1';
export const VIBE_QUESTION_STATE_KEY = 'trendhunter.vibe-question-state.v1';

function interestStore(signedIn, stores) {
  return signedIn
    ? { storage: stores.member ?? globalThis.localStorage, key: ONBOARDING_FOCUS_KEY }
    : { storage: stores.guest ?? globalThis.sessionStorage, key: GUEST_INTEREST_KEY };
}
export function readFeedInterest(signedIn, stores = {}) {
  try {
    const { storage, key } = interestStore(signedIn, stores);
    return cleanOnboardingFocus(JSON.parse(storage.getItem(key) || '{}'));
  } catch { return cleanOnboardingFocus(); }
}
export function saveFeedInterest(value, signedIn, stores = {}) {
  const clean = cleanOnboardingFocus(value);
  clean.text = clean.text.trim();
  if (!clean.text) return null;
  try {
    const { storage, key } = interestStore(signedIn, stores);
    storage.setItem(key, JSON.stringify(clean));
    return clean;
  } catch { return null; }
}

const readObject = (storage, key) => {
  try {
    const value = JSON.parse(storage.getItem(key) || '{}');
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  } catch { return {}; }
};
function questionContext(signedIn, stores) {
  let storage;
  try { ({ storage } = interestStore(signedIn, stores)); } catch {}
  const topics = signedIn ? readSelectedTopics(storage) : [];
  // This fallback chooses a general question, not an inferred topic preference.
  const initial = onboardingQuestion(topics) || onboardingQuestion(['culture']);
  const group = ONBOARDING_QUESTION_GROUPS.find(group => group.label === initial.group);
  const pool = group.questions.map(question => ({ ...question, group: group.label }));
  let ui;
  try { ui = stores.ui ?? stores.guest ?? globalThis.sessionStorage; } catch {}
  const scope = signedIn ? 'member' : 'guest';
  const states = readObject(ui, VIBE_QUESTION_STATE_KEY);
  return { storage, topics, initial, pool, ui, scope, states, state: states[scope] || {} };
}
function writeQuestionState(context, state) {
  try { context.ui.setItem(VIBE_QUESTION_STATE_KEY, JSON.stringify({ ...context.states, [context.scope]: state })); return true; }
  catch { return false; }
}
export function readFeedQuestion(signedIn, stores = {}) {
  const context = questionContext(signedIn, stores);
  const { storage, initial, pool, state } = context;
  const question = pool.find(question => question.id === state.id) || initial;
  const history = readObject(storage, signedIn ? VIBE_ANSWERS_KEY : GUEST_ANSWERS_KEY);
  const answers = signedIn ? { ...readObject(storage, ONBOARDING_ANSWERS_KEY), ...history } : history;
  return { question, answer: state.fresh ? '' : cleanOnboardingAnswers(answers, question)[question.id] || '', hidden: state.hidden === true };
}
export function showNextFeedQuestion(signedIn, stores = {}) {
  const context = questionContext(signedIn, stores);
  const currentId = context.pool.some(question => question.id === context.state.id) ? context.state.id : context.initial.id;
  const current = context.pool.findIndex(question => question.id === currentId);
  const question = context.pool[(current + 1) % context.pool.length];
  writeQuestionState(context, { id: question.id, hidden: false, fresh: true });
  return { question, answer: '', hidden: false };
}
export function dismissFeedQuestion(signedIn, questionId, stores = {}) {
  const context = questionContext(signedIn, stores);
  return writeQuestionState(context, { id: questionId, hidden: true, fresh: false });
}
export function saveFeedAnswer(value, signedIn, stores = {}, displayedQuestion) {
  const context = questionContext(signedIn, stores);
  const question = displayedQuestion
    ? context.pool.find(question => question.id === displayedQuestion.id)
    : readFeedQuestion(signedIn, stores).question;
  const option = question?.options.find(([id]) => id === value);
  if (!option) return null;
  const answers = { [question.id]: value };
  const collections = onboardingCollections(question.topics, answers);
  // Curated answer-to-collection labels rank existing stories; no AI profile is inferred.
  const interest = { text: [option[1], ...collections.map(collection => collection.name)].join(', '), prompt: '' };
  let storage, key;
  try { ({ storage, key } = interestStore(signedIn, stores)); } catch { return null; }
  const historyKey = signedIn ? VIBE_ANSWERS_KEY : GUEST_ANSWERS_KEY;
  const history = { ...readObject(storage, historyKey), ...answers };
  const writes = [[key, interest], [historyKey, history]];
  // Preserve the onboarding response when answering a different follow-up question.
  if (signedIn && onboardingQuestion(context.topics)?.id === question.id) writes.push([ONBOARDING_ANSWERS_KEY, answers]);
  const previous = new Map();
  try {
    for (const [name] of writes) previous.set(name, storage.getItem(name));
    for (const [name, data] of writes) storage.setItem(name, JSON.stringify(data));
  } catch {
    for (const [name, data] of previous) {
      try { if (data === null) storage.removeItem(name); else storage.setItem(name, data); } catch {}
    }
    return null;
  }
  return { answer: value, label: option[1], interest };
}

// Local keyword ranking of existing prototype stories, not a recommendation service.
const ignored = new Set('a an and are as at be been but by can came could do for from get have here how i im in interested is it its just like me my new of on one or our perfect right that the their them there these they this to trend trends us want was we what when where which who will with would you your'.split(' '));
const words = text => String(text || '').normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
const termsFor = text => [...new Set(words(text).filter(word => word.length > 1 && !ignored.has(word)))];
function score(text, terms) {
  const tokens = new Set(words(text));
  return terms.filter(term => tokens.has(term)).length;
}
export function rankInterestStories(items, interest, textFor) {
  const terms = termsFor(interest);
  if (!terms.length) return [...items];
  const stories = items.map((item, index) => ({ item, index, text: textFor(item) }))
    .filter(story => story.text !== null)
    .map(story => ({ ...story, score: score(story.text, terms) }))
    .sort((a, b) => b.score - a.score || a.index - b.index);
  let index = 0;
  return items.map(item => textFor(item) === null ? item : stories[index++].item);
}
export function countInterestMatches(items, interest, textFor) {
  const terms = termsFor(interest);
  if (!terms.length) return 0;
  return items.filter(item => {
    const text = textFor(item);
    return text !== null && score(text, terms) > 0;
  }).length;
}
const topicNames = new Map(TOPICS.map(topic => [topic.id, topic.name]));
export function feedStoryInterestText(item) {
  const story = item.querySelector(':scope > .trend-card');
  if (!story) return null;
  const topics = (story.dataset.topics || '').split(/\s+/).map(id => topicNames.get(id) || id).join(' ');
  return [topics, story.querySelector('.trend-card-title-link')?.textContent, story.querySelector('.trend-card-collection-label')?.textContent].filter(Boolean).join(' ');
}
