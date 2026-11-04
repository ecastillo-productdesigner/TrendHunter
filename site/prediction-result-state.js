// Illustrative editorial outcome records. They are not live verified results and
// never count toward Sharp Eye. A production service must supply verified evidence.
export const RESULT_STATE_KEY = 'trendhunter.prediction-results-demo.v1';
export const RESULT_CATALOG = [
  { id:'retail-events', text:'Weekly events will become as important as new products for Gen Z stores', outcome:'in', storyHref:'trend-gen-z-stores.html', articleHref:'prediction-outcome.html?prediction=retail-events', calledOn:'2026-11-04', summary:'Recurring store events became part of the imagined retail calendar.', rationale:'In this fictional follow-up, stores kept repair workshops and styling sessions on the calendar after the initial launch. Repeat attendance and repeat scheduling would support an In call; a one-off event would not.', followUp:'Watch whether the events continue beyond the launch period and lead to repeat store visits.' },
  { id:'skin-longevity', text:'Skin longevity will replace anti-aging as beauty’s biggest promise', outcome:'in', storyHref:'trend-skin-longevity.html', articleHref:'prediction-outcome.html?prediction=skin-longevity', calledOn:'2026-11-04', summary:'Long-term skin health became the central promise in the fictional brand launches.', rationale:'This sample outcome imagines multiple brands consistently using long-term skin-health language across product launches and education. The editorial call would need documented, sustained evidence across brands, not one marketing claim.', followUp:'Track whether the language persists and whether the products deliver meaningful, measurable benefits.' },
  { id:'dollar-stores', text:'More shoppers will turn to dollar stores as cost of living rises', outcome:'out', storyHref:'trend-dollar-store-shoppers.html', articleHref:'prediction-outcome.html?prediction=dollar-stores', calledOn:'2026-11-04', summary:'The imagined increase in visits did not become a lasting shopping habit.', rationale:'In this fictional scenario, trial trips increased but repeat basket share did not. The original prediction concerned a lasting change in behavior, so short-term curiosity alone would not satisfy it.', followUp:'Revisit repeat trips and basket share if household budgets or store assortments change.' },
];
export function readPredictionResults(storage) {
  try {
    const saved=JSON.parse(storage.getItem(RESULT_STATE_KEY)||'{}');
    return RESULT_CATALOG.filter(item=>['in','out'].includes(saved.calls?.[item.id])).map(item=>({...item,call:saved.calls[item.id],seen:Array.isArray(saved.seen)&&saved.seen.includes(item.id),resolved:true,demoOutcome:true}));
  }catch{return [];}
}
export function previewPredictionResults(storage,calls={}) {
  const actual=Object.fromEntries(RESULT_CATALOG.filter(item=>['in','out'].includes(calls[item.id])).map(item=>[item.id,calls[item.id]]));
  const sample=Object.keys(actual).length ? actual : {'retail-events':'in','skin-longevity':'out','dollar-stores':'in'};
  try {storage.setItem(RESULT_STATE_KEY,JSON.stringify({calls:sample,seen:[]}));return true;}catch{return false;}
}
export function markPredictionResultSeen(storage,id) {
  try {
    const saved=JSON.parse(storage.getItem(RESULT_STATE_KEY)||'{}');
    if(!RESULT_CATALOG.some(item=>item.id===id)||!['in','out'].includes(saved.calls?.[id]))return false;
    storage.setItem(RESULT_STATE_KEY,JSON.stringify({...saved,seen:[...new Set([...(Array.isArray(saved.seen)?saved.seen:[]),id])]}));return true;
  }catch{return false;}
}
