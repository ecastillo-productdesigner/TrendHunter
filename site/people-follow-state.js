import { PEOPLE } from './people-data.js';
export const PEOPLE_FOLLOW_KEY = 'trendhunter.followed-people.v1';
export const PEOPLE_FOLLOW_INTENT = 'trendhunter.pending-person-follow';
const known = new Set(PEOPLE.map(person => person.id));
export function readFollowing(storage) {
  try {
    const saved = JSON.parse(storage.getItem(PEOPLE_FOLLOW_KEY) || '[]');
    return Array.isArray(saved) ? [...new Set(saved.filter(id => known.has(id)))] : [];
  } catch { return []; }
}
export function setPersonFollowed(storage, id, following) {
  if (!known.has(id)) return null;
  const before = readFollowing(storage);
  const next = following ? [...new Set([...before, id])] : before.filter(value => value !== id);
  try { storage.setItem(PEOPLE_FOLLOW_KEY, JSON.stringify(next)); return next; } catch { return null; }
}
export function followingPeople(ids, kind = 'all') {
  return ids.map(id => PEOPLE.find(person => person.id === id)).filter(person => person && (kind === 'all' || person.kind === kind));
}
