/* hero flow-field plotter: pens trace a layered-sine vector field,
   drawing the hero background in live like a pen plotter */

import { REDUCED_MOTION, INK, PINK, PURPLE, BLUE, mulberry32 } from './utils.js';

export function initHeroPlotter() {
  const canvas = document.getElementById('heroCanvas');
  const ctx = canvas.getContext('2d');
  let W, H, pens, field, raf;
  let frames = 0;
  const MAX_FRAMES = 1100; // the drawing "finishes" — like a real plot

  function fieldAngle(x, y, s) {
    return (
      Math.sin(x * field.f1 + s.p1) +
      Math.cos(y * field.f2 + s.p2) +
      Math.sin((x + y) * field.f3 + s.p3)
    ) * Math.PI * 0.75;
  }

  function makePen(rng, s) {
    const roll = rng();
    return {
      x: rng() * W,
      y: rng() * H,
      color: roll < 0.18 ? PINK : roll < 0.42 ? PURPLE : roll < 0.62 ? BLUE : INK,
      alpha: 0.10 + rng() * 0.12,
      width: 0.6 + rng() * 0.7,
      life: 200 + rng() * 500,
      s,
    };
  }

  function setup() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const rng = mulberry32(Date.now() % 2147483647);
    field = { f1: 0.004 + rng() * 0.004, f2: 0.004 + rng() * 0.004, f3: 0.002 + rng() * 0.002 };
    const s = { p1: rng() * 6.28, p2: rng() * 6.28, p3: rng() * 6.28 };
    pens = Array.from({ length: 16 }, () => makePen(rng, s));
    pens._rng = rng;
    pens._s = s;
  }

  function step() {
    pens.forEach((pen) => {
      ctx.beginPath();
      ctx.moveTo(pen.x, pen.y);
      for (let i = 0; i < 3; i++) {
        const a = fieldAngle(pen.x, pen.y, pen.s);
        pen.x += Math.cos(a) * 1.8;
        pen.y += Math.sin(a) * 1.8;
        ctx.lineTo(pen.x, pen.y);
      }
      ctx.strokeStyle = pen.color;
      ctx.globalAlpha = pen.alpha;
      ctx.lineWidth = pen.width;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.globalAlpha = 1;

      pen.life -= 1;
      if (pen.life <= 0 || pen.x < -40 || pen.x > W + 40 || pen.y < -40 || pen.y > H + 40) {
        Object.assign(pen, makePen(pens._rng, pens._s));
      }
    });
    frames += 1;
    if (frames < MAX_FRAMES) raf = requestAnimationFrame(step);
  }

  setup();
  if (REDUCED_MOTION) {
    // draw the finished plot in one go
    for (let i = 0; i < 700; i++) step();
  } else {
    raf = requestAnimationFrame(step);
  }

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      cancelAnimationFrame(raf);
      frames = 0;
      setup();
      if (!REDUCED_MOTION) raf = requestAnimationFrame(step);
    }, 250);
  });
}
