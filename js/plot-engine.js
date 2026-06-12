/* the plotter: strokes a figure's polylines in progressively by
   cumulative path length, then stipples in the dots. each canvas
   draws on first intersection and re-rolls its seed on click. */

import { REDUCED_MOTION, mulberry32, randomSeed } from './utils.js';
import { PLOTS } from './plots.js';

function segmentLengths(plot) {
  let total = 0;
  plot.lines.forEach((line) => {
    line.segs = [];
    for (let i = 1; i < line.pts.length; i++) {
      const dx = line.pts[i][0] - line.pts[i - 1][0];
      const dy = line.pts[i][1] - line.pts[i - 1][1];
      const len = Math.hypot(dx, dy);
      line.segs.push(len);
      total += len;
    }
  });
  return total;
}

function drawPlot(ctx, plot, totalLen, progress, w, h) {
  ctx.clearRect(0, 0, w, h);
  let budget = totalLen * Math.min(progress / 0.8, 1); // lines finish at 80%
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (const line of plot.lines) {
    if (budget <= 0) break;
    ctx.beginPath();
    ctx.moveTo(line.pts[0][0], line.pts[0][1]);
    for (let i = 0; i < line.segs.length && budget > 0; i++) {
      const seg = line.segs[i];
      const [x2, y2] = line.pts[i + 1];
      if (seg <= budget) {
        ctx.lineTo(x2, y2);
      } else {
        const [x1, y1] = line.pts[i];
        const t = budget / seg;
        ctx.lineTo(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t);
      }
      budget -= seg;
    }
    ctx.strokeStyle = line.color;
    ctx.globalAlpha = line.alpha;
    ctx.lineWidth = line.width;
    ctx.stroke();
  }

  // dots stipple in over the last 30%
  const dotProgress = Math.max(0, (progress - 0.7) / 0.3);
  const visibleDots = Math.floor(plot.dots.length * dotProgress);
  for (let i = 0; i < visibleDots; i++) {
    const d = plot.dots[i];
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
    ctx.fillStyle = d.color;
    ctx.globalAlpha = 0.85;
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function initPlotCanvas(canvas) {
  const kind = canvas.dataset.plot;
  if (!PLOTS[kind]) return;
  const ctx = canvas.getContext('2d');
  let seed = randomSeed();
  let raf;

  function render(animate) {
    cancelAnimationFrame(raf);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const plot = PLOTS[kind](w, h, mulberry32(seed));
    const totalLen = segmentLengths(plot);

    if (!animate || REDUCED_MOTION) {
      drawPlot(ctx, plot, totalLen, 1, w, h);
      return;
    }
    const t0 = performance.now();
    const DURATION = 2600;
    (function frame(now) {
      const raw = Math.min((now - t0) / DURATION, 1);
      const eased = 1 - Math.pow(1 - raw, 2.2);
      drawPlot(ctx, plot, totalLen, eased, w, h);
      if (raw < 1) raf = requestAnimationFrame(frame);
    })(t0);
  }

  // draw when the card scrolls into view
  const once = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        render(true);
        once.disconnect();
      }
    },
    { threshold: 0.25 }
  );
  once.observe(canvas);

  // click to re-roll the seed — a new edition of the figure
  canvas.parentElement.addEventListener('click', () => {
    seed = randomSeed();
    render(true);
  });

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => render(false), 250);
  });
}

export function initProjectPlots() {
  document.querySelectorAll('canvas[data-plot]').forEach(initPlotCanvas);
}
