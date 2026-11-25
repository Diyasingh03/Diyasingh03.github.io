import { INK, PINK, BLUE, wobble } from '../utils.js';

/* fig. 1 — jittered bounding boxes under corruption (detection benchmark) */
export function detect(w, h, rng) {
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
}
