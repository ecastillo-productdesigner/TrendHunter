// The former open directory now leads to the existing personal Active history.
(() => {
  const destination = 'userprofile.html?prediction-filter=active#predictions';
  if (document.querySelector('[data-open-predictions]')) {
    location.replace(destination);
    return;
  }
  const render = () => {
    let calls = {};
    try { calls = JSON.parse(sessionStorage.getItem(CALLS_KEY)) || {}; } catch {}
    const count = openPredictionList(calls).filter(prediction => ['in', 'out'].includes(calls[prediction.id])).length;
    document.querySelectorAll('[data-open-count]').forEach(label => {
      label.textContent = `(${count})`;
      const link = label.closest('.predictions-open-link');
      if (link) link.hidden = count === 0;
    });
  };
  window.addEventListener('pageshow', render);
  document.addEventListener('prediction-call', render);
  render();
})();
