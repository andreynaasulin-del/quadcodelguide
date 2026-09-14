/**
 * Minimal orbit controller.
 *
 * OrbitControls is not part of the vendored three.js core build, and pulling the
 * addons bundle for 4 pointer handlers is not worth it. This does drag-to-orbit,
 * wheel-to-zoom, right-drag/two-finger to pan, inertial damping, and a frame()
 * that fits an arbitrary Box3 to the current field of view.
 */
import * as THREE from './vendor/three.module.js';

const _center = new THREE.Vector3();
const _size = new THREE.Vector3();

export class Orbit {
  constructor(camera, dom, { target = [0, 0, 0], minDistance = 6, maxDistance = 90 } = {}) {
    this.camera = camera;
    this.dom = dom;
    this.target = { x: target[0], y: target[1], z: target[2] };

    this.azimuth = -0.85;
    this.polar = 1.28;
    this.distance = 34;

    this.azimuthVelocity = 0;
    this.polarVelocity = 0;
    this.distanceTarget = this.distance;
    this.panTarget = { ...this.target };

    this.minDistance = minDistance;
    this.maxDistance = maxDistance;
    this.minPolar = 0.16;
    this.maxPolar = Math.PI - 0.16;

    this.autoSpin = 0;
    this.enabled = true;

    this._pointers = new Map();
    this._lastPinch = 0;
    this._bind();
    this._apply();
  }

  _bind() {
    const dom = this.dom;
    dom.style.touchAction = 'none';

    dom.addEventListener('pointerdown', (event) => {
      if (!this.enabled) return;
      dom.setPointerCapture(event.pointerId);
      this._pointers.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
        button: event.button,
      });
      this.dragged = false;
    });

    dom.addEventListener('pointermove', (event) => {
      const prev = this._pointers.get(event.pointerId);
      if (!prev) return;

      const dx = event.clientX - prev.x;
      const dy = event.clientY - prev.y;
      prev.x = event.clientX;
      prev.y = event.clientY;
      if (Math.abs(dx) + Math.abs(dy) > 2) this.dragged = true;

      if (this._pointers.size >= 2) {
        this._pinch();
        return;
      }

      const panning = prev.button === 2 || event.shiftKey;
      if (panning) this._pan(dx, dy);
      else {
        this.azimuthVelocity -= dx * 0.005;
        this.polarVelocity -= dy * 0.005;
      }
    });

    const release = (event) => {
      this._pointers.delete(event.pointerId);
      this._lastPinch = 0;
    };
    dom.addEventListener('pointerup', release);
    dom.addEventListener('pointercancel', release);
    dom.addEventListener('contextmenu', (event) => event.preventDefault());

    dom.addEventListener('wheel', (event) => {
      if (!this.enabled) return;
      event.preventDefault();
      const step = Math.sign(event.deltaY) * Math.max(0.6, this.distanceTarget * 0.09);
      this.distanceTarget = this._clampDistance(this.distanceTarget + step);
    }, { passive: false });
  }

  _pinch() {
    const [a, b] = [...this._pointers.values()];
    const spread = Math.hypot(a.x - b.x, a.y - b.y);
    if (this._lastPinch) {
      const delta = this._lastPinch - spread;
      this.distanceTarget = this._clampDistance(this.distanceTarget + delta * 0.06);
    }
    this._lastPinch = spread;
  }

  _pan(dx, dy) {
    // Pan in the camera's screen plane, scaled so it feels 1:1 at any zoom.
    const scale = this.distance * 0.0016;
    const cos = Math.cos(this.azimuth);
    const sin = Math.sin(this.azimuth);
    this.panTarget.x += (-dx * cos) * scale;
    this.panTarget.z += (dx * sin) * scale;
    this.panTarget.y += dy * scale;
  }

  _clampDistance(value) {
    return Math.min(this.maxDistance, Math.max(this.minDistance, value));
  }

  setTarget(x, y, z) {
    this.panTarget.x = x;
    this.panTarget.y = y;
    this.panTarget.z = z;
  }

  /** Fit a Box3 into view, with a margin multiplier on the fitted radius. */
  frame(box, margin = 1.5) {
    if (box.isEmpty()) return;
    box.getCenter(_center);
    box.getSize(_size);
    // Fit the largest dimension, then respect the viewport aspect so a long
    // pistol seen from the side does not get cropped on a narrow window.
    const radius = Math.max(_size.x, _size.y, _size.z) * 0.5;
    const fov = (this.camera.fov * Math.PI) / 180;
    const horizontalPenalty = Math.max(1, 1.35 / this.camera.aspect);
    this.setTarget(_center.x, _center.y, _center.z);
    this.distanceTarget = this._clampDistance(
      (radius / Math.sin(fov / 2)) * margin * horizontalPenalty,
    );
  }

  update(dt = 1 / 60) {
    const damp = Math.min(1, dt * 9);

    this.azimuth += this.azimuthVelocity + this.autoSpin * dt;
    this.polar += this.polarVelocity;
    this.azimuthVelocity *= 0.84;
    this.polarVelocity *= 0.84;
    this.polar = Math.min(this.maxPolar, Math.max(this.minPolar, this.polar));

    this.distance += (this.distanceTarget - this.distance) * damp;
    this.target.x += (this.panTarget.x - this.target.x) * damp;
    this.target.y += (this.panTarget.y - this.target.y) * damp;
    this.target.z += (this.panTarget.z - this.target.z) * damp;

    this._apply();
  }

  _apply() {
    const sinPolar = Math.sin(this.polar);
    this.camera.position.set(
      this.target.x + this.distance * sinPolar * Math.sin(this.azimuth),
      this.target.y + this.distance * Math.cos(this.polar),
      this.target.z + this.distance * sinPolar * Math.cos(this.azimuth),
    );
    this.camera.lookAt(this.target.x, this.target.y, this.target.z);
  }
}
