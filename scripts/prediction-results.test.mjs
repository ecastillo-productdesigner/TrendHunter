import test from 'node:test';
import assert from 'node:assert/strict';
import {readPredictionResults,previewPredictionResults,markPredictionResultSeen} from '../site/prediction-result-state.js';
import {unnoticedPeopleUpdates,acknowledgePeopleUpdates,showPeopleUpdatesPreview,peoplePreviewPending} from '../site/people-update-state.js';
const memory=()=>{const values=new Map();return {getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value)};};
test('preview preserves actual call direction and acknowledging retains resolved history',()=>{
 const storage=memory();assert.deepEqual(readPredictionResults(storage),[]);
 previewPredictionResults(storage,{'retail-events':'out'});
 let records=readPredictionResults(storage);assert.equal(records.length,1);assert.equal(records[0].call,'out');assert.equal(records[0].outcome,'in');assert.equal(records[0].seen,false);
 assert.equal(markPredictionResultSeen(storage,'unknown'),false);
 assert.equal(markPredictionResultSeen(storage,'retail-events'),true);
 records=readPredictionResults(storage);assert.equal(records.length,1);assert.equal(records[0].seen,true);assert.equal(records[0].demoOutcome,true);
 previewPredictionResults(storage,{'retail-events':'out'});assert.equal(readPredictionResults(storage)[0].seen,false);
});
test('empty preview uses separate sample records and failed storage never claims success',()=>{
 const storage=memory();previewPredictionResults(storage);assert.equal(readPredictionResults(storage).length,3);
 assert.equal(previewPredictionResults({setItem(){throw Error('blocked');}}),false);
 assert.deepEqual(readPredictionResults({getItem(){return 'broken';}}),[]);
});
test('Following acknowledges only followed releases; a later followed person adds updates',()=>{
 const storage=memory();assert.deepEqual(unnoticedPeopleUpdates(storage,[]),[]);
 assert.ok(unnoticedPeopleUpdates(storage,['daniel-reed']).length);
 acknowledgePeopleUpdates(storage,['daniel-reed']);assert.deepEqual(unnoticedPeopleUpdates(storage,['daniel-reed']),[]);
 assert.ok(unnoticedPeopleUpdates(storage,['daniel-reed','jamie-park']).length);
 showPeopleUpdatesPreview(storage);assert.equal(peoplePreviewPending(storage),true);
 acknowledgePeopleUpdates(storage,['daniel-reed']);assert.equal(peoplePreviewPending(storage),false);
});
