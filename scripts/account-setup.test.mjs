import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
const code = readFileSync(new URL('../site/account-setup.js', import.meta.url), 'utf8');
const key = 'trendhunter.account-setup-next.v1';
function browser({ now = 0, deadline, blocked = false } = {}) {
  let time = now, nextTimer = 0;
  const timers = new Map(), handlers = new Map(), values = new Map();
  const dialogs = [], location = { pathname: '/feed.html', href: 'https://prototype.test/feed.html', origin: 'https://prototype.test', assign(url) { location.assigned = url; }, reload() {} };
  if (deadline !== undefined) values.set(key, JSON.stringify({ path: '/feed.html', visibleUntil: deadline }));
  const sessionStorage = { getItem: k => values.get(k) ?? null, setItem(k, v) { if (blocked) throw Error('blocked'); values.set(k, v); }, removeItem: k => values.delete(k) };
  const document = { readyState: 'loading', documentElement: { dataset: {} }, body: { append: dialog => dialogs.push(dialog) }, createElement() {
    const elements = new Map();
    return { visible: false, setAttribute() {}, showModal() { this.visible = true; }, remove() { this.visible = false; }, addEventListener() {}, querySelector(selector) {
      if (!elements.has(selector)) elements.set(selector, { hidden: true, addEventListener() {} });
      return elements.get(selector);
    } };
  }, addEventListener(name, listener) { handlers.set(name, listener); } };
  const window = { addEventListener(name, listener) { handlers.set(name, listener); } };
  vm.runInNewContext(code, { window, document, location, sessionStorage, URL, Date: { now: () => time }, requestAnimationFrame: fn => fn(), setTimeout: (fn, delay) => { const id = ++nextTimer; timers.set(id, { at: time + delay, fn }); return id; }, clearTimeout: id => timers.delete(id) });
  const advance = amount => {
    const target = time + amount;
    while (true) {
      const next = [...timers].filter(([, t]) => t.at <= target).sort((a, b) => a[1].at - b[1].at)[0];
      if (!next) break;
      time = next[1].at; timers.delete(next[0]); next[1].fn();
    }
    time = target;
  };
  return { advance, document, values, location, window, visible: () => dialogs.some(dialog => dialog.visible), load() { document.readyState = 'complete'; handlers.get('load')(); } };
}
test('a fast feed stays covered for the full eight seconds', () => {
  const page = browser({ deadline: 8000 });
  page.advance(100); page.load();
  page.advance(7899); assert.equal(page.visible(), true);
  page.advance(1); assert.equal(page.visible(), false);
  assert.equal(page.document.documentElement.dataset.accountSetup, undefined);
});
test('the handoff carries elapsed time instead of restarting eight seconds on the feed', () => {
  const page = browser({ now: 3000, deadline: 8000 });
  page.values.set('trendhunter.onboarding-draft.v2', '{}');
  page.load(); page.advance(4999);
  assert.equal(page.visible(), true);
  assert.equal(page.values.has('trendhunter.onboarding-draft.v2'), true);
  page.advance(1); assert.equal(page.visible(), false);
  assert.equal(page.values.has('trendhunter.onboarding-draft.v2'), false);
});
test('a slower page waits for readiness and the Terms handoff has no eight-second minimum', () => {
  const slow = browser({ deadline: 8000 });
  slow.advance(9000); assert.equal(slow.visible(), true);
  slow.load(); assert.equal(slow.visible(), false);
  const terms = browser({ deadline: 0 });
  terms.load(); assert.equal(terms.visible(), false);
});
test('blocked session storage preserves the eight-second transition before navigation', () => {
  const page = browser({ blocked: true });
  page.load();
  page.window.navigateWithAccountSetup('feed.html#for-you', { minimumDuration: 8000 });
  assert.equal(page.visible(), true);
  page.advance(7999); assert.equal(page.location.assigned, undefined);
  page.advance(1); assert.equal(page.location.assigned, 'https://prototype.test/feed.html#for-you');
});
