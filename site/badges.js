import { MEMBER_BADGES, READER_BADGE_EXAMPLES } from './badge-catalog.js';
import { BADGE_STATE_KEY, readBadgeState, badgeProgress, recordBadgeActivity, setBadgeVisible } from './badge-state.js';
import { readFollowedCollections } from './collection-follow-state.js';
import { unreadCollectionStories } from './collection-update-state.js';
import { escapeText } from './story-card.js';

const day = () => new Intl.DateTimeFormat('en-CA',{ timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit' }).format(new Date());
const signedIn = () => window.isSignedIn?.() === true;
const profile = document.querySelector('.profile');
const own = Boolean(document.querySelector('[data-people-manage]'));
const example = READER_BADGE_EXAMPLES[location.pathname.split('/').pop()];
let modal;
function state() { try { return readBadgeState(localStorage); } catch { return readBadgeState({ getItem:()=>null }); } }
const medal = badge => `<span class="badge-medal" data-badge="${badge.id}" aria-hidden="true"><span class="material-symbols-outlined">${badge.icon}</span></span>`;
function renderProfileBadges() {
  if (!profile || (!own && !example)) return;
  let row = profile.querySelector('.member-badges');
  if (!row) { row = document.createElement('div'); row.className = 'member-badges'; row.setAttribute('aria-label','Member badges'); profile.querySelector('.profile-identity').append(row); }
  const saved = state();
  const earned = own ? signedIn() ? saved.earned : {} : example;
  const visible = MEMBER_BADGES.filter(badge => earned[badge.id] && (!own || !saved.hidden.includes(badge.id))).slice(0,3);
  row.innerHTML = visible.map(badge => `<button class="member-badge" type="button" data-badge-view="${badge.id}">${medal(badge)}<span>${badge.name}</span></button>`).join('') + (own || visible.length ? '<button class="member-badges-all" type="button" data-badge-view="all">View all badges</button>' : '');
}
function showBadges(id) {
  if (own && !signedIn()) {
    try { sessionStorage.setItem('return-to','userprofile.html#following'); } catch {}
    location.href = 'login.html';
    return;
  }
  if (!modal) {
    modal = document.createElement('dialog'); modal.className = 'member-badge-dialog'; modal.setAttribute('aria-labelledby','member-badge-heading');
    document.body.append(modal);
    modal.addEventListener('click',event => { if (event.target.closest('[data-badge-close]')) modal.close(); });
    modal.addEventListener('change',event => {
      const toggle = event.target.closest('[data-badge-visibility]');
      if (!toggle) return;
      let saved = false; try { saved = setBadgeVisible(localStorage,toggle.dataset.badgeVisibility,toggle.checked); } catch {}
      if (!saved) { toggle.checked = !toggle.checked; window.showToast('Couldn’t save badge visibility. Please try again.'); }
      renderProfileBadges();
    });
  }
  const saved = state(), progress = badgeProgress(saved);
  const earned = own || !example ? saved.earned : example;
  const badges = MEMBER_BADGES.filter(badge => id === 'all' ? own || !example || earned[badge.id] : badge.id === id);
  modal.innerHTML = `<button class="auth-close" type="button" data-badge-close aria-label="Close badges"><span class="auth-close-icon" aria-hidden="true"></span></button><h2 class="trend-card-headline" id="member-badge-heading">${id === 'all' ? 'Member badges' : badges[0]?.name || 'Member badge'}</h2><div class="badge-detail-grid">${badges.map(badge => `<section class="badge-detail" data-earned="${Boolean(earned[badge.id])}">${medal(badge)}<h3>${badge.name}</h3><p>${badge.criterion}</p><p class="badge-progress">${earned[badge.id] ? `Earned ${earned[badge.id]}` : badge.id === 'sharp-eye' ? 'Locked · requires verified outcomes' : `${Math.min(progress[badge.metric],badge.goal)} of ${badge.goal}`}</p>${own && signedIn() && earned[badge.id] ? `<label class="badge-visibility"><input type="checkbox" data-badge-visibility="${badge.id}" ${saved.hidden.includes(badge.id) ? '' : 'checked'}> Show on my profile</label>` : ''}</section>`).join('')}</div>`;
  modal.showModal(); modal.querySelector('[data-badge-close]').focus({ preventScroll:true });
}
function record(activity, announce = true) {
  if (!signedIn()) return;
  let result; try { result = recordBadgeActivity(localStorage,activity,day()); } catch { return; }
  if (!result) return;
  renderProfileBadges();
  if (announce && result.newlyEarned.length) {
    const badge = MEMBER_BADGES.find(badge => badge.id === result.newlyEarned[0]);
    window.showToast(`You earned ${badge.name}. <button type="button" class="toast-link" data-badge-view="${badge.id}">View badge</button>`);
  }
}
function recordCalls() {
  if (!signedIn()) return;
  let calls = {}; try { calls = JSON.parse(sessionStorage.getItem('prediction-calls')) || {}; } catch {}
  const recorded = state().calls;
  for (const [id,call] of Object.entries(calls)) if (['in','out'].includes(call) && recorded[id] !== call) record({ type:'call',id,call },false);
}
document.addEventListener('prediction-call',event => {
  if (event.detail?.id && ['in','out'].includes(event.detail.call)) record({ type:'call',id:event.detail.id,call:event.detail.call });
  else recordCalls();
});
document.addEventListener('click',event => {
  const trigger = event.target.closest('[data-badge-view]');
  if (trigger) showBadges(trigger.dataset.badgeView);
  const link = event.target.closest('a[href]');
  if (!link || !signedIn()) return;
  const url = new URL(link.href,location.href);
  if (url.origin !== location.origin) return;
  try {
    const fresh = readFollowedCollections(localStorage).flatMap(href => unreadCollectionStories(localStorage,href));
    if (fresh.includes(url.pathname.split('/').pop())) record({ type:'update' });
  } catch {}
});
const readingEnd = document.querySelector('article.article .article-members');
const collection = document.querySelector('article.article .article-collection')?.getAttribute('href');
if (readingEnd && collection && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && signedIn()) { record({ type:'read',collection }); observer.disconnect(); }
  },{ threshold:0.25 });
  observer.observe(readingEnd);
}
document.addEventListener('auth-change',() => { recordCalls(); renderProfileBadges(); });
window.addEventListener('storage',event => { if (event.key === BADGE_STATE_KEY) renderProfileBadges(); });
recordCalls(); record({ type:'refresh' },false); renderProfileBadges();
