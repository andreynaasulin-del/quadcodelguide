/**
 * GLOCK-18C | GHOST PROTOCOL — viewer.
 *
 * Wires the procedural build to a UI: orbit/zoom, a parts panel driven by the
 * real triangle counts coming out of the builder, an explode rig, isolate,
 * per-part material readout, and a source viewer that fetches the actual
 * generator file and jumps to the line that produced the selected part.
 */

import * as THREE from './vendor/three.module.js';
import { Orbit } from './orbit.js';
import { buildGlock18, SPEC, MODULES } from './build-glock18.js';
import { createMaterials, createEnvironment, MATERIAL_NOTES, PALETTE } from './skin.js';

const SOURCE_FILE = './build-glock18.js';
const REVEAL_SPAN = 0.55;   // seconds a single part takes to seat
const REVEAL_TOTAL = 3.8;   // seconds for the whole reconstruction

const $ = (selector) => document.querySelector(selector);

const state = {
  explode: 0,
  explodeTarget: 0,
  isolate: null,        // module id or part id
  selected: null,       // part entry
  wireframe: false,
  spin: true,
  elapsed: 0,
  revealing: true,
};

// ---------------------------------------------------------------------------
// Renderer, scene, lights
// ---------------------------------------------------------------------------

const canvas = $('#stage');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
// 1.4, not 1.0. A matte black pistol reflects about 5% of what hits it, so at a
// neutral exposure the whole model collapses into the background and none of the
// 12k triangles read. Photographers overexpose black products for the same reason.
renderer.toneMappingExposure = 1.4;
renderer.shadowMap.enabled = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#0E0E14');
scene.fog = new THREE.Fog('#0A0A10', 52, 112);

const camera = new THREE.PerspectiveCamera(38, 1, 0.5, 300);

const env = createEnvironment(renderer);
scene.environment = env;

/**
 * Three-point studio, all of it near-white.
 *
 * The first version of this scene had a cyan fill and a warm rim, and it made a
 * matte black pistol look like a cyan toy — a black object has almost no diffuse
 * of its own, so it reports whatever colour you point at it. Anything coloured
 * here is a lie about the material.
 */
const key = new THREE.DirectionalLight('#f4f7fb', 2.9);
key.position.set(-14, 22, 16);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.near = 4;
key.shadow.camera.far = 70;
key.shadow.camera.left = -22;
key.shadow.camera.right = 22;
key.shadow.camera.top = 22;
key.shadow.camera.bottom = -22;
key.shadow.bias = -0.0007;
key.shadow.normalBias = 0.03;
scene.add(key);

// Opposite flank, at a third of the key. Stops the shadow side from crushing to
// pure black without lifting the whole thing into grey.
const fill = new THREE.DirectionalLight('#dfe6f0', 1.15);
fill.position.set(16, 5, -15);
scene.add(fill);

// Low kicker under the dust cover, which is where a real product shot puts a
// bounce card to get the trigger guard to read.
const kicker = new THREE.DirectionalLight('#ffffff', 0.35);
kicker.position.set(4, -10, 14);
scene.add(kicker);

scene.add(new THREE.AmbientLight('#3a414d', 1.0));

// Ground: a plane that only receives shadow, plus a faint grid for scale. Both
// are parked by fitGround() once the real bounds are known — with a 20 cm
// magazine fitted, a hard-coded floor height cuts straight through the baseplate.
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(180, 180),
  new THREE.ShadowMaterial({ color: '#000000', opacity: 0.5 }),
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const grid = new THREE.GridHelper(150, 75, '#20202c', '#16161e');
scene.add(grid);

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------

const buildStart = performance.now();
const { materials } = createMaterials();
const { root, parts, stats } = buildGlock18(materials);
const buildMs = performance.now() - buildStart;

// The pistol is authored with its rear face at x = 0 and the rail line at y = 0,
// so left alone it orbits around its own heel. Measure it, then shift it so the
// centre of the real bounding box is the origin — the fitted magazine changes
// that centre by 4 cm, which is why this is measured instead of typed in.
const rig = new THREE.Group();
rig.add(root);
scene.add(rig);

const rawBounds = new THREE.Box3().setFromObject(root);
const rawCentre = rawBounds.getCenter(new THREE.Vector3());
root.position.set(-rawCentre.x, -rawCentre.y, -rawCentre.z);

/**
 * Disassembly choreography.
 *
 * A single linear slider that moves 34 parts at the same rate looks like a
 * cardboard model coming apart. Real disassembly has an order, so the slider is
 * split: the first 45% takes off the four things you remove by hand on a range
 * table — magazine, slide, barrel, recoil spring — and only past that do the
 * pins, the fire control and the frame internals separate.
 *
 * Each module gets a start point in slider space. A part's own progress is the
 * slider remapped into what is left after its delay, so every part still reaches
 * its full offset at 100% no matter when it started.
 */
const TEARDOWN_ORDER = {
  magazine: 0.00,
  slide: 0.06,
  barrel: 0.14,
  fire: 0.44,
  frame: 0.52,
};

const partById = new Map(parts.map((part) => [part.id, part]));
parts.forEach((part, index) => {
  part.order = index;
  part.revealAt = (index / parts.length) * (REVEAL_TOTAL - REVEAL_SPAN);
  part.reveal = 0;
  part.home = part.object.position.clone();
  part.bounds = new THREE.Box3().setFromObject(part.object);

  // Stagger inside a module too, or nine serration ribs move as one slab.
  part.delay = Math.min(0.78, (TEARDOWN_ORDER[part.module] ?? 0.3) + (index % 4) * 0.022);

  // A deterministic tumble, small enough to read as drift rather than spin. Parts
  // that stay put (the frame) get none, so the frame stays the visual anchor.
  const seed = (index * 2654435761) % 1000 / 1000;
  part.tumbleAxis = new THREE.Vector3(
    Math.sin(seed * 12.9898),
    Math.cos(seed * 78.233),
    Math.sin(seed * 43.758 + 1.7),
  ).normalize();
  part.tumble = part.explode.lengthSq() < 0.01 ? 0 : 0.10 + seed * 0.22;
  part.baseQuaternion = part.object.quaternion.clone();
});

const fullBounds = new THREE.Box3().setFromObject(root);

// Floor sits 1.5 cm under the lowest point of the assembled pistol.
function fitGround() {
  const floor = fullBounds.min.y - 1.5;
  ground.position.y = floor;
  grid.position.y = floor + 0.02;
  key.shadow.camera.bottom = floor - 8;
  key.shadow.camera.updateProjectionMatrix();
}
fitGround();

// Selection overlay: accent-coloured edges of the selected part, cached so
// picking through the list stays instant.
const edgeMaterial = new THREE.LineBasicMaterial({ color: PALETTE.accent, transparent: true, opacity: 0.9 });
const edgeCache = new Map();

function edgesFor(part) {
  if (edgeCache.has(part.id)) return edgeCache.get(part.id);
  const group = new THREE.Group();
  part.object.children.forEach((mesh) => {
    const line = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, 24), edgeMaterial);
    group.add(line);
  });
  group.visible = false;
  part.object.add(group);
  edgeCache.set(part.id, group);
  return group;
}

// ---------------------------------------------------------------------------
// Controls
// ---------------------------------------------------------------------------

const orbit = new Orbit(camera, canvas, { minDistance: 7, maxDistance: 80 });
orbit.distanceTarget = 40;
orbit.autoSpin = 0.12;

function resize() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (!width || !height) return;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(canvas);
resize();

// ---------------------------------------------------------------------------
// Parts panel
// ---------------------------------------------------------------------------

const listEl = $('#parts-list');
const rowById = new Map();

function buildPanel() {
  const fragment = document.createDocumentFragment();

  MODULES.forEach((module) => {
    const moduleParts = parts.filter((part) => part.module === module.id);
    const moduleTris = moduleParts.reduce((sum, part) => sum + part.triangles, 0);

    const section = document.createElement('section');
    section.className = 'module';
    section.style.setProperty('--accent', module.accent);

    const head = document.createElement('button');
    head.className = 'module-head';
    head.innerHTML = `
      <span class="dot"></span>
      <span class="module-name">${module.label}</span>
      <span class="module-meta">${moduleParts.length} · ${moduleTris.toLocaleString()} tri</span>
    `;
    head.addEventListener('click', () => {
      state.isolate = state.isolate === module.id ? null : module.id;
      applyIsolate();
      if (state.isolate) frameSelection(moduleParts);
      else orbit.frame(fullBounds, 1.35);
    });
    section.appendChild(head);

    moduleParts.forEach((part) => {
      const row = document.createElement('button');
      row.className = 'part-row';
      row.dataset.id = part.id;
      row.innerHTML = `
        <span class="part-name">${part.label}</span>
        <span class="part-tri">${part.triangles.toLocaleString()}</span>
      `;
      row.addEventListener('click', () => select(part, true));
      row.addEventListener('pointerenter', () => hover(part));
      row.addEventListener('pointerleave', () => hover(null));
      section.appendChild(row);
      rowById.set(part.id, row);
    });

    fragment.appendChild(section);
  });

  listEl.appendChild(fragment);
}

function hover(part) {
  rowById.forEach((row) => row.classList.remove('hovered'));
  if (part) rowById.get(part.id)?.classList.add('hovered');
  canvas.style.cursor = part ? 'pointer' : 'grab';
}

function select(part, fromList = false) {
  if (state.selected) edgesFor(state.selected).visible = false;
  state.selected = part;
  rowById.forEach((row) => row.classList.toggle('selected', row.dataset.id === part?.id));

  if (!part) {
    $('#inspector').classList.add('empty');
    return;
  }

  edgesFor(part).visible = true;
  orbit.autoSpin = 0;
  state.spin = false;
  $('#btn-spin').classList.remove('on');
  renderInspector(part);
  if (fromList) rowById.get(part.id)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function renderInspector(part) {
  const module = MODULES.find((m) => m.id === part.module);
  const inspector = $('#inspector');
  inspector.classList.remove('empty');
  inspector.style.setProperty('--accent', module.accent);
  inspector.innerHTML = `
    <div class="ins-head">
      <div class="ins-module">${module.label}</div>
      <h2>${part.label}</h2>
    </div>
    <dl class="ins-grid">
      <div><dt>Triangles</dt><dd>${part.triangles.toLocaleString()}</dd></div>
      <div><dt>Meshes</dt><dd>${part.pieces}</dd></div>
      <div><dt>Primitive</dt><dd>${part.built}</dd></div>
      <div><dt>Material</dt><dd>${MATERIAL_NOTES[part.material] || part.material}</dd></div>
    </dl>
    <p class="ins-note">${part.note}</p>
    <div class="ins-actions">
      <button data-act="isolate">${state.isolate === part.id ? 'Un-isolate' : 'Isolate part'}</button>
      <button data-act="source">Show in source</button>
    </div>
  `;

  inspector.querySelector('[data-act="isolate"]').addEventListener('click', () => {
    state.isolate = state.isolate === part.id ? null : part.id;
    applyIsolate();
    if (state.isolate) frameSelection([part]);
    else orbit.frame(fullBounds, 1.35);
    renderInspector(part);
  });
  inspector.querySelector('[data-act="source"]').addEventListener('click', () => openSource(part));
}

function frameSelection(list) {
  const box = new THREE.Box3();
  list.forEach((part) => box.union(new THREE.Box3().setFromObject(part.object)));
  orbit.frame(box, 1.9);
}

function applyIsolate() {
  const target = state.isolate;
  parts.forEach((part) => {
    const shown = !target || part.id === target || part.module === target;
    part.object.visible = shown;
  });
  $('#btn-isolate').classList.toggle('on', Boolean(target));
  document.querySelectorAll('.module').forEach((section) => section.classList.remove('isolated'));
  $('#isolate-label').textContent = target ? `ISOLATED · ${target}` : '';
}

// ---------------------------------------------------------------------------
// Picking
// ---------------------------------------------------------------------------

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

canvas.addEventListener('pointerup', (event) => {
  if (orbit.dragged) return;
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);

  const hits = raycaster.intersectObject(root, true);
  const hit = hits.find((h) => h.object.isMesh && h.object.parent?.userData.part);
  if (hit) select(hit.object.parent.userData.part, true);
});

// ---------------------------------------------------------------------------
// Source viewer
// ---------------------------------------------------------------------------

let sourceText = null;

async function loadSource() {
  if (sourceText) return sourceText;
  try {
    const response = await fetch(SOURCE_FILE, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    sourceText = await response.text();
  } catch (error) {
    sourceText = `// Could not read ${SOURCE_FILE}: ${error.message}\n`
      + '// Serve this folder over http (fetch is blocked on file:// URLs).';
  }
  return sourceText;
}

async function openSource(part = null) {
  const text = await loadSource();
  const lines = text.split('\n');
  const modal = $('#source-modal');
  const body = $('#source-body');

  // Find the line that declares this part, so the viewer opens on the code that
  // actually produced the geometry you are looking at.
  const needle = part ? `id: '${part.id}'` : null;
  const hitLine = needle ? lines.findIndex((line) => line.includes(needle)) : -1;

  body.innerHTML = lines.map((line, index) => {
    const number = String(index + 1).padStart(4, ' ');
    const isHit = hitLine >= 0 && index >= hitLine - 1 && index <= hitLine + 12;
    const escaped = line
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return `<div class="src-line${isHit ? ' hit' : ''}" id="src-${index}"><span class="ln">${number}</span><code>${escaped || ' '}</code></div>`;
  }).join('');

  $('#source-title').textContent = part
    ? `build-glock18.js — ${part.label}`
    : 'build-glock18.js — generated source';
  $('#source-meta').textContent = `${lines.length} lines · ${stats.parts} parts · ${stats.triangles.toLocaleString()} triangles · built in ${buildMs.toFixed(0)} ms`;

  modal.classList.add('open');
  if (hitLine >= 0) {
    requestAnimationFrame(() => {
      $(`#src-${Math.max(0, hitLine - 4)}`)?.scrollIntoView({ block: 'start' });
    });
  } else {
    body.scrollTop = 0;
  }
}

$('#source-close').addEventListener('click', () => $('#source-modal').classList.remove('open'));
$('#source-modal').addEventListener('click', (event) => {
  if (event.target.id === 'source-modal') $('#source-modal').classList.remove('open');
});
$('#btn-source').addEventListener('click', () => openSource(state.selected));

// ---------------------------------------------------------------------------
// Toolbar
// ---------------------------------------------------------------------------

const explodeInput = $('#explode');

/**
 * Name the stage the slider is in. The words match the teardown windows above,
 * so the label is a readout of the actual choreography and not decoration: below
 * 6% nothing but the magazine has moved, past 52% the frame internals are out.
 */
function explodeStage(value) {
  if (value < 0.02) return 'assembled';
  if (value < 0.16) return 'magazine out';
  if (value < 0.44) return 'field strip';
  if (value < 0.80) return 'fire control out';
  return 'full teardown';
}

/**
 * Distance that fits the assembled pistol. Captured once, then scaled with the
 * slider: at full teardown the parts occupy roughly 1.6x the assembled envelope,
 * so without this the fire control drifts off-screen exactly when you went
 * looking for it. Any manual zoom cancels the coupling for the rest of the
 * session — a user who zoomed in has said what they want.
 */
let baseDistance = 0;
let manualZoom = false;
canvas.addEventListener('wheel', () => { manualZoom = true; }, { passive: true });

function syncExplodeUI() {
  const value = state.explodeTarget;
  if (!manualZoom && baseDistance) {
    orbit.distanceTarget = baseDistance * (1 + 0.62 * value);
  }
  explodeInput.style.setProperty('--fill', `${(value * 100).toFixed(1)}%`);
  $('#explode-value').textContent = Math.round(value * 100);
  $('#explode-stage').textContent = explodeStage(value);
  $('#btn-explode').classList.toggle('on', value > 0.02);
}

explodeInput.addEventListener('input', () => {
  state.explodeTarget = Number(explodeInput.value) / 100;
  // Dragging the slider is a deliberate act of inspection; a spinning model
  // fights it, so the auto-spin stops on first touch.
  if (state.spin && state.explodeTarget > 0.02) $('#btn-spin').click();
  syncExplodeUI();
});

$('#btn-explode').addEventListener('click', () => {
  state.explodeTarget = state.explodeTarget > 0.02 ? 0 : 1;
  explodeInput.value = String(state.explodeTarget * 100);
  syncExplodeUI();
});

$('#btn-isolate').addEventListener('click', () => {
  if (state.isolate) {
    state.isolate = null;
    applyIsolate();
    orbit.frame(fullBounds, 1.35);
    return;
  }
  if (state.selected) {
    state.isolate = state.selected.module;
    applyIsolate();
    frameSelection(parts.filter((part) => part.module === state.isolate));
  }
});

$('#btn-wireframe').addEventListener('click', () => {
  state.wireframe = !state.wireframe;
  Object.values(materials).forEach((material) => { material.wireframe = state.wireframe; });
  $('#btn-wireframe').classList.toggle('on', state.wireframe);
});

$('#btn-spin').addEventListener('click', () => {
  state.spin = !state.spin;
  orbit.autoSpin = state.spin ? 0.12 : 0;
  $('#btn-spin').classList.toggle('on', state.spin);
});

$('#btn-reset').addEventListener('click', () => {
  state.isolate = null;
  applyIsolate();
  select(null);
  state.explodeTarget = 0;
  explodeInput.value = '0';
  syncExplodeUI();
  orbit.frame(fullBounds, 1.35);
  state.elapsed = 0;
  state.revealing = true;
});

window.addEventListener('keydown', (event) => {
  if (event.target.tagName === 'INPUT') return;
  const map = {
    e: '#btn-explode',
    i: '#btn-isolate',
    w: '#btn-wireframe',
    s: '#btn-source',
    r: '#btn-reset',
    ' ': '#btn-spin',
  };
  const button = map[event.key.toLowerCase()];
  if (button) {
    event.preventDefault();
    $(button).click();
  }
  if (event.key === 'Escape') {
    $('#source-modal').classList.remove('open');
    state.isolate = null;
    applyIsolate();
    select(null);
  }
});

// ---------------------------------------------------------------------------
// Reconstruction sweep — a scan plane that runs the length of the pistol while
// the parts seat, so the intro reads as a build rather than a fade-in.
// ---------------------------------------------------------------------------

const scanMaterial = new THREE.MeshBasicMaterial({
  color: PALETTE.accent,
  transparent: true,
  opacity: 0.35,
  side: THREE.DoubleSide,
  depthWrite: false,
});
const scan = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), scanMaterial);
scan.rotation.y = Math.PI / 2;
scene.add(scan);

// ---------------------------------------------------------------------------
// HUD
// ---------------------------------------------------------------------------

$('#stat-parts').textContent = stats.parts;
$('#stat-tris').textContent = stats.triangles.toLocaleString();
$('#stat-build').textContent = `${buildMs.toFixed(0)} ms`;
$('#spec-line').textContent = `L ${SPEC.overall.length} · H ${SPEC.overall.height} · W ${SPEC.overall.width} cm · barrel ${SPEC.barrel.length} cm`;

let frames = 0;
let fpsClock = performance.now();

// ---------------------------------------------------------------------------
// Loop
// ---------------------------------------------------------------------------

const offset = new THREE.Vector3();
const tumbleQuat = new THREE.Quaternion();
let lastFrame = performance.now();

function tick() {
  const frameStart = performance.now();
  const dt = Math.min((frameStart - lastFrame) / 1000, 0.05);
  lastFrame = frameStart;
  state.elapsed += dt;

  state.explode += (state.explodeTarget - state.explode) * Math.min(1, dt * 6);

  const revealDone = state.elapsed > REVEAL_TOTAL + REVEAL_SPAN;
  if (state.revealing && revealDone) {
    state.revealing = false;
    scan.visible = false;
    $('#boot').classList.add('done');
    // Hand visibility back to the isolate rule. Without this, anything the
    // reveal had not reached yet stays hidden forever.
    applyIsolate();
  }

  parts.forEach((part) => {
    if (state.revealing) {
      const raw = (state.elapsed - part.revealAt) / REVEAL_SPAN;
      part.reveal = Math.min(1, Math.max(0, raw));
    } else {
      part.reveal = 1;
    }

    const eased = 1 - (1 - part.reveal) ** 3;

    // Remap the global slider into this part's own window, then smoothstep it so
    // a part eases out of its seat and eases into its final position instead of
    // tracking the pointer linearly.
    const window = 1 - part.delay;
    const local = window <= 0 ? 0
      : Math.min(1, Math.max(0, (state.explode - part.delay) / window));
    const teardown = local * local * (3 - 2 * local);

    // Parts arrive along the same vector they explode along: one rig, two uses.
    const spread = teardown + (1 - eased) * 2.1;
    offset.copy(part.explode).multiplyScalar(spread);
    part.object.position.copy(part.home).add(offset);

    // Tumble tracks the same curve as the offset, so a part never rotates while
    // sitting still — that was the thing that made the first pass feel floaty.
    if (part.tumble) {
      tumbleQuat.setFromAxisAngle(part.tumbleAxis, part.tumble * teardown);
      part.object.quaternion.copy(part.baseQuaternion).multiply(tumbleQuat);
    }

    if (state.revealing) {
      part.object.visible = part.reveal > 0.001 && (!state.isolate
        || part.id === state.isolate || part.module === state.isolate);
    }
  });

  if (state.revealing) {
    const sweep = (state.elapsed / (REVEAL_TOTAL + REVEAL_SPAN)) * SPEC.overall.length * 1.15;
    scan.position.set(root.position.x + sweep - 1, root.position.y - 2, 0);
    scanMaterial.opacity = 0.30 + Math.sin(state.elapsed * 22) * 0.08;
    $('#boot-bar').style.width = `${Math.min(100, (state.elapsed / (REVEAL_TOTAL + REVEAL_SPAN)) * 100).toFixed(1)}%`;
    const seated = parts.filter((part) => part.reveal >= 1).length;
    $('#boot-count').textContent = `${seated}/${stats.parts} parts seated`;
  }

  orbit.update(dt);
  renderer.render(scene, camera);

  frames += 1;
  const now = performance.now();
  if (now - fpsClock > 500) {
    $('#stat-fps').textContent = Math.round((frames * 1000) / (now - fpsClock));
    $('#stat-draws').textContent = renderer.info.render.calls;
    frames = 0;
    fpsClock = now;
  }

  requestAnimationFrame(tick);
}

/**
 * Debug handle. Lets you drive the viewer from the console or from a test
 * harness: GP.view('left'), GP.select('barrel'), GP.set({explode: 1}).
 */
window.GP = {
  state,
  parts,
  stats,
  orbit,
  select: (id) => select(partById.get(id), true),
  set: (patch) => Object.assign(state, patch),
  view(name) {
    // azimuth 0 puts the camera on +Z, which is the shooter's right flank.
    const presets = {
      right: [0, 1.57],
      left: [Math.PI, 1.57],
      muzzle: [-Math.PI / 2, 1.57],
      hero: [-0.85, 1.28],
      top: [0, 0.22],
    };
    const [azimuth, polar] = presets[name] || presets.hero;
    orbit.azimuth = azimuth;
    orbit.polar = polar;
    orbit.autoSpin = 0;
    state.spin = false;
    $('#btn-spin').classList.remove('on');
  },
  skipIntro() {
    state.elapsed = REVEAL_TOTAL + REVEAL_SPAN + 1;
  },
};

buildPanel();
orbit.frame(fullBounds, 1.35);
baseDistance = orbit.distanceTarget;
syncExplodeUI();
$('#inspector').classList.add('empty');
tick();
