import { THEMES, ROUT } from './config.js';
import { S } from './settings.js';
import { hex, DEG } from './util.js';

// grid, atlas and gpu resources
export const G = {
  dpr: 1, cw: 8, ch: 13, cols: 1, rows: 1, offX: 0, offY: 0, gw: 1, gh: 1, unit: 1, W: 1, H: 1,
  fbo: null, tData: null, atlas: null, shape: null, perRow: 1, rampIdx: [], rect: null,
  page: null, tPage: null, pageDirty: false, pageTotal: 0, box: [0, 0, 1, 1]
};

// the hole: position, spring velocity, disk orientation, feed kick and pulse
export const H = {
  x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0,
  tilt: S.tilt * DEG, roll: -0.09, rollT: -0.09,
  kick: 0, kickV: 0, eaten: 0, pulseT: 9, pulseA: 0, spinT: 0
};

// per frame values handed to the shaders
export const U = { rs: 0, disk: 0, rout: ROUT, flash: 1, dot: 0 };

// clocks: intro timeline, sim time, wall time, smoothed hole speed
export const st = { paused: false, intro: 0, sim: 0, real: 0, speed: 0 };

export const ptr = { tx: 0, ty: 0, real: false, lastMove: -1e9, down: false, dragging: false, moved: false, sx: 0, sy: 0, lx: 0, ly: 0, t0: 0 };

// supersampling drops from 6 rays to 1 per cell if frames run slow
export const perf = { ss: 6, slow: 0 };

export const parts = [];

// current colors, eased toward the active theme every frame
export const col = { bg: hex(THEMES.stage.bg), ink: hex(THEMES.stage.ink), pink: hex(THEMES.stage.pink) };
