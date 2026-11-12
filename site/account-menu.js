import { MEMBER_BADGES, currentMemberBadge } from './badge-catalog.js?v=4';
import { readBadgeState } from './badge-state.js?v=3';

const collectedCopy = {
  'first-call': 'You collected this badge when you voted on your first prediction.',
  'regular-hunter': 'You collected this badge when you made calls on 5 different days.',
  'deep-diver': 'You collected this badge when you read 3 stories to the end.',
  'field-notes': 'You collected this badge when you saved 5 stories.',
  'sharp-eye': 'You collected this badge when you correctly called 3 verified predictions.',
};

// Match the medal worn on the profile. If all earned medals were hidden,
// respect that choice instead of presenting an earned badge as locked.
export function accountMenuBadge(state) {
  const current = currentMemberBadge(state.earned, state.hidden);
  if (current) return { badge: current, earned: true };
  if (Object.keys(state.earned).length) return null;
  return { badge: MEMBER_BADGES[0], earned: false };
}

export function installAccountMenu(panel) {
  const greeting = panel.querySelector('[data-account-greeting]');
  const badgeButton = panel.querySelector('[data-account-badge]');
  const help = panel.querySelector('[data-account-badge-help]');
  const badgeName = panel.querySelector('[data-account-badge-name]');
  const criterion = panel.querySelector('[data-account-badge-criterion]');
  const collect = panel.querySelector('[data-account-collect]');
  function refresh() {
    let name = 'Clementine';
    let state;
    try { name = sessionStorage.getItem('profile-name') || name; } catch {}
    try { state = readBadgeState(localStorage); } catch { state = readBadgeState({getItem: () => null}); }
    greeting.textContent = `Hello, ${name}`;
    const medal = accountMenuBadge(state);
    badgeButton.hidden = !medal;
    help.hidden = true;
    badgeButton.setAttribute('aria-expanded', 'false');
    if (!medal) return;
    badgeButton.dataset.earned = String(medal.earned);
    badgeButton.setAttribute('aria-label', `${medal.badge.name} badge. ${medal.earned ? 'Collected' : 'Not yet collected'}. How to collect`);
    badgeButton.querySelector('.material-symbols-outlined').textContent = medal.badge.icon;
    badgeName.textContent = medal.badge.name;
    criterion.textContent = medal.earned ? collectedCopy[medal.badge.id] : `Earn your first badge: ${medal.badge.criterion}`;
    collect.hidden = medal.earned;
  }
  badgeButton.addEventListener('click', () => {
    help.hidden = !help.hidden;
    badgeButton.setAttribute('aria-expanded', String(!help.hidden));
  });
  // Opening the drawer always reflects the latest name and badge progress.
  const observer = new MutationObserver(() => { if (panel.open) refresh(); });
  observer.observe(panel, { attributes: true, attributeFilter: ['open'] });
  document.addEventListener('profile-change', refresh);
  document.addEventListener('member-badges-reset', refresh);
  document.addEventListener('auth-change', refresh);
  window.addEventListener('storage', refresh);
  refresh();
}
