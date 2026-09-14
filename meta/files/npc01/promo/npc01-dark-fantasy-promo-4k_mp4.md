---
SECTION_ID: files.npc01.promo.npc01-dark-fantasy-promo-4k_mp4
TYPE: file/video
---

# NPC/01 — Dark Fantasy Promo (Topaz 4K Upscale)

FILE: npc01/promo/npc01-dark-fantasy-promo-4k.mp4
UTILITY: topaz
VIDEO-INPUT: npc01/promo/npc01-dark-fantasy-promo.mp4
MODEL: Gaia CG
UPSCALE_FACTOR: 2
NOISE: 0.15
COMPRESSION: 0.15
H264_OUTPUT: true
PROMPT: Upscale-only pass, no generative changes. Preserve exact framing, the top-center flush 10%-width watermark, all 7 baked-in pipeline stills, and the 7s real 360 GLB orbit beat unchanged — only increase resolution and clean encoding artifacts.

DESCRIPTION: 2x AI upscale of the finished NPC/01 dark-fantasy promo (1920x1080 → 3840x2160). Source is mixed GPT-Image concept sheets and a real 360 3D GLB orbit render, cut together with motion graphics and text overlays — Gaia CG chosen for clean synthetic-imagery/CG edges.
USAGE: Higher-resolution delivery master of the NPC/01 Twitter/X promo. Must preserve: top-center flush 10%-width watermark, natural-pace English voiceover (no atempo), the 7s real 360 orbit beat, and all 7 pipeline stills already baked into the source cut.

COMMENTS: |
  - Source already has watermark, VO, and drone SFX muxed in — Topaz only re-renders video pixels at higher resolution, it does not touch audio/timing.
  - If Topaz output drops the AAC audio track, re-mux the original audio from npc01-dark-fantasy-promo.mp4 back onto the upscaled video (stream copy, no re-encode of audio).
  - Keep NOISE/COMPRESSION low (0.1-0.2) — source is already clean CRF16 H.264, don't over-denoise painterly texture.
