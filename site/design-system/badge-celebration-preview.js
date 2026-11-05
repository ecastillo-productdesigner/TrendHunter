import { celebrateBadge } from '../badge-celebration.js?v=3';
document.querySelector('[data-preview-badge-award]')?.addEventListener('click', () => celebrateBadge({ id: 'first-call', name: 'First Call', icon: 'bolt' }));
