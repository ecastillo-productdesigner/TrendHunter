import { TOPIC_STORAGE_KEY, readSelectedTopics, personalizeStorySlots } from './feed-personalization.js?v=topics-9';

import { RECOMMENDATION_FEEDBACK_KEY, readRecommendationFeedback, rankRecommendationSlots, placeRecommendations } from './recommendation-feedback.js';
import { feedViews, resolveFeedView } from './feed-view-state.js?v=2';
import { bindChangingCollections } from './changing-collections.js?v=3';

// Feed views reuse existing stories and the single live prediction deck.
(() => {
  const navigation = document.querySelector('[data-feed-tabs]');
  const panel = document.querySelector('.feed-tab-panel');
  if (!navigation || !panel) return;

  const tabs = [...navigation.querySelectorAll('[role="tab"]')];
  const list = panel.querySelector('.feed-list');
  const directory = panel.querySelector('.feed-collection-directory');
  const changingDirectory = panel.querySelector('[data-changing-directory]');
  const changing = bindChangingCollections(changingDirectory);
  const heading = panel.querySelector('#feed-view-heading');
  const status = panel.querySelector('#feed-view-status');
  const main = panel.closest('main');
  const sortFilters = panel.querySelector('[data-trend-sort-filters]');
  const sortFromUrl = () => {
    const value = new URLSearchParams(location.search).get('sort');
    return ['smallest','ascending'].includes(value) ? 'smallest' : 'biggest';
  };
  const originalItems = [...list.children];
  const movementSamples = new Map([...document.querySelectorAll('.trend-card--mover')].map(card => [card.querySelector('.trend-card-title-link')?.getAttribute('href'), card.querySelector('.mover-update-text')?.textContent]));
  // Fixed prototype recency examples, shared with Caught on the Move where available.
  originalItems.forEach((item, index) => {
    const card = item.querySelector(':scope > .trend-card');
    if (!card) return;
    const collection = card.querySelector('.trend-card-collection');
    const href = card.querySelector('.trend-card-title-link')?.getAttribute('href');
    const hours = index % 6 + 1;
    const update = document.createElement('p');
    update.className = 'moving-story-update';
    const direction = card.querySelector('.collection-momentum--falling') ? 'down' : 'up';
    const arrow = document.createElement('span');
    arrow.className = 'mover-direction material-symbols-outlined';
    arrow.dataset.direction = direction;
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = `arrow_drop_${direction}`;
    const description = document.createElement('span');
    description.className = 'visually-hidden';
    description.textContent = `Moved ${direction} · `;
    const time = document.createElement('span');
    time.textContent = movementSamples.get(href)?.replace(/^Moved (up|down) ·\s*/, '') || `${hours}hr${hours === 1 ? '' : 's'} ago`;
    update.append(arrow, description, time);
    if (collection) {
      const meta = document.createElement('div');
      meta.className = 'trend-card-meta';
      collection.before(meta);
      meta.append(collection, update);
    }
  });
  let preferences = readSelectedTopics();
  let feedback = readRecommendationFeedback();
  let currentOrder = '';
  const topicsFor = item => {
    const story = item.querySelector(':scope > .trend-card');
    return story ? (story.dataset.topics || '').split(' ').filter(Boolean) : null;
  };
  const recommendationFor = item => {
    const story = item.querySelector(':scope > .trend-card');
    return story ? { recommended: Boolean(story.querySelector('.recommendation-inline')), story:story.querySelector('.bookmark-button')?.dataset.href, collection:story.querySelector('.trend-card-collection')?.getAttribute('href') } : null;
  };
  const viewFromUrl = () => location.hash.slice(1);

  function select(view, { updateUrl = false, resetScroll = true } = {}) {
    const signedIn = window.isSignedIn?.() === true;
    const names = feedViews(signedIn);
    view = resolveFeedView(view, signedIn);
    navigation.hidden = false;
    tabs.forEach(tab => {
      tab.hidden = !Object.hasOwn(names, tab.dataset.feedView);
      if (['for-you', 'moving'].includes(tab.dataset.feedView)) tab.textContent = names[tab.dataset.feedView];
    });
    document.body.dataset.feedView = view;
    const selected = tabs.find(tab => tab.dataset.feedView === view);
    for (const tab of tabs) {
      tab.setAttribute('aria-selected', String(tab === selected));
      tab.tabIndex = tab === selected ? 0 : -1;
    }
    panel.setAttribute('aria-labelledby', selected.id);
    heading.textContent = view === 'for-you' && signedIn ? 'Your feed' : names[view];
    list.hidden = view !== 'for-you';
    panel.querySelector('[data-people-feed]').hidden = view !== 'following';
    directory.hidden = view !== 'collections';
    const moving = view === 'moving';
    changingDirectory.hidden = !moving;
    const sort = sortFromUrl();
    sortFilters.hidden = !moving;
    const sortControl = sortFilters.querySelector('[data-trend-sort]');
    const movement = 'change';
    const sortLabel = `${sort === 'biggest' ? 'Biggest' : 'Smallest'} ${movement}`;
    const nextSortLabel = `${sort === 'biggest' ? 'Smallest' : 'Biggest'} ${movement}`;
    sortControl.textContent = sortLabel;
    sortControl.setAttribute('aria-label', `${sortLabel} first. Switch to ${nextSortLabel.toLowerCase()} first`);
    if (moving) changing.sort(sort);

    const order = moving ? `${view}:${sort}` : view === 'for-you' ? `personalized:${preferences.join(',')}:${JSON.stringify(feedback)}` : 'original';
    if (order !== currentOrder) {
      const items = view === 'for-you' ? placeRecommendations(rankRecommendationSlots(personalizeStorySlots(originalItems, preferences, topicsFor), feedback, item => item.querySelector(':scope > .trend-card .trend-card-collection')?.getAttribute('href') ?? null), recommendationFor) : originalItems;
      // Move the existing nodes so saved controls and the single deck keep their state.
      items.forEach((item, index) => {
        if (list.children[index] !== item) list.insertBefore(item, list.children[index] || null);
      });
      currentOrder = order;
    }

    let count = 0;
    for (const item of list.children) {
      const story = item.querySelector(':scope > .trend-card');
      if (!story) continue;
      item.hidden = view === 'for-you' && feedback.hiddenStories.includes(story.querySelector('.bookmark-button')?.dataset.href);
      if (!item.hidden) count += 1;
    }
    const followedCount = Number(directory.dataset.followedCount || 0);
    const followedStoryCount = directory.querySelectorAll('[data-followed-stories] > li').length;
    status.textContent = view === 'collections'
      ? `${followedStoryCount} stories from ${followedCount} followed collection${followedCount === 1 ? '' : 's'}`
      : view === 'following' ? 'Updates from people you follow'
      : moving ? `${changing.count} collections in What’s Changing, ${sort} percentage change first. Illustrative data.`
      : `${count} stories in ${names[view]}${preferences.length ? ', matching interests first' : ''}`;

    document.dispatchEvent(new CustomEvent('feed-view-selected', { detail: view }));
    if (updateUrl && location.hash !== `#${view}`) history.pushState(null, '', `#${view}`);
    if (resetScroll) {
      main.scrollTo({ top: 0, behavior: 'auto' });
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
    if (resetScroll) selected.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' });
  }

  sortFilters.addEventListener('click', event => {
    const control = event.target.closest('button[data-trend-sort]');
    if (!control) return;
    const url = new URL(location.href);
    if (sortFromUrl() === 'smallest') url.searchParams.delete('sort');
    else url.searchParams.set('sort', 'smallest');
    history.replaceState(history.state,'',url);
    select(viewFromUrl(), { resetScroll:false });
    control.focus({ preventScroll:true });
  });

  for (const tab of tabs) {
    tab.addEventListener('click', () => select(tab.dataset.feedView, { updateUrl: true }));
    tab.addEventListener('keydown', event => {
      const available = tabs.filter(option => !option.hidden);
      const index = available.indexOf(tab);
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % available.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + available.length) % available.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = available.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      available[next].focus();
      select(available[next].dataset.feedView, { updateUrl: true });
    });
  }
  document.addEventListener('feed-topics-updated', () => {
    preferences = readSelectedTopics();
    select('for-you', { updateUrl: true });
    if (!navigation.hidden) tabs[0].focus({ preventScroll: true });
  });
  document.addEventListener('feed-recommendations-updated', event => {
    feedback = readRecommendationFeedback();
    // Keep the current card and scroll position while feedback is reversible.
    // Apply ranking/hiding when the visitor next opens For You or resets it.
    if (event.detail?.reset) {
      select('for-you', { updateUrl:true });
    } else if (!event.detail?.deferReorder) select(viewFromUrl(), { resetScroll: false });
  });
  window.addEventListener('storage', event => {
    if (![TOPIC_STORAGE_KEY, RECOMMENDATION_FEEDBACK_KEY].includes(event.key)) return;
    feedback = readRecommendationFeedback();
    preferences = readSelectedTopics();
    select(viewFromUrl(), { resetScroll: false });
  });
  window.addEventListener('pageshow', () => {
    feedback = readRecommendationFeedback();
    preferences = readSelectedTopics();
    select(viewFromUrl(), { resetScroll: false });
  });
  document.addEventListener('auth-change', () => select(viewFromUrl(), {resetScroll:false}));
  window.addEventListener('hashchange', () => select(viewFromUrl()));
  select(viewFromUrl(), { resetScroll: false });
})();
