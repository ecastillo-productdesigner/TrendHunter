import { readRecommendationFeedback, saveRecommendationFeedback } from './recommendation-feedback.js';

// Recommendation feedback is inline; no information popup is opened.
function syncFeedback() {
  const feedback = readRecommendationFeedback();
  document.querySelectorAll('[data-recommendation-feedback="more"]').forEach(button => {
    const href = button.closest('.trend-card').querySelector('.trend-card-collection').getAttribute('href');
    button.setAttribute('aria-pressed', String(feedback.preferredCollections.includes(href)));
  });
}
document.addEventListener('click', event => {
  const button = event.target.closest('.recommendation-inline-actions [data-recommendation-feedback]');
  if (!button) return;
  const card = button.closest('.trend-card');
  const story = card.querySelector('.bookmark-button').dataset.href;
  const collection = card.querySelector('.trend-card-collection').getAttribute('href');
  const action = button.dataset.recommendationFeedback;
  if (!saveRecommendationFeedback(story,collection,action)) { window.showToast('Your feedback could not be saved. Please try again.'); return; }
  document.dispatchEvent(new Event('feed-recommendations-updated'));
  syncFeedback();
  if (action === 'more') window.showToast('You’ll see more stories from this collection.');
  else {
    window.showToast('Story hidden from For You. <button type="button" class="toast-link" data-recommendation-undo>Undo</button>');
    document.querySelector('[data-recommendation-undo]').addEventListener('click', () => {
      if (!saveRecommendationFeedback(story,collection,'undo')) return;
      document.dispatchEvent(new Event('feed-recommendations-updated'));
      window.showToast('Story restored to For You.');
    }, { once:true });
    document.querySelector('[data-feed-view="for-you"][role="tab"]').focus({ preventScroll:true });
  }
});
window.addEventListener('pageshow',syncFeedback);
syncFeedback();
