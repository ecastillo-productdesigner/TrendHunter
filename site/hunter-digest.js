import { FOLLOWED_COLLECTIONS_KEY, readFollowedCollections } from './collection-follow-state.js';
import { DIGEST_KEY, DIGEST_PAGE_SIZE, readDigestState, digestUpdates, catchUpDigest, digestEdition } from './hunter-digest-state.js';
import { digestHeader, digestMarkup } from './hunter-digest-markup.js';

const preview = document.querySelector('[data-hunter-digest-preview]');
const full = document.querySelector('[data-hunter-digest]');
let expanded = false, visible = [];
const plural = (count, noun) => `${count} ${count === 1 ? noun : noun === 'story' ? 'stories' : `${noun}s`}`;

function render() {
  if (!preview || !full) return;
  const edition = digestEdition();
  const signedIn = window.isSignedIn?.() === true;
  const view = document.body.dataset.feedView;
  const intro = new URLSearchParams(location.search).get('following-intro') === '1';
  preview.hidden = !signedIn || view !== 'for-you' || intro;
  full.hidden = !signedIn || view !== 'following' || intro;
  if (!signedIn) { preview.innerHTML = ''; full.innerHTML = ''; visible = []; return; }
  let followed = [], state;
  try { followed = readFollowedCollections(localStorage); state = readDigestState(localStorage); }
  catch { state = { caughtUp: {}, lastCaughtUpAt: null }; }
  const rows = digestUpdates(followed, state);
  const count = new Set(rows.map(row => row.collection.href)).size;
  const dateHeader = digestHeader('hunter-digest-heading', edition);
  const previewHeader = digestHeader('hunter-digest-preview-heading', edition);
  if (!rows.length) {
    visible = [];
    const empty = followed.length
      ? '<h3 class="hunter-digest-empty-title">You’re caught up</h3><p class="hunter-digest-summary">No new story updates in the collections you follow. Your next digest will appear when there’s something new.</p>'
      : '<h3 class="hunter-digest-empty-title">Make your next visit a catch-up</h3><p class="hunter-digest-summary">Follow collections to get a daily briefing on the stories that interest you.</p>';
    const action = `<a class="hunter-digest-action" href="feed.html#collections" data-digest-collections>${followed.length ? 'Explore your collections' : 'Find collections to follow'}</a>`;
    preview.innerHTML = previewHeader + `<div class="hunter-digest-empty">${empty}</div>` + action;
    full.innerHTML = dateHeader + `<div class="hunter-digest-empty">${empty}</div>` + action;
    return;
  }
  visible = expanded ? rows : rows.slice(0, DIGEST_PAGE_SIZE);
  const scope = state.lastCaughtUpAt ? 'Updates since your last catch-up.' : 'The latest from the collections you follow.';
  preview.innerHTML = previewHeader + `<p class="hunter-digest-intro">${plural(count, 'collection')} with updates · ${plural(rows.length, 'story')}</p>` + digestMarkup(rows.slice(0, 1)) + `<a class="hunter-digest-action" href="feed.html#following" data-open-hunter-digest>Read your digest <span aria-hidden="true">→</span></a>`;
  full.innerHTML = dateHeader + `<p class="hunter-digest-intro">${scope} <span>${plural(count, 'collection')} · ${plural(rows.length, 'story')}</span></p>` + digestMarkup(visible) + `<footer class="hunter-digest-footer">${rows.length > DIGEST_PAGE_SIZE ? `<button class="hunter-digest-action" type="button" data-digest-expand aria-expanded="${expanded}">${expanded ? 'Show fewer updates' : `See all ${rows.length} updates`}</button>` : ''}<button class="hunter-digest-action" type="button" data-digest-caught-up>Mark ${expanded || rows.length <= DIGEST_PAGE_SIZE ? 'digest' : 'shown updates'} as caught up</button><a class="hunter-digest-all" href="#following-activity" data-digest-activity>View Following activity</a></footer>`;
}

function selectView(name, target) {
  document.querySelector(`[data-feed-tabs] [data-feed-view="${name}"]`)?.click();
  requestAnimationFrame(() => { target?.scrollIntoView({ block:'start', behavior:'auto' }); target?.focus({ preventScroll:true }); });
}
document.addEventListener('click', event => {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button > 0) return;
  if (event.target.closest('[data-open-hunter-digest]')) { event.preventDefault(); selectView('following', full); }
  if (event.target.closest('[data-digest-collections]')) { event.preventDefault(); selectView('collections'); }
  if (event.target.closest('[data-digest-activity]')) {
    event.preventDefault();
    const activity = document.querySelector('[data-people-feed]');
    activity?.scrollIntoView({ block:'start', behavior:'auto' }); activity?.focus({ preventScroll:true });
  }
  if (event.target.closest('[data-digest-expand]')) {
    expanded = !expanded; render(); full.querySelector('[data-digest-expand]')?.focus({ preventScroll:true });
  }
  if (event.target.closest('[data-digest-caught-up]')) {
    let saved = false;
    try { saved = catchUpDigest(localStorage, visible); } catch {}
    if (!saved) { window.showToast?.('Couldn’t save your catch-up. Please try again.'); return; }
    const count = visible.length;
    expanded = false; render(); full.focus({ preventScroll:true });
    window.showToast?.(`${plural(count, 'update')} caught up. Your articles are still available to read.`);
  }
});
for (const name of ['feed-view-selected','auth-change','collection-stories-rendered','following-intro-preview']) document.addEventListener(name, render);
window.addEventListener('storage', event => { if ([FOLLOWED_COLLECTIONS_KEY, DIGEST_KEY, null].includes(event.key)) render(); });
window.addEventListener('pageshow', render);
render();
