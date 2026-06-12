# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Static personal portfolio website for Diya Singh, served at https://diya.wiki. No build step, no package manager — pure HTML, CSS, and vanilla JS (ES modules) served directly.

**Design concept: "The Plotter's Notebook" (pastel edition).** A mathematician-artist's working notebook on a warm white/cream ground with a graph-grid. Pastel inks: pink (art/annotation), purple (logic/links), blue (structure/curves), and a little yellow (honors/gilding); plum ink for text. Generative pen-plotter art is drawn live in `<canvas>`. Typography is Fraunces (variable serif) and IBM Plex Mono (annotations, labels, dates, chips).

## Dev Server

```bash
python -m http.server 3456
```

Then open `http://localhost:3456`. The `.claude/launch.json` is configured for this command so `preview_start` works out of the box. The JS uses ES modules, so the site must be served over HTTP (opening `index.html` via `file://` will not run scripts).

## Deployment

Pushed to `Diyasingh03/Diyasingh03.github.io` on GitHub; `.github/workflows/deploy.yml` deploys every push to `main` to GitHub Pages (custom domain in `CNAME`). **Only the Diyasingh03 GitHub account may be used** — the remote URL is pinned to `https://Diyasingh03@github.com/...` and local git identity is the Diyasingh03 noreply email; do not change either. The resume PDF is exported from `Diya_Singh_Resume.docx` (gitignored); regenerate the PDF when the docx changes.

## Architecture

- **`index.html`** — single page, content hardcoded. Sections in order: `#hero → ticker → #about → #works → #chronology → #toolbox → #education → #teaching → #honors → #contact → footer`, numbered like a paper (`§ 01` …) via `.section-no`.
- **`css/`** — one stylesheet per concern, loaded in order from `index.html`:
  - `tokens.css` — all design tokens in `:root`. Grounds (`--paper`, `--paper-alt`, `--paper-card`), text inks (`--ink`, `--ink-soft`), accent inks (`--pink`, `--purple`, `--blue`, `--yellow`), washes, rules/grid, fonts, shadow, easing.
  - `base.css` — reset, body graph-grid ground, paper-grain overlay, margin rule, `.reveal` transition, `.container`.
  - `components.css` — nav, mobile menu, buttons, chips, ticker, footer, scroll-top.
  - `sections.css` — section scaffolding plus hero and §01–§08.
  - `responsive.css` — breakpoints and `prefers-reduced-motion`.
- **`js/`** — ES modules, entry point `js/main.js` (loaded with `type="module"`):
  - `utils.js` — `REDUCED_MOTION`, ink palette read from CSS variables, `mulberry32` seeded rng, `wobble`.
  - `nav.js`, `typewriter.js`, `reveal.js` — one feature each.
  - `hero-plotter.js` — flow-field pens drawing `#heroCanvas` live.
  - `plots.js` — the `PLOTS` object: one generative figure algorithm per project card.
  - `plot-engine.js` — strokes a figure in progressively by path length; intersection-triggered, click-to-re-roll, resize-aware.

## Key Design Conventions

- All color/shadow values must use CSS variables from `css/tokens.css` — never hardcode hex values elsewhere.
- Ink roles: `--pink` = annotation/art (section numbers, captions, "now" badges, margin rule), `--purple` = logic (links, badges, active states), `--blue` = structure (curves, timeline dots), `--yellow` = honors (cert chips, honor asterisks). The hard offset shadow (`box-shadow: 4px 4px 0 …`) gives the letterpress feel.
- Scroll-reveal: add class `reveal` to any element; `js/reveal.js` adds `visible` on intersection. Hero `.reveal` elements fire immediately via `setTimeout` stagger instead.
- Tags are `.chips` lists (`<ul class="chips"><li>…</li></ul>`); variants `.chips-sm` (smaller) and `.chips-cert` (yellow, certifications).
- Section backgrounds alternate: default `--paper` and `.section-alt` (`--paper-alt`, pastel lavender).
- Monospace text (labels, dates, captions) is lowercase by convention; display text is sentence case.

## Generative Plots

Each project card contains a `canvas[data-plot="<kind>"]` rendered by the matching algorithm in `js/plots.js`: `rose` (Bloom), `detect` (animal detection), `tree` (Flip7 decision tree), `lissajous` (ReadCoin), `signal` (streaming), `lsystem` (procedural tree). To add a project with a plot, add a key to `PLOTS` returning `{ lines: [{pts, color, width, alpha}], dots: [{x, y, r, color}] }` and reference it from the card's `data-plot`. Plots animate on first intersection, redraw statically on resize, and re-roll on click. All motion respects `prefers-reduced-motion`.

## Content Updates

All content (jobs, projects, skills, education) is plain HTML in `index.html` — no CMS or data files. To add an experience item, copy a `.timeline-item` in `#chronology`. To add a project card, copy a `.work-card` inside `.works-grid` (use `.work-wide` for a full-width featured card). Keep figure numbers (`fig. n`) in `.plot-caption` sequential.
