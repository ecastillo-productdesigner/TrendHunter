// Prototype settings — the round button in the bottom right opens a small panel of
// controls for testing iterations. While open, the gear turns into a cancel icon.

const settingsButton = document.querySelector('.settings-fab');
const settingsPanel = document.querySelector('.settings-panel');
const businessBanner = import('./thb2b-banner.js').then(({ installBusinessBanner }) => installBusinessBanner());
const featureAnnouncement = import('./feature-announcement.js?v=3').then(({ installFeatureAnnouncement }) => installFeatureAnnouncement());

if (settingsButton && settingsPanel) {
  // Fetch the cancel icon now, so it's ready the first time the panel opens
  if (document.fonts) document.fonts.load('24px "Material Symbols Rounded"', 'cancel');

  const setOpen = (open) => {
    settingsPanel.hidden = !open;
    settingsButton.setAttribute('aria-expanded', String(open));
    settingsButton.setAttribute('aria-label', open ? 'Close prototype settings' : 'Prototype settings');
  };

  settingsButton.addEventListener('click', () => setOpen(settingsPanel.hidden));

  const showBusinessBanner = document.createElement('button');
  showBusinessBanner.className = 'settings-panel-item';
  showBusinessBanner.type = 'button';
  showBusinessBanner.dataset.setting = 'show-thb2b-banner';
  showBusinessBanner.textContent = 'Show THB2B Banner';
  settingsPanel.querySelector('[data-setting="osano"]')?.before(showBusinessBanner);
  showBusinessBanner.addEventListener('click', async () => {
    setOpen(false);
    (await businessBanner)?.show();
  });

  const showNewFeature = document.createElement('button');
  showNewFeature.className = 'settings-panel-item';
  showNewFeature.type = 'button';
  showNewFeature.dataset.setting = 'show-new-feature';
  showNewFeature.textContent = 'Show new feature';
  showBusinessBanner.before(showNewFeature);
  showNewFeature.addEventListener('click', async () => {
    setOpen(false);
    (await featureAnnouncement).show();
  });

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

  // Open Osano — the cookie consent tool isn't part of the prototype yet
  settingsPanel.querySelector('[data-setting="osano"]').addEventListener('click', () => setOpen(false));

  // Reset only recommendation feedback; explicit topics and follows are retained.
  settingsPanel.querySelector('[data-setting="reset-recommendations"]')?.addEventListener('click', async () => {
    const { resetRecommendationFeedback } = await import('./recommendation-feedback.js');
    if (!resetRecommendationFeedback()) {
      window.showToast?.('Recommendations could not be reset. Please try again.');
      return;
    }
    setOpen(false);
    document.dispatchEvent(new CustomEvent('feed-recommendations-updated', { detail: { reset:true } }));
    window.showToast?.('Recommendations reset.');
  });
  settingsPanel.querySelector('[data-setting="show-new-collections"]')?.addEventListener('click', async () => {
    const { showCollectionUpdatesPreview } = await import('./collection-update-state.js');
    if (!showCollectionUpdatesPreview(localStorage)) { window.showToast?.('New content preview could not be shown. Please try again.'); return; }
    setOpen(false);
    if (document.body.classList.contains('page-feed')) document.dispatchEvent(new Event('collection-updates-preview'));
    else location.assign('feed.html');
  });
  settingsPanel.querySelector('[data-setting="reset-collection-updates"]')?.addEventListener('click', async () => {
    const { resetCollectionUpdateMarkers } = await import('./collection-update-state.js');
    if(resetCollectionUpdateMarkers(localStorage)){setOpen(false);document.dispatchEvent(new Event('collection-updates-preview'));}
  });
  settingsPanel.querySelector('[data-setting="show-new-following"]')?.addEventListener('click', async () => {
    const { showPeopleUpdatesPreview } = await import('./people-update-state.js');
    if (!showPeopleUpdatesPreview(localStorage)) { window.showToast?.('New activity could not be shown. Please try again.'); return; }
    setOpen(false);
    if (document.body.classList.contains('page-feed')) document.dispatchEvent(new Event('people-updates-preview'));
    else location.assign('feed.html');
  });
  settingsPanel.querySelector('[data-setting="show-prediction-results"]')?.addEventListener('click', async () => {
    const { previewPredictionResults } = await import('./prediction-result-state.js?v=3');
    let calls={};try{calls=JSON.parse(sessionStorage.getItem('prediction-calls')||'{}');}catch{}
    if(!previewPredictionResults(localStorage,calls)){window.showToast?.('Results could not be shown.');return;}
    setOpen(false);
    if(document.body.classList.contains('page-feed')){location.hash='for-you';document.dispatchEvent(new Event('prediction-results-preview'));}
    else location.assign('feed.html#for-you');
  });
  settingsPanel.querySelector('[data-setting="reset-badges"]')?.addEventListener('click', async () => {
    const { resetBadgeProgress } = await import('./badge-state.js?v=3');
    let calls = {}; try { calls = JSON.parse(sessionStorage.getItem('prediction-calls') || '{}'); } catch {}
    let saved = []; try { saved = JSON.parse(sessionStorage.getItem('saved-stories') || '[]').map(story=>story.href || story.id); } catch {}
    if (!resetBadgeProgress(localStorage,calls,saved)) { window.showToast?.('Badges could not be reset. Please try again.'); return; }
    setOpen(false);
    document.dispatchEvent(new Event('member-badges-reset'));
    window.showToast?.('Badges reset. Your saved calls are unchanged.');
  });
}
