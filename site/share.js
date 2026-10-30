// One contextual share menu for feed stories, articles, collections and Answers.
(() => {
  const triggers = '.article-share, [data-video-share], [data-answer-share], [data-share-menu]';
  const menu = document.createElement('div');
  menu.id = 'story-share-menu';
  menu.className = 'share-menu';
  menu.setAttribute('role', 'menu');
  menu.setAttribute('aria-label', 'Share');
  menu.hidden = true;
  const topLayer = typeof menu.showPopover === 'function';
  if (topLayer) menu.setAttribute('popover', 'manual');
  menu.innerHTML = `
    <button class="share-menu-item" role="menuitem" type="button" data-share-copy tabindex="-1"><span class="share-menu-icon share-menu-icon--link" aria-hidden="true"></span>Copy link</button>
    <a class="share-menu-item" role="menuitem" data-share-email tabindex="-1"><span class="share-menu-icon share-menu-icon--email" aria-hidden="true"></span>Email</a>
    <button class="share-menu-item" role="menuitem" type="button" data-share-more tabindex="-1"><span class="share-menu-icon share-menu-icon--more" aria-hidden="true"></span>More</button>`;
  const status = document.createElement('p');
  status.className = 'share-status';
  status.setAttribute('role', 'status');
  status.hidden = true;
  const sheet = document.createElement('dialog');
  sheet.className = 'share-sheet';
  sheet.setAttribute('aria-labelledby', 'share-sheet-title');
  sheet.innerHTML = `
    <div class="share-sheet-heading"><h2 id="share-sheet-title">Share</h2><button class="share-sheet-close" type="button" aria-label="Close share options">×</button></div>
    <p class="share-sheet-story"></p>
    <label class="share-sheet-label" for="share-sheet-url">Link</label><input id="share-sheet-url" type="url" readonly>
    <div class="share-sheet-actions"><button class="share-sheet-copy" type="button">Copy link</button><a class="share-sheet-email">Email</a></div>`;
  document.body.append(menu, sheet, status);
  let activeTrigger = null;
  let lastTrigger = null;
  let data = null;
  let statusTimer;

  function announce(message) {
    clearTimeout(statusTimer);
    status.textContent = message;
    status.hidden = false;
    statusTimer = setTimeout(() => { status.hidden = true; }, 4000);
  }

  function shareData(trigger) {
    const card = trigger.closest('.trend-card');
    const link = card?.querySelector('.trend-card-content a[href]');
    return {
      title: trigger.dataset.shareTitle || card?.querySelector('.trend-card-headline')?.textContent.trim()
        || document.querySelector('h1')?.textContent.trim() || document.title,
      url: new URL(trigger.dataset.shareUrl || link?.href || location.href, location.href).href,
    };
  }

  function emailHref() {
    return `mailto:?subject=${encodeURIComponent(data.title)}&body=${encodeURIComponent(data.url)}`;
  }

  function close(restoreFocus = false) {
    if (!activeTrigger) return;
    const previous = activeTrigger;
    if (topLayer && menu.matches(':popover-open')) menu.hidePopover();
    menu.hidden = true;
    previous.setAttribute('aria-expanded', 'false');
    activeTrigger = null;
    if (restoreFocus && previous.isConnected) previous.focus({ preventScroll: true });
  }

  function position() {
    const anchor = activeTrigger.getBoundingClientRect();
    const root = getComputedStyle(document.documentElement);
    const gap = parseFloat(root.getPropertyValue('--spacing-component-sm')) || 8;
    const inset = parseFloat(root.getPropertyValue('--spacing-component-ms')) || 12;
    const box = menu.getBoundingClientRect();
    // Prefer the left of the action rail. Near the viewport edge, tuck below it.
    let left = anchor.left - box.width - gap;
    let top = anchor.top + anchor.height / 2 - box.height / 2;
    if (left < inset) {
      left = anchor.right - box.width;
      top = anchor.bottom + gap;
    }
    menu.style.left = `${Math.max(inset, Math.min(left, innerWidth - box.width - inset))}px`;
    menu.style.top = `${Math.max(inset, Math.min(top, innerHeight - box.height - inset))}px`;
  }

  function open(trigger) {
    if (activeTrigger === trigger) { close(true); return; }
    close();
    activeTrigger = trigger;
    lastTrigger = trigger;
    data = shareData(trigger);
    trigger.setAttribute('aria-haspopup', 'menu');
    trigger.setAttribute('aria-expanded', 'true');
    trigger.setAttribute('aria-controls', menu.id);
    menu.querySelector('[data-share-email]').href = emailHref();
    menu.hidden = false;
    if (topLayer) menu.showPopover();
    position();
    menu.querySelector('[role="menuitem"]').focus({ preventScroll: true });
  }

  function moreOptions() {
    close();
    sheet.querySelector('.share-sheet-story').textContent = data.title;
    sheet.querySelector('input').value = data.url;
    sheet.querySelector('.share-sheet-email').href = emailHref();
    sheet.showModal();
  }

  async function copyLink() {
    const copiedData = data;
    try {
      await navigator.clipboard.writeText(copiedData.url);
      if (data === copiedData) {
        if (sheet.open) sheet.close();
        close(true);
      }
      announce('Link copied');
    } catch {
      if (!sheet.open) moreOptions();
      const field = sheet.querySelector('input');
      field.focus();
      field.select();
      announce('Select and copy the link below.');
    }
  }

  document.querySelectorAll(triggers).forEach(trigger => {
    trigger.setAttribute('aria-haspopup', 'menu');
    trigger.setAttribute('aria-expanded', 'false');
  });
  document.addEventListener('click', event => {
    const trigger = event.target.closest(triggers);
    if (trigger) { event.preventDefault(); open(trigger); return; }
    if (activeTrigger && !menu.contains(event.target)) close();
  });
  menu.addEventListener('click', async event => {
    if (event.target.closest('[data-share-copy]')) await copyLink();
    if (event.target.closest('[data-share-email]')) close(true);
    if (event.target.closest('[data-share-more]')) {
      if (!navigator.share) { moreOptions(); return; }
      close(true);
      try { await navigator.share(data); }
      catch (error) { if (error.name !== 'AbortError') moreOptions(); }
    }
  });
  document.addEventListener('keydown', event => {
    const trigger = event.target.closest(triggers);
    if (trigger && ['ArrowDown', 'ArrowUp'].includes(event.key)) {
      event.preventDefault();
      if (activeTrigger !== trigger) open(trigger);
      if (event.key === 'ArrowUp') menu.querySelector('[data-share-more]').focus();
      return;
    }
    if (!activeTrigger) return;
    if (event.key === 'Escape') { event.preventDefault(); close(true); }
    if (event.key === 'Tab') close(true);
    if (!menu.contains(event.target)) return;
    const items = [...menu.querySelectorAll('[role="menuitem"]')];
    const index = items.indexOf(document.activeElement);
    const next = { ArrowDown: (index + 1) % items.length, ArrowUp: (index + items.length - 1) % items.length, Home: 0, End: items.length - 1 }[event.key];
    if (next !== undefined) { event.preventDefault(); items[next].focus(); }
  });
  document.addEventListener('focusin', event => {
    if (activeTrigger && event.target !== activeTrigger && !menu.contains(event.target)) close();
  });
  document.addEventListener('scroll', event => { if (activeTrigger && !menu.contains(event.target)) close(); }, true);
  window.addEventListener('resize', () => { if (activeTrigger) position(); });
  sheet.querySelector('.share-sheet-close').addEventListener('click', () => sheet.close());
  sheet.addEventListener('close', () => { if (lastTrigger?.isConnected) lastTrigger.focus({ preventScroll: true }); });
  sheet.querySelector('.share-sheet-copy').addEventListener('click', copyLink);
  sheet.querySelector('.share-sheet-email').addEventListener('click', () => sheet.close());
  sheet.querySelector('input').addEventListener('click', event => event.target.select());
  sheet.addEventListener('click', event => {
    const box = sheet.getBoundingClientRect();
    if (event.target === sheet && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) sheet.close();
  });
})();
