import { COLLECTIONS } from './collection-data.js';
import { COLLECTION_STORIES } from './collection-story-data.js';
import { DIGEST_EXCERPTS } from './hunter-digest-data.js';

// Browser-local prototype catch-up state. The edition date is not a publication
// timestamp. A new day never re-labels unchanged sample articles as new.
export const DIGEST_KEY = 'trendhunter.hunter-digest.v1';
export const DIGEST_PAGE_SIZE = 5;

export function readDigestState(storage) {
  try {
    const saved = JSON.parse(storage.getItem(DIGEST_KEY) || '{}');
    const caughtUp = Object.fromEntries(Object.entries(saved?.caughtUp || {})
      .filter(([href, revision]) => Object.hasOwn(DIGEST_EXCERPTS, href) && typeof revision === 'string'));
    return { caughtUp, lastCaughtUpAt: typeof saved?.lastCaughtUpAt === 'string' ? saved.lastCaughtUpAt : null };
  } catch { return { caughtUp: {}, lastCaughtUpAt: null }; }
}

export function digestUpdates(followed, state, { stories = COLLECTION_STORIES, excerpts = DIGEST_EXCERPTS, collections = COLLECTIONS } = {}) {
  const eligible = new Set(followed);
  const groups = collections.filter(collection => eligible.has(collection.href))
    .sort((a, b) => a.hours - b.hours || b.percentage - a.percentage);
  const seen = new Set(), rows = [];
  // Interleave collections so one large collection cannot consume the whole brief.
  const queues = groups.map(collection => ({ collection, stories: stories.filter(story => story.collections.includes(collection.href)) }));
  while (queues.some(queue => queue.stories.length)) {
    for (const queue of queues) {
      const story = queue.stories.shift(), excerpt = story && excerpts[story.href];
      if (!excerpt || seen.has(story.href)) continue;
      seen.add(story.href);
      if (state.caughtUp[story.href] === excerpt.revision) continue;
      rows.push({ ...story, ...excerpt, collection: queue.collection, kind: state.caughtUp[story.href] ? 'Updated story' : 'Story highlight' });
    }
  }
  return rows;
}

export function catchUpDigest(storage, visible, now = new Date()) {
  const previous = readDigestState(storage);
  const caughtUp = { ...previous.caughtUp };
  // Acknowledge only summaries the reader chose to include, never hidden rows
  // or the article-read/Following notification state.
  for (const row of visible) if (Object.hasOwn(DIGEST_EXCERPTS, row.href)) caughtUp[row.href] = row.revision;
  try {
    storage.setItem(DIGEST_KEY, JSON.stringify({ caughtUp, lastCaughtUpAt: now.toISOString() }));
    return true;
  } catch { return false; }
}

// Opening a story catches up only its current excerpt revision. A later revision
// can still appear as an update, and unrelated summaries stay unread.
export function catchUpDigestStory(storage, href, now = new Date()) {
  const excerpt = DIGEST_EXCERPTS[href];
  if (!Object.hasOwn(DIGEST_EXCERPTS, href)) return false;
  if (readDigestState(storage).caughtUp[href] === excerpt.revision) return true;
  return catchUpDigest(storage, [{ href, revision:excerpt.revision }], now);
}

export function digestEdition(date = new Date()) {
  const pad = value => String(value).padStart(2, '0');
  return { day: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`, label: date.toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' }) };
}
