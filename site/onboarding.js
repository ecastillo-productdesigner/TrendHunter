import { TOPICS, STEPS, cleanDraft, readOnboardingDraft, saveOnboardingDraft, onboardingCollections, completeOnboarding, onboardingSelectionCount, skipOnboardingStep, onboardingHasPicks, onboardingQuestion, onboardingSteps, readOnboardingRoute, onboardingStepHash } from './onboarding-state.js?v=12';
import { COLLECTIONS } from './collection-data.js';

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
const labels = { topics: 'Your interests', 'about-you': 'About you', collections: 'Collections' };
const mobileSummary = window.matchMedia('(max-width: 959px)');
function placeSummaryAction() {
  const actions = document.querySelector('.onboarding-actions');
  if (step === 'review' && mobileSummary.matches) choices.before(actions);
  else choices.after(actions);
}
mobileSummary.addEventListener('change', placeSummaryAction);
const topicTile = (topic, summary = false) => `<${summary ? 'div' : 'button'} class="topic-tile" ${summary ? '' : 'type="button"'} data-topic="${topic.id}" ${summary ? 'data-selected="true"' : `data-choice="topics" data-value="${topic.id}" aria-pressed="${draft.topics.includes(topic.id)}"`}><span class="topic-icon" aria-hidden="true">${topic.icon}</span><span class="topic-label">${escapeText(topic.name)}</span></${summary ? 'div' : 'button'}>`;
const collectionChoice = collection => `<button class="pill-button onboarding-collection" type="button" data-choice="collections" data-value="${collection.href}" aria-pressed="${draft.collections.includes(collection.href)}">${escapeText(collection.name)}</button>`;
const answerLabel = question => escapeText(question.options.find(([id]) => id === draft.answers[question.id])?.[1] || '');
// Reuse one native radio-tile component for every question group.
const questionChoices = question => `<fieldset class="onboarding-question"><legend tabindex="-1">${escapeText(question.question)}</legend><div class="onboarding-answer-options" data-options="${question.options.length}">${question.options.map(([value, label]) => `<label class="onboarding-answer"><input class="visually-hidden" type="radio" name="onboarding-answer" value="${value}" data-onboarding-answer="${question.id}" ${draft.answers[question.id] === value ? 'checked' : ''}><span class="onboarding-answer-surface"><span class="onboarding-answer-indicator" aria-hidden="true"></span><span>${escapeText(label)}</span></span></label>`).join('')}</div></fieldset>`;

function syncChoices() {
  for (const button of choices.querySelectorAll('[data-choice]')) button.setAttribute('aria-pressed', String(draft[button.dataset.choice].includes(button.dataset.value)));
  if (step === 'review') return;
  const count = onboardingSelectionCount(draft, step);
  next.disabled = count === 0;
  if (step === 'about-you') {
    status.textContent = count ? 'Answer selected. Continue to collections.' : 'Choose one answer, or skip this question.';
    return;
  }
  const noun = step === 'topics' ? 'topic' : 'collection';
  status.textContent = `${count} ${noun}${count === 1 ? '' : 's'} selected`;
}
function summary() {
  const topics = TOPICS.filter(topic => draft.topics.includes(topic.id));
  const collections = COLLECTIONS.filter(collection => draft.collections.includes(collection.href));
  const question = onboardingQuestion(draft.topics);
  choices.dataset.groups = [topics, collections].filter(group => group.length).length;
  return `${topics.length ? `<section class="onboarding-summary-group"><h2>Your topics</h2><div class="onboarding-summary-topics onboarding-summary-picks">${topics.map(topic => topicTile(topic, true)).join('')}</div><button class="onboarding-summary-add" type="button" data-edit="topics" aria-label="Add more topics">Add More</button></section>` : ''}
  ${collections.length ? `<section class="onboarding-summary-group"><h2>Collections</h2><ul class="onboarding-summary-collections onboarding-summary-picks">${collections.map(collection => `<li><span class="pill-button">${escapeText(collection.name)}</span></li>`).join('')}</ul><button class="onboarding-summary-add" type="button" data-edit="collections" aria-label="Add more collections">Add More</button></section>` : ''}
  ${question && draft.answers[question.id] ? `<section class="onboarding-summary-group onboarding-summary-answer"><h2>Your answer</h2><dl class="onboarding-summary-answers onboarding-summary-picks"><div><dt>${escapeText(question.question)}</dt><dd>${answerLabel(question)}</dd></div></dl><button class="onboarding-summary-add" type="button" data-edit="about-you">Change answer</button></section>` : ''}
  ${!onboardingHasPicks(draft) ? '<p class="onboarding-empty">Start exploring, and choose your interests whenever you’re ready.</p><button class="onboarding-edit" type="button" data-edit="topics">Choose interests</button>' : ''}`;
}
function render({ focus = true } = {}) {
  ({ step, editingReview } = readOnboardingRoute(location.hash));
  if (step === 'about-you' && !onboardingQuestion(draft.topics)) {
    location.replace(onboardingStepHash(editingReview ? 'review' : 'collections'));
    return;
  }
  const canonicalHash = onboardingStepHash(step, { editingReview });
  if (location.hash !== canonicalHash) history.replaceState(null, '', canonicalHash);
  placeSummaryAction();
  const steps = onboardingSteps(draft.topics);
  const index = steps.indexOf(step);
  furthest = Math.max(furthest, editingReview ? STEPS.length - 1 : STEPS.indexOf(step));
  app.dataset.step = step;
  const previous = steps[index - 1];
  back.href = editingReview ? '#review' : index ? onboardingStepHash(previous) : 'feed.html';
  back.setAttribute('aria-label', editingReview ? 'Back to Great picks' : index ? `Back to ${labels[previous]}` : 'Back to feed');
  progress.innerHTML = steps.filter(item => item !== 'review').map(item => {
    const complete = steps.indexOf(item) < index && onboardingSelectionCount(draft, item) > 0;
    return `<li><button type="button" class="onboarding-step" data-step="${item}" ${STEPS.indexOf(item) > furthest ? 'disabled' : ''} ${item === step ? 'aria-current="step"' : ''} data-complete="${complete}"><span>${complete ? '<span class="onboarding-progress-check" aria-hidden="true"></span>' : ''}${labels[item]}</span><span class="onboarding-step-line" aria-hidden="true"></span></button></li>`;
  }).join('');
  const copy = {
    topics: ['What topics interest you?', 'Your picks shape the stories and predictions you see.'],
    'about-you': ['A little more you', ''],
    collections: ['Collections you will like', 'Based on your interests, here are collections to follow.'],
    review: ['Great picks', 'Review your picks before you start exploring.'],
  }[step];
  [heading.textContent, subtitle.textContent] = copy;
  subtitle.hidden = !copy[1];
  progress.closest('nav').hidden = step === 'review';
  skip.hidden = step === 'review';
  skip.textContent = step === 'about-you' ? 'Skip question' : 'Skip';
  note.hidden = true;
  document.querySelector('[data-onboarding-secondary]').hidden = step === 'review';
  error.hidden = true;
  next.textContent = step === 'review' ? 'See your feed' : 'Continue';
  next.disabled = false;
  choices.className = `onboarding-choices onboarding-choices--${step}`;
  if (step === 'topics') choices.innerHTML = `<div class="topic-grid" role="group" aria-label="Choose topics">${TOPICS.map(topic => topicTile(topic)).join('')}</div>`;
  else if (step === 'about-you') choices.innerHTML = questionChoices(onboardingQuestion(draft.topics));
  else if (step === 'collections') choices.innerHTML = `<div class="onboarding-collections" role="group" aria-label="Choose collections">${onboardingCollections(draft.topics, draft.collections).map(collectionChoice).join('')}</div>`;
  else { choices.innerHTML = summary(); status.textContent = 'Review your selected topics, answer and collections.'; }
  syncChoices();
  if (step === 'review' && !onboardingHasPicks(draft) && finish()) return;
  if (focus) { (step === 'about-you' ? choices.querySelector('legend') : heading).focus({ preventScroll: true }); app.scrollIntoView({ block: 'start' }); }
}
function advance() {
  saveOnboardingDraft(draft, session);
  const steps = onboardingSteps(draft.topics);
  // Changing interests in review asks the new question only if its answer is missing.
  const needsAnswer = step === 'topics' && onboardingQuestion(draft.topics) && !onboardingSelectionCount(draft, 'about-you');
  const destination = editingReview ? needsAnswer ? 'about-you' : 'review' : steps[Math.min(steps.indexOf(step) + 1, steps.length - 1)];
  if (destination === 'review' && !onboardingHasPicks(draft) && finish()) return;
  location.hash = onboardingStepHash(destination, { editingReview: editingReview && destination !== 'review' });
}
choices.addEventListener('click', event => {
  const edit = event.target.closest('[data-edit]');
  if (edit) { location.hash = onboardingStepHash(edit.dataset.edit, { editingReview: true }); return; }
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
choices.addEventListener('change', event => {
  const input = event.target.closest('[data-onboarding-answer]');
  if (!input?.checked) return;
  draft.answers = { [input.dataset.onboardingAnswer]: input.value };
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
  if (step !== 'review') { advance(); return; }
  finish();
});
function finish() {
  if (finishing) return true;
  if (!completeOnboarding(draft, storage, session, { keepDraft: true })) {
    error.textContent = 'Your choices could not be saved. Please try again.'; error.hidden = false; return false;
  }
  finishing = true;
  next.disabled = true;
  // Keep any prediction calls, bookmarks and profile data already in this session.
  window.navigateWithAccountSetup('feed.html#for-you', { minimumDuration: 8000 });
  return true;
}
window.addEventListener('hashchange', () => render());
render({ focus: false });
window.addEventListener('pageshow', event => { if (event.persisted) { finishing = false; render({ focus: false }); } });
