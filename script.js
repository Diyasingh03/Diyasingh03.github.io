/* ============================================================
   DIYA SINGH — "THE PLOTTER'S NOTEBOOK" SCRIPTS
   1. nav (scrolled state, active link, mobile menu, scroll-top)
   2. typewriter
   3. scroll reveal (IntersectionObserver)
   4. hero flow-field plotter
   5. generative project plots  (canvas[data-plot])
   ============================================================ */

'use strict';

const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- ink palette (read from :root so CSS stays the source of truth) ---------- */
const css = getComputedStyle(document.documentElement);
const INK  = css.getPropertyValue('--ink').trim()  || '#1e2230';
const BLUE = css.getPropertyValue('--blue').trim() || '#2742c4';
const RED  = css.getPropertyValue('--red').trim()  || '#c93a1d';

/* ---------- seeded rng (mulberry32) so each plot is reproducible per seed ---------- */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ============================================================
   1. NAVIGATION
   ============================================================ */
const nav = document.getElementById('nav');
const navLinks = document.querySelectorAll('.nav-link');
const navToggle = document.getElementById('navToggle');
const mobileMenu = document.getElementById('mobileMenu');
const scrollTopBtn = document.getElementById('scrollTop');

window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 24);
  scrollTopBtn.classList.toggle('show', window.scrollY > 700);
}, { passive: true });

scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

navToggle.addEventListener('click', () => {
  const open = mobileMenu.classList.toggle('open');
  navToggle.classList.toggle('open', open);
  navToggle.setAttribute('aria-expanded', String(open));
  document.body.style.overflow = open ? 'hidden' : '';
});
mobileMenu.querySelectorAll('a').forEach((a) =>
  a.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    navToggle.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  })
);

/* active link highlighting */
const sections = [...document.querySelectorAll('section[id], header[id]')];
const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) =>
        link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`)
      );
    });
  },
  { rootMargin: '-40% 0px -55% 0px' }
);
sections.forEach((s) => sectionObserver.observe(s));

/* ============================================================
   2. TYPEWRITER
   ============================================================ */
const typedEl = document.getElementById('typedText');
const PHRASES = [
  'automating email triage with AI @ Envita Solutions',
  'pursuing an M.S. in Computer Science @ Purdue',
  'teaching 400 students as Head TA of CS180',
  'benchmarking detection models against noise',
  'drawing with algorithms — like the one behind this page',
];

if (REDUCED_MOTION) {
  typedEl.textContent = PHRASES[0];
} else {
  let phraseIdx = 0, charIdx = 0, deleting = false;
  (function type() {
    const phrase = PHRASES[phraseIdx];
    charIdx += deleting ? -1 : 1;
    typedEl.textContent = phrase.slice(0, charIdx);
    let delay = deleting ? 26 : 48;
    if (!deleting && charIdx === phrase.length) { delay = 2400; deleting = true; }
    else if (deleting && charIdx === 0) { deleting = false; phraseIdx = (phraseIdx + 1) % PHRASES.length; delay = 420; }
    setTimeout(type, delay);
  })();
}

/* ============================================================
   3. SCROLL REVEAL
   hero .reveal elements fire immediately with a stagger;
   everything else reveals on intersection.
   ============================================================ */
document.querySelectorAll('.hero .reveal, .hero-footnote').forEach((el, i) =>
  setTimeout(() => el.classList.add('visible'), 120 + i * 130)
);

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);
document.querySelectorAll('.reveal:not(.visible)').forEach((el) => revealObserver.observe(el));

/* ============================================================
   4. HERO FLOW-FIELD PLOTTER
   A handful of "pens" trace a layered-sine vector field,
   drawing the hero background in live like a pen plotter.
   ============================================================ */
(function heroPlotter() {
  const canvas = document.getElementById('heroCanvas');
  const ctx = canvas.getContext('2d');
  let W, H, pens, field, raf;

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
      color: roll < 0.12 ? RED : roll < 0.45 ? BLUE : INK,
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

  let frames = 0;
  const MAX_FRAMES = 1100; // the drawing "finishes" — like a real plot

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
})();

/* ============================================================
   5. GENERATIVE PROJECT PLOTS
   Each canvas[data-plot] builds a set of ink polylines + dots
   from a seeded algorithm, then strokes them in progressively
   (by path length) like a pen plotter. Click to re-roll.
   ============================================================ */

/* hand-drawn wobble: displace each point slightly */
function wobble(pts, rng, amt = 1.2) {
  return pts.map(([x, y]) => [x + (rng() - 0.5) * amt, y + (rng() - 0.5) * amt]);
}

/* ---------- the algorithms — each returns { lines, dots } ---------- */
const PLOTS = {

  /* fig. 1 — rose curve + golden-angle phyllotaxis (Bloom) */
  rose(w, h, rng) {
    const lines = [], dots = [];
    const cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.40;
    const n = 3 + Math.floor(rng() * 5);            // petals: r = cos(kθ)
    const d = 1 + Math.floor(rng() * 2);
    const k = n / d;
    const turns = Math.PI * 2 * d;
    const pts = [];
    for (let t = 0; t <= turns + 0.01; t += 0.012) {
      const r = R * Math.cos(k * t);
      pts.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]);
    }
    lines.push({ pts: wobble(pts, rng, 0.8), color: BLUE, width: 1.2, alpha: 0.85 });
    // phyllotaxis seeds at the heart of the bloom
    const GA = Math.PI * (3 - Math.sqrt(5));
    const seeds = 70 + Math.floor(rng() * 50);
    for (let i = 0; i < seeds; i++) {
      const r = Math.sqrt(i / seeds) * R * 0.34;
      dots.push({ x: cx + r * Math.cos(i * GA), y: cy + r * Math.sin(i * GA), r: 1.1, color: RED });
    }
    return { lines, dots };
  },

  /* fig. 2 — jittered bounding boxes under corruption (detection benchmark) */
  detect(w, h, rng) {
    const lines = [], dots = [];
    const boxes = 7 + Math.floor(rng() * 4);
    for (let i = 0; i < boxes; i++) {
      const bw = 30 + rng() * (w * 0.30);
      const bh = 24 + rng() * (h * 0.34);
      const x = 12 + rng() * (w - bw - 24);
      const y = 12 + rng() * (h - bh - 24);
      const corrupted = rng() < 0.3;
      const pts = [];
      const steps = 10;
      const corners = [[x, y], [x + bw, y], [x + bw, y + bh], [x, y + bh], [x, y]];
      for (let c = 0; c < 4; c++) {
        for (let s = 0; s <= steps; s++) {
          const t = s / steps;
          pts.push([
            corners[c][0] + (corners[c + 1][0] - corners[c][0]) * t,
            corners[c][1] + (corners[c + 1][1] - corners[c][1]) * t,
          ]);
        }
      }
      lines.push({
        pts: wobble(pts, rng, corrupted ? 3.4 : 1.0),
        color: corrupted ? RED : i % 2 ? BLUE : INK,
        width: corrupted ? 0.8 : 1.1,
        alpha: corrupted ? 0.65 : 0.8,
      });
      // confidence tick at top-left of each box
      dots.push({ x: x + 4, y: y - 4, r: 1.4, color: corrupted ? RED : BLUE });
    }
    return { lines, dots };
  },

  /* fig. 3 — expected-value decision tree, left → right (Flip7 DP agent) */
  tree(w, h, rng) {
    const lines = [], dots = [];
    (function branch(x, y, len, spread, depth, width) {
      if (depth === 0 || x > w - 14) {
        dots.push({ x, y, r: 1.6, color: rng() < 0.3 ? RED : BLUE }); // stay vs bust
        return;
      }
      const kids = 2;
      for (let i = 0; i < kids; i++) {
        const dy = (i - 0.5) * 2 * spread * (0.7 + rng() * 0.6);
        const nx = x + len * (0.85 + rng() * 0.3);
        const ny = Math.max(12, Math.min(h - 12, y + dy));
        // gentle curve via midpoint sag
        const mid = [(x + nx) / 2 + (rng() - 0.5) * 4, (y + ny) / 2 + (rng() - 0.5) * 4];
        lines.push({
          pts: wobble([[x, y], mid, [nx, ny]], rng, 0.7),
          color: INK, width: Math.max(0.5, width), alpha: 0.75,
        });
        branch(nx, ny, len * 0.86, spread * 0.55, depth - 1, width * 0.75);
      }
    })(16, h / 2, w * 0.17, h * 0.30, 5, 2.2);
    return { lines, dots };
  },

  /* fig. 4 — Lissajous gaze trace (ReadCoin eye-tracking) */
  lissajous(w, h, rng) {
    const lines = [];
    const cx = w / 2, cy = h / 2;
    const A = w * 0.38, B = h * 0.34;
    const a = 2 + Math.floor(rng() * 4);
    let b = 3 + Math.floor(rng() * 4);
    if (a === b) b += 1;
    const phi = rng() * Math.PI;
    const pts = [];
    for (let t = 0; t <= Math.PI * 2 + 0.01; t += 0.006) {
      pts.push([cx + A * Math.sin(a * t + phi), cy + B * Math.sin(b * t)]);
    }
    lines.push({ pts: wobble(pts, rng, 0.7), color: BLUE, width: 1.1, alpha: 0.8 });
    // faint red echo — the saccade
    const echo = pts.map(([x, y]) => [
      cx + (x - cx) * 0.6 + (rng() - 0.5) * 3,
      cy + (y - cy) * 0.6 + (rng() - 0.5) * 3,
    ]);
    lines.push({ pts: echo, color: RED, width: 0.7, alpha: 0.4 });
    return { lines, dots: [] };
  },

  /* fig. 5 — stacked throughput traces with jitter (streaming) */
  signal(w, h, rng) {
    const lines = [], dots = [];
    const traces = 4;
    for (let i = 0; i < traces; i++) {
      const base = h * (0.22 + (i * 0.6) / (traces - 1) * 0.9 * 0.6);
      const amp = 6 + rng() * 10;
      const f = 0.02 + rng() * 0.05;
      const phase = rng() * 6.28;
      const spiky = i === traces - 1; // the congested link
      const pts = [];
      for (let x = 10; x <= w - 10; x += 2) {
        let y = base + Math.sin(x * f + phase) * amp + (rng() - 0.5) * 2;
        if (spiky && rng() < 0.05) y += (rng() - 0.5) * 36; // packet loss spikes
        pts.push([x, y]);
      }
      lines.push({
        pts,
        color: spiky ? RED : i % 2 ? BLUE : INK,
        width: 1,
        alpha: spiky ? 0.7 : 0.6,
      });
    }
    return { lines, dots };
  },

  /* fig. 6 — L-system fractal tree (procedural 3D tree) */
  lsystem(w, h, rng) {
    const lines = [], dots = [];
    (function grow(x, y, angle, len, depth, width) {
      if (depth === 0 || len < 3) {
        if (rng() < 0.6) dots.push({ x, y, r: 1.4, color: RED }); // blossom
        return;
      }
      const nx = x + Math.cos(angle) * len;
      const ny = y + Math.sin(angle) * len;
      lines.push({
        pts: wobble([[x, y], [(x + nx) / 2, (y + ny) / 2], [nx, ny]], rng, 0.8),
        color: INK, width: Math.max(0.5, width), alpha: 0.8,
      });
      const split = 0.32 + rng() * 0.3;
      grow(nx, ny, angle - split * (0.6 + rng() * 0.8), len * (0.68 + rng() * 0.14), depth - 1, width * 0.7);
      grow(nx, ny, angle + split * (0.6 + rng() * 0.8), len * (0.68 + rng() * 0.14), depth - 1, width * 0.7);
      if (rng() < 0.3) {
        grow(nx, ny, angle + (rng() - 0.5) * 0.4, len * 0.6, depth - 2, width * 0.6);
      }
    })(w / 2, h - 8, -Math.PI / 2, h * 0.26, 7, 2.6);
    return { lines, dots };
  },
};

/* ---------- the plotter: strokes polylines in by cumulative length ---------- */
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
  let seed = Math.floor(Math.random() * 2147483647);
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
    seed = Math.floor(Math.random() * 2147483647);
    render(true);
  });

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => render(false), 250);
  });
}

document.querySelectorAll('canvas[data-plot]').forEach(initPlotCanvas);
