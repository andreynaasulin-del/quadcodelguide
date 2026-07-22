import { readFileSync, writeFileSync } from 'node:fs';

const path = 'ui_views/guides.json';
const data = JSON.parse(readFileSync(path, 'utf8'));

const npc01 = {
  id: 'npc01-dark-fantasy-deceiver',
  cat: 'Gamedev',
  sub: 'Character Design',
  title: 'NPC/01 — Design a Dark-Fantasy Deceiver: from Silhouette to 3D Handoff',
  desc: 'A complete Senior Gamedev pipeline for an original dark-fantasy NPC (The Court Parasite): silhouette readability test, weighted score matrix, identity render, 4-view turnaround, FACS expressions, animation poses, interactive 3D GLB model, and technical A-pose socket spec.',
  time: '35 min',
  date: '2026-07-22',
  level: 'Senior',
  models: 'GPT-Image, Trellis2 3D',
  new: true,
  trending: true,
  image: '/ui_views/assets/npc01-03-identity-render.png',
  poster: '/ui_views/assets/npc01-03-identity-render.png',
  steps: [
    {
      title: '1. Force three distinct silhouette massings',
      text: 'Start with pure black shapes at 1:1 scale before any face or costume work. Variant A (Wing Collar), B (Relic Chain) and C (Moth Cloak) each test a different C-curve and collar height. If a silhouette does not read at 120 px, it is dead — no render saves it.',
      prompt: 'GOAL: Generate 3 distinct black silhouette massings for a dark-fantasy diplomat NPC. A: high bat-wing collar, hands hidden. B: heavy relic chain weighting the torso forward. C: moth-cloak shoulders dissolving into the coat. Pure black on light grey, 1:1, no faces, no costume detail. Judge only readability at small size.',
      result_image: '/ui_views/assets/npc01-01-silhouette-test.png'
    },
    {
      title: '2. Score variants with a weighted decision matrix',
      text: 'Score every silhouette against Authority (30%), Threat (25%), Magic (20%), Readability at 120px (15%), Mobility (10%). Variant A wins at 4.25 weighted — the bat-wing collar is locked by numbers, not taste. This sheet is what you show a client when they ask "why this one".',
      prompt: 'GOAL: Senior game-concept decision sheet. Score the 3 silhouettes from step 1 against 5 weighted criteria (Authority 30, Threat 25, Magic 20, Readability 15, Mobility 10). Show per-criterion scores, weighted totals, and a verdict row declaring the winner. Swiss editorial layout, dark ink on bone paper.',
      result_image: '/ui_views/assets/npc01-02-variant-matrix.png'
    },
    {
      title: '3. Lock face, materials and palette in the identity render',
      text: 'Render the canonical 3/4 full-body anchor. Palette lock: VOID #120F17, BLOOD #4A1830, BONE #C7B79B, STEEL #8A9199. High stiffened collar, concealed hands, signet cane. Every later sheet must match this render — it is the single source of truth.',
      prompt: 'GOAL: Full-body identity render for THE COURT PARASITE using silhouette A. 3/4 view, high stiffened wing collar hiding the jaw, long sleeves concealing hands, signet cane. Palette: void black #120F17 coat, dried-blood #4A1830 lining, bone #C7B79B face, steel #8A9199 accents. Flat neutral backdrop, concept-art finish.',
      result_image: '/ui_views/assets/npc01-03-identity-render.png'
    },
    {
      title: '4. Produce the orthographic 4-view turnaround',
      text: 'FRONT / 3-4 / SIDE / BACK locked to the identity render on warm bone paper (#EDE8DF). The back view designs the collar rear plane without inventing a cape. Modelers build from this sheet — proportions here are law.',
      prompt: 'GOAL: Production turnaround sheet, 4 orthographic views (FRONT, 3/4, SIDE, BACK) of THE COURT PARASITE on warm bone paper #EDE8DF. Keep proportions identical across views, match the identity render palette and collar geometry. Clean line art with flat color fills, labeled view headers.',
      result_image: '/ui_views/assets/npc01-04-turnaround.png'
    },
    {
      title: '5. Map expression range and prop logic',
      text: 'Six facial states (Neutral Court, Polite Smile, Predator Focus, Dialogue Tell, Spell Whisper, Mask Crack) plus 4 functional callouts: Wing Collar, Void Coat, Signet Cane, Court Ring. Animators and dialogue writers work from this sheet.',
      prompt: 'GOAL: Expression + accessory sheet. 6 head portraits of THE COURT PARASITE (Neutral Court, Polite Smile, Predator Focus, Dialogue Tell, Spell Whisper, Mask Crack) and 4 clean accessory callout panels (Wing Collar, Void Coat, Signet Cane, Court Ring). Keep the identity render face model consistent across all states.',
      result_image: '/ui_views/assets/npc01-05-expression-accessories.png'
    },
    {
      title: '6. Define the key animation start poses',
      text: 'Four readable full-body start poses: 01 Idle, 02 Dialogue Tell, 03 Spell Cue, 04 Attack Anticipation. Each preserves the silhouette — no generic action-hero spread. These are the first frames animators key from.',
      prompt: 'GOAL: Animation handoff sheet with 4 key start poses (Idle, Dialogue Tell, Spell Cue, Attack Anticipation). Full body, same model and palette as the identity render. Poses must read as silhouettes and avoid superhero tropes — this character threatens with stillness.',
      result_image: '/ui_views/assets/npc01-06-animation-poses.png'
    },
    {
      title: '7. Inspect the production 3D model — drag to orbit',
      text: 'The GLB mesh generated from the concept stack (35k tris budget). Drag to orbit, scroll to zoom. Check the collar volume from behind and the sleeve drape from the side — the two spots where 2D-to-3D translations usually break.',
      prompt: 'GOAL: Generate a production 3D character mesh from the locked identity render and turnaround. Budget 35k triangles, A-pose, watertight, ready for retopo and rigging. Export GLB.',
      result_model: '/ui_views/assets/npc01-07-3d-model.glb',
      result_poster: '/ui_views/assets/npc01-03-identity-render.png'
    },
    {
      title: '8. Spec the technical A-pose, sockets and FACS targets',
      text: 'The rigging contract: 45° A-pose blueprint with engine sockets (socket_hand_r, socket_collar_vfx, socket_ring_l, root_ground), 68-joint skeleton, 35k tris budget, 1024 px/m texel density, and FACS facial targets (AU1, AU2, AU4, AU12, AU15, AU25). This sheet ends design arguments — everything is measurable.',
      prompt: 'GOAL: Technical 3D rigging sheet in orthographic A-pose (45° arms). Annotate engine sockets (socket_hand_r, socket_collar_vfx, socket_ring_l, root_ground), joint count 68, poly budget 35k tris, texel density 1024 px/m, FACS targets AU1 AU2 AU4 AU12 AU15 AU25. Blueprint style, precise callouts, no decoration.',
      result_image: '/ui_views/assets/npc01-08-apose-technical.png'
    }
  ],
  result: 'Full production-grade character bible for an original dark-fantasy NPC: 6 concept sheets, an inspectable 3D GLB mesh (35k tris), and a technical A-pose socket + FACS specification ready for engine handoff.',
  downloads: [
    { label: 'Download 3D GLB Model Mesh (35k tris)', file: '/ui_views/assets/npc01-07-3d-model.glb' },
    { label: 'Download Technical A-Pose & Socket Spec', file: '/ui_views/assets/npc01-08-apose-technical.png' }
  ]
};

let replaced = 0;
data.guides = data.guides.map(g => {
  if (g.id === npc01.id) { replaced++; return npc01; }
  return g;
});

writeFileSync(path, JSON.stringify(data, null, 1));
console.log('Updated guides.json — NPC/01:', npc01.steps.length, 'steps (incl. GLB viewer)');
