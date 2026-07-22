import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';

const assetsToCopy = [
  { from: 'npc01/01-silhouette-test.png', to: 'ui_views/assets/npc01-01-silhouette-test.png' },
  { from: 'npc01/02-variant-matrix.png', to: 'ui_views/assets/npc01-02-variant-matrix.png' },
  { from: 'npc01/03-identity-render.png', to: 'ui_views/assets/npc01-03-identity-render.png' },
  { from: 'npc01/04-turnaround.png', to: 'ui_views/assets/npc01-04-turnaround.png' },
  { from: 'npc01/05-expression-accessories.png', to: 'ui_views/assets/npc01-05-expression-accessories.png' },
  { from: 'npc01/06-animation-poses.png', to: 'ui_views/assets/npc01-06-animation-poses.png' },
  { from: 'npc01/07-3d-model.glb', to: 'ui_views/assets/npc01-07-3d-model.glb' },
  { from: 'npc01/08-apose-technical.png', to: 'ui_views/assets/npc01-08-apose-technical.png' },
];

for (const { from, to } of assetsToCopy) {
  if (existsSync(from)) {
    copyFileSync(from, to);
    console.log(`Copied ${from} -> ${to}`);
  } else {
    console.warn(`Source missing: ${from}`);
  }
}

const npc01Guide = {
  id: 'npc01-dark-fantasy-deceiver',
  cat: 'Gamedev',
  sub: 'Character Design',
  title: 'NPC/01 — Design a Dark-Fantasy Deceiver: from Silhouette to 3D Handoff',
  desc: 'A complete Senior Gamedev pipeline for an original dark-fantasy NPC (The Court Parasite): silhouette readability test, 4-tier score matrix, identity render, 4-view turnaround, FACS expressions & props, 4 key animation start poses, 3D GLB model mesh, and technical A-pose socket rigging specification.',
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
      text: 'Start with pure black shapes at 1:1 scale before adding faces or costume details. Variant A (Wing Collar), B (Relic Chain), and C (Moth Cloak) test distinct silhouette C-curves and collar heights.',
      prompt: 'GOAL: Generate 3 distinct black silhouette massings for a dark-fantasy diplomat.',
      result_image: '/ui_views/assets/npc01-01-silhouette-test.png'
    },
    {
      title: '2. Score variants with a weighted decision matrix',
      text: 'Evaluate silhouettes against Authority (30%), Magic (20%), Threat (25%), Mobility (10%), and Readability at 120px (15%). Variant A wins with a 4.25 weighted total, locking the bat-wing collar.',
      prompt: 'GOAL: Create a senior game-concept decision sheet scoring 3 silhouettes against 5 criteria with weighted total.',
      result_image: '/ui_views/assets/npc01-02-variant-matrix.png'
    },
    {
      title: '3. Lock face, materials, and palette in identity render',
      text: 'Render canonical 3/4 full-body anchor. Palette lock: VOID #120F17, BLOOD #4A1830, BONE #C7B79B, STEEL #8A9199. High stiffened collar and long concealed sleeves.',
      prompt: 'GOAL: Full-body identity render for THE COURT PARASITE using silhouette A.',
      result_image: '/ui_views/assets/npc01-03-identity-render.png'
    },
    {
      title: '4. Produce orthographic 4-view turnaround',
      text: 'FRONT / 3-4 / SIDE / BACK views locked to the identity render on a warm bone paper field (#EDE8DF). Back view designs collar rear plane without inventing capes.',
      prompt: 'GOAL: Production turnaround sheet with FRONT, 3/4, SIDE, BACK views on warm bone paper.',
      result_image: '/ui_views/assets/npc01-04-turnaround.png'
    },
    {
      title: '5. Map expression range and prop logic',
      text: 'Six facial states (Neutral Court, Polite Smile, Predator Focus, Dialogue Tell, Spell Whisper, Mask Crack) plus 4 functional callouts: Wing Collar, Void Coat, Signet Cane, Court Ring.',
      prompt: 'GOAL: Expression + accessory sheet. 6 head portraits and 4 clean accessory callout panels.',
      result_image: '/ui_views/assets/npc01-05-expression-accessories.png'
    },
    {
      title: '6. Define key animation start poses',
      text: 'Four readable full-body poses for animators: 01 Idle, 02 Dialogue Tell, 03 Spell Cue, 04 Attack Anticipation. Preserves silhouette readability without generic action-hero tropes.',
      prompt: 'GOAL: Animation handoff sheet with 4 key poses.',
      result_image: '/ui_views/assets/npc01-06-animation-poses.png'
    },
    {
      title: '7. Spec technical A-pose, sockets, and FACS blendshapes',
      text: 'Clean 45° A-pose blueprint sheet. Defines 35k tris poly budget, 1024 px/m texel density, engine sockets (socket_hand_r, socket_collar_vfx, socket_ring_l, root_ground), 68 joints, and FACS facial targets (AU1, AU2, AU4, AU12, AU15, AU25).',
      prompt: 'GOAL: Technical 3D rigging sheet in orthographic A-pose.',
      result_image: '/ui_views/assets/npc01-08-apose-technical.png'
    }
  ],
  result: 'Full production-grade character bible for an original dark-fantasy NPC: 6 orthographic concept sheets, technical A-pose socket specification, 35k tris 3D GLB model mesh, and FACS facial target map ready for engine handoff.',
  downloads: [
    {
      label: 'Download 3D GLB Model Mesh (35k tris)',
      file: '/ui_views/assets/npc01-07-3d-model.glb'
    },
    {
      label: 'Download Technical A-Pose & Socket Spec',
      file: '/ui_views/assets/npc01-08-apose-technical.png'
    }
  ]
};

const guidesData = JSON.parse(readFileSync('ui_views/guides.json', 'utf8'));

// Filter out old entries if exist, then unshift
guidesData.guides = guidesData.guides.filter(
  (g) => g.id !== npc01Guide.id
);
guidesData.guides.unshift(npc01Guide);

writeFileSync('ui_views/guides.json', JSON.stringify(guidesData, null, 2) + '\n', 'utf8');
console.log(`Updated ui_views/guides.json with ${guidesData.guides.length} total guides.`);

