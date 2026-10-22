import { $ } from '../util.js';

export const stage = $('#stage'), cv = $('#cv');
export const el = {
  spec: $('#spec'), specSr: $('#specSr'), hint: $('#hint'), stats: $('#stats'), mass: $('#mass'),
  toast: $('#toast'), panel: $('#panel'), gear: $('#gear'), play: $('#play')
};

export const isTouch = matchMedia('(pointer: coarse)').matches;
