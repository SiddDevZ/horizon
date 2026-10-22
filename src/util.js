export const $ = (s) => document.querySelector(s);
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const ss = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const bump = (x, a, b) => { const t = clamp((x - a) / (b - a)); return Math.sin(Math.PI * t); };
export const lerp = (a, b, t) => a + (b - a) * t;
export const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
export const DEG = Math.PI / 180;
