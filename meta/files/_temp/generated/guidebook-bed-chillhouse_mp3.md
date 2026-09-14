---
SECTION_ID: files._temp.generated.guidebook-bed-chillhouse_mp3
TYPE: file/sound
---

# Guidebook Side — Chill House Bed

FILE: .temp/generated/guidebook-bed-chillhouse.mp3

UTILITY: suno
CUSTOM_MODE: True
MAKE_INSTRUMENTAL: True
TITLE: Side Margin
STYLE: chill house, deep house, downtempo, warm analog, understated
DURATION: 120
FORMAT: mp3
PROMPT: |
  Purely instrumental. No vocals, no vocal chops, no diva samples, no ad-libs,
  no spoken word, no lyrics, no humming, no choir, no vocal pads.
  Soft muted four-on-the-floor analog kick, tight closed hats on the off-beat,
  light shaker, round warm sub bass, short filtered Rhodes chord stabs,
  a sparse plucked synth motif, gentle room reverb, light tape saturation.
  Exactly 118 BPM, 4/4, straight groove, no swing, rock-steady tempo throughout.
  No drop, no EDM build, no snare rolls, no risers, no white-noise sweeps, no FX hits.
  Continuous 8-bar loop feel with clear 4-bar edit points and a loop-safe tail.
  Even level from first bar to last, no dynamic swings.
  Restrained, stylish, polite background energy — a bed, never a lead track.

DESCRIPTION: Low-key chill-house instrumental bed for the guidebook side-scroll screen capture.
USAGE: Background music mixed low under .temp/upload/guidebookside.mp4 (63s silent screen capture).

COMMENTS: ## Audio Notes
- Instrumental only — this is the hard requirement, hence the explicit vocal exclusions in the prompt.
- 118 BPM chosen a notch under the 124 BPM testimonial bed: the source is a slow scroll, a faster kick would fight the motion.
- Keep 1-4 kHz uncluttered in case narration is added to this cut later.
- Loop-safe tail so the bed can be repeated if the video is extended.
- Post-generation: trim to 63s on a phrase boundary, normalize to -20 LUFS, 1.5s fade in / 3s fade out, then mix at low gain.

## Post-process actually applied (Suno ignores DURATION)
- Raw Suno output: 208.52s, RMS -14.0 dBFS, peak -0.6 dBFS.
- Chain: trim 16s +63s -> normalize EBU R128 target -20 LUFS (TP -1.5) -> fade_in 1.5s / fade_out 3.5s.
- Bed verified: 63.01s, RMS -22.2 dBFS, peak -9.2 dBFS, 0 silent regions.
- Source video audio was effectively silent (RMS -62.9 dBFS, only UI clicks around 0:55-0:56 at -24.3 peak),
  so the original track was pre-mixed with the bed (volume1=1.0, volume2=0.8, duration=first) rather than discarded.
  `add_audio mix=true` on the mp4 directly failed in ffmpeg — the 16 kbps source stream would not feed amix.
- Final mux: `add_audio ... replace=true` with the pre-mixed track. Video stream copied untouched
  (2880x1620, 60 fps, 26.96 Mbps); audio AAC 136 kbps. Combined RMS -24.5 dBFS — audible under a quiet screen
  capture, low enough to stay out of the way of narration if VO is added later.
- Output: `.temp/upload/guidebookside_music.mp4` (203.54 MB, 63.0s).
