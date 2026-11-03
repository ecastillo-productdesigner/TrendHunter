import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../site/predictions.js', import.meta.url), 'utf8');

// Load the actual classic script without a mounted deck. These tests exercise its
// catalogue, arrival validation and ordering rather than simulating browser UI.
function load({ arrival = null, pathname = '/TrendHunter/trend.html', previous = null } = {}) {
  const context = vm.createContext({
    URL,
    location: { href: `https://example.test${pathname}`, pathname },
    sessionStorage: { getItem: () => arrival ? JSON.stringify(arrival) : null },
    history: { state: previous ? { predictionArrival: previous } : {}, replaceState(state) { this.state = state; } },
    document: {
      body: { classList: { contains: name => name === 'page-trend', add() {} } },
      querySelector: () => null, querySelectorAll: () => [], getElementById: () => null,
    },
  });
  vm.runInContext(source, context);
  return expression => JSON.parse(vm.runInContext(`JSON.stringify(${expression})`, context));
}

test('ordinary decks retain pending and skipped order', () => {
  const read = load();
  assert.deepEqual(read("articleDeckQueue({'telehealth-trt':'in'}, ['dollar-stores'], null).queue.map(p => p.id)").slice(0, 2), ['ai-holidays', 'retail-events']);
  assert.deepEqual(read("articleDeckQueue({'telehealth-trt':'in'}, ['dollar-stores'], null).skipped.map(p => p.id)"), ['dollar-stores']);
});

test('Read More puts a skipped matching prediction first exactly once', () => {
  const read = load();
  const ids = read("articleDeckQueue({}, ['skin-longevity'], findPrediction('skin-longevity')).queue.map(p => p.id)");
  assert.equal(ids[0], 'skin-longevity');
  assert.equal(ids.filter(id => id === 'skin-longevity').length, 1);
  assert.equal(ids[1], 'telehealth-trt');
  assert.deepEqual(read("articleDeckQueue({}, ['skin-longevity'], findPrediction('skin-longevity')).skipped"), []);
});

test('a recorded call is shown first without reintroducing other recorded calls', () => {
  const read = load();
  const ids = read("articleDeckQueue({'skin-longevity':'out','telehealth-trt':'in'}, [], findPrediction('skin-longevity')).queue.map(p => p.id)");
  assert.equal(ids[0], 'skin-longevity');
  assert.ok(!ids.includes('telehealth-trt'));
  assert.equal(ids[1], 'ai-holidays');
});

test('profile-only and resolved rows resolve to their own articles without entering the daily catalogue', () => {
  const read = load();
  assert.equal(read("findPrediction('profile-example-samantha-agate-in').storyHref"), 'trend-smart-ring-sleep.html');
  assert.equal(read("findPrediction('weekend-walking-history').resolved"), true);
  assert.equal(read("articleDeckQueue({}, [], findPrediction('profile-example-samantha-agate-in')).queue[0].id"), 'profile-example-samantha-agate-in');
  assert.equal(read('PREDICTIONS.length'), 10);
});

test('card, result and profile arrivals all select the matching story, including after reload', () => {
  for (const entry of ['card', 'results', 'profile']) {
    const arrival = { to: '/TrendHunter/trend-skin-longevity.html', predictionId: 'skin-longevity', source: entry };
    assert.equal(load({ arrival, pathname: '/TrendHunter/trend-skin-longevity' })('articleStoryArrival.id'), 'skin-longevity');
    assert.equal(load({ previous: arrival, pathname: '/TrendHunter/trend-skin-longevity.html' })('articleStoryArrival.id'), 'skin-longevity');
  }
  const read = load({ arrival: { to: '/TrendHunter/trend.html', predictionId: 'skin-longevity', source: 'profile' } });
  assert.equal(read('articleStoryArrival || null'), null);
});

test('open directory includes earlier predictions, sorts deadlines and excludes resolved history', () => {
  const read = load();
  const items = read('openPredictionList()');
  assert.equal(items.length, 14);
  assert.equal(new Set(items.map(item => item.id)).size, 14);
  assert.equal(items.filter(item => item.publishedOn < '2026-11-03').length, 4);
  assert.ok(items.every(item => !item.resolved && item.closesOn >= '2026-11-03'));
  assert.deepEqual(items.map(item => item.closesOn), items.map(item => item.closesOn).sort());
});

test('not-yet-voted directory excludes only valid saved calls and can reach an empty state', () => {
  const read = load();
  assert.equal(read("openPredictionList({'telehealth-trt':'in','smart-ring-wind-down':'out','ai-holidays':'skip'}, 'unvoted').length"), 12);
  assert.equal(read("openPredictionList(Object.fromEntries(ALL_OPEN_PREDICTIONS.map(p => [p.id,'in'])), 'unvoted').length"), 0);
  assert.equal(read("openPredictionList({'telehealth-trt':'in'}, 'all').length"), 14);
});

test('an earlier open prediction arrives first without joining the daily catalogue', () => {
  const arrival = { to: '/TrendHunter/trend-smart-ring-sleep.html', predictionId: 'smart-ring-wind-down', source: 'open' };
  const read = load({ arrival, pathname: arrival.to });
  assert.equal(read('articleStoryArrival.id'), 'smart-ring-wind-down');
  const ids = read('articleDeckQueue({}, [], articleStoryArrival).queue.map(p => p.id)');
  assert.equal(ids[0], 'smart-ring-wind-down');
  assert.equal(ids.length, 11);
  assert.equal(read('PREDICTIONS.length'), 10);
});
