// Browser-local setup transition. SVG artwork follows the supplied expanding-ring reference.
(() => {
  const KEY = 'trendhunter.account-setup-next.v1';
  const root = document.documentElement;
  const preview = new URL(location.href).searchParams.get('preview') === 'account-setup';
  let pending = false, panel, recovery, dismissal, visibleUntil = 0;
  try {
    const saved = sessionStorage.getItem(KEY);
    // Accept older immediate transitions as well as timed onboarding handoffs.
    const handoff = saved?.startsWith('{') ? JSON.parse(saved) : { path: saved };
    pending = handoff.path === location.pathname;
    if (pending && Number.isFinite(handoff.visibleUntil)) visibleUntil = Math.min(handoff.visibleUntil, Date.now() + 8000);
    if (pending) {
      sessionStorage.removeItem(KEY);
    }
  } catch {}
  if (pending || preview) root.dataset.accountSetup = 'loading';

  function show() {
    if (panel) return;
    root.dataset.accountSetup = 'loading';
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
    // Loading is dismissed by readiness, not Escape; recovery remains available on a stalled load.
    panel.addEventListener('cancel', event => { if (!preview) event.preventDefault(); });
    panel.addEventListener('close', hide);
    panel.querySelector('[data-setup-preview-close]')?.addEventListener('click', () => location.assign('onboarding.html#topics'));
    panel.querySelector('[data-setup-retry]').addEventListener('click', () => {
      try { sessionStorage.setItem(KEY, location.pathname); } catch {}
      location.reload();
    });
    panel.querySelector('[data-setup-back]').addEventListener('click', () => location.assign('onboarding.html#review'));
    if (!preview) recovery = setTimeout(() => { if (panel) panel.querySelector('.account-setup-recovery').hidden = false; }, 10000);
  }
  function hide() {
    clearTimeout(recovery);
    clearTimeout(dismissal);
    delete root.dataset.accountSetup;
    if (pending && location.pathname.endsWith('/feed.html') && document.readyState === 'complete') {
      try { sessionStorage.removeItem('trendhunter.onboarding-draft.v2'); } catch {}
    }
    if (panel) { const old = panel; panel = undefined; old.remove(); }
  }
  function dismissWhenReady() {
    if (preview || document.readyState !== 'complete') return;
    clearTimeout(dismissal);
    const remaining = Math.max(0, visibleUntil - Date.now());
    if (remaining) dismissal = setTimeout(hide, remaining); else hide();
  }
  window.navigateWithAccountSetup = (destination, { minimumDuration = 0 } = {}) => {
    const url = new URL(destination, location.href);
    if (url.origin !== location.origin) throw new Error('Setup navigation must stay within this prototype.');
    const duration = Math.max(0, Math.min(Number(minimumDuration) || 0, 8000));
    visibleUntil = Date.now() + duration;
    let carried = false;
    try {
      sessionStorage.setItem(KEY, JSON.stringify({ path: url.pathname, visibleUntil }));
      carried = true;
    } catch {}
    show();
    // Carry one deadline across documents so navigation never restarts the eight seconds.
    // Without session storage, keep the timed transition on this page before navigating.
    const navigate = () => requestAnimationFrame(() => requestAnimationFrame(() => location.assign(url.href)));
    if (!carried && duration) setTimeout(navigate, duration); else navigate();
  };
  const ready = () => {
    if (pending || preview) show();
    dismissWhenReady();
  };
  if (document.body) ready(); else document.addEventListener('DOMContentLoaded', ready, { once: true });
  window.addEventListener('load', dismissWhenReady, { once: true });
  window.addEventListener('pageshow', event => { if (event.persisted && !preview) hide(); });
})();
