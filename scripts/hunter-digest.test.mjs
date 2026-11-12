import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { COLLECTIONS } from '../site/collection-data.js';
import { COLLECTION_STORIES } from '../site/collection-story-data.js';
import { DIGEST_EXCERPTS } from '../site/hunter-digest-data.js';
import { DIGEST_KEY, DIGEST_DISMISSED_KEY, readDigestState, digestUpdates, catchUpDigest, catchUpDigestStory, digestEdition, dismissDigest, digestIsDismissed, showDigest } from '../site/hunter-digest-state.js';
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
  const first = digestUpdates(followed, { caughtUp:{} }).slice(0, 5);
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
  assert.doesNotMatch(details, /hunter-digest-details--new-collection/);
  const oneStoryPerCollection = digestCardMarkup(rows.slice(0, 2), edition);
  assert.match(oneStoryPerCollection, /hunter-digest-details--new-collection/);
  const sameCollection = digestCardMarkup(rows.filter(row => row.collection.href === rows[0].collection.href), edition);
  assert.doesNotMatch(sameCollection, /hunter-digest-details--new-collection/);
  assert.doesNotMatch(collapsed, /href="feed.html#following"|Your daily catch-up/);
  assert.ok(collapsed.includes(`See all ${rows.length} updates`));
  assert.match(digestCardMarkup(rows.slice(0, 1), edition), /See 1 update/);
  assert.ok(digestCardMarkup(rows.slice(1), edition).includes(`See all ${rows.length - 1} updates`));
  assert.doesNotMatch(collapsed, /Today/);
  assert.match(preview, /November 10, 2026<\/time><span aria-hidden="true"> · <\/span>2 collections with updates · 9 stories/);
  const full = digestCardMarkup(rows, edition, { expanded:true });
  assert.match(full, /data-digest-disclosure open/);
  assert.equal((full.match(/<article>/g) || []).length, rows.length);
  assert.ok(full.indexOf('data-digest-close') > full.lastIndexOf('<article>'));
  assert.match(full, /data-digest-read-all>Mark all as read<span class="feed-complete-icon" aria-hidden="true">/);
  assert.doesNotMatch(full, /Mark digest as caught up/);
  const urls = [...full.matchAll(/class="hunter-digest-read-more" href="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(urls).size, rows.length);
});

test('number gutter groups interleaved stories once per collection across the disclosure', () => {
  const rows = digestUpdates([...followed, 'collection-smart-home-energy.html'], { caughtUp:{} });
  const edition = digestEdition(new Date(2026,10,11));
  const html = digestCardMarkup(rows, edition, { expanded:true });
  const collections = [...new Set(rows.map(row => row.collection.href))];
  const numbers = [...html.matchAll(/class="hunter-digest-collection-number" aria-hidden="true">(\d+)</g)].map(match => Number(match[1]));
  assert.deepEqual(numbers, [1, 2, 3]);
  assert.equal((html.match(/class="hunter-digest-collection-name"/g) || []).length, collections.length);
  assert.match(html, /hunter-digest-collection--continuation/);
  const actualOrder = [...html.matchAll(/class="hunter-digest-read-more" href="([^"]+)"/g)].map(match => match[1]);
  assert.deepEqual(actualOrder, collections.flatMap(href => rows.filter(row => row.collection.href === href).map(row => row.href)));
  assert.equal(new Set(actualOrder).size, rows.length);
  const remaining = digestCardMarkup(rows.filter(row => row.collection.href !== collections[0]), edition);
  assert.deepEqual([...remaining.matchAll(/class="hunter-digest-collection-number" aria-hidden="true">(\d+)</g)].map(match => Number(match[1])), [1, 2]);
});

test('digest dismissal preserves unread stories and Show Your Digest restores visibility', () => {
  const saved = storage();
  const edition = digestEdition(new Date(2026,10,10));
  const rows = digestUpdates(followed, readDigestState(saved));
  assert.equal(digestIsDismissed(saved, rows, edition), false);
  assert.equal(dismissDigest(saved, rows, edition), true);
  assert.equal(digestIsDismissed(saved, rows, edition), true);
  assert.equal(digestIsDismissed(saved, rows.slice(1), edition), true);
  assert.deepEqual(readDigestState(saved).caughtUp, {});
  assert.equal(digestIsDismissed(saved, [{...rows[0],revision:'changed'}], edition), false);
  assert.equal(digestIsDismissed(saved, rows, digestEdition(new Date(2026,10,11))), false);
  assert.equal(showDigest(saved, followed), true);
  assert.equal(digestIsDismissed(saved, rows, edition), false);
  saved.setItem(DIGEST_DISMISSED_KEY, '{');
  assert.equal(digestIsDismissed(saved, rows, edition), false);
  const blocked = { getItem:() => null, setItem:() => {throw Error('blocked');} };
  assert.equal(dismissDigest(blocked, rows, edition), false);
  assert.equal(showDigest(blocked), false);
});

test('Show Your Digest replays followed collections after completion without resetting other history', () => {
  const saved = storage();
  const allRows = digestUpdates(COLLECTIONS.map(row => row.href), { caughtUp:{} });
  const freshRows = digestUpdates(followed, { caughtUp:{} });
  const eligible = new Set(freshRows.map(row => row.href));
  saved.setItem('trendhunter.collection-stories-viewed.v1', '["unchanged"]');
  saved.setItem('trendhunter.people-updates-seen.v1', 'unchanged');
  catchUpDigest(saved, allRows);
  dismissDigest(saved, freshRows);
  assert.deepEqual(digestUpdates(followed, readDigestState(saved)), []);
  assert.equal(showDigest(saved, followed), true);
  assert.deepEqual(digestUpdates(followed, readDigestState(saved)), freshRows);
  assert.equal(digestIsDismissed(saved, freshRows), false);
  for (const row of allRows.filter(row => !eligible.has(row.href))) {
    assert.equal(readDigestState(saved).caughtUp[row.href], row.revision);
  }
  assert.equal(saved.getItem('trendhunter.collection-stories-viewed.v1'), '["unchanged"]');
  assert.equal(saved.getItem('trendhunter.people-updates-seen.v1'), 'unchanged');
  catchUpDigest(saved, freshRows);
  assert.deepEqual(digestUpdates(followed, readDigestState(saved)), []);
  assert.equal(showDigest(saved, followed), true);
  assert.equal(digestUpdates(followed, readDigestState(saved)).length, freshRows.length);
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
