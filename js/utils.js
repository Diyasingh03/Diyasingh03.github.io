/* shared helpers: motion preference, ink palette, seeded rng, wobble */

export const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* read the inks from :root so CSS stays the single source of truth.
   these are live bindings: refreshInks() re-reads them after the
   visitor picks new pens in the hero (see inks.js). */
function readVar(name, fallback) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}
export let INK    = readVar('--ink', '#2a2140');
export let PINK   = readVar('--pink', '#d76fa7');
export let PURPLE = readVar('--purple', '#8b6ed0');
export let BLUE   = readVar('--blue', '#5b8ed6');
export let YELLOW = readVar('--yellow', '#e78a00');

export function refreshInks() {
  INK = readVar('--ink', INK);
  PINK = readVar('--pink', PINK);
  PURPLE = readVar('--purple', PURPLE);
  BLUE = readVar('--blue', BLUE);
  YELLOW = readVar('--yellow', YELLOW);
}

/* seeded rng (mulberry32) so each plot is reproducible per seed */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomSeed() {
  return Math.floor(Math.random() * 2147483647);
}

/* hand-drawn wobble: displace each point slightly */
export function wobble(pts, rng, amt = 1.2) {
  return pts.map(([x, y]) => [x + (rng() - 0.5) * amt, y + (rng() - 0.5) * amt]);
}
