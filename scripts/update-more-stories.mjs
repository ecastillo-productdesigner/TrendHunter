import { readFile, writeFile, readdir } from 'node:fs/promises';
import { COLLECTION_STORIES } from '../site/collection-story-data.js';
import { COLLECTIONS } from '../site/collection-data.js';
import { editorialStoryCard } from '../site/story-card.js';
const stories = new Map(COLLECTION_STORIES.map(story => [story.href,story]));
const collections = new Map(COLLECTIONS.map(collection => [collection.href,collection]));
let count = 0;
for (const file of await readdir('site')) {
  if (!file.endsWith('.html')) continue;
  const path = `site/${file}`;
  const original = await readFile(path,'utf8');
  const html = original.replace(/<section class="trend-card-list"[\s\S]*?<\/section>/g, section => section.replace(/<article class="trend-card"[^>]*>[\s\S]*?<\/article>/g, card => {
    const href = card.match(/data-href="([^"]+)"/)?.[1] || card.match(/href="([^"]+)" class="button-primary"/)?.[1];
    const story = stories.get(href);
    const collection = collections.get(card.match(/<a href="([^"]+)" class="trend-card-collection"/)?.[1]);
    if (!story || !collection) throw new Error(`Missing More Stories mapping in ${file}: ${href}`);
    count++;
    return editorialStoryCard(story,collection).replace(/^<li>/,'').replace(/<\/li>$/,'');
  }));
  if (html !== original) await writeFile(path,html);
}
console.log(`Updated ${count} More Stories cards`);
