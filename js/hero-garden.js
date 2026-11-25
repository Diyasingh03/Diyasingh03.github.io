/* fig. 0 — the name garden: draws growGarden() over the name in
   #heroGarden. this file is only the view: svg building, the plant
   slider, regrow, and the live footnote. petals use the accent classes
   (.petal-0/1/2), so they follow the pens picked in the hero plate. */

import { REDUCED_MOTION } from './utils.js';
import { TextMask, growGarden } from './lsystem.js';

const NS = 'http://www.w3.org/2000/svg';
const NAME = 'Diya Singh';
const BASE = 380;               // text baseline, in the svg's units
const MASK_W = 1100, MASK_H = 460;

function svg(name, attrs) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  return node;
}

const fixed = (n) => n.toFixed(1);

function stemNode(s) {
  const p = svg('path', {
    class: 'garden-stem',
    d: `M${fixed(s.x1)} ${fixed(s.y1)}L${fixed(s.x2)} ${fixed(s.y2)}`,
    pathLength: 1,
  });
  if (!REDUCED_MOTION) p.style.animationDelay = `${Math.round(s.delay)}ms`;
  return p;
}

function flowerNode(f) {
  const g = svg('g', { class: 'garden-flower' });
  if (!REDUCED_MOTION) g.style.animationDelay = `${Math.round(f.delay)}ms`;
  f.petals.forEach(([px, py]) => g.appendChild(svg('circle', { class: `petal-${f.color}`, cx: fixed(px), cy: fixed(py), r: fixed(f.r) })));
  g.appendChild(svg('circle', { class: 'bud', cx: fixed(f.x), cy: fixed(f.y), r: fixed(f.c) }));
  return g;
}

/* the pink footnote under the hero reports this garden's numbers */
function updateNote(values) {
  for (const [key, value] of Object.entries(values)) {
    const n = document.querySelector(`#gardenNote [data-note="${key}"]`);
    if (n) n.textContent = value;
  }
}

export function initHeroGarden() {
  const layer = document.getElementById('gardenLayer');
  const text = document.querySelector('#heroGarden .garden-name');
  if (!layer || !text) return;
  const slider = document.getElementById('gardenPlants');
  const out = document.getElementById('gardenPlantsOut');
  const regrow = document.getElementById('gardenRegrow');

  let mask = null, seed = 7;

  function render() {
    if (!mask) return;
    const count = Number(slider ? slider.value : 12);
    if (out) out.textContent = count;
    const { segs, flowers } = growGarden({ seed, count, mask });
    const frag = document.createDocumentFragment();
    segs.forEach((s) => frag.appendChild(stemNode(s)));
    flowers.forEach((f) => frag.appendChild(flowerNode(f)));
    layer.replaceChildren(frag);
    updateNote({ plants: count, flowers: flowers.length, seed });
  }

  if (slider) slider.addEventListener('input', render);
  if (regrow) regrow.addEventListener('click', () => { seed = 1 + Math.floor(Math.random() * 99998); render(); });

  // build the mask once the name's font is ready, so it matches the svg text
  const cs = getComputedStyle(text);
  const font = `${cs.fontWeight} 168px ${cs.fontFamily}`;
  const measure = () => { mask = TextMask.fromText(NAME, font, BASE, MASK_W, MASK_H); render(); };
  if (document.fonts && document.fonts.load) document.fonts.load(font).then(measure, measure);
  else measure();
}
