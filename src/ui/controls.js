import { S, save, resetSettings } from '../settings.js';
import { H, st } from '../state.js';
import { $ } from '../util.js';
import { buildPage } from '../page.js';
import { layout, rebuildGlyphs } from '../layout.js';
import { el } from './dom.js';
import { toast } from './hud.js';
import { applyMouse, applyTheme, replay, restore, rec, isRec, setPaused, setPanel } from './actions.js';

const FMT = {
  mass: (v) => `${v.toFixed(2)}`, bright: (v) => `${Math.round(v * 100)}%`, spin: (v) => `${v.toFixed(2)}×`,
  tilt: (v) => `${Math.round(v)}°`, cell: (v) => `${v} px`
};

/* ---------- sliders ---------- */
export function syncRange(inp) {
  const k = inp.dataset.k, v = Number(S[k]);
  inp.value = v;
  inp.style.setProperty('--v', `${((v - inp.min) / (inp.max - inp.min)) * 100}%`);
  const out = document.getElementById('o-' + k); if (out) out.textContent = FMT[k](v);
}

/* ---------- switches ---------- */
export function syncSwitch(b) { b.setAttribute('aria-checked', String(!!S[b.dataset.k])); }

/* ---------- segmented radios ---------- */
export function placeInd(seg) {
  const ind = seg.querySelector('.ind'); const btns = [...seg.querySelectorAll('button')];
  const i = Math.max(0, btns.findIndex((b) => b.getAttribute('aria-checked') === 'true'));
  ind.style.width = btns[0].offsetWidth + 'px';
  ind.style.transform = `translateX(${btns[i].offsetLeft - 2}px)`;
}
function syncSeg(seg) {
  const k = seg.dataset.k;
  seg.querySelectorAll('button').forEach((b) => { const on = b.dataset.v === S[k]; b.setAttribute('aria-checked', String(on)); b.tabIndex = on ? 0 : -1; });
  placeInd(seg);
}
export function setSeg(k, v) {
  S[k] = v; save();
  const seg = document.querySelector(`.seg[data-k="${k}"]`); if (seg) syncSeg(seg);
  if (k === 'theme') applyTheme(false);
  if (k === 'ramp') rebuildGlyphs();
  if (k === 'aspect') layout();
}

function resetAll() {
  resetSettings();
  document.querySelectorAll('.rng').forEach(syncRange);
  document.querySelectorAll('.sw[data-k]').forEach(syncSwitch);
  document.querySelectorAll('.seg').forEach(syncSeg);
  $('#s-text').value = '';
  el.stats.hidden = !S.stats;
  H.rollT = -0.09;
  applyMouse(false);
  applyTheme(false); rebuildGlyphs();
  toast('Settings reset.');
}

export function initControls() {
  $('#play').addEventListener('click', () => setPaused(!st.paused));
  $('#replay').addEventListener('click', replay);
  $('#restore').addEventListener('click', () => restore());
  $('#hide').addEventListener('click', () => rec(!isRec()));
  el.gear.addEventListener('click', () => setPanel(!el.panel.classList.contains('open')));

  document.querySelectorAll('.rng').forEach((inp) => {
    syncRange(inp);
    inp.addEventListener('input', () => {
      const k = inp.dataset.k; S[k] = Number(inp.value); syncRange(inp); save();
      if (k === 'cell') rebuildGlyphs();
    });
  });

  document.querySelectorAll('.sw[data-k]').forEach((b) => {
    syncSwitch(b);
    b.addEventListener('click', () => {
      const k = b.dataset.k; S[k] = !S[k]; syncSwitch(b); save();
      if (k === 'stats') el.stats.hidden = !S.stats;
      if (k === 'mouse') applyMouse(true);
    });
  });

  document.querySelectorAll('.seg').forEach((seg) => {
    syncSeg(seg);
    const btns = [...seg.querySelectorAll('button')];
    btns.forEach((b, i) => {
      b.addEventListener('click', () => setSeg(seg.dataset.k, b.dataset.v));
      b.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault(); e.stopPropagation();
        const n = btns[(i + (e.key === 'ArrowRight' ? 1 : -1) + btns.length) % btns.length];
        setSeg(seg.dataset.k, n.dataset.v); n.focus();
      });
    });
  });

  const textIn = $('#s-text');
  textIn.value = S.text;
  let textT = 0;
  textIn.addEventListener('input', () => { S.text = textIn.value; save(); clearTimeout(textT); textT = setTimeout(buildPage, 250); });
  $('#useEssay').addEventListener('click', () => { S.text = ''; textIn.value = ''; save(); buildPage(); toast('Back to the essay.'); });

  $('#reset').addEventListener('click', resetAll);
}
