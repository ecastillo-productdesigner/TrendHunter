import { readSelectedTopics } from './feed-personalization.js';
import { saveRecommendationFeedback } from './recommendation-feedback.js';

const triggers = [...document.querySelectorAll('[data-recommendation-info]')];
if (triggers.length) {
  const dialog = document.createElement('dialog');
  dialog.className = 'recommendation-dialog';
  dialog.id = 'recommendation-dialog';
  dialog.setAttribute('aria-labelledby', 'recommendation-dialog-title');
  dialog.setAttribute('aria-describedby', 'recommendation-dialog-reason');
  dialog.innerHTML = `<button type="button" class="auth-close recommendation-close" aria-label="Close recommendation information"><span class="auth-close-icon" aria-hidden="true"></span></button>
    <h2 class="trend-card-headline" id="recommendation-dialog-title" tabindex="-1">Why this recommendation?</h2>
    <p id="recommendation-dialog-reason"></p>
    <div class="recommendation-feedback-actions"><button type="button" class="recommendation-feedback-button" data-recommendation-feedback="more" aria-label="More like this" title="More like this"><span class="material-symbols-outlined" aria-hidden="true">thumb_up</span></button><button type="button" class="recommendation-feedback-button" data-recommendation-feedback="less" aria-label="Not interested" title="Not interested"><span class="material-symbols-outlined" aria-hidden="true">thumb_down</span></button></div>`;
  document.body.append(dialog);
  let selected = null;
  const topicNames = { beauty: 'Beauty', books: 'Books', 'food-drink': 'Food & Drink', wellness: 'Wellness', style: 'Style', tech: 'Tech', fitness: 'Fitness', culture: 'Culture', travel: 'Travel' };
  function cardDetails(trigger) {
    const card = trigger.closest('.trend-card');
    return { card, story: card.querySelector('.bookmark-button').dataset.href, collection: card.querySelector('.trend-card-collection').getAttribute('href') };
  }
  triggers.forEach(trigger => trigger.addEventListener('click', () => {
    selected = { ...cardDetails(trigger), trigger };
    const topics = (selected.card.dataset.topics || '').split(' ');
    const matches = readSelectedTopics().filter(topic => topics.includes(topic));
    const collection = selected.card.querySelector('.trend-card-collection-label').textContent.trim();
    dialog.querySelector('#recommendation-dialog-reason').textContent = matches.length
      ? `This story matches ${matches.map(topic => topicNames[topic]).join(' and ')}, which you selected for your feed.`
      : `Suggested to help you explore ${collection}. Tell us if you’d like to see more stories like this.`;
    trigger.setAttribute('aria-expanded', 'true');
    dialog.showModal();
    dialog.querySelector('h2').focus({ preventScroll: true });
  }));
  dialog.querySelector('.recommendation-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target === dialog) {
      const box = dialog.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
    }
    const feedback = event.target.closest('[data-recommendation-feedback]');
    if (!feedback || !selected) return;
    const action = feedback.dataset.recommendationFeedback;
    const saved = saveRecommendationFeedback(selected.story, selected.collection, action);
    if (!saved) { window.showToast('Your feedback could not be saved. Please try again.'); return; }
    const current = selected;
    dialog.close();
    document.dispatchEvent(new Event('feed-recommendations-updated'));
    if (action === 'more') window.showToast('You’ll see more stories from this collection.');
    else {
      window.showToast('Story hidden from For You. <button type="button" class="toast-link" data-recommendation-undo>Undo</button>');
      document.querySelector('[data-recommendation-undo]').addEventListener('click', () => {
        if (!saveRecommendationFeedback(current.story, current.collection, 'undo')) return;
        document.dispatchEvent(new Event('feed-recommendations-updated'));
        window.showToast('Story restored to For You.');
      }, { once: true });
      document.querySelector('[data-feed-view="for-you"][role="tab"]').focus({ preventScroll: true });
    }
  });
  dialog.addEventListener('close', () => selected?.trigger.setAttribute('aria-expanded', 'false'));
}
