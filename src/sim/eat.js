import { K, MAXP, TRAIL } from '../config.js';
import { S, reduced } from '../settings.js';
import { G, H, U, st, parts } from '../state.js';
import { clamp, ss, lerp } from '../util.js';
import { diskBasis, thetaE2, cellOf } from './hole.js';

// pull letters off the page near the hole; faster motion eats a wider, hungrier path
export function eat(dt, burst) {
  const rs = U.rs;
  if (!rs || !G.page) return;
  const e2 = thetaE2(rs);
  const R = burst ? 0.11 * Math.sqrt(rs) : 0.04 * Math.sqrt(rs) + 0.015 * clamp(st.speed / 0.6);
  const rate = burst ? 1e9 : 0.7 + 7 * clamp(st.speed / 0.5);
  const [cx, cy] = cellOf(H.x, H.y);
  const rx = Math.ceil(R * G.unit / G.cw) + 1, ry = Math.ceil(R * G.unit / G.ch) + 1;
  const cols = G.cols, rows = G.rows, page = G.page;
  let budget = burst ? 80 : 16;
  for (let r = Math.max(0, Math.floor(cy - ry)); r <= Math.min(rows - 1, Math.ceil(cy + ry)); r++) {
    for (let c = Math.max(0, Math.floor(cx - rx)); c <= Math.min(cols - 1, Math.ceil(cx + rx)); c++) {
      const o = (r * cols + c) * 4;
      if (!page[o + 1]) continue;
      const ux = ((c + 0.5) * G.cw - G.gw / 2) / G.unit - H.x, uy = -((r + 0.5) * G.ch - G.gh / 2) / G.unit - H.y;
      const d = Math.hypot(ux, uy);
      if (d > R) continue;
      const p = burst ? 0.65 : rate * dt * Math.sqrt(1 - d / R);
      if (Math.random() > p) continue;
      page[o + 1] = 0; G.pageDirty = true; H.eaten++;
      spawn(page[o], ux, uy, d, e2);
      if (--budget <= 0) return;
    }
  }
}

// the letter's visible image sits outside the einstein ring, so it peels off from there
function spawn(g, ux, uy, d, e2) {
  if (parts.length >= MAXP || reduced()) return;
  const dir = d > 1e-4 ? [ux / d, uy / d] : [1, 0];
  const th = (d + Math.sqrt(d * d + 4 * e2)) / 2;
  const rel = [dir[0] * th, dir[1] * th];
  const { u, v } = diskBasis();
  const up = [u[0], u[1]], vp = [v[0], v[1] + (v[1] >= 0 ? 0.07 : -0.07)];
  const det = up[0] * vp[1] - up[1] * vp[0];
  let cx = 1, sy = 0;
  if (Math.abs(det) > 1e-3) { cx = (rel[0] * vp[1] - rel[1] * vp[0]) / det; sy = (up[0] * rel[1] - up[1] * rel[0]) / det; }
  else { cx = rel[0]; sy = 0; }
  parts.push({ g, rel, up, vp, phi: Math.atan2(sy, cx), r0: th, age: 0, life: 1.3 + Math.random() * 0.9, hist: [] });
}

// eaten letters spiral in along the disk plane, faster as they get closer
export function stepParts(dt) {
  const rEnd = 2.9 * U.rs / K;
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.age += dt;
    const e = p.age / p.life;
    if (e >= 1) { parts.splice(i, 1); continue; }
    const rho = lerp(p.r0, rEnd, e * e * (1.6 - 0.6 * e));
    p.phi += dt * 2.2 * Math.pow(p.r0 / Math.max(rho, 1e-3), 1.5) * (0.4 + 0.6 * S.spin);
    const ox = rho * (Math.cos(p.phi) * p.up[0] + Math.sin(p.phi) * p.vp[0]);
    const oy = rho * (Math.cos(p.phi) * p.up[1] + Math.sin(p.phi) * p.vp[1]);
    const b = ss(0, 0.4, e);
    p.x = H.x + lerp(p.rel[0], ox, b); p.y = H.y + lerp(p.rel[1], oy, b);
    p.hist.unshift([p.x, p.y]); if (p.hist.length > TRAIL * 2) p.hist.pop();
  }
}
