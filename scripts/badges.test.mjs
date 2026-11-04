import test from 'node:test';
import assert from 'node:assert/strict';
import { readBadgeState, recordBadgeActivity, badgeProgress, setBadgeVisible } from '../site/badge-state.js';
const memory = () => { const entries = new Map(); return { getItem:key=>entries.get(key)||null, setItem:(key,value)=>entries.set(key,value) }; };
test('first call awards once, and regular hunting requires five different call dates', () => {
  const storage = memory();
  const first = recordBadgeActivity(storage,{type:'call',id:'one',call:'in'},'2026-11-01');
  assert.deepEqual(first.newlyEarned,['first-call']);
  assert.deepEqual(recordBadgeActivity(storage,{type:'call',id:'two',call:'out'},'2026-11-01').newlyEarned,[]);
  assert.equal(readBadgeState(storage).callDays.length,1);
  for(let d=2;d<=5;d++) recordBadgeActivity(storage,{type:'call',id:`call${d}`,call:'in'},`2026-11-0${d}`);
  assert.equal(readBadgeState(storage).earned['regular-hunter'],'2026-11-05');
});
test('curiosity requires five distinct collections and tracking requires three distinct dates', () => {
  const storage=memory();
  for(let i=0;i<5;i++) recordBadgeActivity(storage,{type:'read',collection:`collection${i}`},'2026-11-01');
  recordBadgeActivity(storage,{type:'read',collection:'collection0'},'2026-11-02');
  assert.equal(badgeProgress(readBadgeState(storage)).collections,5);
  assert.equal(readBadgeState(storage).earned['curious-mind'],'2026-11-01');
  for(const day of ['2026-11-01','2026-11-01','2026-11-02','2026-11-03']) recordBadgeActivity(storage,{type:'update'},day);
  assert.equal(readBadgeState(storage).earned['trend-tracker'],'2026-11-03');
});
test('accuracy only counts verified outcomes; samples and unverified results never award Sharp Eye', () => {
  const storage=memory(), outcomes={};
  for(let i=0;i<5;i++) { recordBadgeActivity(storage,{type:'call',id:`p${i}`,call:'in'},'2026-11-01'); outcomes[`p${i}`]={result:'in',verified:false}; }
  assert.equal(badgeProgress(readBadgeState(storage),outcomes).correctCalls,0);
  assert.equal(readBadgeState(storage).earned['sharp-eye'],undefined);
  Object.values(outcomes).forEach(outcome=>outcome.verified=true);
  recordBadgeActivity(storage,{type:'refresh'},'2026-11-02',outcomes);
  assert.equal(readBadgeState(storage).earned['sharp-eye'],'2026-11-02');
});
test('owner visibility does not erase earned achievements', () => {
  const storage=memory();recordBadgeActivity(storage,{type:'call',id:'p',call:'in'},'2026-11-01');
  assert.equal(setBadgeVisible(storage,'first-call',false),true);
  assert.deepEqual(readBadgeState(storage).hidden,['first-call']);
  assert.equal(readBadgeState(storage).earned['first-call'],'2026-11-01');
  assert.equal(setBadgeVisible(storage,'first-call',true),true);assert.deepEqual(readBadgeState(storage).hidden,[]);
});
