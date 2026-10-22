import { ASCII, RAMPS, SAMPLE_POINTS } from '../config.js';
import { S } from '../settings.js';
import { G } from '../state.js';
import { clamp } from '../util.js';
import { gl, makeTex } from './context.js';

export const fontsReady = Promise.race([document.fonts.load('400 22px "Martian Mono"'), new Promise((r) => setTimeout(r, 2500))]).catch(() => {});
const fontAt = (px) => `400 ${px}px "Martian Mono", ui-monospace, Menlo, monospace`;

function drawGlyphs(x, glyphs, cw, ch, fpx, perRow) {
  x.font = fontAt(fpx); x.textBaseline = 'middle'; x.textAlign = 'center'; x.fillStyle = '#fff';
  glyphs.forEach((g, i) => { const gx = (i % perRow) * cw, gy = Math.floor(i / perRow) * ch; x.fillText(g, gx + cw / 2, gy + ch / 2 + fpx * 0.04); });
}

// coverage of each printable glyph in six sampling circles, matched against six rays per cell
export function buildShapes() {
  const fpx = 48, c = document.createElement('canvas'), x = c.getContext('2d', { willReadFrequently: true });
  x.font = fontAt(fpx);
  const cw = Math.round(x.measureText('M').width), ch = Math.round(fpx * 13 / 11);
  c.width = cw * 95; c.height = ch;
  drawGlyphs(x, ASCII, cw, ch, fpx, 95);
  const img = x.getImageData(0, 0, c.width, c.height).data;
  const R = 0.21 * cw;
  const vec = ASCII.map((_, g) => SAMPLE_POINTS.map(([fx, fy]) => {
    const cx = g * cw + fx * cw, cy = fy * ch; let sum = 0, n = 0;
    for (let yy = Math.floor(cy - R); yy <= Math.ceil(cy + R); yy++) for (let xx = Math.floor(cx - R); xx <= Math.ceil(cx + R); xx++) {
      if ((xx - cx) ** 2 + (yy - cy) ** 2 > R * R) continue;
      sum += img[(yy * c.width + xx) * 4 + 3] / 255; n++;
    }
    return sum / n;
  }));
  const mx = [0, 1, 2, 3, 4, 5].map((k) => Math.max(1e-3, ...vec.map((v) => v[k])));
  const data = new Uint8Array(95 * 2 * 4);
  vec.forEach((v, g) => {
    for (let k = 0; k < 6; k++) { const row = k < 4 ? 0 : 1, ch2 = k < 4 ? k : k - 4; data[(row * 95 + g) * 4 + ch2] = Math.round(clamp(v[k] / mx[k]) * 255); }
  });
  if (G.shape) gl.deleteTexture(G.shape);
  G.shape = makeTex(95, 2, data);
}

// every printable glyph at the current cell size, packed into one texture
export function buildAtlas() {
  const ramp = RAMPS[S.ramp] || RAMPS.classic;
  const dpr = G.dpr, fpx = S.cell * dpr;
  const c = document.createElement('canvas'), x = c.getContext('2d');
  x.font = fontAt(fpx);
  G.cw = Math.max(2, Math.round(x.measureText('M').width));
  G.ch = Math.max(3, Math.round(S.cell * (13 / 11) * dpr));
  G.perRow = Math.max(1, Math.floor(Math.min(4096, gl.getParameter(gl.MAX_TEXTURE_SIZE)) / G.cw));
  c.width = Math.min(ASCII.length, G.perRow) * G.cw; c.height = Math.ceil(ASCII.length / G.perRow) * G.ch;
  drawGlyphs(x, ASCII, G.cw, G.ch, fpx, G.perRow);
  if (G.atlas) gl.deleteTexture(G.atlas);
  G.atlas = makeTex(c.width, c.height, c);
  G.rampIdx = [...ramp].map((ch) => Math.max(0, ASCII.indexOf(ch)));
}
