// Project detail pages: as the hero scrolls up, fade its text (title, details,
// footer line) before it reaches the fixed header so the two never overlap.
(function () {
  const header = document.querySelector('.hero__header');
  const items = [...document.querySelectorAll('.hero__title, .hero__details, .hero__foot')];
  if (!header || !items.length) return;

  // Paper fade strip under the header: off while the dark hero fills the area
  // behind the header, fading in as the hero's bottom edge scrolls through it.
  const fadeLayer = document.querySelector('.header-fade');
  const hero = document.querySelector('.hero');

  // Hero text fades over this many pixels just before it reaches the header.
  const FADE_PX = 20;
  let queued = false;

  function update() {
    queued = false;
    if (fadeLayer && hero) {
      const zoneBottom = fadeLayer.getBoundingClientRect().bottom;
      const heroBottom = hero.getBoundingClientRect().bottom;
      fadeLayer.style.opacity = Math.min(1, Math.max(0, (zoneBottom - heroBottom) / zoneBottom)).toFixed(3);
    }
    const headerBottom = header.getBoundingClientRect().bottom;
    const zone = FADE_PX;
    for (const el of items) {
      const top = el.getBoundingClientRect().top;
      const t = (top - headerBottom) / zone; // 1+ = clear of the header, 0 = touching it
      el.style.opacity = Math.min(1, Math.max(0, t)).toFixed(3);
    }
  }

  window.addEventListener('scroll', () => {
    if (!queued) { queued = true; requestAnimationFrame(update); }
  }, { passive: true });
  window.addEventListener('resize', update);
  window.addEventListener('pageshow', update);
  update();
})();
