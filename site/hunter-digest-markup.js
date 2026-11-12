import { interestLevel } from './collection-data.js';
import { escapeText } from './story-card.js?v=2';

const link = (href, text) => `<a href="${escapeText(href)}">${escapeText(text)}</a>`;
export function digestHeader(id, edition, counts) {
  return `<header class="hunter-digest-header"><div><h2 id="${id}" class="hunter-digest-title">Your Digest</h2><p class="hunter-digest-date"><time datetime="${edition.day}">${edition.label}</time>${counts ? `<span aria-hidden="true"> · </span>${plural(counts.collections, 'collection')} with updates · ${plural(counts.stories, 'story')}` : ''}</p></div></header>`;
}
function collectionEyebrow(collection) {
  const direction = collection.direction === 'falling' ? 'falling' : 'rising';
  const label = `Interest ${direction} ${collection.percentage}% · prototype sample`;
  return `<a href="${escapeText(collection.href)}"><span>${escapeText(collection.name)}</span><span class="collection-momentum collection-momentum--${direction}" data-level="${interestLevel(collection.percentage)}" role="img" aria-label="${escapeText(label)}"><span class="collection-momentum-track" aria-hidden="true"><span class="collection-momentum-fill"></span></span></span></a>`;
}
function groupCollections(rows) {
  const groups = new Map();
  for (const row of rows) {
    if (!groups.has(row.collection.href)) groups.set(row.collection.href, { collection: row.collection, stories:[] });
    groups.get(row.collection.href).stories.push(row);
  }
  return [...groups.values()];
}
function storyMarkup(stories) {
  return `<ol class="hunter-digest-stories">${stories.map(row => `<li><article>${row.kind === 'Updated story' ? '<p class="hunter-digest-update-label">Updated story</p>' : ''}<h4 class="hunter-digest-story-title">${link(row.href, row.title)}</h4><p class="hunter-digest-summary">${escapeText(row.summary)} <a class="hunter-digest-read-more" href="${escapeText(row.href)}" aria-label="Read more: ${escapeText(row.title)}">Read more</a></p></article></li>`).join('')}</ol>`;
}
function collectionMarkup({ collection, stories }, number) {
  return `<section class="hunter-digest-collection"><span class="hunter-digest-collection-number" aria-hidden="true">${number}</span><h3 class="hunter-digest-collection-name"><span class="visually-hidden">${number}. </span>${collectionEyebrow(collection)}</h3>${storyMarkup(stories)}</section>`;
}
export function digestMarkup(rows) {
  return groupCollections(rows).map((group, index) => collectionMarkup(group, index + 1)).join('');
}

const plural = (count, noun) => `${count} ${count === 1 ? noun : noun === 'story' ? 'stories' : `${noun}s`}`;
export function digestCardMarkup(rows, edition, { expanded = false, id = 'hunter-digest', includeMarkAllRead = true } = {}) {
  const groups = groupCollections(rows);
  const first = groups[0];
  const remainingFirstStories = first?.stories.slice(1) || [];
  // Keep the first story visible, then continue its collection before the next
  // numbered group. Interleaved source rows must not repeat a collection header.
  return digestHeader(`${id}-heading`, edition, { collections:groups.length, stories:rows.length })
    + (first ? collectionMarkup({ ...first, stories:first.stories.slice(0, 1) }, 1) : '')
    + `<details class="hunter-digest-disclosure" data-digest-disclosure ${expanded ? 'open' : ''}>
      <summary class="hunter-digest-action">See all updates</summary>
      <div class="hunter-digest-details${!remainingFirstStories.length && groups.length > 1 ? ' hunter-digest-details--new-collection' : ''}">
        ${remainingFirstStories.length ? `<div class="hunter-digest-collection hunter-digest-collection--continuation">${storyMarkup(remainingFirstStories)}</div>` : ''}
        ${groups.slice(1).map((group, index) => collectionMarkup(group, index + 2)).join('')}
        <footer class="hunter-digest-footer"><button class="hunter-digest-action" type="button" data-digest-close>Close digest</button>${includeMarkAllRead ? '<button class="hunter-digest-complete" type="button" data-digest-read-all>Mark all as read<span class="feed-complete-icon" aria-hidden="true"></span></button>' : ''}</footer>
      </div>
    </details>`.replace(/^[\t ]+$/gm, '');
}
