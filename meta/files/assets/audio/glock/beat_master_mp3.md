---
SECTION_ID: files.assets.audio.glock.beat_master_mp3
TYPE: file/sound
---

# Ghost Protocol — master groove (boom-bap, instrumental)

FILE: assets/audio/glock/beat_master.mp3
UTILITY: StabilityAudio
DESCRIPTION: >
  Main rhythmic bed for the 30.7s Glock-18C "Ghost Protocol" teardown viewer.
  Classic 90s boom-bap: hard dusty kick and snare, upright bass walking under it,
  one dark chopped sample loop. Strictly instrumental.
DURATION: 40
FORMAT: mp3
STEPS: 24
BATCH_SIZE: 3
SEED: -1
PROMPT: |
  Classic 90s boom-bap instrumental hip-hop beat, 90 BPM, dark minor key.
  Hard dusty kick drum and a cracking snare on 2 and 4, sampled from vinyl,
  slightly off-grid and swung. Simple closed hi-hat pattern with an open hat on
  the offbeat. Warm upright acoustic bass line walking underneath. One short
  chopped and filtered soul sample loop: muted Rhodes chords and a lonely muted
  trumpet phrase, pitched down, heavily low-pass filtered. Continuous vinyl
  crackle and tape hiss. Dusty, warm, mid-heavy, sampled from an old record.
  Boom Bap, DJ Premier and Pete Rock style production. Purely instrumental.
NEGATIVE_PROMPT: vocals, singing, rapping, spoken word, choir, lyrics, human voice, scratching, 808 trap hats, modern EDM synths, harsh treble, distortion, clipping, applause, crowd noise

COMMENTS: ## Audio Notes
- Boom-bap after a rejected Timbaland-style pass: the model renders syncopated
  hand percussion as mush, while a straight kick/snare grid at 90 BPM comes out
  clean. Character has to come from the sample and the dust, not from the groove.
- 90 BPM, not 94: 30.72s at 90 BPM is 11.5 bars, so the trim lands on a half-bar
  and can be faded there without an audible chop mid-phrase.
- Generated at 40s and trimmed to 30.72s — the model is not loop-aware and the
  last couple of seconds of any generation tend to decay.
- BATCH_SIZE 3 for a choice of takes without re-queueing the node.
