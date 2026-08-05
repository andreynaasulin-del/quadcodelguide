import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export class PostFX {
  constructor(renderer, scene, camera) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.composer = new EffectComposer(renderer);
    this.composer.addPass(new RenderPass(scene, camera));

    const size = renderer.getSize(new THREE.Vector2());
    this.ssao = new SSAOPass(scene, camera, size.x, size.y);
    this.ssao.kernelRadius = 7;
    this.ssao.minDistance = 0.0012;
    this.ssao.maxDistance = 0.045;
    this.composer.addPass(this.ssao);

    this.bloom = new UnrealBloomPass(size, 0.16, 0.32, 0.86);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
    this.quality = -1;
    this.setQuality(1);
  }

  setQuality(q) {
    this.quality = q;
    this.ssao.enabled = q > 0.54;
    this.ssao.kernelRadius = q > 0.82 ? 8 : 5;
    this.bloom.enabled = q > 0.44;
    this.bloom.strength = q > 0.72 ? 0.16 : 0.10;
    this.bloom.radius = q > 0.72 ? 0.32 : 0.2;
    this.bloom.threshold = 0.88;
    this.active = this.ssao.enabled || this.bloom.enabled;
  }

  setSize(w, h) {
    this.composer.setSize(w, h);
    this.ssao.setSize(w, h);
    this.bloom.setSize(w, h);
  }

  render(dt) {
    if (this.active) this.composer.render(dt);
    else this.renderer.render(this.scene, this.camera);
  }
}

// Six camera-centred layers integrate height fog along the view direction.
// This is materially cheaper than a full-screen 32-step raymarch and gives
// moving parallax rather than a flat distance tint.
export class VolumetricAtmosphere {
  constructor(scene) {
    this.group = new THREE.Group();
    this.layers = [];
    const geometry = new THREE.PlaneGeometry(900, 420, 1, 1);
    for (let i = 0; i < 6; i++) {
      const material = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        depthTest: true,
        blending: THREE.NormalBlending,
        uniforms: {
          uOpacity: { value: 0.025 + i * 0.006 },
          uTime: { value: 0 },
          uSeed: { value: i * 17.31 },
          uSun: { value: new THREE.Vector3(0.38, 0.62, -0.68).normalize() },
          uRiderY: { value: 0 },
        },
        vertexShader: `
          varying vec2 vUv;
          varying vec3 vWorld;
          void main() {
            vUv = uv;
            vec4 world = modelMatrix * vec4(position, 1.0);
            vWorld = world.xyz;
            gl_Position = projectionMatrix * viewMatrix * world;
          }
        `,
        fragmentShader: `
          varying vec2 vUv;
          varying vec3 vWorld;
          uniform float uOpacity;
          uniform float uTime;
          uniform float uSeed;
          uniform vec3 uSun;
          uniform float uRiderY;
          float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7))+uSeed)*43758.5453); }
          float n(vec2 p){
            vec2 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f);
            return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+1.0),f.x),f.y);
          }
          void main(){
            vec2 p=vWorld.xz*0.007+vec2(uTime*0.006,-uTime*0.002);
            float mist=n(p)*0.62+n(p*2.03+8.2)*0.38;
            mist=smoothstep(0.26,0.82,mist);
            float edge=smoothstep(0.0,0.18,vUv.x)*smoothstep(0.0,0.18,1.0-vUv.x);
            edge*=smoothstep(0.0,0.22,vUv.y)*smoothstep(0.0,0.22,1.0-vUv.y);
            float sun=pow(max(dot(normalize(cameraPosition-vWorld),-uSun),0.0),7.0);
            vec3 col=mix(vec3(0.62,0.76,0.90),vec3(1.0,0.86,0.64),sun*0.58);
            // Height fog, not a screen veil: fade out well above the rider so
            // the mist sits in the valley and never paints over open sky.
            // (The old constant-opacity planes stacked into a pale dome that
            // covered half the sky.)
            float hfade=1.0-smoothstep(uRiderY+8.0,uRiderY+95.0,vWorld.y);
            gl_FragColor=vec4(col,uOpacity*mist*edge*hfade);
          }
        `,
      });
      const layer = new THREE.Mesh(geometry, material);
      layer.renderOrder = -20 + i;
      layer.frustumCulled = false;
      this.group.add(layer);
      this.layers.push(layer);
    }
    scene.add(this.group);
    this.quality = 1;
  }

  update(time, camera, rider) {
    for (let i = 0; i < this.layers.length; i++) {
      const layer = this.layers[i];
      const distance = 70 + i * 72;
      layer.position.copy(camera.position);
      camera.getWorldDirection(_dir);
      layer.position.addScaledVector(_dir, distance);
      layer.position.y = THREE.MathUtils.lerp(layer.position.y, rider.pos.y + 18 + i * 5, 0.45);
      layer.quaternion.copy(camera.quaternion);
      layer.material.uniforms.uTime.value = time;
      layer.material.uniforms.uRiderY.value = rider.pos.y;
      layer.visible = i < (this.quality > 0.72 ? 6 : this.quality > 0.52 ? 3 : 0);
    }
  }

  setQuality(q) { this.quality = q; }
}

const _dir = new THREE.Vector3();
