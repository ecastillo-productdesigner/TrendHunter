import { ARTICLE_FEEDBACK_LIMIT, ARTICLE_FEEDBACK_REASONS, readArticleFeedback, saveArticleFeedback } from './article-feedback-state.js';

export function articleFeedbackMarkup() {
  return `<div class="article-feedback-row"><p id="article-feedback-question">What did you think about this trend?</p><div class="article-feedback-votes" role="group" aria-label="Rate this trend">${[['up','Thumbs up'],['down','Thumbs down']].map(([value,label]) => `<button class="recommendation-feedback-button article-feedback-vote" type="button" data-article-feedback="${value}" aria-label="${label}" aria-pressed="false" aria-haspopup="dialog" aria-controls="article-feedback-dialog"><span class="material-symbols-outlined" aria-hidden="true">thumb_${value}</span></button>`).join('')}</div></div><p class="article-feedback-status" role="status" hidden></p>`;
}
export function articleFeedbackFormMarkup(preview = false) {
  return `<form class="article-feedback-form"><h2 id="article-feedback-title" tabindex="-1">We’d love to know what you think <span>(optional)</span></h2><fieldset><legend class="visually-hidden">Tell us why, optional</legend><div class="article-feedback-reasons">${preview ? ARTICLE_FEEDBACK_REASONS.up.map(label => `<button class="article-feedback-reason" type="button" aria-pressed="false">${label}</button>`).join('') : ''}</div></fieldset><label class="article-feedback-label" for="article-feedback-comment">Additional feedback <span>(optional)</span></label><textarea id="article-feedback-comment" name="comment" rows="4" maxlength="${ARTICLE_FEEDBACK_LIMIT}" placeholder="Provide additional feedback"></textarea><p class="article-feedback-error" role="alert" hidden></p><div class="article-feedback-form-actions"><button class="edit-profile-button article-feedback-cancel" type="button">Cancel</button><button class="button-primary" type="submit">Submit</button></div></form>`;
}
export function installArticleFeedback(articleBody) {
  if (!articleBody || articleBody.querySelector('.article-feedback')) return;
  const story = location.pathname.split('/').pop();
  const storage = { getItem: key => localStorage.getItem(key), setItem: (key, value) => localStorage.setItem(key, value) };
  let current = readArticleFeedback(storage, story), trigger;
  const section = document.createElement('section');
  section.className = 'article-feedback'; section.setAttribute('aria-labelledby', 'article-feedback-question');
  section.innerHTML = articleFeedbackMarkup();
  articleBody.insertBefore(section, articleBody.querySelector('.article-members'));
  const dialog = document.createElement('dialog');
  dialog.id = 'article-feedback-dialog'; dialog.className = 'article-feedback-dialog';
  dialog.setAttribute('aria-labelledby', 'article-feedback-title');
  dialog.innerHTML = articleFeedbackFormMarkup(); document.body.append(dialog);
  const status = section.querySelector('[role="status"]'), error = dialog.querySelector('[role="alert"]');
  const comment = dialog.querySelector('textarea'), reasons = dialog.querySelector('.article-feedback-reasons');
  function sync() {
    section.querySelectorAll('[data-article-feedback]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.articleFeedback === current?.sentiment)));
    status.hidden = !current; status.textContent = current ? 'Thanks for your feedback.' : '';
  }
  function save(value) {
    try { current = saveArticleFeedback(storage, story, value); sync(); return true; }
    catch {
      const message = 'Couldn’t save your feedback. Please try again.';
      if (dialog.open) { error.textContent = message; error.hidden = false; }
      else { status.textContent = message; status.hidden = false; }
      return false;
    }
  }
  section.addEventListener('click', event => {
    const button = event.target.closest('[data-article-feedback]');
    if (!button) return;
    trigger = button;
    const sentiment = button.dataset.articleFeedback;
    if (current?.sentiment === sentiment) { save(null); return; }
    if (!save({ sentiment, reasons: [], comment: '' })) return;
    reasons.replaceChildren(...ARTICLE_FEEDBACK_REASONS[sentiment].map(label => {
      const reason = document.createElement('button'); reason.type = 'button'; reason.className = 'article-feedback-reason';
      reason.textContent = label; reason.setAttribute('aria-pressed', 'false'); return reason;
    }));
    comment.value = ''; error.hidden = true;
    dialog.showModal(); dialog.querySelector('h2').focus();
  });
  reasons.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (button) button.setAttribute('aria-pressed', String(button.getAttribute('aria-pressed') !== 'true'));
  });
  dialog.querySelector('.article-feedback-cancel').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => trigger?.focus({ preventScroll: true }));
  dialog.querySelector('form').addEventListener('submit', event => {
    event.preventDefault();
    if (!current) return;
    if (save({ ...current, reasons: [...reasons.querySelectorAll('[aria-pressed="true"]')].map(button => button.textContent), comment: comment.value })) {
      dialog.close(); window.showToast?.('Thanks for helping us improve our stories.');
    }
  });
  window.addEventListener('storage', () => { if (!dialog.open) { current = readArticleFeedback(storage, story); sync(); } });
  sync();
}
