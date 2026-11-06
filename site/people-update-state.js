import { PEOPLE } from './people-data.js';
import { COLLECTION_STORIES } from './collection-story-data.js';
import { collectionFollowActivity } from './people-collection-activity.js?v=2';
// Fixed illustrative releases, separate from live publication and the visitor's votes.
export const PEOPLE_UPDATES_SEEN_KEY = 'trendhunter.people-updates-seen.v1';
export const PEOPLE_UPDATES_PREVIEW_KEY = 'trendhunter.people-updates-preview.v1';
export function peopleReleaseIds(followed) {
  return PEOPLE.filter(person => followed.includes(person.id)).flatMap(person => {
    const releases = person.kind === 'creators'
      ? COLLECTION_STORIES.filter(story => story.authorId === person.id).slice(0,2).map(story => `${person.id}:${story.href}`)
      : Object.keys(person.calls || {}).slice(0,1).map(id => `${person.id}:${id}`);
    const follow = collectionFollowActivity(person.id);
    return follow ? [follow.id, ...releases] : releases;
  });
}
export function unnoticedPeopleUpdates(storage, followed) {
  let seen = []; try { const saved=JSON.parse(storage.getItem(PEOPLE_UPDATES_SEEN_KEY) || '[]'); if(Array.isArray(saved)) seen=saved; } catch {}
  return peopleReleaseIds(followed).filter(id=>!seen.includes(id));
}
export function peoplePreviewPending(storage) { try {return storage.getItem(PEOPLE_UPDATES_PREVIEW_KEY)==='true';}catch{return false;} }
export function showPeopleUpdatesPreview(storage) { try {storage.setItem(PEOPLE_UPDATES_PREVIEW_KEY,'true');return true;}catch{return false;} }
export function acknowledgePeopleUpdates(storage, followed) {
  try {
    let previous=[]; try {previous=JSON.parse(storage.getItem(PEOPLE_UPDATES_SEEN_KEY)||'[]');}catch{}
    storage.setItem(PEOPLE_UPDATES_SEEN_KEY,JSON.stringify([...new Set([...(Array.isArray(previous)?previous:[]),...peopleReleaseIds(followed)])]));
    storage.setItem(PEOPLE_UPDATES_PREVIEW_KEY,'false'); return true;
  }catch{return false;}
}
