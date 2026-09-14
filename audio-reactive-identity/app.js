import * as THREE from './vendor/three.module.js';

const $ = (id) => document.getElementById(id);
const ui = {
  stage: $('stage'), sceneCanvas: $('sceneCanvas'), spectrumCanvas: $('spectrumCanvas'),
  start: $('startButton'), play: $('playButton'), file: $('audioFile'), audio: $('fileAudio'),
  state: $('audioState'), dot: $('statusDot'), fps: $('fpsReadout'), fft: $('fftReadout'),
  bass: $('bassValue'), mid: $('midValue'), high: $('highValue'),
  elapsed: $('elapsed'), duration: $('duration'), progress: $('progressFill'), track: $('trackLabel'),
  speed: $('speed'), noise: $('noise'), intensity: $('intensity'),
  speedOut: $('speedOutput'), noiseOut: $('noiseOutput'), intensityOut: $('intensityOutput'),
  unsupported: $('unsupported')
};

const settings = { speed: .75, noise: .55, intensity: 1.1 };
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let renderer, scene, camera, mesh, halo, material, analyser, frequencyData;
let audioContext, masterInput, outputGain, mediaSource, synthNodes = [];
let mode = 'demo', playing = false, started = false, objectUrl = null;
let demoStartedAt = 0, demoOffset = 0, lastFrame = performance.now(), frameSamples = [];
let smooth = { bass: 0, mid: 0, high: 0 };

const vertexShader = `
  uniform float uTime;
  uniform float uBass;
  uniform float uMid;
  uniform float uHigh;
  uniform float uNoise;
  uniform float uIntensity;
  varying vec3 vNormalW;
  varying vec3 vPositionW;
  varying float vPulse;
  float field(vec3 p){
    float a = sin(p.x*3.1 + uTime*1.11) * cos(p.y*2.7 - uTime*.72);
    float b = sin((p.y+p.z)*5.3 - uTime*1.34) * .5;
    float c = cos((p.x-p.z)*8.1 + uTime*.43) * .24;
    return a+b+c;
  }
  void main(){
    vec3 p = position;
    float n = field(normalize(p));
    float lowShape = pow(max(0., normal.y*.5+.5), 2.0) * uBass;
    float edgeShape = abs(normal.x) * uMid;
    float detail = n * (.06 + uNoise*.12) * (1. + uHigh*.8);
    float displacement = (detail + lowShape*.23 + edgeShape*.07) * uIntensity;
    p += normal * displacement;
    p.x *= 1. + uBass*.1*uIntensity;
    p.y *= 1. + uMid*.06*uIntensity;
    vec4 world = modelMatrix * vec4(p,1.);
    vPositionW = world.xyz;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vPulse = clamp(uBass*.65 + uMid*.25 + uHigh*.1 + n*.08, 0., 1.);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;
const fragmentShader = `
  precision highp float;
  uniform float uBass;
  uniform float uMid;
  uniform float uHigh;
  uniform float uIntensity;
  varying vec3 vNormalW;
  varying vec3 vPositionW;
  varying float vPulse;
  void main(){
    vec3 viewDir = normalize(cameraPosition - vPositionW);
    float fresnel = pow(1. - max(dot(viewDir, normalize(vNormalW)), 0.), 2.2);
    vec3 bone = vec3(.91,.886,.84);
    vec3 coral = vec3(1.,.396,.31);
    vec3 mint = vec3(.55,1.,.83);
    vec3 color = mix(bone, coral, clamp(vPulse*uIntensity*.9,0.,1.));
    color = mix(color, mint, clamp(fresnel*(.5+uHigh),0.,1.));
    float light = .34 + max(dot(normalize(vNormalW), normalize(vec3(-.4,.8,.6))),0.)*.78;
    float glow = fresnel*(.62+uMid*.8) + uBass*.14;
    gl_FragColor = vec4(color*(light+glow), .96);
  }
`;

function initThree(){
  try{
    renderer = new THREE.WebGLRenderer({ canvas: ui.sceneCanvas, antialias: false, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(34, 1, .1, 50);
    camera.position.set(0, 0, 6.6);
    const geometry = new THREE.IcosahedronGeometry(1.42, 4);
    material = new THREE.ShaderMaterial({
      vertexShader, fragmentShader, transparent: true,
      uniforms: {
        uTime:{value:0}, uBass:{value:0}, uMid:{value:0}, uHigh:{value:0},
        uNoise:{value:settings.noise}, uIntensity:{value:settings.intensity}
      }
    });
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.x = .72;
    mesh.rotation.z = -.18;
    scene.add(mesh);
    const haloGeometry = new THREE.IcosahedronGeometry(1.5, 2);
    const haloMaterial = new THREE.MeshBasicMaterial({ color:0xff654f, wireframe:true, transparent:true, opacity:.11, blending:THREE.AdditiveBlending });
    halo = new THREE.Mesh(haloGeometry, haloMaterial);
    halo.position.copy(mesh.position);
    halo.rotation.copy(mesh.rotation);
    scene.add(halo);
    resize();
    addEventListener('resize', resize, { passive:true });
  }catch(error){
    ui.unsupported.hidden = false;
    console.error('WebGL initialization failed', error);
  }
}

function resize(){
  if(!renderer) return;
  const rect = ui.stage.getBoundingClientRect();
  renderer.setSize(rect.width, rect.height, false);
  const compact = rect.width < 600;
  camera.aspect = rect.width / Math.max(rect.height,1);
  camera.position.z = compact ? 8.4 : 6.6;
  if(mesh){ mesh.position.x = compact ? 1.05 : .72; halo.position.copy(mesh.position); }
  camera.updateProjectionMatrix();
  const dpr = Math.min(devicePixelRatio, 1.5);
  const sr = ui.spectrumCanvas.getBoundingClientRect();
  ui.spectrumCanvas.width = Math.max(1, Math.floor(sr.width*dpr));
  ui.spectrumCanvas.height = Math.max(1, Math.floor(sr.height*dpr));
}

function createSynth(){
  const now = audioContext.currentTime;
  const mix = audioContext.createGain();
  mix.gain.value = .42;
  mix.connect(masterInput);
  const voices = [
    {f:55, type:'sine', gain:.28, rate:2},
    {f:110, type:'triangle', gain:.14, rate:4},
    {f:220, type:'sawtooth', gain:.055, rate:8},
    {f:1760, type:'square', gain:.018, rate:6}
  ];
  voices.forEach((v,i)=>{
    const osc=audioContext.createOscillator(), gain=audioContext.createGain(), lfo=audioContext.createOscillator(), depth=audioContext.createGain();
    osc.type=v.type; osc.frequency.value=v.f;
    lfo.type=i===0?'square':'sine'; lfo.frequency.value=v.rate/8;
    gain.gain.value=v.gain*.55; depth.gain.value=v.gain*.45;
    lfo.connect(depth).connect(gain.gain); osc.connect(gain).connect(mix);
    osc.start(now); lfo.start(now); synthNodes.push(osc,lfo,gain,depth);
  });
  const filter=audioContext.createBiquadFilter();
  filter.type='lowpass'; filter.frequency.value=4200; filter.Q.value=.7;
  mix.disconnect(); mix.connect(filter).connect(masterInput); synthNodes.push(mix,filter);
}

async function initAudio(){
  if(audioContext) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if(!AC) throw new Error('Web Audio API is unavailable');
  audioContext = new AC();
  masterInput = audioContext.createGain();
  analyser = audioContext.createAnalyser();
  outputGain = audioContext.createGain();
  analyser.fftSize = 2048;
  analyser.smoothingTimeConstant = .78;
  frequencyData = new Uint8Array(analyser.frequencyBinCount);
  masterInput.connect(analyser).connect(outputGain).connect(audioContext.destination);
  outputGain.gain.value = .28;
  createSynth();
  mediaSource = audioContext.createMediaElementSource(ui.audio);
  mediaSource.connect(masterInput);
  window.__ARID.audio = { context:audioContext, analyser, frequencyData };
}

function bandEnergy(minHz,maxHz){
  if(!frequencyData || !audioContext) return 0;
  const nyquist=audioContext.sampleRate/2, start=Math.max(1,Math.floor(minHz/nyquist*frequencyData.length)), end=Math.min(frequencyData.length,Math.ceil(maxHz/nyquist*frequencyData.length));
  let sum=0; for(let i=start;i<end;i++) sum += frequencyData[i]*frequencyData[i];
  return Math.min(1, Math.sqrt(sum/Math.max(1,end-start))/185);
}

async function startDemo(){
  try{
    await initAudio(); await audioContext.resume();
    mode='demo'; playing=true; started=true; demoStartedAt=audioContext.currentTime; demoOffset=0;
    ui.audio.pause(); outputGain.gain.setTargetAtTime(.28,audioContext.currentTime,.03);
    ui.start.hidden=true; ui.play.disabled=false; updateTransport();
  }catch(error){
    ui.state.textContent='AUDIO ERROR'; console.error(error);
  }
}

async function togglePlay(){
  if(!started) return startDemo();
  if(mode==='file'){
    if(ui.audio.paused){ await audioContext.resume(); await ui.audio.play(); playing=true; }
    else { ui.audio.pause(); playing=false; }
  }else{
    if(playing){ demoOffset=(demoOffset+(audioContext.currentTime-demoStartedAt))%8; await audioContext.suspend(); frequencyData?.fill(0); playing=false; }
    else { await audioContext.resume(); demoStartedAt=audioContext.currentTime; playing=true; }
  }
  updateTransport();
}

function updateTransport(){
  ui.play.classList.toggle('playing',playing); ui.play.setAttribute('aria-label',playing?'Pause audio':'Play audio');
  ui.state.textContent=playing?'FFT LIVE':'AUDIO PAUSED'; ui.dot.classList.toggle('live',playing);
}

ui.file.addEventListener('change', async()=>{
  const file=ui.file.files?.[0]; if(!file) return;
  await initAudio();
  if(objectUrl) URL.revokeObjectURL(objectUrl);
  objectUrl=URL.createObjectURL(file); ui.audio.src=objectUrl; mode='file';
  ui.track.textContent=file.name.toUpperCase().slice(0,42); ui.start.hidden=true; ui.play.disabled=false;
  await audioContext.resume(); outputGain.gain.value=.28;
  try{ await ui.audio.play(); playing=true; started=true; }catch(error){ playing=false; }
  updateTransport();
});
ui.audio.addEventListener('ended',()=>{playing=false;updateTransport()});
ui.start.addEventListener('click',startDemo); ui.play.addEventListener('click',togglePlay);

function bindRange(input,out,key,format){
  const paint=()=>{
    settings[key]=Number(input.value); out.value=format(settings[key]);
    const pct=(input.value-input.min)/(input.max-input.min)*100;
    input.style.background=`linear-gradient(90deg,var(--coral) 0 ${pct}%,rgba(232,226,214,.16) ${pct}%)`;
  };
  input.addEventListener('input',paint); paint();
}
bindRange(ui.speed,ui.speedOut,'speed',v=>v.toFixed(2)+'×');
bindRange(ui.noise,ui.noiseOut,'noise',v=>v.toFixed(2));
bindRange(ui.intensity,ui.intensityOut,'intensity',v=>v.toFixed(2));

function drawSpectrum(){
  const c=ui.spectrumCanvas, ctx=c.getContext('2d'), w=c.width, h=c.height, dpr=Math.min(devicePixelRatio,1.5);
  ctx.clearRect(0,0,w,h); const bins=72, gap=2*dpr, barW=(w-gap*(bins-1))/bins;
  for(let i=0;i<bins;i++){
    const t=i/(bins-1), index=Math.min(frequencyData?.length-1||0,Math.floor(Math.pow(t,.42)*(frequencyData?.length-1||0)));
    const value=frequencyData ? frequencyData[index]/255 : .015;
    const bh=Math.max(1*dpr,value*h*.94);
    const mix=Math.min(1,t*1.35); const r=Math.round(255-(115*mix)), g=Math.round(101+(154*mix)), b=Math.round(79+(133*mix));
    ctx.fillStyle=`rgba(${r},${g},${b},${.2+value*.8})`; ctx.fillRect(i*(barW+gap),h-bh,barW,bh);
  }
}
function fmt(sec){sec=Math.max(0,sec||0);return `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(Math.floor(sec%60)).padStart(2,'0')}`}
function updateTime(){
  let elapsed=0,duration=8;
  if(mode==='file'){elapsed=ui.audio.currentTime||0;duration=Number.isFinite(ui.audio.duration)?ui.audio.duration:0;}
  else if(audioContext){elapsed=(demoOffset+(playing?audioContext.currentTime-demoStartedAt:0))%8;}
  ui.elapsed.textContent=fmt(elapsed);ui.duration.textContent=fmt(duration);ui.progress.style.width=(duration?elapsed/duration*100:0)+'%';
}

function animate(now){
  requestAnimationFrame(animate);
  const dt=Math.min(.05,(now-lastFrame)/1000);lastFrame=now;
  if(analyser && audioContext.state==='running') analyser.getByteFrequencyData(frequencyData);
  const target={bass:bandEnergy(28,180),mid:bandEnergy(180,2200),high:bandEnergy(2200,12000)};
  const ease=1-Math.pow(.001,dt);
  smooth.bass+= (target.bass-smooth.bass)*ease; smooth.mid+=(target.mid-smooth.mid)*ease; smooth.high+=(target.high-smooth.high)*ease;
  if(material){
    const time=now*.001*settings.speed*(reducedMotion?.28:1);
    material.uniforms.uTime.value=time;material.uniforms.uBass.value=smooth.bass;material.uniforms.uMid.value=smooth.mid;material.uniforms.uHigh.value=smooth.high;material.uniforms.uNoise.value=settings.noise;material.uniforms.uIntensity.value=settings.intensity;
    mesh.rotation.y += dt*(.08+smooth.high*.32)*settings.speed; mesh.rotation.x=Math.sin(time*.22)*.12;
    const s=1+smooth.bass*.07*settings.intensity;mesh.scale.setScalar(s);
    halo.rotation.y-=dt*(.055+smooth.mid*.15);halo.rotation.x+=dt*.025;halo.scale.setScalar(1+smooth.bass*.13*settings.intensity);
    halo.material.opacity=.045+smooth.high*.18*settings.intensity;
    renderer.render(scene,camera);
  }
  ui.bass.textContent=String(Math.round(smooth.bass*99)).padStart(2,'0');ui.mid.textContent=String(Math.round(smooth.mid*99)).padStart(2,'0');ui.high.textContent=String(Math.round(smooth.high*99)).padStart(2,'0');
  drawSpectrum();updateTime();
  const fps=1000/Math.max(1,now-(window.__ARID.lastFrame||now-16.67));window.__ARID.lastFrame=now;frameSamples.push(fps);if(frameSamples.length>120)frameSamples.shift();
  if(Math.floor(now/500)!==window.__ARID.fpsTick){window.__ARID.fpsTick=Math.floor(now/500);const sorted=[...frameSamples].sort((a,b)=>a-b);const median=sorted[Math.floor(sorted.length/2)]||0;window.__ARID.metrics={fpsMedian:median,bass:smooth.bass,mid:smooth.mid,high:smooth.high,playing,mode,settings:{...settings}};ui.fps.textContent=Math.round(median)+' FPS';}
}

window.__ARID={version:'1.0.0',ready:false,audio:null,metrics:{},lastFrame:0,fpsTick:0,startDemo,togglePlay};
initThree();window.__ARID.ready=true;requestAnimationFrame(animate);
