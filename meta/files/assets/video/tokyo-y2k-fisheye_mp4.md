---
SECTION_ID: files.assets.video.tokyo-y2k-fisheye_mp4
TYPE: file/video
---

# Tokyo Y2K Streetwear — 8mm Fisheye (13s)

FILE: assets/video/tokyo-y2k-fisheye.mp4
UTILITY: seedance
DURATION: 13
ASPECT_RATIO: 16:9
RESOLUTION: 1080p
SPEED_MODE: standard
DESCRIPTION: >
  Thirteen-second raw handheld streetwear film shot on an 8mm vintage fisheye, ultra-wide
  16mm perspective, Tokyo at night. Six beats in thirteen seconds: zipper-slit reveal,
  fisheye pan-out to a neon corner, whip-pan down a sidewalk, claw-machine arcade,
  mint-green diner booth with a half-second thermal infrared flash, street high-five, then
  a ground-level fisheye looking straight up that gets wiped to black by a palm over the
  lens. Two subjects, unchanged wardrobe, cut on a boom-bap kick.

PROMPT: |
  13-second raw handheld streetwear fashion film, shot on an 8mm vintage fisheye lens,
  ultra-wide 16mm perspective, heavy barrel distortion on every edge, bowed verticals,
  exaggerated foreground. Tokyo street night. Y2K hip-hop music video direction.

  Cast, identical wardrobe in every single shot:
  - SUBJECT A: young Asian man, black streetwear bucket hat, black embroidered jacket.
  - SUBJECT B: young Black man, braided hair, bright royal blue crewneck sweater with
    chunky yellow graphic lettering across the chest, green paisley scarf.
  Photorealistic skin with visible pores and specular sheen, natural hair and fabric
  motion, no plastic smoothing.

  Shot list, cut hard on the beat:

  0.0-2.0s — Extreme close-up inside pitch blackness, framed through a narrow vertical
  zipper slit. Through the slit: SUBJECT A crouching low in his bucket hat and embroidered
  jacket. The camera rushes backward out through the slit and snaps into a super-wide
  fisheye low angle looking up at both men standing on a glowing Tokyo street corner,
  tall neon skyscrapers bowing inward around them against a black sky.

  2.0-4.0s — Hard handheld whip-pan right, down a neon-lit sidewalk. SUBJECT B steps
  casually through frame, gesturing at the lens. Fast rotational motion blur sweeps the
  screen and carries into the next shot.

  4.0-6.0s — Cut inside a bright Japanese claw-machine arcade: pastel pink interior walls,
  banks of fluorescent overhead tubes, rows of glass cabinets. Camera tracks backward as
  SUBJECT B walks forward holding a small pink object to his ear, smiling and talking. A
  stylized liquid-chrome animated frame swirls briefly around the edges of the image.

  6.0-8.0s — Cut to a retro mint-green fast-food diner booth, warm hanging lamp overhead.
  Low wide angle across the white tabletop as SUBJECT B reaches his hand straight toward
  the lens, offering food. For half a second a psychedelic thermal infrared pass flashes
  over the whole frame — vivid heat-map red, neon green and deep blue — then snaps back to
  real life.

  8.0-10.0s — SUBJECT A pops up from behind the diner table with an energetic reaction,
  drink cup in hand, as the camera sweeps low past him. Hard cut outdoors: both men walk
  the night pavement and high-five in motion under glowing shopfronts.

  10.0-13.0s — Camera drops to extreme ground level on the asphalt of a narrow alley,
  fisheye pointing straight up. Both men loom enormous over the lens beneath tall vertical
  glowing neon signboards. SUBJECT A stoops and reaches his palm down across the lens,
  triggering a rapid spinning rotational blur that wipes the screen to black.

  Look: authentic analog 8mm film grain, gate weave, natural lens distortion and edge
  softness, realistic handheld shake, rich contrasty neon lighting, crisp wet-pavement
  reflections, crushed blacks, warm skin against cool shadows, slight halation on
  highlights.

  Signage and garment type stay illegible on purpose: neon signboards read as vertical
  glowing colour bars and abstract strokes, shop windows are out of focus or
  motion-blurred, the sweater lettering is a chunky abstract graphic shape rather than
  readable words. No captions, no subtitles, no timecodes, no watermarks, no logos, no
  brand marks.

  Audio: upbeat 90s boom-bap hip-hop — heavy warm bass, dusty swung drum break, classic
  vinyl scratches on the transitions, short chopped vocal stabs, bright synth accents.
  Under it, live street ambience: traffic wash, footsteps, distant voices, and arcade
  cabinet bleeps during the arcade shot. Every cut, whip-pan and the final lens wipe lands
  on the kick. No dialogue, no lyrics, no voiceover.

COMMENTS: ## Video Notes
- 13s is inside Seedance's 4-15s window, so no trimming pass is needed afterwards.
- Six scene changes in thirteen seconds is roughly 2.2s per beat. That is the same density
  that worked on `assets/video/urban-fashion-fisheye-v2.mp4`; going faster on a fisheye
  just smears the frame instead of reading as energy.
- Text is deliberately suppressed. Prior generations in this project (v1 of the urban
  fashion film) produced melting pseudo-letters on HUD labels and shop signage that
  shifted every frame — the model has no stable glyph model across 300+ frames. Neon is
  therefore specified as glowing colour bars and the sweater lettering as an abstract
  graphic shape. This keeps the Y2K look without the wobble artefact.
- Wardrobe is restated per subject because a six-cut edit is exactly where continuity
  breaks first: bucket hat + black embroidered jacket on A, royal blue sweater + green
  paisley scarf on B, in every shot.
- Fisheye is the whole premise: if frames come back rectilinear, the take is a reject.
- Audio comes from Seedance's native generation because it can sync arcade bleeps and the
  lens-wipe hit to picture. If the beat comes back vague rather than boom-bap, the fix is
  a Suno instrumental (90 BPM boom-bap, no vocals) muxed in with
  `add_audio ... replace=true` — same route used for `guidebookside_music.mp4`.
- 16:9 for feed and YouTube. A 9:16 crop throws away the fisheye edges, which is the
  entire look, so a vertical cut needs its own generation.
