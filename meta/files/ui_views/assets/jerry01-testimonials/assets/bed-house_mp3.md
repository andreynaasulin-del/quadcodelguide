---
SECTION_ID: files.ui_views.assets.jerry01-testimonials.assets.bed-house_mp3
TYPE: file/sound
---

# Testimonial Scroller — House Bed (124 BPM)

FILE: ui_views/assets/jerry01-testimonials/assets/bed-house.mp3

UTILITY: suno
CUSTOM_MODE: True
MAKE_INSTRUMENTAL: True
TITLE: Deck Loop
STYLE: deep house, minimal house, warm analog, understated club
DURATION: 120
FORMAT: mp3
PROMPT: |
  Purely instrumental. No vocals, no vocal chops, no diva samples, no spoken word, no lyrics.
  Soft four-on-the-floor analog kick, tight closed hats on the off-beat, light shaker,
  round warm sub bass, short filtered chord stabs, subtle plucked synth motif, gentle room reverb.
  Exactly 124 BPM, 4/4, straight groove, no swing, rock-steady tempo throughout.
  No big drop, no EDM build, no snare rolls, no risers, no white-noise sweeps, no siren FX.
  Continuous 8-bar loop feel with clear 4-bar edit points and a loop-safe tail.
  Even level from first bar to last. Restrained, groovy but polite background energy.

DESCRIPTION: Deep-house instrumental loop bed for the testimonial rope scroller UI, matched to the widget's 124 BPM house groove.
USAGE: Optional background music for the "House" track button in the jerry01 testimonial scroller widget.

COMMENTS: ## Audio Notes
- Tempo locked to the widget's built-in house groove (124 BPM, no swing) so animation beats align with the kick.
- Faster genre than the lo-fi bed, so kept deliberately minimal — the danger here is a track that pulls focus off the quotes.
- Loop-safe tail required: playback repeats for as long as the user keeps scrolling.
- Instrumental only, no risers or drops that would spike level against the other two beds in the set.

## Post-process applied after generation (Suno ignores DURATION)
- Raw Suno output was 252.64s. Chain: trim 12s +120s -> normalize EBU R128 target -18 LUFS (TP -1.5) -> fade_in 1.5s / fade_out 3.0s.
- Verified final: 120.01s, RMS -20.0 dBFS, peak -7.7 dBFS, 0 silent regions.
- Same -18 LUFS target as bed-lofi and bed-funk — this is what stops a loudness jump when the user switches track buttons.
