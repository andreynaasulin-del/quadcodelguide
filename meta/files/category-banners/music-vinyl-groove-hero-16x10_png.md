---
SECTION_ID: files.category-banners.music-vinyl-groove-hero-16x10_png
TYPE: file/image
---

# Music Category Banner — Vinyl Groove, 16:10 Crop-Safe (no caption)

FILE: category-banners/music-vinyl-groove-hero-16x10.png
WIDTH: 2816
HEIGHT: 1760
UTILITY: gpt_image
QUALITY: high
OUTPUT_FORMAT: png
PROMPT: |
  Goal: a clean, caption-free 16:10 landscape variant of the reference photo (Image 1: macro vinyl record with tonearm/stylus lowering onto the groove, warm amber key light, cool chrome rim light, deep black background), for use as a plain cover image where no on-image text is wanted.

  Composition: recompose/extend the same scene to fill a full 16:10 landscape frame — keep the vinyl record, tonearm and stylus exactly as in Image 1 (same position, same lighting, same warm amber + cool chrome color grade, same macro groove detail), outpaint the black background further on the right so the frame reads as one continuous photographed scene, not a stretched crop. Add generous headroom at the very top and footroom at the very bottom so the record is never touching an edge, giving safe margin for any future center-crop to a tighter thumbnail ratio.

  Hard constraints: no text, no logos, no watermarks, no people, no hands, no neon, no cyberpunk, no festival/DJ-booth cliché. Do not alter the vinyl record, tonearm, stylus, dust motes, or their lighting/color grade from Image 1 — this is a pure aspect-ratio recompose, not a redesign.

IMAGE-INPUT: category-banners/music-vinyl-groove-hero.png
FILES: category-banners/music-vinyl-groove-hero.png

DESCRIPTION: Plain (caption-free) 16:10 crop-safe variant of the vinyl-groove hero photo — same scene, tonearm and lighting, outpainted to the site's native 16:10 card-cover ratio with safe head/foot margin. Companion to music-vinyl-groove-preview.png (same 16:10 frame, with the "MUSIC" caption baked in) — this version is for slots where the category label is already shown elsewhere and a second on-image title would be redundant.
USAGE: Candidate guide-cover image ("image" field) for a Music-category guide about building this banner — keeps the card clean since the site already renders the category label above the title. Not to be uploaded to production until explicit approval.

COMMENTS: ## Design Notes
- Third asset in the vinyl-groove banner set: music-vinyl-groove-hero.png (3:2 hero, Nanobanana) -> music-vinyl-groove-hero-16x10.png (this file, plain 16:10, gpt_image outpaint) -> music-vinyl-groove-preview.png (16:10 + "MUSIC" caption, gpt_image edit).
- Exact 16:10 (2816x1760) — same ratio/size as the Museum-of-Impossible-Things 16:10 promo banner and the site's .card .cover / .rel-card .rel-cover aspect-ratio, so no further center-crop loss on listing thumbnails.
- Draft only — hold for approval before any guides.json / production upload per PO instruction.
