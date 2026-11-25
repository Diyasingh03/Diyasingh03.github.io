/* the generative figure algorithms — one per project card, one per file.
   each returns { lines: [{pts, color, width, alpha}], dots: [{x, y, r, color}] }
   and is keyed by the canvas's data-plot attribute. to add a figure, write
   js/plots/<kind>.js exporting <kind>(w, h, rng) and register it here. */

import { rose } from './rose.js';
import { detect } from './detect.js';
import { tree } from './tree.js';
import { lissajous } from './lissajous.js';
import { signal } from './signal.js';
import { threads } from './threads.js';
import { forks } from './forks.js';
import { lsystem } from './lsystem.js';

export const PLOTS = { rose, detect, tree, lissajous, signal, threads, forks, lsystem };
