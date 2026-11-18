// Main onboarding opens the existing pages on the current prototype origin.
export const FEED_URL = 'feed.html#for-you';
export const answerUrl = question => `answers.html?${new URLSearchParams({ q: question })}`;
export const articleUrl = href => href;
