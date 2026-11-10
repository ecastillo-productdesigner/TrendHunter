import { FOLLOWED_COLLECTIONS_KEY, readFollowedCollections } from './collection-follow-state.js';
import { DIGEST_KEY, readDigestState, digestUpdates, catchUpDigest, digestEdition } from './hunter-digest-state.js';
import { digestHeader, digestCardMarkup } from './hunter-digest-markup.js?v=2';

const digest = document.querySelector('[data-hunter-digest-preview]');
let expanded = false, rows = [];
const plural = (count, noun) => `${count} ${count === 1 ? noun : noun === 'story' ? 'stories' : `${noun}s`}`;

function render() {
  if (!digest) return;
  const edition = digestEdition();
  const signedIn = window.isSignedIn?.() === true;
  const intro = new URLSearchParams(location.search).get('following-intro') === '1';
  digest.hidden = !signedIn || document.body.dataset.feedView !== 'for-you' || intro;
  if (!signedIn) { digest.innerHTML = ''; rows = []; expanded = false; return; }
  let followed = [], state;
  try { followed = readFollowedCollections(localStorage); state = readDigestState(localStorage); }
  catch { state = { caughtUp: {}, lastCaughtUpAt: null }; }
  rows = digestUpdates(followed, state);
  if (!rows.length) {
    expanded = false;
    const empty = followed.length
      ? '<h3 class="hunter-digest-empty-title">You’re caught up</h3><p class="hunter-digest-summary">No new story updates in the collections you follow. Your next digest will appear when there’s something new.</p>'
      : '<h3 class="hunter-digest-empty-title">Make your next visit a catch-up</h3><p class="hunter-digest-summary">Follow collections to get a daily briefing on the stories that interest you.</p>';
    const action = `<a class="hunter-digest-action" href="feed.html#collections" data-digest-collections>${followed.length ? 'Explore your collections' : 'Find collections to follow'}</a>`;
    digest.innerHTML = digestHeader('hunter-digest-heading', edition) + `<div class="hunter-digest-empty">${empty}</div>` + action;
    return;
  }
  digest.innerHTML = digestCardMarkup(rows, edition, { expanded });
}

// The native disclosure keeps the preview and all additional summaries in one card.
// Its open state survives re-renders caused by follow and feed navigation events.
digest?.addEventListener('toggle', event => {
  if (event.target.matches('[data-digest-disclosure]') && digest.contains(event.target)) expanded = event.target.open;
}, true);
document.addEventListener('click', event => {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button > 0) return;
  if (event.target.closest('[data-digest-collections]')) {
    event.preventDefault();
    document.querySelector('[data-feed-tabs] [data-feed-view="collections"]')?.click();
  }
  if (event.target.closest('[data-digest-caught-up]')) {
    if (digest.hidden || !digest.querySelector('[data-digest-disclosure]')?.open) return;
    const visible = rows;
    let saved = false;
    try { saved = catchUpDigest(localStorage, visible); } catch {}
    if (!saved) { window.showToast?.('Couldn’t save your catch-up. Please try again.'); return; }
    expanded = false; render(); digest.focus({ preventScroll:true });
    window.showToast?.(`${plural(visible.length, 'update')} caught up. Your articles are still available to read.`);
  }
});
for (const name of ['feed-view-selected','auth-change','collection-stories-rendered','following-intro-preview']) document.addEventListener(name, render);
window.addEventListener('storage', event => { if ([FOLLOWED_COLLECTIONS_KEY, DIGEST_KEY, null].includes(event.key)) render(); });
window.addEventListener('pageshow', render);
render();
