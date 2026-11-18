import test from 'node:test';
import assert from 'node:assert/strict';
import { MEMBER_INTEREST_KEY, GUEST_INTEREST_KEY, GUEST_ANSWERS_KEY, VIBE_ANSWERS_KEY, readFeedInterest, saveFeedInterest, readFeedQuestion, showNextFeedQuestion, dismissFeedQuestion, saveFeedAnswer, rankInterestStories, countInterestMatches, feedStoryInterestText } from '../site/feed-interest-state.js';
import { readOnboardingFocus, readOnboardingAnswers, ONBOARDING_ANSWERS_KEY } from '../site/onboarding-state.js';
import { TOPIC_STORAGE_KEY } from '../site/feed-personalization.js';
import { guestFeedOrder } from '../site/guest-feed-order.js';

const memory = () => {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
};
test('member interests reuse onboarding focus while guest interests stay tab-local and separate', () => {
  const stores = { member: memory(), guest: memory() };
  stores.member.setItem(MEMBER_INTEREST_KEY, '{"text":"Beauty","prompt":"daily-trend"}');
  assert.deepEqual(readFeedInterest(true, stores), readOnboardingFocus(stores.member));
  assert.deepEqual(readFeedInterest(false, stores), { text: '', prompt: '' });
  assert.deepEqual(saveFeedInterest({ text: '  AI gadgets  ', prompt: 'talk-for-hours' }, false, stores), { text: 'AI gadgets', prompt: 'talk-for-hours' });
  assert.equal(stores.guest.getItem(MEMBER_INTEREST_KEY), null);
  assert.ok(stores.guest.getItem(GUEST_INTEREST_KEY));
  assert.equal(readFeedInterest(true, stores).text, 'Beauty');
  saveFeedInterest({ text: 'Sleep', prompt: 'weekly-needs' }, true, stores);
  assert.deepEqual(readOnboardingFocus(stores.member), { text: 'Sleep', prompt: 'weekly-needs' });
  assert.equal(readFeedInterest(false, stores).text, 'AI gadgets');
});
test('blank or blocked saves cannot report success or overwrite the prior interest', () => {
  const stores = { member: memory(), guest: memory() };
  saveFeedInterest({ text: 'Sleep' }, true, stores);
  assert.equal(saveFeedInterest({ text: ' \t ' }, true, stores), null);
  assert.equal(readFeedInterest(true, stores).text, 'Sleep');
  const blocked = { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); } };
  assert.equal(saveFeedInterest({ text: 'AI' }, false, { guest: blocked }), null);
  assert.deepEqual(readFeedInterest(false, { guest: blocked }), { text: '', prompt: '' });
  stores.member.setItem(MEMBER_INTEREST_KEY, 'bad json');
  assert.deepEqual(readFeedInterest(true, stores), { text: '', prompt: '' });
});
test('keyword ranking is stable, preserves discovery slots, and never duplicates or mutates nodes', () => {
  const module = { module: 'composer' };
  const items = [{ text: 'Travel ideas' }, module, { text: 'AI and sleep routines' }, { text: 'Sleep wellness' }, { text: 'AI tools' }];
  const textFor = item => item.text ?? null;
  const ranked = rankInterestStories(items, 'I’m interested in AI sleep', textFor);
  assert.deepEqual(ranked.map(item => item.text || item.module), ['AI and sleep routines', 'composer', 'Sleep wellness', 'AI tools', 'Travel ideas']);
  assert.equal(ranked[1], module);
  assert.equal(new Set(ranked).size, items.length);
  assert.equal(items[0].text, 'Travel ideas');
  assert.equal(countInterestMatches(items, 'AI sleep', textFor), 3);
});
test('AI matches whole words, accents normalize, and unmatched or generic responses preserve order', () => {
  const items = [{ text: 'Retail brands' }, { text: 'AI shopping assistants' }, { text: 'Café culture' }];
  const textFor = item => item.text;
  assert.equal(countInterestMatches(items, 'AI', textFor), 1, 'AI must not match inside retail');
  assert.equal(rankInterestStories(items, 'cafe', textFor)[0], items[2]);
  for (const text of ['', 'I came here to find a new trend', 'astronomy']) {
    assert.deepEqual(rankInterestStories(items, text, textFor), items);
    assert.equal(countInterestMatches(items, text, textFor), 0);
  }
});
test('searchable metadata uses the actual topic labels, so AI also matches Tech & AI stories', () => {
  const story = { dataset: { topics: 'tech' }, querySelector: selector => ({ textContent: selector === '.trend-card-title-link' ? 'Sleep earbuds are evolving' : 'Regulated Living' }) };
  const item = { querySelector: () => story };
  assert.equal(countInterestMatches([item], 'AI', feedStoryInterestText), 1);
  assert.equal(countInterestMatches([item], 'sleep', feedStoryInterestText), 1);
  assert.equal(countInterestMatches([item], 'beauty', feedStoryInterestText), 0);
});
test('the shared About you card occurs once between guest stories and before the video modules', () => {
  const stories = Array.from({ length: 8 }, (_, i) => ({ kind: 'story', id: i }));
  const interest = { kind: 'interest' }, collections = { kind: 'collections' }, videos = { kind: 'videos' };
  const items = [...stories.slice(0, 3), interest, videos, ...stories.slice(3), collections];
  const ranked = guestFeedOrder(items, item => item.kind);
  assert.deepEqual(ranked.slice(0, 4), [...stories.slice(0, 3), collections]);
  assert.ok(ranked.indexOf(stories[4]) < ranked.indexOf(interest));
  assert.ok(ranked.indexOf(interest) < ranked.indexOf(videos));
  assert.equal(ranked.filter(item => item === interest).length, 1);
  assert.equal(new Set(ranked).size, items.length);
});

test('feed questions reuse member topics and answers; guests get an isolated general fallback', () => {
  const stores = { member: memory(), guest: memory() };
  stores.member.setItem(TOPIC_STORAGE_KEY, '["wellness"]');
  stores.member.setItem(ONBOARDING_ANSWERS_KEY, '{"wellness-try":"sleep-tape"}');
  assert.equal(readFeedQuestion(true, stores).question.id, 'wellness-try');
  assert.equal(readFeedQuestion(true, stores).answer, 'sleep-tape');
  const guest = readFeedQuestion(false, stores);
  assert.equal(guest.question.id, 'experiences-style');
  assert.equal(guest.answer, '');
  assert.ok(guest.question.options.length >= 4);
  assert.equal(stores.guest.getItem(TOPIC_STORAGE_KEY), null);
});

test('a saved answer updates the shared member response and maps to collection story ranking', () => {
  const stores = { member: memory(), guest: memory() };
  stores.member.setItem(TOPIC_STORAGE_KEY, '["wellness"]');
  const saved = saveFeedAnswer('sleep-tape', true, stores);
  assert.equal(saved.label, 'Sleep tape');
  assert.equal(readFeedQuestion(true, stores).answer, 'sleep-tape');
  assert.deepEqual(readOnboardingAnswers(stores.member), { 'wellness-try': 'sleep-tape' });
  assert.equal(readFeedInterest(true, stores).text, saved.interest.text);
  const items = [{ text: 'Adventure travel' }, { text: 'Sleep Medicine' }, { module: true }];
  assert.equal(rankInterestStories(items, saved.interest.text, item => item.text ?? null)[0], items[1]);
  assert.equal(stores.member.getItem('trendhunter.followed-collections.v1'), null, 'answering does not follow collections');
  stores.member.setItem(TOPIC_STORAGE_KEY, '["travel"]');
  assert.equal(readFeedQuestion(true, stores).question.id, 'dream-trip');
  assert.equal(readFeedQuestion(true, stores).answer, '', 'a stale answer cannot preselect a different question');
});

test('guest answers stay tab-local, never overwrite member answers and reject invalid values', () => {
  const stores = { member: memory(), guest: memory() };
  stores.member.setItem(ONBOARDING_ANSWERS_KEY, '{"wellness-try":"cold-plunge"}');
  assert.equal(saveFeedAnswer('not-an-option', false, stores), null);
  assert.equal(saveFeedAnswer('planner', false, stores).label, 'The planner');
  assert.equal(readFeedQuestion(false, stores).answer, 'planner');
  assert.ok(stores.guest.getItem(GUEST_ANSWERS_KEY));
  assert.equal(stores.member.getItem(GUEST_ANSWERS_KEY), null);
  assert.deepEqual(readOnboardingAnswers(stores.member), { 'wellness-try': 'cold-plunge' });
  assert.equal(stores.member.getItem(MEMBER_INTEREST_KEY), null);
});

test('failed answer writes roll back both the saved answer and ranking interest', () => {
  const member = memory();
  member.setItem(TOPIC_STORAGE_KEY, '["wellness"]');
  member.setItem(MEMBER_INTEREST_KEY, '{"text":"Travel","prompt":""}');
  member.setItem(ONBOARDING_ANSWERS_KEY, '{"wellness-try":"cold-plunge"}');
  const failing = { ...member, setItem(key, value) { if (key === ONBOARDING_ANSWERS_KEY) throw Error('full'); member.setItem(key, value); } };
  assert.equal(saveFeedAnswer('sleep-tape', true, { member: failing }), null);
  assert.equal(readFeedInterest(true, { member }).text, 'Travel');
  assert.equal(readFeedQuestion(true, { member }).answer, 'cold-plunge');
  const blocked = { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); } };
  assert.equal(readFeedQuestion(true, { member: blocked }).answer, '');
  assert.equal(saveFeedAnswer('planner', true, { member: blocked }), null);
});

test('Show Vibe Questions rotates through the relevant group without immediate repeats or preselection', () => {
  const stores = { member: memory(), guest: memory(), ui: memory() };
  stores.member.setItem(TOPIC_STORAGE_KEY, '["wellness"]');
  const initial = readFeedQuestion(true, stores);
  const seen = [initial.question.id];
  for (let i = 0; i < 2; i++) {
    const fresh = showNextFeedQuestion(true, stores);
    assert.equal(fresh.hidden, false);
    assert.equal(fresh.answer, '');
    assert.ok(fresh.question.options.length >= 4);
    assert.equal(fresh.question.group, 'Mind & Body');
    seen.push(fresh.question.id);
  }
  assert.equal(new Set(seen).size, 3);
  assert.equal(showNextFeedQuestion(true, stores).question.id, initial.question.id);
  stores.member.setItem(TOPIC_STORAGE_KEY, '["travel"]');
  const changed = readFeedQuestion(true, stores);
  assert.notEqual(showNextFeedQuestion(true, stores).question.id, changed.question.id, 'a changed topic group must also produce a fresh question');
});

test('successful dismissal survives reload; reopening shows a different question and keeps prior answers', () => {
  const stores = { member: memory(), guest: memory(), ui: memory() };
  stores.member.setItem(TOPIC_STORAGE_KEY, '["wellness"]');
  assert.ok(saveFeedAnswer('sleep-tape', true, stores));
  assert.equal(dismissFeedQuestion(true, 'wellness-try', stores), true);
  assert.equal(readFeedQuestion(true, stores).hidden, true);
  assert.equal(readFeedQuestion(false, stores).hidden, false, 'guest visibility is independent');
  const fresh = showNextFeedQuestion(true, stores);
  assert.equal(fresh.question.id, 'mind-body-style');
  assert.equal(readFeedQuestion(true, stores).hidden, false);
  assert.ok(saveFeedAnswer('feel-good', true, stores));
  const history = JSON.parse(stores.member.getItem(VIBE_ANSWERS_KEY));
  assert.equal(history['wellness-try'], 'sleep-tape');
  assert.equal(history['mind-body-style'], 'feel-good');
  assert.deepEqual(readOnboardingAnswers(stores.member), { 'wellness-try': 'sleep-tape' }, 'follow-up questions preserve the matching onboarding answer');
});

test('a failed follow-up history save rolls back ranking and does not dismiss the question', () => {
  const member = memory(), ui = memory();
  member.setItem(TOPIC_STORAGE_KEY, '["wellness"]');
  member.setItem(MEMBER_INTEREST_KEY, '{"text":"Travel","prompt":""}');
  const failing = { ...member, setItem(key, value) { if (key === VIBE_ANSWERS_KEY) throw Error('full'); member.setItem(key, value); } };
  const stores = { member: failing, ui };
  assert.equal(saveFeedAnswer('sleep-tape', true, stores), null);
  assert.equal(readFeedInterest(true, stores).text, 'Travel');
  assert.equal(readFeedQuestion(true, stores).hidden, false);
  assert.equal(member.getItem(ONBOARDING_ANSWERS_KEY), null);
});
