/* glowing blue butterflies drifting over the hero. this file is the
   view: a canvas laid over the hero (clicks pass through), drawing a
   ButterflySwarm each frame. they use the blue ink, so pen 3 in the
   plate recolours them; the glow is white (--glow) so it reads light. hidden for reduced motion; paused off screen. */

import { REDUCED_MOTION, BLUE } from './utils.js';
import { ButterflySwarm } from './butterfly-swarm.js';

function readVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/* one wing pair, drawn in the butterfly's own frame (nose toward -y) */
function drawWings(ctx, size, open, color, highlight) {
  ctx.save();
  ctx.scale(open, 1); // flapping: wings squash toward the body
  for (const side of [-1, 1]) {
    // forewing
    ctx.beginPath();
    ctx.ellipse(side * size * 0.55, -size * 0.25, size * 0.6, size * 0.42, side * -0.5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    // hindwing
    ctx.beginPath();
    ctx.ellipse(side * size * 0.4, size * 0.32, size * 0.38, size * 0.3, side * 0.6, 0, Math.PI * 2);
    ctx.fill();
    // a pale spot on each forewing
    ctx.beginPath();
    ctx.arc(side * size * 0.62, -size * 0.28, size * 0.14, 0, Math.PI * 2);
    ctx.fillStyle = highlight;
    ctx.fill();
  }
  ctx.restore();
}

function drawButterfly(ctx, b, highlight) {
  // sparkle trail: tiny glowing dots that fade behind it
  ctx.shadowBlur = 6;
  b.trail.forEach(([x, y], i) => {
    if (i % 2) return;
    ctx.globalAlpha = 0.35 * (1 - i / b.trail.length);
    ctx.beginPath();
    ctx.arc(x, y, 1.1, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.rotate(b.heading + Math.PI / 2);
  ctx.globalAlpha = 0.8;
  ctx.shadowBlur = 22;
  drawWings(ctx, b.size, b.openness, BLUE, highlight);
  // body
  ctx.shadowBlur = 7;
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = BLUE;
  ctx.beginPath();
  ctx.ellipse(0, 0, b.size * 0.08, b.size * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function initHeroButterflies() {
  const hero = document.getElementById('hero');
  const canvas = document.getElementById('heroButterflies');
  if (!hero || !canvas || REDUCED_MOTION) {
    if (canvas) canvas.hidden = true;
    return;
  }
  const ctx = canvas.getContext('2d');
  let highlight = readVar('--paper-sheet');
  let glow = readVar('--glow') || 'white';
  document.addEventListener('theme:change', () => {
    highlight = readVar('--paper-sheet');
    glow = readVar('--glow') || 'white';
  });
  let swarm, raf, visible = true;

  function size() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (swarm) swarm.resize(w, h);
    else swarm = new ButterflySwarm({ count: w < 760 ? 4 : 7, width: w, height: h });
  }

  function frame() {
    swarm.step();
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    ctx.shadowColor = glow;
    ctx.fillStyle = BLUE;
    for (const b of swarm.butterflies) drawButterfly(ctx, b, highlight);
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    raf = requestAnimationFrame(frame);
  }

  function play() {
    cancelAnimationFrame(raf);
    if (visible && !document.hidden) raf = requestAnimationFrame(frame);
  }

  hero.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    swarm.setCursor({ x: e.clientX - r.left, y: e.clientY - r.top });
  });
  hero.addEventListener('pointerleave', () => swarm.setCursor(null));

  // only fly while the hero is on screen and the tab is visible
  new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; play(); }).observe(hero);
  document.addEventListener('visibilitychange', play);

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(size, 200);
  });

  size();
  play();
}
