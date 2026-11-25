import { PINK, PURPLE, YELLOW, wobble } from '../utils.js';

/* fig. 3 — rose curve + golden-angle phyllotaxis (Charakbloom) */
export function rose(w, h, rng) {
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
}
