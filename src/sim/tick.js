import { THEMES } from '../config.js';
import { S, reduced } from '../settings.js';
import { G, H, U, st, ptr, perf, col } from '../state.js';
import { clamp, ss, lerp, hex, DEG } from '../util.js';
import { el } from '../ui/dom.js';
import { syncSpec } from '../ui/hud.js';
import { introAt } from './hole.js';
import { eat, stepParts } from './eat.js';

let fpsE = 60, statT = 0;

export function tick(dt) {
  st.real += dt;
  if (perf.ss === 6) { perf.slow = dt > 0.022 ? perf.slow + dt : Math.max(0, perf.slow - dt * 0.5); if (perf.slow > 1.5) perf.ss = 1; }
  const rm = reduced();
  const sdt = st.paused ? 0 : dt;
  st.intro += sdt; st.sim += sdt;
  const I = introAt(st.intro);

  // pointer: real when recent, otherwise a slow phantom so a hands-off take still moves
  const idle = st.real - ptr.lastMove > 2.5;
  const live = S.mouse && ptr.real;
  let tx = ptr.tx, ty = ptr.ty;
  if (!live || idle) {
    if (S.drift && !rm) {
      const t = st.sim, w = ss(3.2, 6.5, st.intro);
      tx = w * (0.3 * Math.sin(t * 0.17) + 0.07 * Math.sin(t * 0.43 + 1));
      ty = w * (0.1 * Math.sin(t * 0.23 + 0.6) + 0.04 * Math.sin(t * 0.51));
      if (live) { tx = lerp(ptr.tx, tx, ss(2.5, 5, st.real - ptr.lastMove)); ty = lerp(ptr.ty, ty, ss(2.5, 5, st.real - ptr.lastMove)); }
    } else if (!live) { tx = H.tx; ty = H.ty; }
  }
  const lim = [G.gw / 2 / G.unit - 0.04, G.gh / 2 / G.unit - 0.04];
  H.tx = clamp(tx, -lim[0], lim[0]); H.ty = clamp(ty, -lim[1], lim[1]);
  // a slightly underdamped spring follows the target
  if (!ptr.dragging && sdt > 0) {
    const k = 34, c = 2 * Math.sqrt(k) * 0.92;
    const h = Math.min(sdt, 1 / 30);
    H.vx += ((H.tx - H.x) * k - H.vx * c) * h; H.vy += ((H.ty - H.y) * k - H.vy * c) * h;
    H.x += H.vx * h; H.y += H.vy * h;
  }
  st.speed += (Math.hypot(H.vx, H.vy) - st.speed) * (1 - Math.exp(-dt * 8));

  // tilt and roll settle toward their targets
  H.tilt += (S.tilt * DEG - H.tilt) * (1 - Math.exp(-dt * 6));
  H.roll += (H.rollT - H.roll) * (1 - Math.exp(-dt * 6));

  // feeding kicks the mass, a damped spring brings it back
  H.kickV += (-H.kick * 60 - H.kickV * 9) * Math.min(sdt, 1 / 30);
  H.kick += H.kickV * Math.min(sdt, 1 / 30);
  H.pulseT += sdt;
  H.spinT += sdt * (rm ? 0 : S.spin);

  U.rs = S.mass * I.m * (1 + H.kick);
  U.disk = I.disk; U.rout = I.rout; U.flash = I.flash; U.dot = I.dot;

  if (I.eat && S.eat && sdt > 0 && !rm) eat(sdt, false);
  stepParts(sdt);

  const t = THEMES[S.theme] || THEMES.stage;
  const tk = 1 - Math.exp(-dt * 7);
  for (const key of ['bg', 'ink', 'pink']) { const target = hex(t[key]); for (let i = 0; i < 3; i++) col[key][i] += (target[i] - col[key][i]) * tk; }

  if (S.stats) {
    fpsE += (1 / Math.max(dt, 1e-3) - fpsE) * 0.05;
    if ((statT += dt) > 0.5) { statT = 0; el.stats.textContent = `${Math.round(fpsE)} fps, ${G.cols} by ${G.rows} cells`; }
  }
  syncSpec();
  const mtxt = `M ${(S.mass * (1 + H.kick)).toFixed(2)}`;
  if (el.mass.textContent !== mtxt) el.mass.textContent = mtxt;
}
