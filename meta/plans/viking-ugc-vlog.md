---
SECTION_ID: plans.viking-ugc-vlog
TYPE: plan
STATUS: in_progress
PRIORITY: high
---

# 30s Viking UGC Vlog (793 AD tavern review)

GOAL: Cinematic 30s vertical (9:16) POV vlog — modern female creator reviews a viking tavern in 793 AD. Zero neural-slop: reference-card pipeline, chiaroscuro light, documentary texture.

## Structure (4 clips)
1. 0-7s  HOOK: selfie POV, viking chopping wood + yelling behind her shoulder; she whispers the intro line (LIPSYNC here only)
2. 7-14s WALK: village pass-through, mud/smoke/goats, villagers stare
3. 14-23s TAVERN: enters longhouse, dead silence, tries mead from horn "4/10 smells like socks" (voiceover)
4. 23-30s TOAST: viking clinks horns with her, whole tavern toasts, "9/10 coming back", hard cut (voiceover)

## Audio decision
- Voiceover for clips 2-4 (single consistent voice), lipsync attempt only in clip 1 hook. Fallback: full voiceover.
- Foley/ambience pass after concat (crowd murmur, fire crackle, wind).

## Pipeline steps
- [ ] 1. Character ref image (gpt_image, 9:16 framing base)
- [ ] 2. Character card via nanobanana (portrait + angle + full height)
- [ ] 3. Village location card (2K)
- [ ] 4. Tavern interior card (2K, ref = village card)
- [ ] 5. Shot 1 (Seedance, 7s, char card + village card)
- [ ] 6. Shot 2 (Seedance, 7s, + last frame of shot 1)
- [ ] 7. Shot 3 (Seedance, 9s, char card + tavern card)
- [ ] 8. Shot 4 (Seedance, 8s, + last frame of shot 3)
- [ ] 9. Concat + voiceover + foley + grade check

## Style anchor (repeat in every prompt)
Handheld vertical 9:16 selfie-POV smartphone front camera, documentary realism, visible skin pores, flyaway hairs, Norwegian coastal viking village 793 AD, overcast cold daylight, volumetric woodsmoke, mud puddles, wet timber, rough undyed wool, NO horned helmets, muted desaturated palette, film grain, single continuous take.

## Negative (repeat in every prompt)
no plastic skin, no horned helmets, no uniform studio lighting, no clean fantasy armor, no anime, no oversaturation, no extra limbs, no morphing face, no modern buildings, no text overlays, no watermark
