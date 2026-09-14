---
SECTION_ID: files.assets.video.tokyo-y2k-fisheye-v2_mp4
TYPE: file/video
---

# Tokyo Y2K Streetwear — 8mm Fisheye (13s) — v2, thermal beat promoted

FILE: assets/video/tokyo-y2k-fisheye-v2.mp4
UTILITY: seedance
DURATION: 13
ASPECT_RATIO: 16:9
RESOLUTION: 1080p
SPEED_MODE: standard
DESCRIPTION: >
  Same thirteen-second Tokyo night fisheye streetwear film as v1, with one fix: v1 dropped
  the thermal infrared flash entirely (verified across the whole clip at 0.25s sampling).
  In v2 the thermal pass is written as its own hard cut with a frame range and named FLIR
  hardware instead of being buried as a mid-shot embellishment.

PROMPT: |
  13-second raw handheld streetwear fashion film, shot on an 8mm vintage fisheye lens,
  ultra-wide 16mm circular perspective, heavy barrel distortion on every edge, bowed
  verticals, exaggerated foreground. Tokyo street night. Y2K hip-hop music video direction.

  Cast, identical wardrobe in every single shot:
  - SUBJECT A: young Asian man, black streetwear bucket hat, black embroidered jacket.
  - SUBJECT B: young Black man, braided hair, bright royal blue crewneck sweater with
    chunky yellow graphic lettering across the chest, green paisley scarf.
  Photorealistic skin with visible pores and specular sheen, natural hair and fabric
  motion, no plastic smoothing.

  Shot list, hard cuts on the beat:

  SHOT 1 (0.0-2.0s) — Extreme close-up inside pitch blackness, framed through a narrow
  vertical zipper slit. Through the slit: SUBJECT A crouching low in his bucket hat and
  embroidered jacket. The camera rushes backward out through the slit and snaps into a
  super-wide fisheye low angle looking up at both men on a glowing Tokyo street corner,
  tall neon skyscrapers bowing inward around them against a black sky.

  SHOT 2 (2.0-4.0s) — Hard handheld whip-pan right, down a neon-lit sidewalk. SUBJECT B
  steps casually through frame, gesturing at the lens. Fast rotational motion blur sweeps
  the screen and carries into the next shot.

  SHOT 3 (4.0-6.0s) — Cut inside a bright Japanese claw-machine arcade: pastel pink
  interior walls, banks of fluorescent overhead tubes, rows of glass cabinets. Camera
  tracks backward as SUBJECT B walks forward holding a small pink object to his ear,
  smiling and talking. A stylized liquid-chrome animated border swirls around the edges of
  the image for one second — molten mirror metal, warping and dripping, clearly visible.

  SHOT 4 (6.0-6.9s) — Cut to a retro mint-green fast-food diner booth, warm hanging lamp
  overhead. Low wide angle across the white tabletop as SUBJECT B reaches his hand
  straight toward the lens, offering food.

  SHOT 5 (6.9-7.5s) — HARD CUT TO FULL-SCREEN THERMAL INFRARED. The entire frame becomes a
  FLIR thermal imaging camera feed of the same diner booth: no natural colour at all, the
  whole image remapped to a heat palette — the reaching hand and both faces blazing white
  hot and saturated red, torsos and clothing shifting through orange and acid neon green,
  the booth walls and background in deep cobalt blue and violet. Blocky low-resolution
  thermal sensor look, glowing edges, heat bloom around the hand. This must fill the whole
  screen for the full six tenths of a second and be impossible to miss. Then hard cut back
  to normal photographic colour.

  SHOT 6 (7.5-10.0s) — SUBJECT A pops up from behind the diner table with an energetic
  reaction, drink cup in hand, as the camera sweeps low past him. Hard cut outdoors: both
  men walk the night pavement and high-five in motion under glowing shopfronts.

  SHOT 7 (10.0-13.0s) — Camera drops to extreme ground level on the asphalt of a narrow
  alley, fisheye pointing straight up. Both men loom enormous over the lens beneath tall
  vertical glowing neon signboards. SUBJECT A stoops and reaches his palm down across the
  lens, triggering a rapid spinning rotational blur that wipes the screen to black.

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
  cabinet bleeps during the arcade shot. A sharp filtered riser and a vinyl rewind hit the
  thermal cut. Every cut, whip-pan and the final lens wipe lands on the kick. No dialogue,
  no lyrics, no voiceover.

COMMENTS: ## Video Notes
- Why v2 exists: v1 (`assets/video/tokyo-y2k-fisheye.mp4`) nailed the zipper reveal, the
  arcade, the diner, the high-five and the palm-over-lens wipe, but silently dropped the
  thermal infrared flash. Verified by extracting the full clip at 4 fps (52 frames) —
  no heat-map frame anywhere. A 0.5s effect cannot hide between 0.25s samples.
- The likely cause: in v1 the thermal pass was described as an effect flashing *over* an
  existing shot. Seedance treats mid-shot overlays as optional garnish and drops them under
  time pressure. In v2 it is a numbered shot with its own in/out times, so it competes for
  screen time as a cut rather than a filter.
- Named hardware ("FLIR thermal imaging camera feed") instead of the adjective
  "psychedelic thermal effect" — concrete camera references survive generation far better
  than stylistic adjectives.
- The thermal beat was widened from 0.5s to 0.6s and the diner shot trimmed to 0.9s to pay
  for it. Total still 13s.
- Everything else is byte-identical to v1's prompt. If v2's thermal lands but a different
  beat regresses, v1 remains the fallback deliverable — do not delete it.
- Text suppression retained: earlier work in this project produced melting pseudo-letters
  on signage, so neon is specified as glowing colour bars.
