// pass 2: expand each cell of the data texture into its glyph from the atlas
export const GLYPH_FS = `#version 300 es
precision highp float;
precision highp int;
out vec4 o;
uniform sampler2D uData, uAtlas;
uniform int uPerRow;
uniform vec3 uBg, uInk, uPink;
uniform float uAccentOn;
uniform vec2 uOff, uCellD, uGrid, uCanvas;
void main(){
  vec2 px = vec2(gl_FragCoord.x, uCanvas.y - gl_FragCoord.y) - uOff;
  vec2 cf = floor(px / uCellD);
  if (cf.x < 0.0 || cf.y < 0.0 || cf.x >= uGrid.x || cf.y >= uGrid.y) { o = vec4(uBg, 1.0); return; }
  ivec2 cell = ivec2(cf);
  vec4 d = texelFetch(uData, ivec2(cell.x, int(uGrid.y) - 1 - cell.y), 0);
  int gi = int(floor(d.r * 255.0 + 0.5));
  if (gi == 0) { o = vec4(uBg, 1.0); return; }
  float tone = d.g;
  vec3 col = uInk; float k;
  if (d.b > 0.5 && uAccentOn > 0.5) { col = uPink; k = max(tone, 0.6); }
  else if (d.a > 0.5) k = tone;
  else k = 0.3 + 0.7 * smoothstep(0.0, 0.85, tone);
  vec2 lp = px - cf * uCellD;
  ivec2 ap = ivec2((gi % uPerRow) * int(uCellD.x) + int(lp.x), (gi / uPerRow) * int(uCellD.y) + int(lp.y));
  float a = texelFetch(uAtlas, ap, 0).a;
  o = vec4(mix(uBg, col, a * k), 1.0);
}`;
