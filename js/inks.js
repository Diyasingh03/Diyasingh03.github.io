/* the four pens in the hero plate. pens 1–3 re-ink the whole page
   (--pink, --purple, --blue); pen 4 is the plotter's ink and only
   colours the flow field. a visitor's choice is remembered in their
   browser; reset restores the colours from tokens.css. each theme has
   its own defaults: on a light/dark switch, pens still at the old
   theme's default move to the new one, picked pens stay as picked. */

import { refreshInks } from './utils.js';

const KEY = 'diya-wiki-inks';
const VARS = ['--pink', '--purple', '--blue', '--ink'];
const PAGE_PENS = 3; // pens that re-ink the page, not just the plot

let defaults = [];
let pens = [];

/* the theme's own colours: read with the visitor's overrides lifted */
function readDefaults() {
  const style = document.documentElement.style;
  const held = VARS.map((v) => style.getPropertyValue(v));
  VARS.forEach((v) => style.removeProperty(v));
  const css = getComputedStyle(document.documentElement);
  const values = VARS.map((v) => toHex(css.getPropertyValue(v).trim()));
  VARS.forEach((v, i) => { if (held[i]) style.setProperty(v, held[i]); });
  return values;
}

/* <input type="color"> only takes #rrggbb */
function toHex(color) {
  if (/^#[0-9a-f]{6}$/i.test(color)) return color.toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(color)) return '#' + [...color.slice(1)].map((c) => c + c).join('').toLowerCase();
  const m = color.match(/\d+/g);
  if (!m) return '#000000';
  return '#' + m.slice(0, 3).map((n) => Number(n).toString(16).padStart(2, '0')).join('');
}

/* saved as [pen or null]: null means "this theme's default" */
function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (Array.isArray(saved) && saved.length === 4) {
      return saved.map((c, i) => (typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c) ? c : defaults[i]));
    }
  } catch (e) { /* private mode or blocked storage: use the defaults */ }
  return null;
}

function save() {
  try {
    const picked = pens.map((c, i) => (c === defaults[i] ? null : c));
    if (picked.every((c) => c === null)) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, JSON.stringify(picked));
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

  // light/dark switch: untouched pens follow the new theme's defaults
  document.addEventListener('theme:change', () => {
    const before = defaults;
    defaults = readDefaults();
    pens = pens.map((c, i) => (c === before[i] ? defaults[i] : c));
    apply();
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
