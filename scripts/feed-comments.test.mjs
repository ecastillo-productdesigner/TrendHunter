import test from 'node:test';
import assert from 'node:assert/strict';
import { pickFeedComments, feedCommentsMarkup } from '../site/feed-comments.js';
import { sampleComments } from '../site/comments-state.js';

const stories = Array.from({length:8}, (_,i)=>({href:`trend-${i}.html`,title:`Story ${i}`,image:'assets/feed/trend-05.png'}));
test('samples three distinct stories and avoids repeated fixture quotes and authors',()=>{
  const selected=pickFeedComments([...stories,stories[0]],sampleComments,{random:()=>0});
  assert.equal(selected.length,3);
  assert.equal(new Set(selected.map(p=>p.story.href)).size,3);
  assert.equal(new Set(selected.map(p=>p.comment.text)).size,3);
  assert.equal(new Set(selected.map(p=>p.comment.authorId)).size,3);
});
test('randomization can select different stories on another feed visit',()=>{
  const first=pickFeedComments(stories,sampleComments,{random:()=>0});
  const next=pickFeedComments(stories,sampleComments,{random:()=>0.99});
  assert.equal(next.length,3);
  assert.notDeepEqual(next.map(p=>p.story.href),first.map(p=>p.story.href));
});
test('uses each story’s stored discussion, filters ineligible quotes and includes replies in counts',()=>{
  const read=href=>{
    if(href!=='trend-0.html')return [];
    const samples=sampleComments(href);
    samples[0].deleted=true;samples[1].reported=true;
    return [...samples,{...samples[2],id:'reply',parentId:samples[2].id,text:'A reply'}];
  };
  const selected=pickFeedComments(stories,read,{random:()=>0});
  assert.equal(selected.length,1);
  assert.equal(selected[0].story.href,'trend-0.html');
  assert.equal(selected[0].comment.id,'sample-2');
  assert.equal(selected[0].count,3);
});
test('unreadable, empty and deleted discussions do not create invented previews',()=>{
  assert.deepEqual(pickFeedComments(stories,()=>{throw Error('READ_FAILED')}),[]);
  assert.deepEqual(pickFeedComments(stories,()=>[]),[]);
  assert.deepEqual(pickFeedComments(stories,href=>sampleComments(href).map(c=>({...c,deleted:true}))),[]);
});
test('supports a smaller available pool without duplicating rows',()=>{
  assert.equal(pickFeedComments(stories.slice(0,1),sampleComments).length,1);
});
test('links the thumbnail, headline, count and action to the matching discussion, without arrows',()=>{
  const selected=pickFeedComments(stories,sampleComments,{random:()=>0});
  const markup=feedCommentsMarkup(selected);
  for(const {story} of selected)assert.equal(markup.split(`href="${story.href}#comments"`).length-1,4);
  assert.equal(markup.match(/Join the conversation/g).length,3);
  assert.doesNotMatch(markup,/icon-arrow|arrow_forward|arrow-up|↗|→/);
});
test('escapes comment text and identity; never trusts an arbitrary stored profile or avatar URL',()=>{
  const comment={...sampleComments('a')[0],authorId:'unknown',name:'<b>Reader</b>',text:'<img src=x onerror=alert(1)>',profile:'javascript:alert(1)',avatar:'bad'};
  const markup=feedCommentsMarkup([{story:stories[0],comment,count:1}]);
  assert.match(markup,/&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.match(markup,/&lt;b&gt;Reader&lt;\/b&gt;/);
  assert.match(markup,/>1 comment<\/a>/);
  assert.doesNotMatch(markup,/javascript:|src="bad"/);
});
