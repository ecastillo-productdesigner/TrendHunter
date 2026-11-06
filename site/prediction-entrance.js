// Reference: foreground first, then the cards behind it come into focus in place.
(() => {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  if (!('IntersectionObserver' in window)) return;
  const seen = new WeakSet(), waiting = new Set(), active = new Set();
  const occlusions = new WeakMap();
  let occlusionId = 0;
  const selector = '.prediction-stack, .prediction-results-alert-slot, [data-prediction-enter-example]';
  const allCards = target => target.matches('.prediction-stack')
    ? [...target.querySelectorAll(':scope > .prediction-card--call:not(.is-flying), :scope > .prediction-card--onboarding')]
    : [...target.querySelectorAll('.prediction-results-art-sheet')];
  function clearOcclusion(target) {
    const state = occlusions.get(target);
    if (!state) return;
    for (const card of state.cards) {
      card.style.removeProperty('mask-image');
      card.style.removeProperty('-webkit-mask-image');
    }
    state.svg.remove();
    occlusions.delete(target);
  }
  function occludeRearCards(target, cards) {
    if (!target.matches('.prediction-stack') || cards.length < 2 || !window.DOMMatrix) return;
    const ns = 'http://www.w3.org/2000/svg';
    const node = (tag, attrs) => {
      const element = document.createElementNS(ns, tag);
      for (const [name, value] of Object.entries(attrs)) element.setAttribute(name, value);
      return element;
    };
    const geometry = cards.map(card => {
      const style = getComputedStyle(card);
      const [x, y] = style.transformOrigin.split(' ').map(parseFloat);
      const matrix = new DOMMatrix().translate(card.offsetLeft + x, card.offsetTop + y)
        .multiply(new DOMMatrix(style.transform === 'none' ? undefined : style.transform)).translate(-x, -y);
      return { card, matrix, width: card.offsetWidth, height: card.offsetHeight,
        radius: parseFloat(style.borderTopLeftRadius) || 0, depth: parseInt(style.zIndex, 10) || 0 };
    }).sort((a, b) => b.depth - a.depth);
    const svg = node('svg', { width: 0, height: 0, 'aria-hidden': 'true', focusable: 'false' });
    svg.style.position = 'absolute';
    const defs = node('defs', {});
    svg.append(defs);
    const padding = Math.ceil((parseFloat(getComputedStyle(target).getPropertyValue('--motion-card-enter-blur')) || 0) * 4);
    const masked = [];
    geometry.forEach((back, index) => {
      if (!index) return;
      const id = `prediction-enter-occlusion-${++occlusionId}`;
      const mask = node('mask', { id, maskUnits: 'userSpaceOnUse', maskContentUnits: 'userSpaceOnUse',
        x: -padding, y: -padding, width: back.width + padding * 2, height: back.height + padding * 2, 'mask-type': 'luminance' });
      mask.append(node('rect', { x: -padding, y: -padding, width: back.width + padding * 2, height: back.height + padding * 2, fill: 'white' }));
      for (const front of geometry.slice(0, index)) {
        const relative = back.matrix.inverse().multiply(front.matrix);
        mask.append(node('rect', { width: front.width, height: front.height, rx: front.radius, fill: 'black',
          transform: `matrix(${[relative.a, relative.b, relative.c, relative.d, relative.e, relative.f].join(' ')})` }));
      }
      defs.append(mask);
      back.card.style.maskImage = `url("#${id}")`;
      back.card.style.webkitMaskImage = `url("#${id}")`;
      masked.push(back.card);
    });
    target.append(svg);
    occlusions.set(target, { svg, cards: masked });
  }
  function clean(card) {
    card.classList.remove('prediction-enter-pending', 'prediction-enter-active');
    card.style.removeProperty('--prediction-enter-index');
    active.delete(card);
  }
  function finish(target) {
    waiting.delete(target);
    visibility.unobserve(target);
    allCards(target).forEach(clean);
    clearOcclusion(target);
  }
  const visibility = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting || !waiting.has(entry.target)) continue;
      const target = entry.target;
      waiting.delete(target);
      visibility.unobserve(target);
      const cards = allCards(target);
      // Preserve the original full-card fade, but do not paint a rear card
      // underneath any foreground silhouette while its opacity is below one.
      occludeRearCards(target, cards);
      const cover = cards.find(card => card.matches('.prediction-card--onboarding'));
      const calls = cards.filter(card => card.matches('.prediction-card--call'))
        .sort((a, b) => Number(a.dataset.depth) - Number(b.dataset.depth));
      // Keep the question hidden while the opaque cover copy enters.
      const covered = cover ? calls[0] : null;
      const order = target.matches('.prediction-stack')
        ? cover ? [cover, ...calls.slice(1)] : calls
        : cards.reverse();
      let remaining = order.length;
      order.forEach((card, index) => {
        card.style.setProperty('--prediction-enter-index', index);
        card.classList.add('prediction-enter-active');
        card.classList.remove('prediction-enter-pending');
        active.add(card);
        const complete = event => {
          if (event.target !== card || !['prediction-card-load', 'prediction-cover-load'].includes(event.animationName)) return;
          clean(card);
          if (card === cover && covered) clean(covered);
          if (!--remaining) clearOcclusion(target);
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
    new Set([...active].map(card => card.closest(selector)).filter(Boolean)).forEach(finish);
    document.querySelectorAll('.prediction-enter-pending').forEach(clean);
  });
  window.addEventListener('resize', () => {
    document.querySelectorAll(selector).forEach(target => { if (occlusions.has(target)) finish(target); });
  });
  scan();
})();
