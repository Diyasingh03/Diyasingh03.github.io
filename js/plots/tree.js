import { INK, PINK, BLUE, wobble } from '../utils.js';

/* fig. 2 — expected-value decision tree, left → right (Flip7 DP agent) */
export function tree(w, h, rng) {
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
}
