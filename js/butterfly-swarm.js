/* ButterflySwarm — the model behind the hero's butterflies, no canvas.
   each butterfly wanders on a smoothly turning heading, keeps inside
   the bounds, shies away from the cursor, and flaps at its own pace.
   hero-butterflies.js draws them. */

import { mulberry32 } from './utils.js';

const TRAIL = 10;           // remembered positions for the sparkle trail
const EDGE = 60;            // how close to an edge before turning back
const SHY_RADIUS = 130;     // cursor distance that makes them flee

class Butterfly {
  constructor(rng, width, height) {
    this.rng = rng;
    this.x = rng() * width;
    this.y = rng() * height;
    this.heading = rng() * Math.PI * 2;
    this.turn = 0;                          // current turning rate
    this.speed = 0.55 + rng() * 0.6;
    this.size = 12 + rng() * 8;             // wingspan scale, px
    this.phase = rng() * Math.PI * 2;       // wing flap phase
    this.flapRate = 0.18 + rng() * 0.1;
    this.trail = [];
  }

  /* 0 = wings closed, 1 = wings fully open */
  get openness() {
    return 0.25 + 0.75 * Math.abs(Math.sin(this.phase));
  }

  step(width, height, cursor) {
    const rng = this.rng;
    // wander: the turning rate drifts, so paths curve instead of jitter
    this.turn += (rng() - 0.5) * 0.02;
    this.turn *= 0.96;
    let desired = this.heading + this.turn;

    // near an edge, steer back toward the middle
    if (this.x < EDGE || this.x > width - EDGE || this.y < EDGE || this.y > height - EDGE) {
      desired = blend(desired, Math.atan2(height / 2 - this.y, width / 2 - this.x), 0.06);
    }
    // near the cursor, steer away from it and hurry a little
    let hurry = 1;
    if (cursor) {
      const dx = this.x - cursor.x, dy = this.y - cursor.y, d = Math.hypot(dx, dy);
      if (d < SHY_RADIUS) {
        desired = blend(desired, Math.atan2(dy, dx), 0.18);
        hurry = 1 + (1 - d / SHY_RADIUS) * 1.6;
      }
    }
    this.heading = desired;

    const v = this.speed * hurry;
    this.x += Math.cos(this.heading) * v;
    this.y += Math.sin(this.heading) * v + Math.sin(this.phase * 0.5) * 0.25; // a little bob
    this.phase += this.flapRate * hurry;

    this.trail.unshift([this.x, this.y]);
    if (this.trail.length > TRAIL) this.trail.pop();
  }
}

/* turn angle `a` toward angle `b` by fraction t, the short way round */
function blend(a, b, t) {
  const d = Math.atan2(Math.sin(b - a), Math.cos(b - a));
  return a + d * t;
}

export class ButterflySwarm {
  constructor({ count, width, height, seed = Date.now() }) {
    const rng = mulberry32(seed);
    this.width = width;
    this.height = height;
    this.cursor = null;
    this.butterflies = Array.from({ length: count }, () => new Butterfly(rng, width, height));
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
  }

  setCursor(point) { this.cursor = point; }

  step() {
    for (const b of this.butterflies) b.step(this.width, this.height, this.cursor);
  }
}
