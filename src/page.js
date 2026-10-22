import { ESSAY } from './essay.js';
import { S } from './settings.js';
import { G, H, parts } from './state.js';
import { gl, makeTex } from './gl/context.js';
import { setSpec } from './ui/hud.js';

// keep to printable ascii, the atlas has nothing else
function cleanText(s) {
  return s.replace(/\r/g, '').replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"').replace(/\s*[\u2014\u2013]\s*/g, ', ')
    .replace(/\u2026/g, '...').replace(/\t/g, ' ').replace(/[^\x20-\x7e\n]/g, '');
}

// typesets the text into the grid; r holds the glyph, g says a letter is still on the page
export function buildPage() {
  const cols = G.cols, rows = G.rows;
  const src = cleanText(S.text && S.text.trim().length > 1 ? S.text : ESSAY);
  let paras = src.split(/\n\s*\n/).map((p) => p.replace(/\s*\n\s*/g, ' ').trim()).filter(Boolean);
  // a short text, like a tweet, runs on as one long paragraph instead of stacking copies
  const len = paras.join(' ').length;
  if (len && len < 900) paras = [Array(Math.ceil(cols * rows / len) + 1).fill(paras.join(' ')).join(' ')];
  const mx = Math.max(2, Math.round(cols * 0.045));
  const top = Math.ceil(66 * G.dpr / G.ch), bot = Math.ceil(60 * G.dpr / G.ch);
  const width = Math.max(8, cols - mx * 2);
  const lines = [];
  let guard = 0;
  while (lines.length < rows && guard++ < 60) {
    for (const [pi, p] of paras.entries()) {
      if (guard > 1 && pi === 0 && p === p.toUpperCase()) continue;
      // set like a book: indented paragraphs, no blank lines, so the lens always has letters to bend
      const head = pi === 0 && p === p.toUpperCase();
      const words = p.split(/ +/);
      let line = head || (pi === 0 && lines.length === 0) ? '' : '  ';
      for (let w of words) {
        while (w.length > width) { if (line) { lines.push(line); line = ''; } lines.push(w.slice(0, width)); w = w.slice(width); }
        if (!line.trim()) line += w;
        else if (line.length + 1 + w.length <= width) line += ' ' + w;
        else { lines.push(line); line = w; }
      }
      if (line) lines.push(line);
      if (head) lines.push('');
    }
  }
  G.box = [mx, top, cols - mx, rows - bot];
  const data = new Uint8Array(cols * rows * 4);
  let li = 0;
  for (let r = top; r < rows - bot && li < lines.length; r++, li++) {
    const s = lines[li];
    for (let i = 0; i < s.length && mx + i < cols; i++) {
      const g = s.charCodeAt(i) - 32;
      if (g <= 0) continue;
      const o = (r * cols + mx + i) * 4;
      data[o] = g; data[o + 1] = 255; data[o + 3] = 255;
    }
  }
  G.page = data;
  G.pageTotal = data.reduce((n, v, i) => n + (i % 4 === 1 && v ? 1 : 0), 0);
  if (G.tPage) gl.deleteTexture(G.tPage);
  G.tPage = makeTex(cols, rows, data);
  G.pageDirty = false;
  H.eaten = 0; parts.length = 0;
  setSpec();
}
