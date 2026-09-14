---
SECTION_ID: plans.music-jazz-rnb-lounge-track
TYPE: note
---

# Jazz R&B Lounge Instrumental — Sophisticated Fine-Dining Track

## Concept
Sophisticated jazz R&B instrumental for an upscale fine-dining restaurant lounge.
Smooth, elegant, relaxed. Instrumental only. Target: music-section guide demo /
ambience asset for the Quadcode Guide site.

## Steps
- [x] 1. Write track meta section (Suno, custom mode, instrumental) [skill: music_create_instrumental]
- [*] 2. Delegate actual Suno generation to Sonic [skill: none — delegated media task]
- [ ] 3. Verify generated mp3 exists + report [skill: none]

## Key facts
- Suno skill: `music_create_instrumental` (alias). Custom mode (CUSTOM_MODE: True,
  MAKE_INSTRUMENTAL: True) with TITLE + STYLE + PROMPT. Duration 180s standard.
- Non-custom mode PROMPT must be < 500 chars; custom mode STYLE limit V3_5/V4 = 200 chars.
- Existing family: Velvet Hour (music-rnb-latenight), Velvet Hour II (music-velvet-hour-2),
  jazz-restaurant cover — same visual/audio family, 85 BPM, Rhodes/brushed drums/upright bass.

## Files
- meta/files/ui_views/assets/music-jazz-rnb-lounge_mp3.md (track meta section)
- ui_views/assets/music-jazz-rnb-lounge.mp3 (generated track)
