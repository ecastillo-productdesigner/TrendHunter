import { answerResponseMarkup } from '../answer-markup.js?v=1';

const status = document.querySelector('[data-ds-dialog-status]');
const triggers = new Map();
document.querySelectorAll('[data-ds-dialog-open]').forEach(trigger => {
  const dialog = document.getElementById(trigger.dataset.dsDialogOpen);
  trigger.addEventListener('click', () => { triggers.set(dialog, trigger); dialog.showModal(); });
});
const dialogs = document.querySelectorAll('#ds-dialog-previews dialog');
dialogs.forEach(dialog => {
  dialog.querySelector('.auth-close, .share-sheet-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
  });
  dialog.addEventListener('close', () => triggers.get(dialog)?.focus({ preventScroll: true }));
});
const edit = document.getElementById('ds-edit-profile-modal');
const nameInput = edit.querySelector('input');
const namePreview = edit.querySelector('.edit-profile-preview');
const save = edit.querySelector('.edit-profile-save');
nameInput.addEventListener('input', () => {
  const name = nameInput.value.trim();
  namePreview.textContent = name || 'Clementine';
  save.disabled = !name || name === 'Clementine';
});
edit.querySelector('form').addEventListener('submit', event => {
  event.preventDefault();
  if (save.disabled) return;
  status.textContent = `Preview saved as ${nameInput.value.trim()}. Your profile is unchanged.`;
  edit.close();
});
edit.addEventListener('close', () => { nameInput.value = 'Clementine'; namePreview.textContent = 'Clementine'; save.disabled = true; });
document.getElementById('ds-auth-prompt').addEventListener('click', event => {
  if (!event.target.closest('.auth-providers button, a')) return;
  event.preventDefault();
});
const share = document.getElementById('ds-share-fallback');
const copy = share.querySelector('.share-sheet-copy');
const copyLabel = copy.querySelector('[data-share-copy-label]');
let copyTimer;
copy.addEventListener('click', async () => {
  clearTimeout(copyTimer);
  try {
    await navigator.clipboard.writeText(share.querySelector('input').value);
    copy.classList.add('is-copied');
    copyLabel.textContent = 'Link Copied';
    copyTimer = setTimeout(resetCopy, 5000);
  } catch { copyLabel.textContent = 'Select and copy the link'; }
});
function resetCopy() { clearTimeout(copyTimer); copy.classList.remove('is-copied'); copyLabel.textContent = 'Copy link'; }
share.addEventListener('close', resetCopy);
share.querySelector('.share-sheet-email').addEventListener('click', event => event.preventDefault());

const example = document.querySelector('[data-ds-answer-preview]');
const thread = example.querySelector('[data-ds-answer-thread]');
const form = example.querySelector('form');
const input = form.querySelector('input');
const announcement = example.querySelector('[role="status"]');
const initial = thread.innerHTML;
let count = 1;
function specimen(question, index) {
  return answerResponseMarkup(question, index)
    .replaceAll('data-answer-share ', 'data-ds-answer-share ')
    .replace(/(id|href)="(#?)(answer-[^"]+)"/g, '$1="$2ds-preview-$3"')
    .replace(/(href|src)="(?!#|https?:)([^"]+)"/g, '$1="../$2"');
}
form.addEventListener('submit', event => {
  event.preventDefault();
  const question = input.value.replace(/\s+/g, ' ').trim().slice(0, 200);
  if (!question) { input.focus(); return; }
  if (count >= 6) { announcement.textContent = 'Start a new thread to ask more questions.'; return; }
  thread.insertAdjacentHTML('beforeend', specimen(question, count++));
  input.value = '';
  input.placeholder = 'Ask a follow-up...';
  const heading = thread.lastElementChild.querySelector('.answer-question');
  heading.focus({ preventScroll: true });
  // Scroll only this specimen, keeping the guide's position unchanged.
  const viewport = example.closest('.ds-answer-viewport');
  viewport.scrollTop += heading.getBoundingClientRect().top - viewport.getBoundingClientRect().top - 24;
  announcement.textContent = 'Your fictional example answer is ready.';
});
example.addEventListener('click', event => {
  const feedback = event.target.closest('[data-answer-feedback]');
  if (feedback) {
    const selected = feedback.getAttribute('aria-pressed') !== 'true';
    feedback.closest('.answer-feedback-row').querySelectorAll('[data-answer-feedback]').forEach(button => button.setAttribute('aria-pressed', String(button === feedback && selected)));
    announcement.textContent = selected ? 'Thanks for your feedback.' : 'Feedback cleared.';
  }
  const scroll = event.target.closest('[data-source-scroll]');
  if (scroll) {
    const track = scroll.closest('.answer-sources').querySelector('.answer-source-track');
    track.scrollBy({ left: Number(scroll.dataset.sourceScroll) * track.clientWidth * 0.8, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }
  if (event.target.closest('[data-ds-answer-share]')) {
    triggers.set(share, event.target.closest('[data-ds-answer-share]'));
    share.showModal();
  }
  const citation = event.target.closest('.answer-citation');
  if (citation) {
    event.preventDefault();
    const source = example.querySelector(citation.getAttribute('href'));
    const viewport = example.closest('.ds-answer-viewport');
    viewport.scrollTop += source.getBoundingClientRect().top - viewport.getBoundingClientRect().top - 16;
  }
});
example.querySelector('[data-ds-answer-reset]').addEventListener('click', () => {
  thread.innerHTML = initial;
  count = 1;
  input.value = '';
  example.closest('.ds-answer-viewport').scrollTop = 0;
  announcement.textContent = 'Preview reset.';
});
