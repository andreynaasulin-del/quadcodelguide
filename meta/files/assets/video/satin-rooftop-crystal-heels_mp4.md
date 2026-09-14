---
SECTION_ID: files.assets.video.satin-rooftop-crystal-heels_mp4
TYPE: file/video
---

# Satin Rooftop, Crystal Heels (13s)

FILE: assets/video/satin-rooftop-crystal-heels.mp4
UTILITY: seedance
DURATION: 13
ASPECT_RATIO: 16:9
RESOLUTION: 1080p
SPEED_MODE: standard

DESCRIPTION: >
  Thirteen-second blue-hour rooftop fashion film grown out of the GPT-Image anchor frame.
  Four unhurried beats instead of a cut-heavy edit: she turns and starts walking, a low
  tracking shot on the crystal heels against wet concrete, a rising wide with the skyline
  behind her, and a slow turn back to camera as the satin settles. One woman, one gown, one
  location, no dialogue.

PROMPT: |
  13-second photorealistic fashion film. Open rooftop of a tall building at blue hour, high
  above a dense city. Behind the subject a skyline of lit office towers recedes into haze,
  thousands of small warm window lights, a few red aircraft beacons. Wet patches on the bare
  concrete throw broken reflections. A low concrete parapet runs along the right edge. Sky is
  deep indigo with a thin band of residual orange on the horizon.

  Subject: one adult woman, dark hair pulled back off the face, small stud earrings.

  Garment, locked for every frame: floor-length satin evening gown in deep burgundy, modest
  high neckline, long sleeves, fully covered from neck to floor, hem brushing the concrete.
  Clear crystal-embellished high-heeled sandals with faceted stones across the strap and
  heel. Dark hair pulled back off the face. Formal red-carpet styling throughout, fully
  clothed, dignified and reserved posture at all times.

  This is a garment presentation film in the manner of a couture house lookbook. The subject
  of every shot is the fabric and the footwear, not the wearer.

  BEAT 1 (0.0-3.5s) — Open on a full-length wide, eye-level to slightly low, 35mm lens, the
  figure left of centre with the skyline filling the right two thirds. She completes a turn
  toward camera left
  and takes two measured steps forward. The heavy satin trails a beat behind the movement and
  the hem sweeps across the wet concrete. Skyline window lights shimmer faintly behind.
  Camera drifts left on a slow dolly, almost imperceptible.

  BEAT 2 (3.5-6.5s) — Cut to a low product-style insert on the footwear. Camera near ground
  level, tracking sideways as the crystal sandals move across the concrete. Faceted stones
  catch the city lights and throw hard pinpoint sparkles; the burgundy hem swings in and out
  of frame above them. Broken reflections of the skyline slide across the wet surface. Frame
  contains only the shoes, the hem and the ground.

  BEAT 3 (6.5-10.0s) — Cut to a wide. Camera rises slowly on a crane move from waist height
  to shoulder height while she walks away from camera along the parapet, the full skyline
  opening up behind. A light breeze lifts the train of the gown into a long trailing ripple.
  Satin highlights roll along the length of the fabric as it moves.

  BEAT 4 (10.0-13.0s) — She stops and turns her head back over one shoulder toward the lens,
  a composed editorial look. The gown swings, settles and comes to rest. Camera eases to a
  stop with her. Last frame holds on the standing figure, city glittering behind.

  Motion quality: real handheld weight with a stabilised feel, not floaty drone glide. Fabric
  physics must read as heavy silk-satin — momentum and inertia, not flapping cloth. Natural
  walking gait with believable heel-to-toe contact. Photographic rendering throughout, no
  plastic smoothing, no morphing face, no extra limbs, no changing number of people.

  Look: 35mm lens, rich contrast, crushed blacks, warm skin against cool blue ambience,
  slight halation on the brightest window lights, fine film grain, shallow depth of field
  with the towers soft behind her.

  Constraints: no text, no captions, no subtitles, no timecodes, no watermarks, no logos, no
  brand marks, no legible signage on the towers. No other people. No cars in frame.

  Audio: slow, glossy downtempo instrumental — warm sub bass, sparse muted kick around
  90 BPM, soft filtered chord pad, a few crystalline bell accents landing on the heel
  close-ups. Under it, quiet rooftop ambience: distant city hum, faint wind, and the crisp
  click of heels on wet concrete in the low tracking beat. No vocals, no lyrics, no
  voiceover, no dialogue.

USAGE: >
  Social hero cut. Published caption: "Satin caught the city lights before she even started
  walking. This dress found its rhythm on a rooftop above a skyline that never sleeps, and
  those crystal heels did all the talking — every step, every turn, a story in motion. Built
  entirely with AI: ChatGPT Images 2.0 for the reference, Seedance 2.0 for the motion. No
  studio, no reshoots, just a rooftop, a dress the color of wine, and heels that sparkle
  like they know it."

COMMENTS: ## Video Notes
- Image-to-video, not text-to-video. The caption credits "ChatGPT Images 2.0 for the
  reference", so the anchor frame `assets/image/satin-rooftop-ref.png` must actually drive
  the generation. It also solves the continuity problem for free: the gown and the heels are
  pixels, not adjectives.
- Four beats over 13s (~3.2s each) against six beats in the Tokyo fisheye film. Deliberate:
  the caption sells fabric movement and sparkle, and both need screen time to register.
  A 2s cut rhythm would shred the satin drape into strobing.
- The caption's three promises map to specific beats — "caught the city lights" is Beat 1's
  satin highlight roll, "heels did all the talking" is the Beat 2 ground-level track,
  "every step, every turn" is Beat 4's look-back. If any of those three misses, regenerate.
- The GPT-Image pass was rejected twice before it landed: `1920x1080` fails because both
  sides must be divisible by 16 (use 1088), and the first prompt tripped OpenAI's
  output-stage sexual-content filter. Cause was the wardrobe wording — "satin slip dress",
  "thin straps", "long side slit revealing one leg" plus skin-texture language about
  shoulders and collarbone. Rewritten as a covered long-sleeve evening gown with the same
  fabric and colour, it passed unchanged otherwise.
- Text banned outright. A skyline of thousands of lit windows is precisely where the model
  invents wobbling pseudo-logos, as it did on the earlier fisheye films.
- Seedance generates its own audio. If the bed comes back with vocal-ish texture or fights
  the pacing, replace it with a Suno instrumental (90 BPM downtempo, MAKE_INSTRUMENTAL) and
  mux via `add_audio ... replace=true` — the route used for `guidebookside_music.mp4`.
- 16:9 for feed and YouTube. A 9:16 cut needs its own generation from a portrait anchor;
  cropping this frame throws away the skyline that the caption is about.
