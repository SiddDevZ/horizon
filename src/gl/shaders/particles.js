// eaten letters, drawn as point sprites over the grid
export const PARTICLE_VS = `#version 300 es
layout(location = 0) in vec2 aPos;
layout(location = 1) in vec3 aInfo;
uniform vec2 uCanvas;
uniform float uSize;
out vec3 vInfo;
void main(){ vInfo = aInfo; gl_Position = vec4(aPos.x / uCanvas.x * 2.0 - 1.0, 1.0 - aPos.y / uCanvas.y * 2.0, 0.0, 1.0); gl_PointSize = ceil(uSize * abs(aInfo.z)); }`;

export const PARTICLE_FS = `#version 300 es
precision highp float;
precision highp int;
in vec3 vInfo;
out vec4 o;
uniform sampler2D uAtlas;
uniform int uPerRow;
uniform vec2 uCellD;
uniform float uSize, uAccentOn;
uniform vec3 uInk, uPink, uBg;
void main(){
  // z carries the letter's scale, its sign says pink
  float sc = abs(vInfo.z), ps = ceil(uSize * sc);
  vec2 lp = (gl_PointCoord * ps - (vec2(ps) - uCellD * sc) * 0.5) / sc;
  if (lp.x < 0.0 || lp.y < 0.0 || lp.x >= uCellD.x || lp.y >= uCellD.y) discard;
  int gi = int(vInfo.x + 0.5);
  ivec2 ap = ivec2((gi % uPerRow) * int(uCellD.x) + int(lp.x), (gi / uPerRow) * int(uCellD.y) + int(lp.y));
  float a = texelFetch(uAtlas, ap, 0).a;
  vec3 c = vInfo.z > 0.0 && uAccentOn > 0.5 ? uPink : uInk;
  // letters knock out the cell behind them so they read over the disk; trail dots do not
  if (vInfo.y > 1.5) { o = vec4(mix(uBg, c, a), (vInfo.y - 2.0) * (0.85 + 0.15 * a)); return; }
  a *= vInfo.y;
  if (a < 0.004) discard;
  o = vec4(c, a);
}`;
