/* FlowField — the pen simulation behind fig. 1, with no DOM or canvas.
   pens trace a layered-sine vector field inside a disc; a cursor
   bends the field near it; the drawing finishes after `total`
   strokes. a view (hero-plotter.js) decides how to draw the pens. */

import { mulberry32 } from './utils.js';

export class FlowField {
  constructor({ cx, cy, radius, total = 360, maxActive = 70, step = 2.2, startPens = 46 }) {
    Object.assign(this, { cx, cy, radius, total, maxActive, stepLen: step, startPens });
    this.cursor = null;
  }

  /* start a new edition: a fresh field and a fresh set of pens */
  reset(seed) {
    this.seed = seed;
    this.rng = mulberry32(seed);
    const rng = this.rng;
    this.field = {
      f1: 0.006 + rng() * 0.006, f2: 0.006 + rng() * 0.006, f3: 0.003 + rng() * 0.003,
      p1: rng() * 6.28, p2: rng() * 6.28, p3: rng() * 6.28,
      swirl: 0.6 + rng() * 0.8,
    };
    this.active = [];
    this.done = [];
    this.strokes = 0;
    for (let i = 0; i < this.startPens; i++) this.active.push(this.spawnInDisc());
  }

  get finished() { return this.active.length === 0; }
  get pens() { return this.done.concat(this.active); }

  setCursor(point) { this.cursor = point; }

  contains(x, y, pad = 0) {
    const dx = x - this.cx, dy = y - this.cy, r = this.radius + pad;
    return dx * dx + dy * dy <= r * r;
  }

  /* a visitor's pen, started at (x, y); false if the drawing is full */
  spawnAt(x, y) {
    if (this.strokes >= this.total || this.active.length >= this.maxActive || !this.contains(x, y)) return false;
    this.active.push(this.makePen(x, y));
    return true;
  }

  /* move every active pen a few steps; retire pens that leave or run out */
  advance(substeps = 4) {
    const keep = [];
    for (const pen of this.active) {
      if (this.walk(pen, substeps)) { keep.push(pen); continue; }
      this.done.push(pen);
      if (this.strokes < this.total && (!this.cursor || this.rng() < 0.5)) keep.push(this.spawnInDisc());
    }
    this.active = keep;
  }

  /* --- internals --- */

  makePen(x, y) {
    const rng = this.rng, roll = rng();
    this.strokes++;
    return {
      pts: [[x, y]],
      ink: roll < 0.24 ? 0 : roll < 0.52 ? 1 : roll < 0.76 ? 2 : 3, // which of the four pens
      alpha: 0.3 + rng() * 0.4,
      width: rng() < 0.65 ? 0.9 : 1.5,
      life: 140 + rng() * 320,
    };
  }

  spawnInDisc() {
    const a = this.rng() * Math.PI * 2, r = Math.sqrt(this.rng()) * this.radius;
    return this.makePen(this.cx + Math.cos(a) * r, this.cy + Math.sin(a) * r);
  }

  angle(x, y) {
    const f = this.field;
    let a = (Math.sin(x * f.f1 + f.p1) + Math.cos(y * f.f2 + f.p2) + Math.sin((x + y) * f.f3 + f.p3)) * Math.PI * 0.6;
    const dx = x - this.cx, dy = y - this.cy;
    a += f.swirl * Math.exp(-(dx * dx + dy * dy) / (2 * 120 * 120));
    if (this.cursor) {
      const cx = x - this.cursor.x, cy = y - this.cursor.y;
      a += 1.8 * Math.exp(-(cx * cx + cy * cy) / (2 * 80 * 80));
    }
    return a;
  }

  /* returns false once the pen is spent or has left the disc */
  walk(pen, substeps) {
    for (let s = 0; s < substeps; s++) {
      const [x, y] = pen.pts[pen.pts.length - 1];
      const a = this.angle(x, y);
      const nx = x + Math.cos(a) * this.stepLen, ny = y + Math.sin(a) * this.stepLen;
      pen.pts.push([nx, ny]);
      pen.life--;
      if (pen.life <= 0 || !this.contains(nx, ny, 16)) return false;
    }
    return true;
  }
}
