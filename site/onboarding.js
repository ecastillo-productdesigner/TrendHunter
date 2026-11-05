import { TOPICS, STEPS, readOnboardingDraft, saveOnboardingDraft, onboardingCollections, onboardingCreators, completeOnboarding, onboardingSelectionCount, skipOnboardingStep } from './onboarding-state.js?v=6';
import { COLLECTIONS } from './collection-data.js';
import { PEOPLE } from './people-data.js';

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
let furthest = Math.max(0, STEPS.indexOf(location.hash.slice(1)));
let step = 'topics';
const topicTile = (topic, summary = false) => `<${summary ? 'div' : 'button'} class="topic-tile" ${summary ? '' : 'type="button"'} data-topic="${topic.id}" ${summary ? 'data-selected="true"' : `data-choice="topics" data-value="${topic.id}" aria-pressed="${draft.topics.includes(topic.id)}"`}><span class="topic-icon" aria-hidden="true">${topic.icon}</span><span class="topic-label">${escapeText(topic.name)}</span></${summary ? 'div' : 'button'}>`;
const collectionChoice = collection => `<button class="pill-button onboarding-collection" type="button" data-choice="collections" data-value="${collection.href}" aria-pressed="${draft.collections.includes(collection.href)}">${escapeText(collection.name)}</button>`;
const creator = (person, summary = false) => `<${summary ? 'div' : 'button'} class="onboarding-person" ${summary ? '' : 'type="button"'} ${summary ? '' : `data-choice="people" data-value="${person.id}" aria-pressed="${draft.people.includes(person.id)}"`}><span class="onboarding-person-portrait"><img src="${person.image}" alt="" class="profile-avatar"></span>${summary ? `<span class="onboarding-summary-identity"><span class="onboarding-summary-name">${escapeText(person.name)}</span><span class="onboarding-summary-role">${escapeText(person.role)}</span></span>` : `<span class="profile-identity"><span class="profile-name">${escapeText(person.name)}</span><span class="profile-role">${escapeText(person.role)}</span></span>`}</${summary ? 'div' : 'button'}>`;

function syncChoices() {
  for (const button of choices.querySelectorAll('[data-choice]')) button.setAttribute('aria-pressed', String(draft[button.dataset.choice].includes(button.dataset.value)));
  if (step !== 'review') {
    const count = onboardingSelectionCount(draft, step);
    next.disabled = count === 0;
    const noun = step === 'trend-setters' ? 'trend setter' : step === 'topics' ? 'topic' : 'collection';
    status.textContent = `${count} ${noun}${count === 1 ? '' : 's'} selected`;
  }
}
function summary() {
  const people = PEOPLE.filter(person => person.kind === 'creators' && draft.people.includes(person.id));
  const topics = TOPICS.filter(topic => draft.topics.includes(topic.id));
  const collections = COLLECTIONS.filter(collection => draft.collections.includes(collection.href));
  choices.dataset.groups = [topics, collections, people].filter(group => group.length).length;
  return `${topics.length ? `<section class="onboarding-summary-group"><h2>Your topics</h2><div class="onboarding-summary-topics">${topics.map(topic => topicTile(topic, true)).join('')}</div></section>` : ''}
  ${collections.length ? `<section class="onboarding-summary-group"><h2>Collections</h2><ul class="onboarding-summary-collections">${collections.map(collection => `<li><span class="pill-button">${escapeText(collection.name)}</span></li>`).join('')}</ul></section>` : ''}
  ${people.length ? `<section class="onboarding-summary-group"><h2>Trend setters</h2><div class="onboarding-people">${people.map(person => creator(person, true)).join('')}</div></section>` : ''}
  ${!people.length && !topics.length && !collections.length ? '<p class="onboarding-empty">Start exploring, and choose your interests whenever you’re ready.</p><button class="onboarding-edit" type="button" data-edit="topics">Choose interests</button>' : ''}`;
}
function render({ focus = true } = {}) {
  const requested = location.hash.slice(1);
  step = STEPS.includes(requested) ? requested : 'topics';
  const index = STEPS.indexOf(step);
  furthest = Math.max(furthest, index);
  app.dataset.step = step;
  back.href = index ? `#${STEPS[index - 1]}` : 'feed.html';
  back.setAttribute('aria-label', index ? `Back to ${['Topics', 'Collections', 'Trend Setters'][index - 1]}` : 'Back to feed');
  const labels = ['Topics', 'Collections', 'Trend Setters'];
  progress.innerHTML = labels.map((label, i) => {
    const complete = i < index && onboardingSelectionCount(draft, STEPS[i]) > 0;
    return `<li><button type="button" class="onboarding-step" data-step="${STEPS[i]}" ${i > furthest ? 'disabled' : ''} ${i === index ? 'aria-current="step"' : ''} data-complete="${complete}"><span>${complete ? '<span class="onboarding-progress-check" aria-hidden="true"></span>' : ''}${label}</span><span class="onboarding-step-line" aria-hidden="true"></span></button></li>`;
  }).join('');
  const copy = {
    topics: ['What do you follow?', 'Shape your feed', 'You can choose your interests later in your profile.'],
    collections: ['Follow these collections', 'These are the collections other hunters are following now', 'You can choose collections to follow later in your profile.'],
    'trend-setters': ['Follow our trend setters', 'They will keep you up to date.', 'You can choose who to follow later in your profile.'],
    review: ['Great picks', draft.topics.length || draft.collections.length || draft.people.length ? 'These will show up on your feed first' : 'Your next discovery is waiting.', ''],
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
skip.addEventListener('click', () => {
  Object.assign(draft, skipOnboardingStep(draft, step));
  advance();
});
document.querySelector('[data-onboarding-form]').addEventListener('submit', event => {
  event.preventDefault();
  if (next.disabled) return;
  if (step !== 'review') { advance(); return; }
  if (!completeOnboarding(draft, storage, session, { keepDraft: true })) {
    error.textContent = 'Your choices could not be saved. Please try again.'; error.hidden = false; return;
  }
  next.disabled = true;
  // Keep any prediction calls, bookmarks and profile data already in this session.
  window.navigateWithAccountSetup('feed.html#for-you', { minimumDuration: 8000 });
});
window.addEventListener('hashchange', () => render());
render({ focus: false });

window.addEventListener('pageshow', event => { if (event.persisted) render({ focus: false }); });
