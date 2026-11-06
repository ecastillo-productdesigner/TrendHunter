import test from 'node:test';
import assert from 'node:assert/strict';
import { PEOPLE } from '../site/people-data.js';
import { COLLECTIONS } from '../site/collection-data.js';
import { followingIntroSuggestions, followingIntroMarkup } from '../site/following-intro.js';

test('recommendations replace followed authors, members, and collections', () => {
  const people = ['daniel-reed', 'maya-chen', 'jamie-park', 'morgan-lee'];
  const collections = ['collection-evidence-based-beauty.html', 'collection-ai-everyday-life.html'];
  const suggestions = followingIntroSuggestions({ people, collections });
  assert.equal(suggestions.authors.length, 2);
  assert.equal(suggestions.members.length, 2);
  assert.equal(suggestions.collections.length, 2);
  assert.ok([...suggestions.authors, ...suggestions.members].every(id => !people.includes(id)));
  assert.ok(suggestions.collections.every(href => !collections.includes(href)));
  assert.ok(suggestions.authors.every(id => PEOPLE.find(person => person.id === id).kind === 'creators'));
  assert.ok(suggestions.members.every(id => PEOPLE.find(person => person.id === id).kind === 'members'));
});

test('a new follow stays in the same place and can be unfollowed', () => {
  const before = ['daniel-reed', 'maya-chen'];
  const initial = followingIntroSuggestions({ people: before });
  const newPick = initial.authors[0];
  const retained = followingIntroSuggestions({ people: [...before, newPick], retainPeople: [newPick] });
  assert.deepEqual(retained.authors, initial.authors);
  const markup = followingIntroMarkup({ people: [...before, newPick], retainPeople: [newPick], preview: true });
  assert.match(markup, new RegExp(`data-intro-person-follow="${newPick}" aria-label="Unfollow [^"]+" aria-pressed="true"`));
  assert.doesNotMatch(markup, /aria-disabled="true"/);
  assert.deepEqual(followingIntroSuggestions({ people: before }).authors, initial.authors);
});

test('all-followed groups show an honest exhausted state instead of duplicate suggestions', () => {
  const people = PEOPLE.map(person => person.id), collections = COLLECTIONS.map(collection => collection.href);
  assert.deepEqual(followingIntroSuggestions({ people, collections }), { authors: [], members: [], collections: [] });
  const markup = followingIntroMarkup({ people, collections, preview: true });
  assert.doesNotMatch(markup, /data-intro-(?:person|collection)-follow=/);
  assert.match(markup, /following all the authors/);
  assert.match(markup, /following all the community members/);
  assert.match(markup, /following all the collections/);
});
