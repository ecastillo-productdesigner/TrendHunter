// Daily Predictions — the card deck copied from the sandbox's Prediction Cover Card demo.
// The cover shows until the reader makes their first call. Calls are kept for this tab
// (sessionStorage), so the panel picks up where it left off on every page.

// Every prediction has its own matching story; page and sheet modes use the same link.
// Vote splits are fixed illustrative percentages for this prototype, not live totals.
const PREDICTIONS = [
  {
    id: "telehealth-trt",
    deadline: "Closes today",
    text: "Telehealth TRT and GLP-1 stacks will force insurers and FDA to redefine normal thresholds",
    context: "Men questioning the “just aging” explanation for midlife changes are turning to telehealth care. The article explores combined TRT and GLP-1 protocols and potential pressure on treatment thresholds.",
    storyHref: "trend.html",
    sampleInPercent: 21,
  },
  {
    id: "ai-holidays",
    deadline: "1 day left",
    text: "More people will use AI to prepare for the holidays this year",
    context: "A shopper asks an AI assistant for gift ideas, then checks budget, delivery and suitability. This story explores what these tools must get right to become a holiday habit.",
    storyHref: "trend-ai-shopping-assistant.html",
    sampleInPercent: 64,
  },
  {
    id: "dollar-stores",
    deadline: "5 days left",
    text: "More shoppers will turn to dollar stores as cost of living rises",
    context: "A shopper splits a weekly basket across discount stores and supermarkets. This story explores how comparing prices, pack sizes and convenience could turn dollar-store trips into a lasting household routine.",
    storyHref: "trend-dollar-store-shoppers.html",
    sampleInPercent: 57,
  },
  {
    id: "retail-events",
    text: "Weekly events will become as important as new products for Gen Z stores",
    context: "Repair workshops and styling sessions give a store a purpose beyond checkout. This story explores how recurring neighborhood events could become as important as the products on its shelves.",
    storyHref: "trend-gen-z-stores.html",
    sampleInPercent: 38,
  },
  {
    id: "protein-coffee",
    text: "Protein coffee will become a staple on cafe menus",
    context: "Coffee, yogurt and snacks bring protein into a familiar morning routine. The article explores how taste, texture and price could help protein coffee become a regular order rather than a novelty.",
    storyHref: "trend-everyday-protein.html",
    sampleInPercent: 72,
  },
  {
    id: "skin-longevity",
    text: "Skin longevity will replace anti-aging as beauty’s biggest promise",
    context: "A shopper trims overlapping products and compares how brands explain long-term skin care. This story explores whether simpler routines and clearer promises could replace the familiar language of anti-aging.",
    storyHref: "trend-skin-longevity.html",
    sampleInPercent: 66,
  },
  {
    id: "sleep-routines",
    text: "Wind-down routines will become the next big wellness product",
    context: "A quiet evening class combines gentle movement and a deliberate break from the day. The story explores how a short, adaptable wind-down ritual could become a wellness product itself.",
    storyHref: "trend-somatic-sleep.html",
    sampleInPercent: 45,
  },
  {
    id: "run-club-connections",
    text: "Run clubs will become a go-to alternative to dating apps",
    context: "A neighborhood run club plans coffee afterward as carefully as the route. This story explores how a shared activity, a warm welcome and predictable social time could spark new connections.",
    storyHref: "trend-run-club-connections.html",
    sampleInPercent: 61,
  },
  {
    id: "sober-socials",
    text: "Sober daytime parties will become a staple of campus life",
    context: "An optional walk leads into music, drinks and conversation at a daytime campus gathering. This story explores how several ways to participate could make sober social events a regular fixture.",
    storyHref: "trend-sober-socials.html",
    sampleInPercent: 34,
  },
  {
    id: "home-energy",
    text: "Comfort upgrades will outrank cosmetic makeovers on home renovation lists",
    context: "Homeowners start with drafts, afternoon heat and unused rooms before choosing finishes. This story explores how planning for insulation, shading and ventilation could make everyday comfort the next renovation priority.",
    storyHref: "trend-home-energy.html",
    sampleInPercent: 58,
  },
];

// Fictional profile-only examples also resolve on their related story pages.
// They stay outside the daily catalogue and keep votes in a separate browser key.
function profileComparisonExamples(authorId) {
  return [
    { state: 'in', text: 'Smart rings will become the default way to plan a nightly wind-down routine', storyHref: 'trend-smart-ring-sleep.html', sampleInPercent: 64, exampleReaderCall: 'in' },
    { state: 'out', text: 'Protein snack stations will become a standard office perk', storyHref: 'trend-everyday-protein.html', sampleInPercent: 41, exampleReaderCall: 'out' },
    { state: 'pending', text: 'Neighborhood supper clubs will become the next weekend social ritual', storyHref: 'trend-sober-socials.html', sampleInPercent: 57, exampleReaderCall: null },
  ].map(({ state, ...prediction }) => ({ ...prediction, id: `profile-example-${authorId}-${state}`, call: 'in', resolved: false, comparisonExample: true }));
}

function findPrediction(id) {
  const standard = PREDICTIONS.find(prediction => prediction.id === id);
  if (standard) return standard;
  const example = /^profile-example-([a-z-]+)-(in|out|pending)$/.exec(id || '');
  return example ? profileComparisonExamples(example[1]).find(prediction => prediction.id === id) : undefined;
}

function predictionStoryPath(href) {
  return new URL(href, location.href).pathname.replace(/\.html$/, '').replace(/\/$/, '');
}

function resultVoteSplit(prediction) {
  const inPercent = prediction.sampleInPercent;
  const outPercent = 100 - inPercent;
  return `
    <div class="prediction-result-split" role="img" aria-label="Sample vote split: ${inPercent}% in, ${outPercent}% out">
      <div class="prediction-result-split-labels" aria-hidden="true">
        <span><strong>${inPercent}%</strong> In</span>
        <span>Out <strong>${outPercent}%</strong></span>
      </div>
      <svg class="prediction-result-split-bar" viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden="true">
        <rect class="prediction-result-split-out" width="100" height="8"></rect>
        <rect class="prediction-result-split-in" width="${inPercent}" height="8"></rect>
      </svg>
    </div>`;
}

function resultRow(prediction, call, includeReadMore = true, { resolved = false, badgeLabel } = {}) {
  const escapeResult = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  const label = badgeLabel || (resolved ? `You were ${call}` : `You're ${call}`);
  return `
    <li class="prediction-result" data-id="${escapeResult(prediction.id)}" data-result-status="${resolved ? 'resolved' : 'active'}">
      <div class="prediction-result-top">
        <div class="prediction-result-copy">
          <p class="prediction-result-headline">${escapeResult(prediction.text)}</p>
          ${includeReadMore ? `<a class="prediction-card-more prediction-result-more" href="${escapeResult(prediction.storyHref)}" aria-label="Read more about ${escapeResult(prediction.text)}"><span class="prediction-card-more-label">Read more</span><span class="prediction-card-more-icon" aria-hidden="true"></span></a>` : ''}
        </div>
        <p class="prediction-badge prediction-badge--${call}${resolved ? ' prediction-badge--resolved' : ''}"><span class="prediction-badge-icon" aria-hidden="true"></span>${escapeResult(label)}</p>
      </div>
      ${resultVoteSplit(prediction)}
    </li>`;
}

const CALLS_KEY = 'prediction-calls';
const DECK_KEY = 'prediction-deck';
const PROFILE_EXAMPLE_CALLS_KEY = 'profile-comparison-example-calls';
const RETURN_KEY = 'predictions-return'; // read by app.js on the story page
const READ_MORE_MODE_KEY = 'read-more-mode'; // 'page' (default) or 'sheet', set from the prototype settings

const readMoreMode = () => {
  try { return sessionStorage.getItem(READ_MORE_MODE_KEY) || 'page'; } catch (e) { return 'page'; }
};
const VISIBLE_CARDS = 3;

// Timings match the CSS motion tokens
const NUDGE_MS = 150;
const FLY_MS = 500;
const FLIP_MS = 600; // --motion-card-flip

// Drag: the overlay shows past 30px; a call commits past 40% of the card's width
const PREVIEW_DISTANCE = 30;
const COMMIT_RATIO = 0.4;
const TILT_PER_PX = 0.04;

// Where each call flies to
const FLY_TO = {
  in: 'translate(-50%, -50%) translate(140%, 40%) rotate(18deg)',
  out: 'translate(-50%, -50%) translate(-140%, 40%) rotate(-18deg)',
  skip: 'translate(-50%, -50%) translate(0, -130%)',
};

// Keep the Read more origin on this history entry, so its mobile shortcut survives a reload.
const articlePredictionArrival = (() => {
  if (!document.body.classList.contains('page-trend')) return null;
  let arrival = null;
  try { arrival = JSON.parse(sessionStorage.getItem(RETURN_KEY)); } catch (e) {}
  if (arrival?.to && predictionStoryPath(arrival.to) === predictionStoryPath(location.pathname)) {
    try { history.replaceState({ ...history.state, predictionArrival: arrival }, ''); } catch (e) {}
    return arrival;
  }
  const previous = history.state?.predictionArrival;
  return previous?.to && predictionStoryPath(previous.to) === predictionStoryPath(location.pathname) ? previous : null;
})();

// A reader opening a prediction's story is here to make that call.
// The mobile article already uses this label; match it in the desktop rail too.
if (articlePredictionArrival) {
  const heading = document.getElementById('predictions-heading');
  if (heading) {
    heading.textContent = 'Make your call';
    heading.closest('.rail-right')?.setAttribute('aria-label', 'Make your call');
  }
}

const profileStoryPrediction = articlePredictionArrival?.source === 'profile'
  ? findPrediction(articlePredictionArrival.predictionId) : null;
const profileStoryArrival = profileStoryPrediction && predictionStoryPath(profileStoryPrediction.storyHref) === predictionStoryPath(location.pathname)
  ? profileStoryPrediction : null;

const stack = document.querySelector('.prediction-stack');

if (stack) {
  const cover = stack.querySelector('.prediction-card--onboarding');

  const getCalls = () => {
    try { return JSON.parse(sessionStorage.getItem(CALLS_KEY)) || {}; } catch (e) { return {}; }
  };

  const callKey = prediction => prediction?.comparisonExample ? PROFILE_EXAMPLE_CALLS_KEY : CALLS_KEY;
  const predictionCall = prediction => {
    if (!prediction) return null;
    try { return (JSON.parse(sessionStorage.getItem(callKey(prediction))) || {})[prediction.id]; } catch { return null; }
  };
  const saveCall = (id, call) => {
    const key = callKey(findPrediction(id));
    try {
      const calls = JSON.parse(sessionStorage.getItem(key)) || {};
      sessionStorage.setItem(key, JSON.stringify({ ...calls, [id]: call }));
    } catch (e) {}
  };

  // The rest of the deck's state is kept for the tab too, so moving to another page
  // (e.g. Read more on desktop) shows the deck exactly as it was left:
  // whether the cover was lifted, which cards were skipped, and whether the top card is turned over
  const getDeck = () => {
    try { return { coverDone: false, skipped: [], flipped: null, ...JSON.parse(sessionStorage.getItem(DECK_KEY)) }; } catch (e) { return { coverDone: false, skipped: [], flipped: null }; }
  };

  const saveDeck = (changes) => {
    try { sessionStorage.setItem(DECK_KEY, JSON.stringify({ ...getDeck(), ...changes })); } catch (e) {}
  };

  const escapeHTML = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  // A mobile Read more arrival has just supplied the first card's context.
  // Keep that card on its voting face without offering the same context again.
  let firstArrivalCardAssigned = false;
  const readMoreArticleArrival = Boolean(articlePredictionArrival) && window.matchMedia('(max-width: 959px)').matches;

  // Cards still to call; skipped ones go back in the queue for "Finish today's predictions"
  let queue = [];
  let skipped = [];

  // Each card has two faces. "Get the context" flips it on its vertical axis to the back,
  // "Back" flips it home. Both faces carry the vote buttons, so a call can be made from either side.
  const voteButtons = `
          <div class="prediction-card-actions">
            <button class="prediction-vote prediction-vote--out" type="button" data-vote="out"><span class="prediction-vote-icon" aria-hidden="true"></span>I'm Out</button>
            <button class="prediction-vote prediction-vote--in" type="button" data-vote="in"><span class="prediction-vote-icon" aria-hidden="true"></span>I'm In</button>
          </div>
          <button class="prediction-skip" type="button" data-vote="skip">Skip This</button>`;

  function buildCard(prediction) {
    const card = document.createElement('article');
    const backId = `prediction-context-${prediction.id}`;
    card.className = 'prediction-card prediction-card--call';
    if (document.body.classList.contains('page-trend') && predictionStoryPath(prediction.storyHref) === predictionStoryPath(location.pathname)) card.classList.add('prediction-card--current-article');
    const storyAlreadyOpen = prediction.id === profileStoryArrival?.id;
    if (storyAlreadyOpen) card.classList.add('prediction-card--profile-story');
    if (readMoreArticleArrival && !firstArrivalCardAssigned && (!articlePredictionArrival.predictionId || articlePredictionArrival.predictionId === prediction.id)) {
      card.classList.add('prediction-card--read-more-intro');
      firstArrivalCardAssigned = true;
    }
    card.dataset.id = prediction.id;
    card.innerHTML = `
      <div class="prediction-card-flipper">
        <div class="prediction-card-face prediction-card-face--front">
          <div class="prediction-card-overlay"></div>
          <div class="prediction-card-body">
            <div class="prediction-card-toolbar">
              ${storyAlreadyOpen ? '' : `<button class="prediction-card-link" type="button" data-flip="context" aria-expanded="false" aria-controls="${backId}">Get context<span class="prediction-card-link-icon" aria-hidden="true"></span></button>`}
            </div>
            <div class="prediction-card-middle">
              <h3 class="prediction-card-headline">${escapeHTML(prediction.text)}</h3>
            </div>
            ${voteButtons}
          </div>
        </div>
        ${storyAlreadyOpen ? '' : `<div class="prediction-card-face prediction-card-face--back" id="${backId}" inert>
          <div class="prediction-card-overlay"></div>
          <div class="prediction-card-body">
            <div class="prediction-card-toolbar">
              <button class="prediction-card-link" type="button" data-flip="vote" aria-label="Back to the call"><span class="prediction-card-link-icon" aria-hidden="true"></span></button>
            </div>
            <div class="prediction-card-middle">
              <p class="prediction-card-context">${escapeHTML(prediction.context)} <a class="prediction-card-more" href="${escapeHTML(prediction.storyHref)}"><span class="prediction-card-more-label">Read more</span><span class="prediction-card-more-icon" aria-hidden="true"></span></a></p>
            </div>
            ${voteButtons}
          </div>
        </div>`}
      </div>`;
    return card;
  }

  // Show one face and keep only that face in the tab order
  function setFace(card, toBack) {
    const front = card.querySelector('.prediction-card-face--front');
    const back = card.querySelector('.prediction-card-face--back');
    card.toggleAttribute('data-flipped', toBack);
    front.inert = toBack;
    back.inert = !toBack;
    front.querySelector('[data-flip]').setAttribute('aria-expanded', String(toBack));
    return toBack ? back : front;
  }

  // Once a card has finished turning to its back, it's shown flat (no 3D rotation; it looks the same).
  // Safari on iPhone can send taps inside 3D-rotated elements to the wrong spot, which made
  // Read more and Back unreliable there. Before turning again, the 3D rotation is put back without a jump.
  function flatten(card) {
    card.classList.add('is-restoring', 'is-flat');
    void card.offsetWidth;
    card.classList.remove('is-restoring');
  }

  function unflatten(card) {
    if (!card.classList.contains('is-flat')) return;
    card.classList.add('is-restoring');
    card.classList.remove('is-flat');
    void card.offsetWidth;
    card.classList.remove('is-restoring');
  }

  // Turn the card over and move focus to the flip control on the side now showing
  function flipCard(card, toBack) {
    if (card.classList.contains('prediction-card--current-article') && window.matchMedia('(min-width: 960px)').matches) return;
    const flipper = card.querySelector('.prediction-card-flipper');
    unflatten(card);
    if (toBack) {
      const settle = (event) => {
        if (event.target !== flipper || event.propertyName !== 'transform') return;
        flipper.removeEventListener('transitionend', settle);
        if (card.hasAttribute('data-flipped')) flatten(card);
      };
      flipper.addEventListener('transitionend', settle);
      // Fallback in case the transition end is never reported (e.g. the tab was in the background)
      setTimeout(() => {
        flipper.removeEventListener('transitionend', settle);
        if (card.hasAttribute('data-flipped')) flatten(card);
      }, FLIP_MS + 100);
    }
    // Restart the mid-flip lift each time
    flipper.classList.remove('is-turning');
    void flipper.offsetWidth;
    flipper.classList.add('is-turning');
    flipper.addEventListener('animationend', () => flipper.classList.remove('is-turning'), { once: true });
    setFace(card, toBack).querySelector('[data-flip]').focus({ preventScroll: true });
    saveDeck({ flipped: toBack ? card.dataset.id : null });
  }

  // Coming back to a page: the top card shows the side it was left on, without replaying the turn
  function restoreFlip(id) {
    const top = dealtCards()[0];
    if (!top || top.dataset.id !== id) return;
    if (top.classList.contains('prediction-card--current-article') && window.matchMedia('(min-width: 960px)').matches) {
      saveDeck({ flipped: null });
      return;
    }
    top.classList.add('is-restoring');
    setFace(top, true);
    top.classList.add('is-flat');
    requestAnimationFrame(() => requestAnimationFrame(() => top.classList.remove('is-restoring')));
  }

  const dealtCards = () => [...stack.querySelectorAll('.prediction-card--call:not(.is-flying)')];

  // Keep three cards on the table: the top one and two tilted behind it.
  // Only the top card can be used; the ones behind are hidden from assistive tech.
  function layoutDeck() {
    const cards = dealtCards();
    while (cards.length < VISIBLE_CARDS && queue.length) {
      const card = buildCard(queue.shift());
      stack.appendChild(card);
      cards.push(card);
    }
    cards.forEach((card, depth) => {
      card.dataset.depth = depth;
      card.inert = depth !== 0;
    });
    if (!cards.length) showResults();
  }

  function showResults() {
    const calls = getCalls();
    const called = PREDICTIONS.filter((p) => calls[p.id]);
    const requested = findPrediction(articlePredictionArrival?.predictionId);
    if (requested?.comparisonExample && predictionCall(requested)) called.push(requested);
    const current = ['results', 'profile'].includes(articlePredictionArrival?.source)
      ? called.find((p) => p.id === articlePredictionArrival.predictionId)
      : null;
    if (current?.comparisonExample) calls[current.id] = predictionCall(current);
    const remaining = current ? PREDICTIONS.filter(prediction => !calls[prediction.id]) : skipped;
    const finishButton = remaining.length ? '<button class="prediction-results-finish" type="button">Finish today\'s predictions</button>' : '';
    if (current) {
      const others = called.filter((p) => p.id !== current.id);
      stack.innerHTML = `
        <div class="prediction-results prediction-results--article">
          <header class="prediction-results-header"><h3 class="prediction-results-title">Your call is locked in</h3></header>
          <ul class="prediction-results-list prediction-results-list--current">${resultRow(current, calls[current.id], false)}</ul>
          <button class="prediction-results-toggle" type="button" aria-expanded="false" aria-controls="prediction-other-votes">View my other votes</button>
          <section class="prediction-other-votes" id="prediction-other-votes" aria-label="My other votes" hidden>
            ${others.length ? `<ul class="prediction-results-list">${others.map((p) => resultRow(p, calls[p.id])).join('')}</ul>` : '<p class="prediction-results-empty">No other votes yet.</p>'}
            ${finishButton}
          </section>
        </div>`;
      const toggle = stack.querySelector('.prediction-results-toggle');
      const otherVotes = stack.querySelector('.prediction-other-votes');
      toggle.addEventListener('click', (event) => {
        otherVotes.hidden = false;
        toggle.remove();
        if (event.detail === 0) otherVotes.querySelector('a, button')?.focus({ preventScroll: true });
      }, { once: true });
    } else {
      stack.innerHTML = `
        <div class="prediction-results">
          <header class="prediction-results-header">
            <h3 class="prediction-results-title">Your calls are locked in</h3>
            ${skipped.length ? `<p class="prediction-results-remaining">${skipped.length} More predictions left today.</p>` : ''}
          </header>
          <ul class="prediction-results-list">${called.map((p) => resultRow(p, calls[p.id])).join('')}</ul>
          ${finishButton}
        </div>`;
    }

    const finish = stack.querySelector('.prediction-results-finish');
    if (finish) {
      finish.addEventListener('click', () => {
        queue = remaining;
        skipped = [];
        saveDeck({ skipped: [] });
        stack.innerHTML = '';
        layoutDeck();
      });
    }
  }

  // A call: In and Out nudge toward their side first, then the card flies off.
  // fromDrag skips the nudge, since the card is already out of place.
  function commit(card, call, fromDrag = false) {
    if (card.classList.contains('is-flying')) return;
    const prediction = findPrediction(card.dataset.id);
    // Skip This (the button) slides the card away without the dark overlay; dragging up keeps it
    if (call === 'skip' && !fromDrag) delete card.dataset.call;
    else card.dataset.call = call;

    if (call === 'skip') skipped.push(prediction);
    else saveCall(prediction.id, call);
    saveDeck({ skipped: skipped.map((p) => p.id), flipped: null });

    const fly = () => {
      card.classList.remove('is-nudging', 'is-dragging');
      card.classList.add('is-flying');
      card.style.transform = FLY_TO[call];
      setTimeout(() => {
        card.remove();
        layoutDeck();
      }, FLY_MS);
    };

    if (call !== 'skip' && !fromDrag) {
      card.classList.add('is-nudging');
      card.style.setProperty('--card-x', call === 'in' ? '60px' : '-60px');
      card.style.setProperty('--card-tilt', call === 'in' ? '2.4deg' : '-2.4deg');
      setTimeout(fly, NUDGE_MS);
    } else {
      fly();
    }
  }

  // Buttons on the top card
  stack.addEventListener('click', (event) => {
    // Remember the Read more origin at every viewport so article headings match the flow.
    // The prototype settings can switch phones and tablets to a bottom sheet instead.
    const more = event.target.closest('.prediction-card-more');
    if (more) {
      const fromResults = more.classList.contains('prediction-result-more');
      const desktop = window.matchMedia('(min-width: 960px)').matches;
      try {
        sessionStorage.setItem(RETURN_KEY, JSON.stringify({
          to: new URL(more.getAttribute('href'), location.href).pathname,
          predictionId: more.closest('.prediction-card--call, .prediction-result')?.dataset.id,
          source: fromResults ? 'results' : 'card',
        }));
      } catch (e) {}
      if (desktop) return;
      if (readMoreMode() === 'sheet') {
        event.preventDefault();
        openArticleSheet(more.getAttribute('href'));
        return;
      }
      return;
    }
    const flip = event.target.closest('[data-flip]');
    if (flip) {
      flipCard(flip.closest('.prediction-card--call'), flip.dataset.flip === 'context');
      return;
    }
    const button = event.target.closest('[data-vote]');
    if (!button) return;
    commit(button.closest('.prediction-card--call'), button.dataset.vote);
  });

  // ===========================
  // Article sheet — built once, reused for every Read more
  // ===========================
  let articleSheet = null;

  function openArticleSheet(href) {
    if (!articleSheet) {
      articleSheet = document.createElement('dialog');
      articleSheet.className = 'article-sheet';
      articleSheet.setAttribute('aria-label', 'Article');
      articleSheet.innerHTML = `
        <div class="article-sheet-bar">
          <button class="article-sheet-close" type="button" aria-label="Close article"><span class="drawer-close-icon" aria-hidden="true"></span></button>
        </div>
        <iframe class="article-sheet-frame" title="Article"></iframe>`;
      document.body.append(articleSheet);
      articleSheet.querySelector('.article-sheet-close').addEventListener('click', () => articleSheet.close());
      // A click on the scrim (outside the sheet) closes it too
      articleSheet.addEventListener('click', (event) => {
        if (event.target !== articleSheet) return;
        const box = articleSheet.getBoundingClientRect();
        const outside = event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom;
        if (outside) articleSheet.close();
      });
    }
    const frame = articleSheet.querySelector('.article-sheet-frame');
    // A #sheet marker rather than ?sheet: the claude.ai artifact viewer drops query strings
    const src = `${href}#sheet`;
    if (frame.getAttribute('src') !== src) frame.setAttribute('src', src);
    else if (frame.contentWindow) frame.contentWindow.scrollTo(0, 0);
    articleSheet.showModal();
    articleSheet.querySelector('.article-sheet-close').focus({ focusVisible: false });
  }

  // Drag the top card: right is In, left is Out, up is Skip
  let drag = null;

  const callFor = (dx, dy) => {
    if (Math.abs(dx) >= Math.abs(dy) && Math.abs(dx) > PREVIEW_DISTANCE) return dx > 0 ? 'in' : 'out';
    if (dy < -PREVIEW_DISTANCE) return 'skip';
    return null;
  };

  stack.addEventListener('pointerdown', (event) => {
    const card = event.target.closest('.prediction-card--call[data-depth="0"]');
    if (!card || event.target.closest('button, a')) return;
    drag = { card, startX: event.clientX, startY: event.clientY, dx: 0, dy: 0 };
    card.setPointerCapture(event.pointerId);
    card.classList.add('is-dragging');
  });

  stack.addEventListener('pointermove', (event) => {
    if (!drag) return;
    drag.dx = event.clientX - drag.startX;
    drag.dy = event.clientY - drag.startY;
    const { card, dx, dy } = drag;
    card.style.setProperty('--card-x', `${dx}px`);
    card.style.setProperty('--card-y', `${dy}px`);
    card.style.setProperty('--card-tilt', `${dx * TILT_PER_PX}deg`);
    const call = callFor(dx, dy);
    if (call) card.dataset.call = call;
    else delete card.dataset.call;
  });

  const endDrag = () => {
    if (!drag) return;
    const { card, dx, dy } = drag;
    drag = null;
    const limit = card.offsetWidth * COMMIT_RATIO;
    const call = callFor(dx, dy);
    const farEnough = call === 'skip' ? -dy > limit : Math.abs(dx) > limit;

    if (call && farEnough) {
      commit(card, call, true);
    } else {
      // Not far enough: spring back to the top of the deck
      card.classList.remove('is-dragging');
      delete card.dataset.call;
      ['--card-x', '--card-y', '--card-tilt'].forEach((prop) => card.style.removeProperty(prop));
    }
  };

  stack.addEventListener('pointerup', endDrag);
  stack.addEventListener('pointercancel', endDrag);

  // The cover card from the page markup, kept so a new-user deal can put it back on top
  const coverTemplate = cover ? cover.cloneNode(true) : null;

  // Make Your Call lifts the cover and reveals the deck underneath
  function placeCover(coverCard) {
    stack.appendChild(coverCard);
    coverCard.querySelector('.prediction-onboarding-button').addEventListener('click', (event) => {
      event.preventDefault();
      coverCard.remove();
      saveDeck({ coverDone: true });
    });
  }

  // Deal again — from the settings panel (settings.js). Clears every call and deals
  // the whole deck from the first card; as a new user, the cover goes back on top too.
  document.addEventListener('prediction-deal', (event) => {
    queue = PREDICTIONS.slice();
    skipped = [];
    saveDeck({ coverDone: !event.detail.asNewUser, skipped: [], flipped: null });
    stack.innerHTML = '';
    layoutDeck();
    if (event.detail.asNewUser && coverTemplate) placeCover(coverTemplate.cloneNode(true));
  });

  // First visit: the cover waits on top. After that the deck picks up where it was left:
  // called cards are gone, skipped ones wait for "Finish today's predictions",
  // and the top card shows the side it was on.
  const calls = getCalls();
  const deck = getDeck();
  skipped = PREDICTIONS.filter((p) => !calls[p.id] && deck.skipped.includes(p.id));
  queue = PREDICTIONS.filter((p) => !calls[p.id] && !deck.skipped.includes(p.id));
  // A profile Read more chooses this exact unfinished call, ahead of the saved deck order.
  // Keep two other pending cards behind it and bypass the onboarding cover.
  if (profileStoryArrival && !predictionCall(profileStoryArrival)) {
    queue = [profileStoryArrival, ...queue.filter(prediction => prediction.id !== profileStoryArrival.id)];
    skipped = skipped.filter(prediction => prediction.id !== profileStoryArrival.id);
  }
  if (['results', 'profile'].includes(articlePredictionArrival?.source) && predictionCall(findPrediction(articlePredictionArrival.predictionId))) showResults();
  else layoutDeck();
  if (readMoreArticleArrival || profileStoryArrival) saveDeck({ flipped: null });
  else if (deck.flipped) restoreFlip(deck.flipped);

  if (cover && !profileStoryArrival && !deck.coverDone && !Object.keys(calls).length && !skipped.length) {
    cover.remove();
    placeCover(cover);
  } else if (cover) {
    cover.remove();
  }
  const desktopArticle = window.matchMedia('(min-width: 960px)');
  desktopArticle.addEventListener('change', () => {
    if (!desktopArticle.matches) return;
    const current = stack.querySelector('.prediction-card--current-article[data-flipped]');
    if (!current) return;
    unflatten(current);
    setFace(current, false);
    saveDeck({ flipped: null });
  });
}

if (document.body.classList.contains('page-predictions')) {
  const pagePanel = document.querySelector('.predictions-panel');
  const stackWidth = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--layout-predictions-stack-width'));
  const fitPageStack = () => pagePanel.style.setProperty('--prediction-stack-zoom', String(Math.min(1, pagePanel.clientWidth / stackWidth)));
  window.addEventListener('resize', fitPageStack);
  fitPageStack();
}

// ===========================
// Below 960px the right rail is hidden, so on the main feed the predictions panel moves into
// it, right after the 3rd trend card (same panel, moved not copied, so the deck keeps its place).
// Article pages move the same tall deck beneath MAKE YOUR CALL on mobile, below.
// ===========================
const predictionsPanel = document.querySelector('.predictions-panel');
const thirdTrendCard = document.body.classList.contains('page-trend')
  ? null
  : document.querySelectorAll('.feed-column .trend-card')[2];

if (predictionsPanel && thirdTrendCard) {
  const rail = predictionsPanel.parentElement;
  const slot = document.createElement('li');
  slot.className = 'feed-predictions-slot';
  thirdTrendCard.closest('li').after(slot);

  const inFeed = window.matchMedia('(max-width: 959px)');
  const stackWidth = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--layout-predictions-stack-width'));

  // On narrow phones the panel is slimmer than the card stack (tilted cards included), so the stack scales to fit
  const fitStack = () => {
    const room = predictionsPanel.clientWidth;
    predictionsPanel.style.setProperty('--prediction-stack-zoom', String(Math.min(1, room / stackWidth)));
  };

  const placePanel = () => {
    const home = inFeed.matches ? slot : rail;
    if (predictionsPanel.parentElement !== home) home.append(predictionsPanel);
    slot.hidden = !inFeed.matches;
    fitStack();
  };
  inFeed.addEventListener('change', placePanel);
  window.addEventListener('resize', placePanel);
  placePanel();
}

// Use the full voting/context card design at the end of every mobile article.
// Moving the one deck preserves calls, skips, flips and the desktop sidebar state.
const articleNode = document.querySelector('article.article');
if (articleNode && predictionsPanel && stack) {
  let articleSection = articleNode.querySelector('.prediction-inline-section');
  if (!articleSection) {
    articleSection = document.createElement('section');
    articleSection.className = 'prediction-inline-section';
    articleSection.setAttribute('aria-labelledby', 'prediction-inline-heading');
    articleSection.innerHTML = '<p id="prediction-inline-heading" class="type-h4-caps">MAKE YOUR CALL</p>';
    (articleNode.querySelector('.article-body') || articleNode).append(articleSection);
  }
  articleSection.querySelector('.prediction-inline-stack')?.remove();
  const inArticle = window.matchMedia('(max-width: 959px)');
  const placeArticleDeck = () => {
    const articleResult = Boolean(stack.querySelector('.prediction-results--article'));
    const home = inArticle.matches || articleResult ? articleSection : predictionsPanel;
    articleSection.classList.toggle('prediction-inline-section--article-result', articleResult);
    predictionsPanel.classList.toggle('predictions-panel--article-result', articleResult);
    if (stack.parentElement !== home) home.append(stack);
    const width = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--layout-predictions-stack-width'));
    stack.style.setProperty('--prediction-stack-zoom', String(Math.min(1, articleSection.clientWidth / width)));
  };
  inArticle.addEventListener('change', placeArticleDeck);
  window.addEventListener('resize', placeArticleDeck);
  new MutationObserver(placeArticleDeck).observe(stack, { childList: true });
  placeArticleDeck();

  // A compact shortcut keeps the unfinished call available while its story is being read.
  if (articlePredictionArrival) {
    articleSection.id ||= 'article-predictions';
    const shortcut = document.createElement('button');
    shortcut.type = 'button';
    shortcut.className = 'button-primary prediction-shortcut';
    shortcut.setAttribute('aria-controls', articleSection.id);
    shortcut.innerHTML = 'Make your call<span class="prediction-shortcut-icon material-symbols-outlined" aria-hidden="true">arrow_downward</span>';
    shortcut.hidden = true;
    document.body.append(shortcut);

    const syncShortcut = () => {
      const pending = stack.querySelector('.prediction-card--call[data-depth="0"]:not(.is-flying)');
      const deckIsBelow = stack.getBoundingClientRect().top >= window.innerHeight - 64;
      shortcut.hidden = !inArticle.matches || !pending || !deckIsBelow;
    };
    let scheduled = false;
    const scheduleShortcut = () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => { scheduled = false; syncShortcut(); });
    };
    shortcut.addEventListener('click', () => {
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      articleSection.scrollIntoView({ block: 'start', behavior: reducedMotion ? 'auto' : 'smooth' });
      const heading = articleSection.querySelector('#prediction-inline-heading');
      if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
    });
    window.addEventListener('scroll', scheduleShortcut, { passive: true });
    window.addEventListener('resize', scheduleShortcut);
    window.addEventListener('pageshow', scheduleShortcut);
    window.addEventListener('load', scheduleShortcut);
    inArticle.addEventListener('change', scheduleShortcut);
    new MutationObserver(scheduleShortcut).observe(stack, { childList: true });
    new ResizeObserver(scheduleShortcut).observe(articleNode);
    document.fonts?.ready.then(scheduleShortcut);
    syncShortcut();
  }
}

// ===========================
// Compact prediction deck — Daily Predictions cards embedded in a story, in the 360×253 layout.
// Same moves as the panel's deck: drag right for In, left for Out, up to Skip, or use the buttons.
// Calls save to the same place, so a card called here is answered in the panel too (and vice versa).
// Skipped cards go to the back of this deck and come around again; once every card is called,
// the results take the deck's place.
// ===========================
document.querySelectorAll('.prediction-inline-stack').forEach((inlineStack) => {
  const ids = (inlineStack.dataset.predictions || '').split(',').map((id) => id.trim()).filter(Boolean);
  const predictionsFor = () => ids.map((id) => PREDICTIONS.find((p) => p.id === id)).filter(Boolean);

  const getCalls = () => {
    try { return JSON.parse(sessionStorage.getItem(CALLS_KEY)) || {}; } catch (e) { return {}; }
  };
  const saveCall = (id, call) => {
    const calls = getCalls();
    calls[id] = call;
    try { sessionStorage.setItem(CALLS_KEY, JSON.stringify(calls)); } catch (e) {}
  };
  const escapeHTML = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  let queue = [];

  function buildCard(prediction) {
    const card = document.createElement('article');
    card.className = 'prediction-card prediction-card--call prediction-card--compact';
    card.dataset.id = prediction.id;
    card.innerHTML = `
      <div class="prediction-card-overlay"></div>
      <div class="prediction-card-body">
        <h3 class="prediction-card-headline">${escapeHTML(prediction.text)}</h3>
        <div class="prediction-card-actions">
          <button class="prediction-vote prediction-vote--out" type="button" data-vote="out"><span class="prediction-vote-icon" aria-hidden="true"></span>I'm Out</button>
          <button class="prediction-vote prediction-vote--in" type="button" data-vote="in"><span class="prediction-vote-icon" aria-hidden="true"></span>I'm In</button>
        </div>
        <button class="prediction-skip" type="button" data-vote="skip">Skip This</button>
      </div>`;
    return card;
  }

  const dealtCards = () => [...inlineStack.querySelectorAll('.prediction-card--call:not(.is-flying)')];

  // Three cards on the table, like the panel: the top one and two tilted behind it
  function layoutDeck() {
    const cards = dealtCards();
    while (cards.length < VISIBLE_CARDS && queue.length) {
      const card = buildCard(queue.shift());
      inlineStack.appendChild(card);
      cards.push(card);
    }
    cards.forEach((card, depth) => {
      card.dataset.depth = depth;
      card.inert = depth !== 0;
    });
    if (!cards.length) showResults();
  }

  function showResults() {
    const calls = getCalls();
    const called = predictionsFor().filter((p) => calls[p.id]);
    inlineStack.classList.add('is-done');
    inlineStack.innerHTML = `
      <div class="prediction-results">
        <header class="prediction-results-header">
          <h3 class="prediction-results-title">Your calls are locked in</h3>
        </header>
        <ul class="prediction-results-list">
          ${called.map((p) => `
            <li class="prediction-result" data-id="${escapeHTML(p.id)}">
              <div class="prediction-result-top">
                <div class="prediction-result-copy">
                  <p class="prediction-result-headline">${escapeHTML(p.text)}</p>
                  <a class="prediction-card-more prediction-result-more" href="${escapeHTML(p.storyHref)}" aria-label="Read more about ${escapeHTML(p.text)}"><span class="prediction-card-more-label">Read more</span><span class="prediction-card-more-icon" aria-hidden="true"></span></a>
                </div>
                <p class="prediction-badge prediction-badge--${calls[p.id]}"><span class="prediction-badge-icon" aria-hidden="true"></span>${calls[p.id] === 'in' ? "You're in" : "You're out"}</p>
              </div>
              ${resultVoteSplit(p)}
            </li>`).join('')}
        </ul>
      </div>`;
  }

  // A call: In and Out nudge toward their side first, then the card flies off.
  // Skip sends the card to the back of the deck. fromDrag skips the nudge.
  function commit(card, call, fromDrag = false) {
    if (card.classList.contains('is-flying')) return;
    const prediction = PREDICTIONS.find((p) => p.id === card.dataset.id);
    if (call === 'skip' && !fromDrag) delete card.dataset.call;
    else card.dataset.call = call;

    if (call === 'skip') queue.push(prediction);
    else saveCall(prediction.id, call);

    const fly = () => {
      card.classList.remove('is-nudging', 'is-dragging');
      card.classList.add('is-flying');
      card.style.transform = FLY_TO[call];
      setTimeout(() => {
        card.remove();
        layoutDeck();
      }, FLY_MS);
    };

    if (call !== 'skip' && !fromDrag) {
      card.classList.add('is-nudging');
      card.style.setProperty('--card-x', call === 'in' ? '60px' : '-60px');
      card.style.setProperty('--card-tilt', call === 'in' ? '2.4deg' : '-2.4deg');
      setTimeout(fly, NUDGE_MS);
    } else {
      fly();
    }
  }

  inlineStack.addEventListener('click', (event) => {
    const button = event.target.closest('[data-vote]');
    if (!button) return;
    commit(button.closest('.prediction-card--call'), button.dataset.vote);
  });

  // Drag the top card: right is In, left is Out, up is Skip
  let drag = null;

  const callFor = (dx, dy) => {
    if (Math.abs(dx) >= Math.abs(dy) && Math.abs(dx) > PREVIEW_DISTANCE) return dx > 0 ? 'in' : 'out';
    if (dy < -PREVIEW_DISTANCE) return 'skip';
    return null;
  };

  inlineStack.addEventListener('pointerdown', (event) => {
    const card = event.target.closest('.prediction-card--call[data-depth="0"]');
    if (!card || event.target.closest('button, a')) return;
    drag = { card, startX: event.clientX, startY: event.clientY, dx: 0, dy: 0 };
    card.setPointerCapture(event.pointerId);
    card.classList.add('is-dragging');
  });

  inlineStack.addEventListener('pointermove', (event) => {
    if (!drag) return;
    drag.dx = event.clientX - drag.startX;
    drag.dy = event.clientY - drag.startY;
    const { card, dx, dy } = drag;
    card.style.setProperty('--card-x', `${dx}px`);
    card.style.setProperty('--card-y', `${dy}px`);
    card.style.setProperty('--card-tilt', `${dx * TILT_PER_PX}deg`);
    const call = callFor(dx, dy);
    if (call) card.dataset.call = call;
    else delete card.dataset.call;
  });

  const endDrag = () => {
    if (!drag) return;
    const { card, dx, dy } = drag;
    drag = null;
    const limit = card.offsetWidth * COMMIT_RATIO;
    const call = callFor(dx, dy);
    const farEnough = call === 'skip' ? -dy > limit : Math.abs(dx) > limit;

    if (call && farEnough) {
      commit(card, call, true);
    } else {
      card.classList.remove('is-dragging');
      delete card.dataset.call;
      ['--card-x', '--card-y', '--card-tilt'].forEach((prop) => card.style.removeProperty(prop));
    }
  };

  inlineStack.addEventListener('pointerup', endDrag);
  inlineStack.addEventListener('pointercancel', endDrag);

  // Narrow phones: the deck is wider than the column (tilted cards included), so it scales to fit
  const stackWidth = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--layout-prediction-compact-stack-width'));
  const fitStack = () => {
    const room = inlineStack.parentElement.clientWidth;
    inlineStack.style.setProperty('--prediction-stack-zoom', String(Math.min(1, room / stackWidth)));
  };
  window.addEventListener('resize', fitStack);

  function deal() {
    const calls = getCalls();
    queue = predictionsFor().filter((p) => !calls[p.id]);
    inlineStack.classList.remove('is-done');
    inlineStack.innerHTML = '';
    fitStack();
    layoutDeck();
  }

  // Deal again — from the settings panel (settings.js), after it clears the calls
  document.addEventListener('prediction-deal', deal);
  deal();
});
