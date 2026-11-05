// A presentation-only business strip. Explore Solutions intentionally has no URL.
const dismissalKey = 'thb2b-banner-dismissed';

export function installBusinessBanner() {
  const header = document.querySelector('.site-header');
  if (!header || document.documentElement.dataset.view === 'sheet') return null;
  const banner = document.createElement('section');
  banner.className = 'thb2b-banner';
  banner.setAttribute('aria-label', 'Trend Hunter for Business');
  banner.innerHTML = `<div class="thb2b-banner-content">
    <p class="thb2b-banner-title">Trend insights for your business</p>
    <p class="thb2b-banner-description">Consumer trend insights grounded in evidence and guided by human judgment.</p>
    <span class="thb2b-banner-cta">Explore Solutions</span>
  </div><button class="thb2b-banner-close" type="button" aria-label="Close business banner"><span class="auth-close-icon" aria-hidden="true"></span></button>`;
  try { banner.hidden = sessionStorage.getItem(dismissalKey) === 'true'; } catch {}
  header.before(banner);
  banner.querySelector('.thb2b-banner-close').addEventListener('click', () => {
    banner.hidden = true;
    try { sessionStorage.setItem(dismissalKey, 'true'); } catch {}
    header.querySelector('button, a')?.focus({ preventScroll: true });
  });
  return {
    show() {
      banner.hidden = false;
      try { sessionStorage.removeItem(dismissalKey); } catch {}
      banner.scrollIntoView({ block: 'start' });
      banner.querySelector('.thb2b-banner-close').focus({ preventScroll: true });
    },
  };
}
