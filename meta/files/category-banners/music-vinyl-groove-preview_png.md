---
SECTION_ID: files.category-banners.music-vinyl-groove-preview_png
TYPE: file/image
---

# Music Category Promo Preview — 16:10 with Caption

FILE: category-banners/music-vinyl-groove-preview.png
WIDTH: 2816
HEIGHT: 1760
UTILITY: gpt_image
QUALITY: high
OUTPUT_FORMAT: png
PROMPT: |
  Goal: a 16:10 promo/preview banner for the Music category of a guide website, built from the reference photo (Image 1: macro vinyl record with tonearm/stylus lowering onto the groove, warm amber key light, cool chrome rim light, deep black background).

  Composition: recompose/extend the same scene to fill a full 16:10 landscape frame — keep the vinyl record and tonearm exactly as in Image 1 (same lighting, same warm amber + cool chrome color grade, same macro grooves), but widen/outpaint the black background on the right side so there is calm, mostly-empty dark negative space for a caption. Add generous headroom at the very top and footroom at the very bottom (nothing touching the top/bottom edges) so the frame survives a center-crop to a tighter thumbnail ratio without losing the record or the caption.

  Caption / on-image text (bottom-right third of the frame, on the extended dark background, NOT overlapping the vinyl record):
  - Thin corner-bracket frame element (simple L-shaped line brackets, one at the top-right corner, one at the bottom-right corner of the caption zone only — not around the whole image) in a warm coral-orange color (#FF9569).
  - A short horizontal accent bar/underline directly above the title, rendered as a gradient from coral-orange (#FF9569) on the left to red (#DD344D) on the right.
  - Title text, exact verbatim, bold condensed sans-serif (League-Spartan-like, geometric, confident, all caps, tight letter-spacing), pure white (#FFFFFF): "MUSIC"
  - Subtitle directly below the title, same sans-serif family but regular weight, smaller size, warm light-gray (#C9CAD6): "Turn one prompt into a track."

  Lighting/background for the caption zone: near-black navy background (#0B0D15 / #13131E, NOT pure flat black, subtle warm bounce-light gradient from the vinyl's glow bleeding faintly into the dark on the left edge of the caption zone), matching the photographic mood of the rest of the frame — the caption must look like it belongs in the same photographed scene, not like a flat UI panel pasted on top.

  Hard constraints: render the title and subtitle text EXACTLY as given, verbatim, no extra words, no extra punctuation, no misspellings. No watermark, no logos, no additional text anywhere else in the frame. Do not change the vinyl record, tonearm, stylus, dust motes, or their lighting/color grade from Image 1. Do not add people, hands, neon, cyberpunk elements, or festival/DJ imagery.

IMAGE-INPUT: category-banners/music-vinyl-groove-hero.png
FILES: category-banners/music-vinyl-groove-hero.png

DESCRIPTION: 16:10 promo/preview banner for the Music category — the same vinyl-groove hero photo recomposed into a full 16:10 frame with generous head/foot-room, plus an English caption ("MUSIC" / "Turn one prompt into a track.") styled per the Quadcode guidebook: League-Spartan-style bold caps title, coral-to-red gradient accent bar (#FF9569 -> #DD344D), thin corner-bracket motif, near-black navy backdrop (not pure black).
USAGE: Music category promo/preview banner for card thumbnails and the 16:10 listing grid on quadcodeguide.vercel.app — crop-safe variant of music-vinyl-groove-hero.png with an on-image caption baked in. Not to be uploaded to production until explicit approval.

COMMENTS: ## Design Notes
- Built as an edit of music-vinyl-groove-hero.png (Image 1) via gpt_image, not a fresh Nanobanana generation — gpt_image is the better tool for reliable in-image typography (per its own template guidance), while Nanobanana stays the tool for the pure photographic hero shot.
- Exact 16:10 (2816x1760), same ratio as the earlier Museum-of-Impossible-Things 16:10 promo banner — this is the site's native .card .cover / .m-cover aspect-ratio, so no further center-crop loss on listing thumbnails.
- Caption zone placed bottom-right on newly-extended dark background so nothing overlaps the record itself; corner brackets + gradient bar + League Spartan title/subtitle follow the pinned brand_guidebook spec (accent gradient #FF9569->#DD344D, near-black navy not pure black, League Spartan headings, corner-bracket "focus grid" motif).
- Draft only — hold for approval before any guides.json / production upload per PO instruction.
