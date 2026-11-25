/* fig. 1 — the hero plate: draws a FlowField onto #heroCanvas.
   this file is only the view: canvas sizing, incremental drawing,
   pointer input, "new edition", resize and re-inking. */

import { REDUCED_MOTION } from './utils.js';
import { FlowField } from './flow-field.js';
import { getPens } from './inks.js';

const W = 560, H = 640;                 // the plate, in sheet units
const DISC = { cx: 280, cy: 300, radius: 214 };

class PlateView {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.drawnTo = new WeakMap();        // pen -> index of its last drawn point
  }

  /* match the backing store to the element; work in sheet units */
  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const scale = this.canvas.clientWidth / W;
    this.canvas.width = Math.round(this.canvas.clientWidth * dpr);
    this.canvas.height = Math.round(this.canvas.clientHeight * dpr);
    this.ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
  }

  /* sheet units under a pointer event */
  toSheet(e) {
    const r = this.canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H };
  }

  clear() {
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();
    this.drawnTo = new WeakMap();
  }

  /* stroke whatever part of each pen hasn't been drawn yet */
  draw(pens) {
    const ctx = this.ctx, colors = getPens();
    ctx.save();
    ctx.beginPath();
    ctx.arc(DISC.cx, DISC.cy, DISC.radius, 0, Math.PI * 2);
    ctx.clip();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const pen of pens) {
      const from = this.drawnTo.get(pen) || 0;
      if (pen.pts.length - from < 2) continue;
      ctx.beginPath();
      ctx.moveTo(pen.pts[from][0], pen.pts[from][1]);
      for (let i = from + 1; i < pen.pts.length; i++) ctx.lineTo(pen.pts[i][0], pen.pts[i][1]);
      ctx.strokeStyle = colors[pen.ink];
      ctx.globalAlpha = pen.alpha;
      ctx.lineWidth = pen.width;
      ctx.stroke();
      this.drawnTo.set(pen, pen.pts.length - 1);
    }
    ctx.restore();
  }

  /* full redraw: after a resize or when the pens are re-inked */
  redraw(pens) {
    this.clear();
    this.draw(pens);
  }
}

export function initHeroPlotter() {
  const sheet = document.getElementById('plateSheet');
  const canvas = document.getElementById('heroCanvas');
  if (!sheet || !canvas) return;
  const seedEl = document.getElementById('plateSeed');
  const reroll = document.getElementById('plateReroll');

  const field = new FlowField(DISC);
  const view = new PlateView(canvas);
  let raf, lastSpawn = 0;

  function run() {
    cancelAnimationFrame(raf);
    if (REDUCED_MOTION) {
      while (!field.finished) field.advance();
      view.draw(field.pens);
      return;
    }
    (function frame() {
      field.advance();
      view.draw(field.pens);
      if (!field.finished) raf = requestAnimationFrame(frame);
    })();
  }

  function edition(seed) {
    field.reset(seed);
    if (seedEl) seedEl.textContent = seed;
    view.resize();
    view.redraw(field.pens);
    run();
  }

  sheet.addEventListener('pointermove', (e) => {
    if (e.target.closest('.plate-inks')) return;
    const p = view.toSheet(e);
    field.setCursor(p);
    const now = performance.now();
    if (now - lastSpawn < 70) return;
    const wasIdle = field.finished;
    if (field.spawnAt(p.x, p.y)) {
      lastSpawn = now;
      if (wasIdle) run();
    }
  });
  sheet.addEventListener('pointerleave', () => field.setCursor(null));

  if (reroll) reroll.addEventListener('click', () => edition(newSeed()));
  document.addEventListener('inks:change', () => view.redraw(field.pens));

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { view.resize(); view.redraw(field.pens); }, 200);
  });

  edition(newSeed());
}

function newSeed() {
  return 1 + Math.floor(Math.random() * 99998);
}
