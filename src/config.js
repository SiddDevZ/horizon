/* ---------- glyphs ---------- */
export const RAMPS = { classic: ' .:-=+*#%@', binary: ' 01' };
export const ASCII = Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i));
export const STAR = '*'.charCodeAt(0) - 32;
export const DOT = '.'.charCodeAt(0) - 32;
// six sampling points per cell, shared by the shape matcher and the scene shader
export const SAMPLE_POINTS = [[0.28, 0.2], [0.72, 0.2], [0.28, 0.5], [0.72, 0.5], [0.28, 0.8], [0.72, 0.8]];

/* ---------- physics ---------- */
// lens scale, camera distance, page distance, inner and outer disk radius in units of rs
export const K = 17.5, CAM_D = 50, PAGE_D = 25, RIN = 3.0, ROUT = 9.5;

/* ---------- particles ---------- */
export const MAXP = 900, TRAIL = 4;

/* ---------- settings ---------- */
export const STORAGE_KEY = 'ascii-horizon-v1';
export const DEFAULTS = {
  mass: 0.45, bright: 1, spin: 1, tilt: 9, eat: true, drift: true, mouse: true,
  theme: 'stage', cell: innerWidth < 640 ? 8 : 10, ramp: 'shape', accent: true,
  aspect: 'fill', stats: false, ignoreReduced: false, text: ''
};

export const THEMES = {
  paper: { bg: '#f7f7f4', ink: '#15140f', pink: '#f81a86', meta: '#f7f7f4' },
  stage: { bg: '#12110e', ink: '#f2f1ec', pink: '#ff2b8f', meta: '#12110e' },
  pink: { bg: '#f81a86', ink: '#15140f', pink: '#f7f7f4', meta: '#f81a86' }
};
export const THEME_ORDER = ['stage', 'paper', 'pink'];

export const VIEWS = [
  { tilt: 9, roll: -0.09, name: 'Edge on' },
  { tilt: 30, roll: -0.26, name: 'Tilted' },
  { tilt: 78, roll: 0, name: 'Face on' }
];
