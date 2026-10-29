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
  const postsPanel = profile.querySelector('[data-profile-panel="posts"]');
  const primaryTabs = [...profile.querySelectorAll('[data-profile-section]')];
  const panels = [...profile.querySelectorAll('[data-profile-panel]')];
  const filters = predictionPanel.querySelector('.profile-prediction-filters');
  const list = predictionPanel.querySelector('.prediction-results-list');
  const empty = predictionPanel.querySelector('.profile-predictions-empty');
  let selectedFilter = isAuthor ? (isSignedIn() ? 'you' : 'author') : 'all';

  const viewingAuthorHistory = () => isAuthor && (!isSignedIn() || selectedFilter === 'author');

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

  function personalHistory() {
    const calls = savedCalls();
    const active = PREDICTIONS.filter(prediction => calls[prediction.id] === 'in' || calls[prediction.id] === 'out')
      .map(prediction => ({ ...prediction, call: calls[prediction.id], resolved: false }));
    // Illustrative past votes make the resolved state reviewable after a first call.
    return active.length ? [...active, ...resolvedExamples] : [];
  }

  function authorHistory() {
    const calls = authorExamples[authorId] || {};
    return [...PREDICTIONS, ...resolvedExamples].filter(prediction => calls[prediction.id])
      .map(prediction => ({ ...prediction, call: calls[prediction.id], resolved: Boolean(prediction.resolved) }));
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

  function renderHistory() {
    if (!isAuthor && personalHistory().length === 0) selectedFilter = 'all';
    let history = viewingAuthorHistory() ? authorHistory() : personalHistory();
    if (!isAuthor && selectedFilter !== 'all') history = history.filter(prediction => prediction.resolved === (selectedFilter === 'resolved'));
    list.innerHTML = history.map(prediction => {
      let badgeLabel;
      if (viewingAuthorHistory()) {
        badgeLabel = `${firstName} ${prediction.resolved ? 'was' : 'is'} ${prediction.call}`;
      }
      return resultRow(prediction, prediction.call, true, { resolved: prediction.resolved, badgeLabel });
    }).join('');
    list.hidden = history.length === 0;
    empty.hidden = history.length !== 0;
    empty.querySelector('.profile-empty-title').textContent = selectedFilter === 'resolved' ? 'No resolved predictions yet' : selectedFilter === 'active' ? 'No active predictions yet' : 'No predictions yet';
    empty.querySelector('.profile-empty-copy').textContent = selectedFilter === 'resolved' ? 'Your resolved predictions will appear here' : 'Vote on prediction cards to track them here';
    empty.classList.toggle('profile-empty-state--author', viewingAuthorHistory());
    if (viewingAuthorHistory()) empty.querySelector('.profile-empty-copy').textContent = `${firstName} hasn't voted on a prediction yet. Check back soon, or you can vote on today's predictions in your feed.`;
    if (!isAuthor) filters.hidden = personalHistory().length === 0;
  }

  function selectFilter(button) {
    selectedFilter = button.dataset.predictionFilter;
    for (const option of filters.querySelectorAll('button')) option.setAttribute('aria-pressed', String(option === button));
    renderHistory();
  }

  function renderFilters() {
    const authorOnly = isAuthor && !isSignedIn();
    if (authorOnly) selectedFilter = 'author';
    const noPersonalHistory = !isAuthor && personalHistory().length === 0;
    filters.hidden = authorOnly || noPersonalHistory;
    filters.replaceChildren();
    if (authorOnly || noPersonalHistory) return;

    const filterOptions = isAuthor ? [['you', 'Your votes'], ['author', `${firstName}’s votes`]] : [['all', 'All'], ['active', 'Active'], ['resolved', 'Resolved']];
    filters.classList.toggle('profile-prediction-filters--author', isAuthor);
    filters.setAttribute('aria-label', isAuthor ? 'Whose votes' : 'Prediction status');
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
    const link = event.target.closest('.prediction-result-more');
    if (!link) return;
    const id = link.closest('.prediction-result').dataset.id;
    const calls = savedCalls();
    try {
      sessionStorage.removeItem(RETURN_KEY);
      if (!viewingAuthorHistory() && calls[id]) {
        sessionStorage.setItem(RETURN_KEY, JSON.stringify({ to: new URL(link.getAttribute('href'), location.href).pathname, predictionId: id, source: 'results' }));
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
  window.addEventListener('pageshow', restoreSection);
  document.addEventListener('prediction-deal', renderHistory);
  document.addEventListener('auth-change', () => {
    if (isAuthor) selectedFilter = isSignedIn() ? 'you' : 'author';
    renderFilters();
    renderHistory();
  });
  restoreSection();
})();
