import test from 'node:test';
import assert from 'node:assert/strict';
import { ARTICLE_FEEDBACK_LIMIT, readArticleFeedback, saveArticleFeedback } from '../site/article-feedback-state.js';
const memory = () => { const data = new Map(); return { getItem:key => data.get(key) ?? null, setItem:(key,value) => data.set(key,value) }; };
test('article sentiment and optional details persist per story and can be changed or removed', () => {
  const storage = memory();
  assert.equal(readArticleFeedback(storage, 'trend.html'), null);
  saveArticleFeedback(storage, 'trend.html', {sentiment:'up', reasons:['Informative'], comment:' Clear explanation. '});
  assert.deepEqual(readArticleFeedback(storage, 'trend.html'), {sentiment:'up', reasons:['Informative'], comment:'Clear explanation.'});
  assert.equal(readArticleFeedback(storage, 'trend-skin-longevity.html'), null);
  saveArticleFeedback(storage, 'trend.html', {sentiment:'down', reasons:['Other'], comment:''});
  assert.equal(readArticleFeedback(storage, 'trend.html').sentiment, 'down');
  saveArticleFeedback(storage, 'trend.html', null);
  assert.equal(readArticleFeedback(storage, 'trend.html'), null);
});
test('only valid sentiment reasons persist, without duplicates; stored text stays plain text', () => {
  const storage = memory();
  const saved = saveArticleFeedback(storage, 'prediction-analysis-retailtainment.html', {sentiment:'up', reasons:['Informative','Informative','Factually incorrect','<script>'], comment:'<b>My feedback</b>'});
  assert.deepEqual(saved.reasons,['Informative']);
  assert.equal(saved.comment,'<b>My feedback</b>');
  for (const sentiment of ['toString', 'unknown', null]) assert.throws(() => saveArticleFeedback(storage,'trend.html',{sentiment}), /INVALID_FEEDBACK/);
  assert.throws(() => saveArticleFeedback(storage,'login.html',{sentiment:'up'}), /INVALID_STORY/);
  assert.throws(() => saveArticleFeedback(storage,'trend.html',{sentiment:'up',comment:'x'.repeat(ARTICLE_FEEDBACK_LIMIT+1)}), /INVALID_FEEDBACK/);
});
test('unavailable or malformed storage does not fake a successful write', () => {
  assert.equal(readArticleFeedback({getItem(){throw Error('unavailable');}},'trend.html'),null);
  assert.equal(readArticleFeedback({getItem:()=>'{bad'},'trend.html'),null);
  assert.throws(() => saveArticleFeedback({setItem(){throw Error('quota');}},'trend.html',{sentiment:'up'}), /quota/);
});
