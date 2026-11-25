import { INK, PINK, PURPLE, BLUE } from '../utils.js';

/* fig. 7 — stacked throughput traces with jitter (streaming) */
export function signal(w, h, rng) {
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
}
