import { PEOPLE } from './people-data.js';
import { COLLECTIONS, interestLevel } from './collection-data.js';
import { escapeText as esc } from './story-card.js';

// This route previews a fresh Following feed without clearing saved follows.
export const isFollowingIntro = search => new URLSearchParams(search).get('following-intro') === '1';
// Keep new picks visible during this visit so Following can be clicked to undo.
// Existing follows are excluded before the two suggestions per group are chosen.
export function followingIntroSuggestions({ people = [], collections = [], retainPeople = [], retainCollections = [] } = {}) {
  const followedPeople = new Set(people), followedCollections = new Set(collections);
  const retainedPeople = new Set(retainPeople), retainedCollections = new Set(retainCollections);
  const peoplePriority = [...new Set(['daniel-reed', 'maya-chen', 'jamie-park', 'morgan-lee', ...PEOPLE.map(person => person.id)])];
  const personIds = kind => peoplePriority.filter(id => PEOPLE.find(person => person.id === id)?.kind === kind && (!followedPeople.has(id) || retainedPeople.has(id))).slice(0, 2);
  const collectionPriority = [...new Set(['collection-evidence-based-beauty.html', 'collection-ai-everyday-life.html', ...COLLECTIONS.map(collection => collection.href)])];
  return {
    authors: personIds('creators'),
    members: personIds('members'),
    collections: collectionPriority.filter(href => !followedCollections.has(href) || retainedCollections.has(href)).slice(0, 2),
  };
}

export function followingIntroMarkup({ people = [], collections = [], retainPeople = [], retainCollections = [], preview = false } = {}) {
  const pickedPeople = new Set(people), pickedCollections = new Set(collections);
  const suggestions = followingIntroSuggestions({ people, collections, retainPeople, retainCollections });
  const picked = retainPeople.length + retainCollections.length;
  const person = id => {
    const item = PEOPLE.find(person => person.id === id);
    const followed = pickedPeople.has(id);
    return `<li><a class="people-profile" href="${item.href}"><img class="people-avatar" src="${item.image}" alt="" width="48" height="48"><span><span class="people-name">${esc(item.name)}</span><span class="people-role">${esc(item.role)}</span></span></a><button class="edit-profile-button person-follow-button" type="button" data-intro-person-follow="${id}" aria-label="${followed ? 'Unfollow' : 'Follow'} ${esc(item.name)}" aria-pressed="${followed}">${followed ? 'Following' : 'Follow'}</button></li>`;
  };
  const collection = href => {
    const item = COLLECTIONS.find(collection => collection.href === href);
    const followed = pickedCollections.has(href);
    return `<li class="following-start-collection-row"><a class="pill-button following-start-collection" href="${href}"><span>${esc(item.name)}</span><span class="collection-momentum collection-momentum--${item.direction}" data-level="${interestLevel(item.percentage)}" role="img" aria-label="Interest ${item.direction} ${item.percentage}% · prototype sample"><span class="collection-momentum-track" aria-hidden="true"></span><span class="collection-momentum-value" aria-hidden="true">${item.percentage}%</span></span></a><button class="edit-profile-button person-follow-button" type="button" data-intro-collection-follow="${href}" aria-label="${followed ? 'Unfollow' : 'Follow'} ${esc(item.name)}" aria-pressed="${followed}">${followed ? 'Following' : 'Follow'}</button></li>`;
  };
  const group = (id, title, items, itemMarkup, empty) => `<section aria-labelledby="following-start-${id}"><h3 class="type-h4-caps" id="following-start-${id}">${title}</h3>${items.length ? `<ul class="people-list${id === 'collections' ? ' following-start-collection-list' : ''}">${items.map(itemMarkup).join('')}</ul>` : `<p class="following-start-exhausted">${empty}</p>`}</section>`;
  return `<section class="following-start" aria-labelledby="following-start-heading">
    <header class="profile-empty-state following-start-header"><h2 class="profile-empty-title" id="following-start-heading">${retainPeople.length ? 'Your Following is taking shape' : 'You’re not following anyone yet'}</h2><p class="profile-empty-copy">Follow collections, authors, and community members to keep up with what interests you. Here are some recommendations:</p></header>
    ${group('collections', 'Collections', suggestions.collections, collection, 'You’re following all the collections available right now.')}
    ${group('authors', 'Authors', suggestions.authors, person, 'You’re following all the authors available right now.')}
    ${group('members', 'Community members', suggestions.members, person, 'You’re following all the community members available right now.')}
    ${picked ? `<button class="button-primary" type="button" data-following-intro-done>${retainPeople.length ? 'See Following' : 'View Collections'}</button>` : ''}
    ${preview ? '<p class="visually-hidden">Prototype introduction: existing follows are preserved and excluded from recommendations. New picks stay visible until you leave this preview.</p>' : ''}
  </section>`.replace(/^ +$/gm, '');
}
