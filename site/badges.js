import { MEMBER_BADGES, READER_BADGE_EXAMPLES, currentMemberBadge } from './badge-catalog.js?v=3';
import { BADGE_STATE_KEY, readBadgeState, badgeProgress, recordBadgeActivity, setBadgeVisible } from './badge-state.js?v=3';
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
  profile.querySelector('.member-badges')?.remove();
  const avatar = profile.querySelector('.profile-avatar');
  let portrait = avatar.closest('.profile-portrait');
  if (!portrait) { portrait = document.createElement('div'); portrait.className = 'profile-portrait'; avatar.replaceWith(portrait); portrait.append(avatar); }
  const saved = state();
  const earned = own ? signedIn() ? saved.earned : {} : example;
  const current = currentMemberBadge(earned,own ? saved.hidden : []);
  portrait.querySelector('.profile-current-badge')?.remove();
  if (current) portrait.insertAdjacentHTML('beforeend',`<button class="profile-current-badge" type="button" data-badge-view="${current.id}" aria-label="${current.name} badge. View badge details" title="${current.name}">${medal(current)}</button>`);
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
    // Treat the transparent rounded corners as outside too.
    const outside = event => {
      const rect = modal.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) return true;
      const radius = Math.min(parseFloat(getComputedStyle(modal).borderTopLeftRadius) || 0,rect.width/2,rect.height/2);
      const x = Math.max(rect.left + radius - event.clientX,event.clientX - (rect.right - radius),0);
      const y = Math.max(rect.top + radius - event.clientY,event.clientY - (rect.bottom - radius),0);
      return x > 0 && y > 0 && x*x + y*y > radius*radius;
    };
    let startedOutside = false;
    modal.addEventListener('pointerdown',event => { startedOutside = outside(event); });
    modal.addEventListener('click',event => {
      if (event.target.closest('[data-badge-close]') || startedOutside && outside(event)) modal.close();
      startedOutside = false;
    });
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
  const current = currentMemberBadge(earned,own ? saved.hidden : []);
  const actions = content => `<div class="badge-popup-actions"><button class="badge-popup-close" type="button" data-badge-close>Close</button>${content}</div>`;
  let content;
  if (id === 'all') {
    content = `<h2 class="trend-card-headline" id="member-badge-heading">Member badges</h2><div class="badge-coin-grid">${MEMBER_BADGES.map(badge => `<button class="badge-coin-choice" type="button" data-badge-view="${badge.id}" data-earned="${Boolean(earned[badge.id])}" aria-label="${badge.name}. ${earned[badge.id] ? 'Earned' : 'Not yet collected'}. View how to collect"><span class="material-symbols-outlined" aria-hidden="true">${badge.icon}</span><span class="badge-coin-name">${badge.name}</span><span class="badge-coin-state">${earned[badge.id] ? 'Earned' : 'To collect'}</span></button>`).join('')}</div>${actions(current ? `<button class="badge-popup-close" type="button" data-badge-view="${current.id}">Show recent</button>` : '')}`;
  } else {
    const badge = MEMBER_BADGES.find(badge => badge.id === id);
    if (!badge) return;
    const date = earned[badge.id];
    const progressLabel = date ? `Earned ${new Intl.DateTimeFormat('en-US',{dateStyle:'long',timeZone:'UTC'}).format(new Date(`${date}T12:00:00Z`))}` : badge.id === 'sharp-eye' ? 'Requires verified outcomes' : own || !example ? `${Math.min(progress[badge.metric],badge.goal)} of ${badge.goal} · Not yet collected` : 'Not yet collected';
    content = `<h2 class="trend-card-headline" id="member-badge-heading">${badge.name}</h2><span class="badge-popup-symbol material-symbols-outlined" aria-hidden="true">${badge.icon}</span><p class="badge-popup-criterion">${badge.criterion}</p><p class="badge-popup-date">${progressLabel}</p>${actions(own || !example ? '<button class="badge-popup-close" type="button" data-badge-view="all">Show all</button>' : '')}`;
  }
  const render = () => {
    modal.classList.add('member-badge-dialog--medal');
    modal.classList.toggle('member-badge-dialog--collection',id === 'all');
    modal.innerHTML = content;
    modal.querySelector('h2').tabIndex = -1;
    modal.querySelector('h2').focus({preventScroll:true});
  };
  if (modal.open) {
    // Flip in place so the shared scrim and the reader's page position remain steady.
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { render(); return; }
    const duration = (parseFloat(getComputedStyle(modal).getPropertyValue('--motion-card-flip')) || 600) / 2;
    const turn = modal.animate([{transform:'perspective(960px) rotateY(0)'},{transform:'perspective(960px) rotateY(90deg)'}],{duration,easing:'ease-in',fill:'forwards'});
    turn.finished.then(() => {
      if (!modal.open) { turn.cancel(); return; }
      render();
      modal.animate([{transform:'perspective(960px) rotateY(-90deg)'},{transform:'perspective(960px) rotateY(0)'}],{duration,easing:'ease-out'});
      turn.cancel();
    }).catch(()=>{});
  } else {
    render(); modal.showModal(); modal.querySelector('h2').focus({preventScroll:true});
  }
}

function celebrateBadge(badge) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  requestAnimationFrame(() => {
    const toast = document.querySelector('.toast');
    if (!toast || toast.hidden) return;
    const rect = toast.getBoundingClientRect();
    const burst = document.createElement('div'); burst.className = 'badge-confetti'; burst.setAttribute('aria-hidden','true');
    document.querySelectorAll('.badge-confetti').forEach(previous=>previous.remove());
    burst.style.left = `${rect.left + rect.width / 2}px`;
    burst.style.top = `${Math.max(48,rect.top - 48)}px`;
    const award = document.createElement('div'); award.className = 'badge-confetti-medal'; award.innerHTML = medal(badge); burst.append(award);
    for (let i=0;i<24;i++) {
      const particle = document.createElement('span'); particle.className = 'badge-confetti-particle';
      const angle = i / 24 * Math.PI * 2, reach = 110 + i%4 * 18;
      const x = Math.cos(angle)*reach, y = Math.sin(angle)*reach;
      particle.style.setProperty('--particle-x',`${x}px`);
      particle.style.setProperty('--particle-mid-x',`${x*.75}px`);
      particle.style.setProperty('--particle-y',`${y}px`);
      particle.style.setProperty('--particle-end-y',`${y+55}px`);
      particle.style.setProperty('--particle-mid-turn',`${i*23}deg`);
      particle.style.setProperty('--particle-turn',`${i*37}deg`);
      burst.append(particle);
    }
    document.body.append(burst);
    const duration = parseFloat(getComputedStyle(burst).getPropertyValue('--motion-badge-celebration')) || 1200;
    setTimeout(()=>burst.remove(),duration + 100);
  });
}
function record(activity, announce = true) {
  if (!signedIn()) return;
  let result; try { result = recordBadgeActivity(localStorage,activity,day()); } catch { return; }
  if (!result) return;
  renderProfileBadges();
  if (announce && result.newlyEarned.length) {
    const badge = MEMBER_BADGES.find(badge => badge.id === result.newlyEarned[0]);
    window.showToast(`You earned ${badge.name}. <button type="button" class="toast-link" data-badge-view="${badge.id}">View badge</button>`);
    celebrateBadge(badge);
  }
}
function recordCalls() {
  if (!signedIn()) return;
  let calls = {}; try { calls = JSON.parse(sessionStorage.getItem('prediction-calls')) || {}; } catch {}
  const saved = state(), recorded = saved.calls;
  for (const [id,call] of Object.entries(calls)) if (['in','out'].includes(call) && recorded[id] !== call && saved.baselineCalls[id] !== call) record({ type:'call',id,call },false);
}
document.addEventListener('prediction-call',event => {
  if (event.detail?.id && ['in','out'].includes(event.detail.call)) record({ type:'call',id:event.detail.id,call:event.detail.call });
  else recordCalls();
});
function recordSaves(announce = true) {
  if (!signedIn()) return;
  let stories = [];
  try { const saved = JSON.parse(sessionStorage.getItem('saved-stories') || '[]'); if (Array.isArray(saved)) stories = saved; } catch {}
  const saved = state();
  for (const story of stories) {
    const id = story.href || story.id;
    if (id && !saved.savedSignals.includes(id) && !saved.baselineSavedSignals.includes(id)) record({type:'save',story:id},announce);
  }
}
document.addEventListener('saved-stories-change',()=>recordSaves());
document.addEventListener('click',event => {
  const trigger = event.target.closest('[data-badge-view]');
  if (trigger) showBadges(trigger.dataset.badgeView);
});
const readingEnd = document.querySelector('article.article .article-members');
const storyPage = document.querySelector('article.article') ? location.pathname.split('/').pop() : null;
if (readingEnd && storyPage && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && signedIn()) { record({ type:'read',story:storyPage }); observer.disconnect(); }
  },{ threshold:0.25 });
  observer.observe(readingEnd);
}
document.addEventListener('auth-change',() => { recordCalls(); recordSaves(false); renderProfileBadges(); });
document.addEventListener('member-badges-reset',() => { renderProfileBadges(); document.querySelectorAll('.badge-confetti').forEach(burst=>burst.remove()); });
window.addEventListener('storage',event => { if (event.key === BADGE_STATE_KEY) renderProfileBadges(); });
recordCalls(); recordSaves(false); record({ type:'refresh' },false); renderProfileBadges();
