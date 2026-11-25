import { INK, PINK, PURPLE, BLUE, YELLOW, wobble } from '../utils.js';

/* fig. 5 — accept queue fanning into thread-pool lanes (HTTP server) */
export function threads(w, h, rng) {
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
}
