// One editorial card renderer for followed collections and followed creators.
export const escapeText = value => String(value).replace(/[&<>"']/g, character => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[character]));
export function editorialStoryCard(story, collection, { isNew = false, context = '', contextHref = '' } = {}) {
  const title = escapeText(story.title);
  const label = `Interest ${collection.direction} ${collection.percentage}%`;
  const level = Math.max(1, Math.min(4, Math.ceil(collection.percentage / 25)));
  return `<li><article class="trend-card trend-card--editorial trend-card--followed">
    ${context ? `<p class="people-activity-label">${contextHref ? `<a href="${contextHref}">${escapeText(context)}</a>` : escapeText(context)}</p>` : ''}
    ${isNew ? '<p class="followed-story-update collection-story-update"><span class="collection-updates-dot" aria-hidden="true"></span><span>New in this collection</span></p>' : ''}
    <a class="trend-card-media trend-card-media-link" href="${story.href}" aria-label="Read: ${title}"><img class="trend-card-image" src="${story.image}" alt="" loading="lazy"></a>
    <a href="${collection.href}" class="trend-card-collection"><span class="trend-card-collection-label">${escapeText(collection.name)}</span><span class="collection-momentum collection-momentum--${collection.direction}" data-level="${level}" role="img" aria-label="${label}" title="${label}"><span class="collection-momentum-track" aria-hidden="true"></span></span></a>
    <div class="trend-card-content"><h2 class="trend-card-headline"><a class="trend-card-title-link" href="${story.href}">${title}</a></h2></div>
    <footer class="trend-card-footer">
      <a class="contributor-byline trend-card-author" href="${story.authorHref || `contributor-${story.authorId}.html`}" aria-label="View ${escapeText(story.author)}’s profile"><span class="avatar avatar--contributor" aria-hidden="true"><img src="${story.authorImage || `assets/authors/${story.authorId}.webp`}" alt="" width="24" height="24" loading="lazy"></span><span class="contributor-name">${escapeText(story.author)}</span></a>
      <div class="trend-card-actions"><button class="trend-card-action story-share" type="button" data-story-share aria-label="Share story"><span class="trend-card-share-icon" aria-hidden="true"></span></button><button class="trend-card-action bookmark-button" type="button" aria-label="Bookmark" aria-pressed="false" data-story="${escapeText(story.id)}" data-title="${title}" data-image="${story.image}" data-href="${story.href}"><span class="bookmark-icon" aria-hidden="true"></span></button></div>
    </footer>
  </article></li>`.replace(/^ +$/gm,'');
}
