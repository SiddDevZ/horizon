import { K, CAM_D, PAGE_D, RIN, MAXP, TRAIL, DOT } from '../config.js';
import { S } from '../settings.js';
import { G, H, U, st, perf, parts, col } from '../state.js';
import { clamp, ss, bump } from '../util.js';
import { diskBasis, thetaE2, cellOf } from '../sim/hole.js';
import { gl, program } from './context.js';
import { SCENE_FS } from './shaders/scene.frag.js';
import { GLYPH_FS } from './shaders/glyph.frag.js';
import { PARTICLE_VS, PARTICLE_FS } from './shaders/particles.js';

let P1, P2, P3, vao, pvao, pbuf, pdata;
const ramp = new Int32Array(96);

export function initRenderer() {
  P1 = program(SCENE_FS); P2 = program(GLYPH_FS); P3 = program(PARTICLE_FS, PARTICLE_VS);
  vao = gl.createVertexArray();
  pvao = gl.createVertexArray(); pbuf = gl.createBuffer();
  // per point: x, y, glyph, alpha, signed scale
  pdata = new Float32Array(MAXP * (TRAIL + 1) * 5);
  gl.bindVertexArray(pvao);
  gl.bindBuffer(gl.ARRAY_BUFFER, pbuf);
  gl.bufferData(gl.ARRAY_BUFFER, pdata.byteLength, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 20, 0);
  gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 20, 8);
  gl.bindVertexArray(null);
}

// pass 1: trace one ray bundle per cell into a cols x rows data texture
function drawScene() {
  gl.bindVertexArray(vao);
  gl.disable(gl.BLEND);
  gl.bindFramebuffer(gl.FRAMEBUFFER, G.fbo);
  gl.viewport(0, 0, G.cols, G.rows);
  gl.useProgram(P1.p);
  const u = P1.u;
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, G.tPage); gl.uniform1i(u.uPage, 0);
  gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, G.shape); gl.uniform1i(u.uShape, 1);
  gl.uniform2f(u.uGrid, G.cols, G.rows);
  gl.uniform2f(u.uCell, G.cw, G.ch);
  gl.uniform2f(u.uGridPx, G.gw, G.gh);
  gl.uniform1f(u.uUnit, G.unit);
  gl.uniform1f(u.uTime, st.sim);
  gl.uniform2f(u.uHole, H.x, H.y);
  gl.uniform1f(u.uK, K); gl.uniform1f(u.uRs, U.rs); gl.uniform1f(u.uD, CAM_D); gl.uniform1f(u.uDp, PAGE_D);
  const B = diskBasis();
  gl.uniform3fv(u.uN, B.n); gl.uniform3fv(u.uU, B.u); gl.uniform3fv(u.uV, B.v);
  gl.uniform1f(u.uDiskW, U.disk);
  gl.uniform1f(u.uRin, RIN * (1 - 0.18 * clamp(S.spin - 1, 0, 1)));
  gl.uniform1f(u.uRout, U.rout);
  gl.uniform1f(u.uSpinT, H.spinT);
  gl.uniform1f(u.uBright, S.bright * U.flash);
  gl.uniform1f(u.uHot, 3.0);
  const dark = S.theme === 'stage';
  gl.uniform1f(u.uPageTone, dark ? 0.4 : 0.5);
  gl.uniform1f(u.uGlow, dark ? 0.16 : 0.1);
  gl.uniform1f(u.uThetaE, Math.sqrt(thetaE2(U.rs)));
  gl.uniform1f(u.uLens, ss(0.05, 0.6, U.rs / Math.max(S.mass, 0.01)));
  gl.uniform4f(u.uBox, G.box[0], G.box[1], G.box[2], G.box[3]);
  const tE = Math.sqrt(thetaE2(Math.max(U.rs, 0.02)));
  gl.uniform2f(u.uTaper, tE * 1.0, tE * 0.38 + 0.015);
  const pr = H.pulseT * 0.95 + 0.05, pa = H.pulseA * Math.exp(-H.pulseT * 1.6);
  gl.uniform4f(u.uPulse, pr, pa > 0.02 ? pa : 0, 0.07, 0);
  const [dcx, dcy] = cellOf(H.x, H.y);
  gl.uniform2i(u.uDotCell, Math.floor(dcx), Math.floor(dcy));
  gl.uniform1f(u.uDot, U.dot);
  gl.uniform1i(u.uSS, perf.ss);
  gl.uniform1i(u.uShapeOn, S.ramp === 'shape' ? 1 : 0);
  ramp.fill(0); G.rampIdx.forEach((x, i) => { ramp[i] = x; });
  gl.uniform1iv(u.uRamp, ramp);
  gl.uniform1i(u.uRampN, G.rampIdx.length);
  gl.uniform1f(u.uCon, 2.1); gl.uniform1f(u.uDith, 0.2);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

// pass 2: draw the glyph for every cell to the screen
function drawGlyphs() {
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, G.W, G.H);
  gl.useProgram(P2.p);
  const v = P2.u;
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, G.tData); gl.uniform1i(v.uData, 0);
  gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, G.atlas); gl.uniform1i(v.uAtlas, 2);
  gl.uniform1i(v.uPerRow, G.perRow);
  gl.uniform3fv(v.uBg, col.bg); gl.uniform3fv(v.uInk, col.ink); gl.uniform3fv(v.uPink, col.pink);
  gl.uniform1f(v.uAccentOn, S.accent ? 1 : 0);
  gl.uniform2f(v.uOff, G.offX, G.offY);
  gl.uniform2f(v.uCellD, G.cw, G.ch);
  gl.uniform2f(v.uGrid, G.cols, G.rows);
  gl.uniform2f(v.uCanvas, G.W, G.H);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

// pass 3: eaten letters on top, pink while they are pulled, ink as they fall, a short trail behind
function drawParticles() {
  if (!parts.length) return;
  let n = 0;
  const toPx = (x, y) => [G.offX + G.gw / 2 + x * G.unit, G.offY + G.gh / 2 - y * G.unit];
  for (const p of parts) {
    const e = p.age / p.life;
    const a = ss(0, 0.06, e) * (1 - ss(0.65, 0.92, e));
    for (let k = TRAIL; k >= 1; k--) {
      const h = p.hist[k * 2 - 1]; if (!h) continue;
      const [x, y] = toPx(h[0], h[1]);
      pdata.set([x, y, DOT, a * 0.75 * (1 - k / (TRAIL + 1)), 1], n * 5); n++;
    }
    const [x, y] = toPx(p.x, p.y);
    // lifts off the page toward you, then shrinks as it falls in
    const sc = 1 + 0.45 * bump(e, 0, 0.7) - 0.45 * ss(0.6, 1, e);
    pdata.set([x, y, p.g, 2 + a, (e < 0.8 ? 1 : -1) * sc], n * 5); n++;
  }
  gl.bindVertexArray(pvao);
  gl.bindBuffer(gl.ARRAY_BUFFER, pbuf);
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, pdata, 0, n * 5);
  gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.useProgram(P3.p);
  const w = P3.u;
  gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, G.atlas); gl.uniform1i(w.uAtlas, 2);
  gl.uniform1i(w.uPerRow, G.perRow);
  gl.uniform2f(w.uCellD, G.cw, G.ch);
  gl.uniform2f(w.uCanvas, G.W, G.H);
  gl.uniform1f(w.uSize, Math.max(G.cw, G.ch));
  gl.uniform1f(w.uAccentOn, S.accent ? 1 : 0);
  gl.uniform3fv(w.uInk, col.ink); gl.uniform3fv(w.uPink, col.pink); gl.uniform3fv(w.uBg, col.bg);
  gl.drawArrays(gl.POINTS, 0, n);
  gl.disable(gl.BLEND);
  gl.bindVertexArray(null);
}

export function render() {
  if (G.pageDirty) {
    gl.bindTexture(gl.TEXTURE_2D, G.tPage);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, G.cols, G.rows, gl.RGBA, gl.UNSIGNED_BYTE, G.page);
    G.pageDirty = false;
  }
  drawScene();
  drawGlyphs();
  drawParticles();
}
