/* typewriter cycling through "currently …" phrases in the hero */

import { REDUCED_MOTION } from './utils.js';

const PHRASES = [
  'automating email triage with AI @ Envita Solutions',
  'pursuing an M.S. in Computer Science @ Purdue',
  'teaching 400 students as Head TA of CS180',
  'benchmarking detection models against noise',
  'drawing with algorithms — like the one behind this page',
];

export function initTypewriter() {
  const typedEl = document.getElementById('typedText');

  if (REDUCED_MOTION) {
    typedEl.textContent = PHRASES[0];
    return;
  }

  let phraseIdx = 0, charIdx = 0, deleting = false;
  (function type() {
    const phrase = PHRASES[phraseIdx];
    charIdx += deleting ? -1 : 1;
    typedEl.textContent = phrase.slice(0, charIdx);
    let delay = deleting ? 26 : 48;
    if (!deleting && charIdx === phrase.length) { delay = 2400; deleting = true; }
    else if (deleting && charIdx === 0) { deleting = false; phraseIdx = (phraseIdx + 1) % PHRASES.length; delay = 420; }
    setTimeout(type, delay);
  })();
}
