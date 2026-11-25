/* fig. 0 — the name garden: small stochastic L-system plants rooted
   inside the letters of the name. every stem is steered to stay on
   a letter, so the garden grows over the name, not above it.
   petals use the page's pink / purple / blue, so they follow the
   pens picked in the hero plate. */

import { REDUCED_MOTION, mulberry32 } from './utils.js';

const NS = 'http://www.w3.org/2000/svg';
const NAME = 'Diya Singh';
const BASE = 380;                 // text baseline in the svg's units
const MW = 1100, MH = 460;        // mask size, same units
const RULES = ['F[+F]F[-F]F', 'F[+F]F', 'F[-F]F', 'F[+F][-F]F'];
const STEER = [0, 0.35, -0.35, 0.7, -0.7, 1.05, -1.05, 1.4, -1.4];

/* a pixel mask of the name, rendered with the same font as the svg */
function letterMask(font) {
  try {
    const c = document.createElement('canvas');
    c.width = MW; c.height = MH;
    const ctx = c.getContext('2d');
    ctx.font = font;
    ctx.fillText(NAME, 0, BASE);
    const img = ctx.getImageData(0, 0, MW, MH).data;
    const m = new Uint8Array(MW * MH);
    let n = 0;
    for (let i = 0; i < MW * MH; i++) if (img[i * 4 + 3] > 160) { m[i] = 1; n++; }
    return n ? m : null;
  } catch (e) { return null; }
}

function inside(m, x, y) {
  x = Math.round(x); y = Math.round(y);
  return x >= 0 && y >= 0 && x < MW && y < MH && m[y * MW + x] === 1;
}

function grow(seed, count, mask) {
  const rng = mulberry32(seed);
  const segs = [], flowers = [];
  const roots = [];
  for (let tries = 0; roots.length < count && tries < 6000; tries++) {
    const rx = rng() * MW, ry = rng() * MH;
    if (!inside(mask, rx, ry)) continue;
    if (roots.every((r) => Math.hypot(r.x - rx, r.y - ry) > 34)) roots.push({ x: rx, y: ry });
  }
  roots.sort((a, b) => a.x - b.x);

  roots.forEach((root, ri) => {
    let str = 'F';
    for (let g = 0; g < 3; g++) {
      let next = '';
      for (const ch of str) next += ch === 'F' ? RULES[Math.floor(rng() * RULES.length)] : ch;
      str = next;
    }
    const len = 4 + rng() * 1.5, turn = 0.42 + rng() * 0.12;
    const start = ri * 110, color = Math.floor(rng() * 3), stack = [];
    let x = root.x, y = root.y, a = rng() * Math.PI * 2, dead = false, step = 0;
    const bloom = (fx, fy, c) => flowers.push(flower(fx, fy, rng, c, start + step * 20 + 120));

    for (const ch of str) {
      if (ch === 'F') {
        if (dead) continue;
        let nx, ny, ok = false;
        for (const t of STEER) {
          const na = a + t;
          nx = x + Math.cos(na) * len; ny = y + Math.sin(na) * len;
          if (inside(mask, nx, ny)) { a = na; ok = true; break; }
        }
        if (!ok) { dead = true; continue; }
        segs.push({ x1: x, y1: y, x2: nx, y2: ny, delay: start + step * 20 });
        x = nx; y = ny; step++;
      } else if (ch === '+') a += turn + (rng() - 0.5) * 0.2;
      else if (ch === '-') a -= turn + (rng() - 0.5) * 0.2;
      else if (ch === '[') stack.push({ x, y, a, dead });
      else if (ch === ']') {
        if (!dead && rng() < 0.5) bloom(x, y, rng() < 0.7 ? color : Math.floor(rng() * 3));
        ({ x, y, a, dead } = stack.pop());
      }
    }
    if (!dead) bloom(x, y, color);
  });
  return { segs, flowers };
}

function flower(x, y, rng, color, delay) {
  const size = 4.2 + rng() * 3, rot = rng() * Math.PI * 2;
  const petals = [];
  for (let i = 0; i < 5; i++) {
    const ang = rot + i * (Math.PI * 2 / 5);
    petals.push([x + Math.cos(ang) * size, y + Math.sin(ang) * size]);
  }
  return { x, y, r: size * 0.72, c: size * 0.5, color, delay, petals };
}

function el(name, attrs) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  return node;
}

export function initHeroGarden() {
  const layer = document.getElementById('gardenLayer');
  const text = document.querySelector('#heroGarden .garden-name');
  const slider = document.getElementById('gardenPlants');
  const out = document.getElementById('gardenPlantsOut');
  const regrow = document.getElementById('gardenRegrow');
  if (!layer || !text) return;

  let mask = null, seed = 7;

  function render() {
    if (!mask) return;
    const count = Number(slider ? slider.value : 12);
    if (out) out.textContent = count;
    const { segs, flowers } = grow(seed, count, mask);
    const frag = document.createDocumentFragment();
    segs.forEach((s) => {
      const p = el('path', {
        class: 'garden-stem',
        d: `M${s.x1.toFixed(1)} ${s.y1.toFixed(1)}L${s.x2.toFixed(1)} ${s.y2.toFixed(1)}`,
        pathLength: 1,
      });
      if (!REDUCED_MOTION) p.style.animationDelay = `${Math.round(s.delay)}ms`;
      frag.appendChild(p);
    });
    flowers.forEach((f) => {
      const g = el('g', { class: 'garden-flower' });
      if (!REDUCED_MOTION) g.style.animationDelay = `${Math.round(f.delay)}ms`;
      f.petals.forEach(([px, py]) => g.appendChild(el('circle', { class: `petal-${f.color}`, cx: px.toFixed(1), cy: py.toFixed(1), r: f.r.toFixed(1) })));
      g.appendChild(el('circle', { class: 'bud', cx: f.x.toFixed(1), cy: f.y.toFixed(1), r: f.c.toFixed(1) }));
      frag.appendChild(g);
    });
    layer.replaceChildren(frag);

    // the footnote reports this edition's live numbers
    const note = (k, v) => { const n = document.querySelector(`#gardenNote [data-note="${k}"]`); if (n) n.textContent = v; };
    note('plants', count);
    note('flowers', flowers.length);
    note('seed', seed);
  }

  if (slider) slider.addEventListener('input', render);
  if (regrow) regrow.addEventListener('click', () => { seed = 1 + Math.floor(Math.random() * 99998); render(); });

  // measure the letters once the name's font is ready, so the mask matches the svg
  const cs = getComputedStyle(text);
  const font = `${cs.fontWeight} 168px ${cs.fontFamily}`;
  const measure = () => { mask = letterMask(font); render(); };
  if (document.fonts && document.fonts.load) document.fonts.load(font).then(measure, measure);
  else measure();
}
