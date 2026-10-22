import { S } from './settings.js';
import { G, H, U, st, perf, parts } from './state.js';
import { initGL } from './gl/context.js';
import { fontsReady } from './gl/glyphs.js';
import { initRenderer, render } from './gl/renderer.js';
import { layout, rebuildGlyphs } from './layout.js';
import { tick } from './sim/tick.js';
import { stage, cv, el } from './ui/dom.js';
import { applyTheme, applyMouse, feed, replay, restore, view, setMass, setPaused } from './ui/actions.js';
import { initControls, placeInd } from './ui/controls.js';
import { initPointer } from './ui/pointer.js';
import { initKeys } from './ui/keys.js';

const placeAll = () => document.querySelectorAll('.seg').forEach(placeInd);

function boot() {
  if (!initGL(cv)) {
    stage.insertAdjacentHTML('beforeend', '<p class="fallback">This demo needs WebGL 2. Try a current Chrome, Safari or Firefox.</p>');
    return;
  }
  initRenderer();
  initControls();
  initPointer();
  initKeys();

  addEventListener('resize', () => {
    const d = Math.min(2, devicePixelRatio || 1);
    if (d !== G.dpr) { G.dpr = d; rebuildGlyphs(); } else layout();
    placeAll();
  });

  // hooks for scripted capture, e.g. __demo.seek(4); __demo.feed()
  window.__demo = {
    feed, replay, restore, view, setMass,
    seek(t) { st.intro = t; },
    pause(v = true) { setPaused(v); },
    get state() { return { intro: st.intro, rs: U.rs, hole: [H.x, H.y], eaten: H.eaten, parts: parts.length, sample: parts.slice(0, 6).map((p) => [+p.x.toFixed(3), +p.y.toFixed(3), +p.r0.toFixed(3), +(p.age / p.life).toFixed(2)]), cols: G.cols, rows: G.rows, ss: perf.ss }; }
  };

  G.dpr = Math.min(2, devicePixelRatio || 1);
  applyTheme(true);
  el.stats.hidden = !S.stats;
  applyMouse(false);
  rebuildGlyphs();

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
    tick(dt);
    render();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame((t) => { last = t; requestAnimationFrame(loop); });
  fontsReady.then(() => { rebuildGlyphs(); placeAll(); });
}

boot();
