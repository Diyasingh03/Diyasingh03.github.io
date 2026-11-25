/* entry point — wires up every feature */

import { initNav } from './nav.js';
import { initInks } from './inks.js';
import { initReveal } from './reveal.js';
import { initHeroPlotter } from './hero-plotter.js';
import { initHeroGarden } from './hero-garden.js';
import { initProjectPlots } from './plot-engine.js';

initNav();
initInks();
initReveal();
initHeroPlotter();
initHeroGarden();
initProjectPlots();
