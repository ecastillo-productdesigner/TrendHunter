// Shared by author prediction histories and their design-system replay example.
const comparisonEntranceAnimations = new WeakMap();
function playComparisonEntrance(list) {
  comparisonEntranceAnimations.get(list)?.forEach(animation => animation.cancel());
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return [];
  const style = getComputedStyle(list);
  const duration = parseFloat(style.getPropertyValue('--motion-comparison-enter')) || 500;
  const splitDuration = parseFloat(style.getPropertyValue('--motion-comparison-split')) || 650;
  const stagger = parseFloat(style.getPropertyValue('--motion-comparison-stagger')) || 70;
  const distance = parseFloat(style.getPropertyValue('--spacing-component-ms')) || 12;
  const animations = [];
  list.querySelectorAll('.prediction-result--comparison').forEach((row, index) => {
    const delay = Math.min(index, 5) * stagger;
    const timing = { duration, delay, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'backwards' };
    animations.push(row.animate([{opacity:0,transform:`translateY(${distance}px)`},{opacity:1,transform:'translateY(0)'}], timing));
    const labels = row.querySelector('.prediction-result-split-labels');
    if (labels) animations.push(labels.animate([{opacity:0},{opacity:1}], {...timing,delay:delay+120}));
    const bar = row.querySelector('.prediction-result-split-bar');
    if (bar) animations.push(bar.animate([{opacity:0,transform:'scaleX(0)',transformOrigin:'left center'},{opacity:1,transform:'scaleX(1)',transformOrigin:'left center'}], {...timing,duration:splitDuration,delay:delay+120}));
  });
  comparisonEntranceAnimations.set(list, animations);
  return animations;
}
