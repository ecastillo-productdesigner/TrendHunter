import { COLLECTIONS, interestLevel } from './collection-data.js?v=2';
import { COLLECTION_STORIES } from './collection-story-data.js';

// A few sample update batches include additional context stories to expand.
const expandableSamples = new Set([
  'collection-retailtainment-hubs.html',
  'collection-evidence-based-beauty.html',
  'collection-back-to-school-transitions.html',
  'collection-ai-everyday-life.html',
  'collection-solo-travel.html',
]);

export function changingCollectionUpdates() {
  return COLLECTIONS.map(collection => ({
    ...collection,
    stories: COLLECTION_STORIES.filter(story => story.collections.includes(collection.href)).slice(0, 3),
    moreStories: expandableSamples.has(collection.href) ? COLLECTION_STORIES.filter(story => story.collections.includes(collection.href)).slice(3) : [],
  })).filter(collection => collection.stories.length);
}

export function bindChangingCollections(container) {
  const updates = changingCollectionUpdates();
  const list = container.querySelector('[data-changing-collections]');
  const make = (tag, className, text) => {
    const element = document.createElement(tag);
    element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  };

  for (const collection of updates) {
    const item = document.createElement('li');
    item.dataset.percentage = collection.percentage;
    const card = make('article', 'changing-collection-card');
    card.dataset.direction = collection.direction;
    const header = make('header', 'changing-collection-header');
    const identity = make('div', 'changing-collection-identity');
    const heading = make('h2', 'changing-collection-heading');
    const link = make('a', 'changing-collection-link', collection.name);
    link.href = collection.href;
    const momentum = make('span', `collection-momentum collection-momentum--${collection.direction}`);
    momentum.dataset.level = interestLevel(collection.percentage);
    momentum.setAttribute('role', 'img');
    momentum.setAttribute('aria-label', `Interest ${collection.direction} ${collection.percentage}% · prototype sample`);
    const track = make('span', 'collection-momentum-track');
    track.setAttribute('aria-hidden', 'true');
    const value = make('span', 'collection-momentum-value', `${collection.percentage}%`);
    value.setAttribute('aria-hidden', 'true');
    momentum.append(track, value);
    heading.append(link, momentum);
    identity.append(heading);
    identity.append(make('p', 'changing-collection-updated', `Updated ${collection.hours}hr${collection.hours === 1 ? '' : 's'} ago`));
    const metric = make('div', 'changing-collection-metric');
    metric.append(make('strong', 'changing-collection-value', `${collection.direction === 'falling' ? '−' : '+'}${collection.percentage}%`), make('p', 'changing-collection-period', 'Interest · 7 days'));
    metric.title = 'Illustrative interest change compared with the previous 7 days. Prototype sample, not live analytics.';
    header.append(identity, metric);
    const stories = make('section', 'changing-collection-stories');
    const storyHeading = make('h3', 'changing-collection-story-heading', 'Latest stories');
    const storyList = make('ul', 'changing-collection-story-list');
    storyList.id = `changing-stories-${collection.href.replace('.html', '')}`;
    for (const [index, story] of [...collection.stories, ...collection.moreStories].entries()) {
      const storyItem = document.createElement('li');
      storyItem.hidden = index >= collection.stories.length;
      const storyLink = make('a', 'changing-collection-story-link');
      storyLink.href = story.href;
      storyLink.append(make('span', 'changing-collection-story-title', story.title));
      storyItem.append(storyLink);
      storyList.append(storyItem);
    }
    stories.append(storyHeading, storyList);
    if (collection.moreStories.length) {
      const toggle = make('button', 'changing-collection-more', 'See more');
      toggle.type = 'button';
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-controls', storyList.id);
      toggle.setAttribute('aria-label', `See more stories in ${collection.name}`);
      toggle.addEventListener('click', () => {
        const expanded = toggle.getAttribute('aria-expanded') !== 'true';
        [...storyList.children].forEach((item, index) => { item.hidden = index >= collection.stories.length && !expanded; });
        toggle.setAttribute('aria-expanded', String(expanded));
        toggle.setAttribute('aria-label', `See ${expanded ? 'fewer' : 'more'} stories in ${collection.name}`);
        toggle.textContent = expanded ? 'See less' : 'See more';
      });
      stories.append(toggle);
    }
    card.append(header, stories);
    item.append(card);
    list.append(item);
  }

  return {
    count: updates.length,
    sort(order) {
      // Reorder only on an explicit sort or view change, not during a score tick.
      const ranked = [...list.children].sort((a, b) => order === 'smallest'
        ? Number(a.dataset.percentage) - Number(b.dataset.percentage)
        : Number(b.dataset.percentage) - Number(a.dataset.percentage));
      ranked.forEach(item => list.append(item));
    },
  };
}
