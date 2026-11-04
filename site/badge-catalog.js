// Badge rules are real prototype rules; scores and prediction sample vote totals never award accuracy.
export const MEMBER_BADGES = [
  { id:'first-call', name:'First Call', icon:'bolt', goal:1, metric:'calls', color:'--color-icon-signal', criterion:'Vote on your first prediction.' },
  { id:'regular-hunter', name:'Regular Hunter', icon:'wand_stars', goal:5, metric:'callDays', color:'--color-topic-style', criterion:'Make calls on 5 different days.' },
  { id:'curious-mind', name:'Curious Mind', icon:'menu_book', goal:5, metric:'collections', color:'--color-topic-culture', criterion:'Read stories across 5 different collections.' },
  { id:'trend-tracker', name:'Trend Tracker', icon:'public', goal:3, metric:'updateDays', color:'--color-topic-beauty', criterion:'Open new stories from followed collections on 3 different days.' },
  { id:'sharp-eye', name:'Sharp Eye', icon:'visibility', goal:5, metric:'correctCalls', color:'--color-topic-fitness', criterion:'Correctly call 5 predictions whose outcomes have been verified.' },
];
export function currentMemberBadge(earned, hidden = []) {
  return MEMBER_BADGES.filter(badge => earned[badge.id] && !hidden.includes(badge.id))
    .sort((a,b) => earned[b.id].localeCompare(earned[a.id]))[0] || null;
}
// There is no verified outcome service in this prototype. Fixed vote splits are not outcomes.
export const VERIFIED_PREDICTION_OUTCOMES = {};
// Illustrative public achievements for the fictional community profiles, separate from the visitor.
export const READER_BADGE_EXAMPLES = {
  'reader-alex-rivera.html': { 'first-call':'2026-10-27', 'regular-hunter':'2026-11-02', 'trend-tracker':'2026-11-01' },
  'reader-jamie-park.html': { 'first-call':'2026-10-27', 'curious-mind':'2026-10-30' },
  'reader-taylor-brooks.html': { 'first-call':'2026-11-01' },
  'reader-quinn-ellis.html': { 'first-call':'2026-11-01' },
  'reader-casey-reed.html': { 'first-call':'2026-11-01' },
  'reader-riley-chen.html': { 'first-call':'2026-11-01' },
  'reader-morgan-lee.html': { 'first-call':'2026-10-28', 'curious-mind':'2026-11-01', 'trend-tracker':'2026-11-02' },
};
