import { THEMES, VIEWS } from '../config.js';
import { S, save, reduced } from '../settings.js';
import { H, U, st, ptr, col } from '../state.js';
import { $, clamp, hex } from '../util.js';
import { eat } from '../sim/eat.js';
import { buildPage } from '../page.js';
import { layout } from '../layout.js';
import { stage, el } from './dom.js';
import { HINT, HINT_OFF, toast, showHint } from './hud.js';
import { syncRange, placeInd } from './controls.js';
import { resetPointers } from './pointer.js';

export function feed() {
  if (U.rs < 0.2) return;
  H.kickV += 4.2;
  H.pulseT = 0; H.pulseA = 3.2;
  if (S.eat && !reduced()) setTimeout(() => eat(0, true), 60);
}

export function restore(msg = true) {
  buildPage();
  if (msg) toast('Page restored.');
}

export function replay() {
  st.intro = 0; H.kick = H.kickV = 0; H.pulseA = 0;
  H.x = H.y = H.vx = H.vy = 0; ptr.real = false;
  restore(false);
}

export function view(i) {
  const v = VIEWS[i]; S.tilt = v.tilt; H.rollT = v.roll; save();
  syncRange($('#s-tilt'));
  toast(`${v.name}.`);
}

export function setMass(m) { S.mass = clamp(m, 0.4, 1.8); syncRange($('#s-mass')); save(); }

export function applyTheme(instant) {
  const t = THEMES[S.theme] || THEMES.stage;
  document.documentElement.dataset.theme = S.theme;
  document.querySelector('meta[name="theme-color"]').content = t.meta;
  if (instant) for (const k of ['bg', 'ink', 'pink']) col[k] = hex(t[k]);
}

export function applyMouse(announce) {
  if (!S.mouse) {
    ptr.real = false; ptr.down = false; ptr.dragging = false; resetPointers();
    stage.classList.remove('dragging');
  }
  stage.classList.toggle('nomouse', !S.mouse);
  el.hint.textContent = S.mouse ? HINT : HINT_OFF;
  if (announce) {
    if (!S.mouse) showHint(); else el.hint.classList.remove('gone');
    toast(S.mouse ? 'Mouse steers the hole.' : 'Mouse ignored. The hole drifts on its own.');
  }
}

export function setPaused(v) {
  st.paused = v;
  el.play.setAttribute('aria-label', v ? 'Play' : 'Pause');
  el.play.querySelector('.i-pause').toggleAttribute('hidden', v);
  el.play.querySelector('.i-play').toggleAttribute('hidden', !v);
}

export function setPanel(open) {
  el.panel.classList.toggle('open', open);
  el.gear.setAttribute('aria-expanded', String(open));
  if (open) requestAnimationFrame(() => document.querySelectorAll('.seg').forEach(placeInd));
}

// record mode hides every bit of chrome for a clean capture
export function rec(on) {
  document.body.classList.toggle('rec', on);
  if (S.aspect !== 'fill') layout();
  $('#hide').setAttribute('aria-label', on ? 'Show interface' : 'Hide interface for recording');
  if (on) { setPanel(false); toast('Interface hidden. Press H to show it.'); }
}
export const isRec = () => document.body.classList.contains('rec');
