---
SECTION_ID: plans.editorial-watch-spread
TYPE: note
---

# Editorial Magazine Spread — Middle+ Design Guide

## Concept
Original double-page editorial spread. Topic: "The Last Hand-Wound Movement" —
a short original feature about traditional mechanical watchmaking craft (own
text, no real publication/brand copied).

- LEFT page: full-bleed medium-format photo (Hasselblad aesthetic), watchmaker's
  hands assembling a movement.
- RIGHT page: real HTML/CSS typography (not AI text) — headline, dek, byline,
  2-column body, pull quote, inline-SVG exploded-movement infographic, folio.
- Page aspect 4:5 each → full spread = 8:5 = 16:10 (same ratio as guide preview
  banner — no separate composition math needed).

## Why HTML for the right page (design decision)
AI image models garble paragraph-length body text. Real typographic control
(grid, baseline rhythm, kerning) requires actual HTML/CSS rendering via
`image_edit_essentials` DRAW_HTML_TEXT — crisp at any size, print-safe.
Only the photo is AI-generated (Flux2Pro).

## Steps
- [x] 1. Generate left photo — Flux2Pro 402'd (no credits), switched to GPT-Image, 1536x1920
- [x] 2. Upscale left photo (SeedVR2) → 1920x2400 (1.25x)
- [x] 3. Build right page HTML (grid, infographic, copy), 1920x2400
- [x] 4. Render right page via DRAW_HTML_TEXT — first attempt rendered solid black
      (body background-color didn't paint through WebEngine capture); FIX: added a
      `position:fixed` full-canvas `.bg-layer` div with z-index:-2 instead of relying
      on html/body background alone. Works reliably — reuse this pattern next time.
- [x] 5. Stitch left + right → editorial-spread/spread-print.png (3840x2400 = 16:10 exactly)
- [x] 6. Resize → editorial-spread/preview-16x10.png (1600x1000)
- [x] 8. Revised print spread: added masthead, column rule, 3-line drop cap, quote glyph, photo caption
- [x] 9. Rebuilt preview as a DISTINCT promo mockup (tilted magazine on dark desk bg + text block),
      not a resize of print — matches "reads as guide-card promo" requirement
- [ ] 10. Publish as guide (pending PO approval on copy/visuals)

## Key facts for future HTML-rendered pages
- `draw_html_text` background CSS on `html`/`body` alone is unreliable — always add a
  `position:fixed; inset:0; z-index:-2` background div as a real painted layer.
- `<img src="/...">` inside draw_html_text HTML does NOT load (tested, fails silently,
  area stays transparent) — do not rely on it. For compositing real photos, use
  input_file directly (draw only within a target sub-rectangle) or use paste/stitch
  from ActionImageEssentials instead.
- `rotate` (non-90°) fills newly-exposed corners with OPAQUE BLACK, not alpha=0,
  despite docs saying "transparent for PNG". Fix: after rotate, run
  `filter make_color_transparent color=autocolor outer_only=true` before pasting
  onto another background, or the corners will show as solid black shapes.
- Recipe for "tilted magazine/object mockup": resize → expand (transparent pad ~20%)
  → rotate (small angle) → make_color_transparent (autocolor, outer_only) → crop auto
  → resize to target → paste onto a separate HTML-rendered gradient background.

## Files
- editorial-spread/left-photo.png (raw gen)
- editorial-spread/left-photo-4k.png (upscaled)
- editorial-spread/right-page.html (source)
- editorial-spread/right-page.png (rendered)
- editorial-spread/spread-print.png (final combined, print-ready)
- editorial-spread/preview-16x10.png (guide card banner)
