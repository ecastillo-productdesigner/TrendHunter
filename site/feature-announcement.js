// This card is a manual prototype preview, never an automatic sign-in notice.
const previewKey = 'trendhunter.feature-announcement-preview.v1';

export function installFeatureAnnouncement() {
  const announcement = document.querySelector('[data-feature-announcement]');
  let requested = false;
  let closing = false, closeVersion = 0;
  if (announcement) {
    try {
      requested = window.isSignedIn?.() === true && sessionStorage.getItem(previewKey) === 'true';
      sessionStorage.removeItem(previewKey);
    } catch {}
  }

  const sync = () => {
    if (!announcement) return;
    announcement.hidden = window.isSignedIn?.() !== true || (!requested && !closing) || document.body.dataset.feedView !== 'for-you';
  };

  announcement?.querySelector('button').addEventListener('click', async () => {
    if (closing) return;
    closing = true;
    const version = ++closeVersion;
    requested = false;
    announcement.dataset.dismissing = 'true';
    const puff = announcement.getAnimations().find(animation => animation.animationName === 'feature-announcement-puff');
    try { await puff?.finished; } catch { /* A restored banner cancels dismissal. */ }
    if (version !== closeVersion) return;
    closing = false;
    delete announcement.dataset.dismissing;
    sync();
    document.querySelector('.feed-navigation-tab[aria-selected="true"]')?.focus({ preventScroll: true });
  });
  announcement?.querySelector('a').addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button > 0) return;
    event.preventDefault();
    const destination = 'feed.html?following-intro=1#following';
    if (window.isSignedIn?.() !== true) {
      try { sessionStorage.setItem('return-to', destination); } catch {}
      location.assign('login.html');
      return;
    }
    const url = new URL(location.href);
    url.searchParams.set('following-intro', '1');
    url.searchParams.delete('people');
    history.replaceState(history.state, '', url);
    document.dispatchEvent(new Event('following-intro-preview'));
    const tab = document.querySelector('[data-feed-tabs] [data-feed-view="following"]');
    tab?.click(); tab?.focus({ preventScroll: true });
  });
  document.addEventListener('feed-view-selected', sync);
  document.addEventListener('auth-change', () => {
    if (window.isSignedIn?.() !== true) requested = false;
    sync();
  });
  window.addEventListener('pageshow', sync);
  sync();

  return {
    show() {
      if (window.isSignedIn?.() !== true) return;
      closeVersion++;
      closing = false;
      announcement?.getAnimations().filter(animation => animation.animationName === 'feature-announcement-puff').forEach(animation => animation.cancel());
      if (announcement) delete announcement.dataset.dismissing;
      requested = true;
      if (!announcement) {
        try { sessionStorage.setItem(previewKey, 'true'); } catch { return; }
        location.assign('feed.html#for-you');
        return;
      }
      document.querySelector('[data-feed-tabs] [data-feed-view="for-you"]')?.click();
      sync();
      if (announcement.hidden) return;
      announcement.scrollIntoView({ block: 'nearest' });
      announcement.querySelector('button').focus({ preventScroll: true });
    },
  };
}
