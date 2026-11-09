import test from 'node:test';
import assert from 'node:assert/strict';
import { PEOPLE_FOLLOW_KEY, readFollowing, setPersonFollowed, followingPeople, unfollowedCreators } from '../site/people-follow-state.js';
import { collectionFollowActivity, interleaveCollectionFollows } from '../site/people-collection-activity.js';
import { peopleReleaseIds, unnoticedPeopleUpdates, acknowledgePeopleUpdates, peopleActivityUpdates, markPeopleActivitySeen, showPeopleUpdatesPreview, peoplePreviewPending, PEOPLE_UPDATES_SEEN_KEY } from '../site/people-update-state.js';
import { peopleActivityItems } from '../site/people-activity-data.js';
import { PEOPLE } from '../site/people-data.js';
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

test('each visible activity clears only its own unread marker and captures a content snapshot', () => {
  const storage = memory(), ids = ['daniel-reed', 'jamie-park'];
  const items = peopleActivityItems(ids), original = unnoticedPeopleUpdates(storage, ids);
  const first = items.find(item => item.id === original[0]);
  assert.equal(markPeopleActivitySeen(storage, first, ids), true);
  assert.equal(peopleActivityUpdates(storage, ids).has(first.id), false);
  assert.deepEqual(unnoticedPeopleUpdates(storage, ids), original.slice(1));
  assert.deepEqual(JSON.parse(storage.getItem(PEOPLE_UPDATES_SEEN_KEY)).snapshots[first.id], first.snapshot);
});
test('a real revision to seen content yields an accurate Updated marker until seen again', () => {
  const storage = memory(), ids = ['daniel-reed'], item = peopleActivityItems(ids)[0];
  markPeopleActivitySeen(storage, item, ids);
  const revised = { ...item, snapshot: { ...item.snapshot, title: 'Revised headline' } };
  assert.deepEqual(peopleActivityUpdates(storage, ids, [revised]).get(item.id), { label: 'Updated', summary: 'Headline updated' });
  markPeopleActivitySeen(storage, revised, ids);
  assert.equal(peopleActivityUpdates(storage, ids, [revised]).has(item.id), false);
  const prediction = peopleActivityItems(['jamie-park']).find(item => item.type === 'prediction');
  markPeopleActivitySeen(storage, prediction, ['jamie-park']);
  const changedCall = { ...prediction, snapshot: { call: prediction.call === 'in' ? 'out' : 'in' } };
  assert.equal(peopleActivityUpdates(storage, ['jamie-park'], [changedCall]).get(prediction.id).summary, `Call changed to ${changedCall.snapshot.call === 'in' ? 'In' : 'Out'}`);
});
test('legacy acknowledgments survive migration and preview acknowledgments are individual', () => {
  const storage = memory(), ids = ['daniel-reed'];
  const items = peopleActivityItems(ids), releases = peopleReleaseIds(ids);
  storage.setItem(PEOPLE_UPDATES_SEEN_KEY, JSON.stringify(releases));
  assert.deepEqual(unnoticedPeopleUpdates(storage, ids), []);
  showPeopleUpdatesPreview(storage, ids);
  assert.equal(peoplePreviewPending(storage, ids), true);
  markPeopleActivitySeen(storage, items.find(item => item.id === releases[0]), ids);
  assert.ok(unnoticedPeopleUpdates(storage, ids).includes(releases[1]));
  acknowledgePeopleUpdates(storage, ids);
  assert.equal(peoplePreviewPending(storage, ids), false);
  assert.deepEqual(unnoticedPeopleUpdates(storage, []), []);
});
test('unread ids always belong to surfaced activity, including the three-follow cap', () => {
  const storage = memory(), ids = PEOPLE.map(person => person.id), items = peopleActivityItems(ids);
  assert.equal(items.filter(item => item.type === 'collection-follow').length, 3);
  const displayed = new Set(items.map(item => item.id));
  assert.ok(unnoticedPeopleUpdates(storage, ids).every(id => displayed.has(id)));
  assert.ok(items.filter(item => item.type === 'collection-follow').every(item => item.person.kind === 'members'));
  assert.equal(markPeopleActivitySeen({getItem:()=>null,setItem(){throw Error('blocked');}}, items[0], ids), false);
});
