/* entry point — wires up every feature */

import { initNav } from './nav.js';
import { initTypewriter } from './typewriter.js';
import { initReveal } from './reveal.js';
import { initHeroPlotter } from './hero-plotter.js';
import { initProjectPlots } from './plot-engine.js';

initNav();
initTypewriter();
initReveal();
initHeroPlotter();
initProjectPlots();
