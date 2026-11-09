import { TOPICS, STEPS, readOnboardingDraft, saveOnboardingDraft, onboardingCollections, onboardingCreators, completeOnboarding, onboardingSelectionCount, skipOnboardingStep, onboardingHasPicks } from './onboarding-state.js?v=7';
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
let furthest = Math.max(0, STEPS.indexOf(location.hash.slice(1).split('/')[0]));
let step = 'topics';
let editingReview = false;
let finishing = false;
const mobileSummary = window.matchMedia('(max-width: 959px)');
function placeSummaryAction() {
  const actions = document.querySelector('.onboarding-actions');
  if (step === 'review' && mobileSummary.matches) choices.before(actions);
  else choices.after(actions);
}
mobileSummary.addEventListener('change', placeSummaryAction);
const topicTile = (topic, summary = false) => `<${summary ? 'div' : 'button'} class="topic-tile" ${summary ? '' : 'type="button"'} data-topic="${topic.id}" ${summary ? 'data-selected="true"' : `data-choice="topics" data-value="${topic.id}" aria-pressed="${draft.topics.includes(topic.id)}"`}><span class="topic-icon" aria-hidden="true">${topic.icon}</span><span class="topic-label">${escapeText(topic.name)}</span></${summary ? 'div' : 'button'}>`;
const collectionChoice = collection => `<button class="pill-button onboarding-collection" type="button" data-choice="collections" data-value="${collection.href}" aria-pressed="${draft.collections.includes(collection.href)}">${escapeText(collection.name)}</button>`;
const creator = (person, summary = false) => `<${summary ? 'div' : 'button'} class="onboarding-person" ${summary ? '' : 'type="button"'} ${summary ? '' : `data-choice="people" data-value="${person.id}" aria-pressed="${draft.people.includes(person.id)}"`}><span class="onboarding-person-portrait"><img src="${person.image}" alt="" class="profile-avatar"></span><span class="profile-identity"><span class="profile-name">${escapeText(person.name)}</span><span class="profile-role">${escapeText(person.role)}</span></span></${summary ? 'div' : 'button'}>`;

function syncChoices() {
  for (const button of choices.querySelectorAll('[data-choice]')) button.setAttribute('aria-pressed', String(draft[button.dataset.choice].includes(button.dataset.value)));
  if (step !== 'review') {
    const count = onboardingSelectionCount(draft, step);
    next.disabled = count === 0;
    const noun = step === 'trend-setters' ? 'trendsetter' : step === 'topics' ? 'topic' : 'collection';
    status.textContent = `${count} ${noun}${count === 1 ? '' : 's'} selected`;
  }
}
function summary() {
  const people = PEOPLE.filter(person => person.kind === 'creators' && draft.people.includes(person.id));
  const topics = TOPICS.filter(topic => draft.topics.includes(topic.id));
  const collections = COLLECTIONS.filter(collection => draft.collections.includes(collection.href));
  choices.dataset.groups = [topics, collections, people].filter(group => group.length).length;
  return `${topics.length ? `<section class="onboarding-summary-group"><h2>Your topics</h2><div class="onboarding-summary-topics onboarding-summary-picks">${topics.map(topic => topicTile(topic, true)).join('')}</div><button class="onboarding-summary-add" type="button" data-edit="topics" aria-label="Add more topics">Add More</button></section>` : ''}
  ${collections.length ? `<section class="onboarding-summary-group"><h2>Collections</h2><ul class="onboarding-summary-collections onboarding-summary-picks">${collections.map(collection => `<li><span class="pill-button">${escapeText(collection.name)}</span></li>`).join('')}</ul><button class="onboarding-summary-add" type="button" data-edit="collections" aria-label="Add more collections">Add More</button></section>` : ''}
  ${people.length ? `<section class="onboarding-summary-group"><h2>Trendsetters</h2><div class="onboarding-people onboarding-summary-picks">${people.map(person => creator(person, true)).join('')}</div><button class="onboarding-summary-add" type="button" data-edit="trend-setters" aria-label="Add more trendsetters">Add More</button></section>` : ''}
  ${!people.length && !topics.length && !collections.length ? '<p class="onboarding-empty">Start exploring, and choose your interests whenever you’re ready.</p><button class="onboarding-edit" type="button" data-edit="topics">Choose interests</button>' : ''}`;
}
function render({ focus = true } = {}) {
  const [requested, mode] = location.hash.slice(1).split('/');
  step = STEPS.includes(requested) ? requested : 'topics';
  editingReview = mode === 'edit' && requested === step && step !== 'review';
  placeSummaryAction();
  const index = STEPS.indexOf(step);
  furthest = Math.max(furthest, editingReview ? STEPS.length - 1 : index);
  app.dataset.step = step;
  back.href = editingReview ? '#review' : index ? `#${STEPS[index - 1]}` : 'feed.html';
  back.setAttribute('aria-label', editingReview ? 'Back to Great picks' : index ? `Back to ${['Your interests', 'Collections', 'Trendsetters'][index - 1]}` : 'Back to feed');
  const labels = ['Your interests', 'Collections', 'Trendsetters'];
  progress.innerHTML = labels.map((label, i) => {
    const complete = i < index && onboardingSelectionCount(draft, STEPS[i]) > 0;
    return `<li><button type="button" class="onboarding-step" data-step="${STEPS[i]}" ${i > furthest ? 'disabled' : ''} ${i === index ? 'aria-current="step"' : ''} data-complete="${complete}"><span>${complete ? '<span class="onboarding-progress-check" aria-hidden="true"></span>' : ''}${label}</span><span class="onboarding-step-line" aria-hidden="true"></span></button></li>`;
  }).join('');
  const copy = {
    topics: ['What topics interest you?', 'Your picks shape the stories and predictions you see.', ''],
    collections: ['Collections you will like', 'Based on your interests, here are collections to follow.', ''],
    'trend-setters': ['Trendsetters that will keep you on track', 'These experts are talking about the topics you like.', ''],
    review: ['Great picks', draft.topics.length || draft.collections.length || draft.people.length ? 'These will show up on your feed first.' : 'Your next discovery is waiting.', ''],
  }[step];
  [heading.textContent, subtitle.textContent, note.textContent] = copy;
  progress.closest('nav').hidden = step === 'review';
  skip.hidden = step === 'review';
  note.hidden = !copy[2];
  document.querySelector('[data-onboarding-secondary]').hidden = step === 'review';
  error.hidden = true;
  next.textContent = step === 'review' ? 'See your feed' : 'Continue';
  next.disabled = false;
  choices.className = `onboarding-choices onboarding-choices--${step}`;
  if (step === 'topics') choices.innerHTML = `<div class="topic-grid" role="group" aria-label="Choose topics">${TOPICS.map(topic => topicTile(topic)).join('')}</div>`;
  else if (step === 'collections') choices.innerHTML = `<div class="onboarding-collections" role="group" aria-label="Choose collections">${onboardingCollections(draft.topics, draft.collections).map(collectionChoice).join('')}</div>`;
  else if (step === 'trend-setters') choices.innerHTML = `<div class="onboarding-people" role="group" aria-label="Choose trendsetters">${onboardingCreators(draft.people).map(person => creator(person)).join('')}</div>`;
  else { choices.innerHTML = summary(); status.textContent = 'Review your selected topics, collections and trendsetters.'; }
  syncChoices();
  if (step === 'review' && !onboardingHasPicks(draft) && finish()) return;
  if (focus) { heading.focus({ preventScroll: true }); app.scrollIntoView({ block: 'start' }); }
}
function advance() {
  saveOnboardingDraft(draft, session);
  const destination = editingReview ? 'review' : STEPS[Math.min(STEPS.indexOf(step) + 1, STEPS.length - 1)];
  if (destination === 'review' && !onboardingHasPicks(draft) && finish()) return;
  location.hash = destination;
}
choices.addEventListener('click', event => {
  const edit = event.target.closest('[data-edit]');
  if (edit) { location.hash = `${edit.dataset.edit}/edit`; return; }
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
  if (button && !button.disabled) { saveOnboardingDraft(draft, session); location.hash = `${button.dataset.step}${editingReview ? '/edit' : ''}`; }
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
