---
SECTION_ID: plans.chase-gym-diary-vlog
TYPE: note
---

# CHASE Gym Diary Vlog — Production Plan

STATUS: generated — 2 spec deviations flagged, awaiting user decision on regen

1. [done] Confirm Seedance 2 parameters (max 15s, native audio, aspect ratio options).
2. [done] Lock subject identity, wardrobe, gym setting, handheld DV vlog treatment.
3. [done] Map 7 requested lines onto a 15s beat timeline (avg ~2.1s/beat — tight, flagged as risk).
4. [done] Generate 15-second Seedance 2 video, vertical 9:16 (1080x1920, 24fps, AAC stereo audio), duration 15.09s.
5. [done] QA via extracted frames every 0.5s across all 7 beats + last frame.
6. [done] Report:

RESULT — MATCHES:
- Duration 15.09s, 9:16 1080x1920, stereo AAC audio present.
- All 7 beats present in correct order, same woman/gym across the whole clip, no identity swap mid-video.
- Ends on final wave/bag-over-shoulder beat, no jump cuts breaking continuity.

RESULT — MISSES (concrete, verified on frames):
- Hair rendered ginger/red, not "wavy chestnut-brown" as specified.
- Top rendered as a cropped grey sports-bra-style top with exposed midriff, not the specified
  "fitted long-sleeve workout top" (long sleeves present, but torso is cropped, not full coverage).
- Strong barrel/fisheye-style lens distortion on walls and ceiling in several beats (visible in
  beats 2, 3, 5), despite explicit "no fisheye" instruction in the prompt.

Not independently verified: exact dialogue audio transcript (no transcription tool available —
only visual mouth-movement/timing checked against beat cut points, which line up).

Acceptance criteria:
- One woman (CHASE): wavy chestnut ponytail, brown eyes, athletic build, fitted long-sleeve top,
  high-waisted leggings, white socks, sneakers, towel on shoulders — unchanged throughout.
- Quiet boutique gym, mirrored wall, mats, dumbbell racks, warm overhead light.
- All 7 lines audible and roughly lip-synced across their beats, in the given order.
- Handheld DV vlog camera behavior: autofocus hunting, drift, occasional crop, camera never visible.
- Natural ambient gym sound; no music score fighting the dialogue.

Known risk: 7 lines / 15s ≈ 2.1s per beat, denser than prior successful projects (2.2–3.5s/beat
in seoul-minidv, satin-rooftop, tokyo-y2k). Expect possible line/lip-sync drops on regen if this
proves too dense — will report actual outcome, not assume success.
