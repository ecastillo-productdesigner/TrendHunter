import { TOPIC_STORAGE_KEY, readSelectedTopics, personalizeStorySlots } from './feed-personalization.js';

// Feed views reuse existing stories and the single live prediction deck.
(() => {
  const navigation = document.querySelector('[data-feed-tabs]');
  const panel = document.querySelector('.feed-tab-panel');
  if (!navigation || !panel) return;

  const tabs = [...navigation.querySelectorAll('[role="tab"]')];
  const list = panel.querySelector('.feed-list');
  const directory = panel.querySelector('.feed-collection-directory');
  const heading = panel.querySelector('#feed-view-heading');
  const status = panel.querySelector('#feed-view-status');
  const main = panel.closest('main');
  const originalItems = [...list.children];
  const risingItems = originalItems.filter(item => item.querySelector(':scope > .trend-card .collection-momentum--rising'));
  const percentage = item => Number(item.querySelector('.collection-momentum-value').textContent.replace('%', ''));
  const rankedRisingItems = [...risingItems].sort((a, b) => percentage(b) - percentage(a));
  let preferences = readSelectedTopics();
  let currentOrder = '';
  const topicsFor = item => {
    const story = item.querySelector(':scope > .trend-card');
    return story ? (story.dataset.topics || '').split(' ').filter(Boolean) : null;
  };
  const names = {
    'for-you': 'For You',
    collections: 'Collections',
    'trending-up': 'Trending Up',
    'trending-down': 'Trending Down',
  };
  const viewFromUrl = () => Object.hasOwn(names, location.hash.slice(1)) ? location.hash.slice(1) : 'for-you';

  function select(view, { updateUrl = false, resetScroll = true } = {}) {
    if (!Object.hasOwn(names, view)) view = 'for-you';
    document.body.dataset.feedView = view;
    const selected = tabs.find(tab => tab.dataset.feedView === view);
    for (const tab of tabs) {
      tab.setAttribute('aria-selected', String(tab === selected));
      tab.tabIndex = tab === selected ? 0 : -1;
    }
    panel.setAttribute('aria-labelledby', selected.id);
    heading.textContent = view === 'for-you' ? 'Your feed' : names[view];
    list.hidden = view === 'collections';
    directory.hidden = view !== 'collections';

    const order = view === 'trending-up' ? 'rising' : view === 'for-you' ? `personalized:${preferences.join(',')}` : 'original';
    if (order !== currentOrder) {
      const ranked = new Set(rankedRisingItems);
      const items = order === 'rising'
        ? [...rankedRisingItems, ...originalItems.filter(item => !ranked.has(item))]
        : view === 'for-you' ? personalizeStorySlots(originalItems, preferences, topicsFor) : originalItems;
      // Move the existing nodes so saved controls and the single deck keep their state.
      items.forEach((item, index) => {
        if (list.children[index] !== item) list.insertBefore(item, list.children[index] || null);
      });
      currentOrder = order;
    }

    const direction = view === 'trending-up' ? 'rising' : view === 'trending-down' ? 'falling' : null;
    let count = 0;
    for (const item of list.children) {
      const story = item.querySelector(':scope > .trend-card');
      if (!story) continue;
      item.hidden = Boolean(direction && !story.querySelector(`.collection-momentum--${direction}`));
      if (!item.hidden) count += 1;
    }
    const followedCount = directory.querySelectorAll('[data-followed-list] > li').length;
    status.textContent = view === 'collections'
      ? `${followedCount} followed collection${followedCount === 1 ? '' : 's'}`
      : `${count} stories in ${names[view]}${view === 'trending-up' ? ', highest percentage gain first' : view === 'for-you' && preferences.length ? ', matching interests first' : ''}`;

    if (updateUrl && location.hash !== `#${view}`) history.pushState(null, '', `#${view}`);
    if (resetScroll) {
      main.scrollTo({ top: 0, behavior: 'auto' });
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
    selected.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' });
  }

  for (const tab of tabs) {
    tab.addEventListener('click', () => select(tab.dataset.feedView, { updateUrl: true }));
    tab.addEventListener('keydown', event => {
      const index = tabs.indexOf(tab);
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      tabs[next].focus();
      select(tabs[next].dataset.feedView, { updateUrl: true });
    });
  }
  document.addEventListener('feed-topics-updated', () => {
    preferences = readSelectedTopics();
    select('for-you', { updateUrl: true });
    tabs[0].focus({ preventScroll: true });
  });
  window.addEventListener('storage', event => {
    if (event.key !== TOPIC_STORAGE_KEY) return;
    preferences = readSelectedTopics();
    select(viewFromUrl(), { resetScroll: false });
  });
  window.addEventListener('pageshow', () => {
    preferences = readSelectedTopics();
    select(viewFromUrl(), { resetScroll: false });
  });
  window.addEventListener('hashchange', () => select(viewFromUrl()));
  select(viewFromUrl(), { resetScroll: false });
})();
