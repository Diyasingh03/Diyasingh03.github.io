/* entry point — wires up every feature */

import { initNav } from './nav.js';
import { initTheme } from './theme.js';
import { initInks } from './inks.js';
import { initReveal } from './reveal.js';
import { initHeroPlotter } from './hero-plotter.js';
import { initHeroGarden } from './hero-garden.js';
import { initHeroButterflies } from './hero-butterflies.js';
import { initProjectPlots } from './plot-engine.js';
import { initIdleMeadow } from './idle-meadow.js';

initNav();
initInks();
initTheme();
initReveal();
initHeroPlotter();
initHeroGarden();
initHeroButterflies();
initProjectPlots();
initIdleMeadow();
