import test from 'node:test';
import assert from 'node:assert/strict';
import { sampleMomentum, bindCollectionMomentum } from '../site/collection-momentum.js';

test('only selected prototype collections vary, with one-segment changes and stable repeat cycles', () => {
  for (const key of ['rising:22', 'rising:34', 'rising:27', 'falling:20']) {
    const states = Array.from({ length: 9 }, (_, index) => sampleMomentum(key, index));
    assert.ok(new Set(states.map(state => state.level)).size > 1);
    for (let i = 1; i < states.length; i++) {
      assert.ok(Math.abs(states[i].level - states[i - 1].level) <= 1);
      assert.ok(states[i].value >= 0 && states[i].value <= 100);
    }
    assert.deepEqual(states[0], states[4]);
    assert.deepEqual(states[0], states[8]);
  }
  for (const key of ['rising:15', 'rising:17', 'falling:7', 'rising:31']) assert.equal(sampleMomentum(key, 3), null);
});

function previewFixture({ reduced = false, offscreen = false } = {}) {
  const timers = new Map(), events = new Map();
  let sequence = 0;
  const makeIndicator = (value, direction = 'rising') => {
    const number = { textContent: `${value}%` }, track = { style: { setProperty(name, value) { this[name] = value; } } };
    const element = {
      dataset: {}, isConnected: true,
      classList: { contains: name => name === 'collection-momentum--falling' && direction === 'falling' },
      querySelector: selector => selector.includes('-value') ? number : track,
      closest: () => null,
      getBoundingClientRect: () => ({ width: 20, height: 14, top: offscreen ? 2000 : 10, bottom: offscreen ? 2014 : 24, left: 10, right: 30 }),
      setAttribute(name, value) { this[name] = value; },
    };
    return element;
  };
  const elements = [makeIndicator(22), makeIndicator(22), makeIndicator(15)];
  const root = { hidden: false, documentElement: {}, body: {}, querySelectorAll: () => elements, addEventListener: (name, callback) => events.set(name, callback) };
  const view = {
    innerWidth: 390, innerHeight: 844,
    matchMedia: () => ({ matches: reduced, addEventListener() {} }),
    getComputedStyle: () => ({ getPropertyValue: () => '10000ms' }),
    MutationObserver: class { observe() {} },
    setTimeout(callback) { const id = ++sequence; timers.set(id, callback); return id; },
    clearTimeout(id) { timers.delete(id); }, addEventListener() {},
  };
  const tick = () => { const callback = [...timers.values()][0]; timers.clear(); callback?.(); };
  return { root, view, elements, timers, events, tick };
}

test('visible duplicate indicators move together, static collections stay still and background tabs pause', () => {
  const fixture = previewFixture();
  bindCollectionMomentum(fixture.root, fixture.view);
  fixture.tick();
  assert.equal(fixture.elements[0].dataset.level, 2);
  assert.equal(fixture.elements[1].dataset.level, 2);
  assert.equal(fixture.elements[0]['aria-label'], fixture.elements[1]['aria-label']);
  assert.equal(fixture.elements[2].dataset.activity, undefined);
  fixture.root.hidden = true; fixture.events.get('visibilitychange')();
  assert.equal(fixture.timers.size, 0);
  fixture.root.hidden = false; fixture.events.get('visibilitychange')();
  assert.equal(fixture.timers.size, 1);
});

test('offscreen samples do not advance and reduced motion schedules no updates', () => {
  const hidden = previewFixture({ offscreen: true });
  bindCollectionMomentum(hidden.root, hidden.view); hidden.tick();
  assert.equal(hidden.elements[0].dataset.level, 1);
  const reduced = previewFixture({ reduced: true });
  bindCollectionMomentum(reduced.root, reduced.view);
  assert.equal(reduced.timers.size, 0);
});

test('a collection panel keeps its visible score and sortable value in sync with its chevrons', () => {
  const fixture = previewFixture();
  const score = { textContent: '' };
  const item = { dataset: {} };
  fixture.elements[0].closest = selector => selector === '.changing-collection-card' ? { querySelector: () => score, parentElement: item } : null;
  bindCollectionMomentum(fixture.root, fixture.view);
  assert.equal(score.textContent, '+22%');
  fixture.tick();
  assert.equal(score.textContent, '+27%');
  assert.equal(item.dataset.percentage, 27);
});

test('a collection detail summary updates its visible percentage together with its chevrons', () => {
  const fixture = previewFixture();
  const score = { textContent: '' };
  fixture.elements[0].closest = selector => selector === '.collection-interest-summary' ? { querySelector: () => score } : null;
  bindCollectionMomentum(fixture.root, fixture.view);
  assert.equal(score.textContent, '+22%');
  fixture.tick();
  assert.equal(score.textContent, '+27%');
  assert.equal(fixture.elements[0].dataset.level, 2);
});
