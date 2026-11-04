import { MEMBER_BADGES, VERIFIED_PREDICTION_OUTCOMES } from './badge-catalog.js?v=4';
export const BADGE_STATE_KEY = 'trendhunter.member-achievements.v1';
const clean = values => Array.isArray(values) ? [...new Set(values.filter(value => typeof value === 'string'))] : [];
export function readBadgeState(storage) {
  try {
    const value = JSON.parse(storage.getItem(BADGE_STATE_KEY) || '{}');
    const badgeIds = new Set(MEMBER_BADGES.map(badge=>badge.id));
    const earned = value.earned && typeof value.earned === 'object' ? Object.fromEntries(Object.entries(value.earned).filter(([id])=>badgeIds.has(id))) : {};
    return { calls: value.calls && typeof value.calls === 'object' ? value.calls : {}, baselineCalls:value.baselineCalls && typeof value.baselineCalls === 'object' ? value.baselineCalls : {}, callDays:clean(value.callDays), readStories:clean(value.readStories), savedSignals:clean(value.savedSignals), baselineSavedSignals:clean(value.baselineSavedSignals), earned, hidden:clean(value.hidden).filter(id=>badgeIds.has(id)) };
  } catch { return { calls:{}, baselineCalls:{}, callDays:[], readStories:[], savedSignals:[], baselineSavedSignals:[], earned:{}, hidden:[] }; }
}
export function resetBadgeProgress(storage, previousCalls = {}, savedSignals = []) {
  const previous = readBadgeState(storage);
  const baselineCalls = Object.fromEntries(Object.entries({...previous.baselineCalls,...previous.calls,...previousCalls}).filter(([,call])=>['in','out'].includes(call)));
  const baselineSavedSignals = clean([...previous.baselineSavedSignals,...previous.savedSignals,...savedSignals]);
  try { storage.setItem(BADGE_STATE_KEY,JSON.stringify({calls:{},baselineCalls,callDays:[],readStories:[],savedSignals:[],baselineSavedSignals,earned:{},hidden:[]})); return true; }
  catch { return false; }
}
export function badgeProgress(state, outcomes = VERIFIED_PREDICTION_OUTCOMES) {
  return { calls:Object.values(state.calls).filter(call => ['in','out'].includes(call)).length, callDays:state.callDays.length, completedReads:state.readStories.length, savedSignals:state.savedSignals.length, correctCalls:Object.entries(state.calls).filter(([id,call]) => outcomes[id]?.verified === true && outcomes[id].result === call).length };
}
export function recordBadgeActivity(storage, activity, day, outcomes = VERIFIED_PREDICTION_OUTCOMES) {
  const state = readBadgeState(storage);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  if (activity.type === 'call' && activity.id && ['in','out'].includes(activity.call)) { state.calls[activity.id] = activity.call; state.callDays = [...new Set([...state.callDays,day])]; }
  if (activity.type === 'read' && typeof activity.story === 'string' && activity.story) state.readStories = clean([...state.readStories,activity.story]);
  if (activity.type === 'save' && typeof activity.story === 'string' && activity.story && !state.baselineSavedSignals.includes(activity.story)) state.savedSignals = clean([...state.savedSignals,activity.story]);
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
