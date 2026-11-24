import gsap from 'gsap';
import * as THREE from 'three';
import { CONFIG } from './config.js';
import { SECTIONS } from './themes.js';
import { live, getActive } from './scroll.js';

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const rand = (a, b) => a + Math.random() * (b - a);
const first = CONFIG.name.split(' ')[0];
const CLICK_LINES = [
  `Hi! I'm ${first}'s avatar.`,
  'Hehe, that tickles.',
  'Boop!',
  'Have you seen the arcade yet?',
  'Hungry... waffles?',
  'Psst, scroll down for the good stuff.',
];

export function createReactions({ avatar, rig, camera, canvas }) {
  const { fx } = avatar;

  // ---------- speech bubble ----------
  const bubble = document.createElement('div');
  bubble.id = 'bubble';
  bubble.setAttribute('aria-hidden', 'true'); // decorative chatter; keep screen readers quiet
  document.body.appendChild(bubble);
  let bubbleTimer;
  function say(text, ms = 3200) {
    if (!CONFIG.speechBubbles || !text) return;
    bubble.textContent = text;
    bubble.dataset.show = '1';
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => (bubble.dataset.show = '0'), ms);
  }
  const v = new THREE.Vector3();
  function placeBubble() {
    if (bubble.dataset.show !== '1') return;
    if (!rig.visible) return void (bubble.dataset.show = '0');
    camera.updateMatrixWorld(true);
    rig.localToWorld(v.set(0, CONFIG.avatarHeight + 0.2, 0)).project(camera);
    const w = bubble.offsetWidth, h = bubble.offsetHeight;
    const x = Math.min(Math.max((v.x * 0.5 + 0.5) * innerWidth, w / 2 + 8), innerWidth - w / 2 - 8);
    const y = Math.max((-v.y * 0.5 + 0.5) * innerHeight, h + 16);
    bubble.style.left = `${x}px`;
    bubble.style.top = `${y}px`;
  }

  // ---------- gestures ----------
  let busy = false;
  const done = { onComplete: () => (busy = false) };
  const GESTURES = {
    wave: () =>
      gsap.timeline(done)
        .to(fx, { arm: 1, nod: 0.12, duration: 0.4, ease: 'power2.out' })
        .to(fx, { arm: 0, nod: 0, duration: 0.45, ease: 'power2.inOut' }, '+=1.3'),
    jump: () =>
      gsap.timeline(done)
        .to(fx, { squash: 1, duration: 0.12 })
        .to(fx, { squash: -0.3, jump: 0.38, duration: 0.22, ease: 'power2.out' })
        .to(fx, { jump: 0, duration: 0.26, ease: 'power2.in' })
        .to(fx, { squash: 0.8, duration: 0.07 })
        .to(fx, { squash: 0, duration: 0.3, ease: 'elastic.out(1, 0.5)' }),
    nod: () =>
      gsap.timeline(done)
        .to(fx, { nod: 0.32, duration: 0.18, ease: 'power1.out' })
        .to(fx, { nod: 0, duration: 0.18 })
        .to(fx, { nod: 0.28, duration: 0.18 })
        .to(fx, { nod: 0, duration: 0.25 }),
    twirl: () =>
      gsap.timeline(done)
        .to(fx, { squash: 0.6, duration: 0.1 })
        .to(fx, { spin: Math.PI * 2, jump: 0.2, squash: -0.2, duration: 0.85, ease: 'power2.inOut' })
        .to(fx, { jump: 0, squash: 0, duration: 0.2 })
        .set(fx, { spin: 0 }),
  };
  function play(name) {
    if (reduceMotion || busy || !GESTURES[name]) return false;
    busy = true;
    GESTURES[name]();
    return true;
  }

  window.addEventListener('portfolio:gesture', (e) => play(e.detail));

  // ---------- section reactions (once per section) ----------
  const seen = new Set();
  function onSection(index) {
    const sec = SECTIONS[index];
    if (!sec || !sec.react || seen.has(sec.id)) return;
    setTimeout(() => {
      if (getActive() !== index || !rig.visible || live.avS < 0.5 || seen.has(sec.id)) return;
      seen.add(sec.id);
      play(sec.react);
      say(sec.line, 3800);
    }, 750);
  }
  window.addEventListener('portfolio:section', (e) => onSection(e.detail.index));

  // ---------- pointer: hover + click on the avatar ----------
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const hits = (x, y) => {
    if (!rig.visible) return false;
    ndc.set((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    return ray.intersectObjects(avatar.hitMeshes, false).length > 0;
  };

  let lastAct = performance.now();
  let pointer = { x: 0, y: 0, onCanvas: false, dirty: false };
  let hovering = false;
  window.addEventListener('pointermove', (e) => {
    pointer = { x: e.clientX, y: e.clientY, onCanvas: e.target === canvas, dirty: true };
    lastAct = performance.now();
  });
  window.addEventListener('scroll', () => (lastAct = performance.now()), { passive: true });

  let clicks = [];
  canvas.addEventListener('pointerdown', (e) => {
    if (!hits(e.clientX, e.clientY)) return;
    lastAct = performance.now();
    const now = performance.now();
    clicks = clicks.filter((t) => now - t < 2500);
    clicks.push(now);
    if (clicks.length >= 5) {
      clicks = [];
      play('twirl');
      say("Okay okay, I'm dizzy!");
      return;
    }
    play(pick(['wave', 'jump', 'nod']));
    say(pick(CLICK_LINES));
  });

  // ---------- per-frame ----------
  let prevCx = live.cx;
  let nextIdle = performance.now() + 9000;
  function update(dt) {
    // lean into the direction of travel while the camera glides between islands
    const vx = (live.cx - prevCx) / Math.max(dt, 0.001);
    prevCx = live.cx;
    const target = reduceMotion ? 0 : -Math.max(-0.3, Math.min(0.3, vx * 0.025));
    fx.lean += (target - fx.lean) * (1 - Math.exp(-dt * 6));

    if (pointer.dirty) {
      pointer.dirty = false;
      const h = pointer.onCanvas && hits(pointer.x, pointer.y);
      if (h !== hovering) {
        hovering = h;
        canvas.style.cursor = h ? 'pointer' : '';
        if (!reduceMotion) gsap.to(fx, { tilt: h ? 0.1 : 0, duration: 0.3, overwrite: 'auto' });
      }
    }

    // if nobody has touched anything for a while, she does something small
    const now = performance.now();
    if (now > nextIdle) {
      nextIdle = now + rand(9000, 15000);
      if (now - lastAct > 7000 && rig.visible && live.avS > 0.5) play(pick(['nod', 'wave']));
    }
    placeBubble();
  }

  // ---------- ?debug tuning panel ----------
  if (new URLSearchParams(location.search).has('debug')) {
    const panel = document.createElement('pre');
    panel.id = 'debug';
    document.body.appendChild(panel);
    const AXES = ['x', 'y', 'z'];
    const show = () => {
      panel.textContent =
        `DEBUG  W wave | J jump | N nod | T twirl | X arm axis | F flip arm | [ ] arm raise\n` +
        `arm bone: ${avatar.hasArm ? 'found' : 'none (body wiggles)'}   head bone: ${avatar.hasHead ? 'found' : 'none'}\n` +
        `config.js ->  armAxis: '${avatar.tune.axis}',  armSign: ${avatar.tune.sign},  armRaise: ${avatar.tune.raise.toFixed(1)}`;
    };
    show();
    window.addEventListener('keydown', (e) => {
      if (/input|textarea/i.test(e.target.tagName)) return;
      const k = e.key.toLowerCase();
      if (k === 'w') (busy = false, play('wave'));
      else if (k === 'j') (busy = false, play('jump'));
      else if (k === 'n') (busy = false, play('nod'));
      else if (k === 't') (busy = false, play('twirl'));
      else if (k === 'x') avatar.tune.axis = AXES[(AXES.indexOf(avatar.tune.axis) + 1) % 3];
      else if (k === 'f') avatar.tune.sign *= -1;
      else if (k === '[') avatar.tune.raise = Math.max(0.2, avatar.tune.raise - 0.2);
      else if (k === ']') avatar.tune.raise = Math.min(3.4, avatar.tune.raise + 0.2);
      else return;
      show();
    });
  }

  return {
    update,
    say,
    play,
    greet: () => setTimeout(() => onSection(getActive()), 1300),
  };
}
