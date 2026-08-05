import * as THREE from 'three';
import { setSeed } from './worldfn.js';
import { Terrain } from './terrain.js';
import { Rider, PALETTES, STATE } from './rider.js';
import { ChaseCamera } from './camera.js';
import { Props } from './props.js';
import { Particles, CarveTrail } from './particles.js';
import { makeSky, makeHorizonRidges, makeLights } from './sky.js';
import { Sfx } from './audio.js';
import { Music } from './music.js';
import { HUD } from './hud.js';
import { Net } from './net.js';
import { Ghosts } from './ghosts.js';
import { PostFX, VolumetricAtmosphere } from './postfx.js';
import { SnowAccumulation } from './snow-accumulation.js';

const canvas = document.getElementById('game');
const start = document.getElementById('start');
const nameInput = document.getElementById('name');
const startButton = document.getElementById('start-button');
const muteButton = document.getElementById('mute');
const qualityButton = document.getElementById('quality');

const savedName = localStorage.getItem('powderline-name') || `Rider ${Math.floor(10 + Math.random() * 90)}`;
nameInput.value = savedName;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.88;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setClearColor(0xbcd8f4, 1);

const scene = new THREE.Scene();
window.__plScene = scene; // debug handle: lets QA toggle layers from the console
scene.fog = new THREE.FogExp2(0xb9d0e6, 0.00132);
const camera = new THREE.PerspectiveCamera(68, 1, 0.08, 2900);

let net;
let terrain;
let rider;
let chase;
let props;
let particles;
let trail;
let sky;
let ridges;
let lights;
let ghosts;
let hud;
let sfx;
let music;
let postfx;
let atmosphere;
let snowAccumulation;
let running = false;
let last = performance.now();
let qualityMode = 'AUTO';
// AUTO starts at the balanced tier instead of burning several seconds at
// native DPR + full SSAO before reacting.
let autoQuality = 0.44;
let slowTime = 0;
let fastTime = 0;
let muted = false;
let previousState = STATE.RIDE;

const input = { steer: 0, boost: false, brake: false, ollie: false, tuck: false };
const keys = new Set();

window.addEventListener('keydown', (e) => {
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) e.preventDefault();
  keys.add(e.code);
  if (e.code === 'KeyM') toggleMute();
  if (e.code === 'KeyH') document.body.classList.toggle('hide-hud');
});
window.addEventListener('keyup', (e) => keys.delete(e.code));

function readInput() {
  // World +x points screen-left with the chase camera, so LEFT keys produce +steer.
  input.steer = (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0) - (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0);
  input.boost = keys.has('ShiftLeft') || keys.has('ShiftRight');
  input.brake = keys.has('KeyS') || keys.has('ArrowDown');
  input.ollie = keys.has('Space');
  input.tuck = keys.has('KeyW') || keys.has('ArrowUp');
}

startButton.addEventListener('click', boot);
nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') boot(); });
muteButton.addEventListener('click', toggleMute);
qualityButton.addEventListener('click', () => {
  qualityMode = qualityMode === 'AUTO' ? 'HIGH' : qualityMode === 'HIGH' ? 'LOW' : 'AUTO';
  qualityButton.textContent = `QUALITY ${qualityMode}`;
  applyQuality(qualityMode === 'HIGH' ? 1 : qualityMode === 'LOW' ? 0.32 : autoQuality);
});

async function boot() {
  if (running) return;
  const name = (nameInput.value.trim() || 'Rider').slice(0, 20);
  localStorage.setItem('powderline-name', name);
  startButton.disabled = true;
  startButton.textContent = 'BUILDING MOUNTAIN…';

  net = new Net(name);
  const seed = await net.connect();
  setSeed(seed);

  hud = new HUD();
  sfx = new Sfx();
  sfx.init();
  if (sfx.ctx.state === 'suspended') await sfx.ctx.resume();
  music = new Music(sfx); music.start();

  sky = makeSky(scene);
  ridges = makeHorizonRidges(scene);
  lights = makeLights(scene);
  terrain = new Terrain(scene);
  snowAccumulation = new SnowAccumulation();
  snowAccumulation.bind(terrain.material);
  rider = new Rider(PALETTES[Math.abs(hashName(name)) % PALETTES.length]);
  scene.add(rider.mesh);
  chase = new ChaseCamera(camera);
  props = new Props(scene);
  particles = new Particles(scene);
  trail = new CarveTrail(scene);
  ghosts = new Ghosts(scene);
  atmosphere = new VolumetricAtmosphere(scene);
  postfx = new PostFX(renderer, scene, camera);

  terrain.prime(rider.pos.x, rider.pos.z);
  props.update(rider.pos.x, rider.pos.z, true);
  applyQuality(qualityMode === 'AUTO' ? autoQuality : 1);
  resize();
  start.classList.add('gone');
  running = true;
  last = performance.now();
  requestAnimationFrame(frame);
}

function frame(ts) {
  if (!running) return;
  requestAnimationFrame(frame);
  let dt = Math.min(0.033, Math.max(0.001, (ts - last) * 0.001));
  last = ts;
  const now = ts * 0.001;

  readInput();
  previousState = rider.state;
  rider.update(dt, input, props);
  processEvents(now);

  terrain.update(rider.pos.x, rider.pos.z);
  props.update(rider.pos.x, rider.pos.z);
  particles.update(dt);
  trail.push(rider, now);
  trail.update(now);
  chase.update(dt, rider, rider.state === STATE.WIPE);

  ridges.position.set(rider.pos.x, rider.pos.y - 100, rider.pos.z);
  sky.update(now, camera.position);
  snowAccumulation.update(rider, dt);
  atmosphere.update(now, camera, rider);
  lights.sun.position.set(rider.pos.x + 65, rider.pos.y + 100, rider.pos.z - 95);
  lights.sun.target.position.copy(rider.pos);
  lights.sun.target.updateMatrixWorld();

  ghosts.update(net.players, dt, rider.pos);
  net.send(rider, now);
  sfx.frame(rider, dt);
  music.update(rider.flow, rider.speed);

  const soloLeaders = net.leaders.length ? net.leaders : [{ id: net.id, name: net.name, distance: rider.dist, self: true }];
  hud.update(rider, now, dt, net.online, soloLeaders);
  adaptQuality(dt);
  postfx.render(dt);
}

function processEvents(now) {
  while (rider.events.length) {
    const e = rider.events.shift();
    if (e.type === 'spray' || e.type === 'carve') particles.spray(rider, e.a, rider.surf.powder);
    else if (e.type === 'boostspray') particles.spray(rider, 0.5, rider.surf.powder);
    else if (e.type === 'plume') particles.plume(rider, e.a, e.b);
    else if (e.type === 'pop') { sfx.pop(e.a); particles.burst(rider.pos.x, rider.pos.y, rider.pos.z, 0.2 + e.a * 0.25); }
    else if (e.type === 'land') {
      const clean = e.b > 0.5;
      sfx.land(e.a, clean);
      particles.burst(rider.pos.x, rider.pos.y, rider.pos.z, Math.min(1, e.a / 14));
      chase.kick(Math.min(0.5, e.a * 0.025));
      if (clean && rider.lastAirTime > 0.35) hud.announce('CLEAN LANDING');
    } else if (e.type === 'kicker') {
      sfx.pop(1);
      particles.burst(rider.pos.x, rider.pos.y, rider.pos.z, 0.6);
      chase.kick(0.2);
      hud.announce('KICKER \u2014 SPIN OR FLIP!', 1.1);
    } else if (e.type === 'trick') {
      sfx.land(3, true);
      hud.announce(e.name, 2.0);
    } else if (e.type === 'impact') { sfx.impact(e.a); chase.kick(0.45 * e.a); }
    else if (e.type === 'brush') sfx.brush(e.a);
    else if (e.type === 'wipe') {
      sfx.wipe(); net.wipe(); trail.reset = true;
      particles.burst(rider.pos.x, rider.pos.y, rider.pos.z, 1.5);
      chase.kick(0.8); hud.announce('SHAKE IT OFF', 1.6);
    } else if (e.type === 'respawn') { sfx.respawn(); hud.announce('FRESH LINE'); }
  }
  if (!rider.grounded) particles.glitter(rider);
}

function adaptQuality(dt) {
  if (qualityMode !== 'AUTO') return;
  if (dt > 0.0205) { slowTime += dt; fastTime = Math.max(0, fastTime - dt); }
  else if (dt < 0.0175) { fastTime += dt; slowTime = Math.max(0, slowTime - dt); }
  if (slowTime > 0.9 && autoQuality > 0.32) {
    autoQuality = Math.max(0.32, autoQuality - 0.12); slowTime = 0; applyQuality(autoQuality);
  } else if (fastTime > 7 && autoQuality < 0.82) {
    autoQuality = Math.min(1, autoQuality + 0.12); fastTime = 0; applyQuality(autoQuality);
  }
}

function applyQuality(q) {
  const dpr = Math.min(devicePixelRatio, q > 0.82 ? 1.25 : q > 0.5 ? 0.96 : 0.68);
  renderer.setPixelRatio(dpr);
  renderer.shadowMap.enabled = q > 0.52;
  if (lights?.sun) {
    const shadowSize = q > 0.78 ? 2048 : 1024;
    if (lights.sun.shadow.mapSize.x !== shadowSize) {
      lights.sun.shadow.mapSize.set(shadowSize, shadowSize);
      lights.sun.shadow.map?.dispose();
      lights.sun.shadow.map = null;
    }
  }
  terrain?.setQuality(q);
  props?.setQuality(q);
  particles?.setPixelRatio(dpr);
  postfx?.setQuality(q);
  atmosphere?.setQuality(q);
  snowAccumulation?.setQuality(q);
  resize();
}

function toggleMute() {
  muted = !muted;
  sfx?.setMuted(muted);
  muteButton.textContent = muted ? 'SOUND OFF' : 'SOUND ON';
}

function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  postfx?.setSize(w, h);
}
window.addEventListener('resize', resize);
applyQuality(1);

function hashName(s) { let h = 0; for (let i = 0; i < s.length; i++) h = Math.imul(h, 31) + s.charCodeAt(i) | 0; return h; }
