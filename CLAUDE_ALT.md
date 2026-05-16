# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the app

No build step. Open `index.html` directly in a browser:
```
open index.html
```

All dependencies are loaded from CDN (localforage, jsPDF, Google Fonts) — internet access required on first load.

## Architecture

This is a single-file static web app — a birthday gift for Sophia themed around Amsterdam date ideas. All HTML, CSS, and JS live inline in the HTML files.

**Two files:**
- `index.html` — the full-featured version (use this one)
- `Basis.html` — the simpler base version without URL sharing or setup modal

**State model:**
- `dates[]` — array of `{ id, title, desc, img }` objects; `img` is a base64 JPEG data URL or `null`
- `extras[]` — array of base64 JPEG data URLs for the extra photos grid
- Persisted via localforage (IndexedDB with localStorage fallback), keys `ams-dates-v2` and `ams-extras-v2`
- In `index.html`, keys are scoped by `eventId` (e.g. `ams-dates-v2-<eventId>`) to support multiple independent instances from the same origin

**URL-based sharing (`index.html` only):**
- The setup modal encodes `{ eventId, tag, title1, titleH, sub, dates }` as base64 JSON into `window.location.hash` (`#data=<base64>`)
- On `init()`, if the hash is present, the UI is populated from it; storage is then looked up by the embedded `eventId`
- Images are stripped (`img: null`) from the shared payload — recipients upload their own photos

**Rendering:**
- Fully imperative: `renderDates()` and `renderExtras()` rebuild DOM from scratch each call, preserving open card state via a `Set` of open IDs
- Cards toggle open/closed one at a time (accordion pattern); `.open` class drives the CSS `max-height` transition

**Image handling:**
- All uploads go through `resizeImage()`: FileReader → HTMLImageElement → Canvas → `toDataURL('image/jpeg', 0.88)` at max 1800px on either dimension
- `index.html` uses a single persistent `<input type="file">` element with a `currentImageCallback` closure; `Basis.html` creates a new input per pick

**PDF export (`exportPDF`):**
- jsPDF, A4 portrait, 14mm margins
- Date rows alternate image-left / image-right; image column is fixed at 78mm, text column gets the remainder
- Images use CONTAIN scaling (never cropped); row height adapts to actual image aspect ratio, capped at 120mm
- Rounded corners applied via Canvas clip before passing to jsPDF
- Extra photos render in a 3-column grid at the end
