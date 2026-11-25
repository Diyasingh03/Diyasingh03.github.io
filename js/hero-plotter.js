/* fig. 1 — the hero plate: pens trace a layered-sine flow field
   inside a circle, like a pen plotter. new pens start at the
   visitor's cursor and bend around it; the drawing finishes at
   TOTAL strokes, and "new edition" starts a fresh seed. */

import { REDUCED_MOTION, mulberry32 } from './utils.js';
import { getPens } from './inks.js';

const W = 560, H = 640;          // plate size in sheet units
const CX = 280, CY = 300, R = 214; // the plotted disc
const TOTAL = 360, MAX_ACTIVE = 70, STEP = 2.2;

export function initHeroPlotter() {
  const sheet = document.getElementById('plateSheet');
  const canvas = document.getElementById('heroCanvas');
  const seedEl = document.getElementById('plateSeed');
  const reroll = document.getElementById('plateReroll');
  if (!sheet || !canvas) return;
  const ctx = canvas.getContext('2d');

  let scale = 1, rng, field, active = [], done = [], drawn = 0, cursor = null, lastSpawn = 0, raf;

  function size() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    scale = canvas.clientWidth / W;
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
  }

  function clipDisc() {
    ctx.beginPath();
    ctx.arc(CX, CY, R, 0, Math.PI * 2);
    ctx.clip();
  }

  function makePen(x, y) {
    const roll = rng();
    drawn++;
    return {
      pts: [[x, y]],
      ink: roll < 0.24 ? 0 : roll < 0.52 ? 1 : roll < 0.76 ? 2 : 3,
      alpha: 0.3 + rng() * 0.4,
      width: rng() < 0.65 ? 0.9 : 1.5,
      life: 140 + rng() * 320,
      drawnTo: 0,
    };
  }

  function spawnInDisc() {
    const a = rng() * Math.PI * 2, r = Math.sqrt(rng()) * R;
    return makePen(CX + Math.cos(a) * r, CY + Math.sin(a) * r);
  }

  function angle(x, y) {
    let a = (Math.sin(x * field.f1 + field.p1) + Math.cos(y * field.f2 + field.p2) + Math.sin((x + y) * field.f3 + field.p3)) * Math.PI * 0.6;
    const dx = x - CX, dy = y - CY;
    a += field.swirl * Math.exp(-(dx * dx + dy * dy) / (2 * 120 * 120));
    if (cursor) {
      const cx = x - cursor.x, cy = y - cursor.y;
      a += 1.8 * Math.exp(-(cx * cx + cy * cy) / (2 * 80 * 80));
    }
    return a;
  }

  function strokePen(pen, from, colors) {
    if (pen.pts.length - from < 2) return;
    ctx.beginPath();
    ctx.moveTo(pen.pts[from][0], pen.pts[from][1]);
    for (let i = from + 1; i < pen.pts.length; i++) ctx.lineTo(pen.pts[i][0], pen.pts[i][1]);
    ctx.strokeStyle = colors[pen.ink];
    ctx.globalAlpha = pen.alpha;
    ctx.lineWidth = pen.width;
    ctx.stroke();
  }

  /* full redraw: after a resize or when the pens are re-inked */
  function redraw() {
    const colors = getPens();
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    ctx.save();
    clipDisc();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    done.concat(active).forEach((pen) => { strokePen(pen, 0, colors); pen.drawnTo = pen.pts.length - 1; });
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function advance() {
    const keep = [];
    for (const pen of active) {
      let alive = true;
      for (let s = 0; s < 4; s++) {
        const [x, y] = pen.pts[pen.pts.length - 1];
        const a = angle(x, y);
        const nx = x + Math.cos(a) * STEP, ny = y + Math.sin(a) * STEP;
        pen.pts.push([nx, ny]);
        pen.life--;
        const dx = nx - CX, dy = ny - CY;
        if (pen.life <= 0 || dx * dx + dy * dy > (R + 16) * (R + 16)) { alive = false; break; }
      }
      if (alive) keep.push(pen);
      else {
        done.push(pen);
        if (drawn < TOTAL && (!cursor || rng() < 0.5)) keep.push(spawnInDisc());
      }
    }
    // draw only the new part of every stroke
    const colors = getPens();
    ctx.save();
    clipDisc();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    done.concat(keep).forEach((pen) => {
      if (pen.drawnTo < pen.pts.length - 1) { strokePen(pen, pen.drawnTo, colors); pen.drawnTo = pen.pts.length - 1; }
    });
    ctx.restore();
    ctx.globalAlpha = 1;
    active = keep;
  }

  function frame() {
    advance();
    if (active.length) raf = requestAnimationFrame(frame);
  }

  function edition(seed) {
    cancelAnimationFrame(raf);
    rng = mulberry32(seed);
    field = {
      f1: 0.006 + rng() * 0.006, f2: 0.006 + rng() * 0.006, f3: 0.003 + rng() * 0.003,
      p1: rng() * 6.28, p2: rng() * 6.28, p3: rng() * 6.28,
      swirl: 0.6 + rng() * 0.8,
    };
    active = []; done = []; drawn = 0;
    for (let i = 0; i < 46; i++) active.push(spawnInDisc());
    if (seedEl) seedEl.textContent = seed;
    size();
    redraw();
    if (REDUCED_MOTION) {
      while (active.length) advance();
    } else {
      raf = requestAnimationFrame(frame);
    }
  }

  sheet.addEventListener('pointermove', (e) => {
    if (e.target.closest('.plate-inks')) return;
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width * W, y = (e.clientY - r.top) / r.height * H;
    cursor = { x, y };
    const now = performance.now(), dx = x - CX, dy = y - CY;
    if (now - lastSpawn > 70 && drawn < TOTAL && active.length < MAX_ACTIVE && dx * dx + dy * dy < R * R) {
      lastSpawn = now;
      const wasIdle = active.length === 0;
      active.push(makePen(x, y));
      if (wasIdle && !REDUCED_MOTION) raf = requestAnimationFrame(frame);
    }
  });
  sheet.addEventListener('pointerleave', () => { cursor = null; });

  if (reroll) reroll.addEventListener('click', () => edition(1 + Math.floor(Math.random() * 99998)));
  document.addEventListener('inks:change', redraw);

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { size(); redraw(); }, 200);
  });

  edition(1 + Math.floor(Math.random() * 99998));
}
