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

    const direction = view === 'trending-up' ? 'rising' : view === 'trending-down' ? 'falling' : null;
    let count = 0;
    for (const item of list.children) {
      const story = item.querySelector(':scope > .trend-card');
      if (!story) continue;
      item.hidden = Boolean(direction && !story.querySelector(`.collection-momentum--${direction}`));
      if (!item.hidden) count += 1;
    }
    status.textContent = view === 'collections'
      ? `${directory.querySelectorAll('.collection-list > li').length} collections`
      : `${count} stories in ${names[view]}`;

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
  window.addEventListener('hashchange', () => select(viewFromUrl()));
  select(viewFromUrl(), { resetScroll: false });
})();
