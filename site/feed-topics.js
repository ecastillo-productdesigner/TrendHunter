import { readSelectedTopics, saveSelectedTopics } from './feed-personalization.js?v=topics-9';
import { feedPreferenceStorage } from './feed-preferences.js';

// Feed and collection interests. Choices are browser-local prototype preferences, not collection follows.
(() => {
  const compact = document.body.classList.contains('page-collection');
  const anchor = document.querySelector(compact ? '.trend-card-list' : '.page-feed .feed-answers-slot');
  if (!anchor) return;
  const topicPickerTemplate = `
    <header class="topic-picker-header">
      <h2 class="type-h4-caps" id="feed-topics-heading">Hunt What You Like</h2>
      <p class="topic-picker-helper" id="feed-topics-helper">Select topics that interests you to customize your hunting experience</p>
    </header>
    <form class="topic-picker-form" aria-describedby="feed-topics-helper">
      <div class="topic-grid" role="group" aria-label="Choose topics">
        <button class="topic-tile" type="button" data-topic="wellness" aria-pressed="false"><span class="topic-icon" aria-hidden="true">spa</span><span class="topic-label">Health &amp; Wellness</span></button>
        <button class="topic-tile" type="button" data-topic="beauty" aria-pressed="false"><span class="topic-icon" aria-hidden="true">health_and_beauty</span><span class="topic-label">Beauty &amp; Skincare</span></button>
        <button class="topic-tile" type="button" data-topic="food-drink" aria-pressed="false"><span class="topic-icon" aria-hidden="true">local_bar</span><span class="topic-label">Food &amp; Drink</span></button>
        <button class="topic-tile" type="button" data-topic="fitness" aria-pressed="false"><span class="topic-icon" aria-hidden="true">directions_bike</span><span class="topic-label">Fitness</span></button>
        <button class="topic-tile" type="button" data-topic="home-living" aria-pressed="false"><span class="topic-icon" aria-hidden="true">home</span><span class="topic-label">Home &amp; Living</span></button>
        <button class="topic-tile" type="button" data-topic="tech" aria-pressed="false"><span class="topic-icon" aria-hidden="true">head_mounted_device</span><span class="topic-label">Tech &amp; AI</span></button>
        <button class="topic-tile" type="button" data-topic="family-parenting" aria-pressed="false"><span class="topic-icon" aria-hidden="true">family_restroom</span><span class="topic-label">Family &amp; Parenting</span></button>
        <button class="topic-tile" type="button" data-topic="culture" aria-pressed="false"><span class="topic-icon" aria-hidden="true">public</span><span class="topic-label">Culture &amp; Experiences</span></button>
        <button class="topic-tile" type="button" data-topic="travel" aria-pressed="false"><span class="topic-icon" aria-hidden="true">flight</span><span class="topic-label">Travel</span></button>
      </div>
      <button class="button-primary topic-picker-submit" type="submit" disabled>Update My Feed</button>
      <p class="visually-hidden" data-topic-status role="status">No topics selected</p>
    </form>`;
  const slot = document.createElement(compact ? 'div' : 'li');
  slot.className = 'feed-topics-slot';
  slot.hidden = window.isSignedIn?.() !== true;
  const picker = document.createElement('section');
  picker.className = 'feed-topic-picker' + (compact ? ' feed-topic-picker--compact' : '');
  picker.setAttribute('aria-labelledby', 'feed-topics-heading');
  picker.innerHTML = topicPickerTemplate;
  slot.append(picker);
  if (compact) anchor.before(slot);
  const siblings = [...anchor.parentElement.children];
  const followingStories = siblings.slice(siblings.indexOf(anchor) + 1)
    .filter(item => item.querySelector(':scope > .trend-card'));
  if (!compact) (followingStories[2] || anchor).after(slot);

  // Guest discovery is optional and collapsed, separate from Hunt What You Like.
  // Its tab-local choices never read or overwrite signed-in interests.
  let guestSlot, guestPicker;
  if (!compact) {
    guestSlot = document.createElement('li');
    guestSlot.className = 'feed-guest-topics-slot';
    guestSlot.hidden = window.isSignedIn?.() === true;
    guestPicker = document.createElement('details');
    guestPicker.className = 'feed-topic-picker feed-guest-topic-picker';
    guestPicker.innerHTML = '<summary class="type-h4-caps">Explore by topic <span class="topic-picker-disclosure"><span class="topic-picker-optional">Optional</span><span class="icon-arrow icon-arrow--down" aria-hidden="true"></span></span></summary>' + topicPickerTemplate
      .replace(/feed-topics-/g, 'guest-topics-')
      .replace(/<header[\s\S]*?<\/header>/, '<p class="topic-picker-helper" id="guest-topics-helper">Choose topics for this visit. These choices stay separate from your account.</p>')
      .replace('Update My Feed', 'Explore These Topics')
      .replace('<p class="visually-hidden" data-topic-status', '<button class="guest-topics-clear" type="button" data-clear-topics>Clear topics</button><p class="visually-hidden" data-topic-status');
    guestSlot.append(guestPicker);
    (document.querySelector('.feed-explore-slot') || slot).after(guestSlot);
  }

  function bindPicker(picker, guest = false) {

    const buttons = [...picker.querySelectorAll('[data-topic]')];
    const submit = picker.querySelector('.topic-picker-submit');
    const status = picker.querySelector('[data-topic-status]');
    // Account drafts start empty; guests see their explicit choices from this visit.
    const selected = new Set(guest ? readSelectedTopics(feedPreferenceStorage(false)) : []);

    function sync() {
      buttons.forEach(button => button.setAttribute('aria-pressed', String(selected.has(button.dataset.topic))));
      submit.disabled = selected.size === 0;
      status.textContent = selected.size === 0 ? 'No topics selected' : `${selected.size} topic${selected.size === 1 ? '' : 's'} selected`;
      const clear = picker.querySelector('[data-clear-topics]');
      if (clear) clear.hidden = !selected.size && !readSelectedTopics(feedPreferenceStorage(false)).length;
    }
    buttons.forEach(button => button.addEventListener('click', () => {
      const id = button.dataset.topic;
      if (selected.has(id)) selected.delete(id);
      else selected.add(id);
      sync();
    }));
    picker.querySelector('form').addEventListener('submit', event => {
      event.preventDefault();
      if (!selected.size || (window.isSignedIn?.() === true) === guest) return;
      if (saveSelectedTopics([...selected], feedPreferenceStorage(!guest)) === null) {
        window.showToast('Your topics could not be saved. Please try again.');
        return;
      }
      if (!guest) selected.clear();
      sync();
      if (compact) { location.href = 'feed.html?topics-updated=1#for-you'; return; }
      document.dispatchEvent(new Event('feed-topics-updated'));
      window.showToast(guest ? 'Discover updated for this visit only.' : 'Your feed has been updated.');
    });
    picker.querySelector('[data-clear-topics]')?.addEventListener('click', () => {
      if (saveSelectedTopics([], feedPreferenceStorage(false)) === null) { window.showToast('Your topics could not be cleared. Please try again.'); return; }
      selected.clear(); sync();
      document.dispatchEvent(new Event('feed-topics-updated'));
      window.showToast('Showing all topics.');
    });
    sync();
  }
  bindPicker(picker);
  if (guestPicker) bindPicker(guestPicker, true);
  const syncVisibility = () => {
    const signedIn = window.isSignedIn?.() === true;
    slot.hidden = !signedIn;
    if (guestSlot) guestSlot.hidden = signedIn;
  };
  document.addEventListener('auth-change', syncVisibility);
  window.addEventListener('pageshow', syncVisibility);
  syncVisibility();
  document.dispatchEvent(new Event('feed-modules-ready'));
  if (!compact) {
    const url = new URL(location.href);
    if (url.searchParams.get('topics-updated') === '1') {
      url.searchParams.delete('topics-updated');
      history.replaceState(history.state, '', url);
      window.showToast('Your feed has been updated.');
    }
  }
})();
