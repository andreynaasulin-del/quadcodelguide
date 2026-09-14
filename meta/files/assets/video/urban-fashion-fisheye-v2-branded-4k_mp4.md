---
SECTION_ID: files.assets.video.urban-fashion-fisheye-v2-branded-4k_mp4
TYPE: file/video
---

# Urban fashion fisheye v2 — branded, quieter audio, 4K upscale

FILE: assets/video/urban-fashion-fisheye-v2-branded-4k.mp4
UTILITY: topaz
VIDEO-INPUT: assets/video/urban-fashion-fisheye-v2-branded-quiet.mp4
MODEL: Proteus
UPSCALE_FACTOR: 2
NOISE: 0
COMPRESSION: 0.2
H264_OUTPUT: true

PROMPT: Upscale 2x to 3840x2160 preserving photoreal skin texture, fisheye edge geometry,
  motion blur on traffic and the crisp centered watermark badge at the bottom edge. No added
  sharpening halos, no smearing of graffiti detail.

DESCRIPTION: 15s urban fashion fisheye clip, 1920x1080 24fps, with the Quadcode watermark
  centered at the bottom edge and a 13s->15s audio fade-out. Upscale 2x to 3840x2160 while
  keeping the photoreal skin texture, fisheye edge geometry and the crisp watermark badge intact.

USAGE: Delivery master for social and site hero playback at 4K.

COMMENTS: ## Video Notes
- Source is already clean 1080p at 5.4 Mbps, so NOISE stays at 0 and COMPRESSION is only 0.2 —
  higher values smear the graffiti texture and the fine grain on skin.
- Proteus over Gaia CG: footage is photoreal live action, only the small badge is synthetic.
- No TARGET_FPS: the clip is cut on 24 fps beats, interpolation would soften the jump cuts.
- H264 output for player/editor compatibility.
- Audio was already lowered by 20% (volume=0.8) in the input file; if Topaz strips audio,
  remux from urban-fashion-fisheye-v2-branded-quiet.mp4.
