---
SECTION_ID: files.ui_views.assets.jerry01-testimonials.assets.bed-lofi_mp3
TYPE: file/sound
---

# Testimonial Scroller — Lo-Fi Bed (82 BPM)

FILE: ui_views/assets/jerry01-testimonials/assets/bed-lofi.mp3

UTILITY: suno
CUSTOM_MODE: True
MAKE_INSTRUMENTAL: True
TITLE: Rope Line
STYLE: lofi hip hop, downtempo, warm analog, dusty boom bap
DURATION: 120
FORMAT: mp3
PROMPT: |
  Purely instrumental. No vocals, no vocal chops, no ad-libs, no spoken word, no lyrics.
  Warm Rhodes electric piano, muted upright bass, dusty brushed drum loop with light swing,
  soft vinyl crackle, gentle tape saturation, occasional muted guitar note.
  Exactly 82 BPM, 4/4, laid-back swung groove, rock-steady tempo throughout.
  No drops, no builds, no risers, no filter sweeps, no dynamic swings.
  Repeating 8-bar loop feel with clear 4-bar edit points and a loop-safe tail
  that returns to the same chord as bar 1. Even level from first bar to last.
  Soft, restrained, background-level energy — never demands attention.

DESCRIPTION: Lo-fi instrumental loop bed for the testimonial rope scroller UI, matched to the widget's 82 BPM lo-fi groove.
USAGE: Optional background music for the "Lo-fi" track button in the jerry01 testimonial scroller widget.

COMMENTS: ## Audio Notes
- Tempo locked to the widget's built-in lofi groove (82 BPM, swing 0.16) so the character's head-nod and the rope physics land on the beat.
- Instrumental only — the widget never plays voiceover, but the track must not compete with UI click sounds.
- Loop-safe tail: track is looped on repeat while the user drags through cards, so the seam must be inaudible.
- Flat dynamics on purpose: default widget volume is 0.55, no ducking logic exists.

## Post-process applied after generation (Suno ignores DURATION)
- Raw Suno output was 134.88s and contained two ~0.6s silent section seams (at 64.9s and 111.2s of the raw file) — audible as a drop-out on a quiet bed.
- Final chain: trim 6s +120s -> normalize EBU R128 target -18 LUFS (TP -1.5) -> re-trim to the gap-free 0-58s window -> fade_in 1.5s / fade_out 2.5s.
- Verified final: 58.01s, RMS -20.7 dBFS, peak -6.6 dBFS, 0 silent regions.
- Re-running generation requires repeating this chain; check analyze_levels for new seams, their position will move.
