// Personal profiles use actual calls from the shared deck.
// Only author histories contain illustrative sample calls.
(() => {
  const profile = document.querySelector('.profile');
  const predictionPanel = document.getElementById('profile-predictions');
  if (!profile || !predictionPanel) return;

  const isAuthor = document.body.classList.contains('page-contributor');
  const authorName = profile.querySelector('.profile-name')?.textContent.trim() || 'Author';
  const authorId = profile.dataset.authorId;
  const firstName = authorName.split(' ')[0];
  const EXAMPLE_CALLS_KEY = 'profile-comparison-example-calls';
  const postsPanel = profile.querySelector('[data-profile-panel="posts"]');
  const primaryTabs = [...profile.querySelectorAll('[data-profile-section]')];
  const panels = [...profile.querySelectorAll('[data-profile-panel]')];
  const filters = predictionPanel.querySelector('.profile-prediction-filters');
  const list = predictionPanel.querySelector('.prediction-results-list');
  const empty = predictionPanel.querySelector('.profile-predictions-empty');
  let selectedFilter = isAuthor ? 'author' : 'all';
  let entrancePlayed = false;
  const callStatus = isAuthor ? document.createElement('p') : null;
  if (callStatus) {
    callStatus.className = 'visually-hidden';
    callStatus.setAttribute('role', 'status');
    predictionPanel.appendChild(callStatus);
  }

  const resolvedExamples = [
    { id: 'weekend-walking-history', text: 'Weekend-only walking will become a regular part of fitness plans', storyHref: 'trend-weekend-walking.html', sampleInPercent: 63, call: 'in', resolved: true },
    { id: 'sleep-earbuds-history', text: 'Sleep earbuds will become a standard upgrade for side sleepers', storyHref: 'trend-sleep-earbuds.html', sampleInPercent: 42, call: 'out', resolved: true },
    { id: 'seasonal-produce-history', text: 'Seasonal produce subscriptions will become a weekly shopping shortcut', storyHref: 'trend-seasonal-produce.html', sampleInPercent: 68, call: 'in', resolved: true },
  ];
  // Fictional demonstration histories, not a claim about any writer's actual votes.
  const authorExamples = {
    'maya-chen': { 'ai-holidays': 'in', 'protein-coffee': 'in', 'sober-socials': 'out', 'seasonal-produce-history': 'in' },
    'owen-brooks': { 'ai-holidays': 'in', 'retail-events': 'out', 'sleep-routines': 'in', 'weekend-walking-history': 'in' },
    'sofia-morales': { 'home-energy': 'in', 'skin-longevity': 'out', 'seasonal-produce-history': 'in' },
    'daniel-reed': { 'retail-events': 'in', 'skin-longevity': 'in', 'sober-socials': 'out' },
    'nadia-patel': { 'dollar-stores': 'in', 'run-club-connections': 'in', 'sleep-earbuds-history': 'out' },
    'marcus-bennett': { 'home-energy': 'in', 'run-club-connections': 'out', 'weekend-walking-history': 'in' },
    'samantha-agate': { 'telehealth-trt': 'in', 'skin-longevity': 'in', 'sleep-routines': 'out' },
  };

  function savedCalls() {
    try { return JSON.parse(sessionStorage.getItem(CALLS_KEY)) || {}; }
    catch { return {}; }
  }

  function savedExampleCalls() {
    try { return JSON.parse(sessionStorage.getItem(EXAMPLE_CALLS_KEY)) || {}; }
    catch { return {}; }
  }

  function personalHistory() {
    const calls = savedCalls();
    const active = PREDICTIONS.filter(prediction => calls[prediction.id] === 'in' || calls[prediction.id] === 'out')
      .map(prediction => ({ ...prediction, call: calls[prediction.id], resolved: false }));
    // Illustrative past votes make the resolved state reviewable after a first call.
    return active.length ? [...active, ...resolvedExamples] : [];
  }

  function authorHistory() {
    const calls = authorExamples[authorId] || {};
    const history = [...PREDICTIONS, ...resolvedExamples].filter(prediction => calls[prediction.id])
      .map(prediction => ({ ...prediction, call: calls[prediction.id], resolved: Boolean(prediction.resolved) }));
    if (!history.length) return history;
    // Review-only predictions show all three requested comparison states on each
    // creator profile. Their fictional reader calls never enter the daily deck.
    const examples = profileComparisonExamples(authorId);
    return [...examples, ...history];
  }

  function renderPosts() {
    if (!postsPanel) return;
    const stories = postsPanel.querySelector('.story-list');
    const postsEmpty = postsPanel.querySelector('.profile-author-empty');
    const noPosts = !stories.querySelector('.story-lockup');
    stories.hidden = noPosts;
    postsEmpty.hidden = !noPosts;
    postsPanel.classList.toggle('profile-posts--empty', noPosts);
    postsEmpty.querySelector('.profile-empty-copy').textContent = `${firstName} hasn't posted yet. Check back soon, or browse the feed for more from our contributors.`;
  }

  // Author profiles combine the creator's call and the reader's call in one row.
  // Personal status filters continue to use the existing shared result row.
  function comparisonRow(prediction, readerCall) {
    const row = resultRow(prediction, prediction.call, true, {
      resolved: prediction.resolved,
      badgeLabel: `${firstName} ${prediction.resolved ? 'was' : 'is'} ${prediction.call}`,
    });
    let comparison;
    let choices = '';
    if (readerCall) {
      comparison = `
        <div class="profile-call-comparison" data-reader-call="${readerCall}"${prediction.resolved ? ' data-resolved="true"' : ''}>
          <span class="prediction-badge prediction-badge--${readerCall}${prediction.resolved ? ' prediction-badge--resolved' : ''} profile-reader-badge">
            <span class="prediction-badge-icon" aria-hidden="true"></span>${prediction.resolved ? 'You were' : 'You’re'} ${readerCall}
          </span>
        </div>`;
    } else if (prediction.resolved) {
      comparison = '<p class="profile-call-unavailable">No vote to compare</p>';
    } else {
      comparison = `
        <div class="profile-call-comparison profile-call-comparison--pending">
          <button type="button" class="button-primary profile-call-start" data-profile-make-call aria-expanded="false" aria-controls="profile-call-${prediction.id}">Make your call</button>
        </div>`;
      choices = `<div class="profile-call-choices" id="profile-call-${prediction.id}" role="group" aria-label="Your call on ${prediction.id}" hidden>
          <button class="prediction-vote prediction-vote--out" type="button" data-profile-call="out"><span class="prediction-vote-icon" aria-hidden="true"></span>I’m out</button>
          <button class="prediction-vote prediction-vote--in" type="button" data-profile-call="in"><span class="prediction-vote-icon" aria-hidden="true"></span>I’m in</button>
        </div>`;
    }
    const template = document.createElement('template');
    template.innerHTML = row;
    const card = template.content.firstElementChild;
    card.classList.add('prediction-result--comparison');
    const top = card.querySelector('.prediction-result-top');
    const creatorBadge = top.querySelector('.prediction-badge');
    const calls = document.createElement('div');
    calls.className = 'profile-call-column';
    creatorBadge.replaceWith(calls);
    calls.appendChild(creatorBadge);
    calls.insertAdjacentHTML('beforeend', comparison);
    if (choices) top.insertAdjacentHTML('afterend', choices);
    return card.outerHTML;
  }

  function renderHistory() {
    if (!isAuthor && personalHistory().length === 0) selectedFilter = 'all';
    let history = isAuthor ? authorHistory() : personalHistory();
    if (!isAuthor && selectedFilter !== 'all') history = history.filter(prediction => prediction.resolved === (selectedFilter === 'resolved'));
    const readerCalls = new Map(isSignedIn() ? personalHistory().map(prediction => [prediction.id, prediction.call]) : []);
    const exampleCalls = savedExampleCalls();
    list.classList.toggle('prediction-results-list--comparison', isAuthor);
    list.innerHTML = history.map(prediction => {
      if (isAuthor) {
        const readerCall = prediction.comparisonExample
          ? (isSignedIn() ? exampleCalls[prediction.id] || prediction.exampleReaderCall : null)
          : readerCalls.get(prediction.id);
        return comparisonRow(prediction, readerCall);
      }
      return resultRow(prediction, prediction.call, true, { resolved: prediction.resolved });
    }).join('');
    list.hidden = history.length === 0;
    empty.hidden = history.length !== 0;
    empty.querySelector('.profile-empty-title').textContent = selectedFilter === 'resolved' ? 'No resolved predictions yet' : selectedFilter === 'active' ? 'No active predictions yet' : 'No predictions yet';
    empty.querySelector('.profile-empty-copy').textContent = selectedFilter === 'resolved' ? 'Your resolved predictions will appear here' : 'Vote on prediction cards to track them here';
    empty.classList.toggle('profile-empty-state--author', isAuthor);
    if (isAuthor) empty.querySelector('.profile-empty-copy').textContent = `${firstName} hasn't voted on a prediction yet. Check back soon, or you can vote on today's predictions in your feed.`;
    if (!isAuthor) filters.hidden = personalHistory().length === 0;
    if (isAuthor && !predictionPanel.hidden && history.length && !entrancePlayed) {
      entrancePlayed = true;
      playComparisonEntrance(list);
    }
  }

  function selectFilter(button) {
    selectedFilter = button.dataset.predictionFilter;
    for (const option of filters.querySelectorAll('button')) option.setAttribute('aria-pressed', String(option === button));
    renderHistory();
  }

  function renderFilters() {
    const noPersonalHistory = !isAuthor && personalHistory().length === 0;
    filters.hidden = isAuthor || noPersonalHistory;
    filters.replaceChildren();
    if (isAuthor || noPersonalHistory) return;

    const filterOptions = [['all', 'All'], ['active', 'Active'], ['resolved', 'Resolved']];
    filters.setAttribute('aria-label', 'Prediction status');
    for (const [value, label] of filterOptions) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'profile-prediction-filter';
      button.dataset.predictionFilter = value;
      button.textContent = label;
      button.setAttribute('aria-pressed', String(value === selectedFilter));
      button.addEventListener('click', () => selectFilter(button));
      filters.appendChild(button);
    }
  }

  function selectSection(tab, updateHash = true) {
    const selected = tab.dataset.profileSection;
    for (const option of primaryTabs) {
      const active = option === tab;
      option.classList.toggle('filter-tab--active', active);
      option.setAttribute('aria-selected', String(active));
      option.tabIndex = active ? 0 : -1;
    }
    for (const panel of panels) panel.hidden = panel.dataset.profilePanel !== selected;
    if (selected === 'predictions') renderHistory();
    if (updateHash) history.replaceState(history.state, '', `#${selected}`);
  }

  for (const tab of primaryTabs) {
    tab.addEventListener('click', () => selectSection(tab));
    tab.addEventListener('keydown', event => {
      const index = primaryTabs.indexOf(tab);
      const next = event.key === 'ArrowRight' ? (index + 1) % primaryTabs.length
        : event.key === 'ArrowLeft' ? (index - 1 + primaryTabs.length) % primaryTabs.length
        : event.key === 'Home' ? 0 : event.key === 'End' ? primaryTabs.length - 1 : null;
      if (next === null) return;
      event.preventDefault();
      primaryTabs[next].focus();
      selectSection(primaryTabs[next]);
    });
  }

  predictionPanel.addEventListener('click', event => {
    const startCall = event.target.closest('[data-profile-make-call]');
    if (startCall && isAuthor) {
      if (!isSignedIn()) {
        try { sessionStorage.setItem('return-to', `${location.pathname.split('/').pop()}#predictions`); } catch {}
        location.href = 'login.html';
        return;
      }
      const choices = document.getElementById(startCall.getAttribute('aria-controls'));
      const expanded = startCall.getAttribute('aria-expanded') === 'true';
      choices.hidden = expanded;
      startCall.setAttribute('aria-expanded', String(!expanded));
      startCall.textContent = expanded ? 'Make your call' : 'Cancel';
      if (!expanded) choices.querySelector('button').focus({ preventScroll: true });
      return;
    }
    const vote = event.target.closest('[data-profile-call]');
    if (vote && isAuthor && isSignedIn()) {
      const id = vote.closest('.prediction-result').dataset.id;
      const call = vote.dataset.profileCall;
      const prediction = authorHistory().find(item => item.id === id);
      if (!['in', 'out'].includes(call) || !prediction || prediction.resolved) return;
      const key = prediction.comparisonExample ? EXAMPLE_CALLS_KEY : CALLS_KEY;
      const previous = prediction.comparisonExample ? savedExampleCalls() : savedCalls();
      try { sessionStorage.setItem(key, JSON.stringify({ ...previous, [id]: call })); }
      catch {
        callStatus.textContent = 'Your call could not be saved. Please try again.';
        return;
      }
      renderHistory();
      callStatus.textContent = `Your call is locked in. You voted ${call}.`;
      list.querySelector(`[data-id="${id}"] .prediction-result-more`)?.focus({ preventScroll: true });
      return;
    }
    const link = event.target.closest('.prediction-result-more');
    if (!link) return;
    const id = link.closest('.prediction-result').dataset.id;
    const calls = savedCalls();
    try {
      sessionStorage.removeItem(RETURN_KEY);
      const prediction = isAuthor ? authorHistory().find(item => item.id === id) : null;
      const readerCall = prediction?.comparisonExample
        ? (isSignedIn() ? savedExampleCalls()[id] || prediction.exampleReaderCall : null)
        : calls[id];
      const source = calls[id] ? 'results' : prediction && !readerCall && !prediction.resolved ? 'profile' : null;
      if (source) {
        sessionStorage.setItem(RETURN_KEY, JSON.stringify({ to: new URL(link.getAttribute('href'), location.href).pathname, predictionId: id, source }));
      }
    } catch { /* The story link still works without storage. */ }
  });

  function restoreSection() {
    renderPosts();
    renderFilters();
    const hash = !isAuthor && location.hash === '#saved' ? '#stories' : location.hash;
    const selected = primaryTabs.find(tab => `#${tab.dataset.profileSection}` === hash) || primaryTabs[0];
    selectSection(selected, false);
  }
  window.addEventListener('hashchange', restoreSection);
  window.addEventListener('pageshow', event => { if (event.persisted) restoreSection(); });
  document.addEventListener('prediction-deal', () => {
    if (isAuthor) {
      try { sessionStorage.removeItem(EXAMPLE_CALLS_KEY); } catch {}
    }
    renderHistory();
  });
  document.addEventListener('auth-change', () => {
    renderFilters();
    renderHistory();
  });
  restoreSection();
})();
