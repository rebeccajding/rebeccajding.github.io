// All Projects: every featured row is scaled and faded by the same function of
// its distance from the viewport's vertical centre, measured in rows (pitch).
(function () {
  const sections = [...document.querySelectorAll('.featured')];
  const pins = document.querySelector('.pins');
  const marker = document.querySelector('.pins__marker');
  if (!sections.length) return;

  const SMALL = 320 / 620; // Figma inactive card width ÷ active card width
  const NAME_GROW = 18 / 15 - 1; // active name 18px vs inactive 15px

  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  const smooth = (t) => t * t * (3 - 2 * t);

  // Fade, shared by every row, measured in viewport pixels from the centre:
  // fully opaque within FADE_HOLD of the centre, then easing out gradually
  // until the row's centre reaches the viewport edge.
  const FADE_HOLD = 0.06; // fraction of half the viewport height

  /**
   * Shared position-based state for any row.
   * rows = distance of the row's centre from the viewport centre, in rows (scale)
   * edge = the same distance as a fraction of half the viewport height (fade)
   */
  function rowState(rows, edge) {
    const t = smooth(clamp01(rows));
    const scale = 1 - (1 - SMALL) * t;
    const nameScale = 1 + NAME_GROW * (1 - t);
    const f = clamp01((edge - FADE_HOLD) / (1 - FADE_HOLD));
    const opacity = 1 - f * f;
    return { scale, nameScale, opacity };
  }

  // Each .featured section pins its own stage and slides its own track.
  const scrollers = sections.map((section) => {
    const rows = [...section.querySelectorAll('.row')];
    rows.forEach((row, i) => row.style.setProperty('--i', i));
    return {
      section,
      rows,
      stage: section.querySelector('.featured__stage'),
      track: section.querySelector('.featured__track'),
    };
  });

  /**
   * Maps scroll progress (in projects) to the track position. Around each
   * whole number the track pauses for `hold` of a step, keeping that project
   * centred at full size and opacity; in between it moves at a steady rate.
   */
  function trackPosition(steps, hold, last, tail) {
    const s = Math.min(last + tail, Math.max(0, steps));
    const shifted = s + hold / 2; // pause straddles each centre
    const k = Math.floor(shifted);
    const t = clamp01((shifted - k - hold) / (1 - hold));
    return Math.min(last, k + t);
  }

  let queued = false;

  function updateScroller({ section, rows, stage, track }) {
    const mid = window.innerHeight / 2;
    const pitch = rows[0].getBoundingClientRect().height; // visible spacing between projects
    const last = rows.length - 1;
    const css = getComputedStyle(section);
    const hold = parseFloat(css.getPropertyValue('--hold')) || 0;
    const tail = hold * (parseFloat(css.getPropertyValue('--hold-tail')) || 0.5);
    // Scroll distance per project = extra section height ÷ number of steps.
    const scrollPitch = (section.offsetHeight - stage.offsetHeight) / (last + tail);
    const scrolled = window.scrollY - section.offsetTop;
    const pos = trackPosition(scrolled / scrollPitch, hold, last, tail); // 0 = first project centred

    track.style.setProperty('--offset', (pos * pitch).toFixed(2));

    for (const row of rows) {
      const r = row.getBoundingClientRect();
      const dist = Math.abs(r.top + r.height / 2 - mid);
      const s = rowState(dist / pitch, dist / mid);
      row.style.opacity = s.opacity.toFixed(3);
      row.style.setProperty('--k', s.scale.toFixed(4));
      row.style.setProperty('--name-k', s.nameScale.toFixed(4));
    }

    // Hint + rail are shown while this section is pinned, fading out over 30%
    // of the viewport before it pins and after it lets go.
    const fade = window.innerHeight * 0.3;
    const before = -scrolled / fade;
    const past = (scrolled - scrollPitch * (last + tail)) / fade;
    return { progress: last ? pos / last : 0, visible: 1 - clamp01(Math.max(before, past)) };
  }

  function update() {
    queued = false;
    // The rail follows whichever section is most in view.
    let best = { progress: 0, visible: 0 };
    for (const sc of scrollers) {
      const s = updateScroller(sc);
      if (s.visible > best.visible) best = s;
    }
    marker.style.setProperty('--progress', best.progress.toFixed(4));
    pins.style.opacity = best.visible.toFixed(3);
  }

  const schedule = () => {
    if (!queued) { queued = true; requestAnimationFrame(update); }
  };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', update);

  // Open with Maggie centred, except when returning via Back/Forward, where
  // the browser restores the previous scroll position.
  const nav = performance.getEntriesByType('navigation')[0];
  if (!nav || nav.type !== 'back_forward') window.scrollTo(0, 0);
  window.addEventListener('pageshow', update);
  update();
})();
