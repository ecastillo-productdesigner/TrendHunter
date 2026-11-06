import test from 'node:test';
import assert from 'node:assert/strict';
import { PEOPLE_FOLLOW_KEY, readFollowing, setPersonFollowed, followingPeople, unfollowedCreators } from '../site/people-follow-state.js';
import { collectionFollowActivity, interleaveCollectionFollows } from '../site/people-collection-activity.js';
import { peopleReleaseIds, unnoticedPeopleUpdates, acknowledgePeopleUpdates } from '../site/people-update-state.js';
import { editorialStoryCard } from '../site/story-card.js';
const memory = () => { const entries = new Map(); return { getItem:key=>entries.get(key) || null, setItem:(key,value)=>entries.set(key,value) }; };
test('people follow persists, supports creators and members, and unfollow is reversible', () => {
  const storage = memory();
  assert.deepEqual(setPersonFollowed(storage,'daniel-reed',true),['daniel-reed']);
  setPersonFollowed(storage,'jamie-park',true); setPersonFollowed(storage,'daniel-reed',true);
  assert.equal(readFollowing(storage).length,2);
  assert.deepEqual(followingPeople(readFollowing(storage),'creators').map(p=>p.id),['daniel-reed']);
  assert.deepEqual(followingPeople(readFollowing(storage),'members').map(p=>p.id),['jamie-park']);
  setPersonFollowed(storage,'daniel-reed',false); assert.deepEqual(readFollowing(storage),['jamie-park']);
  setPersonFollowed(storage,'daniel-reed',true); assert.equal(readFollowing(storage).length,2);
});
test('invalid identities and failed writes do not create follows', () => {
  const storage = memory(); storage.setItem(PEOPLE_FOLLOW_KEY,'["unknown",null,"jamie-park","jamie-park"]');
  assert.deepEqual(readFollowing(storage),['jamie-park']); assert.equal(setPersonFollowed(storage,'unknown',true),null);
  assert.equal(setPersonFollowed({getItem:()=>null,setItem(){throw Error('blocked');}},'daniel-reed',true),null);
});

test('public collection follows belong to followed people and acknowledge with the other updates', () => {
  const storage = memory();
  const ids = ['nadia-patel', 'jamie-park', 'alex-rivera'];
  for (const person of followingPeople(ids, 'members')) {
    const activity = collectionFollowActivity(person.id);
    assert.ok(peopleReleaseIds(ids).includes(activity.id));
    assert.ok(unnoticedPeopleUpdates(storage, ids).includes(activity.id));
  }
  assert.equal(collectionFollowActivity('nadia-patel'), null);
  assert.ok(!peopleReleaseIds(['nadia-patel']).some(id => id.includes(':followed:')));
  assert.equal(collectionFollowActivity('unknown'), null);
  assert.deepEqual(peopleReleaseIds([]), []);
  acknowledgePeopleUpdates(storage, ids);
  assert.deepEqual(unnoticedPeopleUpdates(storage, ids), []);
  assert.ok(unnoticedPeopleUpdates(storage, [...ids, 'morgan-lee']).includes(collectionFollowActivity('morgan-lee').id));
});

test('creator activity links only the name, keeping the action description as plain text', () => {
  const html = editorialStoryCard({title:'Story',author:'Nadia Patel',authorId:'nadia-patel'}, {name:'Collection',direction:'rising',percentage:22}, {contextName:'Nadia',context:'published a new story',contextHref:'contributor-nadia-patel.html'});
  assert.match(html, /<a href="contributor-nadia-patel.html">Nadia<\/a> published a new story<\/p>/);
  assert.doesNotMatch(html, />Nadia published a new story<\/a>/);
});

test('collection follows are capped at three and separated by other activity', () => {
  const primary = Array.from({length: 16}, (_, index) => `story-${index}`);
  const follows = ['follow-a', 'follow-b', 'follow-c', 'follow-d'];
  const rows = interleaveCollectionFollows(primary, follows);
  assert.deepEqual(rows.filter(row => row.startsWith('follow')), follows.slice(0,3));
  const positions = rows.flatMap((row,index) => row.startsWith('follow') ? [index] : []);
  assert.deepEqual(positions, [2,7,12]);
  assert.deepEqual(rows.filter(row => row.startsWith('story')), primary);
  assert.deepEqual(interleaveCollectionFollows([],follows), ['follow-a']);
  assert.deepEqual(interleaveCollectionFollows(['story'],follows), ['story','follow-a']);
});


test('Who to Follow excludes followed writers, fills available alternatives, and empties when exhausted', () => {
  const initial = unfollowedCreators([]);
  assert.equal(initial.length, 6);
  assert.ok(initial.every(person => person?.kind === 'creators'));
  const next = unfollowedCreators(initial.slice(0, 2).map(person => person.id));
  assert.ok(next.every(person => person.kind === 'creators' && !initial.slice(0, 2).some(followed => followed.id === person.id)));
  const all = unfollowedCreators([], 100);
  assert.equal(new Set(all.map(person => person.id)).size, all.length);
  assert.deepEqual(unfollowedCreators(all.map(person => person.id)), []);
});
