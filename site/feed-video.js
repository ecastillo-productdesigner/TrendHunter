// The second feed card uses a five-second silent motion study of its existing photo.
// Playback intent belongs to the reader; scrolling never clears an explicit pause.
document.querySelectorAll('[data-feed-video]').forEach(card => {
  const video = card.querySelector('video');
  const playback = card.querySelector('[data-video-playback]');
  const feedback = card.querySelector('.trend-card-video-feedback');
  const feedbackIcon = feedback.querySelector('.trend-card-video-symbol');
  const sound = card.querySelector('[data-video-sound]');
  const status = card.querySelector('[data-video-status]');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let readerPaused = false;
  let readerStarted = false;
  let inView = false;
  let feedbackAnimation;

  video.muted = true;
  sound.dataset.muted = 'true';
  if (reducedMotion.matches) video.pause();

  function syncLabel() {
    playback.setAttribute('aria-label', video.paused ? 'Play story video' : 'Pause story video');
  }

  function flash(symbol) {
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

  video.addEventListener('play', syncLabel);
  video.addEventListener('pause', syncLabel);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      inView = entries[0].isIntersecting && entries[0].intersectionRatio >= 0.25;
      autoplay();
    }, { threshold: [0, 0.25] }).observe(card);
  } else {
    inView = true;
    autoplay();
  }
  document.addEventListener('visibilitychange', autoplay);
  reducedMotion.addEventListener('change', autoplay);
  window.addEventListener('pageshow', autoplay);
  syncLabel();
});
