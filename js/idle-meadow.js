/* meadows: little gardens of grass, leafy vines and flowers that
   spread outward from a point. one grows where the mouse rests for
   IDLE_MS (and fades when it moves again); clicking an empty patch of
   background plants one that stays. the canvas sits *behind* the page
   content, so text, cards and the plate always stay on top and readable.
   meadows are anchored to the page, so they scroll with it.
   view only — each layout comes from growMeadow() in meadow.js. */

import { REDUCED_MOTION } from './utils.js';
import { growMeadow } from './meadow.js';

const IDLE_MS = 3000;
const GROW_MS = 700;      // how long each piece takes to grow in
const FADE_MS = 600;
const MAX_PLANTED = 5;    // clicked meadows kept at once; the oldest fades

/* clicks on these are not "empty background" */
const NOT_BACKGROUND = 'a, button, input, label, select, textarea, summary, p, h1, h2, h3, h4, li, dt, dd, figure, canvas, svg, img, .work-card, .timeline-item, .chips, .nav, .mobile-menu, .ticker, .footer';

const clamp01 = (t) => Math.max(0, Math.min(1, t));
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const easeBack = (t) => 1 + 2.4 * Math.pow(t - 1, 3) + 1.4 * Math.pow(t - 1, 2); // a little overshoot

function readColors() {
  const css = getComputedStyle(document.documentElement);
  const v = (n) => css.getPropertyValue(n).trim();
  return { leaf: v('--leaf'), petals: [v('--pink'), v('--purple'), v('--blue')], bud: v('--yellow') };
}

/* each tuft rises as one; blades are filled, tapering to a point */
function drawGrass(ctx, tufts, t, colors) {
  ctx.fillStyle = colors.leaf;
  for (const tuft of tufts) {
    const p = easeOut(clamp01((t - tuft.birth) / GROW_MS));
    if (!p) continue;
    for (const b of tuft.blades) {
      const h = b.height * p, x = tuft.x + b.dx, y = tuft.y;
      const tipX = x + b.lean * h * 0.8, tipY = y - h;
      const ctrlX = x + b.lean * h * 0.15, ctrlY = y - h * 0.55;
      ctx.globalAlpha = b.alpha;
      ctx.beginPath();
      ctx.moveTo(x - b.width / 2, y);
      ctx.quadraticCurveTo(ctrlX - b.width * 0.3, ctrlY, tipX, tipY);
      ctx.quadraticCurveTo(ctrlX + b.width * 0.3, ctrlY, x + b.width / 2, y);
      ctx.closePath();
      ctx.fill();
    }
  }
}

function drawLeaf(ctx, leaf, scale) {
  ctx.save();
  ctx.translate(leaf.x, leaf.y);
  ctx.rotate(leaf.angle);
  ctx.scale(scale, scale);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(leaf.size, -leaf.size * 0.6, leaf.size * 2, 0);
  ctx.quadraticCurveTo(leaf.size, leaf.size * 0.6, 0, 0);
  ctx.fill();
  ctx.restore();
}

function drawVines(ctx, vines, t, colors) {
  ctx.strokeStyle = colors.leaf;
  ctx.fillStyle = colors.leaf;
  ctx.lineWidth = 1.3;
  for (const v of vines) {
    const p = easeOut(clamp01((t - v.birth) / v.duration));
    if (!p) continue;
    const upto = Math.max(1, Math.floor(p * (v.pts.length - 1)));
    ctx.globalAlpha = 0.75;
    ctx.beginPath();
    ctx.moveTo(v.pts[0][0], v.pts[0][1]);
    for (let i = 1; i < upto; i++) {
      const [x1, y1] = v.pts[i], [x2, y2] = v.pts[i + 1];
      ctx.quadraticCurveTo(x1, y1, (x1 + x2) / 2, (y1 + y2) / 2); // smooth through midpoints
    }
    ctx.lineTo(v.pts[upto][0], v.pts[upto][1]);
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.globalAlpha = 0.8;
    for (const leaf of v.leaves) {
      const grown = clamp01((p - leaf.at) * 6); // a leaf opens just after the vine reaches it
      if (grown > 0) drawLeaf(ctx, leaf, easeOut(grown));
    }
  }
}

function drawFlowers(ctx, flowers, t, colors) {
  for (const f of flowers) {
    const p = clamp01((t - f.birth) / GROW_MS);
    if (!p) continue;
    const s = f.size * easeBack(p);
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = colors.petals[f.color];
    for (let i = 0; i < 5; i++) {
      const a = f.rot + i * (Math.PI * 2 / 5);
      ctx.beginPath();
      ctx.arc(f.x + Math.cos(a) * s, f.y + Math.sin(a) * s, s * 0.72, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = colors.bud;
    ctx.beginPath();
    ctx.arc(f.x, f.y, s * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* the page-space box a meadow occupies, padded for blades, leaves and petals */
function bounds(meadow) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const add = (x, y) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); };
  meadow.grass.forEach((t) => add(t.x, t.y));
  meadow.vines.forEach((v) => v.pts.forEach(([x, y]) => add(x, y)));
  meadow.flowers.forEach((f) => add(f.x, f.y));
  const pad = 40;
  return { x: x0 - pad, y: y0 - pad, w: x1 - x0 + pad * 2, h: y1 - y0 + pad * 2 };
}

export function initIdleMeadow() {
  const canvas = document.getElementById('idleMeadow');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const mouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  let colors = readColors();
  let raf = 0, idleTimer, last = null;
  let idle = null;          // { meadow, start, fadeStart }
  let planted = [];         // clicked meadows, oldest first

  function size() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /* a meadow at page coordinates (x, y); reduced motion shows it grown */
  function sprout(x, y) {
    const meadow = growMeadow(x, y);
    return { meadow, box: bounds(meadow), start: performance.now() - (REDUCED_MOTION ? 1e6 : 0), fadeStart: 0, cache: null };
  }

  function paint(target, m, t) {
    drawGrass(target, m.meadow.grass, t, colors);
    drawVines(target, m.meadow.vines, t, colors);
    drawFlowers(target, m.meadow.flowers, t, colors);
  }

  /* render a meadow once into its own bitmap; later frames just paste it.
     done when it finishes growing, or as it starts fading mid-growth. */
  function snapshot(m, t) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const { x, y, w, h } = m.box;
    const c = document.createElement('canvas');
    c.width = Math.ceil(w * dpr);
    c.height = Math.ceil(h * dpr);
    const g = c.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, -x * dpr, -y * dpr);
    paint(g, m, t);
    m.cache = c;
  }

  /* returns false once a fading meadow has gone */
  function drawOne(m, now) {
    const t = now - m.start;
    if (m.fadeStart && !m.cache) snapshot(m, m.fadeStart - m.start);
    if (!m.cache && t >= m.meadow.doneAt) snapshot(m, t);

    const fade = m.fadeStart ? (REDUCED_MOTION ? 0 : 1 - (now - m.fadeStart) / FADE_MS) : 1;
    if (fade <= 0) return false;

    const sx = window.scrollX, sy = window.scrollY;
    if (m.cache) {
      const { x, y, w, h } = m.box;
      if (x - sx > window.innerWidth || y - sy > window.innerHeight || x + w < sx || y + h < sy) return true; // off screen
      ctx.globalAlpha = fade;
      ctx.drawImage(m.cache, x - sx, y - sy, w, h);
      ctx.globalAlpha = 1;
    } else {
      ctx.save();
      ctx.translate(-sx, -sy); // page -> viewport
      paint(ctx, m, t);
      ctx.restore();
    }
    return true;
  }

  const busy = (m, now) => m.fadeStart || now - m.start < m.meadow.doneAt;

  function frame(now) {
    raf = 0;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    planted = planted.filter((m) => drawOne(m, now));
    if (idle && !drawOne(idle, now)) idle = null;
    if (planted.some((m) => busy(m, now)) || (idle && busy(idle, now))) schedule();
  }

  function schedule() {
    if (!raf) raf = requestAnimationFrame(frame);
  }

  function fadeOut(m) {
    if (m && !m.fadeStart) m.fadeStart = performance.now();
  }

  /* --- idle: rest the mouse --- */
  function bloomIdle() {
    if (!last || document.hidden) return;
    idle = sprout(last.x + window.scrollX, last.y + window.scrollY);
    schedule();
  }

  if (mouse && !REDUCED_MOTION) {
    window.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      // ignore sub-pixel jitter; a real move ends the idle meadow and restarts the wait
      if (last && Math.hypot(e.clientX - last.x, e.clientY - last.y) < 3) return;
      last = { x: e.clientX, y: e.clientY };
      if (idle) { fadeOut(idle); schedule(); }
      clearTimeout(idleTimer);
      idleTimer = setTimeout(bloomIdle, IDLE_MS);
    });
    document.addEventListener('mouseleave', () => { clearTimeout(idleTimer); if (idle) { fadeOut(idle); schedule(); } });
  }

  /* --- click: plant one on empty background --- */
  document.addEventListener('click', (e) => {
    if (e.button !== 0 || e.target.closest(NOT_BACKGROUND)) return;
    if (String(window.getSelection())) return; // finishing a text selection, not planting
    planted.push(sprout(e.pageX, e.pageY));
    const growing = planted.filter((m) => !m.fadeStart);
    if (growing.length > MAX_PLANTED) fadeOut(growing[0]);
    schedule();
  });

  // meadows live on the page: redraw as it scrolls or resizes
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', () => { size(); schedule(); });
  // new colours (light/dark switch or a picked pen): re-render cached meadows in them
  function recolor() {
    colors = readColors();
    for (const m of planted.concat(idle ? [idle] : [])) if (m.cache) snapshot(m, m.fadeStart ? m.fadeStart - m.start : m.meadow.doneAt);
    schedule();
  }
  document.addEventListener('theme:change', recolor);
  document.addEventListener('inks:change', recolor);

  size();
}
