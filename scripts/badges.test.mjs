import test from 'node:test';
import assert from 'node:assert/strict';
import { readBadgeState, recordBadgeActivity, badgeProgress, setBadgeVisible, resetBadgeProgress } from '../site/badge-state.js';
import { MEMBER_BADGES, currentMemberBadge } from '../site/badge-catalog.js';
import { accountMenuBadge } from '../site/account-menu.js';
import { readdir, readFile } from 'node:fs/promises';

test('every badge-enabled page loads all five symbol glyphs instead of displaying ligature text', async () => {
  const root = new URL('../site/',import.meta.url);
  for (const name of (await readdir(root)).filter(name=>name.endsWith('.html'))) {
    const page = await readFile(new URL(name,root),'utf8');
    if (!page.includes('src="badges.js')) continue;
    const names = new Set([...page.matchAll(/family=Material\+Symbols\+Outlined[^"\n]*?icon_names=([^&"]+)/g)].flatMap(match=>match[1].split(',')));
    for (const badge of MEMBER_BADGES) assert.ok(names.has(badge.icon),`${name} missing ${badge.icon}`);
  }
});
test('the current avatar medal is the most recently earned visible badge', () => {
  const earned = {'first-call':'2026-10-27','deep-diver':'2026-10-30'};
  assert.equal(currentMemberBadge(earned).id,'deep-diver');
  assert.equal(currentMemberBadge(earned,['deep-diver']).id,'first-call');
  assert.equal(currentMemberBadge({},[]),null);
  assert.equal(currentMemberBadge(earned,Object.keys(earned)),null);
});
test('account menu offers First Call only to new collectors and respects the worn badge', () => {
  assert.deepEqual(accountMenuBadge({ earned: {}, hidden: [] }), { badge: MEMBER_BADGES[0], earned: false });
  const state = { earned: { 'first-call': '2026-11-01', 'deep-diver': '2026-11-02' }, hidden: [] };
  assert.equal(accountMenuBadge(state).badge.id, 'deep-diver');
  assert.equal(accountMenuBadge(state).earned, true);
  state.hidden = ['deep-diver'];
  assert.equal(accountMenuBadge(state).badge.id, 'first-call');
  state.hidden.push('first-call');
  assert.equal(accountMenuBadge(state), null);
});
test('reset clears awards and progress while preserving old calls as a no-reaward baseline', () => {
  const storage=memory();
  recordBadgeActivity(storage,{type:'call',id:'old',call:'in'},'2026-11-01');
  assert.equal(resetBadgeProgress(storage,{other:'out'}),true);
  const reset=readBadgeState(storage);
  assert.deepEqual(reset.earned,{});
  assert.deepEqual(reset.calls,{});
  assert.deepEqual(reset.baselineCalls,{old:'in',other:'out'});
  assert.equal(recordBadgeActivity(storage,{type:'refresh'},'2026-11-03').newlyEarned.length,0);
  assert.deepEqual(recordBadgeActivity(storage,{type:'call',id:'new',call:'out'},'2026-11-03').newlyEarned,['first-call']);
  assert.equal(resetBadgeProgress({getItem:()=>null,setItem(){throw Error('Blocked');}}),false);
});
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
test('Deep Diver counts three distinct completed signals, not repeat reads or collection visits', () => {
  const storage=memory();
  recordBadgeActivity(storage,{type:'read',story:'one.html'},'2026-11-01');
  recordBadgeActivity(storage,{type:'read',story:'one.html'},'2026-11-02');
  recordBadgeActivity(storage,{type:'read',collection:'unidentified-visit'},'2026-11-02');
  recordBadgeActivity(storage,{type:'read',story:'two.html'},'2026-11-02');
  assert.equal(badgeProgress(readBadgeState(storage)).completedReads,2);
  assert.equal(readBadgeState(storage).earned['deep-diver'],undefined);
  assert.deepEqual(recordBadgeActivity(storage,{type:'read',story:'three.html'},'2026-11-03').newlyEarned,['deep-diver']);
});
test('Field Notes counts five distinct saves, retains the award, and honors reset baselines', () => {
  const storage=memory();
  for(let i=0;i<4;i++) recordBadgeActivity(storage,{type:'save',story:`story${i}.html`},'2026-11-01');
  recordBadgeActivity(storage,{type:'save',story:'story0.html'},'2026-11-01');
  assert.equal(badgeProgress(readBadgeState(storage)).savedSignals,4);
  assert.equal(readBadgeState(storage).earned['field-notes'],undefined);
  assert.deepEqual(recordBadgeActivity(storage,{type:'save',story:'story4.html'},'2026-11-02').newlyEarned,['field-notes']);
  recordBadgeActivity(storage,{type:'refresh'},'2026-11-03');
  assert.equal(readBadgeState(storage).earned['field-notes'],'2026-11-02');
  resetBadgeProgress(storage,{},['preexisting.html']);
  recordBadgeActivity(storage,{type:'save',story:'story0.html'},'2026-11-03');
  recordBadgeActivity(storage,{type:'save',story:'preexisting.html'},'2026-11-03');
  assert.equal(badgeProgress(readBadgeState(storage)).savedSignals,0);
});
test('retired badge achievements do not carry over to the new requirements', () => {
  const storage=memory();
  storage.setItem('trendhunter.member-achievements.v1',JSON.stringify({earned:{'curious-mind':'2026-11-01','trend-tracker':'2026-11-01','first-call':'2026-11-01'},collections:['a','b','c','d','e']}));
  assert.deepEqual(readBadgeState(storage).earned,{'first-call':'2026-11-01'});
  assert.equal(badgeProgress(readBadgeState(storage)).completedReads,0);
});
test('accuracy only counts verified outcomes; samples and unverified results never award Sharp Eye', () => {
  const storage=memory(), outcomes={};
  for(let i=0;i<5;i++) { recordBadgeActivity(storage,{type:'call',id:`p${i}`,call:'in'},'2026-11-01'); outcomes[`p${i}`]={result:'in',verified:false}; }
  assert.equal(badgeProgress(readBadgeState(storage),outcomes).correctCalls,0);
  assert.equal(readBadgeState(storage).earned['sharp-eye'],undefined);
  outcomes.p0.verified=true; outcomes.p1.verified=true;
  recordBadgeActivity(storage,{type:'refresh'},'2026-11-02',outcomes);
  assert.equal(readBadgeState(storage).earned['sharp-eye'],undefined);
  outcomes.p2.verified=true;
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
