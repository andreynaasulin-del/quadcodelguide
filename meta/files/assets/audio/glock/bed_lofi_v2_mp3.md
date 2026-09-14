---
SECTION_ID: files.assets.audio.glock.bed_lofi_v2_mp3
TYPE: file/sound
---

# Ghost Protocol — lo-fi bed v2 (new take on the promo-bed recipe)

FILE: assets/audio/glock/bed_lofi_v2.mp3

UTILITY: suno
CUSTOM_MODE: True
MAKE_INSTRUMENTAL: True
TITLE: Cold Bench
STYLE: lofi hip hop, downtempo, warm analog
DURATION: 120
FORMAT: mp3
PROMPT: |
  Instrumental only, no vocals, no vocal chops, no spoken word.
  Warm Rhodes electric piano, muted upright bass, dusty brushed drum loop,
  soft vinyl crackle, light tape saturation, occasional muted electric guitar note.
  82 BPM, 4/4, steady groove, no drops, no builds, no big dynamic swings.
  Structure A-A-B-A with clear 4-bar edit points, loop-safe tail.
  Keep 1-4 kHz uncluttered. Low-energy background bed, minor key, slightly colder
  and more restrained than a cosy study beat.

DESCRIPTION: Second lo-fi instrumental bed, same production recipe as promo-bed-lofi, new composition.
USAGE: Score under the 30.72s Glock-18C WeaponDetailsViewer render.

COMMENTS: ## Audio Notes
- Deliberate clone of the one recipe that worked in this project
  (meta/files/_temp/generated/promo-bed-lofi_mp3.md): Suno, custom mode,
  instrumental flag at model level, short STYLE label, arrangement constraints in
  PROMPT. Everything invented from scratch in this thread — Timbaland percussion,
  bar-by-bar boom-bap, Stable Audio — was rejected by the PO.
- Changes vs the reference, so it is a new track and not a re-roll of the same one:
  82 BPM instead of 78, minor key, muted guitar added as a second colour.
- 120 s generated for a 30.72 s cut. At 82 BPM a bar is 2.93 s, so 30.72 s is
  10.5 bars — the cut lands on a half-bar and gets a 2.5 s fade-out.
- Post-chain after generation: trim 30.72 s window -> fade in 0.8 / out 2.5 ->
  EBU R128 normalise to -16 LUFS (TP -1.5) -> mux. Same chain used for v1.
