/* the name garden's model, with no SVG: a pixel mask of some text,
   a stochastic L-system grammar, and a turtle that grows plants from
   it while steering every stem to stay inside the mask.
   hero-garden.js draws what growGarden() returns. */

import { mulberry32 } from './utils.js';

/* where the letters are: a pixel mask of text rendered in a font */
export class TextMask {
  constructor(width, height, bits) {
    this.width = width;
    this.height = height;
    this.bits = bits;
  }

  static fromText(text, font, baseline, width, height) {
    try {
      const c = document.createElement('canvas');
      c.width = width; c.height = height;
      const ctx = c.getContext('2d');
      ctx.font = font;
      ctx.fillText(text, 0, baseline);
      const img = ctx.getImageData(0, 0, width, height).data;
      const bits = new Uint8Array(width * height);
      let filled = 0;
      for (let i = 0; i < bits.length; i++) if (img[i * 4 + 3] > 160) { bits[i] = 1; filled++; }
      return filled ? new TextMask(width, height, bits) : null;
    } catch (e) {
      return null; // canvas unavailable: no garden, the name still shows
    }
  }

  has(x, y) {
    x = Math.round(x); y = Math.round(y);
    return x >= 0 && y >= 0 && x < this.width && y < this.height && this.bits[y * this.width + x] === 1;
  }

  /* a random point inside the mask, or null after `tries` misses */
  sample(rng, tries = 200) {
    for (let i = 0; i < tries; i++) {
      const x = rng() * this.width, y = rng() * this.height;
      if (this.has(x, y)) return { x, y };
    }
    return null;
  }
}

/* a stochastic L-system: each F is rewritten by a randomly chosen rule */
export class LSystem {
  constructor(rules, generations) {
    this.rules = rules;
    this.generations = generations;
  }

  expand(rng, axiom = 'F') {
    let str = axiom;
    for (let g = 0; g < this.generations; g++) {
      let next = '';
      for (const ch of str) next += ch === 'F' ? this.rules[Math.floor(rng() * this.rules.length)] : ch;
      str = next;
    }
    return str;
  }
}

export const GARDEN_RULES = ['F[+F]F[-F]F', 'F[+F]F', 'F[-F]F', 'F[+F][-F]F'];
export const GARDEN_GENERATIONS = 3;

const STEER = [0, 0.35, -0.35, 0.7, -0.7, 1.05, -1.05, 1.4, -1.4]; // turns tried, smallest first
const ROOT_SPACING = 34;
const STEP_MS = 20;       // animation delay per stem segment
const PLANT_MS = 110;     // stagger between plants

/* grow `count` plants inside `mask`. returns stems (line segments) and
   flowers, each with an animation delay so the garden grows in order. */
export function growGarden({ seed, count, mask, rules = GARDEN_RULES, generations = GARDEN_GENERATIONS }) {
  const rng = mulberry32(seed);
  const system = new LSystem(rules, generations);
  const segs = [], flowers = [];

  const roots = [];
  for (let tries = 0; roots.length < count && tries < 6000; tries++) {
    const p = mask.sample(rng, 1);
    if (p && roots.every((r) => Math.hypot(r.x - p.x, r.y - p.y) > ROOT_SPACING)) roots.push(p);
  }
  roots.sort((a, b) => a.x - b.x);

  roots.forEach((root, i) => {
    const plant = turtle(system.expand(rng), root, rng, mask, i * PLANT_MS);
    segs.push(...plant.segs);
    flowers.push(...plant.flowers);
  });
  return { segs, flowers };
}

/* interpret an L-system string: F steps forward (steering to stay in the
   mask), +/- turn, [ ] push/pop a branch; flowers bloom at branch tips */
function turtle(str, root, rng, mask, start) {
  const segs = [], flowers = [], stack = [];
  const len = 4 + rng() * 1.5, turn = 0.42 + rng() * 0.12, color = Math.floor(rng() * 3);
  let x = root.x, y = root.y, a = rng() * Math.PI * 2, dead = false, step = 0;
  const bloom = (c) => flowers.push(flower(x, y, rng, c, start + step * STEP_MS + 120));

  for (const ch of str) {
    if (ch === 'F') {
      if (dead) continue;
      const next = steer(x, y, a, len, mask);
      if (!next) { dead = true; continue; }
      segs.push({ x1: x, y1: y, x2: next.x, y2: next.y, delay: start + step * STEP_MS });
      ({ x, y, a } = next);
      step++;
    } else if (ch === '+') a += turn + (rng() - 0.5) * 0.2;
    else if (ch === '-') a -= turn + (rng() - 0.5) * 0.2;
    else if (ch === '[') stack.push({ x, y, a, dead });
    else if (ch === ']') {
      if (!dead && rng() < 0.5) bloom(rng() < 0.7 ? color : Math.floor(rng() * 3));
      ({ x, y, a, dead } = stack.pop());
    }
  }
  if (!dead) bloom(color);
  return { segs, flowers };
}

/* the smallest turn that keeps the next step on a letter, or null */
function steer(x, y, a, len, mask) {
  for (const t of STEER) {
    const na = a + t, nx = x + Math.cos(na) * len, ny = y + Math.sin(na) * len;
    if (mask.has(nx, ny)) return { x: nx, y: ny, a: na };
  }
  return null;
}

/* five round petals around a bud; `color` indexes pink / purple / blue */
function flower(x, y, rng, color, delay) {
  const size = 4.2 + rng() * 3, rot = rng() * Math.PI * 2;
  const petals = [];
  for (let i = 0; i < 5; i++) {
    const ang = rot + i * (Math.PI * 2 / 5);
    petals.push([x + Math.cos(ang) * size, y + Math.sin(ang) * size]);
  }
  return { x, y, r: size * 0.72, c: size * 0.5, color, delay, petals };
}
