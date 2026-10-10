/* the generative figure algorithms — one per project card.
   each returns { lines: [{pts, color, width, alpha}], dots: [{x, y, r, color}] }
   keyed by the canvas's data-plot attribute. */

import { INK, PINK, PURPLE, BLUE, YELLOW, wobble } from './utils.js';

export const PLOTS = {

  /* fig. 3 — rose curve + golden-angle phyllotaxis (Charakbloom) */
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
    lines.push({ pts: wobble(pts, rng, 0.8), color: PURPLE, width: 1.2, alpha: 0.85 });
    // phyllotaxis seeds at the heart of the bloom
    const GA = Math.PI * (3 - Math.sqrt(5));
    const seeds = 70 + Math.floor(rng() * 50);
    for (let i = 0; i < seeds; i++) {
      const r = Math.sqrt(i / seeds) * R * 0.34;
      dots.push({
        x: cx + r * Math.cos(i * GA),
        y: cy + r * Math.sin(i * GA),
        r: 1.1,
        color: i % 5 === 0 ? YELLOW : PINK,
      });
    }
    return { lines, dots };
  },

  /* fig. 1 — jittered bounding boxes under corruption (detection benchmark) */
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
        color: corrupted ? PINK : i % 2 ? BLUE : INK,
        width: corrupted ? 0.8 : 1.1,
        alpha: corrupted ? 0.65 : 0.8,
      });
      // confidence tick at top-left of each box
      dots.push({ x: x + 4, y: y - 4, r: 1.4, color: corrupted ? PINK : BLUE });
    }
    return { lines, dots };
  },

  /* fig. 2 — expected-value decision tree, left → right (Flip7 DP agent) */
  tree(w, h, rng) {
    const lines = [], dots = [];
    (function branch(x, y, len, spread, depth, width) {
      if (depth === 0 || x > w - 14) {
        dots.push({ x, y, r: 1.6, color: rng() < 0.3 ? PINK : BLUE }); // stay vs bust
        return;
      }
      for (let i = 0; i < 2; i++) {
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
    lines.push({ pts: wobble(pts, rng, 0.7), color: PURPLE, width: 1.1, alpha: 0.8 });
    // faint pink echo — the saccade
    const echo = pts.map(([x, y]) => [
      cx + (x - cx) * 0.6 + (rng() - 0.5) * 3,
      cy + (y - cy) * 0.6 + (rng() - 0.5) * 3,
    ]);
    lines.push({ pts: echo, color: PINK, width: 0.7, alpha: 0.4 });
    return { lines, dots: [] };
  },

  /* fig. 7 — stacked throughput traces with jitter (streaming) */
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
        color: spiky ? PINK : [BLUE, PURPLE, INK][i % 3],
        width: 1,
        alpha: spiky ? 0.7 : 0.6,
      });
    }
    return { lines, dots };
  },

  /* fig. 5 — accept queue fanning into thread-pool lanes (HTTP server) */
  threads(w, h, rng) {
    const lines = [], dots = [];
    const lanes = 4 + Math.floor(rng() * 3);
    const ox = 18, oy = h / 2;                        // the listening socket
    const laneX = w * 0.24;
    for (let i = 0; i < lanes; i++) {
      const ly = h * 0.14 + (i * h * 0.72) / (lanes - 1);
      // dispatch curve: socket → worker
      const pts = [];
      for (let s = 0; s <= 16; s++) {
        const t = s / 16, e = t * t * (3 - 2 * t);
        pts.push([ox + (laneX - ox) * t, oy + (ly - oy) * e]);
      }
      lines.push({ pts: wobble(pts, rng, 0.6), color: PURPLE, width: 0.9, alpha: 0.6 });
      // the worker's timeline, then requests as brackets along it
      lines.push({ pts: wobble([[laneX, ly], [w - 14, ly]], rng, 0.5), color: INK, width: 0.6, alpha: 0.35 });
      let x = laneX + 6 + rng() * 14;
      while (x < w - 30) {
        const len = 12 + rng() * (w * 0.14);
        const end = Math.min(x + len, w - 16);
        const slow = rng() < 0.15;                   // a CGI fork / long request
        const top = ly - 5, bot = ly + 5;
        lines.push({
          pts: wobble([[x, bot], [x, top], [end, top], [end, bot]], rng, 0.7),
          color: slow ? PINK : BLUE, width: 1, alpha: 0.8,
        });
        dots.push({ x: end + 3, y: ly, r: 1.2, color: slow ? PINK : BLUE }); // response sent
        x = end + 6 + rng() * 18;
      }
    }
    // queued connections waiting at the socket
    for (let q = 0; q < 5; q++) dots.push({ x: ox - 2 + q * 1.5, y: oy - 8 + q * 4, r: 1.3, color: YELLOW });
    dots.push({ x: ox, y: oy, r: 2.6, color: INK });
    return { lines, dots };
  },

  /* fig. 6 — fork/exec process tree with a pipeline (Unix shell) */
  forks(w, h, rng) {
    const lines = [], dots = [];
    const root = [w / 2, h * 0.14];
    const n = 3 + Math.floor(rng() * 2);            // cmd | cmd | cmd …
    const y1 = h * 0.48, y2 = h * 0.82;
    const kids = [];
    for (let i = 0; i < n; i++) {
      const x = w * (0.16 + (i * 0.68) / (n - 1));
      kids.push([x, y1]);
      // fork edge: down, across, down — drawn like a plotted bracket
      const midY = (root[1] + y1) / 2;
      lines.push({
        pts: wobble([root, [root[0], midY], [x, midY], [x, y1]], rng, 0.8),
        color: INK, width: 1.1, alpha: 0.75,
      });
      // some children exec helpers of their own
      const grand = rng() < 0.5 ? 1 + Math.floor(rng() * 2) : 0;
      for (let g = 0; g < grand; g++) {
        const gx = x + (g - (grand - 1) / 2) * w * 0.07;
        lines.push({
          pts: wobble([[x, y1], [x, (y1 + y2) / 2], [gx, (y1 + y2) / 2], [gx, y2]], rng, 0.7),
          color: INK, width: 0.7, alpha: 0.5,
        });
        dots.push({ x: gx, y: y2, r: 1.5, color: BLUE });
      }
    }
    // the pipes: stdout → stdin between neighbours, a little arrowhead each
    for (let i = 0; i < n - 1; i++) {
      const [ax, ay] = kids[i], [bx] = kids[i + 1];
      const pts = [];
      for (let x = ax + 8; x <= bx - 8; x += 3) pts.push([x, ay + Math.sin(x * 0.4) * 1.4]);
      lines.push({ pts: wobble(pts, rng, 0.4), color: PINK, width: 1, alpha: 0.75 });
      lines.push({ pts: [[bx - 13, ay - 4], [bx - 8, ay], [bx - 13, ay + 4]], color: PINK, width: 1, alpha: 0.75 });
    }
    kids.forEach(([x, y], i) => dots.push({ x, y, r: 2.4, color: i === n - 1 && rng() < 0.4 ? YELLOW : PURPLE }));
    dots.push({ x: root[0], y: root[1], r: 3, color: INK });   // the shell itself
    return { lines, dots };
  },

  /* fig. 8 — L-system fractal tree (procedural 3D tree) */
  lsystem(w, h, rng) {
    const lines = [], dots = [];
    (function grow(x, y, angle, len, depth, width) {
      if (depth === 0 || len < 3) {
        if (rng() < 0.6) dots.push({ x, y, r: 1.4, color: rng() < 0.25 ? YELLOW : PINK }); // blossom
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
