import { RESULT_STATE_KEY, RESULT_CATALOG, readPredictionResults, markPredictionResultSeen } from './prediction-result-state.js?v=2';
import { escapeText as esc } from './story-card.js';
import { medalBurst } from './badge-celebration.js?v=3';
import { predictionCallPanels, resolvedPredictionRow } from './prediction-result-card.js';
const records=()=>{try{return readPredictionResults(localStorage);}catch{return [];}};
const signedIn=()=>window.isSignedIn?.()===true;
const destination=id=>`userprofile.html?prediction-filter=resolved&result=${encodeURIComponent(id)}#predictions`;
let dialog, currentId, trigger, flipping = false, flipAnimation, flipVersion = 0;
let pendingCelebration, clearConfetti = () => {};
window.predictionResultHistory=()=>signedIn()?records():[];
function revealMarkup(result) {
  const all = records(), index = all.findIndex(item => item.id === result.id);
  return `<section class="prediction-outcome-reveal" tabindex="-1">
    <button class="prediction-outcome-close" type="button" data-result-close aria-label="Close prediction result"><span class="drawer-close-icon" aria-hidden="true"></span></button>
    <header class="prediction-outcome-card-header"><h2 id="prediction-outcome-heading">${result.call===result.outcome?'You called it':'Your call was different'}</h2></header>
    <h3 class="prediction-outcome-question" id="prediction-outcome-question">${esc(result.text)}</h3>
    ${predictionCallPanels(result)}
    <a class="button-primary prediction-outcome-analysis" href="${result.articleHref}">Read our analysis</a>
    <footer class="prediction-outcome-card-footer"><button type="button" data-result-previous aria-label="Previous prediction" ${index===0?'disabled':''}><span aria-hidden="true">←</span> Previous</button><button type="button" data-result-next aria-label="Next prediction" ${index===all.length-1?'disabled':''}>Next <span aria-hidden="true">→</span></button></footer>
    <p class="visually-hidden" id="prediction-outcome-sample">Fictional prototype prediction result, not a live verified outcome.</p>
  </section>`;
}
window.predictionOutcomeRow=resolvedPredictionRow;
function acknowledge(id) {
  markPredictionResultSeen(localStorage,id); renderAlert();
}
function celebrateVisibleResult() {
  if (!dialog?.open || pendingCelebration !== currentId || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  pendingCelebration = null;
  const burst = document.createElement('span');
  burst.className = 'prediction-result-confetti';
  burst.setAttribute('aria-hidden', 'true');
  dialog.append(burst);
  const stop = medalBurst(burst);
  clearConfetti = () => { stop(); burst.remove(); };
}
function setResultNavigationBusy(busy) {
  if (!dialog) return;
  const all = records(), index = all.findIndex(item => item.id === currentId);
  dialog.querySelector('[data-result-previous]').disabled = busy || index === 0;
  dialog.querySelector('[data-result-next]').disabled = busy || index === all.length - 1;
  dialog.querySelector('section').setAttribute('aria-busy', String(busy));
}
function reveal(id,origin) {
  const result=records().find(item=>item.id===id);if(!result)return;
  clearConfetti();
  pendingCelebration = !result.seen && result.call === result.outcome ? id : null;
  currentId=id;trigger=origin;
  if(!dialog){
    dialog=document.createElement('dialog');dialog.className='prediction-outcome-dialog';document.body.append(dialog);
    dialog.setAttribute('aria-labelledby','prediction-outcome-heading');
    dialog.setAttribute('aria-describedby','prediction-outcome-question prediction-outcome-sample');
    dialog.addEventListener('animationend',event=>{if(event.animationName==='badge-coin-reveal'&&!flipping)celebrateVisibleResult();});
    dialog.addEventListener('click',event=>{if(event.target===dialog||event.target.closest('[data-result-close]'))dialog.close();});
    dialog.addEventListener('close',()=>{ flipVersion++; flipAnimation?.cancel(); flipping=false; pendingCelebration=null; clearConfetti(); const target=trigger?.isConnected?trigger:document.querySelector('.feed-navigation-tab[aria-selected="true"]');target?.focus({preventScroll:true}); });
  }
  dialog.innerHTML=revealMarkup(result);
  if(!dialog.open)dialog.showModal();
  dialog.querySelector('section').focus({preventScroll:true});
  // It is now visible. Clearing unread never removes the persistent result record.
  acknowledge(id);
}
async function flipResult(direction) {
  if (!dialog?.open || flipping) return;
  const all = records(), index = all.findIndex(item => item.id === currentId);
  const next = all[index + direction];
  if (!next) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { reveal(next.id, trigger); return; }
  flipping = true;
  setResultNavigationBusy(true);
  const version = ++flipVersion;
  const duration = (parseFloat(getComputedStyle(dialog).getPropertyValue('--motion-card-flip')) || 600) / 2;
  try {
    flipAnimation = dialog.animate([{transform:'perspective(960px) rotateY(0)'},{transform:'perspective(960px) rotateY(90deg)'}], {duration,easing:'ease-in',fill:'forwards'});
    await flipAnimation.finished;
    if (!dialog.open || version !== flipVersion) return;
    const turn = flipAnimation;
    reveal(next.id, trigger);
    setResultNavigationBusy(true);
    flipAnimation = dialog.animate([{transform:'perspective(960px) rotateY(-90deg)'},{transform:'perspective(960px) rotateY(0)'}], {duration,easing:'ease-out'});
    turn.cancel();
    await flipAnimation.finished;
    if (dialog.open && version === flipVersion) celebrateVisibleResult();
  } catch { /* Dismissing during a turn cancels it without revealing another result. */ }
  finally { if (version === flipVersion) { flipAnimation = null; flipping = false; setResultNavigationBusy(false); } }
}
function renderAlert(){
  const results=records(),unread=results.filter(item=>!item.seen);
  const available=signedIn()||results.length>0; // Preview records are explicitly labeled sample data.
  document.querySelectorAll('.nav-predictions').forEach(bolt=>{
    let dot=bolt.querySelector('.prediction-results-dot');
    if(!dot){dot=document.createElement('span');dot.className='collection-updates-dot prediction-results-dot';dot.setAttribute('aria-hidden','true');bolt.append(dot);}
    dot.hidden=!available||!unread.length;
    if(available&&unread.length){bolt.href=destination(unread[0].id);bolt.setAttribute('aria-label',`${unread.length} prediction results are in`);}
    else {bolt.href='predictions.html';bolt.setAttribute('aria-label','Predict the Next Trend');}
  });
  const list=document.querySelector('.page-feed .feed-tab-panel > .feed-list');if(!list)return;
  let slot=list.querySelector('.prediction-results-alert-slot');
  if(!slot){slot=document.createElement('li');slot.className='prediction-results-alert-slot';list.prepend(slot);}
  slot.hidden=!available||!unread.length;
  if(!unread.length)return;
  // These records remain fictional prototype results; the reveal and analysis label them as samples.
  slot.innerHTML=`<section class="prediction-results-alert" aria-label="Prediction results, prototype sample"><div class="prediction-results-art" aria-hidden="true"><span class="prediction-results-art-card prediction-results-art-card--out"><span>?</span></span><span class="prediction-results-art-card prediction-results-art-card--in"><span>?</span></span></div><h2 class="trend-card-headline">${unread.length===1?'Your prediction results are in':`${unread.length} of your predictions have results`}</h2><button class="button-primary" type="button" data-result-reveal="${unread[0].id}">See ${unread.length===1?'result':'results'}</button></section>`;
  list.prepend(slot);
}
document.addEventListener('click',event=>{
  const revealButton=event.target.closest('[data-result-reveal]');if(revealButton){reveal(revealButton.dataset.resultReveal,revealButton);return;}
  if(event.target.closest('[data-result-next]')) flipResult(1);
  if(event.target.closest('[data-result-previous]')) flipResult(-1);
});
let focusedResult;
function watchProfileResults(){
  if(!document.querySelector('[data-people-manage]')||location.hash!=='#predictions')return;
  const requested=new URLSearchParams(location.search).get('result');
  const rows=[...document.querySelectorAll('.prediction-result--outcome')];
  const row=rows.find(item=>item.dataset.id===requested);
  if(row&&focusedResult!==requested){focusedResult=requested;row.scrollIntoView({block:'center'});row.focus({preventScroll:true});}
  if(!('IntersectionObserver'in window))return;
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting&&entry.intersectionRatio>=.5){acknowledge(entry.target.dataset.id);observer.unobserve(entry.target);}}),{threshold:.5});
  rows.forEach(row=>observer.observe(row));
}
function redirectLegacyArticle(){
  if (!document.querySelector('[data-outcome-article]')) return;
  const id = new URLSearchParams(location.search).get('prediction');
  const record = RESULT_CATALOG.find(item => item.id === id) || RESULT_CATALOG[0];
  location.replace(record.articleHref);
}
function refresh(){renderAlert();document.dispatchEvent(new Event('prediction-results-ready'));requestAnimationFrame(watchProfileResults);}
document.addEventListener('prediction-results-preview',refresh);
document.addEventListener('auth-change',refresh);
document.addEventListener('feed-view-selected',renderAlert);
document.addEventListener('profile-results-rendered',()=>requestAnimationFrame(watchProfileResults));
window.addEventListener('storage',event=>{if(event.key===RESULT_STATE_KEY)refresh();});
window.addEventListener('hashchange',()=>requestAnimationFrame(watchProfileResults));
redirectLegacyArticle();refresh();
