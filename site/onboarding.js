import { FEED_URL, articleUrl } from './onboarding-destinations.js';
import { STEPS, ONBOARDING_QUESTION_GROUPS, cleanDraft, resetOnboardingDraft, readOnboardingDraft, saveOnboardingDraft, completeOnboarding, onboardingSelectionCount, skipOnboardingStep, onboardingQuestion, readOnboardingRoute, onboardingStepHash } from './onboarding-state.js?v=three-questions-9';
import { onboardingHunts, onboardingArticles } from './onboarding-hunts.js?v=three-questions-9';

const app = document.querySelector('[data-onboarding]');
const progress = document.querySelector('[data-onboarding-progress]');
const back = document.querySelector('[data-onboarding-back]');
const heading = document.querySelector('#onboarding-heading');
const subtitle = document.querySelector('[data-onboarding-subtitle]');
const choices = document.querySelector('[data-onboarding-choices]');
const next = document.querySelector('[data-onboarding-next]');
const skip = document.querySelector('[data-onboarding-skip]');
const status = document.querySelector('[data-onboarding-status]');
const error = document.querySelector('[data-onboarding-error]');
let storage, session;
try { storage = localStorage; session = sessionStorage; } catch {}
const draft = readOnboardingDraft(storage, session);
saveOnboardingDraft(draft, session);
const escapeText = text => String(text).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
let step = readOnboardingRoute(location.hash).step;
let furthest = Math.max(draft.furthest, STEPS.indexOf(step));
let finishing = false;
const labels = Object.fromEntries([...ONBOARDING_QUESTION_GROUPS.map(group => [group.id, group.label]), ['suggested-hunts', 'Suggested Hunts']]);
const currentQuestion = () => onboardingQuestion(draft.topics, step, draft.preferredCollections);
// Reuse the same dark collection-pill treatment for every hypothetical answer.
const questionChoices = question => `<fieldset class="onboarding-question"><legend tabindex="-1">${escapeText(question.question)}</legend><div class="onboarding-collections onboarding-answer-options" data-options="${question.options.length}">${question.options.map(([value, label]) => `<button class="pill-button onboarding-collection onboarding-answer" type="button" value="${escapeText(value)}" data-onboarding-answer="${question.id}" aria-pressed="${draft.answers[question.id] === value}"><span class="onboarding-collection-label">${escapeText(label)}</span></button>`).join('')}</div></fieldset>`;
function syncChoices() {
  for (const button of choices.querySelectorAll('[data-onboarding-answer]')) button.setAttribute('aria-pressed', String(draft.answers[button.dataset.onboardingAnswer] === button.value));
  if (step === 'suggested-hunts') return;
  next.disabled = !onboardingSelectionCount(draft, step);
  status.textContent = next.disabled ? 'Choose one answer, or skip this question.' : 'Answer selected. Continue when you’re ready.';
}
function huntQuestionLabel(question) {
  const [firstWord] = question.split(' ');
  return `<span class="onboarding-hunt-label"><span class="onboarding-hunt-lead"><span class="answers-sparkle" aria-hidden="true"></span>${escapeText(firstWord)}</span>${escapeText(question.slice(firstWord.length))}</span>`;
}
function suggestedHunts() {
  return `<ul class="onboarding-hunts" aria-label="Suggested hunts">${onboardingHunts(draft).map(hunt => `<li><a class="answers-suggestion" data-onboarding-hunt href="${escapeText(hunt.href)}">${huntQuestionLabel(hunt.question)}</a></li>`).join('')}</ul><section class="onboarding-articles-section" aria-labelledby="onboarding-articles-heading"><h2 class="onboarding-articles-heading" id="onboarding-articles-heading">Or try these articles</h2><ul class="onboarding-articles changing-collection-story-list">${onboardingArticles(draft).map(story => `<li><a class="changing-collection-story-link" data-onboarding-article href="${escapeText(articleUrl(story.href))}"><img class="changing-collection-story-image" src="${escapeText(story.image)}" alt="" width="48" height="48" loading="lazy" decoding="async"><span class="changing-collection-story-title">${escapeText(story.title)}</span></a></li>`).join('')}</ul></section>`;
}
function render({ focus = true } = {}) {
  ({ step } = readOnboardingRoute(location.hash));
  const canonical = onboardingStepHash(step);
  if (location.hash !== canonical) history.replaceState(null, '', canonical);
  const index = STEPS.indexOf(step);
  furthest = Math.max(furthest, index);
  draft.furthest = furthest;
  saveOnboardingDraft(draft, session);
  app.dataset.step = step;
  const final = step === 'suggested-hunts';
  back.hidden = index === 0;
  back.href = onboardingStepHash(STEPS[Math.max(0, index - 1)]);
  back.setAttribute('aria-label', index ? `Back to ${labels[STEPS[index - 1]]}` : 'Back');
  progress.innerHTML = STEPS.map((item, position) => {
    const current = position === index;
    const passed = position < index;
    const complete = passed && onboardingSelectionCount(draft, item) > 0;
    const state = current ? 'current' : complete ? 'complete' : passed ? 'skipped' : 'upcoming';
    const description = current ? 'Current step' : complete ? 'Completed' : passed ? 'Skipped' : 'Upcoming step';
    return `<li data-state="${state}" data-complete="${complete}"><button type="button" class="onboarding-step" data-step="${item}" ${position > furthest ? 'disabled' : ''} ${current ? 'aria-current="step"' : ''} data-complete="${complete}" aria-label="${labels[item]}, ${description}"><span class="onboarding-step-node" aria-hidden="true">${complete ? '<span class="onboarding-progress-check"></span>' : position + 1}</span><span class="onboarding-step-label">${labels[item]}</span></button></li>`;
  }).join('');
  heading.textContent = final ? 'Start with a hunt' : 'Make this Hunt a Little More About You';
  subtitle.hidden = true;
  subtitle.textContent = '';
  skip.hidden = final;
  document.querySelector('[data-onboarding-secondary]').hidden = final;
  error.hidden = true;
  next.textContent = final ? 'Take me to the Feed' : 'Continue';
  next.disabled = false;
  choices.className = `onboarding-choices onboarding-choices--${step}`;
  choices.innerHTML = final ? suggestedHunts() : questionChoices(currentQuestion());
  if (final) status.textContent = 'Choose one of four suggested hunts to open its answer.';
  syncChoices();
  if (focus) { (final ? heading : choices.querySelector('legend')).focus({ preventScroll: true }); app.scrollIntoView({ block: 'start' }); }
}
function advance() {
  saveOnboardingDraft(draft, session);
  location.hash = onboardingStepHash(STEPS[Math.min(STEPS.indexOf(step) + 1, STEPS.length - 1)]);
}
choices.addEventListener('click', event => {
  const hunt = event.target.closest('[data-onboarding-hunt], [data-onboarding-article]');
  if (hunt) {
    if (!completeOnboarding(draft, storage, session)) {
      event.preventDefault();
      error.textContent = 'Your choices could not be saved. Please try again.';
      error.hidden = false;
    }
    return;
  }
  const answer = event.target.closest('[data-onboarding-answer]');
  if (!answer) return;
  const question = currentQuestion();
  if (draft.answers[question.id] === answer.value) delete draft.answers[question.id];
  else draft.answers[question.id] = answer.value;
  Object.assign(draft, cleanDraft(draft));
  saveOnboardingDraft(draft, session);
  syncChoices();
});
progress.addEventListener('click', event => {
  const button = event.target.closest('[data-step]');
  if (button && !button.disabled) { saveOnboardingDraft(draft, session); location.hash = onboardingStepHash(button.dataset.step); }
});
skip.addEventListener('click', () => { Object.assign(draft, skipOnboardingStep(draft, step)); advance(); });
document.querySelector('[data-onboarding-form]').addEventListener('submit', event => {
  event.preventDefault();
  if (next.disabled) return;
  if (step !== 'suggested-hunts') { advance(); return; }
  if (finishing) return;
  if (!completeOnboarding(draft, storage, session, { keepDraft: true })) {
    error.textContent = 'Your choices could not be saved. Please try again.';
    error.hidden = false;
    return;
  }
  finishing = true;
  next.disabled = true;
  window.navigateWithAccountSetup(FEED_URL, { minimumDuration: 8000 });
});
document.querySelector('[data-onboarding-restart]').addEventListener('click', () => {
  Object.assign(draft, resetOnboardingDraft(session, storage));
  furthest = 0;
  finishing = false;
  history.replaceState(null, '', onboardingStepHash(STEPS[0]));
  render();
  window.scrollTo({ top: 0 });
});
window.addEventListener('hashchange', () => render());
window.addEventListener('pageshow', event => { if (event.persisted) { finishing = false; render({ focus: false }); } });
window.addEventListener('onboarding-setup-cancel', () => { finishing = false; render({ focus: false }); next.focus(); });
render({ focus: false });
