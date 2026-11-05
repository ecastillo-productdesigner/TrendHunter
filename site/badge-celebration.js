import { escapeText } from './story-card.js';
import { closeBadgeDialog } from './badge-dialog-motion.js';

let dismissCurrent = () => {};
export function dismissBadgeCelebration() { dismissCurrent({ immediate: true }); }

// The same short medal burst accompanies newly earned badges and correct results.
export function medalBurst(container) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};
  const particles = [];
  for (let i = 0; i < 24; i++) {
    const particle = document.createElement('span');
    particle.className = 'badge-confetti-particle';
    particle.setAttribute('aria-hidden', 'true');
    const angle = i / 24 * Math.PI * 2, reach = 110 + i % 4 * 18;
    const x = Math.cos(angle) * reach, y = Math.sin(angle) * reach;
    for (const [name, value] of Object.entries({ x: `${x}px`, 'mid-x': `${x * .75}px`, y: `${y}px`, 'end-y': `${y + 55}px`, 'mid-turn': `${i * 23}deg`, turn: `${i * 37}deg` })) particle.style.setProperty(`--particle-${name}`, value);
    container.append(particle);
    particles.push(particle);
  }
  const clear = () => particles.forEach(particle => particle.remove());
  const duration = parseFloat(getComputedStyle(container).getPropertyValue('--motion-badge-celebration')) || 2500;
  const timer = setTimeout(clear, duration);
  return () => { clearTimeout(timer); clear(); };
}

// Celebrations announce real awards; replaying this view never awards progress.
export function celebrateBadge(badge) {
  requestAnimationFrame(() => {
    dismissCurrent({ immediate: true });
    const previousFocus = document.activeElement;
    const explanation = {
      'first-call': 'You earned this badge because you voted on your first prediction.',
      'regular-hunter': 'You earned this badge by making calls on 5 different days.',
      'deep-diver': 'You earned this badge by reading 3 stories to the end.',
      'field-notes': 'You earned this badge by saving 5 stories.',
      'sharp-eye': 'You earned this badge by correctly calling 3 verified predictions.',
    };
    const popup = document.createElement('dialog');
    popup.className = 'badge-award-dialog';
    popup.setAttribute('aria-labelledby', 'badge-award-heading');
    popup.setAttribute('aria-describedby', 'badge-award-explanation');
    popup.innerHTML = `<section class="badge-award-card"><button class="badge-award-close" type="button" aria-label="Close earned badge"><span class="drawer-close-icon" aria-hidden="true"></span></button><span class="badge-award-symbol material-symbols-outlined" aria-hidden="true">${escapeText(badge.icon)}</span><h2 id="badge-award-heading">${escapeText(badge.name)}</h2><p id="badge-award-explanation">${escapeText(explanation[badge.id] || badge.criterion || 'You earned a new badge.')}</p></section>`;
    const burst = document.createElement('span');
    burst.className = 'badge-award-burst';
    burst.setAttribute('aria-hidden', 'true');
    popup.append(burst);
    let clearParticles = () => {}, dismissed = false, cleaned = false;
    const finish = () => {
      if (cleaned) return;
      cleaned = true;
      if (popup.open) popup.close();
      popup.remove();
      if (previousFocus?.isConnected && !document.querySelector('dialog[open]')) previousFocus.focus({ preventScroll: true });
      if (dismissCurrent === dismiss) dismissCurrent = () => {};
    };
    const dismiss = ({ immediate = false } = {}) => {
      if (dismissed) { if (immediate) finish(); return; }
      dismissed = true;
      clearParticles();
      if (immediate) finish(); else closeBadgeDialog(popup).then(finish);
    };
    popup.querySelector('.badge-award-close').addEventListener('click', dismiss);
    popup.addEventListener('click', event => { if (event.target === popup) dismiss(); });
    popup.addEventListener('cancel', event => { event.preventDefault(); dismiss(); });
    popup.addEventListener('close', dismiss);
    popup.addEventListener('animationend', event => {
      if (event.target === popup && event.animationName === 'badge-coin-reveal' && popup.open && !dismissed) clearParticles = medalBurst(burst);
    }, { once: true });
    dismissCurrent = dismiss;
    document.body.append(popup);
    popup.showModal();
    // Confetti ends after 2.5 seconds. The framed announcement stays until closed.
  });
}
