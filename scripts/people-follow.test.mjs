import test from 'node:test';
import assert from 'node:assert/strict';
import { PEOPLE_FOLLOW_KEY, readFollowing, setPersonFollowed, followingPeople } from '../site/people-follow-state.js';
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
