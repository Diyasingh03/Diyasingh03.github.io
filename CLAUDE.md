# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Static personal portfolio website for Diya Singh. No build step, no package manager — pure HTML, CSS, and vanilla JS served directly.

**Design concept: "The Plotter's Notebook."** A mathematician-artist's working notebook: warm paper ground with a graph-grid, two inks (ultramarine = logic, vermillion = art), and generative pen-plotter art drawn live in `<canvas>`. Typography is Fraunces (variable serif, display + body) and IBM Plex Mono (annotations, labels, dates, chips).

## Dev Server

```bash
python -m http.server 3456
```

Then open `http://localhost:3456`. The `.claude/launch.json` is configured for this command so `preview_start` works out of the box.

## Architecture

Three files, all co-located:

- **`index.html`** — single-page app. Sections in order: `#hero → ticker → #about → #works → #chronology → #toolbox → #education → #teaching → #honors → #contact → footer`. Sections are numbered like a paper (`§ 01` …) via `.section-no`. No templating; content is hardcoded.
- **`styles.css`** — design tokens live in `:root` CSS variables at the top. Palette: `--paper`/`--paper-alt`/`--paper-card` (cream grounds), `--ink` (blue-black), `--blue` (ultramarine, "logic"), `--red` (vermillion, "art"), `--gold` (honors). Graph-grid background is built from layered `linear-gradient`s on `body`; paper grain is a fixed SVG-noise `body::after` overlay. Sections are separated by clearly labelled comment blocks.
- **`script.js`** — five features: nav (scrolled state, active link, mobile menu, scroll-top), typewriter (`#typedText`), `IntersectionObserver` scroll-reveal (`.reveal` → `.reveal.visible`), hero flow-field plotter (`#heroCanvas`), and the generative plot engine for `canvas[data-plot]` (seeded with mulberry32, strokes polylines in progressively by path length; click a plot to re-roll its seed).

## Key Design Conventions

- All color/shadow values must use CSS variables from `:root` — never hardcode hex values inline.
- Two-ink rule: `--blue` marks logic/structure (links, badges, curves), `--red` marks art/annotation (section numbers, captions, footnotes, "now" badges, dots). The hard offset shadow (`box-shadow: 4px 4px 0 …`) gives the letterpress feel on buttons/cards.
- Scroll-reveal: add class `reveal` to any element; the `IntersectionObserver` in `script.js` adds `visible` on intersection. Hero `.reveal` elements fire immediately via `setTimeout` stagger instead.
- Tags are `.chips` lists (`<ul class="chips"><li>…</li></ul>`); variants `.chips-sm` (smaller) and `.chips-cert` (gold, certifications).
- Section backgrounds alternate: default `--paper` and `.section-alt` (`--paper-alt`).
- Monospace text (labels, dates, captions) is lowercase by convention; display text is sentence case.

## Generative Plots

Each project card contains a `canvas[data-plot="<kind>"]` rendered by the matching algorithm in the `PLOTS` object in `script.js`: `rose` (Bloom), `detect` (animal detection), `tree` (Flip7 decision tree), `lissajous` (ReadCoin), `signal` (streaming), `lsystem` (procedural tree). To add a project with a plot, add a new key to `PLOTS` returning `{ lines: [{pts, color, width, alpha}], dots: [{x, y, r, color}] }` and reference it from the card's `data-plot`. Plots animate on first intersection, redraw statically on resize, and re-roll on click. All motion respects `prefers-reduced-motion`.

## Content Updates

All content (jobs, projects, skills, education) is plain HTML in `index.html` — no CMS or data files. To add an experience item, copy a `.timeline-item` in `#chronology`. To add a project card, copy a `.work-card` inside `.works-grid` (use `.work-wide` for a full-width featured card). Keep figure numbers (`fig. n`) in `.plot-caption` sequential.

## Assets

`Diya_Singh_Resume.pdf` is generated from `Diya_Singh_Resume.docx` (Word export) and linked from the hero and contact sections. When the docx changes, regenerate the PDF.
