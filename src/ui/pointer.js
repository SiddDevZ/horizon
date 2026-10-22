import { S, save } from '../settings.js';
import { H, ptr } from '../state.js';
import { $, clamp } from '../util.js';
import { stage } from './dom.js';
import { dropHint } from './hud.js';
import { feed, setMass } from './actions.js';
import { syncRange } from './controls.js';

const pointers = new Map();
let pinch = null;

export function resetPointers() { pinch = null; pointers.clear(); }

// the hole drifts on its own; click or tap feeds, drag tilts, wheel or pinch sets mass
export function initPointer() {
  stage.addEventListener('pointermove', (e) => {
    if (!S.mouse) return;
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      setMass(pinch.m * Math.hypot(a.x - b.x, a.y - b.y) / pinch.d);
      return;
    }
    if (ptr.down) {
      const dx = e.clientX - ptr.lx, dy = e.clientY - ptr.ly;
      if (!ptr.dragging && Math.hypot(e.clientX - ptr.sx, e.clientY - ptr.sy) > 6) { ptr.dragging = true; stage.classList.add('dragging'); dropHint(); }
      if (ptr.dragging) {
        S.tilt = clamp(S.tilt - dy * 0.35, 0, 88);
        H.rollT = clamp(H.rollT - dx * 0.004, -1.2, 1.2);
        syncRange($('#s-tilt')); save();
      }
      ptr.lx = e.clientX; ptr.ly = e.clientY;
    }
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
    ptr.down = true; ptr.dragging = false; ptr.sx = ptr.lx = e.clientX; ptr.sy = ptr.ly = e.clientY; ptr.t0 = performance.now();
  });

  const endPointer = (e) => {
    pointers.delete(e.pointerId);
    if (!S.mouse) return;
    if (pinch) { if (pointers.size < 2) pinch = null; ptr.down = false; return; }
    if (!ptr.down) return;
    ptr.down = false;
    stage.classList.remove('dragging');
    const wasDrag = ptr.dragging;
    ptr.dragging = false;
    if (!wasDrag && e.type === 'pointerup' && performance.now() - ptr.t0 < 450) { dropHint(); feed(); }
  };
  stage.addEventListener('pointerup', endPointer);
  stage.addEventListener('pointercancel', endPointer);
  stage.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (!S.mouse) return;
    const d = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    setMass(S.mass * Math.exp(-d * 0.0012));
    dropHint();
  }, { passive: false });
  stage.addEventListener('contextmenu', (e) => e.preventDefault());
}
