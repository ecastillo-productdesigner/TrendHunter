const escapeText = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Shared by onboarding and the feed; callers own selection and persistence.
export function aboutYouQuestionMarkup(question, selected = '') {
  return `<fieldset class="onboarding-question"><legend tabindex="-1">${escapeText(question.question)}</legend><div class="onboarding-collections onboarding-answer-options" data-options="${question.options.length}">${question.options.map(([value, label]) => `<button class="pill-button onboarding-collection onboarding-answer" type="button" value="${escapeText(value)}" data-about-you-answer="${escapeText(question.id)}" aria-pressed="${selected === value}"><span class="onboarding-collection-label">${escapeText(label)}</span></button>`).join('')}</div></fieldset>`;
}
