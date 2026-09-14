---
SECTION_ID: files.real-estate-sales-kit.furnished-night_png
TYPE: file/image
---

# Casa Lume — Furnished Evening Version

FILE: real-estate-sales-kit/furnished-night.png
WIDTH: 3072
HEIGHT: 2048
UTILITY: gpt_image
QUALITY: high
OUTPUT_FORMAT: png
IMAGE-INPUT: real-estate-sales-kit/furnished-day.png
IMAGE-INPUT-2: real-estate-sales-kit/empty-apartment.png
FILES: real-estate-sales-kit/furnished-day.png, real-estate-sales-kit/empty-apartment.png
PROMPT: |
  Goal: turn Image 1 into the evening version of the exact same staged property. Image 2 is the architecture reference. Change only time of day and practical-light state.

  Preserve exactly: every architectural feature from Image 2; camera position, crop, perspective, windows, arch, fireplace, walls, floor and cornice; every piece of furniture and decor from Image 1; furniture count, dimensions, placement, upholstery, rug, artwork, books, ceramics, olive tree, and dining set. Do not redesign or move anything.

  Evening treatment: blue-hour Lisbon light outside both French windows, deep cobalt sky with soft warm city-window bokeh beyond the balcony rails. Indoors, switch on one compact linen-shade floor lamp beside the sofa and a small pendant above the dining table through the arch. Add a low realistic fireplace flame inside the existing stone fireplace. Warm practical light at 2700K, cool blue ambient window fill, physically plausible mixed-light shadows and reflections.

  Mood: calm early evening before a viewing, warm enough to feel inhabited but still a truthful property photograph. Preserve detail in the windows and dark furniture; no crushed blacks, orange wash, fake cinematic fog, or dramatic movie lighting.

  Hard constraints: no people, no text, no logo, no watermark, no changed architecture, no moved or replaced furniture, no extra lamps, no candles, no new windows, no starry fantasy sky, no oversized fire, no excessive bloom, no duplicated objects, no CGI gloss.

DESCRIPTION: Evening relight of the exact furnished daytime room, preserving architecture, camera, and furniture identity.
USAGE: Step 3 of the real-estate sales-kit guide and optional night-listing variant. Draft only; do not publish without explicit approval.

COMMENTS: ## Design Notes
- Uses both day staging and empty source as references to reduce cumulative geometry drift.
- Success means the pair can flip back and forth without furniture or architecture jumping.
