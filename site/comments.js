import { createCommentStore, COMMENT_LIMIT, COMMENT_USER } from './comments-state.js';
import { escapeText as esc } from './story-card.js';

const article = document.querySelector('article.article');
if (article) setupComments(article);

function setupComments(article) {
  const story = location.pathname.split('/').pop();
  const signedIn = () => window.isSignedIn?.() === true;
  const readerName = () => { try { return sessionStorage.getItem('profile-name') || 'Clementine'; } catch { return 'Clementine'; } };
  const store = createCommentStore({ storage: { getItem: key => localStorage.getItem(key), setItem: (key, value) => localStorage.setItem(key, value) }, signedIn, name: readerName });
  const section = document.createElement('details');
  section.className = 'article-comments'; section.id = 'comments';
  section.setAttribute('aria-labelledby', 'comments-heading');
  section.innerHTML = `<summary class="comments-toggle"><h2 id="comments-heading" tabindex="-1"><span class="material-symbols-outlined comments-chat-icon" aria-hidden="true">chat</span><span>Comments <span class="comments-count"></span></span></h2><span class="comments-toggle-label">Show comments</span></summary><div class="comments-content"><header class="comments-header"><label class="comments-order" for="comments-sort">Sort by</label><select class="feed-trend-sort" id="comments-sort"><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="liked">Most liked</option></select></header>
    <div class="comments-composer"></div><p class="comments-status" role="status"></p><ol class="comments-list"></ol>
    <button class="comments-more comments-text-button" type="button" hidden>View all comments</button></div>`;
  const readingEnd = article.querySelector('.article-members');
  if (readingEnd) readingEnd.after(section);
  else article.querySelector('.article-body').append(section);
  section.addEventListener('toggle', () => { section.querySelector('.comments-toggle-label').textContent = section.open ? 'Hide comments' : 'Show comments'; });
  const list = section.querySelector('.comments-list');
  const status = section.querySelector('.comments-status');
  const more = section.querySelector('.comments-more');
  const sortControl = section.querySelector('#comments-sort');
  let expanded = false;
  let formTarget = null;
  let formMode = null;
  let deleting = null;
  const draftKey = target => `trendhunter.comment-draft:${story}:${target || 'new'}`;
  const draft = target => { try { return sessionStorage.getItem(draftKey(target)) || ''; } catch { return ''; } };
  const saveDraft = (target, value) => { try { if (value) sessionStorage.setItem(draftKey(target), value); else sessionStorage.removeItem(draftKey(target)); } catch {} };
  const tell = message => { status.textContent = ''; window.showToast?.(esc(message)); };
  const error = issue => {
    if (issue.message === 'AUTH_REQUIRED') { login(); return; }
    status.textContent = issue.message === 'INVALID_TEXT' ? `Write between 1 and ${COMMENT_LIMIT} characters.` : 'Couldn’t save that change. Your text is still here. Please try again.';
  };
  function login() {
    try { sessionStorage.setItem('return-to', `${story}#comments`); } catch {}
    location.href = 'login.html';
  }
  function formMarkup(mode = 'post', target = '', value = '') {
    const label = mode === 'reply' ? 'Write a reply' : mode === 'edit' ? 'Edit your comment' : 'What’s your take?';
    const fieldId = `comment-text-${target || 'new'}`;
    return `<form class="comment-form" data-mode="${mode}" data-target="${esc(target)}">
      <label for="${esc(fieldId)}">${label}</label><textarea id="${esc(fieldId)}" name="comment" rows="3" maxlength="${COMMENT_LIMIT}" aria-describedby="${esc(fieldId)}-count" required>${esc(value)}</textarea>
      <div class="comment-form-footer"><span class="comment-character-count" id="${esc(fieldId)}-count">${value.length}/${COMMENT_LIMIT}</span><div class="comment-form-actions">${mode !== 'post' ? '<button class="comments-text-button" type="button" data-comment-action="cancel">Cancel</button>' : ''}<button class="button-primary comment-submit" type="submit"${value.trim() ? '' : ' disabled'}>${mode === 'edit' ? 'Save changes' : mode === 'reply' ? 'Post reply' : 'Post comment'}</button></div></div></form>`;
  }
  function timeLabel(date) {
    const elapsed = Math.max(0, Date.now() - new Date(date).getTime());
    if (elapsed < 60000) return 'Just now';
    if (elapsed < 3600000) return `${Math.floor(elapsed / 60000)}m ago`;
    if (elapsed < 86400000) return `${Math.floor(elapsed / 3600000)}h ago`;
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  function commentMarkup(item, replies = []) {
    const owner = item.authorId === COMMENT_USER;
    const own = owner && signedIn();
    const author = owner ? readerName() : item.name;
    const identity = `<img class="comment-avatar" src="${esc(item.avatar)}" alt="" width="32" height="32" loading="lazy"><span>${esc(author)}${own ? ' <span class="comment-you">· You</span>' : ''}</span>`;
    const body = item.deleted ? '<p class="comment-deleted">This comment was deleted.</p>' : `<p class="comment-text">${esc(item.text)}</p>`;
    const action = (name, text, extra = '') => `<button class="comments-text-button" type="button" data-comment-action="${name}" ${extra}>${text}</button>`;
    const heart = `<button class="comments-text-button comment-like" type="button" data-comment-action="like" aria-pressed="${item.liked && signedIn()}" aria-label="Like comment by ${esc(author)}"><span class="comment-heart-icon" aria-hidden="true"></span><span class="comment-like-count">${item.likes + (item.liked ? 1 : 0)}</span></button>`;
    return `<li class="comment-item${item.parentId ? ' comment-item--reply' : ''}" data-comment-id="${esc(item.id)}">
      <div class="comment-identity">${signedIn() ? `<a class="comment-author" href="${esc(item.profile)}">${identity}</a>` : `<span class="comment-author">${identity}</span>`}<time datetime="${esc(item.createdAt)}" title="${esc(new Date(item.createdAt).toLocaleString())}">${timeLabel(item.createdAt)}${item.editedAt ? ' · Edited' : ''}</time></div>
      ${formTarget === item.id && formMode === 'edit' ? formMarkup('edit', item.id, draft(`edit-${item.id}`) || item.text) : body}
      ${!item.deleted ? `<div class="comment-actions">${heart}${!item.parentId ? action('reply', 'Reply', `aria-expanded="${formTarget === item.id && formMode === 'reply'}"`) : ''}${own ? action('edit', 'Edit') + action('delete', 'Delete') : action('report', item.reported ? 'Reported' : 'Report', item.reported ? 'disabled' : '')}</div>` : ''}
      ${deleting === item.id ? `<div class="comment-delete-confirm"><p>Delete your comment?</p>${action('cancel-delete', 'Cancel')}${action('confirm-delete', 'Delete comment')}</div>` : ''}
      ${formTarget === item.id && formMode === 'reply' ? formMarkup('reply', item.id, draft(item.id)) : ''}
      ${replies.length ? `<ol class="comment-replies" aria-label="Replies to ${esc(author)}">${replies.map(reply => commentMarkup(reply)).join('')}</ol>` : ''}</li>`;
  }
  function renderList() {
    let comments;
    try { comments = store.read(story); }
    catch { status.textContent = 'Couldn’t load the discussion. Please reload to try again.'; more.hidden = true; return; }
    const roots = comments.filter(item => !item.parentId).sort((a, b) => {
      if (sortControl.value === 'oldest') return a.createdAt.localeCompare(b.createdAt);
      if (sortControl.value === 'liked') {
        const difference = (b.likes + Number(b.liked)) - (a.likes + Number(a.liked));
        if (difference) return difference;
      }
      return b.createdAt.localeCompare(a.createdAt);
    });
    section.querySelector('.comments-count').textContent = `(${comments.filter(item => !item.deleted).length})`;
    list.innerHTML = (expanded ? roots : roots.slice(0, 3)).map(item => commentMarkup(item, comments.filter(reply => reply.parentId === item.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt)))).join('');
    more.hidden = expanded || roots.length <= 3;
    more.textContent = `View all ${roots.length} comments`;
    if (!roots.length) list.innerHTML = '<li class="comments-empty">Start the conversation. What stood out to you?</li>';
  }
  function renderComposer() {
    section.querySelector('.comments-composer').innerHTML = signedIn()
      ? `<p class="comments-posting-as">Commenting as ${esc(readerName())}</p>${formMarkup('post', '', draft(''))}`
      : '<div class="comments-sign-in"><p>Join the conversation</p><p>Sign in to share your take or reply to the community.</p><a class="button-primary comments-login" href="login.html">Sign in to comment</a></div>';
  }
  sortControl.addEventListener('change', () => { renderList(); sortControl.focus({ preventScroll: true }); });
  section.addEventListener('input', event => {
    if (!event.target.matches('textarea')) return;
    const field = event.target; const form = field.closest('form');
    saveDraft(`${form.dataset.mode === 'edit' ? 'edit-' : ''}${form.dataset.target}`, field.value);
    form.querySelector('.comment-character-count').textContent = `${field.value.length}/${COMMENT_LIMIT}`;
    form.querySelector('[type="submit"]').disabled = !field.value.trim() || field.value.length > COMMENT_LIMIT;
  });
  section.addEventListener('submit', event => {
    event.preventDefault();
    const form = event.target; const { mode, target } = form.dataset;
    const field = form.querySelector('textarea');
    try {
      if (mode === 'edit') store.edit(story, target, field.value);
      else store.post(story, field.value, target || null);
      saveDraft(`${mode === 'edit' ? 'edit-' : ''}${target}`, '');
      formTarget = formMode = null;
      renderComposer(); renderList();
      if (mode === 'post') section.querySelector('textarea')?.focus({ preventScroll: true });
      else section.querySelector(`[data-comment-id="${CSS.escape(target)}"] [data-comment-action="${mode === 'edit' ? 'edit' : 'reply'}"]`)?.focus({ preventScroll: true });
      tell(mode === 'edit' ? 'Comment updated.' : mode === 'reply' ? 'Reply posted.' : 'Comment posted.');
    } catch (issue) { error(issue); }
  });
  section.addEventListener('click', event => {
    if (event.target.closest('.comments-login')) { event.preventDefault(); login(); return; }
    const button = event.target.closest('[data-comment-action]');
    if (!button) return;
    const item = button.closest('[data-comment-id]');
    const target = item?.dataset.commentId;
    const action = button.dataset.commentAction;
    if (action === 'cancel' || action === 'cancel-delete') {
      const originalMode = formMode;
      formTarget = formMode = deleting = null; renderList();
      section.querySelector(`[data-comment-id="${CSS.escape(target)}"] [data-comment-action="${action === 'cancel-delete' ? 'delete' : originalMode}"]`)?.focus({ preventScroll: true });
      return;
    }
    if (!signedIn()) { login(); return; }
    try {
      if (action === 'like') {
        store.like(story, target);
        const comment = store.read(story).find(value => value.id === target);
        const count = comment.likes + (comment.liked ? 1 : 0);
        button.setAttribute('aria-pressed', String(comment.liked));
        button.querySelector('.comment-like-count').textContent = count;
      } else if (action === 'reply' || action === 'edit') {
        formTarget = target; formMode = action; deleting = null; renderList();
        section.querySelector(`[data-comment-id="${CSS.escape(target)}"] textarea`)?.focus({ preventScroll: true });
      } else if (action === 'delete') { deleting = target; renderList(); section.querySelector('[data-comment-action="cancel-delete"]')?.focus({ preventScroll: true }); }
      else if (action === 'confirm-delete') {
        store.remove(story, target); deleting = formTarget = formMode = null; renderList();
        section.querySelector('#comments-heading').focus({ preventScroll: true }); tell('Comment deleted.');
      } else if (action === 'report') { store.report(story, target); button.textContent = 'Reported'; button.disabled = true; tell('Comment reported.'); }
    } catch (issue) { error(issue); }
  });
  more.addEventListener('click', () => {
    expanded = true; renderList();
    list.children[3]?.querySelector('button, a')?.focus({ preventScroll: true });
  });
  document.addEventListener('auth-change', () => { formTarget = formMode = deleting = null; renderComposer(); renderList(); });
  window.addEventListener('storage', event => { if (event.key === `trendhunter.comments.v1:${story}`) renderList(); });
  renderComposer(); renderList();
  // The module mounts after parsing; restore a sign-in return anchor without auto-posting.
  if (location.hash === '#comments') { section.open = true; section.scrollIntoView({ block: 'start' }); }
}
