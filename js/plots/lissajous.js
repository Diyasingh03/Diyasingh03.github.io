import { PINK, PURPLE, wobble } from '../utils.js';

/* fig. 4 — Lissajous gaze trace (ReadCoin eye-tracking) */
export function lissajous(w, h, rng) {
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
}
