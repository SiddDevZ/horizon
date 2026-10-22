import { S, save } from '../settings.js';
import { G, H, st, ptr } from '../state.js';
import { $, clamp } from '../util.js';
import { stage } from './dom.js';
import { dropHint } from './hud.js';
import { feed, setMass } from './actions.js';
import { syncRange } from './controls.js';

const pointers = new Map();
let pinch = null;

export function resetPointers() { pinch = null; pointers.clear(); }

// client pixels to the hole's screen units, origin at the center of the grid
function toUnit(e) {
  const r = G.rect || { x: 0, y: 0, w: innerWidth, h: innerHeight };
  const dpr = G.dpr;
  const x = ((e.clientX - r.x) * dpr - G.offX - G.gw / 2) / G.unit;
  const y = -((e.clientY - r.y) * dpr - G.offY - G.gh / 2) / G.unit;
  return [x, y];
}

// mouse: move steers, drag tilts, click feeds, wheel sets mass. touch: drag steers, tap feeds, pinch sets mass
export function initPointer() {
  stage.addEventListener('pointermove', (e) => {
    if (!S.mouse) return;
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      setMass(pinch.m * Math.hypot(a.x - b.x, a.y - b.y) / pinch.d);
      return;
    }
    const touchDrag = e.pointerType !== 'mouse';
    if (ptr.down && !touchDrag) {
      const dx = e.clientX - ptr.lx, dy = e.clientY - ptr.ly;
      if (!ptr.dragging && Math.hypot(e.clientX - ptr.sx, e.clientY - ptr.sy) > 6) { ptr.dragging = true; stage.classList.add('dragging'); dropHint(); }
      if (ptr.dragging) {
        S.tilt = clamp(S.tilt - dy * 0.35, 0, 88);
        H.rollT = clamp(H.rollT - dx * 0.004, -1.2, 1.2);
        syncRange($('#s-tilt')); save();
      }
      ptr.lx = e.clientX; ptr.ly = e.clientY;
      return;
    }
    const [x, y] = toUnit(e);
    ptr.tx = x; ptr.ty = y; ptr.real = true; ptr.lastMove = st.real;
    if (ptr.down && Math.hypot(e.clientX - ptr.sx, e.clientY - ptr.sy) > 6) { ptr.dragging = false; ptr.moved = true; }
  });

  stage.addEventListener('pointerdown', (e) => {
    if (!S.mouse) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try { stage.setPointerCapture(e.pointerId); } catch (err) {}
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinch = { d: Math.max(10, Math.hypot(a.x - b.x, a.y - b.y)), m: S.mass };
      ptr.down = false; ptr.dragging = false; return;
    }
    const [x, y] = toUnit(e);
    if (e.pointerType !== 'mouse') { ptr.tx = x; ptr.ty = y; ptr.real = true; ptr.lastMove = st.real; }
    ptr.down = true; ptr.dragging = false; ptr.moved = false; ptr.sx = ptr.lx = e.clientX; ptr.sy = ptr.ly = e.clientY; ptr.t0 = performance.now();
  });

  const endPointer = (e) => {
    pointers.delete(e.pointerId);
    if (!S.mouse) return;
    if (pinch) { if (pointers.size < 2) pinch = null; ptr.down = false; return; }
    if (!ptr.down) return;
    ptr.down = false;
    stage.classList.remove('dragging');
    const wasDrag = ptr.dragging || ptr.moved;
    ptr.dragging = false;
    if (!wasDrag && e.type === 'pointerup' && performance.now() - ptr.t0 < 450) { dropHint(); feed(); }
  };
  stage.addEventListener('pointerup', endPointer);
  stage.addEventListener('pointercancel', endPointer);
  // leaving the stage hands the hole back to the idle drift sooner
  stage.addEventListener('pointerleave', (e) => { if (S.mouse && e.pointerType === 'mouse' && !ptr.down) ptr.lastMove = st.real - 2; });
  stage.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (!S.mouse) return;
    const d = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    setMass(S.mass * Math.exp(-d * 0.0012));
    dropHint();
  }, { passive: false });
  stage.addEventListener('contextmenu', (e) => e.preventDefault());
}
