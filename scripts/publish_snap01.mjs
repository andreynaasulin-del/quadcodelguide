import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const GH_REPO = 'andreynaasulin-del/quadcodelguide';
const BRANCH = 'main';
const ghToken = process.env.GH_TOKEN || readFileSync('.temp/secrets/gh_token.txt', 'utf8').trim();

async function uploadFileToGitHub(localPath, repoPath) {
  if (!existsSync(localPath)) {
    console.error(`Local file missing: ${localPath}`);
    return false;
  }
  const content = readFileSync(localPath).toString('base64');
  let sha;
  try {
    const checkRes = await fetch(`https://api.github.com/repos/${GH_REPO}/contents/${repoPath}?ref=${BRANCH}`, {
      headers: { Authorization: `token ${ghToken}`, Accept: 'application/vnd.github+json', 'User-Agent': 'quadcode-publisher' },
    });
    if (checkRes.ok) sha = (await checkRes.json()).sha;
  } catch (e) {}

  console.log(`Uploading ${localPath} (${(readFileSync(localPath).length / 1024 / 1024).toFixed(2)} MB) -> ${repoPath}...`);
  const putRes = await fetch(`https://api.github.com/repos/${GH_REPO}/contents/${repoPath}`, {
    method: 'PUT',
    headers: { Authorization: `token ${ghToken}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json', 'User-Agent': 'quadcode-publisher' },
    body: JSON.stringify({ message: `Add/update SNAP/01 asset ${repoPath}`, content, sha, branch: BRANCH }),
  });
  const json = await putRes.json();
  if (!putRes.ok) {
    console.error(`Upload failed for ${repoPath}:`, json);
    return false;
  }
  console.log(`OK: ${repoPath} (commit ${json.commit?.sha})`);
  return true;
}

const assetsToUpload = [
  { local: 'snap01/01-wireframe-form-logic.png', repo: 'ui_views/assets/snap01-01-wireframe-form-logic.png' },
  { local: 'snap01/02-interaction-matrix.png', repo: 'ui_views/assets/snap01-02-interaction-matrix.png' },
  { local: 'snap01/03-identity-render.png', repo: 'ui_views/assets/snap01-03-identity-render.png' },
  { local: 'snap01/04-module-library.png', repo: 'ui_views/assets/snap01-04-module-library.png' },
  { local: 'snap01/05-base-cabinet.glb', repo: 'ui_views/assets/snap01-05-base-cabinet.glb' },
  { local: 'snap01/05-wall-cabinet.glb', repo: 'ui_views/assets/snap01-05-wall-cabinet.glb' },
  { local: 'snap01/05-drawer-stack.glb', repo: 'ui_views/assets/snap01-05-drawer-stack.glb' },
  { local: 'snap01/05-corner-unit.glb', repo: 'ui_views/assets/snap01-05-corner-unit.glb' },
  { local: 'snap01/05-island.glb', repo: 'ui_views/assets/snap01-05-island.glb' },
  { local: 'snap01/05-appliance-bay.glb', repo: 'ui_views/assets/snap01-05-appliance-bay.glb' },
  { local: 'snap01/05-base-cabinet-poster.png', repo: 'ui_views/assets/snap01-05-base-cabinet-poster.png' },
  { local: 'snap01/05-wall-cabinet-poster.png', repo: 'ui_views/assets/snap01-05-wall-cabinet-poster.png' },
  { local: 'snap01/05-drawer-stack-poster.png', repo: 'ui_views/assets/snap01-05-drawer-stack-poster.png' },
  { local: 'snap01/05-corner-unit-poster.png', repo: 'ui_views/assets/snap01-05-corner-unit-poster.png' },
  { local: 'snap01/05-island-poster.png', repo: 'ui_views/assets/snap01-05-island-poster.png' },
  { local: 'snap01/05-appliance-bay-poster.png', repo: 'ui_views/assets/snap01-05-appliance-bay-poster.png' },
];

const snap01Guide = {
  id: 'snap01-parametric-kitchen-configurator',
  cat: 'Product Design',
  sub: 'Parametric Configurator',
  title: 'SNAP/01 — Parametric Kitchen Configurator: from Form Logic to 3D Module Library',
  desc: 'A complete Senior product-design pipeline for a real-time kitchen configurator: input/live-preview wireframe logic, a weighted decision matrix for the snapping model, a flagship identity render, a locked-dimension module library, and 6 production GLB meshes rebuilt from photoreal studio references after root-causing two Meshy defects.',
  time: '30 min',
  date: '2026-07-23',
  level: 'Senior',
  models: 'GPT-Image, Meshy v6',
  new: true,
  trending: true,
  image: '/ui_views/assets/snap01-03-identity-render.png',
  poster: '/ui_views/assets/snap01-03-identity-render.png',
  steps: [
    {
      title: '1. Lock the input-to-preview wireframe logic',
      text: 'Two-panel blueprint: a width/depth/height input form on the left, a live floor-plan preview on the right, connected by a "LIVE SYNC" link so every field edit redraws the plan immediately — no separate "Generate" button, no round-trip.',
      prompt: 'GOAL: Two-panel wireframe sheet — input form (left) driving a live floor-plan preview (right), orange dimension arrows, explicit LIVE SYNC connector between the two panels.',
      result_image: '/ui_views/assets/snap01-01-wireframe-form-logic.png'
    },
    {
      title: '2. Score the snapping model with a weighted matrix',
      text: 'Three snapping strategies scored on Trust (35%), Speed (20%), Error Rate (30%), Build Cost (15%): Grid-Snap 4.50, Rigid Presets 4.35, Freeform 2.50. Grid-Snap wins by only 0.15 over Rigid Presets — close enough that the rule gets written down, not left to memory: grid pitch = width of the narrowest module.',
      prompt: 'GOAL: Decision-matrix sheet comparing Grid-Snap / Freeform / Rigid Presets against 4 weighted criteria, with floor-plan icon per strategy and a locked scoring rule footer.',
      result_image: '/ui_views/assets/snap01-02-interaction-matrix.png'
    },
    {
      title: '3. Render the flagship identity kitchen',
      text: 'One L-shaped run + island, on a neutral graphite studio backdrop, with the material palette locked before any single module gets modeled: OAK #C08A52 for fronts, GRAPHITE #22262B for worktops, STEEL #9AA3AC for hardware. Six modules visible and separable in one shot: base run, wall run, corner unit, appliance tower, island, hood.',
      prompt: 'GOAL: Flagship L-kitchen + island identity render, neutral graphite studio background, OAK/GRAPHITE/STEEL material palette, all 6 module types clearly separable.',
      result_image: '/ui_views/assets/snap01-03-identity-render.png'
    },
    {
      title: '4. Define the module library on a locked grid pitch',
      text: 'Six modules, one 300mm grid: Base Cabinet 600×600×720, Wall Cabinet 600×350×720, Drawer Stack 300×600×720 (the narrowest — sets the pitch), Corner Unit 900×900×720, Island 1800×900×900, Appliance Bay 600×600×2100. Every width is a multiple of 300mm, so any two modules snap edge-to-edge with zero gap or overlap.',
      prompt: 'GOAL: Orthographic module-library sheet, 3×2 grid, 6 kitchen modules with dimension lines and W×D×H spec line each, same OAK/GRAPHITE/STEEL palette as the identity render.',
      result_image: '/ui_views/assets/snap01-04-module-library.png'
    },
    {
      title: '5. Rebuild all 6 modules as production GLB meshes',
      text: 'First pass fed the flat schematic icons straight into Meshy — result: phantom drawer-front seams and no depth cues. Fix: 6 dedicated photoreal studio references (same palette, same background) generated first, then meshed. Two defects still slipped through — a corner unit reading its "diagonal-face door" as a literal barn-door Z-brace, and a base cabinet growing tiny metal legs no prompt asked for. Root-cause fix for both is in the prompts below, not in the mesh: reworded the corner reference to "one angled corner facet, plain flat door, no Z-brace," and the base cabinet to "flush plinth base, zero gap to floor." Both regenerated clean on the next pass.',
      prompt: 'GOAL: 6 individual production GLB meshes (quad topology, ENABLE_PBR) built from 6 photoreal single-module studio references, matching the step-3 identity render palette and the step-4 locked dimensions exactly.',
      models: [
        { model: '/ui_views/assets/snap01-05-base-cabinet.glb', poster: '/ui_views/assets/snap01-05-base-cabinet-poster.png', label: 'Base Cabinet — 600×600×720' },
        { model: '/ui_views/assets/snap01-05-wall-cabinet.glb', poster: '/ui_views/assets/snap01-05-wall-cabinet-poster.png', label: 'Wall Cabinet — 600×350×720' },
        { model: '/ui_views/assets/snap01-05-drawer-stack.glb', poster: '/ui_views/assets/snap01-05-drawer-stack-poster.png', label: 'Drawer Stack — 300×600×720' },
        { model: '/ui_views/assets/snap01-05-corner-unit.glb', poster: '/ui_views/assets/snap01-05-corner-unit-poster.png', label: 'Corner Unit — 900×900×720' },
        { model: '/ui_views/assets/snap01-05-island.glb', poster: '/ui_views/assets/snap01-05-island-poster.png', label: 'Island — 1800×900×900' },
        { model: '/ui_views/assets/snap01-05-appliance-bay.glb', poster: '/ui_views/assets/snap01-05-appliance-bay-poster.png', label: 'Appliance Bay — 600×600×2100' }
      ]
    }
  ],
  result: 'A locked 300mm-pitch module library (6 GLB meshes, all snap-compatible edge-to-edge) plus the 4 concept sheets that justify every dimension and every interaction rule behind it — ready to drop into a real-time 3D configurator.',
  downloads: [
    { label: 'Download Base Cabinet GLB (600×600×720)', file: '/ui_views/assets/snap01-05-base-cabinet.glb' },
    { label: 'Download Wall Cabinet GLB (600×350×720)', file: '/ui_views/assets/snap01-05-wall-cabinet.glb' },
    { label: 'Download Drawer Stack GLB (300×600×720)', file: '/ui_views/assets/snap01-05-drawer-stack.glb' },
    { label: 'Download Corner Unit GLB (900×900×720)', file: '/ui_views/assets/snap01-05-corner-unit.glb' },
    { label: 'Download Island GLB (1800×900×900)', file: '/ui_views/assets/snap01-05-island.glb' },
    { label: 'Download Appliance Bay GLB (600×600×2100)', file: '/ui_views/assets/snap01-05-appliance-bay.glb' }
  ]
};

async function main() {
  for (const asset of assetsToUpload) {
    await uploadFileToGitHub(asset.local, asset.repo);
  }

  const guidesData = JSON.parse(readFileSync('ui_views/guides.json', 'utf8'));
  guidesData.guides = guidesData.guides.filter((g) => g.id !== snap01Guide.id);
  guidesData.guides.unshift(snap01Guide);
  const out = JSON.stringify(guidesData, null, 2) + '\n';
  writeFileSync('ui_views/guides.json', out, 'utf8');
  writeFileSync('.temp/guides_snap01_upload.json', out, 'utf8');

  await uploadFileToGitHub('.temp/guides_snap01_upload.json', 'ui_views/guides.json');
  console.log(`Done. ${guidesData.guides.length} total guides.`);
}

main().catch((err) => { console.error(err); process.exit(1); });
