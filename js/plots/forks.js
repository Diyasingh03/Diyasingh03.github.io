import { INK, PINK, PURPLE, BLUE, YELLOW, wobble } from '../utils.js';

/* fig. 6 — fork/exec process tree with a pipeline (Unix shell) */
export function forks(w, h, rng) {
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
}
