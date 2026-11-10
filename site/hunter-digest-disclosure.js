// Shared by the feed and its isolated DS specimen.
document.addEventListener('click', event => {
  // The isolated DS example demonstrates hiding without saving any app state.
  if (event.target.closest('[data-digest-hide]') && document.body.classList.contains('ds-page')) {
    event.target.closest('.hunter-digest')?.setAttribute('hidden', '');
    return;
  }
  const button = event.target.closest('[data-digest-close]');
  if (!button) return;
  const details = button.closest('[data-digest-disclosure]');
  if (!details) return;
  details.open = false;
  details.closest('.hunter-digest')?.scrollIntoView({ block:'start', behavior:'auto' });
  details.querySelector('summary')?.focus({ preventScroll:true });
});
