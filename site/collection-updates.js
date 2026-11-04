import { markCollectionStoryViewed } from './collection-update-state.js';

// Viewing an article clears only that story, never every update on entering Collections.
if (document.body.classList.contains('page-trend')) {
  try { markCollectionStoryViewed(localStorage, location.pathname.split('/').pop()); } catch { /* Keep unread status when storage is unavailable. */ }
}
