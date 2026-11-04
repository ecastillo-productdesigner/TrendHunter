import { MEMBER_BADGES, VERIFIED_PREDICTION_OUTCOMES } from './badge-catalog.js';
export const BADGE_STATE_KEY = 'trendhunter.member-achievements.v1';
const clean = values => Array.isArray(values) ? [...new Set(values.filter(value => typeof value === 'string'))] : [];
export function readBadgeState(storage) {
  try {
    const value = JSON.parse(storage.getItem(BADGE_STATE_KEY) || '{}');
    return { calls: value.calls && typeof value.calls === 'object' ? value.calls : {}, callDays:clean(value.callDays), collections:clean(value.collections), updateDays:clean(value.updateDays), earned:value.earned && typeof value.earned === 'object' ? value.earned : {}, hidden:clean(value.hidden) };
  } catch { return { calls:{}, callDays:[], collections:[], updateDays:[], earned:{}, hidden:[] }; }
}
export function badgeProgress(state, outcomes = VERIFIED_PREDICTION_OUTCOMES) {
  return { calls:Object.values(state.calls).filter(call => ['in','out'].includes(call)).length, callDays:state.callDays.length, collections:state.collections.length, updateDays:state.updateDays.length, correctCalls:Object.entries(state.calls).filter(([id,call]) => outcomes[id]?.verified === true && outcomes[id].result === call).length };
}
export function recordBadgeActivity(storage, activity, day, outcomes = VERIFIED_PREDICTION_OUTCOMES) {
  const state = readBadgeState(storage);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  if (activity.type === 'call' && activity.id && ['in','out'].includes(activity.call)) { state.calls[activity.id] = activity.call; state.callDays = [...new Set([...state.callDays,day])]; }
  if (activity.type === 'read' && activity.collection) state.collections = [...new Set([...state.collections,activity.collection])];
  if (activity.type === 'update') state.updateDays = [...new Set([...state.updateDays,day])];
  const progress = badgeProgress(state,outcomes);
  const newlyEarned = [];
  for (const badge of MEMBER_BADGES) if (!state.earned[badge.id] && progress[badge.metric] >= badge.goal) { state.earned[badge.id] = day; newlyEarned.push(badge.id); }
  try { storage.setItem(BADGE_STATE_KEY,JSON.stringify(state)); return { state,newlyEarned }; } catch { return null; }
}
export function setBadgeVisible(storage, id, visible) {
  if (!MEMBER_BADGES.some(badge => badge.id === id)) return false;
  const state = readBadgeState(storage);
  state.hidden = visible ? state.hidden.filter(value => value !== id) : [...new Set([...state.hidden,id])];
  try { storage.setItem(BADGE_STATE_KEY,JSON.stringify(state)); return true; } catch { return false; }
}
