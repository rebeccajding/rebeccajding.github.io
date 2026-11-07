// Landing page: turn vertical mouse-wheel input into smooth horizontal
// movement of the project track. Trackpads, touch, and keyboard use native
// scrolling. Users who prefer reduced motion keep the browser default.
(function () {
  const track = document.querySelector('.track');
  if (!track) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const EASE = 0.14; // fraction of remaining distance covered each frame

  let target = track.scrollLeft;
  let animating = false;

  const maxScroll = () => track.scrollWidth - track.clientWidth;
  const clamp = (v) => Math.max(0, Math.min(maxScroll(), v));

  let last = null;

  function step() {
    const current = track.scrollLeft;
    const diff = target - current;
    // Stop when close enough, or when the browser can't move any further
    // (scrollLeft can stop a fraction of a pixel short of the maximum).
    if (Math.abs(diff) < 0.5 || current === last) {
      if (Math.abs(diff) < 0.5) track.scrollLeft = target;
      target = track.scrollLeft;
      animating = false;
      last = null;
      return;
    }
    last = current;
    track.scrollLeft = current + (Math.abs(diff * EASE) < 1 ? Math.sign(diff) : diff * EASE);
    requestAnimationFrame(step);
  }

  window.addEventListener('wheel', (e) => {
    if (reducedMotion.matches || e.ctrlKey) return;

    // Mostly-horizontal gestures (trackpads, shift+wheel): let the browser handle them.
    if (Math.abs(e.deltaX) >= Math.abs(e.deltaY)) {
      target = track.scrollLeft;
      return;
    }

    e.preventDefault();
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? track.clientWidth : 1;
    if (!animating) target = track.scrollLeft;
    target = clamp(target + e.deltaY * unit);
    if (!animating) {
      animating = true;
      requestAnimationFrame(step);
    }
  }, { passive: false });

  // Keep the target in sync when the user scrolls natively (touch, keys, trackpad).
  track.addEventListener('scroll', () => {
    if (!animating) target = track.scrollLeft;
  }, { passive: true });

  // Up/Down arrows also move the track when it has focus (Left/Right are native).
  track.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const dir = e.key === 'ArrowDown' ? 1 : -1;
    track.scrollBy({ left: dir * track.clientWidth * 0.25, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
  });

  window.addEventListener('resize', () => { target = clamp(track.scrollLeft); });

  // Restore the track position when returning with Back/Forward.
  const KEY = 'landing-track-scroll';
  const nav = performance.getEntriesByType('navigation')[0];
  try {
    const saved = Number(sessionStorage.getItem(KEY));
    if (nav && nav.type === 'back_forward' && saved) track.scrollLeft = saved;
  } catch (e) { /* storage unavailable */ }
  target = track.scrollLeft;
  window.addEventListener('pagehide', () => {
    try { sessionStorage.setItem(KEY, String(track.scrollLeft)); } catch (e) { /* ignore */ }
  });

  // Every card fades with the same function, based only on where its left
  // edge sits in the viewport. The fade begins at the spot where Maggie (the
  // first card) sits on load, so she starts fading with the first bit of
  // scroll, and ends at 35% of the viewport width (linear in between).
  // Every card uses these same two thresholds.
  const FADE_END = 0.35;
  const cards = [...track.querySelectorAll('.card')];
  let fadeStart = 0.60;
  let fadeQueued = false;

  function measureFadeStart() {
    // Maggie's left edge at scroll position 0, as a fraction of the viewport.
    const left = cards[0].getBoundingClientRect().left + track.scrollLeft;
    fadeStart = left / window.innerWidth;
  }

  function cardOpacity(left, viewportWidth) {
    const t = (left / viewportWidth - FADE_END) / (fadeStart - FADE_END);
    return Math.min(1, Math.max(0, t));
  }

  // Phones: the first card starts at the left gutter, so there is no fade.
  const phone = window.matchMedia('(max-width: 760px)');

  function updateFade() {
    fadeQueued = false;
    if (phone.matches) {
      for (const card of cards) card.style.opacity = '';
      return;
    }
    const vw = window.innerWidth;
    for (const card of cards) {
      card.style.opacity = cardOpacity(card.getBoundingClientRect().left, vw).toFixed(3);
    }
  }
  track.addEventListener('scroll', () => {
    if (!fadeQueued) { fadeQueued = true; requestAnimationFrame(updateFade); }
  }, { passive: true });
  window.addEventListener('resize', () => { measureFadeStart(); updateFade(); });
  measureFadeStart();
  updateFade();
})();
