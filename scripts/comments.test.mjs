import test from 'node:test';
import assert from 'node:assert/strict';
import { createCommentStore, COMMENT_LIMIT, COMMENT_USER } from '../site/comments-state.js';

function fixture() {
  const values = new Map();
  let auth = false; let sequence = 0;
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  const store = createCommentStore({ storage, signedIn: () => auth, name: () => 'Reader <name>', now: () => '2026-11-04T16:00:00.000Z', id: () => `posted-${++sequence}` });
  return { store, storage, values, login: () => { auth = true; }, logout: () => { auth = false; } };
}
test('guests can read but every mutation rejects signed-out callers', () => {
  const { store } = fixture();
  assert.equal(store.read('a').length, 3);
  for (const call of [() => store.post('a', 'Hello'), () => store.edit('a', 'sample-0', 'change'), () => store.remove('a', 'sample-0'), () => store.like('a', 'sample-0'), () => store.report('a', 'sample-0')]) assert.throws(call, /AUTH_REQUIRED/);
});
test('posts trim text, preserve plain text and isolate articles', () => {
  const { store, login } = fixture(); login();
  const posted = store.post('a', '  <img src=x onerror=alert(1)>  ');
  assert.equal(posted.text, '<img src=x onerror=alert(1)>');
  assert.equal(posted.authorId, COMMENT_USER);
  assert.equal(store.read('a').length, 4); assert.equal(store.read('b').length, 3);
});
test('blank and oversized posts fail without writing', () => {
  const { store, login, values } = fixture(); login();
  for (const text of ['', ' \n ', 'a'.repeat(COMMENT_LIMIT + 1)]) assert.throws(() => store.post('a', text), /INVALID_TEXT/);
  assert.equal(values.size, 0);
  assert.equal(store.post('a', 'a'.repeat(COMMENT_LIMIT)).text.length, COMMENT_LIMIT);
});
test('replies are one level deep and retain parent identity', () => {
  const { store, login } = fixture(); login();
  const reply = store.post('a', 'A reply', 'sample-0');
  assert.equal(reply.parentId, 'sample-0');
  assert.throws(() => store.post('a', 'Too deep', reply.id), /INVALID_PARENT/);
  assert.throws(() => store.post('a', 'Missing', 'missing'), /NOT_FOUND/);
});
test('only the owner can edit or delete', () => {
  const { store, login } = fixture(); login();
  assert.throws(() => store.edit('a', 'sample-0', 'no'), /NOT_ALLOWED/);
  assert.throws(() => store.remove('a', 'sample-0'), /NOT_ALLOWED/);
  const posted = store.post('a', 'Original'); store.edit('a', posted.id, 'Edited');
  assert.equal(store.read('a').find(item => item.id === posted.id).text, 'Edited');
  store.remove('a', posted.id); assert.equal(store.read('a').length, 3);
});
test('deleting a parent keeps replies and prevents further replies or reactions', () => {
  const { store, login } = fixture(); login();
  const parent = store.post('a', 'Parent'); const reply = store.post('a', 'Reply', parent.id);
  store.remove('a', parent.id);
  assert.equal(store.read('a').find(item => item.id === parent.id).deleted, true);
  assert.equal(store.read('a').find(item => item.id === reply.id).text, 'Reply');
  assert.throws(() => store.post('a', 'New reply', parent.id), /INVALID_PARENT/);
  assert.throws(() => store.like('a', parent.id), /NOT_ALLOWED/);
  store.remove('a', reply.id);
  assert.equal(store.read('a').length, 3, 'empty deleted threads disappear after their last reply is removed');
});
test('likes toggle; reporting is persisted and excludes own comments', () => {
  const { store, login } = fixture(); login();
  store.like('a', 'sample-0'); assert.equal(store.read('a')[0].liked, true);
  store.like('a', 'sample-0'); assert.equal(store.read('a')[0].liked, false);
  store.report('a', 'sample-0'); assert.equal(store.read('a')[0].reported, true);
  const posted = store.post('a', 'Own'); assert.throws(() => store.report('a', posted.id), /NOT_ALLOWED/);
});
test('signing out immediately blocks writes; existing discussion remains readable', () => {
  const { store, login, logout } = fixture(); login(); const posted = store.post('a', 'Own'); logout();
  assert.equal(store.read('a').length, 4);
  assert.throws(() => store.edit('a', posted.id, 'Changed'), /AUTH_REQUIRED/);
});
test('save failures surface without committing; corrupt data is never silently overwritten', () => {
  const { store, login, storage, values } = fixture(); login();
  storage.setItem = () => { throw new Error('quota'); };
  assert.throws(() => store.post('a', 'Keep draft'), /SAVE_FAILED/);
  assert.equal(store.read('a').length, 3);
  values.set('trendhunter.comments.v1:a', 'broken');
  assert.throws(() => store.post('a', 'No overwrite'), /READ_FAILED/);
  assert.equal(values.get('trendhunter.comments.v1:a'), 'broken');
});
