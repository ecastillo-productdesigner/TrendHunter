import { COLLECTIONS } from './collection-data.js';
import { FOLLOWED_COLLECTIONS_KEY, readFollowedCollections, setCollectionFollowed, recommendedCollections } from './collection-follow-state.js';

const catalog = new Map(COLLECTIONS.map(collection => [collection.href, collection]));
const followButtons = [...document.querySelectorAll('[data-collection-follow]')];
const followedLists = [...document.querySelectorAll('[data-followed-list]')];
const recommendedList = document.querySelector('[data-recommended-list]');

function savedCollections() {
  try { return readFollowedCollections(localStorage); } catch { return []; }
}

function collectionCard(collection) {
  const item = document.createElement('li');
  const link = document.createElement('a');
  link.className = 'pill-button';
  link.href = collection.href;
  link.append(document.createTextNode(`${collection.name} `));
  const momentum = document.createElement('span');
  momentum.className = `collection-momentum collection-momentum--${collection.direction}`;
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
  item.append(link);
  return item;
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
    list.replaceChildren(...followed.slice().reverse().map(href => collectionCard(catalog.get(href))));
    list.hidden = followed.length === 0;
  }
  document.querySelectorAll('[data-followed-empty]').forEach(empty => { empty.hidden = followed.length > 0; });
  document.querySelectorAll('[data-followed-section]').forEach(section => { section.hidden = followed.length === 0; });
  if (recommendedList) {
    const recommendations = recommendedCollections(followed);
    recommendedList.replaceChildren(...recommendations.map(collectionCard));
    document.querySelector('[data-recommended-section]').hidden = recommendations.length === 0;
  }
  if (document.body.dataset.feedView === 'collections') {
    document.getElementById('feed-view-status').textContent = `${followed.length} followed collection${followed.length === 1 ? '' : 's'}`;
  }
}

function notify(collection, following) {
  const text = document.createElement('span');
  text.textContent = following ? `You’re following ${collection.name}. ` : `You’re no longer following ${collection.name}. `;
  const link = document.createElement('a');
  link.className = 'toast-link';
  link.href = 'feed.html#collections';
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
window.addEventListener('storage', event => { if (event.key === FOLLOWED_COLLECTIONS_KEY || event.key === null) renderCollections(); });
window.addEventListener('pageshow', renderCollections);
renderCollections();
