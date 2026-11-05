import { RESULT_STATE_KEY, RESULT_CATALOG, readPredictionResults, markPredictionResultSeen } from './prediction-result-state.js';
import { escapeText as esc } from './story-card.js';
const records=()=>{try{return readPredictionResults(localStorage);}catch{return [];}};
const signedIn=()=>window.isSignedIn?.()===true;
const destination=id=>`userprofile.html?prediction-filter=resolved&result=${encodeURIComponent(id)}#predictions`;
let dialog, currentId, trigger;
window.predictionResultHistory=()=>signedIn()?records():[];
const resultMarkup=result=>`<p class="prediction-outcome-source">Editorial outcome · prototype sample</p><p class="prediction-result-headline">${esc(result.text)}</p><div class="prediction-outcome-comparison"><span>Your call: ${result.call.toUpperCase()}</span><span>Called: ${result.outcome.toUpperCase()}</span></div><h3 class="type-card-headline">${result.call===result.outcome?'You called it':'Your call was different'}</h3><p class="prediction-outcome-summary">${esc(result.summary)}</p><p class="prediction-outcome-date">Called November 4, 2026</p><a class="prediction-outcome-article" href="${result.articleHref}">Why this trend was called →</a>`;
window.predictionOutcomeRow=result=>`<li class="prediction-result prediction-result--outcome" data-id="${result.id}" data-result-status="resolved" tabindex="-1">${resultMarkup(result)}<button class="comments-text-button" type="button" data-result-reveal="${result.id}">View result</button></li>`;
function acknowledge(id) {
  markPredictionResultSeen(localStorage,id); renderAlert();
}
function reveal(id,origin) {
  const result=records().find(item=>item.id===id);if(!result)return;
  currentId=id;trigger=origin;
  if(!dialog){
    dialog=document.createElement('dialog');dialog.className='prediction-outcome-dialog';document.body.append(dialog);
    dialog.setAttribute('aria-label','Prediction result');
    dialog.addEventListener('click',event=>{if(event.target===dialog||event.target.closest('[data-result-close]'))dialog.close();});
    dialog.addEventListener('close',()=>{ const target=trigger?.isConnected?trigger:document.querySelector('.feed-navigation-tab[aria-selected="true"]');target?.focus({preventScroll:true}); });
  }
  dialog.innerHTML=`<section class="prediction-outcome-reveal" tabindex="-1"><button class="auth-close" type="button" data-result-close aria-label="Close prediction result"><span class="drawer-close-icon" aria-hidden="true"></span></button>${resultMarkup(result)}<div class="prediction-outcome-actions"><a class="button-primary" data-result-profile href="${destination(id)}">View results</a>${records().length>1?'<button class="comments-text-button" type="button" data-result-next>Next result →</button>':''}</div></section>`;
  if(!dialog.open)dialog.showModal();
  dialog.querySelector('section').focus({preventScroll:true});
  // It is now visible. Clearing unread never removes the persistent result record.
  acknowledge(id);
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
  if(event.target.closest('[data-result-next]')){const all=records(),next=all[(all.findIndex(item=>item.id===currentId)+1)%all.length];reveal(next.id,trigger);}
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
function renderOutcomeArticle(){
  const body=document.querySelector('[data-outcome-article]');if(!body)return;
  const id=new URLSearchParams(location.search).get('prediction');
  const record=RESULT_CATALOG.find(item=>item.id===id)||RESULT_CATALOG[0];
  document.title=`Why this trend was called · ${record.text}`;
  body.innerHTML=`<p class="prediction-outcome-source">Fictional prototype follow-up · not a live verified outcome</p><h1 class="article-title">Why this trend was called: ${esc(record.text)}</h1><p class="prediction-outcome-comparison">Editorial call: ${record.outcome.toUpperCase()} · November 4, 2026</p><div class="article-body"><h2>What happened</h2><p>${esc(record.summary)}</p><h2>Why the call was made</h2><p>${esc(record.rationale)}</p><h2>How it is developing</h2><p>${esc(record.followUp)}</p><h2>Evidence and next review</h2><p>This is a demonstration of the editorial result journey. In production, this section will contain dated source links, the original resolution criteria, the editor’s decision and the next review date. Community vote percentages are not evidence of an outcome.</p><a href="${record.storyHref}">Read the original story →</a></div><a class="prediction-outcome-article" href="${destination(record.id)}">View your prediction results →</a>`;
}
function refresh(){renderAlert();document.dispatchEvent(new Event('prediction-results-ready'));requestAnimationFrame(watchProfileResults);}
document.addEventListener('prediction-results-preview',refresh);
document.addEventListener('auth-change',refresh);
document.addEventListener('feed-view-selected',renderAlert);
document.addEventListener('profile-results-rendered',()=>requestAnimationFrame(watchProfileResults));
window.addEventListener('storage',event=>{if(event.key===RESULT_STATE_KEY)refresh();});
window.addEventListener('hashchange',()=>requestAnimationFrame(watchProfileResults));
renderOutcomeArticle();refresh();
