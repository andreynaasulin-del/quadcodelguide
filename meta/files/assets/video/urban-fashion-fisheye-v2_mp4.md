---
SECTION_ID: files.assets.video.urban-fashion-fisheye-v2_mp4
TYPE: file/video
---

# Urban Fashion Film — Ultra-Wide Fisheye (15s, v2, text-free)

FILE: assets/video/urban-fashion-fisheye-v2.mp4
UTILITY: seedance
DURATION: 15
ASPECT_RATIO: 16:9
RESOLUTION: 1080p
SPEED_MODE: standard
IMAGE-INPUT: .temp/anchor2/frame_0002.jpg
AUDIO-INPUT: .temp/refhouse-drop14.mp3
DESCRIPTION: >
  v2 of the fisheye street fashion film. Same wardrobe, same worm-eye energy, same
  high-contrast grade — but every glyph is gone and the edit is twice as dense. v1 held
  each angle for ~2.5s, which read as slow; v2 is a 12-shot cut with hard macro inserts
  (sole hitting concrete, cargo cuff dragging, headphone cup, sunglasses reflection)
  between the wides. Music is driven by a house reference track, so cuts land on a
  four-on-the-floor kick instead of a vague electronic pulse.

PROMPT: |
  15-second urban fashion film, ultra-wide fisheye lens (barrel distortion on every edge,
  bowed verticals, exaggerated foreground), shot on New York street corners.

  Subject: one trendy young female model striding with attitude. Black cropped top,
  low-rise baggy white cargo pants dragging over high-top sneakers, mirrored silver
  sunglasses, large over-ear headphones resting around her neck. Photorealistic skin
  texture with visible pores and specular sheen, natural hair and fabric motion, no plastic
  smoothing. Wardrobe identical in every shot, all garments completely plain and unbranded.

  Editing: 12 shots in 15 seconds, none longer than 1.5s, alternating wide movement with
  hard macro inserts so no angle repeats. Rough order:
  1. open on @image1 — worm-eye at pavement level, cargo hems and sneaker sole slamming
     down towards the lens, dust puffing; match its lens, framing and grade exactly
  2. macro on the dragging cargo cuff brushing wet concrete, fabric fibres visible
  3. fast tracking alongside her at hip height, storefronts warping past the fisheye edge
  4. top-down overhead looking straight at her shoulders and the pavement rushing beneath
  5. macro on the headphone cup on her neck, tiny highlight crawling across the plastic
  6. behind-follow at ankle height, cargo hems swinging into frame from both sides
  7. extreme close-up of the mirrored sunglasses filling the frame, street reflected in the
     lens, her cheekbone and pores sharp
  8. whip pan into evening — blurred car light streaks tear across the frame
  9. dutch-tilted low angle, neon glow rimming her shoulder, wet asphalt below
  10. macro on her hand swinging past camera, rings and knuckles, motion blur trail
  11. reflection shot: her whole silhouette warped in a puddle, ripples breaking it
  12. fisheye hero wide, arms out, triple echo of her body on the final beat
  Traffic and pedestrians smear into motion blur behind her while she stays sharp.

  Lighting blocks: first seven seconds bright, almost overexposed midday sun along red
  brick storefronts and paint-covered roller shutters — hard shadows, lifted blacks, warm
  bounce off the sidewalk, daylight that clearly reads as noon; last eight seconds moody
  evening, sodium streetlights, restrained neon glow reflecting in wet asphalt, cool
  shadows against warm practicals. The switch happens on one whip pan around the midpoint.

  Transitions and effects: anamorphic lens light leaks streaking across the frame on cuts,
  trailing light streaks following her silhouette, a triple visual echo of the model on the
  strongest beats, and a purely graphic music-player HUD — thin progress bar, animated
  waveform of vertical ticks, concentric ring, small round scrubber dot, corner brackets —
  glitching in over the image.

  ABSOLUTELY NO TEXT ANYWHERE IN FRAME. No letters, no words, no numbers, no digits, no
  timecodes, no track titles, no captions, no subtitles, no titles, no watermarks, no logos,
  no brand marks, no clothing prints, no license plates, no street signs, no shop signage,
  no menu boards, no readable graffiti tags or lettering, no neon words, no icons that
  contain glyphs. The HUD carries zero labels — geometry only. Storefront signage and
  shutter artwork stay heavily out of focus, motion-blurred or reduced to abstract colour
  strokes so nothing is legible.

  Audio: use @audio1 as the driving soundtrack — peak-time house, four-on-the-floor kick,
  filtered stabs, rolling bassline, exactly the groove of the reference. Every jump cut,
  whip pan and triple-echo hit lands on the kick; the macro inserts fall on the off-beat
  hats. Thin layer of urban ambience underneath (footsteps on concrete, traffic wash). No
  dialogue, no voiceover, no lyrics.

  Grading: high-contrast cinematic, crushed blacks, cool teal shadows against warm skin,
  slight halation on highlights, fine grain.

COMMENTS: ## Video Notes
- v2 exists for one reason: in v1 (`assets/video/urban-fashion-fisheye.mp4`) the HUD track
  labels and the shop signage rendered as melting pseudo-letters that shifted every frame.
  Everything else about v1 was approved, so the brief is unchanged apart from the text ban.
- Banning text outright is safer than asking for "clean typography": the model has no stable
  glyph model across 361 frames, so any lettering will wobble. Geometry (bars, rings, dots)
  survives the same motion without artefacts.
- Graffiti had to be downgraded to "paint-covered shutters" and "abstract colour strokes" —
  the word graffiti alone pulls tag lettering into frame.
- Reference for pacing and lens feel: `.temp/upload/ssstwitter.com_1785784418602.mp4`
  (20s, 640x360, 60fps). Deliberately not passed as VIDEO-INPUT: Seedance's video-edit mode
  locks output length to the source (20s) and restyles its frames instead of shooting new
  coverage.
- Verify by extracting frames across the whole clip, not just a few: text tends to appear on
  a single cut and vanish.
- Music: `.temp/refhouse-drop14.mp3` is a 14.4s cut starting at 62s of
  `.temp/upload/refhouse.mp3` (3:52 total). 62s is where the drop sits — the intro would have
  given the model a sparse build to imitate. The cut is 14.4s and not 15.0s because the
  backend rejects "max 15s" at exactly 15.02s: ffmpeg lands a hair over on an mp3 frame
  boundary.
- Passing AUDIO-INPUT alone fails: the backend requires at least one visual reference with
  audio. Anchor is `.temp/anchor2/frame_0002.jpg`, frame 60 of v1 — the daylight worm-eye
  legs shot. Chosen over the hero frames because every torso frame in v1 carries garbled
  lettering on the waistband, and feeding that in would reproduce the exact artefact v2 is
  meant to kill.
- The 12-shot list exists because v1 averaged 2.5s per angle and read as slow. The fix is
  macro inserts between wides, not faster camera moves — more speed on a fisheye just
  smears the frame.
