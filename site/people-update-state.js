import { peopleActivityItems } from './people-activity-data.js';
import { readFollowing } from './people-follow-state.js?v=2';
// Fixed illustrative releases, separate from live publication and the visitor's votes.
export const PEOPLE_UPDATES_SEEN_KEY = 'trendhunter.people-updates-seen.v1';
export const PEOPLE_UPDATES_PREVIEW_KEY = 'trendhunter.people-updates-preview.v1';

function readSeen(storage) {
  try {
    const saved = JSON.parse(storage.getItem(PEOPLE_UPDATES_SEEN_KEY) || '[]');
    // Preserve acknowledgments made before per-card snapshots were introduced.
    if (Array.isArray(saved)) return { seen: saved.filter(id => typeof id === 'string'), snapshots: {}, previewSeen: {} };
    if (saved && Array.isArray(saved.seen)) return { seen: saved.seen.filter(id => typeof id === 'string'), snapshots: saved.snapshots && typeof saved.snapshots === 'object' ? saved.snapshots : {}, previewSeen: saved.previewSeen && typeof saved.previewSeen === 'object' ? saved.previewSeen : {} };
  } catch {}
  return { seen: [], snapshots: {}, previewSeen: {} };
}
function readPreview(storage, followed) {
  try {
    const saved = JSON.parse(storage.getItem(PEOPLE_UPDATES_PREVIEW_KEY) || 'false');
    if (saved === true) return { generation: 0, ids: peopleReleaseIds(followed) };
    if (saved && Array.isArray(saved.ids) && Number.isFinite(saved.generation)) return saved;
  } catch {}
  return { generation: 0, ids: [] };
}
export function peopleReleaseIds(followed) {
  return peopleActivityItems(followed).filter(item => item.notify).map(item => item.id);
}
function changeSummary(previous, current) {
  if (previous.call !== current.call) return `Call changed to ${current.call === 'in' ? 'In' : 'Out'}`;
  if (previous.title !== current.title) return 'Headline updated';
  if (previous.image !== current.image) return 'Story image updated';
  return 'Collection details updated';
}
export function peopleActivityUpdates(storage, followed, items = peopleActivityItems(followed)) {
  const saved = readSeen(storage), preview = readPreview(storage, followed);
  return new Map(items.flatMap(item => {
    const previous = saved.snapshots[item.id];
    if (previous && JSON.stringify(previous) !== JSON.stringify(item.snapshot)) {
      return [[item.id, { label: 'Updated', summary: changeSummary(previous, item.snapshot) }]];
    }
    const replayed = preview.ids.includes(item.id) && saved.previewSeen[item.id] !== preview.generation;
    return (!saved.seen.includes(item.id) && item.notify) || replayed ? [[item.id, { label: 'New', summary: '' }]] : [];
  }));
}
export function unnoticedPeopleUpdates(storage, followed) {
  return [...peopleActivityUpdates(storage, followed).keys()];
}
export function peoplePreviewPending(storage, followed = readFollowing(storage)) {
  const preview = readPreview(storage, followed), saved = readSeen(storage);
  return peopleReleaseIds(followed).some(id => preview.ids.includes(id) && saved.previewSeen[id] !== preview.generation);
}
export function showPeopleUpdatesPreview(storage, followed = readFollowing(storage)) {
  try {
    const previous = readPreview(storage, followed);
    storage.setItem(PEOPLE_UPDATES_PREVIEW_KEY, JSON.stringify({ generation: previous.generation + 1, ids: peopleReleaseIds(followed) }));
    return true;
  } catch { return false; }
}
export function markPeopleActivitySeen(storage, item, followed) {
  try {
    const previous = readSeen(storage), preview = readPreview(storage, followed);
    // A single write persists the individual acknowledgment and content snapshot.
    storage.setItem(PEOPLE_UPDATES_SEEN_KEY, JSON.stringify({
      seen: [...new Set([...previous.seen, item.id])],
      snapshots: { ...previous.snapshots, [item.id]: item.snapshot },
      previewSeen: preview.ids.includes(item.id) ? { ...previous.previewSeen, [item.id]: preview.generation } : previous.previewSeen,
    }));
    return true;
  } catch { return false; }
}
// Retained for migration/tests; opening a tab no longer calls this bulk helper.
export function acknowledgePeopleUpdates(storage, followed) {
  return peopleActivityItems(followed).every(item => markPeopleActivitySeen(storage, item, followed));
}
