// Versioned dismissal applies only to this feature announcement in this browser.
const dismissalKey = 'feature-announcement-following-v1-dismissed';

export function installFeatureAnnouncement() {
  const announcement = document.querySelector('[data-feature-announcement]');
  let dismissed = false;
  const readDismissal = () => {
    try { dismissed = localStorage.getItem(dismissalKey) === 'true'; } catch {}
  };
  readDismissal();

  const sync = () => {
    if (!announcement) return;
    announcement.hidden = dismissed || document.body.dataset.feedView !== 'for-you';
    announcement.querySelector('a').href = window.isSignedIn?.() === true ? 'feed.html#following' : 'login.html';
  };

  announcement?.querySelector('button').addEventListener('click', () => {
    dismissed = true;
    try { localStorage.setItem(dismissalKey, 'true'); } catch {}
    sync();
    document.querySelector('.feed-navigation-tab[aria-selected="true"]')?.focus({ preventScroll: true });
  });
  announcement?.querySelector('a').addEventListener('click', event => {
    if (window.isSignedIn?.() === true) {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button > 0) return;
      event.preventDefault();
      const tab = document.querySelector('[data-feed-tabs] [data-feed-view="following"]');
      tab?.click();
      tab?.focus({ preventScroll: true });
    } else {
      try { sessionStorage.setItem('return-to', 'feed.html#following'); } catch {}
    }
  });
  document.addEventListener('feed-view-selected', sync);
  document.addEventListener('auth-change', sync);
  window.addEventListener('pageshow', () => { readDismissal(); sync(); });
  window.addEventListener('storage', event => {
    if (event.key === dismissalKey || event.key === null) { readDismissal(); sync(); }
  });
  sync();

  return {
    show() {
      dismissed = false;
      try { localStorage.removeItem(dismissalKey); } catch {}
      if (!announcement) { location.assign('feed.html#for-you'); return; }
      document.querySelector('[data-feed-tabs] [data-feed-view="for-you"]')?.click();
      sync();
      announcement.scrollIntoView({ block: 'nearest' });
      announcement.querySelector('a').focus({ preventScroll: true });
    },
  };
}
