import { DEFAULTS, STORAGE_KEY } from './config.js';

export const S = Object.assign({}, DEFAULTS);
try { const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); if (raw) Object.assign(S, raw); } catch (e) {}

let saveT = 0;
export const save = () => { clearTimeout(saveT); saveT = setTimeout(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(S)); } catch (e) {} }, 200); };

export function resetSettings() {
  for (const k of Object.keys(S)) delete S[k];
  Object.assign(S, DEFAULTS);
  try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
}

const mqReduce = matchMedia('(prefers-reduced-motion: reduce)');
export const reduced = () => mqReduce.matches && !S.ignoreReduced;
