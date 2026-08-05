// Three concentric heightfield rings, re-centred on the rider.
//
// Two decisions that make this cheap and seam-free:
//  1. All levels share one snapped origin (12 m grid), so ring boundaries always
//     line up on the coarse lattice.
//  2. A fine level's outer ring of vertices is linearly interpolated on the next
//     coarser lattice. The join is then mathematically watertight - no skirts,
//     no cracks, no popping.
//
// Rebuilds are double-buffered and spread over frames with a row budget, so
// travelling never costs a frame spike.

import * as THREE from 'three';
import { sample } from './worldfn.js';
import { getGeneratedTextures, setTextureRepeat } from './generated-textures.js';

export const SNAP = 12;

const WHITE_TRACK = new THREE.DataTexture(new Uint8Array([255]), 1, 1, THREE.RedFormat);
WHITE_TRACK.needsUpdate = true;

const LEVELS = [
  // Dense enough that rollers cast real silhouettes close to the board. The
  // old 1.5 m grid made every landing look melted even when the field was rich.
  { cell: 1.5, half: 60, hole: 0 },
  { cell: 4.0, half: 180, hole: 60 },
  { cell: 12.0, half: 528, hole: 180 },
];

function buildIndex(n, cell, half, hole) {
  const holeCells = hole > 0 ? hole / cell : 0;
  const mid = n / 2;
  const idx = [];
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      if (holeCells > 0) {
        const inHoleI = i >= mid - holeCells && i < mid + holeCells;
        const inHoleJ = j >= mid - holeCells && j < mid + holeCells;
        if (inHoleI && inHoleJ) continue;
      }
      const a = j * (n + 1) + i;
      const b = a + 1;
      const c = a + (n + 1);
      const d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  }
  return new (n > 180 ? Uint32Array : Uint32Array)(idx);
}

class Level {
  constructor(spec, material, coarserCell) {
    this.cell = spec.cell;
    this.half = spec.half;
    this.n = Math.round((spec.half * 2) / spec.cell);
    this.coarserCell = coarserCell; // for watertight outer edge, 0 = none
    this.vcount = (this.n + 1) * (this.n + 1);
    this.index = buildIndex(this.n, spec.cell, spec.half, spec.hole);
    this.heights = new Float32Array(this.vcount);
    this.buffers = [this.makeGeometry(material), this.makeGeometry(material)];
    this.active = 0;
    this.buffers[1].mesh.visible = false;
    this.origin = { x: NaN, z: NaN };
    this.job = null;
  }

  makeGeometry(material) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(this.vcount * 3), 3));
    g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(this.vcount * 3), 3));
    const uv = new Float32Array(this.vcount * 2);
    for (let j = 0; j <= this.n; j++) for (let i = 0; i <= this.n; i++) {
      const k = j * (this.n + 1) + i;
      uv[k * 2] = i / this.n;
      uv[k * 2 + 1] = j / this.n;
    }
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    g.setAttribute('asurf', new THREE.BufferAttribute(new Float32Array(this.vcount * 4), 4));
    g.setIndex(new THREE.BufferAttribute(this.index, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), this.half * 2.2);
    const mesh = new THREE.Mesh(g, material);
    mesh.frustumCulled = false;
    mesh.matrixAutoUpdate = false;
    mesh.receiveShadow = true;
    mesh.castShadow = false;
    return { geometry: g, mesh };
  }

  get meshes() { return [this.buffers[0].mesh, this.buffers[1].mesh]; }

  startJob(ox, oz) {
    this.job = { ox, oz, row: 0, target: 1 - this.active };
  }

  // Height on the boundary line, interpolated on the coarser lattice.
  edgeHeight(x, z, alongX, surf) {
    const cc = this.coarserCell;
    if (!cc) return sample(x, z, surf).h;
    if (alongX) {
      const x0 = Math.floor(x / cc) * cc;
      const t = (x - x0) / cc;
      if (t < 1e-6) return sample(x, z, surf).h;
      const a = sample(x0, z, surf).h;
      const b = sample(x0 + cc, z, surf).h;
      sample(x, z, surf); // surface flags stay local to the vertex
      return a + (b - a) * t;
    }
    const z0 = Math.floor(z / cc) * cc;
    const t = (z - z0) / cc;
    if (t < 1e-6) return sample(x, z, surf).h;
    const a = sample(x, z0, surf).h;
    const b = sample(x, z0 + cc, surf).h;
    sample(x, z, surf);
    return a + (b - a) * t;
  }

  // Fill rows [row, row+count). Returns true when the job is finished.
  step(count, surf) {
    const job = this.job;
    if (!job) return true;
    const { n, cell, half } = this;
    const buf = this.buffers[job.target];
    const pos = buf.geometry.attributes.position.array;
    const asf = buf.geometry.attributes.asurf.array;
    const end = Math.min(n + 1, job.row + count);
    for (let j = job.row; j < end; j++) {
      const z = job.oz - half + j * cell;
      const edgeJ = j === 0 || j === n;
      for (let i = 0; i <= n; i++) {
        const x = job.ox - half + i * cell;
        const edgeI = i === 0 || i === n;
        let h;
        if (edgeJ) h = this.edgeHeight(x, z, true, surf);
        else if (edgeI) h = this.edgeHeight(x, z, false, surf);
        else h = sample(x, z, surf).h;
        const k = j * (n + 1) + i;
        this.heights[k] = h;
        pos[k * 3] = x;
        pos[k * 3 + 1] = h;
        pos[k * 3 + 2] = z;
        asf[k * 4] = surf.groom;
        asf[k * 4 + 1] = surf.ice;
        asf[k * 4 + 2] = surf.powder;
        asf[k * 4 + 3] = Math.max(surf.rail, surf.bank * 0.6) + surf.tunnel * 0.35;
      }
    }
    job.row = end;
    if (job.row <= n) return false;

    this.finishNormals(buf);
    buf.geometry.attributes.position.needsUpdate = true;
    buf.geometry.attributes.asurf.needsUpdate = true;
    buf.geometry.attributes.normal.needsUpdate = true;
    this.buffers[job.target].mesh.visible = true;
    this.buffers[this.active].mesh.visible = false;
    this.active = job.target;
    this.origin.x = job.ox;
    this.origin.z = job.oz;
    this.job = null;
    return true;
  }

  // Normals straight off the grid we already sampled: no extra field queries.
  finishNormals(buf) {
    const { n, cell, heights } = this;
    const nrm = buf.geometry.attributes.normal.array;
    const inv = 1 / (2 * cell);
    for (let j = 0; j <= n; j++) {
      const jm = j > 0 ? j - 1 : j;
      const jp = j < n ? j + 1 : j;
      const sj = (jp - jm) === 2 ? inv : 1 / cell;
      for (let i = 0; i <= n; i++) {
        const im = i > 0 ? i - 1 : i;
        const ip = i < n ? i + 1 : i;
        const si = (ip - im) === 2 ? inv : 1 / cell;
        const row = j * (n + 1);
        const dx = (heights[row + im] - heights[row + ip]) * si;
        const dz = (heights[jm * (n + 1) + i] - heights[jp * (n + 1) + i]) * sj;
        const len = Math.hypot(dx, 1, dz);
        const k = (row + i) * 3;
        nrm[k] = dx / len;
        nrm[k + 1] = 1 / len;
        nrm[k + 2] = dz / len;
      }
    }
  }
}

export class Terrain {
  constructor(scene) {
    this.material = makeSnowMaterial();
    this.group = new THREE.Group();
    this.levels = LEVELS.map((spec, i) =>
      new Level(spec, this.material, i > 0 ? LEVELS[i - 1].cell : 0)
    );
    // Level 0's outer edge must match level 1's lattice, etc.
    this.levels[0].coarserCell = LEVELS[1].cell;
    this.levels[1].coarserCell = LEVELS[2].cell;
    this.levels[2].coarserCell = 0;
    for (const lv of this.levels) for (const m of lv.meshes) this.group.add(m);
    scene.add(this.group);
    this._surf = {
      h: 0, groom: 0, tunnel: 0, park: 0, ice: 0, powder: 0, rail: 0, bank: 0, dist: 0,
    };
    this.rowBudget = 26;
  }

  // Build everything at once (loading screen only).
  prime(x, z) {
    const ox = Math.round(x / SNAP) * SNAP;
    const oz = Math.round(z / SNAP) * SNAP;
    for (const lv of this.levels) {
      lv.startJob(ox, oz);
      while (!lv.step(1e9, this._surf));
    }
  }

  update(x, z) {
    const ox = Math.round(x / SNAP) * SNAP;
    const oz = Math.round(z / SNAP) * SNAP;
    let budget = this.rowBudget;
    for (const lv of this.levels) {
      if (!lv.job && (lv.origin.x !== ox || lv.origin.z !== oz)) lv.startJob(ox, oz);
      if (lv.job && budget > 0) {
        const before = lv.job.row;
        lv.step(budget, this._surf);
        budget -= (lv.job ? lv.job.row : lv.n + 1) - before;
      }
    }
  }

  setQuality(q) {
    // q: 0 = fastest, 1 = full. Trims the far ring first.
    this.levels[2].meshes.forEach((m) => { if (m.visible) m.visible = q > 0.25; });
    this.rowBudget = q > 0.5 ? 26 : 14;
  }
}

// -------------------------------------------------------------- snow material

export function makeSnowMaterial() {
  const textures = getGeneratedTextures();
  setTextureRepeat(textures.snowNormal, 72, 72);
  setTextureRepeat(textures.snowRoughness, 58, 58);
  const mat = new THREE.MeshStandardMaterial({
    color: 0xf2f6ff,
    roughness: 0.78,
    roughnessMap: textures.snowRoughness,
    normalMap: textures.snowNormal,
    normalScale: new THREE.Vector2(0.16, 0.16),
    metalness: 0.0,
    dithering: true,
  });

  mat.onBeforeCompile = (shader) => {
    const accumulation = mat.userData.snowAccumulation;
    shader.uniforms.uSunDir = { value: new THREE.Vector3(0.42, 0.72, -0.55) };
    shader.uniforms.uSnowTrack = { value: accumulation?.texture || WHITE_TRACK };
    shader.uniforms.uSnowCenter = { value: accumulation?.center || new THREE.Vector2() };
    shader.uniforms.uSnowWorldSize = { value: accumulation?.worldSize || 64 };
    shader.vertexShader = `
      attribute vec4 asurf;
      varying vec4 vSurf;
      varying vec3 vWPos;
    ` + shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
       vSurf = asurf;
       vWPos = (modelMatrix * vec4(position, 1.0)).xyz;`
    );

    shader.fragmentShader = `
      varying vec4 vSurf;
      varying vec3 vWPos;
      uniform sampler2D uSnowTrack;
      uniform vec2 uSnowCenter;
      uniform float uSnowWorldSize;
      float plHash(vec2 p) {
        p = fract(p * vec2(127.31, 311.7));
        p += dot(p, p + 42.13);
        return fract(p.x * p.y);
      }
      float plNoise(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(plHash(i), plHash(i + vec2(1.0, 0.0)), f.x),
                   mix(plHash(i + vec2(0.0, 1.0)), plHash(i + 1.0), f.x), f.y);
      }
      float plFbm(vec2 p) {
        float n = plNoise(p) * 0.70;
        n += plNoise(p * 2.07 + 13.1) * 0.30;
        return n;
      }
    ` + shader.fragmentShader
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
         float groom = vSurf.x, ice = vSurf.y, powder = vSurf.z, feat = vSurf.w;
         vec3 cPowder = vec3(0.94, 0.965, 1.000);
         vec3 cGroom  = vec3(0.75, 0.835, 0.945);
         vec3 cIce    = vec3(0.40, 0.61, 0.82);
         vec3 snow = mix(cPowder, cGroom, groom);
         snow = mix(snow, cIce, ice * 0.82);
         float dist = length(vWPos - cameraPosition);
         float near = 1.0 - smoothstep(24.0, 150.0, dist);
         // Broad wind slabs stop the piste reading as one flat white sheet.
         float slab = plFbm(vWPos.xz * 0.085);
         snow *= mix(0.965, 1.035, slab) * mix(1.0, 0.96, groom);
         // Corduroy has a dark trough and a narrow lit ridge, not printed dots.
         float phase = vWPos.x * 15.7 + sin(vWPos.z * 0.018) * 1.7;
         float cord = sin(phase) * 0.5 + 0.5;
         float ridge = pow(cord, 7.0);
         snow *= 1.0 - 0.14 * groom * (1.0 - ice) * (1.0 - cord) * near;
         snow += vec3(0.10, 0.13, 0.18) * ridge * groom * near;
         // Wind lips and sastrugi in loose snow.
         float rip = sin(vWPos.x * 2.1 + vWPos.z * 0.72 + slab * 5.0);
         float crust = smoothstep(0.60, 0.96, rip) * powder * near;
         snow *= 1.0 + 0.09 * crust;
         // Warm sunward slabs against blue ambient pockets create readable relief.
         vec2 lightXZ = normalize(vec2(0.42, -0.55));
         float directional = plNoise(vWPos.xz * 0.045 + lightXZ * 7.0);
         snow = mix(snow, snow * vec3(0.68, 0.80, 1.02), (1.0 - slab) * 0.23 * near);
         snow = mix(snow, snow * vec3(1.08, 1.015, 0.91), directional * slab * 0.18);
         snow = mix(snow, vec3(0.985, 0.88, 0.70), clamp(feat, 0.0, 1.0) * 0.20);
         float g = plHash(floor(vWPos.xz * 42.0));
         snow += step(0.9982, g) * near * (1.0 - ice) * 1.35;
         vec2 trackUv = (vWPos.xz - uSnowCenter) / uSnowWorldSize + 0.5;
         float inTrack = step(0.0, trackUv.x) * step(trackUv.x, 1.0) * step(0.0, trackUv.y) * step(trackUv.y, 1.0);
         float compressed = (1.0 - texture2D(uSnowTrack, trackUv).r) * inTrack * near;
         snow = mix(snow, snow * vec3(0.53, 0.68, 0.86), compressed * 0.72);
         diffuseColor.rgb *= snow;`
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
         float iceGrain = plNoise(vWPos.xz * 0.42);
         roughnessFactor = mix(roughnessFactor, 0.055 + iceGrain * 0.12, vSurf.y);
         roughnessFactor = mix(roughnessFactor, 0.96, vSurf.z * 0.52);
         roughnessFactor = clamp(roughnessFactor, 0.045, 1.0);`
      );
  };
  mat.customProgramCacheKey = () => 'powderline-snow';
  return mat;
}
