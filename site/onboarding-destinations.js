// Only onboarding lives on this branch. These exits open the existing main prototype.
export const PROTOTYPE_BASE = 'https://ecastillo-productdesigner.github.io/TrendHunter/';
export const FEED_URL = new URL('feed.html#for-you', PROTOTYPE_BASE).href;
export const answerUrl = question => {
  const url = new URL('answers.html', PROTOTYPE_BASE);
  url.searchParams.set('q', question);
  return url.href;
};
export const articleUrl = href => new URL(href, PROTOTYPE_BASE).href;
