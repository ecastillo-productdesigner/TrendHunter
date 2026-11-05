import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {RESULT_STATE_KEY,RESULT_CATALOG,readPredictionResults,previewPredictionResults,markPredictionResultSeen} from '../site/prediction-result-state.js';
import {unnoticedPeopleUpdates,acknowledgePeopleUpdates,showPeopleUpdatesPreview,peoplePreviewPending} from '../site/people-update-state.js';
const memory=()=>{const values=new Map();return {getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value)};};
test('preview preserves actual call direction and acknowledging retains resolved history',()=>{
 const storage=memory();assert.deepEqual(readPredictionResults(storage),[]);
 previewPredictionResults(storage,{'retail-events':'out'});
 let records=readPredictionResults(storage);assert.equal(records.length,3);assert.equal(records[0].call,'out');assert.equal(records[0].outcome,'in');assert.equal(records[0].seen,false);
 assert.equal(markPredictionResultSeen(storage,'unknown'),false);
 assert.equal(markPredictionResultSeen(storage,'retail-events'),true);
 records=readPredictionResults(storage);assert.equal(records.length,3);assert.equal(records[0].seen,true);assert.equal(records[0].demoOutcome,true);
 previewPredictionResults(storage,{'retail-events':'out'});assert.equal(readPredictionResults(storage)[0].seen,false);
});
test('an older single-result preview upgrades to three without losing call direction or read status',()=>{
 const storage=memory();storage.setItem(RESULT_STATE_KEY,JSON.stringify({calls:{'retail-events':'out'},seen:['retail-events']}));
 const results=readPredictionResults(storage);
 assert.equal(results.length,3);assert.equal(results[0].call,'out');assert.equal(results[0].seen,true);
 assert.equal(markPredictionResultSeen(storage,'dollar-stores'),true);
 assert.equal(readPredictionResults(storage).find(result=>result.id==='dollar-stores').seen,true);
});
test('empty preview uses separate sample records and failed storage never claims success',()=>{
 const storage=memory();previewPredictionResults(storage);assert.equal(readPredictionResults(storage).length,3);assert.ok(readPredictionResults(storage).some(result=>result.call==='out'));
 assert.equal(previewPredictionResults({setItem(){throw Error('blocked');}}),false);
 assert.deepEqual(readPredictionResults({getItem(){return 'broken';}}),[]);
});
test('each outcome links to a complete fictional article with the normal page panels',async()=>{
 for(const result of RESULT_CATALOG){
  const page=await readFile(new URL('../site/'+result.articleHref,import.meta.url),'utf8');
  assert.match(page,/class="page-layout"/);
  assert.match(page,/class="rail-left rail-left--trend"/);
  assert.match(page,/class="rail-right"/);
  assert.match(page,/class="predictions-panel"/);
  assert.match(page,/src="answers\.js/);
  assert.match(page,/src="comments\.js/);
  assert.match(page,/More Stories/);
  assert.match(page,/Fictional prediction follow-up/);
  assert.doesNotMatch(page,/Read the original story|View your prediction results/);
  assert.match(page,/This article and its outcome are made up for the prototype/);
 }
});
test('Following acknowledges only followed releases; a later followed person adds updates',()=>{
 const storage=memory();assert.deepEqual(unnoticedPeopleUpdates(storage,[]),[]);
 assert.ok(unnoticedPeopleUpdates(storage,['daniel-reed']).length);
 acknowledgePeopleUpdates(storage,['daniel-reed']);assert.deepEqual(unnoticedPeopleUpdates(storage,['daniel-reed']),[]);
 assert.ok(unnoticedPeopleUpdates(storage,['daniel-reed','jamie-park']).length);
 showPeopleUpdatesPreview(storage);assert.equal(peoplePreviewPending(storage),true);
 acknowledgePeopleUpdates(storage,['daniel-reed']);assert.equal(peoplePreviewPending(storage),false);
});
