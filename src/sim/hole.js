import { K, CAM_D, PAGE_D, RIN, ROUT } from '../config.js';
import { reduced } from '../settings.js';
import { G, H } from '../state.js';
import { ss, bump, lerp } from '../util.js';

// intro: a calm page, a pink point, then the mass arrives and the disk lights from the inside out
export function introAt(t) {
  if (reduced()) t = 99;
  return {
    m: ss(0.42, 2.05, t),
    dot: ss(0.28, 0.42, t) * (1 - ss(0.95, 1.35, t)),
    disk: ss(0.8, 1.55, t),
    rout: lerp(RIN + 0.6, ROUT, ss(0.85, 2.35, t)),
    flash: 1 + 0.4 * bump(t, 1.85, 3.0),
    eat: t > 2.8
  };
}

// disk normal n and in-plane axes u, v from the current tilt and roll
export function diskBasis() {
  const a = H.tilt, r = H.roll;
  const n0 = [0, Math.cos(a), -Math.sin(a)];
  const rz = (v) => [v[0] * Math.cos(r) - v[1] * Math.sin(r), v[0] * Math.sin(r) + v[1] * Math.cos(r), v[2]];
  const n = rz(n0), u = rz([1, 0, 0]);
  const v = [n[1] * u[2] - n[2] * u[1], n[2] * u[0] - n[0] * u[2], n[0] * u[1] - n[1] * u[0]];
  return { n, u, v };
}

// squared einstein radius of the page plane, in screen units
export const thetaE2 = (rs) => 2 * rs * PAGE_D * CAM_D / (K * K * (CAM_D + PAGE_D));

// screen units to grid cells
export const cellOf = (x, y) => [(G.gw / 2 + x * G.unit) / G.cw, (G.gh / 2 - y * G.unit) / G.ch];
