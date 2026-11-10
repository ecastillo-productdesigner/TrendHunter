import { markCollectionStoryViewed } from './collection-update-state.js';
import { catchUpDigestStory } from './hunter-digest-state.js?v=2';

// Viewing an article clears only that story, never every update on entering Collections.
if (document.body.classList.contains('page-trend')) {
  try {
    const href = location.pathname.split('/').pop();
    markCollectionStoryViewed(localStorage, href);
    catchUpDigestStory(localStorage, href);
  } catch { /* Keep unread status when storage is unavailable. */ }
}
