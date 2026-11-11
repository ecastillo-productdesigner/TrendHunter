import { RESULT_STATE_KEY, RESULT_CATALOG, readPredictionResults, markPredictionResultSeen } from './prediction-result-state.js?v=3';
import { escapeText as esc } from './story-card.js';
import { medalBurst } from './badge-celebration.js?v=4';
import { closeBadgeDialog } from './badge-dialog-motion.js';
import { predictionResultContent, resolvedPredictionRow } from './prediction-result-card.js?v=outcome-4';
const records=()=>{try{return readPredictionResults(localStorage);}catch{return [];}};
const signedIn=()=>window.isSignedIn?.()===true;
const destination=id=>`userprofile.html?prediction-filter=resolved&result=${encodeURIComponent(id)}#predictions`;
let dialog, currentId, trigger, flipping = false, flipAnimation, flipVersion = 0;
let pendingCelebration, clearConfetti = () => {};
const mobileNavigation = matchMedia('(max-width: 959px)');
window.predictionResultHistory=()=>signedIn()?records():[];
function revealMarkup(result) {
  const all = records(), index = all.findIndex(item => item.id === result.id);
  return `<section class="prediction-outcome-reveal" tabindex="-1">
    <button class="prediction-outcome-close" type="button" data-result-close aria-label="Close prediction result"><span class="drawer-close-icon" aria-hidden="true"></span></button>
    ${predictionResultContent(result)}
    <footer class="prediction-outcome-card-footer"><button type="button" data-result-previous aria-label="Previous prediction" ${index===0?'hidden disabled':''}><span class="prediction-outcome-nav-icon prediction-outcome-nav-icon--previous icon-arrow icon-arrow--left" aria-hidden="true"></span> Previous</button>${index===all.length-1 ? '<button type="button" data-result-close>Close</button>' : '<button type="button" data-result-next aria-label="Next prediction">Next <span class="prediction-outcome-nav-icon icon-arrow" aria-hidden="true"></span></button>'}</footer>
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
  dialog.querySelector('[data-result-previous]').hidden = index === 0;
  dialog.querySelector('[data-result-previous]').disabled = busy || index === 0;
  const next = dialog.querySelector('[data-result-next]');
  if (next) next.disabled = busy;
  dialog.querySelector('section').setAttribute('aria-busy', String(busy));
}
function dismissResult() {
  if (!dialog?.open) return;
  flipVersion++;
  flipAnimation?.cancel();
  flipping = false;
  pendingCelebration = null;
  clearConfetti();
  closeBadgeDialog(dialog);
}
function reveal(id,origin) {
  if (dialog?.dataset.closing) return;
  const result=records().find(item=>item.id===id);if(!result)return;
  clearConfetti();
  pendingCelebration = !result.seen && result.call === result.outcome ? id : null;
  currentId=id;trigger=origin;
  if(!dialog){
    dialog=document.createElement('dialog');dialog.className='prediction-outcome-dialog';document.body.append(dialog);
    dialog.setAttribute('aria-labelledby','prediction-outcome-heading');
    dialog.setAttribute('aria-describedby','prediction-outcome-question prediction-outcome-sample');
    dialog.addEventListener('animationend',event=>{if(event.target===dialog&&event.animationName==='badge-coin-reveal'&&!flipping)celebrateVisibleResult();});
    dialog.addEventListener('click',event=>{if(event.target===dialog||event.target.closest('[data-result-close]'))dismissResult();});
    dialog.addEventListener('cancel',event=>{event.preventDefault();dismissResult();});
    dialog.addEventListener('close',()=>{ flipVersion++; flipAnimation?.cancel(); flipping=false; pendingCelebration=null; clearConfetti(); const target=trigger?.isConnected?trigger:document.querySelector('.feed-navigation-tab[aria-selected="true"]');target?.focus({preventScroll:true}); });
  }
  dialog.innerHTML=revealMarkup(result);
  if(!dialog.open)dialog.showModal();
  dialog.querySelector('section').focus({preventScroll:true});
  // It is now visible. Clearing unread never removes the persistent result record.
  acknowledge(id);
}
async function flipResult(direction) {
  if (!dialog?.open || dialog.dataset.closing || flipping) return;
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
    if(available&&results.length&&!mobileNavigation.matches){
      const first=unread[0]||results[0];
      bolt.href=destination(first.id);
      bolt.dataset.resultReveal=first.id;
      bolt.setAttribute('aria-haspopup','dialog');
      bolt.setAttribute('aria-label',unread.length?`${unread.length} prediction results are in`:'View prediction results');
    }
    else {bolt.href='predictions.html';delete bolt.dataset.resultReveal;bolt.removeAttribute('aria-haspopup');bolt.setAttribute('aria-label',available&&unread.length?`Predict the Next Trend, ${unread.length} new result${unread.length===1?'':'s'}`:'Predict the Next Trend');}
  });
  const predictionPage = document.body.classList.contains('page-predictions');
  const list = document.querySelector('.page-feed .feed-tab-panel > .feed-list') || document.querySelector('.page-predictions .predictions-page');
  if (!list) return;
  // Both banners and the bolt dot represent unread results, not saved history.
  const alertResults = unread;
  let slot=list.querySelector('.prediction-results-alert-slot');
  if(!slot){slot=document.createElement(predictionPage ? 'div' : 'li');slot.className='prediction-results-alert-slot';list.prepend(slot);}
  slot.hidden=!available||!alertResults.length;
  if(!alertResults.length)return;
  list.prepend(slot);
  const signature = alertResults.map(result => result.id).join('|');
  if (slot.dataset.resultsSignature === signature) return;
  slot.dataset.resultsSignature = signature;
  // These records remain fictional prototype results; the reveal and analysis label them as samples.
  const singular = alertResults.length === 1;
  const sheetCount = Math.min(alertResults.length, 3);
  const sheets = Array.from({length: sheetCount}, (_, index) => `<span class="prediction-results-art-sheet">${index === sheetCount - 1 ? `<strong class="prediction-results-art-number">${alertResults.length}</strong><span class="prediction-results-art-label">Verified</span>` : ''}</span>`).join('');
  slot.innerHTML=`<section class="prediction-results-alert" aria-label="Prediction results, prototype sample"><div class="prediction-results-copy"><h2 class="trend-card-headline">${singular?'Your prediction result is in':`${alertResults.length} of your predictions have results`}</h2><button class="button-primary" type="button" data-result-reveal="${(unread[0] || alertResults[0]).id}">See ${singular?'result':'results'}</button></div><div class="prediction-results-art" aria-hidden="true">${sheets}</div></section>`;
}
document.addEventListener('click',event=>{
  const revealButton=event.target.closest('[data-result-reveal]');if(revealButton){
    if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||event.button>0)return;
    event.preventDefault();reveal(revealButton.dataset.resultReveal,revealButton);return;
  }
  if(event.target.closest('[data-result-next]')) flipResult(1);
  if(event.target.closest('[data-result-previous]')) flipResult(-1);
});
let focusedResult;
function renderPageResults() {
  if (!document.body.classList.contains('page-predictions')) return;
  // Results open from the top banner. Only their IDs are needed to keep resolved
  // predictions out of the live voting deck; the banner itself marks nothing read.
  window.setPredictionPageResults?.(records());
}
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
function refresh(){renderAlert();renderPageResults();document.dispatchEvent(new Event('prediction-results-ready'));requestAnimationFrame(watchProfileResults);}
mobileNavigation.addEventListener('change',renderAlert);
document.addEventListener('prediction-results-preview',refresh);
document.addEventListener('auth-change',refresh);
document.addEventListener('feed-view-selected',renderAlert);
document.addEventListener('profile-results-rendered',()=>requestAnimationFrame(watchProfileResults));
window.addEventListener('storage',event=>{if(event.key===RESULT_STATE_KEY)refresh();});
window.addEventListener('hashchange',()=>requestAnimationFrame(watchProfileResults));
redirectLegacyArticle();refresh();
