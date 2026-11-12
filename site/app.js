// Shared behavior for the Trend Hunter pages: theme toggle, bookmarks, toast.
import('./collection-momentum.js?v=4');

// ===========================
// Theme toggle — flips data-theme on <html> and remembers the choice
// ===========================
const themeToggle = document.querySelector('.theme-toggle');

function updateToggleLabel() {
  const isLight = document.documentElement.dataset.theme === 'light';
  themeToggle.setAttribute('aria-label', isLight ? 'Switch to dark theme' : 'Switch to light theme');
}

themeToggle.addEventListener('click', () => {
  const root = document.documentElement;
  const next = root.dataset.theme === 'light' ? 'dark' : 'light';
  if (next === 'light') {
    root.dataset.theme = 'light';
  } else {
    delete root.dataset.theme;
  }
  try { localStorage.setItem('theme', next); } catch (e) {}
  updateToggleLabel();
});

updateToggleLabel();

// ===========================
// Drawer — a modal <dialog>, so focus stays inside and Escape closes it.
// Closes from the ×, the Escape key, or a click on the scrim.
// ===========================
function bindDrawer(panel, trigger) {
  trigger.addEventListener('click', () => {
    panel.showModal();
    trigger.setAttribute('aria-expanded', 'true');
  });
  panel.querySelector('.drawer-close').addEventListener('click', () => panel.close());
  panel.addEventListener('click', event => {
    const box = panel.getBoundingClientRect();
    const outside = event.clientX > box.right || event.clientX < box.left
      || event.clientY > box.bottom || event.clientY < box.top;
    if (event.target === panel && outside) panel.close();
  });
  panel.addEventListener('close', () => trigger.setAttribute('aria-expanded', 'false'));
}
bindDrawer(document.querySelector('.drawer'), document.querySelector('.nav-menu'));

const accountTrigger = document.querySelector('.nav-profile');
if (accountTrigger) {
  const accountDrawer = document.createElement('dialog');
  accountDrawer.id = 'account-drawer';
  accountDrawer.className = 'drawer drawer--account';
  accountDrawer.setAttribute('aria-label', 'Account menu');
  accountDrawer.innerHTML = `
    <button class="drawer-close" type="button" aria-label="Close account menu"><span class="drawer-close-icon" aria-hidden="true"></span></button>
    <nav class="drawer-nav" aria-label="Account">
      <header class="account-menu-header">
        <div class="account-menu-identity">
          <button class="account-menu-badge" type="button" data-account-badge data-earned="false" aria-label="First Call badge. Not yet collected. How to collect" aria-expanded="false" aria-controls="account-badge-help"><span class="badge-medal" aria-hidden="true"><span class="material-symbols-outlined">bolt</span></span></button>
          <h2 class="account-menu-greeting" data-account-greeting>Hello, Clementine</h2>
        </div>
        <div class="account-menu-badge-help" id="account-badge-help" data-account-badge-help hidden>
          <h2 data-account-badge-name>First Call</h2>
          <p data-account-badge-criterion>Earn your first badge: Vote on your first prediction.</p>
          <a href="predictions.html" data-account-collect>Start collecting badges</a>
        </div>
        <hr class="drawer-divider">
        <a class="account-menu-edit" href="userprofile.html">Your Profile</a>
      </header>
      <hr class="drawer-divider">
      <ul class="drawer-links">
        <li><button class="drawer-link drawer-logout" type="button">Log Out</button></li>
      </ul>
    </nav>`;
  document.body.append(accountDrawer);
  bindDrawer(accountDrawer, accountTrigger);
  import('./account-menu.js?v=2').then(({ installAccountMenu }) => installAccountMenu(accountDrawer));
}

// ===========================
// Toast — shown when a story is saved or unsaved; hides after 5 seconds or from its close button.
// hidden is toggled around the CSS transition so it can animate in and out.
// ===========================
const toast = document.querySelector('.toast');
const toastMessage = toast.querySelector('.toast-message');
const TOAST_SAVED = 'Saved. Find it anytime in your <a class="toast-link" href="userprofile.html">profile</a>';
const TOAST_REMOVED = 'Removed from saved';

// The toast hides itself after 5 seconds. A new message restarts the count,
// and it waits while the pointer or keyboard focus is on it (so the profile link can be used).
const TOAST_DURATION = 5000;
let toastTimer = null;

function startToastTimer() {
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, TOAST_DURATION);
}

// If the toast is already open, only the message changes
function showToast(message) {
  toastMessage.innerHTML = message;
  startToastTimer();
  if (toast.classList.contains('is-visible')) return;
  toast.hidden = false;
  toast.getBoundingClientRect(); // apply the start state before animating
  toast.classList.add('is-visible');
}

toast.addEventListener('mouseenter', () => clearTimeout(toastTimer));
toast.addEventListener('focusin', () => clearTimeout(toastTimer));
toast.addEventListener('mouseleave', () => {
  if (toast.classList.contains('is-visible') && !toast.contains(document.activeElement)) startToastTimer();
});
toast.addEventListener('focusout', (event) => {
  if (toast.classList.contains('is-visible') && !toast.contains(event.relatedTarget)) startToastTimer();
});

function hideToast() {
  clearTimeout(toastTimer);
  toast.classList.remove('is-visible');
  toast.addEventListener('transitionend', () => {
    if (!toast.classList.contains('is-visible')) toast.hidden = true;
  }, { once: true });
}

toast.querySelector('.toast-close').addEventListener('click', hideToast);

// ===========================
// Sign-in state — kept for this browser tab only (closing the tab signs out),
// so the prototype is easy to test again from a signed-out start
// ===========================
const AUTH_KEY = 'signed-in';
const ACTIVITY_RESET_KEY = 'trendhunter.activity-reset.v1';

function activityResetPending() {
  try { return localStorage.getItem(ACTIVITY_RESET_KEY) !== sessionStorage.getItem(ACTIVITY_RESET_KEY); }
  catch { return false; }
}

function isSignedIn() {
  try { return sessionStorage.getItem(AUTH_KEY) === 'true' && !activityResetPending(); } catch (e) { return false; }
}

async function signIn() {
  try {
    const { synchronizePrototypeActivity } = await import('./logout-reset.js?v=2');
    if (!synchronizePrototypeActivity()) throw new Error('Activity reset failed');
    sessionStorage.setItem(AUTH_KEY, 'true');
  } catch {
    showToast('Couldn’t start a fresh session. Please reload and try again.');
    return false;
  }
  document.documentElement.dataset.auth = 'signed-in';
  document.dispatchEvent(new Event('auth-change'));
  return true;
}

async function signOut() {
  try {
    const { resetPrototypeActivity } = await import('./logout-reset.js?v=2');
    if (!resetPrototypeActivity()) throw new Error('Activity reset failed');
  } catch {
    showToast('Couldn’t clear saved activity. Please try logging out again.');
    return false;
  }
  try { sessionStorage.removeItem(AUTH_KEY); } catch (e) {}
  delete document.documentElement.dataset.auth;
  document.dispatchEvent(new Event('auth-change'));
  return true;
}

if (isSignedIn()) document.documentElement.dataset.auth = 'signed-in';

let synchronizingLogout = false;
async function syncLogoutFromOtherTab() {
  if (synchronizingLogout || !activityResetPending()) return;
  synchronizingLogout = true;
  let hadMemberSession = false;
  try { hadMemberSession = sessionStorage.getItem(AUTH_KEY) === 'true'; } catch {}
  // Revoke the old session immediately, before asynchronous cleanup or any
  // activity listeners can re-award a badge from this tab's previous calls.
  try { sessionStorage.removeItem(AUTH_KEY); } catch {}
  delete document.documentElement.dataset.auth;
  document.dispatchEvent(new Event('auth-change'));
  try {
    const { synchronizePrototypeActivity } = await import('./logout-reset.js?v=2');
    if (!synchronizePrototypeActivity()) throw new Error('Tab reset failed');
    if (hadMemberSession) location.replace('feed.html');
    else location.reload(); // Keep a fresh guest's direct article or collection URL.
  } catch {
    synchronizingLogout = false;
    showToast('Couldn’t clear saved activity. Please reload to try again.');
  }
}
window.addEventListener('storage', event => {
  if (event.key === ACTIVITY_RESET_KEY || event.key === null) syncLogoutFromOtherTab();
});
window.addEventListener('pageshow', syncLogoutFromOtherTab);
syncLogoutFromOtherTab();

// Article community cue — illustrative readers have separate public, read-only profiles.
// Fixed collection-level sample totals; these are not live presence measurements.
const articleMembersTemplate = `
  <aside class="article-members" id="article-members" aria-labelledby="article-members-label">
    <p class="article-members-label" id="article-members-label">3 members exploring this collection</p>
    <div class="article-members-people">
    <div class="article-members-avatars" role="group" aria-label="Member profiles">
      <a class="article-member-avatar" data-member-profile="reader-alex-rivera.html" role="img" tabindex="-1" aria-label="Alex Rivera" title="Alex Rivera"><img src="assets/readers/alex-rivera.png" alt="" width="24" height="24" loading="lazy" decoding="async"></a>
      <a class="article-member-avatar" data-member-profile="reader-jamie-park.html" role="img" tabindex="-1" aria-label="Jamie Park" title="Jamie Park"><img src="assets/readers/jamie-park.png" alt="" width="24" height="24" loading="lazy" decoding="async"></a>
      <a class="article-member-avatar" data-member-profile="reader-morgan-lee.html" role="img" tabindex="-1" aria-label="Morgan Lee" title="Morgan Lee"><img src="assets/readers/morgan-lee.png" alt="" width="24" height="24" loading="lazy" decoding="async"></a>
    </div>
    </div>

  </aside>`;
const articleBody = document.querySelector('article.article .article-body');
if (articleBody && !articleBody.querySelector('.article-members')) {
  articleBody.insertAdjacentHTML('beforeend', articleMembersTemplate);
  const collection = document.querySelector('.article-collection')?.getAttribute('href') || '';
  const sampleCount = [3,4,5,7][[...collection].reduce((total,letter)=>total+letter.charCodeAt(0),0)%4];
  articleBody.querySelector('.article-members-label').textContent = `${sampleCount} members exploring this collection`;
  const moreMembers = [
    ['taylor-brooks','Taylor Brooks'],['quinn-ellis','Quinn Ellis'],
    ['casey-reed','Casey Reed'],['riley-chen','Riley Chen'],
  ];
  const avatars = articleBody.querySelector('.article-members-avatars');
  moreMembers.slice(0,sampleCount - 3).forEach(([id,name]) => {
    const avatar = document.createElement('a');
    avatar.className = 'article-member-avatar'; avatar.dataset.memberProfile = `reader-${id}.html`;
    avatar.title = name; avatar.setAttribute('aria-label',name);
    const image = document.createElement('img'); image.src = `assets/readers/${id}.png`;
    image.alt = ''; image.width = 24; image.height = 24; image.loading = 'lazy'; image.decoding = 'async';
    avatar.append(image); avatars.append(avatar);
  });
}

function syncArticleMemberLinks() {
  document.querySelectorAll('.article-member-avatar[data-member-profile]').forEach(avatar => {
    const signedIn = isSignedIn();
    if (signedIn) {
      avatar.href = avatar.dataset.memberProfile;
      avatar.removeAttribute('role');
      avatar.removeAttribute('tabindex');
      avatar.setAttribute('aria-label', `View ${avatar.title}’s reader profile`);
    } else {
      avatar.removeAttribute('href');
      avatar.tabIndex = -1;
      avatar.setAttribute('role', 'img');
      avatar.setAttribute('aria-label', avatar.title);
    }
  });
}
if (articleBody) import('./article-feedback.js?v=1').then(({ installArticleFeedback }) => installArticleFeedback(articleBody));
syncArticleMemberLinks();
document.addEventListener('auth-change', syncArticleMemberLinks);

// Login (in the nav) and "Send me a sign-in link" (in the Auth Prompt) — remember this page
// so the Log In page can send the reader back here
document.querySelectorAll('.nav-login, .auth-prompt-email, .article-members-join').forEach((link) => {
  link.addEventListener('click', () => {
    try {
      const page = window.location.pathname.split('/').pop() || 'feed.html';
      sessionStorage.setItem('return-to', `${page}${window.location.hash}`);
    } catch (e) {}
  });
});

// Explicit prototype logout clears activity before returning to fresh discovery.
document.querySelectorAll('.drawer-logout').forEach(button => button.addEventListener('click', async () => {
  button.disabled = true;
  if (await signOut()) window.location.href = 'feed.html';
  else button.disabled = false;
}));

// ===========================
// Legacy Auth Prompt — retained for the archived design reference.
// Signed-out Bookmark actions navigate directly to login.html.
// Continue with Apple or Google signs them in, then finishes the bookmark they started.
// ===========================
const authPrompt = document.querySelector('.auth-prompt');
let pendingBookmark = null;

// ===========================
// Saved stories — one list for the whole tab, so every bookmark for a story
// (feed card, detail page, Stories tab) shows the same state.
// Each bookmark names its story with data-story / data-title / data-image / data-href.
// ===========================
const SAVED_KEY = 'saved-stories';
// Resolve bookmarks saved before the remaining prototype stories were linked.
const STORY_URLS = {
  "trt": "trend.html",
  "how-gen-z-brands-like-edikted-are-converting-tiktok-followers": "trend-retailtainment.html",
  "morning-meltdowns-fatigue-may-mean-child-s-routine-is-still-shape": "trend-school-routines.html",
  "teens-phone-habits-are-costing-them-major-sleep-the-fallout-beginning": "trend-teen-phone-sleep.html",
  "your-bedroom-is-getting-louder-sleep-earbuds-are-evolving-to-keep-up": "trend-sleep-earbuds.html",
  "whole-house-water-filters-are-gaining-ground-as-homeowners": "trend-whole-house-water.html",
  "prostate-cancer-symptoms-are-easy-to-miss-here-s-what-men": "trend-preventive-health-conversations.html",
  "how-garden-lighting-delivers-maximum-curb-appeal-for-homeowners": "trend-garden-lighting.html",
  "why-are-dollar-stores-seeing-an-unexpected-new-wave-of-shoppers": "trend-dollar-store-shoppers.html",
  "protein-is-showing-up-in-more-everyday-foods-as-shoppers-rethink": "trend-everyday-protein.html",
  "home-energy-upgrades-explained-the-popular-renovations-that-consist": "trend-home-energy.html",
  "gen-z-drives-retailtainment-boom-reshaping-the-in-store": "trend-gen-z-stores.html",
  "what-1-writer-s-face-plant-revealed-about-a-rare-brain-pressure": "trend-health-storytelling.html",
  "somatic-sleep-protocols-might-be-pulling-wellness-buyers-away-from-melato": "trend-somatic-sleep.html",
  "weekend-only-walking-beats-none-study-finds-here-s-what-s-next": "trend-weekend-walking.html",
  "how-emotional-mirroring-at-drop-off-can-affect-kindergarten-separation": "trend-kindergarten-dropoff.html",
  "finding-travel-agent-candidates-the-right-way-bbb-s-reviews": "trend-travel-advisors.html",
  "guy-fieri-s-weighted-vest-rucking-and-transformation-points": "trend-weighted-walking.html",
  "inside-dollar-store-decorating-finds-that-transform-any-home": "trend-dollar-store-decor.html",
  "ai-shopping-assistant": "trend-ai-shopping-assistant.html",
  "school-health-basics": "trend-school-health-basics.html",
  "ai-gift-ideas": "trend-ai-gift-ideas.html",
  "school-breakfast": "trend-school-breakfast.html",
  "farmers-market-weekend": "trend-farmers-market-weekend.html",
  "seasonal-produce": "trend-seasonal-produce.html",
  "sober-socials": "trend-sober-socials.html",
  "run-club-connections": "trend-run-club-connections.html",
  "wellness-first-dating": "trend-wellness-first-dating.html",
  "at-home-date-night": "trend-at-home-date-night.html",
  "skin-longevity": "trend-skin-longevity.html",
  "neurocosmetics": "trend-neurocosmetics.html",
  "evening-wellness-rituals": "trend-evening-wellness-rituals.html",
  "smart-ring-sleep": "trend-smart-ring-sleep.html",
  "weekend-athletes": "trend-weekend-training-apps.html",
  "maximalism": "trend-maximalism.html"
};

function getSaved() {
  try {
    const stored = sessionStorage.getItem(SAVED_KEY);
    if (stored) return JSON.parse(stored).map((story) => ({ ...story, href: story.href || STORY_URLS[story.id] || '' }));
  } catch (e) {}
  return [];
}

function setSaved(list) {
  try { sessionStorage.setItem(SAVED_KEY, JSON.stringify(list)); } catch (e) {}
  document.dispatchEvent(new Event('saved-stories-change'));
}

function storyFrom(bookmark) {
  const { story, title, image, href } = bookmark.dataset;
  return { id: story, title, image, href: href || '' };
}

function bookmarksFor(id) {
  return [...document.querySelectorAll('.bookmark-button[data-story]')].filter((b) => b.dataset.story === id);
}

// Newest saves go to the top of the Stories list
function setStorySaved(bookmark, saved) {
  if (!bookmark.dataset.story) {
    bookmark.setAttribute('aria-pressed', String(saved));
    return;
  }
  const story = storyFrom(bookmark);
  const list = getSaved().filter((s) => s.id !== story.id);
  if (saved) list.unshift(story);
  setSaved(list);
  bookmarksFor(story.id).forEach((b) => b.setAttribute('aria-pressed', String(saved)));
}

// The Stories tab is the account's own list, so it shows the saves even before sign-in;
// everywhere else a signed-out reader sees empty bookmarks
const savedList = document.querySelector('.profile-story-list');

function syncBookmarks() {
  const ids = new Set(getSaved().map((s) => s.id));
  const showSaves = isSignedIn() || Boolean(savedList);
  document.querySelectorAll('.bookmark-button[data-story]').forEach((b) => {
    b.setAttribute('aria-pressed', String(showSaves && ids.has(b.dataset.story)));
  });
}

function escapeHTML(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML.replace(/"/g, '&quot;');
}

// Keep the Stories panel and its empty state in sync with actual saved stories.
function renderSavedStories() {
  if (!savedList) return;
  const stories = getSaved();
  savedList.hidden = stories.length === 0;
  document.querySelector('#profile-saved .profile-empty-state').hidden = stories.length !== 0;
  savedList.innerHTML = stories.map((s) => {
    const title = escapeHTML(s.title);
    const headline = s.href ? `<a href="${escapeHTML(s.href)}" class="story-lockup-link">${title}</a>` : title;
    return `
      <li class="story-lockup">
        <img class="story-lockup-image" src="${escapeHTML(s.image)}" alt="">
        <h2 class="story-lockup-headline profile-story-headline">${headline}</h2>
        <button class="trend-card-action bookmark-button" aria-label="Bookmark" aria-pressed="true" data-story="${escapeHTML(s.id)}" data-title="${title}" data-image="${escapeHTML(s.image)}" data-href="${escapeHTML(s.href)}"><span class="bookmark-icon" aria-hidden="true"></span></button>
      </li>`;
  }).join('');
}

renderSavedStories();
document.addEventListener('saved-stories-change', renderSavedStories);
window.addEventListener('pageshow', renderSavedStories);
syncBookmarks();
document.addEventListener('collection-stories-rendered', syncBookmarks);

// Resurface real saves once within For You. Older saves lead; no sample saves
// or invented movement metadata are inserted into the reader's library.
const bookmarkRevisitSlot = document.querySelector('.feed-bookmarks-slot');
let bookmarkRevisitKey = '';
function renderBookmarkRevisit() {
  if (!bookmarkRevisitSlot) return;
  const track = bookmarkRevisitSlot.querySelector('.bookmark-revisit-track');
  const seen = new Set();
  const stories = isSignedIn() ? getSaved().slice().reverse().filter(story => {
    if (!story || typeof story.title !== 'string' || typeof story.image !== 'string'
      || !/^(?:trend(?:-[a-z0-9-]+)?|prediction-analysis-[a-z0-9-]+)\.html$/.test(story.href)
      || !/^assets\/[a-z0-9/_ .-]+\.(?:png|jpe?g|webp|svg)$/i.test(story.image)
      || seen.has(story.href)) return false;
    seen.add(story.href);
    return true;
  }).slice(0, 6) : [];
  bookmarkRevisitSlot.hidden = stories.length === 0;
  const key = JSON.stringify(stories);
  if (key === bookmarkRevisitKey) return;
  bookmarkRevisitKey = key;
  track.replaceChildren(...stories.map((story, index) => {
    const item = document.createElement('li');
    item.setAttribute('role', 'group');
    item.setAttribute('aria-label', `Bookmark ${index + 1} of ${stories.length}`);
    const article = document.createElement('article');
    article.className = 'bookmark-revisit-card';
    const media = document.createElement('a');
    media.className = 'bookmark-revisit-media';
    media.href = story.href;
    media.setAttribute('aria-label', `Read: ${story.title}`);
    const image = document.createElement('img');
    image.src = story.image;
    image.alt = '';
    image.loading = 'lazy';
    media.append(image);
    const heading = document.createElement('h3');
    heading.className = 'bookmark-revisit-headline';
    const link = document.createElement('a');
    link.className = 'trend-card-title-link';
    link.href = story.href;
    link.textContent = story.title;
    heading.append(link);
    article.append(media, heading);
    item.append(article);
    return item;
  }));
  track.scrollLeft = 0;
}
if (document.querySelector('[data-followed-carousel]')) import('./feed-followed-carousel.js?v=1');
renderBookmarkRevisit();
document.addEventListener('saved-stories-change', renderBookmarkRevisit);
document.addEventListener('auth-change', renderBookmarkRevisit);
window.addEventListener('pageshow', renderBookmarkRevisit);

function saveBookmark(bookmark) {
  const previousMessage = toastMessage.innerHTML;
  setStorySaved(bookmark, true);
  if (toastMessage.innerHTML === previousMessage) showToast(TOAST_SAVED);
}

authPrompt.querySelector('.auth-close').addEventListener('click', () => authPrompt.close());

authPrompt.querySelectorAll('[data-auth]').forEach((provider) => {
  provider.addEventListener('click', async () => {
    if (!await signIn()) return;
    syncBookmarks(); // reveal the account's existing saves on this page
    const bookmark = pendingBookmark;
    authPrompt.close();
    if (bookmark) saveBookmark(bookmark);
  });
});

// A click on the scrim lands on the dialog itself, outside its box
authPrompt.addEventListener('click', (event) => {
  const box = authPrompt.getBoundingClientRect();
  const outside = event.clientX > box.right || event.clientX < box.left
    || event.clientY > box.bottom || event.clientY < box.top;
  if (event.target === authPrompt && outside) authPrompt.close();
});

// Closing without signing in drops the bookmark they started
authPrompt.addEventListener('close', () => { pendingBookmark = null; });

// ===========================
// Bookmark — toggles the saved state on any story
// ===========================
document.addEventListener('click', (event) => {
  const bookmark = event.target.closest('.bookmark-button');
  if (!bookmark) return;
  const isSaved = bookmark.getAttribute('aria-pressed') === 'true';

  if (!isSignedIn()) {
    try {
      const page = location.pathname.split('/').pop() || 'feed.html';
      sessionStorage.setItem('return-to', `${page}${location.hash}`);
    } catch {}
    location.assign('login.html');
    return;
  }

  if (isSaved) {
    setStorySaved(bookmark, false);
    showToast(TOAST_REMOVED);
  } else {
    saveBookmark(bookmark);
  }
});

// ===========================
// Contributor bio — "More..." swaps the short bio for the full one.
// It stays open while on the page, and is collapsed again on every visit,
// including when the browser restores the page with the Back button.
// ===========================
const bioMore = document.querySelector('.profile-bio-more');

if (bioMore) {
  const bioPreview = document.querySelector('.profile-bio-preview');
  const bioFull = document.getElementById(bioMore.getAttribute('aria-controls'));

  const setBioOpen = (open) => {
    bioPreview.hidden = open;
    bioFull.hidden = !open;
    bioMore.setAttribute('aria-expanded', String(open));
  };

  bioMore.addEventListener('click', () => {
    setBioOpen(true);
    bioFull.focus(); // keyboard and screen-reader users land on the full text
  });

  window.addEventListener('pageshow', (event) => {
    if (event.persisted) setBioOpen(false);
  });
}

// ===========================
// Edit Profile — name and a locally selected photo save for this browser tab.
// ===========================
const editProfileModal = document.querySelector('.edit-profile-modal');

if (editProfileModal) {
  const NAME_KEY = 'profile-name';
  const pageName = document.querySelector('.profile-name');
  const nameInput = editProfileModal.querySelector('.edit-profile-input');
  const preview = editProfileModal.querySelector('.edit-profile-preview');
  const saveButton = editProfileModal.querySelector('.edit-profile-save');
  const pageAvatar = document.querySelector('.profile-avatar');
  const photoPreview = editProfileModal.querySelector('.edit-profile-avatar-image');
  const photoInput = editProfileModal.querySelector('.edit-profile-photo-input');
  const photoStatus = editProfileModal.querySelector('.edit-profile-photo-status');
  const photoError = editProfileModal.querySelector('.edit-profile-photo-error');
  const PHOTO_KEY = 'profile-photo';
  let draftPhoto = '', loadingPhoto = false, photoVersion = 0;
  const syncProfileSave = () => {
    const name = nameInput.value.trim();
    saveButton.disabled = !name || loadingPhoto || (name === pageName.textContent && !draftPhoto);
  };

  try {
    const stored = sessionStorage.getItem(NAME_KEY);
    if (stored) pageName.textContent = stored;
    const photo = sessionStorage.getItem(PHOTO_KEY);
    if (photo?.startsWith('data:image/jpeg;base64,')) pageAvatar.src = photo;
  } catch (e) {}

  // Each time it opens, the field starts from the saved name
  function openProfileEditor() {
    nameInput.value = pageName.textContent;
    preview.textContent = pageName.textContent;
    photoVersion++;
    draftPhoto = '';
    loadingPhoto = false;
    photoPreview.src = pageAvatar.src;
    photoInput.value = '';
    photoStatus.textContent = '';
    photoError.hidden = true;
    saveButton.disabled = true;
    editProfileModal.showModal();
  }
  document.querySelector('.edit-profile-button').addEventListener('click', openProfileEditor);
  // The account drawer's edit link opens the actual editor on arrival.
  if (new URLSearchParams(location.search).get('edit') === '1' && isSignedIn()) {
    openProfileEditor();
    const url = new URL(location.href);
    url.searchParams.delete('edit');
    history.replaceState(null, '', url);
  }

  // The name under the avatar follows what's typed
  nameInput.addEventListener('input', () => {
    const name = nameInput.value.trim();
    preview.textContent = name || pageName.textContent;
    syncProfileSave();
  });

  editProfileModal.querySelector('.edit-profile-avatar-edit').addEventListener('click', () => {
    photoInput.value = '';
    photoInput.click();
  });
  photoInput.addEventListener('change', async () => {
    const file = photoInput.files[0];
    if (!file) return;
    const version = ++photoVersion;
    photoError.hidden = true;
    photoStatus.textContent = 'Preparing photo…';
    loadingPhoto = true;
    syncProfileSave();
    try {
      const { prepareProfilePhoto } = await import('./profile-photo.js');
      const image = await prepareProfilePhoto(file);
      if (version !== photoVersion || !editProfileModal.open) return;
      draftPhoto = image;
      photoPreview.src = image;
      photoStatus.textContent = 'Photo ready. Save to update your profile.';
    } catch (error) {
      if (version !== photoVersion || !editProfileModal.open) return;
      photoStatus.textContent = '';
      photoError.textContent = error.message || 'This photo could not be opened. Please choose another image.';
      photoError.hidden = false;
    } finally {
      if (version === photoVersion) { loadingPhoto = false; syncProfileSave(); }
    }
  });

  editProfileModal.querySelector('.edit-profile-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const name = nameInput.value.trim();
    if (!name || loadingPhoto) return;
    try {
      if (draftPhoto) sessionStorage.setItem(PHOTO_KEY, draftPhoto);
      sessionStorage.setItem(NAME_KEY, name);
    } catch {
      photoError.textContent = 'Your profile could not be saved in this browser. Please try again.';
      photoError.hidden = false;
      return;
    }
    pageName.textContent = name;
    if (draftPhoto) pageAvatar.src = draftPhoto;
    document.dispatchEvent(new Event('profile-change'));
    editProfileModal.close();
  });
  editProfileModal.addEventListener('close', () => { photoVersion++; draftPhoto = ''; loadingPhoto = false; });

  editProfileModal.querySelector('.edit-profile-close').addEventListener('click', () => editProfileModal.close());

  // A click on the scrim lands on the dialog itself, outside its box
  editProfileModal.addEventListener('click', (event) => {
    const box = editProfileModal.getBoundingClientRect();
    const outside = event.clientX > box.right || event.clientX < box.left
      || event.clientY > box.bottom || event.clientY < box.top;
    if (event.target === editProfileModal && outside) editProfileModal.close();
  });
}

// ===========================
// Read more on a prediction card (phones and tablets) always opens the story at the top.
// predictions.js notes the story it's heading to; a page restored from the browser's own
// back/forward cache (event.persisted) keeps whatever scroll position the reader left it at.
// ===========================
window.addEventListener('pageshow', (event) => {
  const RETURN_KEY = 'predictions-return';
  let ret = null;
  try { ret = JSON.parse(sessionStorage.getItem(RETURN_KEY)); } catch (e) {}
  if (!ret) return;
  if (ret.to && location.pathname.replace(/\.html$/, '') === ret.to.replace(/\.html$/, '') && !event.persisted) window.scrollTo(0, 0);
  try { sessionStorage.removeItem(RETURN_KEY); } catch (e) {}
});
