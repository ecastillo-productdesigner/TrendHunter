import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { COLLECTIONS } from '../site/collection-data.js';
import { COLLECTION_STORIES } from '../site/collection-story-data.js';
import { DIGEST_EXCERPTS } from '../site/hunter-digest-data.js';
import { DIGEST_KEY, DIGEST_PAGE_SIZE, readDigestState, digestUpdates, catchUpDigest, catchUpDigestStory, digestEdition } from '../site/hunter-digest-state.js';
import { digestMarkup, digestCardMarkup } from '../site/hunter-digest-markup.js';

const storage = () => {
  const values = new Map();
  return { getItem:key => values.get(key) ?? null, setItem:(key,value) => values.set(key,value) };
};
const followed = ['collection-evidence-based-beauty.html', 'collection-retailtainment-hubs.html'];

test('digest uses only followed memberships and shows shared stories once', () => {
  assert.deepEqual(digestUpdates([], { caughtUp:{} }), []);
  assert.deepEqual(digestUpdates(['unknown.html'], { caughtUp:{} }), []);
  const rows = digestUpdates(COLLECTIONS.map(row => row.href), { caughtUp:{} });
  assert.equal(rows.length, COLLECTION_STORIES.length);
  assert.equal(new Set(rows.map(row => row.href)).size, rows.length);
  for (const row of digestUpdates(followed, { caughtUp:{} })) {
    assert.ok(followed.includes(row.collection.href));
    assert.ok(row.collections.includes(row.collection.href));
    assert.equal(row.summary, DIGEST_EXCERPTS[row.href].summary);
    assert.ok(row.summary.split(/(?<=[.!?])\s+(?=[A-Z“])/).length >= 2, row.href);
  }
  const first = digestUpdates(followed, { caughtUp:{} }).slice(0, DIGEST_PAGE_SIZE);
  assert.equal(first.length, 5);
  assert.notEqual(first[0].collection.href, first[1].collection.href);
});

test('catch-up persists only included excerpts and leaves article/Following history untouched', () => {
  const saved = storage();
  saved.setItem('trendhunter.collection-stories-viewed.v1', '["unchanged"]');
  saved.setItem('trendhunter.people-updates-seen.v1', 'unchanged');
  const rows = digestUpdates(followed, readDigestState(saved));
  const visible = rows.slice(0, 2);
  assert.equal(catchUpDigest(saved, visible, new Date('2026-11-10T12:00:00Z')), true);
  const next = readDigestState(saved);
  assert.equal(next.lastCaughtUpAt, '2026-11-10T12:00:00.000Z');
  assert.equal(Object.keys(next.caughtUp).length, 2);
  assert.equal(digestUpdates(followed, next).length, rows.length - 2);
  assert.equal(saved.getItem('trendhunter.collection-stories-viewed.v1'), '["unchanged"]');
  assert.equal(saved.getItem('trendhunter.people-updates-seen.v1'), 'unchanged');
});

test('a changed excerpt returns as updated; unchanged stories stay caught up on a later day', () => {
  const saved = storage();
  const rows = digestUpdates(followed, readDigestState(saved));
  catchUpDigest(saved, rows, new Date('2026-11-10T12:00:00Z'));
  const state = readDigestState(saved);
  assert.deepEqual(digestUpdates(followed, state), []);
  assert.notEqual(digestEdition(new Date(2026,10,10)).day, digestEdition(new Date(2026,10,11)).day);
  const row = rows[0];
  const excerpts = { ...DIGEST_EXCERPTS, [row.href]: { summary:'A changed development. Here is its context.', revision:'revised' } };
  const updated = digestUpdates(followed, state, { excerpts });
  assert.equal(updated.length, 1);
  assert.equal(updated[0].href, row.href);
  assert.equal(updated[0].kind, 'Updated story');
  assert.deepEqual(digestUpdates([], state), []);
  assert.deepEqual(digestUpdates(followed, state), []);
});

test('damaged storage recovers and failed writes do not report success', () => {
  for (const value of ['null','[]','{','{"caughtUp":{"bad.html":"x"}}']) {
    assert.deepEqual(readDigestState({ getItem:() => value }), { caughtUp:{}, lastCaughtUpAt:null });
  }
  assert.equal(catchUpDigest({ getItem:() => null, setItem:() => { throw Error('full'); } }, []), false);
  const saved = storage();
  saved.setItem(DIGEST_KEY, JSON.stringify({caughtUp:{'trend.html':7}}));
  assert.deepEqual(readDigestState(saved).caughtUp, {});
});

test('edition uses local calendar date and rendered Read more links target the exact story', () => {
  assert.deepEqual(digestEdition(new Date(2026,10,10)), {day:'2026-11-10',label:'November 10, 2026'});
  const rows = digestUpdates(followed, { caughtUp:{} }).slice(0, 2);
  const html = digestMarkup(rows);
  for (const row of rows) {
    assert.ok(html.includes(`href="${row.href}" aria-label="Read more:`));
    assert.ok(html.includes(`href="${row.collection.href}"`));
  }
  const escaped = digestMarkup([{ ...rows[0], title:'<script>bad</script>', summary:'<img onerror="bad">' }]);
  assert.ok(!escaped.includes('<script>'));
  assert.ok(!escaped.includes('<img'));
  // This article has inherited retail copy in its sidebar; use its own body.
  assert.match(DIGEST_EXCERPTS['trend-led-skincare-lounge.html'].summary, /^Soft blue lighting/);
  assert.ok(!DIGEST_EXCERPTS['trend-led-skincare-lounge.html'].summary.includes('fitting room'));
});

test('one inline disclosure reveals all additional summaries without duplicating the preview', () => {
  const rows = digestUpdates(followed, { caughtUp:{} });
  const edition = digestEdition(new Date(2026,10,10));
  const collapsed = digestCardMarkup(rows, edition);
  const [preview, details] = collapsed.split('<details');
  assert.equal((preview.match(/<article>/g) || []).length, 1);
  assert.equal((details.match(/<article>/g) || []).length, rows.length - 1);
  assert.match(details, /data-digest-disclosure\s*>/);
  assert.match(details, /<summary[^>]*>/);
  assert.doesNotMatch(collapsed, /href="feed.html#following"|Your daily catch-up/);
  assert.match(collapsed, /See all updates/);
  assert.doesNotMatch(collapsed, /Today/);
  assert.match(preview, /November 10, 2026<\/time><span aria-hidden="true"> · <\/span>2 collections with updates · 9 stories/);
  const full = digestCardMarkup(rows, edition, { expanded:true });
  assert.match(full, /data-digest-disclosure open/);
  assert.equal((full.match(/<article>/g) || []).length, rows.length);
  assert.match(full, /Mark digest as caught up/);
  const urls = [...full.matchAll(/class="hunter-digest-read-more" href="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(urls).size, rows.length);
});

test('opening a story catches up just that revision, including stories shared across collections', async () => {
  const saved = storage();
  const allFollows = COLLECTIONS.map(row => row.href);
  const rows = digestUpdates(allFollows, readDigestState(saved));
  const row = rows.find(story => story.collections.length > 1);
  assert.ok(row);
  assert.equal(catchUpDigestStory(saved, row.href, new Date('2026-11-10T20:00:00Z')), true);
  const state = readDigestState(saved);
  assert.deepEqual(state.caughtUp, { [row.href]:row.revision });
  assert.equal(digestUpdates(allFollows, state).length, rows.length - 1);
  assert.equal(digestUpdates(allFollows, state).some(story => story.href === row.href), false);
  catchUpDigestStory(saved, row.href, new Date('2026-11-11T20:00:00Z'));
  assert.equal(readDigestState(saved).lastCaughtUpAt, state.lastCaughtUpAt);
  assert.equal(catchUpDigestStory(saved, 'unknown.html'), false);
  assert.equal(catchUpDigestStory({getItem:() => null,setItem:() => {throw Error('blocked');}}, row.href), false);
  const excerpts = {...DIGEST_EXCERPTS,[row.href]:{...DIGEST_EXCERPTS[row.href],revision:'new'}};
  assert.equal(digestUpdates(allFollows, state, {excerpts}).find(story => story.href === row.href).kind, 'Updated story');
  for (const story of COLLECTION_STORIES) {
    const page = await readFile(new URL('../site/' + story.href, import.meta.url), 'utf8');
    assert.match(page, /src="collection-updates\.js\?v=2"/);
  }
});
