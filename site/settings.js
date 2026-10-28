// Prototype settings — the round button in the bottom right opens a small panel of
// controls for testing iterations. While open, the gear turns into a cancel icon.

const settingsButton = document.querySelector('.settings-fab');
const settingsPanel = document.querySelector('.settings-panel');

if (settingsButton && settingsPanel) {
  // Fetch the cancel icon now, so it's ready the first time the panel opens
  if (document.fonts) document.fonts.load('24px "Material Symbols Rounded"', 'cancel');

  const setOpen = (open) => {
    settingsPanel.hidden = !open;
    settingsButton.setAttribute('aria-expanded', String(open));
    settingsButton.setAttribute('aria-label', open ? 'Close prototype settings' : 'Prototype settings');
  };

  settingsButton.addEventListener('click', () => setOpen(settingsPanel.hidden));

  // Escape or a click anywhere else closes it
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !settingsPanel.hidden) {
      setOpen(false);
      settingsButton.focus();
    }
  });

  document.addEventListener('click', (event) => {
    if (settingsPanel.hidden || event.target.closest('.settings-panel, .settings-fab')) return;
    setOpen(false);
  });

  // Deal predictions again — clears the calls (kept per tab) and re-deals the deck.
  // As a new user, the Make Your Call cover comes back on top too.
  const deal = (asNewUser) => {
    try { sessionStorage.removeItem('prediction-calls'); } catch (e) {}
    document.dispatchEvent(new CustomEvent('prediction-deal', { detail: { asNewUser } }));
    setOpen(false);
  };

  settingsPanel.querySelector('[data-setting="deal"]').addEventListener('click', () => deal(false));
  settingsPanel.querySelector('[data-setting="deal-new-user"]').addEventListener('click', () => deal(true));

  // Read more on phones and tablets: open the story page (default) or the bottom sheet, to compare both
  const readMoreItem = settingsPanel.querySelector('[data-setting="read-more"]');
  if (readMoreItem) {
    const getMode = () => {
      try { return sessionStorage.getItem('read-more-mode') || 'page'; } catch (e) { return 'page'; }
    };
    const showMode = () => {
      readMoreItem.textContent = `Read more opens: ${getMode() === 'sheet' ? 'Sheet' : 'Story page'}`;
    };
    showMode();
    readMoreItem.addEventListener('click', () => {
      try { sessionStorage.setItem('read-more-mode', getMode() === 'sheet' ? 'page' : 'sheet'); } catch (e) {}
      showMode();
    });
  }

  // Open Osano — the cookie consent tool isn't part of the prototype yet
  settingsPanel.querySelector('[data-setting="osano"]').addEventListener('click', () => setOpen(false));
}
