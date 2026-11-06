// A few illustrative prototype scores change slowly. This is not a live data feed.
// In production, measured collection updates should replace these sample sequences.
const samples = new Map([
  ['rising:22', [22, 27, 22, 24]], // Evidence-Based Beauty: one ↔ two chevrons.
  ['rising:34', [34, 51, 34, 32]], // Retailtainment Hubs: two ↔ three.
  ['rising:27', [27, 24, 27, 29]], // Sleep Medicine: two ↔ one.
  ['falling:20', [20, 27, 20, 18]], // Back-to-School: one ↔ two, still falling.
]);

export function sampleMomentum(key, step = 0) {
  const sequence = samples.get(key);
  if (!sequence) return null;
  const value = sequence[((step % sequence.length) + sequence.length) % sequence.length];
  return { value, level: Math.max(1, Math.min(4, Math.ceil(value / 25))) };
}

export function bindCollectionMomentum(root = document, view = window) {
  const groups = new Map();
  const known = new WeakSet();
  const reduced = view.matchMedia('(prefers-reduced-motion: reduce)');
  const styles = view.getComputedStyle(root.documentElement);
  const refresh = parseFloat(styles.getPropertyValue('--motion-momentum-refresh')) || 10000;
  let timer;
  let turn = 0;

  function paint(element, key, step) {
    const { value, level } = sampleMomentum(key, step);
    const direction = key.split(':')[0];
    const label = `Interest ${direction} ${value}% · prototype sample`;
    element.dataset.activity = 'sample';
    element.dataset.level = level;
    element.setAttribute('aria-label', label);
    element.title = label;
    const track = element.querySelector('.collection-momentum-track');
    track?.style.setProperty('--momentum-lit', `${level * 25}%`);
    const number = element.querySelector('.collection-momentum-value');
    if (number) number.textContent = `${value}%`;
    const card = element.closest('.changing-collection-card');
    if (card) {
      card.querySelector('.changing-collection-value').textContent = `${direction === 'falling' ? '−' : '+'}${value}%`;
      card.parentElement.dataset.percentage = value;
    }
    const summary = element.closest('.collection-interest-summary');
    if (summary) summary.querySelector('.collection-interest-value').textContent = `${direction === 'falling' ? '−' : '+'}${value}%`;
  }

  function register() {
    for (const element of root.querySelectorAll('.collection-momentum')) {
      if (known.has(element)) continue;
      known.add(element);
      const direction = element.classList.contains('collection-momentum--falling') ? 'falling' : 'rising';
      const value = parseFloat(element.querySelector('.collection-momentum-value')?.textContent || element.getAttribute('aria-label')?.match(/[\d.]+%/)?.[0]);
      const key = `${direction}:${value}`;
      if (!sampleMomentum(key)) continue; // Most collections remain completely still.
      if (!groups.has(key)) groups.set(key, { step: 0, elements: new Set() });
      const group = groups.get(key);
      group.elements.add(element);
      paint(element, key, group.step);
    }
  }

  function visible(element) {
    const box = element.getBoundingClientRect();
    return box.width > 0 && box.height > 0 && box.bottom > 0 && box.top < view.innerHeight && box.right > 0 && box.left < view.innerWidth;
  }

  function schedule() {
    view.clearTimeout(timer);
    if (root.hidden || reduced.matches) return;
    timer = view.setTimeout(() => {
      const available = [...groups].filter(([, group]) => {
        for (const element of group.elements) if (!element.isConnected) group.elements.delete(element);
        return [...group.elements].some(visible);
      });
      if (available.length) {
        // One collection per tick; duplicate instances share the same sample state.
        const [key, group] = available[turn++ % available.length];
        group.step += 1;
        for (const element of group.elements) paint(element, key, group.step);
      }
      schedule();
    }, refresh);
  }

  register();
  const observer = new view.MutationObserver(records => {
    if (records.some(record => [...record.addedNodes].some(node => node.nodeType === 1))) register();
  });
  observer.observe(root.body, { childList: true, subtree: true });
  root.addEventListener('visibilitychange', schedule);
  reduced.addEventListener('change', schedule);
  view.addEventListener('pagehide', () => view.clearTimeout(timer));
  view.addEventListener('pageshow', schedule);
  schedule();
}

if (typeof document !== 'undefined') bindCollectionMomentum();
