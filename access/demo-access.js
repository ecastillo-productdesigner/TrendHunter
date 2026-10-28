// CSA-style browser-only demo access. This is not server authentication.
(() => {
  'use strict';
  const passwordDigest = '2a97516c354b68848cdbd8f54a226a0a55b21ed138e207ad6c5cbb9c00aa5aea';
  const sessionKey = 'trendhunter.demo-access.v1';
  const root = document.documentElement;
  const scriptUrl = document.currentScript.src;
  const logoUrl = new URL('assets/feed/wordmark.svg', scriptUrl).href;
  const blockedNodes = new Set();
  let gate;

  function hasAccess() {
    try { return sessionStorage.getItem(sessionKey) === passwordDigest; }
    catch { return false; }
  }

  if (hasAccess()) root.removeAttribute('data-demo-locked');

  function unlock() {
    try { sessionStorage.setItem(sessionKey, passwordDigest); } catch { /* This page still opens. */ }
    root.removeAttribute('data-demo-locked');
    for (const node of blockedNodes) node.inert = false;
    blockedNodes.clear();
    gate.hidden = true;
    gate.querySelector('input').value = '';
    window.dispatchEvent(new Event('resize'));
    document.querySelector('main a, .nav-wordmark, .ds-brand')?.focus({ preventScroll: true });
  }

  function showGate() {
    root.setAttribute('data-demo-locked', '');
    if (!gate) {
      gate = document.createElement('section');
      gate.id = 'demo-access';
      gate.className = 'demo-access';
      gate.setAttribute('aria-labelledby', 'demo-access-heading');
      gate.innerHTML = `
        <div class="demo-access-panel">
          <img class="demo-access-logo" src="${logoUrl}" alt="Trend Hunter">
          <header class="demo-access-intro">
            <p class="demo-access-kicker">Private preview</p>
            <h1 id="demo-access-heading">Enter password</h1>
            <p>Enter the demo password to explore Trend Hunter.</p>
          </header>
          <form id="demo-access-form" class="demo-access-form">
            <label for="demo-password">Password</label>
            <div class="demo-access-password">
              <input id="demo-password" name="password" type="password" autocomplete="current-password" required aria-describedby="demo-password-error">
              <button id="demo-password-visibility" type="button" aria-label="Show password" aria-pressed="false">Show</button>
            </div>
            <p id="demo-password-error" class="demo-access-error" role="alert" hidden></p>
            <button class="demo-access-submit" id="demo-access-submit" type="submit">Open prototype</button>
          </form>
        </div>`;
      document.body.appendChild(gate);
      const form = gate.querySelector('form');
      const password = gate.querySelector('input');
      const visibility = gate.querySelector('#demo-password-visibility');
      const error = gate.querySelector('#demo-password-error');
      const submit = gate.querySelector('#demo-access-submit');
      function clearError() {
        error.hidden = true;
        error.textContent = '';
        password.removeAttribute('aria-invalid');
      }
      password.addEventListener('input', clearError);
      visibility.addEventListener('click', () => {
        const showing = password.type === 'password';
        password.type = showing ? 'text' : 'password';
        visibility.textContent = showing ? 'Hide' : 'Show';
        visibility.setAttribute('aria-label', showing ? 'Hide password' : 'Show password');
        visibility.setAttribute('aria-pressed', String(showing));
        password.focus();
      });
      form.addEventListener('submit', async event => {
        event.preventDefault();
        if (submit.disabled) return;
        clearError();
        submit.disabled = true;
        try {
          const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password.value));
          const digest = Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
          if (digest !== passwordDigest) {
            error.textContent = 'That password isn’t correct. Please try again.';
            error.hidden = false;
            password.setAttribute('aria-invalid', 'true');
            password.focus();
            password.select();
            return;
          }
          unlock();
        } catch {
          error.textContent = 'Couldn’t open the prototype. Refresh and try again.';
          error.hidden = false;
        } finally { submit.disabled = false; }
      });
    }
    gate.hidden = false;
    for (const node of document.body.children) {
      if (node !== gate && !node.inert) { blockedNodes.add(node); node.inert = true; }
    }
    gate.querySelector('input').focus();
  }

  document.addEventListener('DOMContentLoaded', () => { if (!hasAccess()) showGate(); }, { once: true });
  window.addEventListener('pageshow', () => { if (!hasAccess()) showGate(); });
  document.addEventListener('click', event => {
    if (event.target.closest?.('.drawer-logout')) {
      try { sessionStorage.removeItem(sessionKey); } catch { /* Nothing to clear. */ }
    }
  }, true);
})();
