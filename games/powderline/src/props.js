// Everything that stands on the snow: pines, rocks, park furniture.
//
// Placement is a pure function of the cell coordinates, so props never pop in
// at a different place than they were, and no list of objects is ever stored
// for the whole (infinite) mountain. One instanced draw call per prop type.

import * as THREE from 'three';
import { sample, treeDensity, parkAt, runCenter, runWidth, PARK_PERIOD } from './worldfn.js';
import { hash2i, mulberry, clamp } from './noise.js';
import { getSeed } from './worldfn.js';
import { getGeneratedTextures, setTextureRepeat } from './generated-textures.js';

const CELL = 12;
const TREE_RADIUS = 168;
const ROCK_RADIUS = 150;
const MAX_TREES = 1500;
const MAX_ROCKS = 260;

function pineGeometry() {
  const parts = [];
  const trunk = new THREE.CylinderGeometry(0.16, 0.24, 1.5, 6, 1);
  trunk.translate(0, 0.75, 0);
  parts.push({ g: trunk, c: [0.28, 0.20, 0.15] });
  const tiers = [
    { y: 1.1, r: 1.5, h: 2.6 },
    { y: 2.6, r: 1.15, h: 2.3 },
    { y: 3.9, r: 0.78, h: 1.9 },
  ];
  for (const t of tiers) {
    const c = new THREE.ConeGeometry(t.r, t.h, 8, 1);
    c.translate(0, t.y + t.h * 0.5, 0);
    parts.push({ g: c, c: [0.10, 0.26, 0.19] });
  }
  // snow load on the branches: a squashed cone sitting on each tier
  for (const t of tiers) {
    const s = new THREE.ConeGeometry(t.r * 0.92, t.h * 0.42, 8, 1);
    s.translate(0, t.y + t.h * 0.72, 0);
    parts.push({ g: s, c: [0.96, 0.98, 1.0] });
  }
  return mergeColored(parts);
}

function rockGeometry() {
  const g = new THREE.IcosahedronGeometry(1, 1);
  const p = g.attributes.position;
  const rnd = mulberry(4242);
  for (let i = 0; i < p.count; i++) {
    const s = 0.62 + rnd() * 0.7;
    p.setXYZ(i, p.getX(i) * s * 1.25, p.getY(i) * s * 0.72, p.getZ(i) * s * 1.1);
  }
  g.computeVertexNormals();
  const colors = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const up = clamp(g.attributes.normal.getY(i), 0, 1);
    // snow settles on the up-facing faces only
    const t = up > 0.55 ? 1 : 0;
    colors[i * 3] = 0.30 + t * 0.66;
    colors[i * 3 + 1] = 0.31 + t * 0.67;
    colors[i * 3 + 2] = 0.34 + t * 0.66;
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return g;
}

function mergeColored(parts) {
  let vc = 0, ic = 0;
  for (const p of parts) {
    vc += p.g.attributes.position.count;
    ic += p.g.index ? p.g.index.count : p.g.attributes.position.count;
  }
  const pos = new Float32Array(vc * 3);
  const nrm = new Float32Array(vc * 3);
  const col = new Float32Array(vc * 3);
  const idx = new Uint16Array(ic);
  let vo = 0, io = 0;
  for (const p of parts) {
    const pp = p.g.attributes.position, pn = p.g.attributes.normal;
    for (let i = 0; i < pp.count; i++) {
      pos[(vo + i) * 3] = pp.getX(i);
      pos[(vo + i) * 3 + 1] = pp.getY(i);
      pos[(vo + i) * 3 + 2] = pp.getZ(i);
      nrm[(vo + i) * 3] = pn.getX(i);
      nrm[(vo + i) * 3 + 1] = pn.getY(i);
      nrm[(vo + i) * 3 + 2] = pn.getZ(i);
      col[(vo + i) * 3] = p.c[0];
      col[(vo + i) * 3 + 1] = p.c[1];
      col[(vo + i) * 3 + 2] = p.c[2];
    }
    const pi = p.g.index;
    for (let i = 0; i < (pi ? pi.count : pp.count); i++) {
      idx[io + i] = (pi ? pi.getX(i) : i) + vo;
    }
    vo += pp.count;
    io += pi ? pi.count : pp.count;
    p.g.dispose();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  return g;
}

export class Props {
  constructor(scene) {
    const textures = getGeneratedTextures();
    setTextureRepeat(textures.rockNormal, 3, 3);
    setTextureRepeat(textures.rockRoughness, 2.5, 2.5);
    const vcMat = new THREE.MeshStandardMaterial({
      vertexColors: true, roughness: 0.76, roughnessMap: textures.rockRoughness,
      normalMap: textures.rockNormal, normalScale: new THREE.Vector2(0.16, 0.16),
      metalness: 0.0, flatShading: false, envMapIntensity: 0.35,
    });
    this.trees = new THREE.InstancedMesh(pineGeometry(), vcMat, MAX_TREES);
    this.rocks = new THREE.InstancedMesh(rockGeometry(), vcMat, MAX_ROCKS);
    for (const m of [this.trees, this.rocks]) {
      m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      m.frustumCulled = false;
      m.castShadow = true;
      m.receiveShadow = false;
      scene.add(m);
    }
    this.park = new ParkProps(scene);
    this.features = new TrailFeatures(scene);
    this.hazards = [];         // {x,z,r,hard} within ~45 m of the rider
    this.last = { x: 1e9, z: 1e9 };
    this._m = new THREE.Matrix4();
    this._q = new THREE.Quaternion();
    this._s = new THREE.Vector3();
    this._p = new THREE.Vector3();
    this._treeColor = new THREE.Color();
    this._surf = {
      h: 0, groom: 0, tunnel: 0, park: 0, ice: 0, powder: 0, rail: 0, bank: 0, dist: 0,
    };
    this.quality = 1;
  }

  setQuality(q) { this.quality = q; }

  update(x, z, force = false) {
    if (!force && Math.abs(x - this.last.x) < 9 && Math.abs(z - this.last.z) < 9) {
      this.park.update(z);
      this.features.update(z);
      return;
    }
    this.last.x = x; this.last.z = z;
    const seed = getSeed();
    const ci = Math.round(x / CELL), cj = Math.round(z / CELL);
    const visibleRadius = TREE_RADIUS * (0.34 + 0.66 * this.quality);
    const span = Math.ceil(visibleRadius / CELL);
    let ti = 0, ri = 0;
    this.hazards.length = 0;

    for (let j = -span; j <= span; j++) {
      for (let i = -span; i <= span; i++) {
        const gx = (ci + i) * CELL, gz = (cj + j) * CELL;
        const dx = gx - x, dz = gz - z;
        const d2 = dx * dx + dz * dz;
        if (d2 > visibleRadius * visibleRadius) continue;

        const h1 = hash2i(ci + i, cj + j, seed + 7);
        const px = gx + (h1 - 0.5) * CELL * 1.6;
        const h2 = hash2i(ci + i, cj + j, seed + 13);
        const pz = gz + (h2 - 0.5) * CELL * 1.6;

        const s = sample(px, pz, this._surf);
        const dens = treeDensity(px, pz, s);
        const near = d2 < 45 * 45;

        if (dens > 0.02 && h1 < dens * 0.95 && ti < MAX_TREES) {
          const variety = hash2i(ci + i, cj + j, seed + 19);
          const sc = 0.58 + variety * 1.18;
          const slender = 0.72 + hash2i(ci + i, cj + j, seed + 23) * 0.72;
          this._p.set(px, s.h - 0.25, pz);
          this._q.setFromAxisAngle(UP, h2 * 6.28);
          this._s.set(sc * (0.84 + h1 * 0.22), sc * slender, sc * (0.84 + h2 * 0.22));
          this._m.compose(this._p, this._q, this._s);
          this.trees.setMatrixAt(ti, this._m);
          this._treeColor.setHSL(0.405 + variety * 0.035, 0.34 + h2 * 0.2, 0.25 + variety * 0.13);
          this.trees.setColorAt(ti++, this._treeColor);
          if (near) this.hazards.push({ x: px, z: pz, r: 0.55 + sc * 0.22, hard: true });
        }

        // rocks: on the rocky shoulders and in the gullies, never on the piste
        if (ri < MAX_ROCKS && d2 < ROCK_RADIUS * ROCK_RADIUS && s.groom < 0.08 && s.tunnel < 0.15) {
          const hr = hash2i(ci + i, cj + j, seed + 29);
          if (hr > 0.90) {
            const sc = 0.5 + hr * 1.7;
            this._p.set(px + 3.5, s.h - sc * 0.3, pz - 2.5);
            this._q.setFromAxisAngle(UP, hr * 12.0);
            this._s.set(sc, sc, sc);
            this._m.compose(this._p, this._q, this._s);
            this.rocks.setMatrixAt(ri++, this._m);
            if (near) this.hazards.push({ x: px + 3.5, z: pz - 2.5, r: sc * 0.75, hard: false });
          }
        }
      }
    }
    this.trees.count = ti;
    this.rocks.count = ri;
    this.trees.instanceMatrix.needsUpdate = true;
    if (this.trees.instanceColor) this.trees.instanceColor.needsUpdate = true;
    this.rocks.instanceMatrix.needsUpdate = true;
    this.park.update(z);
    this.features.update(z);
  }

  // Nearest hazard to (x,z), or null. Linear scan over a short local list.
  query(x, z) {
    let best = null, bestGap = 1e9;
    for (const list of [this.hazards, this.features.hazards]) {
      for (let i = 0; i < list.length; i++) {
        const h = list[i];
        const dx = x - h.x, dz = z - h.z;
        const d = Math.sqrt(dx * dx + dz * dz);
        const gap = d - h.r;
        if (gap < bestGap) { bestGap = gap; best = h; best.d = d; }
      }
    }
    return bestGap < 2.0 ? best : null;
  }

  queryKicker(x, z) { return this.features.queryKicker(x, z); }
}

const UP = new THREE.Vector3(0, 1, 0);

// Kickers and fallen logs, seeded per z-segment so they never move.
// Kickers are launch triggers for the trick system; logs are soft hazards.
const FEATURE_PERIOD = 150;

function kickerGeometry() {
  // Wedge: rises from the snow to a 1.15 m lip over 4.2 m.
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(4.2, 1.15);
  shape.lineTo(4.2, 0);
  shape.lineTo(0, 0);
  const g = new THREE.ExtrudeGeometry(shape, { depth: 3.6, bevelEnabled: false });
  g.rotateY(-Math.PI / 2);          // length along +z, lip at +z
  g.translate(1.8, -0.06, -2.1);    // center footprint, sink base into snow
  g.computeVertexNormals();
  return g;
}

class TrailFeatures extends THREE.Group {
  constructor(scene) {
    super();
    const snowMat = new THREE.MeshStandardMaterial({ color: 0xe8f2fc, roughness: 0.55 });
    this.kickers = new THREE.InstancedMesh(kickerGeometry(), snowMat, 12);
    this.kickers.frustumCulled = false;
    this.kickers.castShadow = true;
    this.add(this.kickers);

    // Red lip marker so the kicker reads from a distance.
    const lipGeo = new THREE.BoxGeometry(3.6, 0.1, 0.22);
    lipGeo.translate(0, 1.12, 2.0);
    this.lips = new THREE.InstancedMesh(lipGeo, new THREE.MeshStandardMaterial({ color: 0xff3b30, roughness: 0.5 }), 12);
    this.lips.frustumCulled = false;
    this.add(this.lips);

    const logGeo = new THREE.CylinderGeometry(0.3, 0.34, 6.5, 9, 1);
    logGeo.rotateZ(Math.PI / 2);   // lie across the run
    this.logs = new THREE.InstancedMesh(logGeo, new THREE.MeshStandardMaterial({ color: 0x5a4232, roughness: 0.85 }), 8);
    this.logs.frustumCulled = false;
    this.logs.castShadow = true;
    this.add(this.logs);

    scene.add(this);
    this.seg = -999;
    this.kickerList = [];   // {x,z} live launch zones near the rider
    this.hazards = [];      // logs as soft hazards
    this._m = new THREE.Matrix4();
    this._q = new THREE.Quaternion();
    this._s = new THREE.Vector3(1, 1, 1);
    this._p = new THREE.Vector3();
    this._surf = {
      h: 0, groom: 0, tunnel: 0, park: 0, ice: 0, powder: 0, rail: 0, bank: 0, dist: 0,
    };
  }

  update(z) {
    const seg = Math.floor(z / FEATURE_PERIOD);
    if (seg === this.seg) return;
    this.seg = seg;
    const seed = getSeed();
    let ki = 0, li = 0;
    this.kickerList.length = 0;
    this.hazards.length = 0;

    for (let s = seg - 1; s <= seg + 2; s++) {
      if (s < 1) continue;  // keep the spawn area clean
      const base = s * FEATURE_PERIOD;
      const hA = hash2i(s, 11, seed + 101);
      const hB = hash2i(s, 23, seed + 103);

      // one or two kickers per segment on the groomed run, skipping park
      // segments. Size is seeded per kicker: 0.7 = side pop, 1.9 = big sender.
      const slots = hB > 0.55 ? 2 : 1;
      for (let sl = 0; sl < slots && ki < 12; sl++) {
        const hK = hash2i(s, 37 + sl * 17, seed + 107);
        const kz = base + 40 + hA * 45 + sl * 62;
        if (parkAt(kz) < 0.3 && this._placeOnRun(kz, (hash2i(s, 41 + sl * 13, seed + 109) - 0.5) * 1.2)) {
          const size = 0.7 + hK * 1.2;
          const { x, y, pitch } = this._placed;
          this._p.set(x, y, kz);
          this._q.setFromAxisAngle(RIGHT, pitch);
          this._s.set(size, size, size);
          this._m.compose(this._p, this._q, this._s);
          this._s.set(1, 1, 1);
          this.kickers.setMatrixAt(ki, this._m);
          this.lips.setMatrixAt(ki, this._m);
          ki++;
          this.kickerList.push({ x, z: kz, size });
        }
      }

      // a fallen log on roughly every other segment
      if (hB > 0.45) {
        const lz = base + 15 + hA * 30;
        if (parkAt(lz) < 0.3 && this._placeOnRun(lz, (hA - 0.5) * 1.1)) {
          const { x, y } = this._placed;
          this._p.set(x, y + 0.22, lz);
          this._q.setFromAxisAngle(UP, (hA - 0.5) * 0.5);
          this._m.compose(this._p, this._q, this._s);
          this.logs.setMatrixAt(li++, this._m);
          // top: the log's crown sits ~0.56 m over the snow; clearing 0.75 m
          // (an ollie or any real air) sails over it with margin.
          this.hazards.push({ x, z: lz, r: 1.0, hard: false, top: 0.75 });
        }
      }
    }
    this.kickers.count = ki;
    this.lips.count = ki;
    this.logs.count = li;
    this.kickers.instanceMatrix.needsUpdate = true;
    this.lips.instanceMatrix.needsUpdate = true;
    this.logs.instanceMatrix.needsUpdate = true;
  }

  // Snap a feature to the groomed run surface; returns false off-piste.
  _placeOnRun(z, laneT) {
    const cx = runCenter(z);
    const x = cx + runWidth(z) * 1.45 * 0.5 * laneT;
    const s = sample(x, z, this._surf);
    if (s.groom < 0.35) return false;
    const hBack = sample(x, z - 2.1, this._surf).h;
    const hFront = sample(x, z + 2.1, this._surf).h;
    this._placed = { x, y: (hBack + hFront) * 0.5, pitch: Math.atan2(hBack - hFront, 4.2) };
    return true;
  }

  queryKicker(x, z) {
    for (let i = 0; i < this.kickerList.length; i++) {
      const k = this.kickerList[i];
      const s = k.size || 1;
      const dz = z - k.z;
      if (Math.abs(x - k.x) < 1.9 * s && dz > -2.0 * s && dz < 2.2 * s) return k;
    }
    return null;
  }
}

const RIGHT = new THREE.Vector3(1, 0, 0);

// Park furniture: rail tubes on the boxes, and marker flags at the entrance.
// The ramps themselves are part of the heightfield, not props.
class ParkProps extends THREE.Group {
  constructor(scene) {
    super();
    const steel = new THREE.MeshStandardMaterial({ color: 0xc9d3dd, roughness: 0.22, metalness: 0.85 });
    const railGeo = new THREE.CylinderGeometry(0.07, 0.07, 1, 8, 1);
    railGeo.rotateX(Math.PI / 2);
    this.rails = new THREE.InstancedMesh(railGeo, steel, 4);
    this.rails.frustumCulled = false;
    this.rails.castShadow = true;
    this.add(this.rails);

    const flagMat = new THREE.MeshStandardMaterial({ color: 0xff5d5d, roughness: 0.7, side: THREE.DoubleSide });
    const flagGeo = new THREE.PlaneGeometry(0.9, 0.6);
    flagGeo.translate(0.45, 1.55, 0);
    this.flags = new THREE.InstancedMesh(flagGeo, flagMat, 24);
    this.flags.frustumCulled = false;
    this.add(this.flags);
    const poleGeo = new THREE.CylinderGeometry(0.035, 0.035, 1.9, 5);
    poleGeo.translate(0, 0.95, 0);
    this.poles = new THREE.InstancedMesh(poleGeo, new THREE.MeshStandardMaterial({ color: 0x37474f, roughness: 0.6 }), 24);
    this.poles.frustumCulled = false;
    this.add(this.poles);

    scene.add(this);
    this.seg = -999;
    this._m = new THREE.Matrix4();
    this._surf = {
      h: 0, groom: 0, tunnel: 0, park: 0, ice: 0, powder: 0, rail: 0, bank: 0, dist: 0,
    };
  }

  update(z) {
    const seg = Math.floor((z + 200) / PARK_PERIOD);
    if (seg === this.seg) return;
    this.seg = seg;
    const base = seg * PARK_PERIOD;
    let ri = 0, fi = 0;
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3(1, 1, 1);
    const p = new THREE.Vector3();

    if (parkAt(base + 300) > 0) {
      const boxes = [
        { zl: 210, len: 24, lane: 1.0, h: 1.0 },
        { zl: 470, len: 30, lane: -0.55, h: 1.35 },
      ];
      for (const b of boxes) {
        const zc = base + b.zl + b.len * 0.5;
        const cx = runCenter(zc);
        const lane = runWidth(zc) * 1.45 * 0.42;
        const x = cx + lane * b.lane;
        const h = sample(x, zc, this._surf).h;
        p.set(x, h + 0.06, zc);
        s.set(1, 1, b.len);
        this._m.compose(p, q, s);
        this.rails.setMatrixAt(ri++, this._m);
      }
      // gates marking the park entrance and exit
      for (let k = 0; k < 10; k++) {
        const zc = base + 150 + k * 50;
        const cx = runCenter(zc);
        const w = runWidth(zc) * 1.45;
        for (const side of [-1, 1]) {
          if (fi >= 24) break;
          const x = cx + side * w * 0.78;
          const h = sample(x, zc, this._surf).h;
          p.set(x, h, zc);
          q.setFromAxisAngle(UP, side > 0 ? Math.PI : 0);
          s.set(1, 1, 1);
          this._m.compose(p, q, s);
          this.flags.setMatrixAt(fi, this._m);
          this.poles.setMatrixAt(fi, this._m);
          fi++;
        }
        q.identity();
      }
    }
    this.rails.count = ri;
    this.flags.count = fi;
    this.poles.count = fi;
    this.rails.instanceMatrix.needsUpdate = true;
    this.flags.instanceMatrix.needsUpdate = true;
    this.poles.instanceMatrix.needsUpdate = true;
    this.visible = ri > 0 || fi > 0;
  }
}
