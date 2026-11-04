import { PEOPLE } from './people-data.js';
import { COLLECTIONS } from './collection-data.js';
import { COLLECTION_STORIES } from './collection-story-data.js';
import { PEOPLE_FOLLOW_KEY, PEOPLE_FOLLOW_INTENT, readFollowing, setPersonFollowed, followingPeople } from './people-follow-state.js';
import { editorialStoryCard, escapeText } from './story-card.js';

// Following and activity are browser-only prototype data. Member saves are never broadcast.
const feed = document.querySelector('[data-people-feed]');
const management = document.querySelector('[data-people-manage]');
const catalog = new Map(PEOPLE.map(person => [person.id, person]));
const collections = new Map(COLLECTIONS.map(collection => [collection.href, collection]));
let kind = new URLSearchParams(location.search).get('people') || 'all';
if (!['all', 'creators', 'members'].includes(kind)) kind = 'all';
const signedIn = () => window.isSignedIn?.() === true;
const follows = () => { try { return readFollowing(localStorage); } catch { return []; } };

function filters() {
  return `<div class="people-filters" role="group" aria-label="Filter followed people">${[['all','All'],['creators','Creators'],['members','Members']].map(([value,label]) => `<button class="profile-prediction-filter" type="button" data-people-filter="${value}" aria-pressed="${kind === value}">${label}</button>`).join('')}</div>`;
}
function personRow(person, following) {
  return `<li><a class="people-profile" href="${person.href}"><img class="people-avatar" src="${person.image}" alt="" width="48" height="48"><span><span class="people-name">${escapeText(person.name)}</span><span class="people-role">${person.kind === 'creators' ? 'Content creator' : 'Community member'}</span></span></a><button class="edit-profile-button person-follow-button" type="button" data-person-follow="${person.id}" aria-label="${following ? 'Unfollow' : 'Follow'} ${escapeText(person.name)}" aria-pressed="${following}">${following ? 'Following' : 'Follow'}</button></li>`;
}
function emptyState(hasFollows) {
  if (!signedIn()) return '<div class="profile-empty-state people-empty"><h2 class="profile-empty-title">Follow people who inspire your next hunt</h2><p class="profile-empty-copy"><a class="profile-empty-link" href="login.html" data-following-login>Sign in</a> to follow creators and community members</p></div>';
  if (hasFollows) return `<div class="profile-empty-state"><h2 class="profile-empty-title">No ${kind === 'creators' ? 'creators' : 'members'} followed yet</h2><p class="profile-empty-copy">Follow people to see their public activity here</p></div>`;
  return `<div class="profile-empty-state"><h2 class="profile-empty-title">No people followed yet</h2><p class="profile-empty-copy">Follow creators for new stories and members for their public predictions</p></div><h3 class="type-h4-caps people-recommendations-heading">People to explore</h3><ul class="people-list">${['daniel-reed','samantha-agate','jamie-park'].map(id => personRow(catalog.get(id), false)).join('')}</ul>`;
}
function predictionActivity(person, id, call) {
  const prediction = window.findPrediction?.(id);
  if (!prediction) return '';
  const first = person.name.split(' ')[0];
  return `<li class="people-prediction"><p class="people-activity-label"><a href="${person.href}#predictions">${escapeText(first)} made a prediction</a></p><ul class="prediction-results-list" data-following-prediction>${window.resultRow(prediction, call, true, { badgeLabel: `${first} is ${call}` })}</ul></li>`;
}
function activities(people) {
  const groups = people.map(person => person.kind === 'creators'
    ? COLLECTION_STORIES.filter(story => story.authorId === person.id).map(story => editorialStoryCard(story, collections.get(story.collections[0]), { context: `${person.name.split(' ')[0]} published a new story`, contextHref: person.href }))
    : Object.entries(person.calls || {}).map(([id,call]) => predictionActivity(person,id,call)));
  // Stable illustrative activity order alternates followed people without inventing publication times.
  return Array.from({ length: Math.max(0, ...groups.map(group => group.length)) }, (_, i) => groups.map(group => group[i] || '').join('')).join('');
}
function render() {
  const ids = signedIn() ? follows() : [];
  const people = followingPeople(ids, kind);
  document.querySelectorAll('[data-person-follow]').forEach(button => {
    const person = catalog.get(button.dataset.personFollow);
    if (!person) return;
    const following = ids.includes(person.id);
    button.textContent = following ? 'Following' : 'Follow';
    button.setAttribute('aria-pressed', String(following));
    button.setAttribute('aria-label', `${following ? 'Unfollow' : 'Follow'} ${person.name}`);
  });
  if (feed) {
    const activity = signedIn() && people.length ? activities(people) : '';
    feed.innerHTML = filters() + (activity ? `<ol class="people-activity-list">${activity}</ol>` : emptyState(ids.length > 0));
    if (document.body.dataset.feedView === 'following') document.getElementById('feed-view-status').textContent = `${people.length} followed people in ${kind === 'all' ? 'All' : kind}`;
  }
  if (management) management.innerHTML = filters() + (people.length ? `<ul class="people-list">${people.map(person => personRow(person,true)).join('')}</ul>` : emptyState(ids.length > 0));
  document.dispatchEvent(new Event('collection-stories-rendered'));
}
function loginFor(person) {
  try {
    sessionStorage.setItem(PEOPLE_FOLLOW_INTENT, person.id);
    sessionStorage.setItem('return-to', person.href);
  } catch {}
  location.href = 'login.html';
}
function setFollowing(person, following) {
  if (!signedIn()) { loginFor(person); return; }
  let saved;
  try { saved = setPersonFollowed(localStorage,person.id,following); } catch { saved = null; }
  if (!saved) { window.showToast('Couldn’t save this follow. Please try again.'); return; }
  render();
  if (following) window.showToast(`You’re following ${escapeText(person.name)}. <a class="toast-link" href="feed.html#following">View Following</a>`);
  else window.showToast(`You’re no longer following ${escapeText(person.name)}. <button type="button" class="toast-link" data-person-undo="${person.id}">Undo</button>`);
}
document.addEventListener('click', event => {
  const control = event.target.closest('[data-person-follow]');
  if (control) {
    const person = catalog.get(control.dataset.personFollow);
    if (person) setFollowing(person,!follows().includes(person.id));
    return;
  }
  const undo = event.target.closest('[data-person-undo]');
  if (undo) { const person = catalog.get(undo.dataset.personUndo); if (person) setFollowing(person,true); return; }
  const filter = event.target.closest('[data-people-filter]');
  if (filter) {
    kind = filter.dataset.peopleFilter;
    const url = new URL(location.href);
    if (kind === 'all') url.searchParams.delete('people'); else url.searchParams.set('people',kind);
    history.replaceState(history.state,'',url);
    render();
    document.querySelector(`[data-people-filter="${kind}"]`)?.focus({ preventScroll:true });
  }
  if (event.target.closest('[data-following-login]')) {
    try { sessionStorage.setItem('return-to', `${location.pathname.split('/').pop()}${location.search}${location.hash}`); } catch {}
  }
  const story = event.target.closest('[data-following-prediction] .prediction-card-more');
  if (story) {
    const prediction = window.findPrediction?.(story.closest('[data-id]').dataset.id);
    if (!prediction) return;
    let calls = {};
    try {
      calls = JSON.parse(sessionStorage.getItem('prediction-calls')) || {};
      sessionStorage.setItem('predictions-return',JSON.stringify({ from:`${location.pathname.split('/').pop()}${location.search}${location.hash}`, to:prediction.storyHref, predictionId:prediction.id, source:calls[prediction.id] ? 'results' : 'profile', readerCall:calls[prediction.id] || null }));
    } catch {}
  }
});
try {
  const pending = sessionStorage.getItem(PEOPLE_FOLLOW_INTENT);
  const person = catalog.get(pending);
  if (signedIn() && person && person.href === location.pathname.split('/').pop()) {
    sessionStorage.removeItem(PEOPLE_FOLLOW_INTENT);
    setFollowing(person,true);
  }
} catch {}
document.addEventListener('feed-view-selected', event => { if (event.detail === 'following') render(); });
document.addEventListener('auth-change', render);
window.addEventListener('storage', event => { if (event.key === PEOPLE_FOLLOW_KEY || event.key === null) render(); });
window.addEventListener('pageshow', () => {
  kind = new URLSearchParams(location.search).get('people') || 'all';
  if (!['all','creators','members'].includes(kind)) kind = 'all';
  render();
});
render();
