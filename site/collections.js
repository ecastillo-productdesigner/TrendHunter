import { COLLECTIONS } from './collection-data.js';
import { FOLLOWED_COLLECTIONS_KEY, readFollowedCollections, setCollectionFollowed, recommendedCollections } from './collection-follow-state.js';

import { COLLECTION_READ_KEY, COLLECTION_UPDATES_PREVIEW_KEY, collectionUpdatePreviewPending, dismissCollectionUpdatesPreview, COLLECTION_UPDATES_SEEN_KEY, COLLECTION_CARDS_SEEN_KEY, unreadCollectionStories, unseenCollectionCards, unnoticedCollectionStories, acknowledgeCollectionUpdates, markCollectionCardSeen } from './collection-update-state.js';
import { interestLevel } from './collection-data.js';

import { editorialStoryCard } from './story-card.js';
import { COLLECTION_STORIES } from './collection-story-data.js';
import { followedStoryList } from './followed-story-filter.js';

const catalog = new Map(COLLECTIONS.map(collection => [collection.href, collection]));
const followButtons = [...document.querySelectorAll('[data-collection-follow]')];
const followedLists = [...document.querySelectorAll('[data-followed-list]')];
const recommendedList = document.querySelector('[data-recommended-list]');
const followedStories = document.querySelector('[data-followed-stories]');
const collectionFilters = document.querySelector('.followed-collection-filters');
let selectedCollection = new URLSearchParams(location.search).get('collection') || 'all';

function savedCollections() {
  try { return readFollowedCollections(localStorage); } catch { return []; }
}

function collectionCard(collection, showUpdates = false) {
  const item = document.createElement('li');
  const link = document.createElement('a');
  link.className = 'pill-button';
  link.href = collection.href;
  if (showUpdates) link.addEventListener('click', () => {
    unreadStories(collection.href).forEach(href => markCollectionCardSeen(localStorage,href));
    link.querySelector('.collection-new-badge')?.remove();
    link.classList.remove('pill-button--has-updates');
  });
  link.append(document.createTextNode(`${collection.name} `));
  const momentum = document.createElement('span');
  momentum.className = `collection-momentum collection-momentum--${collection.direction}`;
  momentum.dataset.level = interestLevel(collection.percentage);
  momentum.setAttribute('role', 'img');
  const label = `Interest ${collection.direction} ${collection.percentage}%`;
  momentum.setAttribute('aria-label', label);
  momentum.title = label;
  const track = document.createElement('span');
  track.className = 'collection-momentum-track';
  track.setAttribute('aria-hidden', 'true');
  const fill = document.createElement('span');
  fill.className = 'collection-momentum-fill';
  track.append(fill);
  const value = document.createElement('span');
  value.className = 'collection-momentum-value';
  value.setAttribute('aria-hidden', 'true');
  value.textContent = `${collection.percentage}%`;
  momentum.append(track, value);
  link.append(momentum);
  const unread = showUpdates ? newCards(unreadStories(collection.href)) : [];
  if (unread.length) {
    link.classList.add('pill-button--has-updates');
    const badge = document.createElement('span');
    badge.className = 'collection-new-badge';
    badge.textContent = String(unread.length);
    badge.setAttribute('role','img');
    badge.setAttribute('aria-label',`${unread.length} new ${unread.length === 1 ? 'story' : 'stories'}`);
    link.append(badge);
  }
  item.append(link);
  return item;
}

function unreadStories(href) {
  try { return unreadCollectionStories(localStorage, href); } catch { return []; }
}

function newCards(stories) {
  try { return unseenCollectionCards(localStorage, stories); } catch { return stories; }
}

// Observe media instead of the entire card, which may be taller than a phone.
// A short dwell avoids clearing markers on cards flashed past while scrolling.
const seenTimers = new Map();
const seenObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
  for (const entry of entries) {
    clearTimeout(seenTimers.get(entry.target));
    seenTimers.delete(entry.target);
    if (!entry.isIntersecting || entry.intersectionRatio < .5 || document.hidden) continue;
    seenTimers.set(entry.target, setTimeout(() => {
      seenTimers.delete(entry.target);
      if (document.hidden || !entry.target.isConnected) return;
      const card = entry.target.closest('.trend-card');
      const href = card?.querySelector('.bookmark-button')?.dataset.href;
      let saved = false;
      try { saved = markCollectionCardSeen(localStorage, href); } catch {}
      if (!saved) return;
      document.querySelectorAll('.trend-card').forEach(other => {
        if (other.querySelector('.bookmark-button')?.dataset.href === href) other.querySelector('.followed-story-update')?.remove();
      });
      seenObserver.unobserve(entry.target);
    }, 600));
  }
}, { threshold: .5 }) : null;

function observeNewCards() {
  document.querySelectorAll('.trend-card:has(.followed-story-update) .trend-card-media').forEach(media => seenObserver?.observe(media));
}
document.addEventListener('visibilitychange', () => {
  for (const timer of seenTimers.values()) clearTimeout(timer);
  seenTimers.clear();
  if (!document.hidden) { seenObserver?.disconnect(); observeNewCards(); }
});

function renderUpdateSignals(followed) {
  if (!document.body.classList.contains('page-feed')) return;
  const unread = new Set(newCards(followed.flatMap(unreadStories)));
  const preview = collectionUpdatePreviewPending(localStorage);
  let unnoticed = [...unread];
  try {
    if (document.body.dataset.feedView === 'collections' && !preview) acknowledgeCollectionUpdates(localStorage, [...unread]);
    unnoticed = unnoticedCollectionStories(localStorage, [...unread]);
  } catch {}
  const tab = document.querySelector('[data-feed-view="collections"][role="tab"]');
  if (tab) {
    let dot = tab.querySelector('.collection-updates-dot');
    if (!dot) {
      dot = document.createElement('span');
      dot.className = 'collection-updates-dot';
      dot.setAttribute('aria-hidden', 'true');
      tab.append(dot);
    }
    dot.hidden = unnoticed.length === 0 && !preview;
    if (unnoticed.length) tab.setAttribute('aria-label', `Collections, ${unnoticed.length} new ${unnoticed.length === 1 ? 'story' : 'stories'}`);
    else if (preview) tab.setAttribute('aria-label','Collections, new content');
    else tab.removeAttribute('aria-label');
  }
  document.querySelectorAll('.feed-list > li > .trend-card--editorial').forEach(card => {
    const href = card.querySelector('.bookmark-button')?.dataset.href;
    let label = card.querySelector('.followed-story-update');
    if (unread.has(href)) {
      if (!label) {
        label = document.createElement('p');
        label.className = 'followed-story-update';
        label.innerHTML = '<span class="collection-updates-dot" aria-hidden="true"></span><span>New in this collection</span>';
        card.prepend(label);
      }
    } else label?.remove();
  });
}

function renderFollowedStories(followed) {
  if (!followedStories) return;
  if (selectedCollection !== 'all' && !followed.includes(selectedCollection)) selectedCollection = 'all';
  collectionFilters.replaceChildren();
  for (const href of ['all', ...followed]) {
    const filter = document.createElement('button');
    filter.type = 'button';
    filter.className = 'profile-prediction-filter';
    filter.textContent = href === 'all' ? 'All' : catalog.get(href).name;
    filter.setAttribute('aria-pressed', String(href === selectedCollection));
    filter.addEventListener('click', () => {
      selectedCollection = href;
      const url = new URL(location.href);
      if (href === 'all') url.searchParams.delete('collection');
      else url.searchParams.set('collection', href);
      history.replaceState(history.state, '', url);
      renderFollowedStories(followed);
      [...collectionFilters.children].find(button => button.getAttribute('aria-pressed') === 'true')?.focus({ preventScroll: true });
    });
    collectionFilters.append(filter);
  }
  const unread = newCards(followed.flatMap(unreadStories));
  const stories = followedStoryList(COLLECTION_STORIES, followed, selectedCollection, unread);
  followedStories.innerHTML = stories.map(story => editorialStoryCard(story, catalog.get(story.collectionHref), { isNew: unread.includes(story.href) })).join('');
  collectionFilters.hidden = followed.length === 0;
  followedStories.hidden = followed.length === 0;
  if (followed.length && document.body.dataset.feedView === 'collections') {
    [...collectionFilters.children].find(button => button.getAttribute('aria-pressed') === 'true')?.scrollIntoView({ block:'nearest', inline:'nearest' });
  }
  const directory = followedStories.closest('.feed-collection-directory');
  directory.dataset.followedCount = followed.length;
  if (document.body.dataset.feedView === 'collections') {
    document.getElementById('feed-view-status').textContent = `${stories.length} stories from ${selectedCollection === 'all' ? `${followed.length} followed collections` : catalog.get(selectedCollection).name}`;
  }
  document.dispatchEvent(new Event('collection-stories-rendered'));
  observeNewCards();
}

function renderCollections() {
  const followed = savedCollections();
  const selected = new Set(followed);
  for (const button of followButtons) {
    const collection = catalog.get(button.dataset.collectionFollow);
    if (!collection) continue;
    const following = selected.has(collection.href);
    button.textContent = following ? 'Following' : 'Follow';
    button.setAttribute('aria-pressed', String(following));
    button.setAttribute('aria-label', `${following ? 'Unfollow' : 'Follow'} ${collection.name}`);
  }
  for (const list of followedLists) {
    list.replaceChildren(...followed.slice().reverse().map(href => collectionCard(catalog.get(href), true)));
    list.hidden = followed.length === 0;
  }
  document.querySelectorAll('[data-followed-empty]').forEach(empty => { empty.hidden = followed.length > 0; });
  document.querySelectorAll('[data-followed-section]').forEach(section => { section.hidden = followed.length === 0; });
  if (recommendedList) {
    const recommendations = recommendedCollections(followed);
    recommendedList.replaceChildren(...recommendations.map(collection => collectionCard(collection)));
    document.querySelector('[data-recommended-section]').hidden = recommendations.length === 0;
  }
  renderUpdateSignals(followed);
  renderFollowedStories(followed);
  observeNewCards();

}

function notify(collection, following) {
  const text = document.createElement('span');
  text.textContent = following ? `You’re following ${collection.name}. ` : `You’re no longer following ${collection.name}. `;
  const link = document.createElement('a');
  link.className = 'toast-link';
  link.href = following ? `feed.html?collection=${encodeURIComponent(collection.href)}#collections` : 'feed.html#collections';
  link.textContent = 'View Collections';
  window.showToast(text.innerHTML + link.outerHTML);
}

for (const button of followButtons) {
  button.addEventListener('click', () => {
    const collection = catalog.get(button.dataset.collectionFollow);
    if (!collection) return;
    const following = !savedCollections().includes(collection.href);
    let saved;
    try { saved = setCollectionFollowed(localStorage, collection.href, following); } catch { saved = null; }
    if (!saved) {
      window.showToast('Couldn’t save this collection. Please try again.');
      return;
    }
    renderCollections();
    notify(collection, following);
  });
}
window.addEventListener('storage', event => { if ([FOLLOWED_COLLECTIONS_KEY, COLLECTION_UPDATES_PREVIEW_KEY, COLLECTION_READ_KEY, COLLECTION_UPDATES_SEEN_KEY, COLLECTION_CARDS_SEEN_KEY, null].includes(event.key)) renderCollections(); });
document.addEventListener('feed-view-selected', event => { if (event.detail === 'collections') { dismissCollectionUpdatesPreview(localStorage); renderCollections(); } });
document.addEventListener('collection-updates-preview',renderCollections);
window.addEventListener('pageshow', () => {
  selectedCollection = new URLSearchParams(location.search).get('collection') || 'all';
  renderCollections();
});
renderCollections();
