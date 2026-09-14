---
SECTION_ID: files.assets.video.skate-plaza-night-chase_mp4
TYPE: file/video
---

# Night Skate Plaza — Third-Person Chase (10s)

FILE: assets/video/skate-plaza-night-chase.mp4
UTILITY: seedance
DURATION: 10
ASPECT_RATIO: 16:9
RESOLUTION: 1080p
SPEED_MODE: standard

DESCRIPTION: >
  Ten-second single continuous shot of third-person open-world game footage. Night, wet
  industrial skate plaza. One male skater in a red tracksuit rides his board toward a low
  concrete ledge while a close chase camera trails him from behind and slightly below
  shoulder height. City lights smear and reflect across the wet ground. One shot, no cuts.

PROMPT: |
  10-second photorealistic third-person open-world video game footage, one continuous
  unbroken shot, no cuts, no hard edits, 16:9. The render quality of a AAA open-world
  title: real-time game-engine look, physically based materials, believable in-game
  camera behavior — never a film set, never drone footage, never a live-action camera.

  ENVIRONMENT LOCK (identical in every frame):
  A wet industrial skate plaza at night. Bare stained concrete ground with large dark
  puddles and a continuous sheen of standing water, broken reflections of distant city
  lights sliding across the wet surface. Around the plaza: raw industrial structures —
  corrugated metal warehouse walls, exposed steel beams and pipes, chain-link fencing,
  a few dim sodium floodlights on tall poles, some with flickering tubes. One low concrete
  ledge runs across the middle ground, about knee height, its top edge worn smooth. Behind
  everything, a dense city skyline at night: clusters of lit tower windows, scattered neon
  glow, low haze. Cold blue-grey night ambience with warm sodium pockets. Light rain or
  just-fallen rain — the air reads damp, faint drizzle visible in the light cones.

  SUBJECT (identical in every frame):
  One adult male skater, early twenties, short dark hair. Red tracksuit, locked for the
  whole shot: zip-up jacket and matching pants in solid deep red, white side stripes,
  white sneakers. He rides a standard street skateboard — dark deck, plain grip tape, no
  graphics, no logos, no brand marks. Natural skin with real texture, no plastic
  smoothing, no morphing face, exactly one person in the whole shot.

  CAMERA — CLOSE CHASE, ONE CONTINUOUS TAKE:
  The camera stays locked in a close third-person chase position behind and slightly below
  his shoulder height for the entire 10 seconds — the classic over-the-shoulder game
  camera. It tracks him at a fixed distance, gliding over the wet ground with a subtle
  real-time-game feel: tiny suspension bob, slight camera lag and lean into his movements,
  a faint handheld-like drift that still reads as an in-game chase cam, not a stabilised
  rig. The camera never cuts, never pulls wide, never switches to another angle, never
  goes above his head. His shoulders and the back of his head stay visible in the lower
  foreground of the frame; the wet plaza and the city skyline fill the rest.

  ACTION, ONE CONTINUOUS RUN (timed within the single shot):
  0.0-3.0s — He pumps two quick pushes on the board, accelerating across the wet plaza
  toward the ledge, board rolling straight, wheels throwing a fine spray off the wet
  concrete. City light reflections streak past under the board.
  3.0-6.5s — He drops into a low crouch and coasts, gaining speed, the ledge growing
  larger ahead. The camera closes the gap slightly, staying low behind his shoulder.
  6.5-9.0s — He ollies onto the ledge — board pops, wheels clear the edge, he lands the
  trucks on the concrete ledge and grinds along it for a moment, sparks not visible,
  just a smooth slide with the wet surface. Camera stays with him, slightly banked into
  the turn of the grind.
  9.0-10.0s — He rolls off the far end of the ledge back onto the wet plaza floor,
  weight shifting for the landing, and the shot holds on him riding away as the clip
  ends. No cut, no fade — the single take simply ends mid-motion.

  MOTION QUALITY:
  Believable skateboard physics — weight transfer, truck lean, real push mechanics,
  natural balance. The ollie must read as a real jump: crouch, pop, level out, land with
  a slight shock absorb. No floating, no moon gravity, no teleporting board, no clipping
  through the ledge, no extra limbs, no skateboard detaching from his feet.

  LOOK:
  Real-time game-engine rendering — high-quality PBR surfaces, crisp speculars on the wet
  concrete, wet reflections that mirror the skyline colours, subtle ambient occlusion in
  the shadows, faint volumetrics around the floodlights and drizzle, mild motion blur on
  the board and the passing background, a very subtle film grain. Rich contrast, crushed
  blacks, deep blue-grey night grade with warm sodium pockets, the red tracksuit as the
  single saturated accent.

  CONSTRAINTS:
  No HUD, no health bar, no crosshair, no minimap, no quest markers, no player name,
  no text, no subtitles, no timecodes, no watermarks, no logos, no brand marks, no
  legible signage on the buildings. No other people, no cars, no animals. No camera cuts,
  no whip pans, no angle switches — one continuous shot only.

  AUDIO:
  In-game ambience: light rain pattering on concrete, the rolling rumble of skateboard
  wheels on wet ground, the crisp pop and slide of the ollie and grind, distant city
  traffic hum and faint sirens far away, a low night-time drone. Under it, a sparse
  ambient game-score bed — soft sub bass, a few muted synth pads, minimal percussion,
  restrained and atmospheric. No dialogue, no vocals, no lyrics, no voiceover.

USAGE: Open-world game-footage style clip — mood/atmosphere piece demonstrating wet-night
industrial environments and third-person chase camera work.

COMMENTS: ## Video Notes
- One continuous shot is a hard requirement, not a default: multi-cut prompts in this
  library tend to compress beats, and the whole point of this asset is a single unbroken
  chase take. The 4 timed sections inside the prompt are phases of the one shot (accel,
  coast, grind, roll-off), not cuts.
- Third-person game camera is specified mechanically (behind and slightly below shoulder,
  fixed distance, lag-and-lean, never above head height) because "chase camera" alone
  reliably drifts into a drone or a rail move. The observable cues — shoulders in lower
  foreground, no angle switches — are what Seedance can actually hold.
- The red tracksuit is deliberately the only saturated colour in the grade (deep blue-grey
  night, warm sodium pockets). Same trick as the satin rooftop films: one locked colour
  accent survives generation far better than a busy palette.
- Wardrobe and environment are locked twice — once as "identical in every frame" blocks,
  once in the per-phase action text — because single continuous shots in this library
  silently morph wardrobe and swap the board for other props when the lock is stated only
  once. Same lesson as the two-person continuity locks in satin-rooftop-jazz-night.
- The ollie-and-grind is kept minimal (one pop, one grind, no flip tricks) — trick
  complexity is where motion models break physics; a single believable ollie is a
  higher-probability render than a kickflip.
- Explicit ban on HUD/UI elements: game footage prompts without the ban reliably generate
  invented health bars and minimap junk. Text is banned outright per project convention
  (melting pseudo-letters on earlier generations).
- Seedance generates its own audio. If the bed comes back thin or vocal-ish, replace with
  a Suno instrumental (ambient game score, ~80 BPM, MAKE_INSTRUMENTAL) and mux via
  `add_audio ... replace=true` — the route used for `guidebookside_music.mp4`.
- 16:9 for feed and YouTube. A 9:16 cut needs its own generation from a portrait anchor;
  cropping this frame loses the skyline reflections the shot is about.
