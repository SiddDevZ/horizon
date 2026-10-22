import { S } from './settings.js';
import { G } from './state.js';
import { gl, makeTex, fboFor } from './gl/context.js';
import { buildAtlas, buildShapes } from './gl/glyphs.js';
import { buildPage } from './page.js';
import { stage, cv } from './ui/dom.js';

// the stage rect for the chosen aspect, leaving room for the header and footer
function stageBox() {
  const vw = innerWidth, vh = innerHeight;
  if (S.aspect === 'fill') return { x: 0, y: 0, w: vw, h: vh };
  const [a, b] = S.aspect.split(':').map(Number);
  const rec = document.body.classList.contains('rec');
  const mt = rec ? 20 : 60, mb = rec ? 20 : (vw < 640 ? 84 : 56), mx = vw < 640 ? 12 : 24;
  const aw = vw - mx * 2, ah = vh - mt - mb;
  let w = aw, h = aw * b / a;
  if (h > ah) { h = ah; w = ah * a / b; }
  return { x: Math.round((vw - w) / 2), y: Math.round(mt + (ah - h) / 2), w: Math.round(w), h: Math.round(h) };
}

export function layout() {
  const box = stageBox();
  stage.style.left = box.x + 'px'; stage.style.top = box.y + 'px';
  stage.style.width = box.w + 'px'; stage.style.height = box.h + 'px';
  const dpr = G.dpr;
  G.W = Math.max(1, Math.round(box.w * dpr)); G.H = Math.max(1, Math.round(box.h * dpr));
  if (cv.width !== G.W || cv.height !== G.H) { cv.width = G.W; cv.height = G.H; }
  G.cols = Math.max(1, Math.floor(G.W / G.cw)); G.rows = Math.max(1, Math.floor(G.H / G.ch));
  G.gw = G.cols * G.cw; G.gh = G.rows * G.ch;
  G.offX = Math.floor((G.W - G.gw) / 2); G.offY = Math.floor((G.H - G.gh) / 2);
  G.unit = Math.min(G.gw * (G.gh > G.gw ? 1.12 : 1), G.gh);
  G.rect = box;
  if (G.tData) { gl.deleteTexture(G.tData); gl.deleteFramebuffer(G.fbo); }
  G.tData = makeTex(G.cols, G.rows); G.fbo = fboFor(G.tData);
  buildPage();
}

export function rebuildGlyphs() { buildAtlas(); buildShapes(); layout(); }
