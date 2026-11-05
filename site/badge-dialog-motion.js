const closing = new WeakMap();

// Reverse the exact opening flip, keeping the dialog and scrim in the top layer
// until it finishes. All dismissal routes share this guard against double close.
export function closeBadgeDialog(dialog) {
  if (!dialog.open) return Promise.resolve();
  if (closing.has(dialog)) return closing.get(dialog);
  const view = dialog.ownerDocument.defaultView;
  if (view.matchMedia('(prefers-reduced-motion: reduce)').matches || !dialog.animate) {
    dialog.close();
    return Promise.resolve();
  }
  const duration = (parseFloat(view.getComputedStyle(dialog).getPropertyValue('--motion-card-flip')) || 600) / 2;
  dialog.dataset.closing = 'true';
  dialog.getAnimations().forEach(animation => animation.cancel());
  const animation = dialog.animate([
    { opacity: 1, transform: 'perspective(960px) rotateY(0)' },
    { opacity: 0, transform: 'perspective(960px) rotateY(-90deg)' },
  ], { duration, easing: 'ease-in', fill: 'forwards' });
  const finished = animation.finished.catch(() => {}).then(() => {
    if (dialog.open) dialog.close();
    animation.cancel();
    delete dialog.dataset.closing;
    closing.delete(dialog);
  });
  closing.set(dialog, finished);
  return finished;
}
