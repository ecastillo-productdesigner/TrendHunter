import { celebrateBadge } from '../badge-celebration.js?v=4';
import { MEMBER_BADGES } from '../badge-catalog.js?v=4';
document.querySelectorAll('[data-preview-badge-award]').forEach(button => {
  button.addEventListener('click', () => {
    const badge = MEMBER_BADGES.find(item => item.id === (button.dataset.previewBadgeAward || 'first-call'));
    if (badge) celebrateBadge(badge);
  });
});
