// Reference: foreground first, then the cards behind it come into focus in place.
(() => {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  if (!('IntersectionObserver' in window)) return;
  const seen = new WeakSet(), waiting = new Set(), active = new Set();
  const selector = '.prediction-stack, .prediction-results-alert-slot, [data-prediction-enter-example]';
  const allCards = target => target.matches('.prediction-stack')
    ? [...target.querySelectorAll(':scope > .prediction-card--call:not(.is-flying), :scope > .prediction-card--onboarding')]
    : [...target.querySelectorAll('.prediction-results-art-sheet')];
  function clean(card) {
    card.classList.remove('prediction-enter-pending', 'prediction-enter-active');
    card.style.removeProperty('--prediction-enter-index');
    active.delete(card);
  }
  function finish(target) {
    waiting.delete(target);
    visibility.unobserve(target);
    allCards(target).forEach(clean);
  }
  const visibility = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting || !waiting.has(entry.target)) continue;
      const target = entry.target;
      waiting.delete(target);
      visibility.unobserve(target);
      const cards = allCards(target);
      const cover = cards.find(card => card.matches('.prediction-card--onboarding'));
      const calls = cards.filter(card => card.matches('.prediction-card--call'))
        .sort((a, b) => Number(a.dataset.depth) - Number(b.dataset.depth));
      // Keep the question hidden while the opaque cover copy enters.
      const covered = cover ? calls[0] : null;
      const order = target.matches('.prediction-stack')
        ? cover ? [cover, ...calls.slice(1)] : calls
        : cards.reverse();
      order.forEach((card, index) => {
        card.style.setProperty('--prediction-enter-index', index);
        card.classList.add('prediction-enter-active');
        card.classList.remove('prediction-enter-pending');
        active.add(card);
        const complete = event => {
          if (event.target !== card || !['prediction-card-load', 'prediction-cover-load'].includes(event.animationName)) return;
          clean(card);
          if (card === cover && covered) clean(covered);
          card.removeEventListener('animationend', complete);
          card.removeEventListener('animationcancel', complete);
        };
        card.addEventListener('animationend', complete);
        card.addEventListener('animationcancel', complete);
      });
    }
  }, { threshold: 0.1 });
  function prepare(target) {
    if (reducedMotion.matches) return;
    const cards = allCards(target);
    if (!cards.length) return;
    // Faces can arrive after the cover or after persisted result IDs are loaded.
    if (waiting.has(target)) {
      cards.forEach(card => card.classList.add('prediction-enter-pending'));
      return;
    }
    if (seen.has(target)) return;
    seen.add(target);
    waiting.add(target);
    cards.forEach(card => card.classList.add('prediction-enter-pending'));
    visibility.observe(target);
  }
  function scan() {
    document.querySelectorAll(selector).forEach(prepare);
    [...active].filter(card => !card.isConnected).forEach(clean);
  }
  document.addEventListener('pointerdown', event => {
    const target = event.target.closest(selector);
    if (target) finish(target);
  });
  document.addEventListener('focusin', event => {
    const target = event.target.closest(selector);
    if (target) finish(target);
  });
  // The DS replay changes only this specimen, never calls or unread state.
  document.addEventListener('click', event => {
    const control = event.target.closest('[data-prediction-enter-replay]');
    if (!control) return;
    const target = document.getElementById(control.getAttribute('aria-controls'));
    if (!target?.matches('[data-prediction-enter-example]')) return;
    finish(target);
    seen.delete(target);
    prepare(target);
  });
  new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
  reducedMotion.addEventListener('change', () => {
    if (!reducedMotion.matches) return;
    [...waiting].forEach(finish);
    [...active].forEach(clean);
    document.querySelectorAll('.prediction-enter-pending').forEach(clean);
  });
  scan();
})();
