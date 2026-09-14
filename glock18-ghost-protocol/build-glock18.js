/**
 * GLOCK-18C | GHOST PROTOCOL — procedural reconstruction.
 *
 * No mesh file is loaded. Every part below is solved from the numbers in SPEC:
 * extruded side profiles for anything with a silhouette, a revolved profile for
 * the barrel, swept helices for the springs, boxes and cylinders for hardware.
 *
 * Units are centimetres, one unit per centimetre, taken from the real pistol:
 *   overall length 18.6 · height 13.9 · width 3.0 · barrel 11.4 · sight radius 16.5
 *
 * Axes:  +X muzzle · +Y up · +Z shooter's right
 * Origin sits on the rail line at the rear face of the slide, so y = 0 is the
 * slide/frame parting line and every number below is readable off a side view.
 *
 * Part naming follows the pistol anatomy vocabulary, which also dictates the
 * material split: slide, frame and grip panels are painted; sights, controls and
 * trigger are bare metal and never carry the finish.
 */

import * as THREE from './vendor/three.module.js';
// The finish atlas and the geometry have to agree on where the paint lands, so
// there is exactly one definition of the projection frames and it lives next to
// the code that paints into it.
import { UV_FRAMES } from './skin.js';

export { UV_FRAMES };

export const SPEC = {
  overall: { length: 18.6, height: 13.9, width: 3.0 },

  slide: {
    x0: 0,
    x1: 18.6,
    railLine: 0,
    top: 2.55,
    halfWidth: 1.45,
    wallThickness: 0.30,
    channelCeiling: 1.75,
    ejectionPort: { x0: 7.2, x1: 9.9, sill: 0.55 },
    rearSerrations: { x0: 2.2, count: 9, pitch: 0.38, width: 0.14 },
    frontSerrations: { x0: 15.3, count: 5, pitch: 0.38, width: 0.14 },
    // Two slots through the roof, over the two barrel ports. This is the only
    // external difference between an 18C and an 18, and the loudest one.
    compensator: { slots: [15.95, 17.00], width: 0.45 },
  },

  barrel: {
    length: 11.4,
    breechX: 7.05,
    axisY: 1.05,
    chamberRadius: 0.72,
    outerRadius: 0.62,
    boreRadius: 0.45,
  },

  recoil: { axisY: 0.32, rodRadius: 0.13, springRadius: 0.30, springTurns: 11 },

  sights: { rearX: 1.30, frontX: 17.80, height: 0.50, notchWidth: 0.50 },

  frame: { halfWidth: 1.30, dustCoverFront: 13.90, dustCoverBottom: -1.55 },

  grip: { rakeDegrees: 22.8, bottom: -11.35 },

  // span is front-to-back: a 9x19 round is 2.97 cm long, so the box holding it
  // cannot be narrower than that. depth is the across-the-gun thickness of a
  // double-stack column.
  //
  // This is the 33-round stick from the reference photo, not the flush 17. It
  // hangs 8.6 cm below the magwell floor, which is why the pistol reads as an
  // 18C on sight: 33 rounds x 2.6 mm of stack pitch, plus the follower and the
  // baseplate, is the number that sets `bottom`.
  magazine: { span: 3.15, depth: 2.15, top: -1.40, bottom: -19.80, baseplate: -20.40, rounds: 33 },
};

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

const DEG = Math.PI / 180;

function shapeFrom(outline, holes = []) {
  const shape = new THREE.Shape(outline.map(([x, y]) => new THREE.Vector2(x, y)));
  holes.forEach((hole) => {
    shape.holes.push(new THREE.Path(hole.map(([x, y]) => new THREE.Vector2(x, y))));
  });
  return shape;
}

/**
 * Fillet a closed polyline.
 *
 * Nothing on a moulded polymer frame is a sharp corner, and sharp corners are
 * what made the first pass read as a cardboard cut-out: a hard vertex gives one
 * specular line, a filleted one gives a gradient the eye reads as thickness.
 *
 * Each point is [x, y, radius]. The radius is clamped to half the shorter of the
 * two adjoining segments, so an over-specified corner degrades to the tightest
 * fillet that still fits instead of turning the outline inside out.
 */
function filletShape(points, holes = []) {
  const path = (pts, target) => {
    const n = pts.length;
    const get = (i) => {
      const p = pts[(i + n) % n];
      return { v: new THREE.Vector2(p[0], p[1]), r: p[2] ?? 0 };
    };

    let started = false;
    for (let i = 0; i < n; i += 1) {
      const prev = get(i - 1).v;
      const { v: here, r } = get(i);
      const next = get(i + 1).v;

      const toPrev = prev.clone().sub(here);
      const toNext = next.clone().sub(here);
      const radius = Math.min(r, toPrev.length() / 2, toNext.length() / 2);

      if (radius <= 0.0001) {
        if (started) target.lineTo(here.x, here.y);
        else { target.moveTo(here.x, here.y); started = true; }
        continue;
      }

      const enter = here.clone().add(toPrev.normalize().multiplyScalar(radius));
      const exit = here.clone().add(toNext.normalize().multiplyScalar(radius));

      if (started) target.lineTo(enter.x, enter.y);
      else { target.moveTo(enter.x, enter.y); started = true; }
      // The corner itself is the control point, which is what makes the fillet
      // tangent to both segments without solving for an arc centre.
      target.quadraticCurveTo(here.x, here.y, exit.x, exit.y);
    }
    target.closePath();
    return target;
  };

  const shape = path(points, new THREE.Shape());
  holes.forEach((hole) => shape.holes.push(path(hole, new THREE.Path())));
  return shape;
}

/** Extrude a side profile across the gun's width, centred on Z. */
function extrudeAcross(shape, width, { bevel = 0.06, at = 0, curveSegments = 10 } = {}) {
  const depth = Math.max(0.01, width - bevel * 2);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    curveSegments,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 1,
  });
  geometry.translate(0, 0, at - depth / 2);
  return geometry;
}

/**
 * Extrude a cross-section along the barrel axis. The section is authored in
 * (z, y); the extrusion runs down +X, which is what the slide needs.
 */
function extrudeAlong(shape, length, { bevel = 0.05, x0 = 0, curveSegments = 10 } = {}) {
  const depth = Math.max(0.01, length - bevel * 2);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    curveSegments,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 1,
  });
  geometry.rotateY(Math.PI / 2);
  geometry.translate(x0 + bevel, 0, 0);
  return geometry;
}

function boxBetween([x0, y0, z0], [x1, y1, z1]) {
  const geometry = new THREE.BoxGeometry(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0));
  geometry.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  return geometry;
}

function cylinderX(x0, x1, radius, y, z = 0, segments = 20) {
  const geometry = new THREE.CylinderGeometry(radius, radius, Math.abs(x1 - x0), segments, 1);
  geometry.rotateZ(-Math.PI / 2);
  geometry.translate((x0 + x1) / 2, y, z);
  return geometry;
}

function cylinderZ(z0, z1, radius, x, y, segments = 16) {
  const geometry = new THREE.CylinderGeometry(radius, radius, Math.abs(z1 - z0), segments, 1);
  geometry.rotateX(Math.PI / 2);
  geometry.translate(x, y, (z0 + z1) / 2);
  return geometry;
}

/** A revolved profile, standing along +X instead of LatheGeometry's +Y. */
function revolveAlongX(profile, { x0, y, segments = 40 }) {
  const points = profile.map(([r, d]) => new THREE.Vector2(r, d));
  const geometry = new THREE.LatheGeometry(points, segments);
  geometry.rotateZ(-Math.PI / 2);
  geometry.translate(x0, y, 0);
  return geometry;
}

class Helix extends THREE.Curve {
  constructor(radius, length, turns) {
    super();
    this.radius = radius;
    this.length = length;
    this.turns = turns;
  }

  getPoint(t, target = new THREE.Vector3()) {
    const angle = t * this.turns * Math.PI * 2;
    return target.set(
      Math.cos(angle) * this.radius,
      Math.sin(angle) * this.radius,
      t * this.length,
    );
  }
}

/** A real swept coil, not a stack of tori. */
function spring({ radius, length, turns, wire = 0.075, radialSegments = 6 }) {
  const curve = new Helix(radius, length, turns);
  return new THREE.TubeGeometry(curve, Math.round(turns * 14), wire, radialSegments, false);
}

/**
 * Two-plane projected UVs against a fixed frame.
 *
 * Side faces are projected straight down Z, everything else down X. Both keep v
 * tied to real height, which is the whole point: the front strap picks up the
 * grip texture at the same height as the flank next to it, and the top of the
 * slide picks up slide colour instead of smearing the cerakote band across it.
 */
export function applyBoxUV(geometry, frame) {
  const position = geometry.getAttribute('position');
  const normal = geometry.getAttribute('normal');
  if (!position || !normal) return geometry;

  const [minX, minY, minZ] = frame.min;
  const [maxX, maxY, maxZ] = frame.max;
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;
  const spanZ = maxZ - minZ || 1;

  const uv = new Float32Array(position.count * 2);
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);
    const nx = Math.abs(normal.getX(i));
    const ny = Math.abs(normal.getY(i));
    const nz = Math.abs(normal.getZ(i));

    let u;
    const v = (y - minY) / spanY;
    if (nz >= nx && nz >= ny) {
      // Flanks. Mirror the left side so a stamped wordmark reads left-to-right
      // on both sides instead of backwards on one of them.
      u = (x - minX) / spanX;
      if (normal.getZ(i) < 0) u = 1 - u;
    } else {
      u = (z - minZ) / spanZ;
      if (normal.getX(i) > 0) u = 1 - u;
    }
    uv[i * 2] = u;
    uv[i * 2 + 1] = v;
  }
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return geometry;
}

function triangleCount(geometry) {
  const index = geometry.getIndex();
  const count = index ? index.count : geometry.getAttribute('position').count;
  return Math.round(count / 3);
}

// ---------------------------------------------------------------------------
// Profiles — the four silhouettes the whole pistol is cut from
// ---------------------------------------------------------------------------

/**
 * Slide cross-section, as [z, y, fillet radius]: an inverted U, walls 3 mm, roof
 * 8 mm. The 3.4 mm shoulder fillets are what give the slide its one long
 * specular streak instead of two flat facets meeting at a hard line.
 */
const SLIDE_SECTION = (() => {
  const hw = SPEC.slide.halfWidth;
  const wall = SPEC.slide.wallThickness;
  const ceiling = SPEC.slide.channelCeiling;
  const top = SPEC.slide.top;
  return [
    [-hw, ceiling, 0],
    [-hw, top - 0.40, 0.10],
    [-hw + 0.26, top, 0.34],
    [hw - 0.26, top, 0.34],
    [hw, top - 0.40, 0.10],
    [hw, ceiling, 0],
    [hw - wall, ceiling, 0],
    [hw - wall, ceiling - 0.02, 0],
    [-hw + wall, ceiling - 0.02, 0],
    [-hw + wall, ceiling, 0],
  ];
})();

/**
 * Frame silhouette, as [x, y, fillet radius].
 *
 * Read it from the tang: back of the beavertail, forward along the rail line to
 * the dust cover, down and back under the trigger guard, forward-and-down the
 * front strap, across the magwell floor, then up the backstrap.
 *
 * The radii are the whole point. A Glock frame has one hard edge on it — the
 * rail line where the slide sits — and the fillets here are sized off that: 1 mm
 * where the slide has to seat flat, 6-9 mm everywhere a hand touches.
 */
const FRAME_OUTLINE = [
  // tang / beavertail
  [0.10, 0.92, 0.30],
  [1.05, 0.26, 0.22],
  // rail line: flat, because the slide rides on it
  [2.30, 0.00, 0.06],
  [12.10, 0.00, 0.04],
  [13.95, 0.00, 0.16],
  // dust cover nose
  [14.00, -1.58, 0.20],
  [10.75, -1.60, 0.22],
  // trigger guard, outside
  [10.50, -2.10, 0.30],
  [9.75, -3.45, 0.45],
  [8.15, -4.05, 0.50],
  [6.60, -3.60, 0.35],
  [5.95, -2.55, 0.28],
  // front strap. The relief under the guard is where the middle finger sits;
  // without it the grip reads as a plain wedge.
  [6.40, -3.90, 0.55],
  [7.60, -6.30, 0.70],
  [8.60, -8.40, 0.70],
  [9.90, -10.55, 0.30],
  [10.30, -11.10, 0.35],
  // magwell floor
  [5.30, -11.20, 0.35],
  // backstrap, raked 22.8 degrees
  [4.70, -10.25, 0.55],
  [3.55, -8.05, 0.85],
  [2.30, -4.95, 0.85],
  [1.35, -2.30, 0.45],
  [0.55, -0.50, 0.30],
];

/** The trigger guard opening — a hole in the frame profile, not a bolted-on ring. */
const TRIGGER_GUARD_HOLE = [
  [6.20, -1.05, 0.22],
  [9.85, -1.05, 0.32],
  [9.70, -2.25, 0.40],
  [8.90, -3.15, 0.40],
  [7.70, -3.40, 0.45],
  [6.55, -2.85, 0.32],
  [6.15, -1.95, 0.28],
];

/** Trigger blade: a face curve with a flat back where the trigger bar pins on. */
const TRIGGER_OUTLINE = [
  [6.55, -1.25, 0.06],
  [7.05, -1.55, 0.10],
  [7.22, -2.15, 0.10],
  [7.05, -2.78, 0.10],
  [6.72, -3.05, 0.10],
  [6.42, -2.95, 0.08],
  [6.58, -2.30, 0.06],
  [6.50, -1.70, 0.06],
];

/**
 * Magazine side profile. Sampled in 14 steps down each wall rather than drawn as
 * a four-point parallelogram, because the walls are curved — a straight quad here
 * is what made the first version read as a ruler bolted to the grip.
 */
const MAG_OUTLINE = () => {
  const m = SPEC.magazine;
  const steps = 14;
  const front = [];
  const rear = [];
  for (let i = 0; i <= steps; i += 1) {
    const y = m.top + (m.bottom - m.top) * (i / steps);
    front.push([magRearAt(y) + m.span, y]);
    rear.push([magRearAt(y), y]);
  }
  return [...front, ...rear.reverse()];
};

/**
 * A rake-aligned band of the magazine: a height range, and a front-to-back span
 * measured from the rear wall. Everything inside the magazine is cut from this,
 * so no part can drift off the 22.8 degree axis.
 */
function magBand(yTop, yBottom, from = 0, to = SPEC.magazine.span) {
  return [
    [magRearAt(yTop) + from, yTop],
    [magRearAt(yTop) + to, yTop],
    [magRearAt(yBottom) + to, yBottom],
    [magRearAt(yBottom) + from, yBottom],
  ];
}

/**
 * Where the magazine's rear wall sits at a given height.
 *
 * Two terms. The linear one is the 22.8° grip rake, because the magazine has to
 * slide straight up the well. The quadratic one is the banana curve every long
 * Glock stick has: a 9x19 case is fatter at the base than the mouth, so a stack
 * of 33 of them cannot be straight — it bends forward, ~8 mm over 18 cm.
 *
 * Every magazine part is placed through this function, so the curve is defined
 * once and the body, ribs, floorplate and spring all inherit it.
 */
function magRearAt(y) {
  const drop = -1.70 - y;
  return 2.00 + drop * Math.tan(SPEC.grip.rakeDegrees * DEG) + drop * drop * 0.0023;
}

/**
 * The magazine's centreline as a point and a direction, so anything that lives
 * inside the tube (spring, follower, floorplate) can be placed by height alone
 * and stay on the rake instead of being nudged into place by hand.
 */
function magAxis(y) {
  const rake = SPEC.grip.rakeDegrees * DEG;
  return {
    x: magRearAt(y) + SPEC.magazine.span / 2,
    down: new THREE.Vector3(Math.sin(rake), -Math.cos(rake), 0),
  };
}

// ---------------------------------------------------------------------------
// Assembly
// ---------------------------------------------------------------------------

export const MODULES = [
  // Accents come off the Quadcode ramp, ordered the way the teardown runs, so a
  // reader can tell the disassembly order from the panel colours alone.
  { id: 'slide', label: 'Slide assembly', accent: '#FF9569' },
  { id: 'barrel', label: 'Barrel & recoil', accent: '#FFB454' },
  { id: 'frame', label: 'Frame & controls', accent: '#DD344D' },
  { id: 'fire', label: 'Fire control', accent: '#C9CEDA' },
  { id: 'magazine', label: 'Magazine', accent: '#7EE787' },
];

/**
 * Build the pistol.
 *
 * @param {Object} materials keyed by the material ids used below
 * @returns {{root: THREE.Group, parts: Array, modules: Array, stats: Object}}
 */
export function buildGlock18(materials) {
  const root = new THREE.Group();
  root.name = 'glock18-ghost-protocol';

  const parts = [];

  const add = (meta, geometries) => {
    const list = Array.isArray(geometries) ? geometries : [geometries];
    const group = new THREE.Group();
    group.name = meta.id;

    let triangles = 0;
    list.forEach((geometry) => {
      if (meta.uv) applyBoxUV(geometry, UV_FRAMES[meta.uv]);
      const mesh = new THREE.Mesh(geometry, materials[meta.material]);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
      triangles += triangleCount(geometry);
    });

    const entry = {
      id: meta.id,
      label: meta.label,
      module: meta.module,
      material: meta.material,
      note: meta.note || '',
      built: meta.built || '',
      triangles,
      pieces: list.length,
      explode: new THREE.Vector3(...(meta.explode || [0, 0, 0])),
      object: group,
    };
    group.userData.part = entry;
    root.add(group);
    parts.push(entry);
    return entry;
  };

  buildSlide(add);
  buildBarrelGroup(add);
  buildFrame(add);
  buildFireControl(add);
  buildMagazine(add);

  const stats = {
    parts: parts.length,
    triangles: parts.reduce((sum, part) => sum + part.triangles, 0),
    meshes: parts.reduce((sum, part) => sum + part.pieces, 0),
    modules: MODULES.length,
  };

  return { root, parts, modules: MODULES, stats };
}

// --- slide -----------------------------------------------------------------

function buildSlide(add) {
  const s = SPEC.slide;
  const hw = s.halfWidth;
  const wall = s.wallThickness;
  const port = s.ejectionPort;

  // The 18C's compensator is two transverse slots through the roof over the
  // ported barrel. They are gaps between three swept segments, not a boolean cut
  // — same trick as the ejection port, and it keeps the mesh manifold.
  const comp = s.compensator;
  const roofSpans = [
    [s.x0, comp.slots[0]],
    [comp.slots[0] + comp.width, comp.slots[1]],
    [comp.slots[1] + comp.width, s.x1],
  ];

  add({
    id: 'slideRoof',
    label: 'Slide',
    module: 'slide',
    material: 'slideShell',
    uv: 'slide',
    note: 'Inverted-U section swept in three spans. The two 4.5 mm gaps between them are the compensator slots — the C in 18C.',
    built: '3 x ExtrudeGeometry(section)',
    explode: [-1.2, 6.4, 0],
  }, roofSpans.map(([x0, x1]) => extrudeAlong(
    filletShape(SLIDE_SECTION), x1 - x0, { x0, bevel: 0.10, curveSegments: 5 },
  )));

  add({
    id: 'slideWallLeft',
    label: 'Slide wall, left',
    module: 'slide',
    material: 'slideShell',
    uv: 'slide',
    note: 'Unbroken side — the ejection port only exists on the right.',
    built: 'BoxGeometry',
    explode: [-1.2, 6.4, -0.6],
  }, boxBetween([s.x0 + 0.05, s.railLine, -hw], [s.x1 - 0.05, s.channelCeiling, -hw + wall]));

  add({
    id: 'slideWallRight',
    label: 'Slide wall, right + ejection port',
    module: 'slide',
    material: 'slideShell',
    uv: 'slide',
    note: 'Three segments. The 2.7 cm gap between them, cut down to a 5.5 mm sill, is the ejection port.',
    built: '3 x BoxGeometry',
    explode: [-1.2, 6.4, 0.6],
  }, [
    boxBetween([s.x0 + 0.05, s.railLine, hw - wall], [port.x0, s.channelCeiling, hw]),
    boxBetween([port.x0, s.railLine, hw - wall], [port.x1, port.sill, hw]),
    boxBetween([port.x1, s.railLine, hw - wall], [s.x1 - 0.05, s.channelCeiling, hw]),
  ]);

  const serrations = (bank) => {
    const out = [];
    for (let i = 0; i < bank.count; i += 1) {
      const x = bank.x0 + i * bank.pitch;
      out.push(boxBetween([x, 0.35, -hw - 0.04], [x + bank.width, s.top - 0.55, -hw + 0.06]));
      out.push(boxBetween([x, 0.35, hw - 0.06], [x + bank.width, s.top - 0.55, hw + 0.04]));
    }
    return out;
  };

  add({
    id: 'rearSerrations',
    label: 'Rear cocking serrations',
    module: 'slide',
    material: 'slideShell',
    uv: 'slide',
    note: '9 ribs per side on a 3.8 mm pitch — the grip surface for racking the slide.',
    built: '18 x BoxGeometry',
    explode: [-1.2, 6.4, 0],
  }, serrations(s.rearSerrations));

  add({
    id: 'frontSerrations',
    label: 'Front cocking serrations',
    module: 'slide',
    material: 'slideShell',
    uv: 'slide',
    note: 'Shorter front bank, used for a press check.',
    built: '10 x BoxGeometry',
    explode: [-1.2, 6.4, 0],
  }, serrations(s.frontSerrations));

  add({
    id: 'breechBlock',
    label: 'Breech block',
    module: 'slide',
    material: 'steelDark',
    note: 'Fills the rear 6 cm of the slide, which is exactly the length the 11.4 cm barrel leaves over.',
    built: 'BoxGeometry',
    explode: [-1.2, 6.4, 0],
  }, boxBetween([0.95, 0.40, -1.12], [SPEC.barrel.breechX, s.channelCeiling, 1.12]));

  add({
    id: 'breechFace',
    label: 'Breech face',
    module: 'slide',
    material: 'steelBright',
    note: 'The 1.5 mm plate the cartridge head bears against, sitting flush with the chamber mouth.',
    built: 'BoxGeometry',
    explode: [-1.2, 6.4, 0],
  }, boxBetween([SPEC.barrel.breechX - 0.15, 0.45, -0.92], [SPEC.barrel.breechX, 1.72, 0.92]));

  add({
    id: 'extractor',
    label: 'Extractor',
    module: 'slide',
    material: 'steelBright',
    note: 'Sits on the rear edge of the ejection port, which is where it has to be to hook a case rim.',
    built: 'BoxGeometry',
    explode: [-1.2, 6.4, 1.2],
  }, boxBetween([6.45, 1.00, 0.95], [7.45, 1.48, 1.20]));

  add({
    id: 'slideBackPlate',
    label: 'Slide cover plate',
    module: 'slide',
    material: 'steelDark',
    note: 'The rear plate that traps the striker channel.',
    built: 'BoxGeometry',
    explode: [-4.4, 6.4, 0],
  }, boxBetween([0.20, 0.30, -1.14], [0.55, s.channelCeiling, 1.14]));

  add({
    id: 'striker',
    label: 'Striker',
    module: 'slide',
    material: 'steelBright',
    note: 'On the bore line, 1.3 mm body with a collar — this is a striker-fired pistol, there is no hammer.',
    built: '2 x CylinderGeometry',
    explode: [-6.5, 6.4, 0],
  }, [
    cylinderX(1.10, SPEC.barrel.breechX - 0.18, 0.13, SPEC.barrel.axisY),
    cylinderX(2.05, 2.35, 0.30, SPEC.barrel.axisY),
  ]);

  const strikerSpring = spring({ radius: 0.24, length: 2.6, turns: 9, wire: 0.055 });
  strikerSpring.rotateY(Math.PI / 2);
  strikerSpring.translate(2.4, SPEC.barrel.axisY, 0);
  add({
    id: 'strikerSpring',
    label: 'Striker spring',
    module: 'slide',
    material: 'steelBright',
    note: 'A swept helix, 9 turns of 1.1 mm wire — not a stack of tori.',
    built: 'TubeGeometry(Helix)',
    explode: [-6.5, 6.4, 0],
  }, strikerSpring);

  const notch = SPEC.sights.notchWidth / 2;
  add({
    id: 'rearSight',
    label: 'Rear sight',
    module: 'slide',
    material: 'controls',
    note: 'Two blocks with a 5 mm gap. The gap is the notch — the sight picture is geometry, not a decal.',
    built: '2 x BoxGeometry',
    explode: [0, 9.5, 0],
  }, [
    boxBetween([SPEC.sights.rearX - 0.5, s.top, notch], [SPEC.sights.rearX + 0.5, s.top + SPEC.sights.height, 1.05]),
    boxBetween([SPEC.sights.rearX - 0.5, s.top, -1.05], [SPEC.sights.rearX + 0.5, s.top + SPEC.sights.height, -notch]),
  ]);

  add({
    id: 'frontSight',
    label: 'Front sight',
    module: 'slide',
    material: 'controls',
    note: 'Placed at x 17.8 so the sight radius comes out at the catalogue 16.5 cm.',
    built: 'BoxGeometry',
    explode: [0, 9.5, 0],
  }, boxBetween(
    [SPEC.sights.frontX - 0.22, s.top, -0.20],
    [SPEC.sights.frontX + 0.22, s.top + SPEC.sights.height, 0.20],
  ));

  const dot = (x, z) => {
    const geometry = new THREE.SphereGeometry(0.09, 12, 8);
    geometry.translate(x, s.top + SPEC.sights.height * 0.55, z);
    return geometry;
  };
  add({
    id: 'sightDots',
    label: 'Tritium dots',
    module: 'slide',
    material: 'tritium',
    note: 'Three-dot layout: one front, two flanking the rear notch.',
    built: '3 x SphereGeometry',
    explode: [0, 9.5, 0],
  }, [dot(SPEC.sights.frontX, 0), dot(SPEC.sights.rearX, 0.72), dot(SPEC.sights.rearX, -0.72)]);

  add({
    id: 'selectorSwitch',
    label: 'Fire selector switch',
    module: 'slide',
    material: 'controls',
    note: 'The part that makes this an 18C and not a 17: the burst selector on the left rear of the slide.',
    built: '2 x BoxGeometry',
    explode: [-1.2, 6.4, -2.2],
  }, [
    boxBetween([1.30, 1.35, -hw - 0.28], [2.75, 2.10, -hw - 0.04]),
    boxBetween([2.30, 1.55, -hw - 0.42], [2.75, 1.95, -hw - 0.28]),
  ]);
}

// --- barrel and recoil assembly --------------------------------------------

function buildBarrelGroup(add) {
  const b = SPEC.barrel;

  /**
   * Barrel profile, revolved. Outer surface from breech to muzzle, then the bore
   * comes back the other way, so the wall has two sides and the muzzle reads as
   * a crowned ring you can look down.
   */
  const profile = [
    [b.chamberRadius, 0.00],
    [b.chamberRadius, 2.30],
    [b.outerRadius, 2.75],
    [b.outerRadius, b.length - 0.28],
    [b.outerRadius - 0.04, b.length],
    [b.boreRadius, b.length],
    [b.boreRadius, 2.60],
    [b.boreRadius, 0.00],
  ];

  add({
    id: 'barrel',
    label: 'Barrel',
    module: 'barrel',
    material: 'steelBright',
    note: '11.4 cm revolved profile with a chamber swell and an open 9 mm bore. 40 radial segments.',
    built: 'LatheGeometry(8-point profile)',
    explode: [2.6, 4.2, 0],
  }, revolveAlongX(profile, { x0: b.breechX, y: b.axisY, segments: 40 }));

  add({
    id: 'barrelHood',
    label: 'Barrel hood',
    module: 'barrel',
    material: 'steelDark',
    note: 'Squared shelf over the chamber that locks into the breech.',
    built: 'BoxGeometry',
    explode: [2.6, 4.2, 0],
  }, boxBetween([b.breechX, b.axisY, -0.62], [b.breechX + 1.55, 1.72, 0.62]));

  add({
    id: 'lockingLug',
    label: 'Locking lug',
    module: 'barrel',
    material: 'steelDark',
    note: 'Drops into the frame\'s locking block; this is what times unlocking.',
    built: 'BoxGeometry',
    explode: [2.6, 4.2, 0],
  }, boxBetween([8.70, 0.08, -0.46], [10.30, 0.58, 0.46]));

  add({
    id: 'recoilRod',
    label: 'Recoil spring guide rod',
    module: 'barrel',
    material: 'steelBright',
    note: 'Runs under the barrel to the muzzle end of the slide, with the bearing cup at the front.',
    built: 'CylinderGeometry + CylinderGeometry',
    explode: [2.6, -3.4, 0],
  }, [
    cylinderX(9.20, 18.05, SPEC.recoil.rodRadius, SPEC.recoil.axisY),
    cylinderX(17.85, 18.20, 0.34, SPEC.recoil.axisY),
  ]);

  const coil = spring({
    radius: SPEC.recoil.springRadius,
    length: 5.4,
    turns: SPEC.recoil.springTurns,
    wire: 0.08,
  });
  coil.rotateY(Math.PI / 2);
  coil.translate(11.9, SPEC.recoil.axisY, 0);
  add({
    id: 'recoilSpring',
    label: 'Recoil spring',
    module: 'barrel',
    material: 'steelBright',
    note: '11 turns swept along a helix over 5.4 cm, captive on the guide rod.',
    built: 'TubeGeometry(Helix)',
    explode: [2.6, -3.4, 0],
  }, coil);
}

// --- frame and controls ----------------------------------------------------

function buildFrame(add) {
  const f = SPEC.frame;

  add({
    id: 'frame',
    label: 'Frame / receiver',
    module: 'frame',
    material: 'polymer',
    uv: 'frame',
    note: 'One filleted silhouette. The trigger guard is a hole in that silhouette, so it can never float free of the frame.',
    built: 'ExtrudeGeometry(23-point filleted outline, 1 hole)',
    explode: [0, 0, 0],
  }, extrudeAcross(
    filletShape(FRAME_OUTLINE, [TRIGGER_GUARD_HOLE]),
    f.halfWidth * 2,
    { bevel: 0.16, curveSegments: 5 },
  ));

  // Follows the raked grip, held ~4 mm inside the silhouette on every edge so it
  // reads as a moulded panel rather than a sticker that overhangs the frame.
  const gripPanel = [
    [2.85, -4.85, 0.35],
    [6.45, -4.85, 0.35],
    [9.35, -10.30, 0.30],
    [5.15, -10.30, 0.30],
  ];
  [['gripPanelLeft', -1], ['gripPanelRight', 1]].forEach(([id, side]) => {
    add({
      id,
      label: `Grip panel, ${side < 0 ? 'left' : 'right'}`,
      module: 'frame',
      material: 'polymer',
      uv: 'frame',
      note: 'Raised 1.4 mm off the frame side so the stipple catches light at a different angle than the flat panel.',
      built: 'ExtrudeGeometry',
      explode: [0, -0.6, side * 3.2],
      // Seated 0.2 mm proud of the frame flank, not floating next to it — a
      // visible air gap here was the loudest tell that this was a set of slabs.
    }, extrudeAcross(filletShape(gripPanel), 0.16, { bevel: 0.03, at: side * (f.halfWidth + 0.03) }));
  });

  add({
    id: 'accessoryRail',
    label: 'Accessory rail',
    module: 'frame',
    material: 'polymer',
    uv: 'frame',
    note: 'Picatinny stub under the dust cover: one bar plus three cross slots.',
    built: '4 x BoxGeometry',
    explode: [0.8, -4.0, 0],
  }, [
    boxBetween([10.90, f.dustCoverBottom - 0.42, -0.58], [13.80, f.dustCoverBottom, 0.58]),
    boxBetween([11.35, f.dustCoverBottom - 0.46, -0.62], [11.55, f.dustCoverBottom - 0.10, 0.62]),
    boxBetween([12.20, f.dustCoverBottom - 0.46, -0.62], [12.40, f.dustCoverBottom - 0.10, 0.62]),
    boxBetween([13.05, f.dustCoverBottom - 0.46, -0.62], [13.25, f.dustCoverBottom - 0.10, 0.62]),
  ]);

  [['frameRailLeft', -1], ['frameRailRight', 1]].forEach(([id, side]) => {
    add({
      id,
      label: `Frame rail, ${side < 0 ? 'left' : 'right'}`,
      module: 'frame',
      material: 'steelDark',
      note: 'The only steel in the lower: a 1.8 mm strip the slide actually rides on.',
      built: 'BoxGeometry',
      explode: [0, 1.8, side * 1.0],
    }, boxBetween([1.00, 0.02, side * 0.92], [11.60, 0.38, side * 1.10]));
  });

  add({
    id: 'slideStop',
    label: 'Slide stop lever',
    module: 'frame',
    material: 'controls',
    note: 'Bare metal, left side, ahead of the trigger. Unpainted by convention — controls never take the finish.',
    built: '2 x BoxGeometry',
    explode: [0, 0, -3.4],
  }, [
    boxBetween([9.55, -0.52, -f.halfWidth - 0.20], [11.40, -0.14, -f.halfWidth]),
    boxBetween([9.55, -0.66, -f.halfWidth - 0.34], [10.35, -0.14, -f.halfWidth - 0.20]),
  ]);

  add({
    id: 'magRelease',
    label: 'Magazine release',
    module: 'frame',
    material: 'controls',
    note: 'Thumb pad on the left of the grip, level with the top of the magazine catch cut.',
    built: 'BoxGeometry',
    explode: [0, 0, -3.4],
  }, boxBetween([5.35, -3.45, -f.halfWidth - 0.22], [6.05, -2.55, -f.halfWidth]));

  add({
    id: 'takedownPin',
    label: 'Locking block pin',
    module: 'frame',
    material: 'steelDark',
    note: 'Cross pin through the frame above the trigger guard.',
    built: 'CylinderGeometry',
    explode: [0, 2.4, 2.6],
  }, cylinderZ(-f.halfWidth - 0.06, f.halfWidth + 0.06, 0.16, 10.20, -0.62));

  add({
    id: 'housingPin',
    label: 'Trigger housing pin',
    module: 'frame',
    material: 'steelDark',
    note: 'Rear cross pin; pull this one and the fire control drops out.',
    built: 'CylinderGeometry',
    explode: [0, 2.4, -2.6],
  }, cylinderZ(-f.halfWidth - 0.06, f.halfWidth + 0.06, 0.15, 4.55, -1.85));
}

// --- fire control ----------------------------------------------------------

function buildFireControl(add) {
  add({
    id: 'trigger',
    label: 'Trigger',
    module: 'fire',
    material: 'controls',
    note: 'Extruded blade profile sitting inside the guard opening — both come from the same coordinate space, so it cannot clip through.',
    built: 'ExtrudeGeometry(8-point outline)',
    explode: [1.4, -5.2, 0],
  }, extrudeAcross(filletShape(TRIGGER_OUTLINE), 0.56, { bevel: 0.05, curveSegments: 6 }));

  add({
    id: 'safetyBlade',
    label: 'Trigger safety blade',
    module: 'fire',
    material: 'controls',
    note: 'The split centre tab. Two millimetres wide, and the reason a dropped Glock does not fire.',
    built: 'BoxGeometry',
    explode: [1.4, -5.2, 0],
  }, boxBetween([6.86, -2.90, -0.11], [7.16, -1.58, 0.11]));

  add({
    id: 'triggerBar',
    label: 'Trigger bar',
    module: 'fire',
    material: 'steelBright',
    note: 'Runs back along the right side of the frame interior to the connector.',
    built: '3 x BoxGeometry',
    explode: [1.4, -5.2, 0.8],
  }, [
    boxBetween([6.40, -1.42, 0.30], [6.70, -1.16, 0.48]),
    boxBetween([3.60, -1.34, 0.30], [6.60, -1.14, 0.48]),
    boxBetween([3.60, -1.34, 0.30], [3.85, -0.62, 0.48]),
  ]);

  add({
    id: 'connector',
    label: 'Connector',
    module: 'fire',
    material: 'steelBright',
    note: 'The angled leaf that releases the striker. Its angle is the trigger pull weight.',
    built: '2 x BoxGeometry',
    explode: [1.4, -5.2, 0.8],
  }, [
    boxBetween([2.85, -1.30, 0.26], [3.70, -1.14, 0.44]),
    boxBetween([2.85, -1.14, 0.26], [3.05, -0.55, 0.44]),
  ]);

  add({
    id: 'triggerPin',
    label: 'Trigger pin',
    module: 'fire',
    material: 'steelDark',
    note: 'The pivot the whole blade swings on.',
    built: 'CylinderGeometry',
    explode: [1.4, -5.2, 0],
  }, cylinderZ(-0.62, 0.62, 0.14, 6.62, -1.30));
}

// --- magazine --------------------------------------------------------------

function buildMagazine(add) {
  const m = SPEC.magazine;

  // Everything on the magazine explodes down its own axis rather than straight
  // down, so an 18 cm stick slides out of the well instead of shearing through
  // the front strap on the way.
  const drop = magAxis(m.top).down.clone().multiplyScalar(7.5).toArray();

  add({
    id: 'magBody',
    label: 'Magazine body · 33 rd',
    module: 'magazine',
    material: 'magPolymer',
    note: 'A parallelogram in side view because the grip is raked 22.8 degrees and the magazine has to slide straight up it. 18.4 cm of it, because this is the extended stick.',
    built: 'ExtrudeGeometry(parallelogram)',
    explode: drop,
  }, extrudeAcross(shapeFrom(MAG_OUTLINE()), m.depth, { bevel: 0.08 }));

  add({
    id: 'magFeedLips',
    label: 'Feed lips',
    module: 'magazine',
    material: 'steelDark',
    note: 'Rear and front lips standing 8 mm above the body, 5.5 mm each, holding the next round on the feed line.',
    built: '2 x ExtrudeGeometry',
    explode: drop,
  }, [
    extrudeAcross(shapeFrom(magBand(-0.62, m.top, 0, 0.55)), m.depth, { bevel: 0.04 }),
    extrudeAcross(shapeFrom(magBand(-0.62, m.top, m.span - 0.55, m.span)), m.depth, { bevel: 0.04 }),
  ]);

  add({
    id: 'follower',
    label: 'Follower',
    module: 'magazine',
    material: 'follower',
    note: 'The orange platform the spring pushes. Parked at the lips because this magazine is modelled empty — a loaded one would hide 18 cm of spring.',
    built: 'ExtrudeGeometry',
    explode: drop,
  }, extrudeAcross(shapeFrom(magBand(-1.95, -2.55, 0.15, m.span - 0.15)), m.depth - 0.3, { bevel: 0.04 }));

  /**
   * Spring: a helix aligned to the chord of the curved magazine tube, sized from
   * the tube itself rather than typed in, so changing the round count moves the
   * spring with it.
   */
  const springTop = -2.70;
  const springFoot = m.bottom - 0.25;
  const head = new THREE.Vector3(magAxis(springTop).x, springTop, 0);
  const foot = new THREE.Vector3(magAxis(springFoot).x, springFoot, 0);
  const chord = foot.clone().sub(head);
  const springLength = chord.length();

  const magSpring = spring({
    radius: 0.72, length: springLength, turns: 22, wire: 0.07, radialSegments: 5,
  });
  // Aligning to the chord instead of the rake keeps the coils inside a curved
  // tube: the worst-case deviation is a quarter of the 8 mm bow, ~2 mm, well
  // inside the 8 mm of clearance the body has on either side of the spring.
  magSpring.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 0, 1), chord.normalize(),
  ));
  magSpring.translate(head.x, head.y, head.z);
  add({
    id: 'magSpring',
    label: 'Magazine spring',
    module: 'magazine',
    material: 'steelBright',
    note: '22 turns over 16.6 cm, swept along the same rake as the body. Only visible once you explode or isolate the magazine.',
    built: 'TubeGeometry(Helix)',
    explode: drop,
  }, magSpring);

  add({
    id: 'magBaseplate',
    label: 'Magazine floorplate',
    module: 'magazine',
    material: 'magPolymer',
    note: 'Wraps 2 mm proud of the body on all four sides — the ledge you hit to strip a stuck magazine.',
    built: 'ExtrudeGeometry',
    explode: drop,
  }, extrudeAcross(shapeFrom(magBand(m.bottom + 0.10, m.baseplate, -0.20, m.span + 0.20)), m.depth + 0.34, { bevel: 0.06 }));

  /**
   * Witness ribs. On a real magazine the rib and the round-count hole share a
   * pitch, because both are indexed off the stack: one rib per two rounds. 33
   * rounds at 2.6 mm of stack pitch is where the 1.9 cm spacing comes from.
   */
  const ribs = [];
  const ribPitch = 1.90;
  for (let y = -3.70; y > m.bottom + 0.6; y -= ribPitch) {
    ribs.push(extrudeAcross(
      shapeFrom(magBand(y, y - 0.20, 0.28, m.span - 0.28)),
      m.depth + 0.12,
      { bevel: 0.02 },
    ));
  }
  add({
    id: 'magRibs',
    label: 'Witness ribs',
    module: 'magazine',
    material: 'magPolymer',
    note: `${ribs.length} stiffening ribs on a 1.9 cm pitch — one per two rounds in the stack, same as the witness holes on a factory magazine.`,
    built: `${ribs.length} x ExtrudeGeometry`,
    explode: drop,
  }, ribs);
}
