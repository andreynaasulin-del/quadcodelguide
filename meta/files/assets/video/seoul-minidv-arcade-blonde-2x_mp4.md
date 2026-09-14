---
SECTION_ID: files.assets.video.seoul-minidv-arcade-blonde-2x_mp4
TYPE: file/video
---

# Seoul Arcade — Blonde Variant, 2x Upscale (2224x1668)

FILE: assets/video/seoul-minidv-arcade-blonde-2x.mp4
UTILITY: topaz
VIDEO-INPUT: assets/video/seoul-minidv-arcade-blonde.mp4
MODEL: Proteus
UPSCALE_FACTOR: 2
NOISE: 0
COMPRESSION: 0.15
H264_OUTPUT: true

PROMPT: Upscale 2x to 2224x1668 preserving the authentic early-2000s MiniDV camcorder
  look — heavy handheld shake, faded washed-out color, soft consumer-lens rendering,
  chroma noise, DV compression artifacts, motion blur — and the crisp centered
  quadcode.ai watermark badge flush to the bottom edge. No added sharpening halos, no
  smoothing-away of the intentional camcorder grain/noise, no denoising that would make
  the footage look modern.

DESCRIPTION: 2x Topaz upscale of the blonde-hair Seoul arcade MiniDV clip
  (1112x834 → 2224x1668), keeping the intentional camcorder defects and the
  bottom-center quadcode.ai watermark intact.

USAGE: Higher-resolution delivery master of the blonde-variant arcade clip for
  site/editorial playback at larger sizes.

COMMENTS: ## Video Notes
- UTILITY: topaz (not seedance) — Seedance is a generative text/image/video model,
  not a pixel-preserving super-resolution upscaler; a real resolution upscale that
  keeps the existing footage/watermark unchanged requires Topaz's dedicated
  upscale utility. Confirmed against `image_or_video_to_video_seedance` template
  (no resolution-only upscale mode) before picking `topaz`.
- Low NOISE/COMPRESSION settings to avoid erasing the deliberate MiniDV grain and
  DV compression look baked into the source.
- Source already carries the quadcode.ai watermark (bottom-center, ~10% size,
  flush to bottom edge) — prompt explicitly asks Topaz to preserve it as-is.
- Pattern follows urban-fashion-fisheye-v2-branded-4k_mp4.md (same UTILITY/MODEL
  choice for a branded-watermark 2x upscale).
