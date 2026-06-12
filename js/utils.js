/* shared helpers: motion preference, ink palette, seeded rng, wobble */

export const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* read the inks from :root so CSS stays the single source of truth */
const css = getComputedStyle(document.documentElement);
export const INK    = css.getPropertyValue('--ink').trim()    || '#2a2140';
export const PINK   = css.getPropertyValue('--pink').trim()   || '#d76fa7';
export const PURPLE = css.getPropertyValue('--purple').trim() || '#8b6ed0';
export const BLUE   = css.getPropertyValue('--blue').trim()   || '#5b8ed6';
export const YELLOW = css.getPropertyValue('--yellow').trim() || '#e78a00';

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
