// Versioned dismissal applies only to this feature announcement in this browser.
const dismissalKey = 'feature-announcement-following-v1-dismissed';

export function installFeatureAnnouncement() {
  const announcement = document.querySelector('[data-feature-announcement]');
  let dismissed = false;
  let closing = false, closeVersion = 0;
  const readDismissal = () => {
    try { dismissed = localStorage.getItem(dismissalKey) === 'true'; } catch {}
  };
  readDismissal();

  const sync = () => {
    if (!announcement) return;
    announcement.hidden = (dismissed && !closing) || document.body.dataset.feedView !== 'for-you';
  };

  announcement?.querySelector('button').addEventListener('click', async () => {
    if (closing) return;
    closing = true;
    const version = ++closeVersion;
    dismissed = true;
    try { localStorage.setItem(dismissalKey, 'true'); } catch {}
    announcement.dataset.dismissing = 'true';
    const puff = announcement.getAnimations().find(animation => animation.animationName === 'feature-announcement-puff');
    try { await puff?.finished; } catch { /* A restored banner cancels dismissal. */ }
    if (version !== closeVersion) return;
    closing = false;
    delete announcement.dataset.dismissing;
    sync();
    document.querySelector('.feed-navigation-tab[aria-selected="true"]')?.focus({ preventScroll: true });
  });
  document.addEventListener('feed-view-selected', sync);
  window.addEventListener('pageshow', () => { readDismissal(); sync(); });
  window.addEventListener('storage', event => {
    if (event.key === dismissalKey || event.key === null) { readDismissal(); sync(); }
  });
  sync();

  return {
    show() {
      closeVersion++;
      closing = false;
      announcement?.getAnimations().filter(animation => animation.animationName === 'feature-announcement-puff').forEach(animation => animation.cancel());
      if (announcement) delete announcement.dataset.dismissing;
      dismissed = false;
      try { localStorage.removeItem(dismissalKey); } catch {}
      if (!announcement) { location.assign('feed.html#for-you'); return; }
      document.querySelector('[data-feed-tabs] [data-feed-view="for-you"]')?.click();
      sync();
      announcement.scrollIntoView({ block: 'nearest' });
      announcement.querySelector('button').focus({ preventScroll: true });
    },
  };
}
