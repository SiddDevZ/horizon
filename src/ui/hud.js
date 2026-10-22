import { H } from '../state.js';
import { el, isTouch } from './dom.js';

export const HINT = isTouch ? 'Tap to feed. Drag to tilt. Pinch for mass.' : 'Click to feed. Drag to tilt. Scroll for mass.';
export const HINT_OFF = 'Pointer off. M to turn it on. Up, Down for mass. F to feed.';

let hintGone = false;
export const dropHint = () => { if (!hintGone) { hintGone = true; el.hint.classList.add('gone'); } };
export const showHint = () => { hintGone = false; el.hint.classList.remove('gone'); };

let specT = 0, lastEaten = -1;
export function setSpec() {
  lastEaten = H.eaten;
  const n = String(H.eaten).padStart(4, '0');
  el.spec.innerHTML = `<span class="n">Event horizon.</span> ${n} letters eaten.`;
  // screen readers hear the count once it settles, not every frame
  clearTimeout(specT);
  specT = setTimeout(() => { el.specSr.textContent = `${H.eaten} letters eaten.`; }, 1500);
}
export function syncSpec() { if (H.eaten !== lastEaten) setSpec(); }

let toastT = 0;
export function toast(msg) {
  el.toast.textContent = msg; el.toast.classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(() => el.toast.classList.remove('on'), 1800);
}
