// Isolated design proposals: these controls never change saved profile filters or votes.
for (const preview of document.querySelectorAll('.option-preview')) {
  preview.querySelector('.option-filter').addEventListener('click', event => {
    const button = event.target.closest('[data-filter]');
    if (!button) return;
    for (const item of preview.querySelectorAll('[data-filter]')) item.setAttribute('aria-pressed', String(item === button));
    for (const result of preview.querySelectorAll('[data-status]')) result.hidden = button.dataset.filter !== 'all' && result.dataset.status !== button.dataset.filter;
  });
}
