'use strict';

const themeButton = document.getElementById('ds-theme');
const searchInput = document.getElementById('ds-search');
const categoryFilter = document.getElementById('ds-filter');
const tableBody = document.getElementById('ds-token-rows');
const countLabel = document.getElementById('ds-result-count');
let designTokens = [];
let copyTimeout;

function activeValue(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function renderTokens() {
  const query = searchInput.value.trim().toLowerCase();
  const category = categoryFilter.value;
  const visible = designTokens.filter(token => (!category || token.group === category)
    && `${token.name} ${token.default} ${token.light} ${token.group} ${activeValue(token.name)}`.toLowerCase().includes(query));
  tableBody.replaceChildren();
  const fragment = document.createDocumentFragment();
  for (const token of visible) {
    const row = document.createElement('tr');
    const nameCell = document.createElement('td');
    const code = document.createElement('code');
    code.textContent = token.name;
    const group = document.createElement('span');
    group.className = 'ds-token-group';
    group.textContent = token.group;
    nameCell.append(code, group);
    row.append(nameCell);
    for (const value of [token.default, token.light, activeValue(token.name)]) {
      const cell = document.createElement('td');
      cell.textContent = value;
      row.append(cell);
    }
    const action = document.createElement('td');
    const copy = document.createElement('button');
    copy.type = 'button';
    copy.className = 'ds-copy';
    copy.dataset.copy = token.name;
    copy.textContent = 'Copy';
    copy.setAttribute('aria-label', `Copy ${token.name}`);
    action.append(copy);
    row.append(action);
    fragment.append(row);
  }
  tableBody.append(fragment);
  countLabel.textContent = `${visible.length} of ${designTokens.length} tokens`;
  document.getElementById('ds-empty').hidden = visible.length !== 0;
}

function updateThemeValues() {
  for (const value of document.querySelectorAll('[data-value]')) {
    value.textContent = activeValue(value.dataset.value);
  }
  renderTokens();
}

themeButton.addEventListener('click', () => {
  const light = document.documentElement.dataset.theme !== 'light';
  if (light) document.documentElement.dataset.theme = 'light';
  else delete document.documentElement.dataset.theme;
  themeButton.textContent = light ? 'Dark theme' : 'Light theme';
  themeButton.setAttribute('aria-pressed', String(light));
  updateThemeValues();
});

document.addEventListener('click', async event => {
  const copy = event.target.closest('[data-copy]');
  if (!copy) return;
  try {
    await navigator.clipboard.writeText(`var(${copy.dataset.copy})`);
    const status = document.getElementById('ds-copy-status');
    status.textContent = `Copied ${copy.dataset.copy}`;
    status.hidden = false;
    clearTimeout(copyTimeout);
    copyTimeout = setTimeout(() => { status.hidden = true; }, 2000);
  } catch {
    const status = document.getElementById('ds-copy-status');
    status.textContent = `Copy this token: ${copy.dataset.copy}`;
    status.hidden = false;
  }
});

searchInput.addEventListener('input', () => { document.getElementById('ds-inventory').open = true; renderTokens(); });
categoryFilter.addEventListener('change', () => { document.getElementById('ds-inventory').open = true; renderTokens(); });
document.querySelector('[data-ds-view-votes]')?.addEventListener('click', event => {
  const otherVotes = document.getElementById('ds-other-votes');
  otherVotes.hidden = false;
  event.currentTarget.remove();
  if (event.detail === 0) otherVotes.querySelector('a')?.focus({ preventScroll: true });
}, { once: true });
window.addEventListener('resize', updateThemeValues);

const navLinks = [...document.querySelectorAll('.ds-nav a')];
const sectionObserver = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    for (const link of navLinks) {
      if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
  }
}, { rootMargin: '-125px 0px -60% 0px', threshold: 0 });
for (const section of document.querySelectorAll('.ds-main > section[id]')) sectionObserver.observe(section);

fetch('tokens.json')
  .then(response => {
    if (!response.ok) throw new Error('Token inventory is unavailable');
    return response.json();
  })
  .then(data => {
    designTokens = data.tokens;
    for (const category of [...new Set(designTokens.map(token => token.group))].sort()) {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      categoryFilter.append(option);
    }
    updateThemeValues();
  })
  .catch(() => { countLabel.textContent = 'Token inventory could not load. Refresh this page to try again.'; });
