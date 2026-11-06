import { PEOPLE_UPDATES_SEEN_KEY, PEOPLE_UPDATES_PREVIEW_KEY, unnoticedPeopleUpdates, peoplePreviewPending, acknowledgePeopleUpdates } from './people-update-state.js?v=3';
import { PEOPLE } from './people-data.js';
import { COLLECTIONS } from './collection-data.js';
import { COLLECTION_STORIES } from './collection-story-data.js';
import { PEOPLE_FOLLOW_KEY, PEOPLE_FOLLOW_INTENT, readFollowing, setPersonFollowed, followingPeople } from './people-follow-state.js';
import { editorialStoryCard, escapeText } from './story-card.js?v=2';
import { collectionFollowActivity, interleaveCollectionFollows } from './people-collection-activity.js?v=2';
import { interestLevel } from './collection-data.js';

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
  return `<div class="people-filters" role="group" aria-label="Filter followed people">${[['all','All'],['creators','Creators'],['members','Community']].map(([value,label]) => `<button class="profile-prediction-filter" type="button" data-people-filter="${value}" aria-pressed="${kind === value}">${label}</button>`).join('')}</div>`;
}
function personRow(person, following) {
  return `<li><a class="people-profile" href="${person.href}"><img class="people-avatar" src="${person.image}" alt="" width="48" height="48"><span><span class="people-name">${escapeText(person.name)}</span><span class="people-role">${person.kind === 'creators' ? 'Content creator' : 'Community member'}</span></span></a><button class="edit-profile-button person-follow-button" type="button" data-person-follow="${person.id}" aria-label="${following ? 'Unfollow' : 'Follow'} ${escapeText(person.name)}" aria-pressed="${following}">${following ? 'Following' : 'Follow'}</button></li>`;
}
// Curated fictional writers reuse the same profile destinations and live Follow
// controls as the Following directory; each portrait represents a distinct writer.
const suggestedCreators = document.querySelector('[data-who-to-follow]');
if (suggestedCreators) {
  suggestedCreators.innerHTML = ['daniel-reed', 'maya-chen', 'owen-brooks', 'nadia-patel', 'sofia-morales', 'marcus-bennett'].map(id => {
    const person = catalog.get(id);
    return `<li><article class="who-to-follow-card"><a class="who-to-follow-profile" href="${person.href}"><img class="who-to-follow-avatar" src="${person.image}" alt="" loading="lazy"><span class="who-to-follow-name">${escapeText(person.name)}</span><span class="who-to-follow-role">${escapeText(person.role)}</span></a><button class="edit-profile-button person-follow-button" type="button" data-person-follow="${person.id}" aria-pressed="false" aria-label="Follow ${escapeText(person.name)}">Follow</button></article></li>`;
  }).join('');
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
  const template = document.createElement('template');
  template.innerHTML = window.resultRow(prediction, call, true, { badgeLabel: `${first} is ${call}` });
  const row = template.content.firstElementChild;
  row.classList.add('prediction-result--comparison');
  let readerCall;
  try { readerCall = JSON.parse(sessionStorage.getItem('prediction-calls') || '{}')[id]; } catch {}
  const top = row.querySelector('.prediction-result-top');
  const memberBadge = top.querySelector('.prediction-badge');
  const column = document.createElement('div'); column.className = 'profile-call-column';
  memberBadge.replaceWith(column); column.append(memberBadge);
  if (['in','out'].includes(readerCall)) {
    column.insertAdjacentHTML('beforeend',`<span class="prediction-badge prediction-badge--${readerCall} profile-reader-badge"><span class="prediction-badge-icon" aria-hidden="true"></span>You’re ${readerCall}</span>`);
  } else if (signedIn() && !prediction.resolved) {
    const choiceId = `following-call-${person.id}-${id}`;
    column.insertAdjacentHTML('beforeend',`<button class="button-primary profile-call-start" type="button" data-following-make-call aria-expanded="false" aria-controls="${choiceId}">Make Your Call</button>`);
    top.insertAdjacentHTML('afterend',`<div class="profile-call-choices" id="${choiceId}" role="group" aria-label="Your call on ${escapeText(prediction.text)}" hidden><button class="prediction-vote prediction-vote--out" type="button" data-following-call="out"><span class="prediction-vote-icon" aria-hidden="true"></span>I’m out</button><button class="prediction-vote prediction-vote--in" type="button" data-following-call="in"><span class="prediction-vote-icon" aria-hidden="true"></span>I’m in</button></div>`);
  }
  return `<li class="people-prediction"><p class="people-activity-label"><a href="${person.href}#predictions">${escapeText(first)}</a> made a prediction</p><ul class="prediction-results-list" data-following-prediction>${row.outerHTML}</ul></li>`;
}
function activities(people) {
  const collectionFollows = [];
  const groups = people.map(person => {
    const activity = person.kind === 'creators'
      ? COLLECTION_STORIES.filter(story => story.authorId === person.id).map(story => editorialStoryCard(story, collections.get(story.collections[0]), { contextName: person.name.split(' ')[0], context: 'published a new story', contextHref: person.href }))
      : Object.entries(person.calls || {}).map(([id,call]) => predictionActivity(person,id,call));
    const follow = collectionFollowActivity(person.id);
    if (follow) {
      const collection = follow.collection;
      collectionFollows.push(`<li class="people-collection-follow" data-people-collection-follow="${escapeText(follow.id)}"><p class="people-activity-label"><a href="${person.href}">${escapeText(person.name.split(' ')[0])}</a> followed a collection</p><a class="pill-button" href="${collection.href}">${escapeText(collection.name)} <span class="collection-momentum collection-momentum--${collection.direction}" data-level="${interestLevel(collection.percentage)}" role="img" aria-label="Interest ${collection.direction} ${collection.percentage}% · prototype sample"><span class="collection-momentum-track" aria-hidden="true"></span><span class="collection-momentum-value" aria-hidden="true">${collection.percentage}%</span></span></a></li>`);
    }
    return activity;
  });
  // Stable illustrative activity order alternates followed people without inventing publication times.
  const rows = Array.from({ length: Math.max(0, ...groups.map(group => group.length)) }, (_, i) => groups.map(group => group[i] || '').filter(Boolean)).flat();
  return interleaveCollectionFollows(rows, collectionFollows).join('');
}
function updatePeopleSignals(acknowledge = false) {
  const ids = signedIn() ? follows() : [];
  if (acknowledge && signedIn()) acknowledgePeopleUpdates(localStorage,ids);
  const count = unnoticedPeopleUpdates(localStorage,ids).length;
  const pending = signedIn() && (count > 0 || peoplePreviewPending(localStorage));
  document.querySelectorAll('[data-feed-view="following"][role="tab"], [data-profile-section="following"]').forEach(tab => {
    let dot=tab.querySelector('.collection-updates-dot');
    if (!dot) { dot=document.createElement('span'); dot.className='collection-updates-dot'; dot.setAttribute('aria-hidden','true');tab.append(dot); }
    dot.hidden=!pending;
    if(pending) tab.setAttribute('aria-label','Following, new updates'); else tab.removeAttribute('aria-label');
  });
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
    if (document.body.dataset.feedView === 'following') document.getElementById('feed-view-status').textContent = `${people.length} followed people in ${{all:'All',creators:'Creators',members:'Community'}[kind]}`;
  }
  if (management) management.innerHTML = filters() + (people.length ? `<ul class="people-list">${people.map(person => personRow(person,true)).join('')}</ul>` : emptyState(ids.length > 0));
  updatePeopleSignals();
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
  const startCall = event.target.closest('[data-following-make-call]');
  if (startCall && signedIn()) {
    const choices = document.getElementById(startCall.getAttribute('aria-controls'));
    const expanded = startCall.getAttribute('aria-expanded') === 'true';
    choices.hidden = expanded;
    startCall.setAttribute('aria-expanded',String(!expanded));
    startCall.textContent = expanded ? 'Make Your Call' : 'Cancel';
    if (!expanded) choices.querySelector('button').focus({ preventScroll:true });
    return;
  }
  const vote = event.target.closest('[data-following-call]');
  if (vote && signedIn()) {
    const row = vote.closest('.prediction-result'), id = row.dataset.id, call = vote.dataset.followingCall;
    if (!['in','out'].includes(call) || !window.findPrediction?.(id) || window.findPrediction(id).resolved) return;
    try { const calls = JSON.parse(sessionStorage.getItem('prediction-calls') || '{}'); sessionStorage.setItem('prediction-calls',JSON.stringify({...calls,[id]:call})); }
    catch { window.showToast('Your call could not be saved. Please try again.'); return; }
    document.dispatchEvent(new CustomEvent('prediction-call',{detail:{id,call}}));
    if (!document.querySelector('.toast-message')?.textContent.startsWith('You earned ')) window.showToast(`Your call is locked in. You’re ${call}.`);
    return;
  }
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
document.addEventListener('feed-view-selected', event => { if (event.detail === 'following') { updatePeopleSignals(true); render(); } });
document.addEventListener('people-updates-preview',()=>updatePeopleSignals());
document.addEventListener('click',event => { if(event.target.closest('[data-profile-section="following"]')) updatePeopleSignals(true); });
document.addEventListener('auth-change', render);
document.addEventListener('prediction-call', render);
window.addEventListener('storage', event => { if ([PEOPLE_FOLLOW_KEY,PEOPLE_UPDATES_SEEN_KEY,PEOPLE_UPDATES_PREVIEW_KEY,null].includes(event.key)) render(); });
window.addEventListener('pageshow', () => {
  kind = new URLSearchParams(location.search).get('people') || 'all';
  if (!['all','creators','members'].includes(kind)) kind = 'all';
  if (location.hash === '#following') updatePeopleSignals(true);
  render();
});
if (location.hash === '#following') updatePeopleSignals(true);
render();
