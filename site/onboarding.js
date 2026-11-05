import { TOPICS, STEPS, readOnboardingDraft, saveOnboardingDraft, onboardingCollections, onboardingCreators, completeOnboarding } from './onboarding-state.js?v=3';
import { COLLECTIONS, interestLevel } from './collection-data.js';
import { PEOPLE } from './people-data.js';

const app = document.querySelector('[data-onboarding]');
const progress = document.querySelector('[data-onboarding-progress]');
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
let furthest = Math.max(0, STEPS.indexOf(location.hash.slice(1)));
let step = 'topics';
const topicTile = (topic, summary = false) => `<${summary ? 'div' : 'button'} class="topic-tile" ${summary ? '' : 'type="button"'} data-topic="${topic.id}" ${summary ? 'data-selected="true"' : `data-choice="topics" data-value="${topic.id}" aria-pressed="${draft.topics.includes(topic.id)}"`}><span class="topic-icon" aria-hidden="true">${topic.icon}</span><span class="topic-label">${escapeText(topic.name)}</span></${summary ? 'div' : 'button'}>`;
const momentum = collection => `<span class="collection-momentum collection-momentum--${collection.direction}" data-level="${interestLevel(collection.percentage)}" aria-hidden="true"><span class="collection-momentum-track"></span></span>`;
const collectionChoice = collection => `<button class="pill-button onboarding-collection" type="button" data-choice="collections" data-value="${collection.href}" aria-pressed="${draft.collections.includes(collection.href)}">${escapeText(collection.name)}${momentum(collection)}<span class="onboarding-selected-check" aria-hidden="true"></span></button>`;
const creator = (person, summary = false) => `<${summary ? 'div' : 'button'} class="onboarding-person" ${summary ? '' : 'type="button"'} ${summary ? '' : `data-choice="people" data-value="${person.id}" aria-pressed="${draft.people.includes(person.id)}"`}><span class="onboarding-person-portrait"><img src="${person.image}" alt="" class="profile-avatar"><span class="onboarding-selected-check" aria-hidden="true"></span></span><span class="onboarding-person-name">${escapeText(person.name)}</span>${summary ? '' : `<span class="onboarding-person-role">${escapeText(person.role)}</span>`}</${summary ? 'div' : 'button'}>`;
const selectionKey = () => step === 'trend-setters' ? 'people' : step;

function syncChoices() {
  for (const button of choices.querySelectorAll('[data-choice]')) button.setAttribute('aria-pressed', String(draft[button.dataset.choice].includes(button.dataset.value)));
  if (step !== 'review') {
    const count = step === 'trend-setters' ? draft.people.filter(id => PEOPLE.some(person => person.id === id && person.kind === 'creators')).length : draft[selectionKey()].length;
    next.disabled = count === 0;
    const noun = step === 'trend-setters' ? 'trend setter' : step === 'topics' ? 'topic' : 'collection';
    status.textContent = `${count} ${noun}${count === 1 ? '' : 's'} selected`;
  }
}
function summary() {
  const people = PEOPLE.filter(person => person.kind === 'creators' && draft.people.includes(person.id));
  const topics = TOPICS.filter(topic => draft.topics.includes(topic.id));
  const collections = COLLECTIONS.filter(collection => draft.collections.includes(collection.href));
  return `${people.length ? `<section class="onboarding-summary-group"><h2 class="visually-hidden">Trend setters</h2><div class="onboarding-people">${people.map(person => creator(person, true)).join('')}</div><button class="onboarding-edit" type="button" data-edit="trend-setters">Edit trend setters</button></section>` : ''}
  ${topics.length ? `<section class="onboarding-summary-group"><h2 class="visually-hidden">Topics</h2><div class="onboarding-summary-topics">${topics.map(topic => topicTile(topic, true)).join('')}</div><button class="onboarding-edit" type="button" data-edit="topics">Edit topics</button></section>` : ''}
  ${collections.length ? `<section class="onboarding-summary-group"><h2 class="visually-hidden">Collections</h2><ul class="onboarding-summary-collections">${collections.map(collection => `<li><span class="pill-button">${escapeText(collection.name)}${momentum(collection)}</span></li>`).join('')}</ul><button class="onboarding-edit" type="button" data-edit="collections">Edit collections</button></section>` : ''}
  ${!people.length && !topics.length && !collections.length ? '<p class="onboarding-empty">Start exploring, and choose your interests whenever you’re ready.</p><button class="onboarding-edit" type="button" data-edit="topics">Choose interests</button>' : ''}`;
}
function render({ focus = true } = {}) {
  const requested = location.hash.slice(1);
  step = STEPS.includes(requested) ? requested : 'topics';
  const index = STEPS.indexOf(step);
  furthest = Math.max(furthest, index);
  app.dataset.step = step;
  const labels = ['Topics', 'Collections', 'Trend Setters'];
  progress.innerHTML = labels.map((label, i) => `<li><button type="button" class="onboarding-step" data-step="${STEPS[i]}" ${i > furthest ? 'disabled' : ''} ${i === index ? 'aria-current="step"' : ''} data-complete="${i < index}"><span>${i < index ? '<span class="onboarding-progress-check" aria-hidden="true"></span>' : ''}${label}</span><span class="onboarding-step-line" aria-hidden="true"></span></button></li>`).join('');
  const copy = {
    topics: ['What do you follow?', 'Shape your feed', 'You can choose your interests later in your profile.'],
    collections: ['Follow these collections', 'Go deeper into the topics that interest you.', 'You can choose collections to follow later in your profile.'],
    'trend-setters': ['Follow our trend setters', 'They will keep you up to date.', 'You can choose who to follow later in your profile.'],
    review: ['Great picks', draft.topics.length || draft.collections.length || draft.people.length ? 'Your hunt is taking shape.' : 'Your next discovery is waiting.', ''],
  }[step];
  [heading.textContent, subtitle.textContent, note.textContent] = copy;
  progress.closest('nav').hidden = step === 'review';
  skip.hidden = step === 'review';
  note.hidden = step === 'review';
  document.querySelector('[data-onboarding-secondary]').hidden = step === 'review';
  error.hidden = true;
  next.textContent = step === 'review' ? 'See your feed' : 'Continue';
  next.disabled = false;
  choices.className = `onboarding-choices onboarding-choices--${step}`;
  if (step === 'topics') choices.innerHTML = `<div class="topic-grid" role="group" aria-label="Choose topics">${TOPICS.map(topic => topicTile(topic)).join('')}</div>`;
  else if (step === 'collections') choices.innerHTML = `<div class="onboarding-collections" role="group" aria-label="Choose collections">${onboardingCollections(draft.topics, draft.collections).map(collectionChoice).join('')}</div>`;
  else if (step === 'trend-setters') choices.innerHTML = `<div class="onboarding-people" role="group" aria-label="Choose trend setters">${onboardingCreators(draft.people).map(person => creator(person)).join('')}</div>`;
  else { choices.innerHTML = summary(); status.textContent = 'Review your selected topics, collections and trend setters.'; }
  syncChoices();
  if (focus) { heading.focus({ preventScroll: true }); app.scrollIntoView({ block: 'start' }); }
}
function advance() {
  saveOnboardingDraft(draft, session);
  location.hash = STEPS[Math.min(STEPS.indexOf(step) + 1, STEPS.length - 1)];
}
choices.addEventListener('click', event => {
  const edit = event.target.closest('[data-edit]');
  if (edit) { location.hash = edit.dataset.edit; return; }
  const button = event.target.closest('[data-choice]');
  if (!button) return;
  const values = new Set(draft[button.dataset.choice]);
  if (values.has(button.dataset.value)) values.delete(button.dataset.value); else values.add(button.dataset.value);
  draft[button.dataset.choice] = [...values];
  saveOnboardingDraft(draft, session);
  syncChoices();
});
progress.addEventListener('click', event => {
  const button = event.target.closest('[data-step]');
  if (button && !button.disabled) { saveOnboardingDraft(draft, session); location.hash = button.dataset.step; }
});
skip.addEventListener('click', advance);
document.querySelector('[data-onboarding-form]').addEventListener('submit', event => {
  event.preventDefault();
  if (next.disabled) return;
  if (step !== 'review') { advance(); return; }
  if (!completeOnboarding(draft, storage, session)) {
    error.textContent = 'Your choices could not be saved. Please try again.'; error.hidden = false; return;
  }
  // Keep any prediction calls, bookmarks and profile data already in this session.
  location.assign('feed.html#for-you');
});
window.addEventListener('hashchange', () => render());
render({ focus: false });
