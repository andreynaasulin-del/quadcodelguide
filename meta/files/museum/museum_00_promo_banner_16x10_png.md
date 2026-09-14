---
SECTION_ID: files.museum.museum_00_promo_banner_16x10_png
TYPE: file/image
---

# Museum of Impossible Things — Promo Banner (16:10 hero, no-crop variant)

FILE: museum/museum_00_promo_banner_16x10.png
WIDTH: 2816
HEIGHT: 1760
UTILITY: gpt_image
QUALITY: high
OUTPUT_FORMAT: png
PROMPT: |
  Award-winning museum exhibition photograph, wide 16:10 landscape composition, shot on medium-format Hasselblad, 40mm lens, deep focus, extremely fine micro-detail. Deliverable: a wide promo hero banner for an exhibition listing card — everything must sit comfortably inside a 16:10 frame with generous headroom and footroom, nothing touching the top or bottom edge.
  Scene: a vast pitch-dark museum hall, walls of black velvet swallowing all light, faint dust drifting through spotlight beams. Five round pedestals upholstered in deep charcoal velvet are arranged in a single wide horizontal row across the frame, each lit by its own single hard spotlight from above, with clear dark negative space between them. On the pedestals, left to right: (1) a thick rope tied into a perfect trefoil knot made entirely of flowing crystal-clear water with droplets frozen mid-orbit; (2) a jagged branching bolt of blinding white-hot lightning frozen solid mid-strike, standing upright like a sculpture, the brightest object in the hall; (3) center: a massive raw block of glacier ice with a real campfire burning inside it — sharp orange-gold flames sealed within crystal-clear ice, firelight travelling through internal fractures as glowing amber veins, freezing mist pooling at the base; (4) an antique hand-blown glass bottle with a raging miniature thunderstorm inside, a tiny lightning flash lighting the glass from within; (5) a flat absolutely black human shadow folded like fine silk into a neat stack, one corner curling up. Each exhibit reads clearly, the ice-with-fire block is the hero and sits centered.
  Composition constraint: keep all five pedestals and exhibits within the middle 55% of the frame height (a comfortable band, not stretched top-to-bottom), leaving clear dark hall/ceiling above and clear floor below for the plaque — this is a wide letterboxed hall view, not a tall vertical shot cropped down.
  Color and light: violent contrast of blazing orange fire and cold glacial blue-white against crushed blacks, warm amber spill on charcoal velvet, saturated punchy cinematic grade, high dynamic range. Tangible and physical — a photograph of real impossible objects, NOT a 3D render, NOT smooth CGI plastic.
  In the bottom strip of the frame, spanning wide and fully visible with clear margin below it — never touching the bottom edge: a large museum plaque — matte graphite metal plate with a thin glowing gradient strip along its top edge running from coral orange (#FF9569) to crimson red (#DD344D). Plaque text painted white, upright regular sans-serif (NOT italic), perfectly sharp and legible, EXACTLY verbatim: "MUSEUM OF IMPOSSIBLE THINGS" / "Five exhibits. One prompt formula." — and nothing else on the plaque.
  Hard constraints: no cyberpunk, no neon city, no sci-fi props, no people, no watermarks, no logos, no extra text anywhere except the plaque, plaque must not be cropped or touch the frame edge.

DESCRIPTION: 16:10 hero variant of the "Museum of Impossible Things" promo banner, composed specifically for the site's card/thumbnail crop ratio so the plaque and all five exhibits stay fully visible (no center-crop losses from the square 2880x2880 master).
USAGE: Replaces the square banner in the "image" field used by both the guide grid card (.card .cover, aspect-ratio 16/10) and the related-guides thumbnail (.rel-card .rel-cover, same 16/10) on quadcodeguide.vercel.app.

COMMENTS: ## Design Notes
- Root cause of the crop bug: site CSS hard-crops every listing/thumbnail cover to aspect-ratio 16/10, object-fit cover, object-position center. The 2880x2880 square master only exposed a 1800px-tall centered slice — cutting the plaque almost entirely.
- Fix: generate a dedicated 16:10 master (not a crop of the square) so composition — pedestal row + full plaque — is designed for the frame, no salvage cropping.
- 2816x1760 chosen: exact 16:10, divisible by 16 (GPT-Image requirement), ~4.96MP (under 8.3MP cap), no DESCALE needed.
- Site has ONE "image" field feeding both grid card and related-guide thumbnail — both use identical 16:10 CSS crop, so this single file covers both responsive spots. No separate thumbnail asset exists in the data schema.
- Same scene formula/plaque branding as the square cover and the 5 exhibit steps (black velvet hall, charcoal pedestals, single spotlights, graphite plaque, #FF9569->#DD344D gradient, upright sans-serif).
