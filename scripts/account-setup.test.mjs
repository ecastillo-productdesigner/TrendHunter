import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { FEED_URL } from '../site/onboarding-destinations.js';
const code = readFileSync(new URL('../site/account-setup.js', import.meta.url), 'utf8');
function browser({ preview = false } = {}) {
  let time = 0, nextTimer = 0;
  const timers = new Map(), handlers = new Map(), elements = new Map(), dialogs = [];
  const location = { href: `https://onboarding.test/${preview ? '?preview=account-setup' : ''}`, assign(url) { location.assigned = url; } };
  const document = { documentElement: { dataset: {} }, body: { append: dialog => dialogs.push(dialog) }, createElement() {
    return { visible: false, setAttribute() {}, showModal() { this.visible = true; }, remove() { this.visible = false; }, addEventListener() {}, querySelector(selector) {
      if (!elements.has(selector)) elements.set(selector, { hidden: true, addEventListener(name, fn) { this[name] = fn; } });
      return elements.get(selector);
    } };
  } };
  const window = { addEventListener: (name, fn) => handlers.set(name, fn), dispatchEvent(event) { handlers.get(event.type)?.(event); } };
  // No sessionStorage: the local timed handoff must work with browser storage blocked.
  vm.runInNewContext(code, { window, document, location, URL, Event, setTimeout: (fn, delay) => { const id = ++nextTimer; timers.set(id, { at: time + delay, fn }); return id; }, clearTimeout: id => timers.delete(id) });
  const advance = amount => {
    const target = time + amount;
    while (true) {
      const next = [...timers].filter(([, t]) => t.at <= target).sort((a, b) => a[1].at - b[1].at)[0];
      if (!next) break;
      time = next[1].at; timers.delete(next[0]); next[1].fn();
    }
    time = target;
  };
  return { advance, document, elements, location, window, visible: () => dialogs.some(dialog => dialog.visible) };
}
test('standalone feed handoff stays local for eight seconds, then opens the existing main app', () => {
  const page = browser();
  page.window.navigateWithAccountSetup(FEED_URL, { minimumDuration: 8000 });
  assert.equal(page.visible(), true);
  page.advance(7999); assert.equal(page.location.assigned, undefined);
  page.advance(1); assert.equal(page.location.assigned, FEED_URL);
  assert.equal(page.document.documentElement.dataset.accountSetup, 'loading');
});
test('stalled navigation offers retry and Back; Back cancels navigation and restores onboarding', () => {
  const page = browser(); let cancelled = false;
  page.window.addEventListener('onboarding-setup-cancel', () => { cancelled = true; });
  page.window.navigateWithAccountSetup(FEED_URL, { minimumDuration: 8000 });
  page.advance(10000);
  assert.equal(page.elements.get('.account-setup-recovery').hidden, false);
  page.elements.get('[data-setup-retry]').click();
  assert.equal(page.location.assigned, FEED_URL);
  page.elements.get('[data-setup-back]').click();
  assert.equal(page.visible(), false);
  assert.equal(cancelled, true);
  assert.equal(page.document.documentElement.dataset.accountSetup, undefined);
});
test('back/forward restoration cancels pending timers and allows another handoff', () => {
  const page = browser();
  page.window.navigateWithAccountSetup(FEED_URL, { minimumDuration: 8000 });
  page.window.dispatchEvent({ type: 'pageshow', persisted: true });
  page.advance(10000);
  assert.equal(page.visible(), false);
  assert.equal(page.location.assigned, undefined);
  page.window.navigateWithAccountSetup(FEED_URL, { minimumDuration: 8000 });
  page.advance(8000); assert.equal(page.location.assigned, FEED_URL);
});
test('unknown exits are rejected and the setup preview stays on onboarding', () => {
  const page = browser({ preview: true });
  assert.equal(page.visible(), true);
  assert.throws(() => page.window.navigateWithAccountSetup('https://other.test/'), /Unknown onboarding exit/);
  page.advance(20000); assert.equal(page.location.assigned, undefined);
  page.elements.get('[data-setup-preview-close]').click();
  assert.equal(page.location.assigned, './#topics');
});
