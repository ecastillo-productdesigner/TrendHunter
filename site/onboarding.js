import { FEED_URL, articleUrl } from './onboarding-destinations.js';
import { TOPICS, STEPS, cleanDraft, resetOnboardingDraft, readOnboardingDraft, saveOnboardingDraft, onboardingCollections, completeOnboarding, onboardingSelectionCount, skipOnboardingStep, onboardingQuestion, onboardingSteps, readOnboardingRoute, onboardingStepHash } from './onboarding-state.js?v=standalone-1';
import { onboardingHunts, onboardingArticles } from './onboarding-hunts.js?v=standalone-1';

const app = document.querySelector('[data-onboarding]');
const progress = document.querySelector('[data-onboarding-progress]');
const back = document.querySelector('[data-onboarding-back]');
const heading = document.querySelector('#onboarding-heading');
const subtitle = document.querySelector('[data-onboarding-subtitle]');
const choices = document.querySelector('[data-onboarding-choices]');
const next = document.querySelector('[data-onboarding-next]');
const skip = document.querySelector('[data-onboarding-skip]');
const note = document.querySelector('[data-onboarding-note]');
const status = document.querySelector('[data-onboarding-status]');
const error = document.querySelector('[data-onboarding-error]');
// Storage access can be restricted. Keep the selection UI usable and report a failed final save.
let storage, session;
try { storage = localStorage; session = sessionStorage; } catch {}
const draft = readOnboardingDraft(storage, session);
const escapeText = text => String(text).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
let furthest = Math.max(0, STEPS.indexOf(readOnboardingRoute(location.hash).step));
let step = 'topics';
let editingReview = false;
let finishing = false;
const labels = { topics: 'Your interests', 'about-you': 'About you', collections: 'Collections', 'suggested-hunts': 'Suggested Hunts' };
const topicTile = topic => `<button class="topic-tile" type="button" data-topic="${topic.id}" data-choice="topics" data-value="${topic.id}" aria-pressed="${draft.topics.includes(topic.id)}"><span class="topic-icon" aria-hidden="true">${topic.icon}</span><span class="topic-label">${escapeText(topic.name)}</span></button>`;
const choicePill = (label, pressed, attributes, className = '', showCheck = true) => `<button class="pill-button onboarding-collection ${className}" type="button" ${attributes} aria-pressed="${pressed}"><span class="onboarding-collection-label">${escapeText(label)}</span>${showCheck ? '<span class="onboarding-collection-check" aria-hidden="true"></span>' : ''}</button>`;
const collectionChoice = collection => choicePill(collection.name, draft.collections.includes(collection.href), `data-choice="collections" data-value="${escapeText(collection.href)}"`);
// Reuse collection pills while keeping one answer and click-again deselection.
const questionChoices = question => `<fieldset class="onboarding-question"><legend tabindex="-1">${escapeText(question.question)}</legend><div class="onboarding-answer-options" data-options="${question.options.length}">${question.options.map(([value, label]) => choicePill(label, draft.answers[question.id] === value, `value="${escapeText(value)}" data-onboarding-answer="${escapeText(question.id)}"`, 'onboarding-answer', false)).join('')}</div></fieldset>`;

function syncChoices() {
  for (const button of choices.querySelectorAll('[data-choice]')) button.setAttribute('aria-pressed', String(draft[button.dataset.choice].includes(button.dataset.value)));
  for (const button of choices.querySelectorAll('[data-onboarding-answer]')) button.setAttribute('aria-pressed', String(draft.answers[button.dataset.onboardingAnswer] === button.value));
  if (step === 'suggested-hunts') return;
  const count = onboardingSelectionCount(draft, step);
  next.disabled = count === 0;
  if (step === 'about-you') {
    status.textContent = count ? 'Answer selected. Continue to collections.' : 'Choose one answer, or skip this question.';
    return;
  }
  const noun = step === 'topics' ? 'topic' : 'collection';
  status.textContent = `${count} ${noun}${count === 1 ? '' : 's'} selected`;
}
function suggestedHunts() {
  return `<ul class="onboarding-hunts" aria-label="Suggested hunts">${onboardingHunts(draft).map(hunt => `<li><a class="answers-suggestion" data-onboarding-hunt href="${escapeText(hunt.href)}"><span class="answers-sparkle" aria-hidden="true"></span><span>${escapeText(hunt.question)}</span></a></li>`).join('')}</ul><section class="onboarding-articles-section" aria-labelledby="onboarding-articles-heading"><h2 class="onboarding-articles-heading" id="onboarding-articles-heading">Or try these articles</h2><ul class="onboarding-articles changing-collection-story-list">${onboardingArticles(draft).map(story => `<li><a class="changing-collection-story-link" data-onboarding-article href="${escapeText(articleUrl(story.href))}"><img class="changing-collection-story-image" src="${escapeText(story.image)}" alt="" width="48" height="48" loading="lazy" decoding="async"><span class="changing-collection-story-title">${escapeText(story.title)}</span></a></li>`).join('')}</ul></section>`;
}
function render({ focus = true } = {}) {
  ({ step, editingReview } = readOnboardingRoute(location.hash));
  if (step === 'about-you' && !onboardingQuestion(draft.topics)) {
    location.replace(onboardingStepHash(editingReview ? 'suggested-hunts' : 'collections'));
    return;
  }
  const canonicalHash = onboardingStepHash(step, { editingReview });
  if (location.hash !== canonicalHash) history.replaceState(null, '', canonicalHash);
  const steps = onboardingSteps(draft.topics);
  const index = steps.indexOf(step);
  furthest = Math.max(furthest, editingReview ? STEPS.length - 1 : STEPS.indexOf(step));
  app.dataset.step = step;
  const previous = steps[index - 1];
  back.hidden = step === 'topics';
  back.href = editingReview ? '#suggested-hunts' : onboardingStepHash(previous || 'topics');
  back.setAttribute('aria-label', editingReview ? 'Back to Suggested Hunts' : index ? `Back to ${labels[previous]}` : 'Back');
  progress.innerHTML = STEPS.map(item => {
    const complete = STEPS.indexOf(item) < STEPS.indexOf(step) && onboardingSelectionCount(draft, item) > 0;
    return `<li><button type="button" class="onboarding-step" data-step="${item}" ${STEPS.indexOf(item) > furthest || (item === 'about-you' && !onboardingQuestion(draft.topics)) ? 'disabled' : ''} ${item === step ? 'aria-current="step"' : ''} data-complete="${complete}"><span>${complete ? '<span class="onboarding-progress-check" aria-hidden="true"></span>' : ''}${labels[item]}</span><span class="onboarding-step-line" aria-hidden="true"></span></button></li>`;
  }).join('');
  const copy = {
    topics: ['What topics interest you?', 'Pick as many as you like'],
    'about-you': ['Make this Hunt a Little More About You', ''],
    collections: ['Collections you’ll want to explore', ''],
    'suggested-hunts': ['Suggested Hunts', 'Pick a question to start exploring'],
  }[step];
  [heading.textContent, subtitle.textContent] = copy;
  subtitle.hidden = !copy[1];
  progress.closest('nav').hidden = false;
  skip.hidden = step === 'suggested-hunts';
  skip.textContent = 'Skip';
  note.hidden = true;
  document.querySelector('[data-onboarding-secondary]').hidden = step === 'suggested-hunts';
  error.hidden = true;
  next.textContent = step === 'suggested-hunts' ? 'Take me to the Feed' : 'Continue';
  next.hidden = false;
  next.disabled = false;
  choices.className = `onboarding-choices onboarding-choices--${step}`;
  if (step === 'topics') choices.innerHTML = `<div class="topic-grid" role="group" aria-label="Choose topics">${TOPICS.map(topic => topicTile(topic)).join('')}</div>`;
  else if (step === 'about-you') choices.innerHTML = questionChoices(onboardingQuestion(draft.topics));
  else if (step === 'collections') {
    const suggestions = onboardingCollections(draft.topics, draft.answers);
    choices.innerHTML = suggestions.length ? `<div class="onboarding-collections" role="group" aria-label="Choose collections">${suggestions.map(collectionChoice).join('')}</div>` : '<p class="onboarding-empty">No matching collections for this answer yet. You can skip to continue.</p>';
  }
  else { choices.innerHTML = suggestedHunts(); status.textContent = 'Choose one of four suggested hunts to open its answer.'; }
  syncChoices();
  if (focus) { (step === 'about-you' ? choices.querySelector('legend') : heading).focus({ preventScroll: true }); app.scrollIntoView({ block: 'start' }); }
}
function advance() {
  saveOnboardingDraft(draft, session);
  const steps = onboardingSteps(draft.topics);
  // Changing interests from Suggested Hunts asks the new question only if its answer is missing.
  const needsAnswer = step === 'topics' && onboardingQuestion(draft.topics) && !onboardingSelectionCount(draft, 'about-you');
  const destination = editingReview ? needsAnswer ? 'about-you' : 'suggested-hunts' : steps[Math.min(steps.indexOf(step) + 1, steps.length - 1)];
  location.hash = onboardingStepHash(destination, { editingReview: editingReview && destination !== 'suggested-hunts' });
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
  if (answer) {
    const question = answer.dataset.onboardingAnswer;
    draft.answers = draft.answers[question] === answer.value ? {} : { [question]: answer.value };
    Object.assign(draft, cleanDraft(draft));
    saveOnboardingDraft(draft, session);
    syncChoices();
    return;
  }
  const button = event.target.closest('[data-choice]');
  if (!button) return;
  const values = new Set(draft[button.dataset.choice]);
  if (values.has(button.dataset.value)) values.delete(button.dataset.value); else values.add(button.dataset.value);
  draft[button.dataset.choice] = [...values];
  // A different interest group must not inherit an answer to another question.
  Object.assign(draft, cleanDraft(draft));
  saveOnboardingDraft(draft, session);
  syncChoices();
});
progress.addEventListener('click', event => {
  const button = event.target.closest('[data-step]');
  if (button && !button.disabled) { saveOnboardingDraft(draft, session); location.hash = onboardingStepHash(button.dataset.step, { editingReview }); }
});
skip.addEventListener('click', () => {
  Object.assign(draft, skipOnboardingStep(draft, step));
  advance();
});
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
  Object.assign(draft, resetOnboardingDraft(session));
  furthest = 0;
  finishing = false;
  history.replaceState(null, '', '#topics');
  render();
  window.scrollTo({ top: 0 });
});
window.addEventListener('hashchange', () => render());
render({ focus: false });
window.addEventListener('pageshow', event => { if (event.persisted) { finishing = false; render({ focus: false }); } });

window.addEventListener('onboarding-setup-cancel', () => { finishing = false; render({ focus: false }); next.focus(); });
