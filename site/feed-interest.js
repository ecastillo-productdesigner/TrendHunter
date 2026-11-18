import { aboutYouQuestionMarkup } from './about-you-question.js?v=1';
import { ONBOARDING_ANSWERS_KEY } from './onboarding-state.js?v=main-onboarding-11';
import { TOPIC_STORAGE_KEY } from './feed-personalization.js?v=topics-9';
import { MEMBER_INTEREST_KEY, GUEST_INTEREST_KEY, GUEST_ANSWERS_KEY, VIBE_ANSWERS_KEY, VIBE_QUESTION_STATE_KEY, readFeedQuestion, showNextFeedQuestion, dismissFeedQuestion, saveFeedAnswer } from './feed-interest-state.js?v=vibe-questions-3';

const card = document.querySelector('[data-feed-interest]');
if (card) {
  const slot = card.closest('.feed-interest-slot');
  const choices = card.querySelector('[data-interest-choices]');
  const error = card.querySelector('[data-interest-error]');
  const signedIn = () => window.isSignedIn?.() === true;
  let question, hidden = false, saving = false;

  function render(state) {
    ({ question, hidden } = state);
    slot.hidden = hidden;
    error.hidden = true;
    choices.innerHTML = aboutYouQuestionMarkup(question, state.answer);
  }
  const restore = () => render(readFeedQuestion(signedIn()));
  choices.addEventListener('click', event => {
    const button = event.target.closest('[data-about-you-answer]');
    if (!button || saving) return;
    saving = true;
    const value = saveFeedAnswer(button.value, signedIn(), {}, question);
    saving = false;
    if (!value) {
      error.textContent = 'Your answer couldn’t be saved. Please try again.';
      error.hidden = false;
      return;
    }
    dismissFeedQuestion(signedIn(), question.id);
    hidden = true;
    slot.hidden = true;
    document.dispatchEvent(new Event('feed-interest-updated'));
    window.showToast?.('Answer saved. Your feed has been updated.');
    const items = [...slot.parentElement.children];
    const next = items.slice(items.indexOf(slot) + 1).find(item => !item.hidden && item.querySelector('.trend-card-title-link'));
    (next?.querySelector('.trend-card-title-link') || document.querySelector('[data-feed-tabs] [aria-selected="true"]'))?.focus({ preventScroll: true });
  });
  document.addEventListener('vibe-questions-show', () => {
    render(showNextFeedQuestion(signedIn()));
    document.dispatchEvent(new Event('feed-interest-show'));
    requestAnimationFrame(() => {
      card.scrollIntoView({ block: 'center', behavior: 'auto' });
      choices.querySelector('legend')?.focus({ preventScroll: true });
    });
  });
  document.addEventListener('auth-change', restore);
  document.addEventListener('feed-topics-updated', restore);
  window.addEventListener('pageshow', event => { if (event.persisted) restore(); });
  window.addEventListener('storage', event => {
    if ([TOPIC_STORAGE_KEY, MEMBER_INTEREST_KEY, GUEST_INTEREST_KEY, ONBOARDING_ANSWERS_KEY, GUEST_ANSWERS_KEY, VIBE_ANSWERS_KEY, VIBE_QUESTION_STATE_KEY, null].includes(event.key)) restore();
  });
  restore();
}
