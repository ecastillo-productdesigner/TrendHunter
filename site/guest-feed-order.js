// Reuse the live nodes: guest discovery must not duplicate video controls or decks.
export function guestFeedOrder(items, kindFor) {
  const stories = items.filter(item => kindFor(item) === 'story');
  const used = new Set();
  const ordered = [];
  const add = item => { if (item && !used.has(item)) { used.add(item); ordered.push(item); } };
  const module = kind => items.filter(item => kindFor(item) === kind).forEach(add);
  stories.slice(0, 3).forEach(add);
  module('collections');
  stories.slice(3, 5).forEach(add);
  module('videos');
  module('predictions');
  stories.slice(5, 7).forEach(add);
  module('writers');
  module('account');
  items.filter(item => kindFor(item) !== 'complete').forEach(add);
  module('complete');
  return ordered;
}
