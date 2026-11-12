import { COLLECTION_STORIES } from '../site/collection-story-data.js';
import { sampleComments } from '../site/comments-state.js';
import { feedCommentsMarkup } from '../site/feed-comments.js';

// Use the live renderer and existing fictional fixtures for the DS specimen.
const hrefs = ['trend-sleep-earbuds.html', 'trend-skin-longevity.html', 'trend-city-content-walk.html'];
const previews = hrefs.map((href, index) => {
  const story = COLLECTION_STORIES.find(story => story.href === href);
  if (!story) throw new Error(`Missing comment preview story: ${href}`);
  const comments = sampleComments(href);
  return { story: { ...story, href: `../${story.href}`, image: `../${story.image}` }, comment: comments[index], count: comments.length };
});
process.stdout.write(feedCommentsMarkup(previews).replaceAll('href="reader-', 'href="../reader-').replaceAll('src="assets/readers/', 'src="../assets/readers/'));
