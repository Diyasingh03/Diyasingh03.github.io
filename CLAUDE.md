# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Static personal portfolio website for Diya Singh, served at https://diya.wiki. No build step, no package manager — pure HTML, CSS, and vanilla JS (ES modules) served directly.

**Design concept: "The Plotter's Notebook" (pastel edition).** A mathematician-artist's working notebook on a warm white/cream ground with a graph-grid. Pastel inks: pink (art/annotation), purple (logic/links), blue (structure/curves), and a little yellow (honors/gilding); plum ink for text. Generative pen-plotter art is drawn live in `<canvas>`. Typography is Fraunces (variable serif) and IBM Plex Mono (annotations, labels, dates, chips); the hero alone also uses Inter (the name garden), IBM Plex Sans (wall-label description) and Newsreader italic (plate caption).

## Dev Server

```bash
python -m http.server 3456
```

Then open `http://localhost:3456`. The `.claude/launch.json` is configured for this command so `preview_start` works out of the box. The JS uses ES modules, so the site must be served over HTTP (opening `index.html` via `file://` will not run scripts).

## Deployment

Pushed to `Diyasingh03/Diyasingh03.github.io` on GitHub; `.github/workflows/deploy.yml` deploys every push to `main` to GitHub Pages (custom domain in `CNAME`). **Only the Diyasingh03 GitHub account may be used** — the remote URL is pinned to `https://Diyasingh03@github.com/...` and local git identity is the Diyasingh03 noreply email; do not change either. The resume PDF is exported from `Diya_Singh_Resume.docx` (gitignored); regenerate the PDF when the docx changes. There are two résumés, both linked from the hero and contact: `Diya_Singh_Resume.pdf` ("Résumé · ML") and `Diya_Singh_EP_Resume.pdf` ("Résumé · systems").

**Positioning:** the site leads with ML/AI and software engineering (C++, Python, Java are the strongest languages). Art & design is the supporting flourish, carried by the visual design and live plots, not the headline copy.

## Architecture

- **`index.html`** — single page, content hardcoded. The hero is two columns: fig. 0, the name garden (`#heroGarden` svg + plant slider + regrow), the wall-label description, buttons and links on the left; fig. 1, the flow-field plate (`#plateSheet`: canvas, registration-mark svg, four pen pickers, reset) on the right; a pink footnote (`#gardenNote`) reports the garden's live numbers. Sections in order: `#hero → ticker → #about → #works → #chronology → #toolbox → #education → #teaching → #honors → #contact → footer`, numbered like a paper (`§ 01` …) via `.section-no`.
- **`css/`** — one stylesheet per concern, loaded in order from `index.html`:
  - `tokens.css` — all design tokens in `:root`. Grounds (`--paper`, `--paper-alt`, `--paper-card`), text inks (`--ink`, `--ink-soft`), accent inks (`--pink`, `--purple`, `--blue`, `--yellow`), washes, rules/grid, fonts, shadow, easing.
  - `base.css` — reset, body graph-grid ground, paper-grain overlay, margin rule, `.reveal` transition, `.container`.
  - `components.css` — nav, mobile menu, buttons, chips, ticker, footer, scroll-top.
  - `sections/` — one file per section, loaded in page order: `scaffold.css` (shared `.section`/`.section-head` rules), then `hero.css`, `about.css`, `works.css`, `chronology.css`, `toolbox.css`, `education.css`, `teaching.css`, `honors.css`, `contact.css`. A new section gets its own file plus a `<link>` in `index.html` before `responsive.css`.
  - `responsive.css` — breakpoints and `prefers-reduced-motion`.
- **`js/`** — ES modules, entry point `js/main.js` (loaded with `type="module"`):
  - `utils.js` — `REDUCED_MOTION`, ink palette read from CSS variables, `mulberry32` seeded rng, `wobble`.
  - `nav.js`, `reveal.js` — one feature each.
  - `theme.js` — light/dark mode. An inline script in `<head>` sets `<html data-theme>` before first paint (saved choice in `localStorage` `diya-wiki-theme`, else `prefers-color-scheme`); this module runs the nav's sun/moon `#themeToggle`, keeps following the system until the visitor chooses, and fires `theme:change`. Dark values are a `:root[data-theme="dark"]` block at the end of `tokens.css` — every color token must have a dark value there.
  - `inks.js` — the four pen pickers in the hero plate. Pens 1–3 override `--pink`/`--purple`/`--blue` on `:root` (whole page), pen 4 only inks the plot; choices persist in `localStorage` (`diya-wiki-inks`), reset restores `tokens.css`. Fires `inks:change`; `utils.js` ink colours are live `let` bindings refreshed via `refreshInks()`, and project plots redraw on the event.
  - Generative code is split into a pure **model** (no DOM, testable) and a thin **view** (DOM/canvas/SVG, input):
    - `flow-field.js` — `FlowField` class: pens on a layered-sine field inside a disc, cursor bending, 360-stroke limit. View: `hero-plotter.js` (`PlateView` draws it incrementally onto `#heroCanvas`, 560×640 sheet units; pointer, "new edition", resize, re-inking).
    - `butterfly-swarm.js` — `ButterflySwarm`/`Butterfly`: wandering, edge-avoiding, cursor-shy butterflies with flapping phase and a short trail. View: `hero-butterflies.js` (a click-through canvas over the hero, glowing in `--blue` so pen 3 recolours them; off for reduced motion, paused off screen).
    - `meadow.js` — `growMeadow(cx, cy)`: grass, leafy vines and flowers laid out around a point, each with a birth time that grows with distance so it spreads in rings. View: `idle-meadow.js` (a fixed click-through canvas at `z-index: -1`, *behind* all content so text stays readable; meadows are page-anchored and scroll with the page. Resting the mouse 3 s grows one at the cursor that fades on the next move (mouse only, off for reduced motion); clicking empty background — anything not matching `NOT_BACKGROUND` — plants one that stays, up to 5. Grass/leaves use `--leaf`).
    - `lsystem.js` — `TextMask` (pixel mask of text), `LSystem` (stochastic grammar) and `growGarden()` (turtle that steers stems to stay on the letters). View: `hero-garden.js` (builds the SVG over the name, plant slider, regrow, `#gardenNote` footnote). Petals use the accent classes so they follow the pens.
  - `plots/` — one generative figure per file (`rose.js`, `detect.js`, …), each exporting `<kind>(w, h, rng)`; `plots/index.js` collects them into the `PLOTS` object.
  - `plot-engine.js` — strokes a figure in progressively by path length; intersection-triggered, click-to-re-roll, resize-aware.

## Key Design Conventions

- All color/shadow values must use CSS variables from `css/tokens.css` — never hardcode hex values elsewhere. This is what makes dark mode work: a new color token needs both a light value and a dark value.
- Ink roles: `--pink` = annotation/art (section numbers, captions, "now" badges, margin rule), `--purple` = logic (links, badges, active states), `--blue` = structure (curves, timeline dots), `--yellow` = honors (cert chips, honor asterisks). The hard offset shadow (`box-shadow: 4px 4px 0 …`) gives the letterpress feel.
- Scroll-reveal: add class `reveal` to any element; `js/reveal.js` adds `visible` on intersection. Hero `.reveal` elements fire immediately via `setTimeout` stagger instead.
- Tags are `.chips` lists (`<ul class="chips"><li>…</li></ul>`); variants `.chips-sm` (smaller) and `.chips-cert` (yellow, certifications).
- Section backgrounds alternate: default `--paper` and `.section-alt` (`--paper-alt`, pastel lavender).
- Monospace text (labels, dates, captions) is lowercase by convention; display text is sentence case.

## Generative Plots

Each project card contains a `canvas[data-plot="<kind>"]` rendered by the matching algorithm in `js/plots/<kind>.js`. ML & AI group: `detect` (animal detection), `tree` (Flip7 decision tree), `rose` (Charakbloom), `lissajous` (ReadCoin). Systems & graphics group: `threads` (C++ HTTP server), `forks` (Unix shell), `signal` (streaming), `lsystem` (procedural tree). To add a project with a plot, create `js/plots/<kind>.js` exporting `<kind>(w, h, rng)`, register it in `js/plots/index.js`, returning `{ lines: [{pts, color, width, alpha}], dots: [{x, y, r, color}] }` and reference it from the card's `data-plot`. Plots animate on first intersection, redraw statically on resize, and re-roll on click. All motion respects `prefers-reduced-motion`.

## Content Updates

All content (jobs, projects, skills, education) is plain HTML in `index.html` — no CMS or data files. To add an experience item, copy a `.timeline-item` in `#chronology`. To add a project card, copy a `.work-card` into the right `.works-grid` (each grid follows an `h3.works-group` heading: "machine learning & ai" or "systems & graphics"; use `.work-wide` for a full-width featured card). Keep figure numbers (`fig. n`) in `.plot-caption` sequential.
