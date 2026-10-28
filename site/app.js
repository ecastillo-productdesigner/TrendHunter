// Shared behavior for the Trend Hunter pages: theme toggle, bookmarks, toast.

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
const drawer = document.querySelector('.drawer');
const menuButton = document.querySelector('.nav-menu');

menuButton.addEventListener('click', () => {
  drawer.showModal();
  menuButton.setAttribute('aria-expanded', 'true');
});

drawer.querySelector('.drawer-close').addEventListener('click', () => drawer.close());

// A click on the scrim lands on the dialog itself, outside its box
drawer.addEventListener('click', (event) => {
  const box = drawer.getBoundingClientRect();
  const outside = event.clientX > box.right || event.clientX < box.left
    || event.clientY > box.bottom || event.clientY < box.top;
  if (event.target === drawer && outside) drawer.close();
});

drawer.addEventListener('close', () => menuButton.setAttribute('aria-expanded', 'false'));

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

function isSignedIn() {
  try { return sessionStorage.getItem(AUTH_KEY) === 'true'; } catch (e) { return false; }
}

function signIn() {
  try { sessionStorage.setItem(AUTH_KEY, 'true'); } catch (e) {}
  document.documentElement.dataset.auth = 'signed-in';
  document.dispatchEvent(new Event('auth-change'));
}

function signOut() {
  try { sessionStorage.removeItem(AUTH_KEY); } catch (e) {}
  delete document.documentElement.dataset.auth;
  document.dispatchEvent(new Event('auth-change'));
}

if (isSignedIn()) document.documentElement.dataset.auth = 'signed-in';

// Login (in the nav) and "Send me a sign-in link" (in the Auth Prompt) — remember this page
// so the Log In page can send the reader back here
document.querySelectorAll('.nav-login, .auth-prompt-email').forEach((link) => {
  link.addEventListener('click', () => {
    try {
      const page = window.location.pathname.split('/').pop() || 'feed.html';
      sessionStorage.setItem('return-to', `${page}${window.location.hash}`);
    } catch (e) {}
  });
});

// Log out (in the drawer) — signs out and returns to the feed
document.querySelector('.drawer-logout').addEventListener('click', () => {
  signOut();
  window.location.href = 'feed.html';
});

// ===========================
// Auth Prompt — opens when a signed-out reader tries to bookmark.
// Continue with Apple or Google signs them in, then finishes the bookmark they started.
// ===========================
const authPrompt = document.querySelector('.auth-prompt');
let pendingBookmark = null;

// ===========================
// Saved stories — one list for the whole tab, so every bookmark for a story
// (feed card, detail page, Saved tab) shows the same state.
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

// What Clementine's account already has saved, in the Figma order
const DEFAULT_SAVED = [
  { id: 'trt', title: "Men Are Challenging the Midlife 'Just Aging' Narrative as Testosterone Therapy Gains Momentum", image: 'assets/profile/saved-trt.png', href: 'trend.html' },
  { id: 'maximalism', title: "Maximalism Is the Top Home Decor Trend of 2026: What's Happening, Why and What It Means Going Forward", image: 'assets/profile/saved-maximalism.png', href: 'trend-maximalism.html' },
  { id: 'weekend-athletes', title: 'How weekend athletes are using pro-level training apps to crush their personal records', image: 'assets/profile/saved-3.png', href: 'trend-weekend-training-apps.html' },
];

function getSaved() {
  try {
    const stored = sessionStorage.getItem(SAVED_KEY);
    if (stored) return JSON.parse(stored).map((story) => ({ ...story, href: story.href || STORY_URLS[story.id] || '' }));
  } catch (e) {}
  return DEFAULT_SAVED.slice();
}

function setSaved(list) {
  try { sessionStorage.setItem(SAVED_KEY, JSON.stringify(list)); } catch (e) {}
}

function storyFrom(bookmark) {
  const { story, title, image, href } = bookmark.dataset;
  return { id: story, title, image, href: href || '' };
}

function bookmarksFor(id) {
  return [...document.querySelectorAll('.bookmark-button[data-story]')].filter((b) => b.dataset.story === id);
}

// Newest saves go to the top of the Saved list
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

// The Saved tab is the account's own list, so it shows the saves even before sign-in;
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

// Build the Saved tab from the saved list. Unsaving keeps the row (as an outline)
// until the page is left, so a mistaken tap can be undone.
if (savedList) {
  savedList.innerHTML = getSaved().map((s) => {
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

syncBookmarks();

function saveBookmark(bookmark) {
  setStorySaved(bookmark, true);
  showToast(TOAST_SAVED);
}

authPrompt.querySelector('.auth-close').addEventListener('click', () => authPrompt.close());

authPrompt.querySelectorAll('[data-auth]').forEach((provider) => {
  provider.addEventListener('click', () => {
    signIn();
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

  if (!isSaved && !isSignedIn()) {
    pendingBookmark = bookmark;
    authPrompt.showModal();
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
// Edit Profile — the modal on the Profile page. Save turns on once the name changes;
// the new name shows on the page and is kept for this tab.
// ===========================
const editProfileModal = document.querySelector('.edit-profile-modal');

if (editProfileModal) {
  const NAME_KEY = 'profile-name';
  const pageName = document.querySelector('.profile-name');
  const nameInput = editProfileModal.querySelector('.edit-profile-input');
  const preview = editProfileModal.querySelector('.edit-profile-preview');
  const saveButton = editProfileModal.querySelector('.edit-profile-save');

  try {
    const stored = sessionStorage.getItem(NAME_KEY);
    if (stored) pageName.textContent = stored;
  } catch (e) {}

  // Each time it opens, the field starts from the saved name
  document.querySelector('.edit-profile-button').addEventListener('click', () => {
    nameInput.value = pageName.textContent;
    preview.textContent = pageName.textContent;
    saveButton.disabled = true;
    editProfileModal.showModal();
  });

  // The name under the avatar follows what's typed
  nameInput.addEventListener('input', () => {
    const name = nameInput.value.trim();
    preview.textContent = name || pageName.textContent;
    saveButton.disabled = !name || name === pageName.textContent;
  });

  editProfileModal.querySelector('.edit-profile-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const name = nameInput.value.trim();
    if (!name) return;
    pageName.textContent = name;
    try { sessionStorage.setItem(NAME_KEY, name); } catch (e) {}
    editProfileModal.close();
  });

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
  if (location.pathname === ret.to && !event.persisted) window.scrollTo(0, 0);
  try { sessionStorage.removeItem(RETURN_KEY); } catch (e) {}
});
