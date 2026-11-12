import { createCommentStore, COMMENT_USER } from './comments-state.js';
import { COLLECTION_STORIES } from './collection-story-data.js';
import { escapeText as esc } from './story-card.js';

// Preview existing, browser-local discussions. The seeded comments are fictional.
// Randomize once per feed visit, never on a timer.
export function pickFeedComments(stories, read, { random = Math.random, limit = 3 } = {}) {
  const candidates = [...new Map(stories.map(story => [story.href, story])).values()].flatMap(story => {
    let comments;
    try { comments = read(story.href); } catch { return []; }
    const roots = comments.filter(comment => !comment.parentId && !comment.deleted && !comment.reported && comment.text.trim());
    return roots.length ? [{ story, roots, count: comments.filter(comment => !comment.deleted).length }] : [];
  });
  const pool = candidates;
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const selected = [], texts = new Set(), authors = new Set();
  for (const candidate of pool) {
    const unique = candidate.roots.filter(comment => !texts.has(comment.text));
    const newAuthors = unique.filter(comment => !authors.has(comment.authorId));
    const choices = newAuthors.length ? newAuthors : unique;
    if (!choices.length) continue;
    const comment = choices[Math.floor(random() * choices.length)];
    selected.push({ story: candidate.story, comment, count: candidate.count });
    texts.add(comment.text); authors.add(comment.authorId);
    if (selected.length >= limit) break;
  }
  return selected;
}

export function feedCommentsMarkup(previews, readerName = 'Clementine') {
  return previews.map(({ story, comment, count }) => {
    const own = comment.authorId === COMMENT_USER;
    const name = own ? readerName : comment.name;
    const readers = ['alex-rivera', 'morgan-lee', 'jamie-park', 'casey-reed', 'quinn-ellis', 'riley-chen', 'taylor-brooks'];
    const known = readers.includes(comment.authorId);
    const profile = own ? 'userprofile.html' : known ? `reader-${comment.authorId}.html` : null;
    const avatar = known ? `assets/readers/${comment.authorId}.png` : 'assets/profile/avatar-clementine.png';
    const identity = `<img src="${avatar}" alt="" width="24" height="24" loading="lazy"><span>${esc(name)}</span>`;
    const href = `${story.href}#comments`;
    return `<li class="reader-comment-preview">
      <blockquote class="reader-comment-quote"><p>“${esc(comment.text)}”</p></blockquote>
      ${profile ? `<a class="reader-comment-author" href="${profile}">${identity}</a>` : `<span class="reader-comment-author">${identity}</span>`}
      <div class="reader-comment-story">
        <a class="reader-comment-image" href="${esc(href)}" aria-label="Read: ${esc(story.title)}"><img src="${esc(story.image)}" alt="" loading="lazy"></a>
        <div><h3 class="reader-comment-headline"><a class="trend-card-title-link" href="${esc(href)}">${esc(story.title)}</a></h3><a class="reader-comment-count" href="${esc(href)}"><span class="material-symbols-outlined" aria-hidden="true">chat</span>${count} ${count === 1 ? 'comment' : 'comments'}</a></div>
      </div>
      <a class="reader-comment-join" href="${esc(href)}">Join the conversation</a>
    </li>`;
  }).join('');
}

export function mountFeedComments(list) {
  if (!list || list.querySelector('.feed-reader-comments-slot')) return;
  const slot = document.createElement('li'); slot.className = 'feed-reader-comments-slot';
  slot.innerHTML = '<section class="feed-reader-comments" aria-labelledby="feed-reader-comments-heading"><header class="reader-comments-header"><h2 id="feed-reader-comments-heading">What readers are saying</h2></header><ol class="reader-comments-list"></ol></section>';
  const store = createCommentStore({ storage: { getItem: key => localStorage.getItem(key) }, signedIn: () => false });
  function render() {
    const previews = pickFeedComments(COLLECTION_STORIES, story => store.read(story));
    let name = 'Clementine';
    try { name = sessionStorage.getItem('profile-name') || name; } catch {}
    slot.querySelector('.reader-comments-list').innerHTML = feedCommentsMarkup(previews, name);
    slot.hidden = !previews.length;
  }
  const stories = [...list.children].filter(item => item.querySelector(':scope > .trend-card'));
  const anchor = stories[11] || stories.at(-1);
  if (anchor) anchor.after(slot); else list.prepend(slot);
  render();
  window.addEventListener('pageshow', event => { if (event.persisted) render(); });
  window.addEventListener('storage', event => { if (!event.key || event.key.startsWith('trendhunter.comments.v1:')) render(); });
  document.addEventListener('auth-change', () => render());
}
