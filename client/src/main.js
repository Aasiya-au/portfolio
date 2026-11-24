import './style.css';
import * as THREE from 'three';
import { OutlineEffect } from 'three/examples/jsm/effects/OutlineEffect.js';
import { CONFIG } from './config.js';
import { createWorld, makeGradientMap } from './world.js';
import { buildPlatform } from './props.js';
import { loadAvatar } from './avatar.js';
import { initScroll, setWide, updateLive, live } from './scroll.js';
import { renderSections } from './sections.js';
import { createReactions } from './reactions.js';
import { initChat } from './chat.js';
import { initTheme } from './theme.js';
import { initAnalytics } from './analytics.js';

// --- text from config ---
document.title = `${CONFIG.name} | Portfolio`;
document.querySelector('#name').textContent = CONFIG.name;
document.querySelector('#tagline').textContent = CONFIG.tagline;

const loader = document.querySelector('#loader');
const fill = document.querySelector('#bar-fill');
const isWide = () => window.innerWidth / window.innerHeight > 1.1;
let wide = isWide();

// "lite" = phones and low-power laptops: fewer particles, no ink outline, lower resolution
const lite = window.innerWidth < 800 || (navigator.hardwareConcurrency || 8) <= 4;

// everything that isn't 3D works even if WebGL is unavailable
initAnalytics();
renderSections();
initChat();
initTheme();
initScroll(wide);

try {
  start3D();
} catch (err) {
  console.error('3D scene unavailable, showing the content only:', err);
  document.documentElement.classList.add('no-webgl');
  loader.classList.add('done');
}

function start3D() {
  const manager = new THREE.LoadingManager();
  manager.onProgress = (_u, loaded, total) => (fill.style.width = `${(loaded / total) * 100}%`);

  const canvas = document.querySelector('#bg');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !lite, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, lite ? 1.25 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);

  const effect =
    CONFIG.outline && !lite
      ? new OutlineEffect(renderer, { defaultThickness: 0.0035, defaultColor: [0.12, 0.18, 0.23], defaultAlpha: 1 })
      : null;

  const scene = new THREE.Scene();
  const gradientMap = makeGradientMap(CONFIG.toonSteps);
  const world = createWorld(scene, gradientMap, { lite });

  const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 120);
  scene.add(camera);

  // the avatar lives in a rig attached to the camera, so she travels with you between islands
  const rig = new THREE.Group();
  camera.add(rig);
  rig.add(buildPlatform(world.M));

  function onResize() {
    const w = window.innerWidth, h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    effect?.setSize(w, h);
    if (isWide() !== wide) {
      wide = isWide();
      setWide(wide);
    }
  }
  window.addEventListener('resize', onResize);
  onResize();

  const mouse = { x: 0, y: 0 };
  const mouseSmooth = { x: 0 };
  window.addEventListener('pointermove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
  });

  let avatar = null;
  let reactions = null;
  loadAvatar(manager, gradientMap)
    .then((a) => {
      avatar = a;
      rig.add(a.holder);
      if (CONFIG.reactions) {
        reactions = createReactions({ avatar: a, rig, camera, canvas });
        reactions.greet();
      }
    })
    .catch((err) => console.error('Avatar failed to load. Is it at public/models/avatar.glb ?', err))
    .finally(() => setTimeout(() => loader.classList.add('done'), 300));

  const clock = new THREE.Clock();
  function tick() {
    requestAnimationFrame(tick);
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    updateLive(dt);
    world.apply(live, t);
    world.update(t, dt, live, mouse);
    avatar?.update(dt, mouse, t);

    mouseSmooth.x += (mouse.x - mouseSmooth.x) * 0.05;
    camera.position.set(live.cx + mouseSmooth.x * 0.25, live.cy, live.cz);
    camera.lookAt(live.lx, live.ly, live.lz);

    rig.position.set(live.avX, -1.0 + live.avY, -4.6);
    rig.scale.setScalar(Math.max(live.avS, 0.0001));
    rig.visible = live.avS > 0.02;

    reactions?.update(dt);
    (effect || renderer).render(scene, camera);
  }
  tick();
}
