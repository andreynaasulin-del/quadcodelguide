/**
 * GLOCK-18C finish — generated at runtime, no image files.
 *
 * The reference is a factory pistol, not a skin: matte black polymer lower,
 * black-nitride slide, bare steel where the hand and the case touch metal. So
 * the atlases below are almost monochrome on purpose. All the read comes from
 * roughness and bump, not from colour.
 *
 * Three passes are painted per assembly from the same primitives and the same
 * seeds — colour, roughness, bump — so a moulded stipple dot is dark, rough and
 * raised in exactly the same pixel.
 *
 * Quadcode accents (#FF9569 / #DD344D) live in the UI only. Nothing on the
 * pistol is branded; a coloured gun would hide the geometry, which is the thing
 * this page is actually about.
 */

import * as THREE from './vendor/three.module.js';

export const PALETTE = {
  // Pistol. These look far too light written down — a Glock is "black". But a
  // black polymer frame measures around 12% reflectance in daylight, which is
  // this grey, and painting it #111 gives a silhouette instead of an object.
  polymer: '#2a2e34',
  polymerHigh: '#3a4048',
  slide: '#222629',
  slideWear: '#7d858f',
  steel: '#8f979f',

  // UI / lighting
  accent: '#FF9569',
  accent2: '#DD344D',
  key: '#eef2f8',
};

function canvas(width, height) {
  const element = document.createElement('canvas');
  element.width = width;
  element.height = height;
  return { element, ctx: element.getContext('2d') };
}

function texture(element, { srgb = false } = {}) {
  const map = new THREE.CanvasTexture(element);
  map.wrapS = THREE.ClampToEdgeWrapping;
  map.wrapT = THREE.ClampToEdgeWrapping;
  map.anisotropy = 8;
  if (srgb) map.colorSpace = THREE.SRGBColorSpace;
  return map;
}

/** Deterministic noise so the finish is identical on every reload. */
function makeRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

/**
 * Moulded stipple. Each dot is drawn as a radial gradient rather than a flat
 * disc, which is what makes it survive into the bump pass as a dome instead of
 * a cylinder.
 */
function stipple(ctx, rect, { seed, density = 0.0012, size = 2.6, core, edge }) {
  const random = makeRandom(seed);
  const count = Math.round(rect.w * rect.h * density);
  for (let i = 0; i < count; i += 1) {
    const x = rect.x + random() * rect.w;
    const y = rect.y + random() * rect.h;
    const r = size * (0.6 + random() * 0.85);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, core);
    g.addColorStop(1, edge);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Fine unidirectional tool marks. Real nitride slides are streaky, not noisy. */
function toolMarks(ctx, rect, { seed, count, ink, alpha = 0.06, length = 220 }) {
  const random = makeRandom(seed);
  ctx.strokeStyle = ink;
  ctx.lineWidth = 1;
  for (let i = 0; i < count; i += 1) {
    const x = rect.x + random() * rect.w;
    const y = rect.y + random() * rect.h;
    const len = length * (0.25 + random() * 0.75);
    ctx.globalAlpha = alpha * (0.4 + random());
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + len, y + (random() - 0.5) * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

/**
 * Holding wear: a soft band along an edge. This is the only thing that stops a
 * near-black slide from reading as a flat black rectangle at grazing angles.
 */
function edgeWear(ctx, size, { seed, ink }) {
  const random = makeRandom(seed);
  [0, size.h].forEach((edgeY, side) => {
    for (let i = 0; i < 120; i += 1) {
      const x = random() * size.w;
      const w = 14 + random() * 90;
      const h = 3 + random() * 7;
      const y = side === 0 ? edgeY + random() * 6 : edgeY - h - random() * 6;
      ctx.globalAlpha = 0.05 + random() * 0.16;
      ctx.fillStyle = ink;
      ctx.fillRect(x, y, w, h);
    }
  });
  ctx.globalAlpha = 1;
}

function label(ctx, text, { x, y, size, font = '"JetBrains Mono", ui-monospace, monospace', ink, rotate = 0, spacing = 0, align = 'center', weight = 600, alpha = 1 }) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotate);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = ink;
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.textAlign = spacing ? 'left' : align;
  ctx.textBaseline = 'middle';

  if (!spacing) {
    ctx.fillText(text, 0, 0);
  } else {
    const chars = [...text];
    const total = chars.reduce((sum, c) => sum + ctx.measureText(c).width + spacing, -spacing);
    let cursor = align === 'center' ? -total / 2 : 0;
    chars.forEach((c) => {
      ctx.fillText(c, cursor, 0);
      cursor += ctx.measureText(c).width + spacing;
    });
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Atlas layout
// ---------------------------------------------------------------------------

/**
 * Both atlases are laid out in real centimetres against the UV frames declared
 * in build-glock18.js, so nothing here is a magic fraction. cm() converts a
 * point in gun space to a pixel in the atlas, remembering that CanvasTexture
 * flips v — canvas top is the top of the UV frame.
 */
function atlasFor(frame, pxPerCm) {
  const spanX = frame.max[0] - frame.min[0];
  const spanY = frame.max[1] - frame.min[1];
  const w = Math.round(spanX * pxPerCm);
  const h = Math.round(spanY * pxPerCm);
  return {
    w,
    h,
    pxPerCm,
    // x runs along the gun, y is height above the rail line
    at: (x, y) => ({ x: (x - frame.min[0]) * pxPerCm, y: (frame.max[1] - y) * pxPerCm }),
    box: (x0, y0, x1, y1) => ({
      x: (x0 - frame.min[0]) * pxPerCm,
      y: (frame.max[1] - y1) * pxPerCm,
      w: (x1 - x0) * pxPerCm,
      h: (y1 - y0) * pxPerCm,
    }),
  };
}

/**
 * Two planar projection frames, in centimetres, sized to the real bounds of the
 * geometry they wrap. The magazine deliberately has no frame: it is a plain matte
 * body with moulded ribs, and forcing it through the frame atlas stretched the
 * grip stipple over 18 cm of magazine.
 */
export const UV_FRAMES = {
  frame: { min: [-0.20, -11.70, -1.60], max: [14.20, 1.20, 1.60] },
  slide: { min: [-0.20, -0.20, -1.60], max: [18.80, 3.30, 1.60] },
};

const PX_PER_CM = 108;

// ---------------------------------------------------------------------------
// Frame / magazine atlas
// ---------------------------------------------------------------------------

/**
 * Grip texture panels, in gun coordinates. The rear panel follows the
 * backstrap, the front one the front strap; the middle of the grip is left
 * smoother because that is where the moulded panel edges sit on a Gen3 frame.
 */
const GRIP_ZONE = { x0: 1.6, y0: -11.0, x1: 10.6, y1: -3.2 };

function framePasses() {
  const A = atlasFor(UV_FRAMES.frame, PX_PER_CM);
  const colour = canvas(A.w, A.h);
  const rough = canvas(A.w, A.h);
  const bump = canvas(A.w, A.h);

  // --- base coats ---------------------------------------------------------
  const base = colour.ctx.createLinearGradient(0, 0, 0, A.h);
  base.addColorStop(0, '#33383f');
  base.addColorStop(0.35, PALETTE.polymer);
  base.addColorStop(1, '#1d2126');
  colour.ctx.fillStyle = base;
  colour.ctx.fillRect(0, 0, A.w, A.h);

  // 0.82 in linear terms: injection-moulded polymer is matte but not chalk.
  rough.ctx.fillStyle = '#d1d1d1';
  rough.ctx.fillRect(0, 0, A.w, A.h);

  bump.ctx.fillStyle = '#808080';
  bump.ctx.fillRect(0, 0, A.w, A.h);

  const grip = A.box(GRIP_ZONE.x0, GRIP_ZONE.y0, GRIP_ZONE.x1, GRIP_ZONE.y1);

  // --- stipple ------------------------------------------------------------
  // One seed, three passes. The dot that goes dark in colour goes rough in
  // roughness and raised in bump, so it lights like a bump and not like dirt.
  const stippleSeed = 20260214;
  stipple(colour.ctx, grip, {
    seed: stippleSeed, density: 0.0016, size: 3.0,
    core: 'rgba(52,58,66,0.85)', edge: 'rgba(12,14,17,0.0)',
  });
  stipple(rough.ctx, grip, {
    seed: stippleSeed, density: 0.0016, size: 3.0,
    core: 'rgba(255,255,255,0.55)', edge: 'rgba(255,255,255,0.0)',
  });
  stipple(bump.ctx, grip, {
    seed: stippleSeed, density: 0.0016, size: 3.0,
    core: 'rgba(255,255,255,0.95)', edge: 'rgba(128,128,128,0.0)',
  });

  // --- mould seams --------------------------------------------------------
  // A real frame has a parting line down the middle of the backstrap and a
  // pair of panel borders around the stipple. Drawn as 1-px darker lines with a
  // matching notch in bump, which is enough to catch a specular break.
  const seam = (x0, y0, x1, y1) => {
    const a = A.at(x0, y0);
    const b = A.at(x1, y1);
    [[colour.ctx, 'rgba(6,7,9,0.9)'], [bump.ctx, 'rgba(40,40,40,0.9)']].forEach(([ctx, ink]) => {
      ctx.strokeStyle = ink;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    });
  };
  seam(GRIP_ZONE.x0, GRIP_ZONE.y1, GRIP_ZONE.x1, GRIP_ZONE.y1);
  seam(GRIP_ZONE.x0, GRIP_ZONE.y0, GRIP_ZONE.x1, GRIP_ZONE.y0);

  // --- factory markings ---------------------------------------------------
  // Moulded-in, so they are the same colour as the frame and only visible as a
  // roughness change. 3.5 mm cap height, matching the real stamp.
  const mark = (text, x, y, cm, alpha = 0.5) => {
    const p = A.at(x, y);
    label(colour.ctx, text, { x: p.x, y: p.y, size: cm * PX_PER_CM, ink: '#3c434c', spacing: cm * PX_PER_CM * 0.14, alpha });
    label(rough.ctx, text, { x: p.x, y: p.y, size: cm * PX_PER_CM, ink: '#8a8a8a', spacing: cm * PX_PER_CM * 0.14 });
    label(bump.ctx, text, { x: p.x, y: p.y, size: cm * PX_PER_CM, ink: '#6a6a6a', spacing: cm * PX_PER_CM * 0.14 });
  };
  mark('18C  AUSTRIA', 11.4, -0.85, 0.30);
  mark('9x19', 3.10, -2.35, 0.26, 0.42);
  mark('GP 0413', 6.60, -11.55, 0.24, 0.40);

  edgeWear(colour.ctx, A, { seed: 5150, ink: '#4d545d' });
  toolMarks(colour.ctx, { x: 0, y: 0, w: A.w, h: A.h }, { seed: 771, count: 90, ink: '#6b737d', alpha: 0.05, length: 120 });

  return { colour: colour.element, rough: rough.element, bump: bump.element };
}

// ---------------------------------------------------------------------------
// Slide atlas
// ---------------------------------------------------------------------------

function slidePasses() {
  const A = atlasFor(UV_FRAMES.slide, PX_PER_CM);
  const colour = canvas(A.w, A.h);
  const rough = canvas(A.w, A.h);
  const bump = canvas(A.w, A.h);

  // Nitride is darker at the top where the light never reaches and slightly
  // grey along the bottom edge where it rubs the frame rails.
  const base = colour.ctx.createLinearGradient(0, 0, 0, A.h);
  base.addColorStop(0, '#1a1d21');
  base.addColorStop(0.45, PALETTE.slide);
  base.addColorStop(0.88, '#2b3036');
  base.addColorStop(1, '#3a4046');
  colour.ctx.fillStyle = base;
  colour.ctx.fillRect(0, 0, A.w, A.h);

  // 0.34 roughness: a nitrided slide is satin, not a mirror.
  rough.ctx.fillStyle = '#57575c';
  rough.ctx.fillRect(0, 0, A.w, A.h);

  bump.ctx.fillStyle = '#808080';
  bump.ctx.fillRect(0, 0, A.w, A.h);

  toolMarks(colour.ctx, { x: 0, y: 0, w: A.w, h: A.h }, { seed: 4242, count: 320, ink: '#8d959f', alpha: 0.045, length: 340 });
  toolMarks(rough.ctx, { x: 0, y: 0, w: A.w, h: A.h }, { seed: 4242, count: 320, ink: '#2f2f2f', alpha: 0.10, length: 340 });

  // Holster wear on the leading edges — the tell that this pistol is carried.
  edgeWear(colour.ctx, A, { seed: 909, ink: PALETTE.slideWear });
  edgeWear(rough.ctx, A, { seed: 909, ink: '#8f8f8f' });

  /**
   * Laser etch. Real slide roll marks are ~3 mm tall and only a shade lighter
   * than the finish; the legibility comes from the roughness break, which is why
   * the same text is drawn much brighter on the roughness pass.
   */
  const etch = (text, x, y, cm, { spacing = 0.16, weight = 600 } = {}) => {
    const p = A.at(x, y);
    const size = cm * PX_PER_CM;
    label(colour.ctx, text, { x: p.x, y: p.y, size, ink: '#4a5158', spacing: size * spacing, weight, alpha: 0.85 });
    label(rough.ctx, text, { x: p.x, y: p.y, size, ink: '#c8c8c8', spacing: size * spacing, weight });
    label(bump.ctx, text, { x: p.x, y: p.y, size, ink: '#5e5e5e', spacing: size * spacing, weight });
  };
  etch('GLOCK 18C', 6.10, 1.72, 0.34);
  etch('AUSTRIA  9x19', 6.10, 1.18, 0.22, { spacing: 0.20 });
  etch('SELECT FIRE', 13.40, 1.45, 0.20, { spacing: 0.24 });

  // Selector legend by the switch: the two positions, moulded not painted.
  const legend = A.at(2.05, 2.30);
  label(colour.ctx, '\u25CF  \u25CF\u25CF\u25CF', { x: legend.x, y: legend.y, size: 0.20 * PX_PER_CM, ink: '#454c53', spacing: 3 });
  label(rough.ctx, '\u25CF  \u25CF\u25CF\u25CF', { x: legend.x, y: legend.y, size: 0.20 * PX_PER_CM, ink: '#b4b4b4', spacing: 3 });

  return { colour: colour.element, rough: rough.element, bump: bump.element };
}

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

/**
 * A generated equirectangular studio, run through PMREM so the satin metals get
 * a correct blurred reflection instead of a mirror of a gradient.
 *
 * Deliberately neutral: one big overhead softbox, one long soft strip on each
 * flank, and a dark floor. Coloured rim lights were the single biggest reason
 * the first pass read as plastic — a black gun lit by cyan is a cyan gun.
 */
export function createEnvironment(renderer) {
  const { element, ctx } = canvas(1024, 512);

  const sky = ctx.createLinearGradient(0, 0, 0, 512);
  sky.addColorStop(0, '#9aa3ae');
  sky.addColorStop(0.40, '#3a3f46');
  sky.addColorStop(0.52, '#171a1e');
  sky.addColorStop(1, '#07080a');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 1024, 512);

  // Overhead softbox, slightly off-axis so the top of the slide has a gradient
  // running along it rather than one hot spot.
  const box = ctx.createRadialGradient(340, 40, 20, 340, 40, 300);
  box.addColorStop(0, '#ffffff');
  box.addColorStop(0.55, 'rgba(255,255,255,0.35)');
  box.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = box;
  ctx.fillRect(0, 0, 1024, 320);

  // Vertical strip lights: these are what draw the long specular streak down
  // the flank of the slide.
  const strip = (x, w, alpha) => {
    const g = ctx.createLinearGradient(x - w, 0, x + w, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.5, `rgba(238,242,248,${alpha})`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - w, 60, w * 2, 260);
  };
  strip(760, 90, 0.75);
  strip(150, 60, 0.35);

  const equirect = new THREE.CanvasTexture(element);
  equirect.mapping = THREE.EquirectangularReflectionMapping;
  equirect.colorSpace = THREE.SRGBColorSpace;

  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromEquirectangular(equirect).texture;
  pmrem.dispose();
  equirect.dispose();
  return env;
}

// ---------------------------------------------------------------------------
// Materials
// ---------------------------------------------------------------------------

/**
 * @returns {{materials: Object, maps: Object}} materials keyed by the ids used
 * in build-glock18.js.
 */
export function createMaterials() {
  const frame = framePasses();
  const slide = slidePasses();

  const frameMap = texture(frame.colour, { srgb: true });
  const frameRough = texture(frame.rough);
  const frameBump = texture(frame.bump);
  const slideMap = texture(slide.colour, { srgb: true });
  const slideRough = texture(slide.rough);
  const slideBump = texture(slide.bump);

  const materials = {
    polymer: new THREE.MeshStandardMaterial({
      name: 'polymer',
      map: frameMap,
      roughnessMap: frameRough,
      bumpMap: frameBump,
      bumpScale: 0.9,
      roughness: 1,
      metalness: 0.0,
      envMapIntensity: 0.55,
    }),

    slideShell: new THREE.MeshStandardMaterial({
      name: 'slideShell',
      map: slideMap,
      roughnessMap: slideRough,
      bumpMap: slideBump,
      bumpScale: 0.5,
      roughness: 1,
      metalness: 0.92,
      envMapIntensity: 1.1,
    }),

    // Magazine bodies are a different plastic than the frame: glass-filled, so
    // slightly glossier, and completely smooth — all the detail on a real one is
    // moulded relief, which is why this carries no map at all.
    magPolymer: new THREE.MeshStandardMaterial({
      name: 'magPolymer',
      color: '#262a30',
      roughness: 0.62,
      metalness: 0.02,
      envMapIntensity: 0.7,
    }),

    steelDark: new THREE.MeshStandardMaterial({
      name: 'steelDark',
      color: '#4b5158',
      roughness: 0.46,
      metalness: 1,
      envMapIntensity: 0.95,
    }),

    steelBright: new THREE.MeshStandardMaterial({
      name: 'steelBright',
      color: '#aeb6bf',
      roughness: 0.28,
      metalness: 1,
      envMapIntensity: 1.25,
    }),

    controls: new THREE.MeshStandardMaterial({
      name: 'controls',
      color: '#5c636b',
      roughness: 0.40,
      metalness: 1,
      envMapIntensity: 1.05,
    }),

    tritium: new THREE.MeshStandardMaterial({
      name: 'tritium',
      color: '#111511',
      emissive: new THREE.Color('#8fffcb'),
      emissiveIntensity: 1.6,
      roughness: 0.4,
      metalness: 0,
    }),

    follower: new THREE.MeshStandardMaterial({
      name: 'follower',
      color: '#c8571f',
      roughness: 0.62,
      metalness: 0.04,
    }),
  };

  return {
    materials,
    maps: { frameMap, frameRough, frameBump, slideMap, slideRough, slideBump },
  };
}

/** Human-readable material notes for the parts panel. */
export const MATERIAL_NOTES = {
  polymer: 'Polymer 2 · moulded stipple',
  magPolymer: 'Glass-filled polymer · smooth',
  slideShell: 'Nitrided steel · satin black',
  steelDark: 'Phosphated steel',
  steelBright: 'Polished steel',
  controls: 'Bare metal control — never coated',
  tritium: 'Tritium insert · emissive',
  follower: 'Hi-vis polymer',
};
