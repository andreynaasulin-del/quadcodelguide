// Lightweight representations of the other riders. Each ghost is generated
// from primitives and smoothed toward the last network packet.

import * as THREE from 'three';
import { makeRiderMesh, PALETTES } from './rider.js';

export class Ghosts {
  constructor(scene) {
    this.scene = scene;
    this.items = new Map();
  }

  update(players, dt, localPos) {
    for (const [id, p] of players) {
      let g = this.items.get(id);
      if (!g) {
        const root = new THREE.Group();
        const palette = PALETTES[hashString(id) % PALETTES.length];
        const body = makeRiderMesh(palette);
        body.scale.setScalar(0.96);
        root.add(body);
        const tag = makeTag(p.name || 'Rider');
        tag.position.y = 2.05;
        root.add(tag);
        root.userData.body = body;
        root.userData.target = new THREE.Vector3(p.x, p.y, p.z);
        this.scene.add(root);
        g = root;
        this.items.set(id, g);
      }
      g.userData.target.set(p.x, p.y, p.z);
      g.userData.yaw = p.yaw;
      g.userData.edge = p.edge;
      g.userData.flow = p.flow;
      const far = g.userData.target.distanceToSquared(localPos) > 300 * 300;
      g.visible = !far;
      if (!far) {
        g.position.lerp(g.userData.target, 1 - Math.exp(-10 * dt));
        g.rotation.y = lerpAngle(g.rotation.y, p.yaw || 0, 1 - Math.exp(-9 * dt));
        g.rotation.z += ((-(p.edge || 0) * 0.35) - g.rotation.z) * (1 - Math.exp(-7 * dt));
      }
    }
    for (const [id, g] of this.items) {
      if (!players.has(id)) {
        this.scene.remove(g);
        g.traverse((o) => { if (o.material?.map) o.material.map.dispose(); if (o.material) o.material.dispose(); });
        this.items.delete(id);
      }
    }
  }
}

function makeTag(name) {
  const cv = document.createElement('canvas');
  cv.width = 256; cv.height = 64;
  const x = cv.getContext('2d');
  x.fillStyle = 'rgba(13,22,37,.72)';
  roundRect(x, 8, 7, 240, 50, 22); x.fill();
  x.font = '600 25px system-ui'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillStyle = '#fff'; x.fillText(name.slice(0, 18), 128, 32);
  const map = new THREE.CanvasTexture(cv); map.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map, transparent: true, depthWrite: false });
  const s = new THREE.Sprite(mat); s.scale.set(2.8, 0.7, 1); return s;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
}
function hashString(s) { let h = 0; for (let i = 0; i < s.length; i++) h = Math.imul(31, h) + s.charCodeAt(i) | 0; return Math.abs(h); }
function lerpAngle(a, b, t) { const d = Math.atan2(Math.sin(b - a), Math.cos(b - a)); return a + d * t; }
