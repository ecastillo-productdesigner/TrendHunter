import { readRecommendationFeedback, saveRecommendationFeedback } from './recommendation-feedback.js';
import { feedPreferenceStorage } from './feed-preferences.js';

// Feedback remains on the card so either thumb can be toggled without moving it.
function syncFeedback() {
  const feedback = readRecommendationFeedback(feedPreferenceStorage());
  document.querySelectorAll('[data-recommendation-label]').forEach(label => {
    label.textContent = window.isSignedIn?.() === true ? 'Recommended for you' : 'Editor’s Picks';
  });
  document.querySelectorAll('.recommendation-inline-actions [data-recommendation-feedback]').forEach(button => {
    const card = button.closest('.trend-card');
    const href = card.querySelector('.trend-card-collection').getAttribute('href');
    const story = card.querySelector('.bookmark-button').dataset.href;
    const down = feedback.hiddenStories.includes(story);
    const selected = button.dataset.recommendationFeedback === 'less' ? down : !down && feedback.preferredCollections.includes(href);
    button.setAttribute('aria-pressed', String(selected));
  });
}
document.addEventListener('click', event => {
  const button = event.target.closest('.recommendation-inline-actions [data-recommendation-feedback]');
  if (!button) return;
  event.preventDefault();
  const card = button.closest('.trend-card');
  const story = card.querySelector('.bookmark-button').dataset.href;
  const collection = card.querySelector('.trend-card-collection').getAttribute('href');
  const action = button.dataset.recommendationFeedback;
  if (!saveRecommendationFeedback(story,collection,action,feedPreferenceStorage())) { window.showToast('Your feedback could not be saved. Please try again.'); return; }
  document.dispatchEvent(new CustomEvent('feed-recommendations-updated', { detail: { deferReorder:true } }));
  syncFeedback();
  const selected = button.getAttribute('aria-pressed') === 'true';
  window.showToast(!selected ? 'Recommendation feedback removed.' : window.isSignedIn?.() !== true ? 'Your feedback applies to this visit only.' : action === 'more' ? 'You’ll see more stories from this collection.' : 'You’ll see fewer recommendations like this.');
});
document.addEventListener('feed-recommendations-updated',syncFeedback);
document.addEventListener('auth-change',syncFeedback);
window.addEventListener('pageshow',syncFeedback);
syncFeedback();
