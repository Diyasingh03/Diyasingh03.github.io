/* the four pens in the hero plate. pens 1–3 re-ink the whole page
   (--pink, --purple, --blue); pen 4 is the plotter's dark ink and
   only colours the flow field. a visitor's choice is remembered in
   their browser; reset restores the colours from tokens.css. */

import { refreshInks } from './utils.js';

const KEY = 'diya-wiki-inks';
const VARS = ['--pink', '--purple', '--blue', '--ink'];
const PAGE_PENS = 3; // pens that re-ink the page, not just the plot

let defaults = [];
let pens = [];

function readDefaults() {
  const css = getComputedStyle(document.documentElement);
  return VARS.map((v) => toHex(css.getPropertyValue(v).trim()));
}

/* <input type="color"> only takes #rrggbb */
function toHex(color) {
  if (/^#[0-9a-f]{6}$/i.test(color)) return color.toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(color)) return '#' + [...color.slice(1)].map((c) => c + c).join('').toLowerCase();
  const m = color.match(/\d+/g);
  if (!m) return '#000000';
  return '#' + m.slice(0, 3).map((n) => Number(n).toString(16).padStart(2, '0')).join('');
}

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (Array.isArray(saved) && saved.length === 4 && saved.every((c) => /^#[0-9a-f]{6}$/i.test(c))) return saved;
  } catch (e) { /* private mode or blocked storage: use the defaults */ }
  return null;
}

function save() {
  try {
    if (pens.every((c, i) => c === defaults[i])) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, JSON.stringify(pens));
  } catch (e) { /* storage unavailable: the choice lasts for this visit only */ }
}

function apply() {
  const root = document.documentElement.style;
  for (let i = 0; i < PAGE_PENS; i++) {
    if (pens[i] === defaults[i]) root.removeProperty(VARS[i]);
    else root.setProperty(VARS[i], pens[i]);
  }
  refreshInks();
  document.querySelectorAll('.plate-inks input[data-pen]').forEach((input) => {
    input.value = pens[Number(input.dataset.pen)];
  });
  document.dispatchEvent(new CustomEvent('inks:change', { detail: { pens: pens.slice() } }));
}

/* the plotter's four pen colours, for the flow field */
export function getPens() {
  return pens.slice();
}

export function initInks() {
  defaults = readDefaults();
  pens = load() || defaults.slice();
  apply();

  document.querySelectorAll('.plate-inks input[data-pen]').forEach((input) => {
    input.addEventListener('input', () => {
      pens[Number(input.dataset.pen)] = input.value.toLowerCase();
      apply();
      save();
    });
  });

  const reset = document.getElementById('inkReset');
  if (reset) {
    reset.addEventListener('click', () => {
      pens = defaults.slice();
      apply();
      save();
    });
  }
}
