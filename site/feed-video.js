// Story articles and carousel previews use the supplied clips, including their audio tracks.
// Playback intent belongs to the reader; scrolling never clears an explicit pause.
document.querySelectorAll('[data-feed-video]').forEach(card => {
  const video = card.querySelector('video');
  const playback = card.querySelector('[data-video-playback]');
  const feedback = card.querySelector('.trend-card-video-feedback');
  const feedbackIcon = feedback.querySelector('.trend-card-video-symbol');
  const sound = card.querySelector('[data-video-sound]');
  const status = card.querySelector('[data-video-status]');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const manualPlayback = card.hasAttribute('data-video-manual');
  let readerPaused = manualPlayback;
  let readerStarted = false;
  let inView = false;
  let feedbackAnimation;

  video.muted = true;
  sound.dataset.muted = 'true';
  if (reducedMotion.matches) video.pause();

  function syncLabel() {
    card.dataset.videoPaused = String(video.paused);
    const preview = Boolean(card.closest('[data-video-carousel]'));
    playback.setAttribute('aria-label', preview ? `Watch video: ${card.querySelector('.trending-video-title')?.textContent.trim()}` : video.paused ? 'Play story video' : 'Pause story video');
    const control = playback.querySelector('[data-video-control-symbol]');
    if (control) control.textContent = video.paused ? 'play_circle' : 'pause_circle';
  }

  function flash(symbol) {
    if (manualPlayback) return;
    feedbackAnimation?.cancel();
    feedbackIcon.textContent = symbol;
    const duration = parseFloat(getComputedStyle(card).getPropertyValue('--motion-video-feedback')) || 900;
    feedbackAnimation = feedback.animate(reducedMotion.matches
      ? [{ opacity: 1 }, { opacity: 1, offset: 0.6 }, { opacity: 0 }]
      : [{ opacity: 0, transform: 'scale(0.75)' }, { opacity: 1, transform: 'scale(1)', offset: 0.2 }, { opacity: 1, transform: 'scale(1)', offset: 0.6 }, { opacity: 0, transform: 'scale(1.12)' }],
    { duration, easing: 'ease-out' });
  }

  async function autoplay() {
    if (!inView || document.hidden || (document.documentElement.classList.contains('video-viewer-open') && !card.hasAttribute('data-video-viewer-active')) || readerPaused || (reducedMotion.matches && !readerStarted)) {
      video.pause();
      return;
    }
    try { await video.play(); }
    catch { syncLabel(); } // The accessible playback button also works if autoplay is blocked.
  }

  playback.addEventListener('click', async () => {
    if (card.closest('[data-video-carousel]') && window.openTrendingVideo) {
      window.openTrendingVideo(card, playback);
      return;
    }
    if (video.paused) {
      readerPaused = false;
      readerStarted = true;
      try {
        await video.play();
        flash('play_circle');
        status.textContent = 'Video playing';
      } catch { status.textContent = 'Video could not play. Please try again.'; }
    } else {
      readerPaused = true;
      video.pause();
      flash('pause_circle');
      status.textContent = 'Video paused';
    }
  });

  sound.addEventListener('click', () => {
    video.muted = !video.muted;
    sound.dataset.muted = String(video.muted);
    sound.setAttribute('aria-label', video.muted ? 'Unmute story video' : 'Mute story video');
    sound.querySelector('.trend-card-video-symbol').textContent = video.muted ? 'volume_off' : 'volume_up';
    status.textContent = video.muted ? 'Video muted' : 'Video unmuted';
  });

  video.addEventListener('play', () => {
    // A carousel plays one clip at a time. Each paused manual player stays paused.
    card.closest('[data-video-carousel]')?.querySelectorAll('video').forEach(other => {
      if (other !== video) other.pause();
    });
    syncLabel();
  });
  video.addEventListener('pause', () => {
    if (manualPlayback) readerPaused = true;
    syncLabel();
  });
  // A next-card peek must not start playing and interrupt the visible clip.
  const visibilityThreshold = card.closest('[data-video-carousel]') ? 0.6 : 0.25;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      inView = entries[0].isIntersecting && entries[0].intersectionRatio >= visibilityThreshold;
      autoplay();
    }, { threshold: [0, visibilityThreshold] }).observe(card);
  } else {
    inView = true;
    autoplay();
  }
  document.addEventListener('visibilitychange', autoplay);
  card.addEventListener('video-viewer-activate', () => { readerPaused = false; readerStarted = true; });
  reducedMotion.addEventListener('change', autoplay);
  window.addEventListener('pageshow', autoplay);
  syncLabel();
});

// Trending Videos opens the original live card in a modal viewer. Moving it keeps
// playback, mute, canonical Share/Bookmark data and the article link in sync.
(() => {
  const cards = [...document.querySelectorAll('.page-feed [data-video-carousel] [data-feed-video]')];
  if (!cards.length) return;
  const viewer = document.createElement('dialog');
  viewer.className = 'video-viewer';
  viewer.setAttribute('aria-label', 'Trending Videos viewer');
  viewer.innerHTML = `
    <header class="video-viewer-header">
      <a class="video-viewer-logo" href="feed.html" aria-label="Trend Hunter"><img src="assets/feed/wordmark.svg" alt="Trend Hunter"></a>
      <a class="video-viewer-login" href="login.html">Log In</a>
    </header>
    <button class="video-viewer-close" type="button" aria-label="Close video viewer"><span class="drawer-close-icon" aria-hidden="true"></span></button>
    <div class="video-viewer-stage"></div>
    <nav class="video-viewer-navigation" aria-label="Browse videos">
      <button type="button" data-video-previous aria-label="Previous video"><span class="icon-arrow icon-arrow--up" aria-hidden="true"></span></button>
      <button type="button" data-video-next aria-label="Next video"><span class="icon-arrow icon-arrow--down" aria-hidden="true"></span></button>
    </nav>
    <p class="visually-hidden" role="status" data-viewer-status></p>`;
  document.body.append(viewer);
  const stage = viewer.querySelector('.video-viewer-stage');
  const close = viewer.querySelector('.video-viewer-close');
  const previous = viewer.querySelector('[data-video-previous]');
  const next = viewer.querySelector('[data-video-next]');
  const status = viewer.querySelector('[data-viewer-status]');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let active = null, marker = null, trigger = null, index = 0;
  let wasPaused = true, lastWheel = 0, pointerStart = null, suppressClick = false;
  let transition = null;

  function restoreCard(card, placeholder) {
    card.removeAttribute('data-video-viewer-active');
    card.querySelector('video').pause();
    card.inert = false;
    placeholder.replaceWith(card);
    card.querySelector('[data-video-playback]').setAttribute('aria-label', `Watch video: ${card.querySelector('.trending-video-title').textContent.trim()}`);
  }
  function finishTransition(moving = transition) {
    if (!moving || moving !== transition) return;
    transition = null;
    moving.animations.forEach(animation => animation.cancel());
    restoreCard(moving.card, moving.placeholder);
    stage.classList.remove('is-changing');
    stage.removeAttribute('aria-busy');
  }
  function returnCard() {
    finishTransition();
    if (active) restoreCard(active, marker);
    active = marker = null;
  }
  function showCard(target) {
    if (target < 0 || target >= cards.length || transition || (active && target === index)) return;
    const outgoing = active, outgoingMarker = marker;
    const direction = target > index ? 1 : -1;
    if (outgoing) {
      outgoing.removeAttribute('data-video-viewer-active');
      outgoing.querySelector('video').pause();
    }
    index = target;
    active = cards[index];
    marker = document.createElement('div');
    marker.className = 'video-viewer-placeholder';
    active.replaceWith(marker);
    stage.append(active);
    active.setAttribute('data-video-viewer-active', '');
    active.dispatchEvent(new Event('video-viewer-activate'));
    document.querySelectorAll('video').forEach(video => { if (!active.contains(video)) video.pause(); });
    previous.disabled = index === 0;
    next.disabled = index === cards.length - 1;
    status.textContent = `Video ${index + 1} of ${cards.length}: ${active.querySelector('.trending-video-title').textContent.trim()}`;
    const video = active.querySelector('video');
    active.querySelector('[data-video-playback]').setAttribute('aria-label', 'Pause story video');
    video.play().catch(() => { if (active?.contains(video)) active.querySelector('[data-video-playback]').setAttribute('aria-label', 'Play story video'); });
    if (!outgoing) return;
    // Both original, opaque cards share the stage during the slide. No clones,
    // fades or blur, so there is no flash and all live controls keep their state.
    if (outgoing.contains(document.activeElement)) active.querySelector('[data-video-playback]').focus({preventScroll:true});
    outgoing.inert = true;
    if (reducedMotion.matches) { restoreCard(outgoing, outgoingMarker); return; }
    const style = getComputedStyle(viewer);
    const duration = parseFloat(style.getPropertyValue('--motion-video-navigation')) || 650;
    const easing = style.getPropertyValue('--motion-ease-video-navigation').trim() || 'cubic-bezier(0.4, 0, 0.2, 1)';
    const moving = {
      card: outgoing, placeholder: outgoingMarker,
      animations: [
        outgoing.animate([{transform:'translateY(0)'},{transform:`translateY(${-direction * 100}%)`}], {duration,easing,fill:'both'}),
        active.animate([{transform:`translateY(${direction * 100}%)`},{transform:'translateY(0)'}], {duration,easing,fill:'both'}),
      ],
    };
    transition = moving;
    stage.classList.add('is-changing');
    stage.setAttribute('aria-busy', 'true');
    Promise.all(moving.animations.map(animation => animation.finished)).then(() => finishTransition(moving), () => finishTransition(moving));
  }
  window.openTrendingVideo = (card, origin) => {
    const selected = cards.indexOf(card);
    if (selected < 0 || viewer.open) return;
    wasPaused = card.querySelector('video').paused;
    trigger = origin;
    document.documentElement.classList.add('video-viewer-open');
    viewer.showModal();
    showCard(selected);
    close.focus({preventScroll:true});
  };
  close.addEventListener('click', () => viewer.close());
  viewer.querySelector('.video-viewer-logo').addEventListener('click', event => { event.preventDefault(); viewer.close(); });
  viewer.addEventListener('close', () => {
    const card = active;
    const pausedInViewer = card?.querySelector('video').paused;
    returnCard();
    document.documentElement.classList.remove('video-viewer-open');
    if (card && !wasPaused && !pausedInViewer && !document.hidden) card.querySelector('video').play().catch(() => {});
    if (trigger?.isConnected) trigger.focus({preventScroll:true});
  });
  previous.addEventListener('click', () => showCard(index - 1));
  next.addEventListener('click', () => showCard(index + 1));
  viewer.addEventListener('keydown', event => {
    if (!['ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault(); showCard(index + (event.key === 'ArrowDown' ? 1 : -1));
  });
  viewer.addEventListener('wheel', event => {
    if (Math.abs(event.deltaY) < 40 || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    event.preventDefault();
    if (transition || Date.now() - lastWheel < 600) return;
    lastWheel = Date.now(); showCard(index + (event.deltaY > 0 ? 1 : -1));
  }, {passive:false});
  stage.addEventListener('pointerdown', event => {
    if (transition || !event.target.closest('[data-video-playback]')) return;
    suppressClick = false;
    pointerStart = {x:event.clientX, y:event.clientY};
  });
  stage.addEventListener('pointerup', event => {
    if (!pointerStart) return;
    const dy = event.clientY - pointerStart.y, dx = event.clientX - pointerStart.x;
    pointerStart = null;
    if (Math.abs(dy) < 56 || Math.abs(dy) < Math.abs(dx)) return;
    suppressClick = true; showCard(index + (dy < 0 ? 1 : -1));
  });
  stage.addEventListener('pointercancel', () => { pointerStart = null; });
  stage.addEventListener('click', event => { if (suppressClick) { suppressClick = false; event.preventDefault(); event.stopPropagation(); } }, true);
  document.addEventListener('visibilitychange', () => { if (document.hidden) active?.querySelector('video').pause(); });
  reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) finishTransition(); });
  window.addEventListener('pagehide', () => { if (viewer.open) viewer.close(); });
})();

document.querySelectorAll('[data-video-carousel], [data-mover-carousel]').forEach(track => {
  track.addEventListener('keydown', event => {
    if (event.target !== track || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const step = track.firstElementChild.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap);
    track.scrollBy({ left: event.key === 'ArrowRight' ? step : -step, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  });
});
