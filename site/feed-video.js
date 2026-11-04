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
    playback.setAttribute('aria-label', video.paused ? (preview ? 'Play video preview' : 'Play story video') : (preview ? 'Pause video preview' : 'Pause story video'));
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
    if (!inView || document.hidden || readerPaused || (reducedMotion.matches && !readerStarted)) {
      video.pause();
      return;
    }
    try { await video.play(); }
    catch { syncLabel(); } // The accessible playback button also works if autoplay is blocked.
  }

  playback.addEventListener('click', async () => {
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
  reducedMotion.addEventListener('change', autoplay);
  window.addEventListener('pageshow', autoplay);
  syncLabel();
});

document.querySelectorAll('[data-video-carousel], [data-mover-carousel]').forEach(track => {
  track.addEventListener('keydown', event => {
    if (event.target !== track || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const step = track.firstElementChild.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap);
    track.scrollBy({ left: event.key === 'ArrowRight' ? step : -step, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  });
});
