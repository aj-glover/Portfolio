# AI Agent Instructions

## Project overview
This is a static frontend demo for a magnetic 3D grid with a content preview overlay.
The app is built with Parcel and vanilla JavaScript, using `gsap`, `imagesloaded`, and `splitting`.

## Key files
- `src/index.html` — main HTML entry and preview item markup.
- `src/css/base.css` — all demo styling.
- `src/js/index.js` — runtime entry point and initialization.
- `src/js/grid.js`, `src/js/gridItem.js`, `src/js/cursor.js`, `src/js/magneticFx.js`, `src/js/preview.js`, `src/js/utils.js` — main frontend modules.
- `src/img/thumbs/` and `src/img/full/` — thumbnail and full preview images.

## Build and run
- Install dependencies: `npm install`
- Start local development server: `npm start`
- Build production assets: `npm run build`

## Project conventions and notes
- The demo uses Parcel for bundling and local dev serving; do not assume a separate backend.
- Keep markup IDs and link targets in sync: each `.grid__item` anchor `href="#preview-X"` must match a `.preview__item` element with `id="preview-X"`.
- `.grid__item` elements use `data-title` values for cursor text updates on hover.
- JavaScript modules are ES modules imported from `src/js/index.js`; changes to import paths should preserve Parcel compatibility.

## When working on this repo
- Focus on the `src/` folder for all behavior and layout changes.
- Avoid adding unnecessary runtime frameworks; this repo is intentionally minimal.
- There are no explicit test scripts in this project.

## Useful references
- `package.json` scripts for development and build.
- `README.md` for installation and demo context.
