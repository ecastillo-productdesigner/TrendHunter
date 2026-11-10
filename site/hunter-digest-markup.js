import { escapeText } from './story-card.js?v=2';

const link = (href, text) => `<a href="${escapeText(href)}">${escapeText(text)}</a>`;
export function digestHeader(id, edition) {
  return `<header class="hunter-digest-header"><div><h2 id="${id}" class="hunter-digest-title">Hunter Digest</h2><p class="hunter-digest-date"><time datetime="${edition.day}">${edition.label}</time><span aria-hidden="true"> · </span>Today</p></div><span class="hunter-digest-edition">Your daily catch-up</span></header>`;
}
export function digestMarkup(rows) {
  const groups = new Map();
  for (const row of rows) {
    if (!groups.has(row.collection.href)) groups.set(row.collection.href, { collection: row.collection, stories:[] });
    groups.get(row.collection.href).stories.push(row);
  }
  return [...groups.values()].map(({ collection, stories }) => `<section class="hunter-digest-collection"><h3 class="hunter-digest-collection-name">${link(collection.href, collection.name)}</h3><ol class="hunter-digest-stories">${stories.map(row => `<li><article>${row.kind === 'Updated story' ? '<p class="hunter-digest-update-label">Updated story</p>' : ''}<h4 class="hunter-digest-story-title">${link(row.href, row.title)}</h4><p class="hunter-digest-summary">${escapeText(row.summary)} <a class="hunter-digest-read-more" href="${escapeText(row.href)}" aria-label="Read more: ${escapeText(row.title)}">Read more</a></p></article></li>`).join('')}</ol></section>`).join('');
}
