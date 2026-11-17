// Browser-only transition before leaving the standalone onboarding prototype.
// No account service or cross-origin preference transfer is simulated.
(() => {
  const feedUrl = 'https://ecastillo-productdesigner.github.io/TrendHunter/feed.html#for-you';
  const preview = new URL(location.href).searchParams.get('preview') === 'account-setup';
  let panel, navigation, recovery, destination;
  function hide() {
    clearTimeout(navigation);
    clearTimeout(recovery);
    delete document.documentElement.dataset.accountSetup;
    if (panel) { panel.remove(); panel = undefined; }
    destination = undefined;
  }
  function show() {
    if (panel) return;
    document.documentElement.dataset.accountSetup = 'loading';
    panel = document.createElement('dialog');
    panel.className = 'account-setup';
    panel.setAttribute('aria-labelledby', 'account-setup-heading');
    panel.innerHTML = `<div class="account-setup-content">
      <svg class="account-setup-rings" viewBox="0 0 160 160" fill="none" aria-hidden="true">
        <circle class="account-setup-guide" cx="80" cy="80" r="72"/>
        <circle class="account-setup-ring account-setup-ring--one" cx="80" cy="80" r="12"/>
        <circle class="account-setup-ring account-setup-ring--two" cx="80" cy="80" r="12"/>
        <circle class="account-setup-dot" cx="80" cy="80" r="6"/>
      </svg>
      <div class="account-setup-copy" role="status" aria-live="polite"><h1 id="account-setup-heading">Setting up your account</h1><p>Getting your hunt ready.</p></div>
      <div class="account-setup-recovery" hidden><p>This is taking longer than expected.</p><button class="button-primary" type="button" data-setup-retry>Try again</button><button class="onboarding-skip" type="button" data-setup-back>Back</button></div>
      ${preview ? '<button class="onboarding-skip" type="button" data-setup-preview-close>Back to onboarding</button>' : ''}
    </div>`;
    document.body.append(panel);
    panel.showModal();
    panel.addEventListener('cancel', event => { if (!preview) event.preventDefault(); });
    panel.addEventListener('close', hide);
    panel.querySelector('[data-setup-preview-close]')?.addEventListener('click', () => location.assign('./#topics'));
    panel.querySelector('[data-setup-retry]').addEventListener('click', () => { if (destination) location.assign(destination); });
    panel.querySelector('[data-setup-back]').addEventListener('click', () => { hide(); window.dispatchEvent(new Event('onboarding-setup-cancel')); });
  }
  window.navigateWithAccountSetup = (url, { minimumDuration = 0 } = {}) => {
    if (new URL(url, location.href).href !== feedUrl) throw new Error('Unknown onboarding exit.');
    if (destination) return;
    destination = feedUrl;
    show();
    const duration = Math.max(0, Math.min(Number(minimumDuration) || 0, 8000));
    navigation = setTimeout(() => location.assign(destination), duration);
    recovery = setTimeout(() => { if (panel) panel.querySelector('.account-setup-recovery').hidden = false; }, duration + 2000);
  };
  if (preview) {
    if (document.body) show(); else document.addEventListener('DOMContentLoaded', show, { once: true });
  }
  window.addEventListener('pageshow', event => { if (event.persisted && !preview) hide(); });
})();
