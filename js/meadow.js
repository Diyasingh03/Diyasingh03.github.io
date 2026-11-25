/* growMeadow — the model for the idle-cursor garden, no canvas.
   it lays out grass, leafy vines and flowers around a centre, each
   with a birth time that grows with its distance, so the meadow
   spreads outward in rings. idle-meadow.js animates and draws it. */

import { mulberry32 } from './utils.js';

const RADIUS = 230;       // how far the meadow spreads, px
const SPREAD_MS = 4200;   // time for growth to reach the outer edge

/* birth time for something at distance r: outer things come later */
const bornAt = (r, rng) => (r / RADIUS) * SPREAD_MS + rng() * 300;

/* a random point in the disc, denser toward the middle */
function inDisc(rng, cx, cy, bias = 1) {
  const a = rng() * Math.PI * 2, r = Math.pow(rng(), bias) * RADIUS;
  return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, r };
}

/* grass grows in tufts: a clump of tapered blades fanning up from one base */
function grass(rng, cx, cy, count) {
  const tufts = [];
  for (let i = 0; i < count; i++) {
    const p = inDisc(rng, cx, cy, 0.75);
    const rim = 1 - (p.r / RADIUS) * 0.45;            // shorter toward the rim
    const blades = [];
    const n = 5 + Math.floor(rng() * 5);
    for (let k = 0; k < n; k++) {
      const spread = (k / (n - 1) - 0.5) * 1.3;       // fan from left to right
      blades.push({
        dx: (rng() - 0.5) * 5,
        lean: spread + (rng() - 0.5) * 0.35,
        height: (11 + rng() * 14) * rim * (1 - Math.abs(spread) * 0.35), // middle blades tallest
        width: 2 + rng() * 1.4,
        alpha: 0.55 + rng() * 0.35,
      });
    }
    tufts.push({ x: p.x, y: p.y, blades, birth: bornAt(p.r, rng) });
  }
  return tufts;
}

/* vines wander out from the centre in an S-shaped wave and coil into a
   tendril at the tip; leaves sit along them, alternating sides */
function vines(rng, cx, cy, count) {
  const out = [];
  for (let v = 0; v < count; v++) {
    let a = (v / count) * Math.PI * 2 + rng() * 0.5;
    const dir = rng() < 0.5 ? -1 : 1;
    const wave = 0.16 + rng() * 0.12, waveRate = 0.22 + rng() * 0.12, phase = rng() * Math.PI * 2;
    const length = 34 + Math.floor(rng() * 22);
    let x = cx, y = cy;
    const pts = [[x, y]], leaves = [];
    for (let s = 1; s <= length; s++) {
      const f = s / length;
      const coil = f > 0.7 ? Math.pow((f - 0.7) / 0.3, 2) * 0.55 : 0; // tightening spiral at the end
      a += dir * (0.015 + coil) + Math.sin(s * waveRate + phase) * wave * (1 - coil);
      const step = 5 * (1 - coil * 0.6);
      x += Math.cos(a) * step; y += Math.sin(a) * step;
      pts.push([x, y]);
      if (s % 4 === 0 && f < 0.78) {
        const side = (s / 4) % 2 ? 1 : -1;
        leaves.push({ x, y, angle: a + side * 0.9, size: 4 + rng() * 3, at: f });
      }
    }
    const r = Math.hypot(x - cx, y - cy);
    out.push({ pts, leaves, birth: rng() * 300, duration: bornAt(r, rng) + 900 });
  }
  return out;
}

function flowers(rng, cx, cy, count) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const p = inDisc(rng, cx, cy, 0.55);
    out.push({
      x: p.x, y: p.y,
      size: 3 + rng() * 3.5,
      color: Math.floor(rng() * 3),        // pink / purple / blue
      rot: rng() * Math.PI * 2,
      birth: bornAt(p.r, rng) + 500,        // bloom after the grass there
    });
  }
  return out;
}

export function growMeadow(cx, cy, seed = Date.now()) {
  const rng = mulberry32(seed);
  return {
    cx, cy,
    grass: grass(rng, cx, cy, 46),
    vines: vines(rng, cx, cy, 9),
    flowers: flowers(rng, cx, cy, 34),
    doneAt: SPREAD_MS + 1600,              // everything has finished growing
  };
}
