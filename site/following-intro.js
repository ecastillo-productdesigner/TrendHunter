import { PEOPLE } from './people-data.js';
import { COLLECTIONS, interestLevel } from './collection-data.js';
import { escapeText as esc } from './story-card.js';

// This route previews a fresh Following feed without clearing saved follows.
export const isFollowingIntro = search => new URLSearchParams(search).get('following-intro') === '1';
export function followingIntroMarkup({ people = [], collections = [], preview = false } = {}) {
  const pickedPeople = new Set(people), pickedCollections = new Set(collections);
  const picked = pickedPeople.size + pickedCollections.size;
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
  return `<section class="following-start" aria-labelledby="following-start-heading">
    <header class="profile-empty-state following-start-header"><h2 class="profile-empty-title" id="following-start-heading">${pickedPeople.size ? 'Your Following is taking shape' : 'You’re not following anyone yet'}</h2><p class="profile-empty-copy">Follow collections, authors, and community members to keep up with what interests you. Here are some recommendations:</p></header>
    <section aria-labelledby="following-start-collections"><h3 class="type-h4-caps" id="following-start-collections">Collections</h3><ul class="people-list following-start-collection-list">${['collection-evidence-based-beauty.html','collection-ai-everyday-life.html'].map(collection).join('')}</ul></section>
    <section aria-labelledby="following-start-authors"><h3 class="type-h4-caps" id="following-start-authors">Authors</h3><ul class="people-list">${['daniel-reed','maya-chen'].map(person).join('')}</ul></section>
    <section aria-labelledby="following-start-members"><h3 class="type-h4-caps" id="following-start-members">Community members</h3><ul class="people-list">${['jamie-park','morgan-lee'].map(person).join('')}</ul></section>
    ${picked ? `<button class="button-primary" type="button" data-following-intro-done>${pickedPeople.size ? 'See Following' : 'View Collections'}</button>` : ''}
    ${preview ? '<p class="visually-hidden">Prototype introduction: existing follows are preserved. Suggestions start unselected for this preview.</p>' : ''}
  </section>`.replace(/^ +$/gm, '');
}
