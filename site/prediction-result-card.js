import { escapeText as esc } from './story-card.js';

// The result popup and resolved profile rows share the same comparison labels,
// call directions, provided icon assets and accessible text.
export function predictionCallPanels(result) {
  return `<div class="prediction-outcome-calls">
    <div class="prediction-outcome-call"><span class="prediction-outcome-label">Your call</span><strong data-call="${result.call}"><span class="prediction-outcome-call-icon" data-call="${result.call}" aria-hidden="true"></span>${result.call==='in'?'I’m in':'I’m out'}</strong></div>
    <div class="prediction-outcome-call"><span class="prediction-outcome-label">Verified outcome</span><strong><span class="prediction-outcome-verified" aria-hidden="true"></span>${result.outcome.toUpperCase()}</strong></div>
  </div>`;
}

export function resolvedPredictionRow(result) {
  return `<li class="prediction-result prediction-result--outcome" data-id="${esc(result.id)}" data-result-status="resolved" tabindex="-1"><h3 class="prediction-result-headline">${esc(result.text)}</h3>${predictionCallPanels(result)}<a class="prediction-outcome-article" href="${esc(result.articleHref)}">Read our analysis</a><span class="visually-hidden">Fictional prototype prediction result.</span></li>`;
}
