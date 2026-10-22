import { STAR } from '../../config.js';

// one fragment per glyph cell: bend rays around the hole, shade the disk, or read the page where the ray lands
export const SCENE_FS = `#version 300 es
precision highp float;
precision highp int;
out vec4 o0;
uniform vec2 uGrid, uCell, uGridPx;
uniform float uUnit, uTime;
uniform vec2 uHole;
uniform float uK, uRs, uD, uDp;
uniform vec3 uN, uU, uV;
uniform float uDiskW, uRin, uRout, uSpinT, uBright, uHot;
uniform float uPageTone, uGlow, uThetaE, uLens;
uniform vec4 uBox;
uniform vec2 uTaper;
uniform vec4 uPulse;
uniform ivec2 uDotCell;
uniform float uDot;
uniform sampler2D uPage, uShape;
uniform int uSS, uShapeOn, uRampN;
uniform int uRamp[96];
uniform float uCon, uDith;

const vec2 SP[6] = vec2[6](vec2(0.28, 0.2), vec2(0.72, 0.2), vec2(0.28, 0.5), vec2(0.72, 0.5), vec2(0.28, 0.8), vec2(0.72, 0.8));

float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float h3(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float vnoise(vec3 x){
  vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h3(i), h3(i + vec3(1, 0, 0)), f.x), mix(h3(i + vec3(0, 1, 0)), h3(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(h3(i + vec3(0, 0, 1)), h3(i + vec3(1, 0, 1)), f.x), mix(h3(i + vec3(0, 1, 1)), h3(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}

// emission of the disk where a ray crosses its plane; dir points back toward the camera
float diskAt(vec3 x, vec3 dir){
  float rr = length(x);
  float rin = uRin * uRs, rout = uRout * uRs;
  if (rr < rin * 0.9 || rr > rout) return 0.0;
  float rn = rr / uRs;
  float ang = atan(dot(x, uV), dot(x, uU));
  // keplerian shear: inner rings lap the outer ones
  float a2 = ang - mod(2.4 * pow(rn, -1.5) * uSpinT, 6.2831853);
  vec3 c = vec3(cos(a2) * 1.6, sin(a2) * 1.6, rn * 1.25);
  float n = vnoise(c) * 0.5 + vnoise(c * vec3(2.0, 2.0, 3.4) + 7.0) * 0.32 + vnoise(c * vec3(4.0, 4.0, 8.0) + 13.0) * 0.18;
  float bands = 0.12 + 1.45 * smoothstep(0.34, 0.8, n);
  float prof = pow(rin / rr, 1.5) * smoothstep(rin * 0.9, rin * 1.15, rr) * (1.0 - smoothstep(rout * 0.42, rout, rr));
  vec3 vd = normalize(cross(uN, x));
  float beta = clamp(sqrt(0.5 / max(rn - 1.0, 0.4)), 0.0, 0.55);
  float dop = sqrt(1.0 - beta * beta) / (1.0 - beta * dot(vd, dir));
  float grav = sqrt(max(1.0 - 1.0 / rn, 0.05));
  return 2.6 * prof * bands * pow(dop * grav, 2.0);
}

// em: disk light, hp: how much of the page shows through, off: where on the page the ray lands, ring: photon ring
void trace(vec2 q, out float em, out float hp, out vec2 off, out float ring, out float cap){
  em = 0.0; hp = 1.0; off = vec2(0.0); ring = 0.0; cap = 0.0;
  if (uRs < 1e-4) return;
  vec3 ro = vec3(0.0, 0.0, -uD);
  vec3 rd = normalize(vec3(q * uK / uD, 1.0));
  vec3 p = ro, v = rd;
  vec3 hc = cross(p, v);
  float k = 1.5 * uRs * dot(hc, hc);
  float tr = 1.0, rmin = 1e3;
  hp = 0.0;
  for (int i = 0; i < 220; i++) {
    float r = length(p);
    rmin = min(rmin, r);
    if (r < uRs) { tr = 0.0; cap = 1.0; break; }
    float dt = clamp(0.065 * r, 0.04 * uRs, 4.0);
    vec3 a = -k * p / (r * r * r * r * r);
    vec3 pn = p + v * dt + 0.5 * a * dt * dt;
    float rn = length(pn);
    vec3 an = -k * pn / (rn * rn * rn * rn * rn);
    v += 0.5 * (a + an) * dt;
    float s0 = dot(p, uN), s1 = dot(pn, uN);
    if (uDiskW > 0.0 && s0 * s1 <= 0.0 && s0 != s1) {
      vec3 x = mix(p, pn, s0 / (s0 - s1));
      float e = diskAt(x, -normalize(v)) * uDiskW * uBright;
      em += tr * e;
      tr *= 1.0 - clamp(e * 0.45, 0.0, 0.94);
      if (tr < 0.02) break;
    }
    if (pn.z >= uDp) {
      vec3 x = mix(p, pn, (uDp - p.z) / (pn.z - p.z));
      vec3 x0 = ro + rd * ((uDp - ro.z) / rd.z);
      off = (x.xy - x0.xy) * uD / (uK * (uD + uDp));
      hp = tr;
      break;
    }
    p = pn;
    if (rn > uD * 1.7) break;
  }
  ring = uDiskW * 0.7 * exp(-pow((rmin / uRs - 1.53) / 0.045, 2.0));
}
float lumOf(float em, float ring){ return 1.0 - exp(-1.6 * (em + ring)); }

void main(){
  ivec2 fc = ivec2(gl_FragCoord.xy);
  float row = uGrid.y - 1.0 - float(fc.y);
  vec2 cid = vec2(float(fc.x), row);
  vec2 cellTL = cid * uCell;
  float hc = hash(cid + 17.0);
  vec2 qc = (cellTL + uCell * 0.5 - uGridPx * 0.5) / uUnit; qc.y = -qc.y; qc -= uHole;
  float em, hp, rg, cp; vec2 off;
  trace(qc, em, hp, off, rg, cp);
  float lc = lumOf(em, rg);
  float rq = length(qc);
  float rqr = rq * uK;
  bool near = uDiskW > 0.0 && rqr < uRout * uRs * 1.3 + 4.0 * uRs;
  bool full = uSS == 6 && near;
  float s[6];
  float m = lc, tone = lc;
  if (full) {
    m = 0.0; tone = 0.0;
    for (int i = 0; i < 6; i++) {
      vec2 q = (cellTL + uCell * SP[i] - uGridPx * 0.5) / uUnit; q.y = -q.y; q -= uHole;
      float e2, h2, r2, c2; vec2 o2;
      trace(q, e2, h2, o2, r2, c2);
      s[i] = lumOf(e2, r2); m = max(m, s[i]); tone += s[i];
    }
    tone /= 6.0;
  } else {
    for (int i = 0; i < 6; i++) s[i] = lc;
  }

  // the page as this cell sees it through the lens
  int pg_g = 0; float pageT = 0.0;
  bool inBox = cid.x >= uBox.x && cid.y >= uBox.y && cid.x < uBox.z && cid.y < uBox.w;
  if (hp > 0.03 && inBox) {
    // a real point lens shifts the whole page by 1/r; taper the tail so far text stays readable
    float tap = exp(-pow(max(rq - uTaper.x, 0.0) / uTaper.y, 2.0));
    vec2 pc = cid + 0.5 + vec2(off.x, -off.y) * tap * uUnit / uCell;
    float rip = 0.0;
    if (uPulse.y > 0.0) {
      rip = exp(-pow((rq - uPulse.x) / uPulse.z, 2.0));
      vec2 dir = qc / max(rq, 1e-4);
      pc += vec2(dir.x, -dir.y) * uPulse.y * rip;
      rip *= clamp(uPulse.y / 3.0, 0.0, 1.0);
    }
    ivec2 ip = ivec2(floor(pc));
    if (ip.x >= 0 && ip.y >= 0 && ip.x < int(uGrid.x) && ip.y < int(uGrid.y)) {
      vec4 pg = texelFetch(uPage, ip, 0);
      if (pg.g > 0.5) {
        pg_g = int(pg.r * 255.0 + 0.5);
        // the disk lights the page around it; stretched letters near the ring catch more of it
        // the far page stays quiet; letters lensed into the einstein ring light up
        float ringB = uThetaE > 0.0 ? exp(-pow((rq / uThetaE - 1.05) / 0.55, 2.0)) : 0.0;
        float glow = uGlow * uDiskW * exp(-rqr / (uRs * 7.0));
        pageT = mix(uPageTone, 1.0, 0.8 * ringB * uLens) + glow + 0.45 * rip;
        pageT *= min(1.0, hp * 1.15 + 0.05);
      }
    }
  }

  int gi = 0; float outT = 0.0, pink = 0.0, kind = 0.0;
  if (cp > 0.5 && lc < 0.3) { m = 0.0; pg_g = 0; }
  if (m > 0.07 && tone > 0.04) {
    if (uShapeOn == 1 && full && tone > 0.1) {
      vec4 v0 = vec4(s[0], s[1], s[2], s[3]); vec2 v1 = vec2(s[4], s[5]);
      v0 = pow(v0 / m, vec4(uCon)) * m; v1 = pow(v1 / m, vec2(uCon)) * m;
      vec4 dz = vec4(hash(cid + 3.1), hash(cid + 7.7), hash(cid + 11.3), hash(cid + 19.9)) - 0.5;
      vec2 dz2 = vec2(hash(cid + 23.5), hash(cid + 29.1)) - 0.5;
      v0 = max(v0 + dz * uDith * step(0.001, v0), 0.0); v1 = max(v1 + dz2 * uDith * step(0.001, v1), 0.0);
      float best = 1e9;
      for (int g = 1; g < 95; g++) {
        vec4 a = texelFetch(uShape, ivec2(g, 0), 0); vec2 b2 = texelFetch(uShape, ivec2(g, 1), 0).xy;
        vec4 da = a - v0; vec2 db = b2 - v1;
        float dd = dot(da, da) + dot(db, db);
        if (dd < best) { best = dd; gi = g; }
      }
      if (dot(v0, v0) + dot(v1, v1) < best) gi = 0;
    } else {
      int idx = int(clamp(floor(tone * float(uRampN - 1) + 0.5 + (hc - 0.5) * 0.3), 0.0, float(uRampN - 1)));
      gi = uRamp[idx];
    }
    outT = tone;
    pink = em > uHot && hc > 0.3 ? 1.0 : 0.0;
  }
  // a faint disk that resolves to a blank glyph lets the page through
  if (gi == 0 && pg_g > 0) { gi = pg_g; outT = max(pageT, lc); pink = 0.0; kind = 1.0; }
  if (uDot > 0.0 && fc.x == uDotCell.x && int(row) == uDotCell.y) { gi = ${STAR}; pink = 1.0; outT = uDot; kind = 0.0; }
  o0 = vec4(float(gi) / 255.0, clamp(outT, 0.0, 1.0), pink, kind);
}`;
