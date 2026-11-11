import { answerResponseMarkup, answerUrl } from './answer-markup.js?v=1';

(() => {
  const thread = document.getElementById('answer-thread');
  const form = document.querySelector('.answer-followup');
  const input = form.querySelector('input');
  const announcement = document.querySelector('.answer-announcement');
  const clean = value => String(value || '').replace(/\s+/g, ' ').trim().slice(0, 200);
  let initialQuestion = clean(new URLSearchParams(location.search).get('q'));
  let questions = initialQuestion ? [initialQuestion] : [];
  const storageKey = () => `answer-thread:${initialQuestion}`;
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey()));
    if (initialQuestion && Array.isArray(saved) && saved[0] === initialQuestion) questions = saved.map(clean).filter(Boolean).slice(-6);
  } catch {}
  function render() {
    thread.innerHTML = questions.length ? questions.map(answerResponseMarkup).join('') : '<section class="answer-empty"><h1 class="answer-question">What’s on your mind?</h1><p>Ask Trend Hunter about what’s next.</p></section>';
    document.title = questions.length ? `${questions[0]} — Trend Hunter Answers` : 'Trend Hunter Answers';
    input.placeholder = questions.length ? 'Ask a follow-up...' : 'Ask Trend Hunter...';
    form.setAttribute('aria-label', questions.length ? 'Ask a follow-up' : 'Ask a question');
    form.querySelector('label').textContent = questions.length ? 'Ask a follow-up' : 'Ask Trend Hunter';
    form.querySelector('button').setAttribute('aria-label', questions.length ? 'Submit follow-up' : 'Submit question');
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    const question = clean(input.value);
    if (!question) { input.focus(); return; }
    if (!questions.length) {
      initialQuestion = question;
      history.replaceState({}, '', answerUrl(question));
    }
    if (questions.length >= 6) {
      announcement.textContent = 'Start a new thread to ask more questions.';
      return;
    }
    questions.push(question);
    try { sessionStorage.setItem(storageKey(), JSON.stringify(questions)); } catch {}
    render();
    input.value = '';
    const heading = thread.querySelector(`#answer-${questions.length - 1} .answer-question`);
    heading.focus({ preventScroll: true });
    heading.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    announcement.textContent = 'Your example answer is ready.';
  });
  thread.addEventListener('click', event => {
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
  });
  document.querySelector('[data-new-thread]').addEventListener('click', () => {
    try { sessionStorage.removeItem(storageKey()); } catch {}
    questions = [];
    initialQuestion = '';
    history.pushState({}, '', 'answers.html');
    render();
    input.value = '';
    input.focus();
    window.scrollTo({ top: 0 });
  });
  render();
})();
