// Membership comes from existing collection pages; a shared story appears once in All.
export function followedStoryList(stories, followed, selected = 'all', unread = []) {
  const eligible = new Set(selected === 'all' ? followed : followed.includes(selected) ? [selected] : []);
  const fresh = new Set(unread);
  return stories.filter(story => story.collections.some(href => eligible.has(href)))
    .map(story => ({ ...story, collectionHref: story.collections.find(href => eligible.has(href)) }))
    .sort((a, b) => Number(fresh.has(b.href)) - Number(fresh.has(a.href)));
}
