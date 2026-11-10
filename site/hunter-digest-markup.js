import { escapeText } from './story-card.js?v=2';

const link = (href, text) => `<a href="${escapeText(href)}">${escapeText(text)}</a>`;
export function digestHeader(id, edition, counts) {
  return `<header class="hunter-digest-header"><div><h2 id="${id}" class="hunter-digest-title">Hunter Digest</h2><p class="hunter-digest-date"><time datetime="${edition.day}">${edition.label}</time>${counts ? `<span aria-hidden="true"> · </span>${plural(counts.collections, 'collection')} with updates · ${plural(counts.stories, 'story')}` : ''}</p></div></header>`;
}
export function digestMarkup(rows) {
  const groups = new Map();
  for (const row of rows) {
    if (!groups.has(row.collection.href)) groups.set(row.collection.href, { collection: row.collection, stories:[] });
    groups.get(row.collection.href).stories.push(row);
  }
  return [...groups.values()].map(({ collection, stories }) => `<section class="hunter-digest-collection"><h3 class="hunter-digest-collection-name">${link(collection.href, collection.name)}</h3><ol class="hunter-digest-stories">${stories.map(row => `<li><article>${row.kind === 'Updated story' ? '<p class="hunter-digest-update-label">Updated story</p>' : ''}<h4 class="hunter-digest-story-title">${link(row.href, row.title)}</h4><p class="hunter-digest-summary">${escapeText(row.summary)} <a class="hunter-digest-read-more" href="${escapeText(row.href)}" aria-label="Read more: ${escapeText(row.title)}">Read more</a></p></article></li>`).join('')}</ol></section>`).join('');
}

const plural = (count, noun) => `${count} ${count === 1 ? noun : noun === 'story' ? 'stories' : `${noun}s`}`;
export function digestCardMarkup(rows, edition, { expanded = false, id = 'hunter-digest', includeCatchUp = true } = {}) {
  const count = new Set(rows.map(row => row.collection.href)).size;
  return digestHeader(`${id}-heading`, edition, { collections:count, stories:rows.length })
    + digestMarkup(rows.slice(0, 1))
    + `<details class="hunter-digest-disclosure" data-digest-disclosure ${expanded ? 'open' : ''}>
      <summary class="hunter-digest-action"><span class="hunter-digest-open-label">See all updates <span aria-hidden="true">→</span></span><span class="hunter-digest-close-label">Close digest <span aria-hidden="true">↑</span></span></summary>
      <div class="hunter-digest-details">
        ${digestMarkup(rows.slice(1))}
        ${includeCatchUp ? '<footer class="hunter-digest-footer"><button class="hunter-digest-action" type="button" data-digest-caught-up>Mark digest as caught up</button></footer>' : ''}
      </div>
    </details>`.replace(/^[\t ]+$/gm, '');
}
