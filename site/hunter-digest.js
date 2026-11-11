import './hunter-digest-disclosure.js?v=2';
import { FOLLOWED_COLLECTIONS_KEY, readFollowedCollections } from './collection-follow-state.js';
import { DIGEST_KEY, DIGEST_DISMISSED_KEY, readDigestState, digestUpdates, catchUpDigest, dismissDigest, digestIsDismissed, digestEdition } from './hunter-digest-state.js?v=4';
import { digestHeader, digestCardMarkup } from './hunter-digest-markup.js?v=7';

const digest = document.querySelector('[data-hunter-digest-preview]');
let expanded = false, hiddenForVisit = false, rows = [];

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
  try { digest.hidden ||= hiddenForVisit || digestIsDismissed(localStorage, rows, edition); } catch {}
  if (!rows.length) {
    expanded = false;
    if (followed.length) { digest.hidden = true; digest.innerHTML = ''; return; }
    const empty = '<h3 class="hunter-digest-empty-title">Make your next visit a catch-up</h3><p class="hunter-digest-summary">Follow collections to get a daily briefing on the stories that interest you.</p>';
    const action = '<a class="hunter-digest-action" href="https://ecastillo-productdesigner.github.io/TrendHunter/collection-evidence-based-beauty.html">Find collections to follow</a>';
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
  if (event.target.closest('[data-digest-read-all]')) {
    if (!digest || digest.hidden || !digest.querySelector('[data-digest-disclosure]')?.open) return;
    let caughtUp = false;
    try { caughtUp = catchUpDigest(localStorage, rows); } catch {}
    if (!caughtUp) { window.showToast?.('Couldn’t save your read updates. Please try again.'); return; }
    let saved = false;
    try { saved = dismissDigest(localStorage, rows); } catch {}
    hiddenForVisit = !saved;
    expanded = false;
    digest.hidden = true;
    document.querySelector('[data-feed-tabs] [aria-selected="true"]')?.focus({ preventScroll:true });
  }
});
for (const name of ['feed-view-selected','auth-change','collection-stories-rendered','following-intro-preview']) document.addEventListener(name, render);
window.addEventListener('storage', event => { if ([FOLLOWED_COLLECTIONS_KEY, DIGEST_KEY, DIGEST_DISMISSED_KEY, null].includes(event.key)) { hiddenForVisit = false; render(); } });
document.addEventListener('hunter-digest-show', () => {
  hiddenForVisit = false;
  expanded = false;
  const url = new URL(location.href);
  url.searchParams.delete('following-intro');
  history.replaceState(history.state, '', url);
  document.querySelector('[data-feed-tabs] [data-feed-view="for-you"]')?.click();
  render();
  if (!digest.hidden) requestAnimationFrame(() => { digest.scrollIntoView({ block:'start', behavior:'auto' }); digest.focus({ preventScroll:true }); });
});
window.addEventListener('pageshow', render);
render();
