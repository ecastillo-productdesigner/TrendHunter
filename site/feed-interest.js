import { aboutYouQuestionMarkup } from './about-you-question.js?v=1';
import { ONBOARDING_ANSWERS_KEY } from './onboarding-state.js?v=main-onboarding-11';
import { TOPIC_STORAGE_KEY } from './feed-personalization.js?v=topics-9';
import { MEMBER_INTEREST_KEY, GUEST_INTEREST_KEY, GUEST_ANSWERS_KEY, readFeedQuestion, saveFeedAnswer, countInterestMatches, feedStoryInterestText } from './feed-interest-state.js?v=about-you-2';

const card = document.querySelector('[data-feed-interest]');
if (card) {
  const form = card.querySelector('form');
  const choices = card.querySelector('[data-interest-choices]');
  const submit = card.querySelector('[data-interest-submit]');
  const editor = card.querySelector('[data-interest-editor]');
  const result = card.querySelector('[data-interest-result]');
  const error = card.querySelector('[data-interest-error]');
  const edit = card.querySelector('[data-interest-edit]');
  const signedIn = () => window.isSignedIn?.() === true;
  let question, answer = '', saved = false, dirty = false;

  function sync() {
    editor.hidden = saved;
    result.hidden = !saved;
    submit.disabled = !answer;
    for (const button of choices.querySelectorAll('[data-about-you-answer]')) button.setAttribute('aria-pressed', String(button.value === answer));
  }
  function restore() {
    ({ question, answer } = readFeedQuestion(signedIn()));
    saved = false;
    dirty = false;
    error.hidden = true;
    choices.innerHTML = aboutYouQuestionMarkup(question, answer);
    sync();
  }
  choices.addEventListener('click', event => {
    const button = event.target.closest('[data-about-you-answer]');
    if (!button) return;
    answer = answer === button.value ? '' : button.value;
    dirty = true;
    error.hidden = true;
    sync();
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!answer) return;
    const value = saveFeedAnswer(answer, signedIn());
    if (!value) {
      error.textContent = 'Your answer couldn’t be saved. Please try again.';
      error.hidden = false;
      return;
    }
    dirty = false;
    document.dispatchEvent(new Event('feed-interest-updated'));
    const items = [...document.querySelectorAll('.feed-list > li')].filter(item => !item.hidden);
    const count = countInterestMatches(items, value.interest.text, feedStoryInterestText);
    card.querySelector('[data-interest-result-heading]').textContent = count ? 'Feed tuned' : 'Answer saved';
    card.querySelector('[data-interest-result-copy]').textContent = count
      ? `We found ${count} matching ${count === 1 ? 'story' : 'stories'} to prioritize in your feed.`
      : 'No matching stories yet. You can change your answer anytime.';
    card.querySelector('[data-interest-response]').textContent = value.label;
    saved = true;
    sync();
    edit.focus({ preventScroll: true });
  });
  edit.addEventListener('click', () => {
    saved = false;
    error.hidden = true;
    sync();
    choices.querySelector('[aria-pressed="true"], [data-about-you-answer]')?.focus({ preventScroll: true });
  });
  document.addEventListener('auth-change', restore);
  document.addEventListener('feed-topics-updated', restore);
  window.addEventListener('pageshow', event => { if (event.persisted) restore(); });
  window.addEventListener('storage', event => {
    if (event.key === TOPIC_STORAGE_KEY || (!dirty && [MEMBER_INTEREST_KEY, GUEST_INTEREST_KEY, ONBOARDING_ANSWERS_KEY, GUEST_ANSWERS_KEY, null].includes(event.key))) restore();
  });
  restore();
}
