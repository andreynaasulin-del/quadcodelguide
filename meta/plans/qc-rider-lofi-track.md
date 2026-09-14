---
SECTION_ID: plans.qc-rider-lofi-track
TYPE: note
---

# QC-Rider — Lo-Fi Instrumental Track

STATUS: generating preview

SOURCE VIDEO: .temp/upload/QC-Rider_1.mp4 — 51.33s, 2880x1612, 60fps, no audio.
Content confirmed via extracted frames: Powderline snowboard gameplay screencast, HUD shows
speed 96-111 km/h, distance counter, boost/flow/build-speed/stability meters, sunny alpine
mountain backdrop with pine trees. Fast, smooth downhill motion — a "flow state" mood, not a
frantic action game.

PLAN:
1. [done] Inspect source video (no audio, duration, content via frames).
2. [done] Confirm template: Suno (music_create_instrumental, custom mode, instrumental).
3. [done] Generated lo-fi instrumental preview MP3 → .temp/generated/qc-rider-lofi-preview.mp3
   (Suno rendered 129.48s, not the requested 90s — known Suno custom-mode behavior, DURATION
   is a soft hint not a hard cap. Still longer than the 51.33s video, so fine for trimming.)
4. [done] Delivered MP3 preview to PO — approved ("кайф!").
5. [done] Post-process + mux:
   - No clean silence gap or bar boundary near 51.33s in the raw 129.48s render (only silence
     found was at 1:26 — too late to use). Cut hard at 0-51.33s and relied on fade to mask it.
   - Chain: trim 0+51.33s -> normalize EBU R128 target -14 LUFS (TP -1.5, louder than typical
     background-bed targets in this library since there's no VO/game audio to protect — this
     track IS the soundtrack) -> fade_in 1.5s / fade_out 2.5s.
   - Final MP3: .temp/generated/qc-rider-lofi-final.mp3, 51.34s, 128kbps, verified via get_file_info.
   - Mux: add_audio replace=true onto QC-Rider_1.mp4 (video had no audio track). Video stream
     copied untouched (2880x1612, 60fps, 3081 frames, 33.75 Mbps). Audio auto-cut 51.34→51.33s
     to match video exactly. Output: .temp/upload/QC-Rider_1_music.mp4 (207.46 MB, streams both
     51.333s).

STATUS: done — delivered for review.

STYLE DECISION: lo-fi chillwave rather than dusty boom-bap study-beats — brief asked for
"стильный" (stylish), and the source is a snow speed-game, not a desk/reading scene. 92 BPM,
warm analog synth/Rhodes, soft filtered drums with a light forward pulse (matches motion),
minimal vinyl texture (just enough for lo-fi character, not overwhelming), no vocals per
explicit instruction (repeated twice by user — hard constraint).
