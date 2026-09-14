---
SECTION_ID: files.ui_views.assets.jerry01-testimonials.assets.bed-funk_mp3
TYPE: file/sound
---

# Testimonial Scroller — Funk Bed (104 BPM)

FILE: ui_views/assets/jerry01-testimonials/assets/bed-funk.mp3

UTILITY: suno
CUSTOM_MODE: True
MAKE_INSTRUMENTAL: True
TITLE: Slack Rope
STYLE: light funk, nu-disco groove, clean rhythm guitar, warm analog
DURATION: 120
FORMAT: mp3
PROMPT: |
  Purely instrumental. No vocals, no vocal chops, no shouts, no spoken word, no lyrics.
  Clean muted funk rhythm guitar on sixteenths, syncopated fingered electric bass,
  tight dry drum kit with crisp closed hats and light ghost notes, soft clavinet stabs,
  a touch of Rhodes, warm analog room. No horn section fanfares, no solos.
  Exactly 104 BPM, 4/4, light swing, pocket groove, rock-steady tempo throughout.
  No drops, no builds, no risers, no big fills, no dynamic swings.
  Repeating 8-bar loop feel with clear 4-bar edit points and a loop-safe tail.
  Even level from first bar to last. Groovy but low-key — a bed, not a lead track.

DESCRIPTION: Light funk instrumental loop bed for the testimonial rope scroller UI, matched to the widget's 104 BPM funk groove.
USAGE: Optional background music for the "Funk" track button in the jerry01 testimonial scroller widget.

COMMENTS: ## Audio Notes
- Tempo locked to the widget's built-in funk groove (104 BPM, swing 0.08) so the syncopated kick pattern lines up with the animation.
- Funk is the busiest of the three genres, so no horn stabs or solos — rhythm section only, otherwise it reads as an ad, not a bed.
- Loop-safe tail: playback repeats while the user scrolls, seam must be inaudible.
- Level matched to bed-lofi and bed-house so switching tracks mid-session doesn't jump in loudness.

## Post-process applied after generation (Suno ignores DURATION)
- Raw Suno output was 171.89s. Chain: trim 8s +120s -> normalize EBU R128 target -18 LUFS (TP -1.5) -> fade_in 1.5s / fade_out 3.0s.
- Verified final: 120.01s, RMS -19.7 dBFS, peak -7.0 dBFS, 0 silent regions.
