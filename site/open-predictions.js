// Shared open-prediction directory. Dates and catalogue entries are illustrative.
(() => {
  const directory = document.querySelector('[data-open-predictions]');
  const list = directory?.querySelector('.open-predictions-list');
  const filters = [...document.querySelectorAll('[data-open-filter]')];
  const readCalls = () => {
    try { return JSON.parse(sessionStorage.getItem(CALLS_KEY)) || {}; } catch { return {}; }
  };
  const escape = text => String(text).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  const dateLabel = value => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`));
  const selectedFilter = () => location.hash === '#not-yet-voted' ? 'unvoted' : 'all';

  function render() {
    const calls = readCalls();
    const all = openPredictionList(calls);
    document.querySelectorAll('[data-open-count]').forEach(count => { count.textContent = `(${all.length})`; });
    if (!directory) return;
    const selected = selectedFilter();
    const predictions = openPredictionList(calls, selected);
    filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.openFilter === selected)));
    directory.querySelector('[data-open-status]').textContent = `${predictions.length} ${selected === 'unvoted' ? 'not yet voted' : 'open predictions'} · Closing soonest`;
    list.innerHTML = predictions.map(prediction => {
      const call = ['in', 'out'].includes(calls[prediction.id]) ? calls[prediction.id] : null;
      return `<li class="prediction-result open-prediction" data-id="${prediction.id}">
        <a class="open-prediction-collection" href="${escape(prediction.collectionHref)}">${escape(prediction.collection)}</a>
        <h2 class="prediction-result-headline">${escape(prediction.text)}</h2>
        <div class="open-prediction-status">
          <p>Closes <time datetime="${prediction.closesOn}">${dateLabel(prediction.closesOn)}</time></p>
          ${call ? `<p class="prediction-badge prediction-badge--${call}"><span class="prediction-badge-icon" aria-hidden="true"></span>You’re ${call}</p>` : '<p class="open-prediction-unvoted">Not yet voted</p>'}
        </div>
        <p class="open-prediction-published">Published <time datetime="${prediction.publishedOn}">${dateLabel(prediction.publishedOn)}</time></p>
        <a class="prediction-card-more open-prediction-more" href="${escape(prediction.storyHref)}" aria-label="${call ? 'View your call on' : 'Make your call on'} ${escape(prediction.text)}"><span class="prediction-card-more-label">${call ? 'View your call' : 'Make your call'}</span><span class="prediction-card-more-icon" aria-hidden="true"></span></a>
      </li>`;
    }).join('');
    list.hidden = predictions.length === 0;
    directory.querySelector('.profile-empty-state').hidden = predictions.length !== 0;
  }

  filters.forEach(button => button.addEventListener('click', () => {
    history.replaceState(history.state, '', button.dataset.openFilter === 'unvoted' ? '#not-yet-voted' : '#all');
    render();
  }));
  list?.addEventListener('click', event => {
    const link = event.target.closest('.open-prediction-more');
    if (!link) return;
    const predictionId = link.closest('[data-id]').dataset.id;
    const call = readCalls()[predictionId];
    try {
      sessionStorage.setItem(RETURN_KEY, JSON.stringify({
        to: new URL(link.getAttribute('href'), location.href).pathname,
        predictionId, source: 'open', readerCall: ['in', 'out'].includes(call) ? call : null,
      }));
    } catch { /* Keep the article link available without browser storage. */ }
  });
  window.addEventListener('hashchange', render);
  window.addEventListener('pageshow', render);
  document.addEventListener('prediction-deal', render);
  document.addEventListener('auth-change', render);
  render();
})();
