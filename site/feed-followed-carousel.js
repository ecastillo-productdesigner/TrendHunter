import { FOLLOWED_COLLECTIONS_KEY, readFollowedCollections } from './collection-follow-state.js';
import { COLLECTION_STORIES } from './collection-story-data.js';
import { followedStoryList } from './followed-story-filter.js';

// Only real catalog membership is used. No follows or bookmarks are fabricated.
const slot = document.querySelector('.feed-followed-carousel-slot');
const track = slot?.querySelector('[data-followed-carousel]');
let rendered = '';
function render() {
  if (!track) return;
  let followed = [];
  try { if (document.documentElement.dataset.auth === 'signed-in') followed = readFollowedCollections(localStorage); } catch {}
  const stories = followedStoryList(COLLECTION_STORIES, followed).slice(0, 6);
  slot.hidden = !stories.length;
  const key = stories.map(story => story.href).join(',');
  if (key === rendered) return;
  rendered = key;
  track.replaceChildren(...stories.map((story, index) => {
    const item = document.createElement('li');
    item.setAttribute('role', 'group'); item.setAttribute('aria-label', `Story ${index + 1} of ${stories.length}`);
    const article = document.createElement('article'); article.className = 'bookmark-revisit-card';
    const media = document.createElement('a'); media.className = 'bookmark-revisit-media'; media.href = story.href;
    media.setAttribute('aria-label', `Read: ${story.title}`);
    const image = document.createElement('img'); image.src = story.image; image.alt = ''; image.loading = 'lazy'; media.append(image);
    const heading = document.createElement('h3'); heading.className = 'bookmark-revisit-headline';
    const link = document.createElement('a'); link.className = 'trend-card-title-link'; link.href = story.href; link.textContent = story.title;
    heading.append(link); article.append(media, heading); item.append(article); return item;
  }));
  track.scrollLeft = 0;
}
render();
document.addEventListener('auth-change', render);
document.addEventListener('collection-stories-rendered', render);
window.addEventListener('pageshow', render);
window.addEventListener('storage', event => { if ([FOLLOWED_COLLECTIONS_KEY, null].includes(event.key)) render(); });
