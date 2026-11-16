import { escapeText as esc } from './story-card.js';

// Both placements describe the same unread sample outcomes and open the same dialog.
export function predictionResultAlert(results, { sidebar = false } = {}) {
  const unread = results.filter(result => !result.seen);
  if (!unread.length) return '';
  const count = unread.length;
  const singular = count === 1;
  const sheetCount = Math.min(count, 3);
  const sheets = Array.from({ length: sheetCount }, (_, index) =>
    `<span class="prediction-results-art-sheet">${index === sheetCount - 1 ? `<strong class="prediction-results-art-number">${count}</strong><span class="prediction-results-art-label">Verified</span>` : ''}</span>`).join('');
  const heading = singular ? 'Your prediction result is in' : `${count} of your predictions have results`;
  const button = `<button class="button-primary" type="button" data-result-reveal="${esc(unread[0].id)}" aria-haspopup="dialog">See ${singular ? 'result' : 'results'}</button>`;
  const art = `<div class="prediction-results-art" aria-hidden="true">${sheets}</div>`;
  return `<section class="prediction-results-alert${sidebar ? ' prediction-results-alert--sidebar' : ''}" aria-label="Prediction results, prototype sample"><div class="prediction-results-copy"><h2 class="trend-card-headline">${heading}</h2>${button}</div>${art}</section>`;
}
