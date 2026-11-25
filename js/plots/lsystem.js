import { INK, PINK, YELLOW, wobble } from '../utils.js';

/* fig. 8 — L-system fractal tree (procedural 3D tree) */
export function lsystem(w, h, rng) {
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
}
