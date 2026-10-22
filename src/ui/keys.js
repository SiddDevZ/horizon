import { THEME_ORDER } from '../config.js';
import { S, save } from '../settings.js';
import { st } from '../state.js';
import { el } from './dom.js';
import { toast } from './hud.js';
import { feed, replay, restore, view, setMass, applyMouse, setPaused, setPanel, rec, isRec } from './actions.js';
import { syncSwitch, setSeg } from './controls.js';

export function initKeys() {
  addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) { if (e.key === 'Escape') t.blur(); return; }
    const onButton = t && t.tagName === 'BUTTON';
    const onRadio = t && t.getAttribute && t.getAttribute('role') === 'radio';
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (k === ' ' && !onButton) { e.preventDefault(); setPaused(!st.paused); toast(st.paused ? 'Paused.' : 'Playing.'); }
    else if (k === 'r') restore();
    else if (k === 'a') replay();
    else if (k === 'f') feed();
    else if (k === 'm') { S.mouse = !S.mouse; save(); syncSwitch(document.querySelector('.sw[data-k="mouse"]')); applyMouse(true); }
    else if (k === 'ArrowUp' && !onRadio) { e.preventDefault(); setMass(S.mass * 1.08); }
    else if (k === 'ArrowDown' && !onRadio) { e.preventDefault(); setMass(S.mass / 1.08); }
    else if (k === 'h') rec(!isRec());
    else if (k === 's') setPanel(!el.panel.classList.contains('open'));
    else if (k === 't') setSeg('theme', THEME_ORDER[(THEME_ORDER.indexOf(S.theme) + 1) % THEME_ORDER.length]);
    else if (k === 'Escape') { if (el.panel.classList.contains('open')) { setPanel(false); el.gear.focus(); } else if (isRec()) rec(false); }
    else if (k === '1' || k === '2' || k === '3') view(Number(k) - 1);
  });
}
