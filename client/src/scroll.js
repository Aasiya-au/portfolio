import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import * as THREE from 'three';
import { SECTIONS, THEMES, stationPos } from './themes.js';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const rgb = (hex) => {
  const c = new THREE.Color(hex);
  return [c.r, c.g, c.b];
};

// "live" = what the 3D world is showing right now (camera, avatar, sky, lights, horror amount)
export const live = { horror: 0, night: 0 };

let states = [];
let active = -1;
export const getActive = () => Math.max(active, 0);
let tops = [];
const sections = SECTIONS.map((s) => document.getElementById(s.id));

// Every section becomes one flat object of numbers (a keyframe).
function toState(sec, wide) {
  const th = THEMES[sec.theme];
  const P = stationPos(sec.index);
  const av = wide ? sec.avatar : sec.index === 0 ? { x: 0, y: -0.35, s: 0.65 } : { x: 0, y: 0, s: 0 };
  const [t, m, b] = th.sky.map(rgb);
  const hs = rgb(th.hemi[0]), hg = rgb(th.hemi[1]), sn = rgb(th.sun[0]);
  return {
    cx: P.x, cy: 1.0, cz: P.z + 4.6,
    lx: P.x, ly: 1.0, lz: P.z,
    avX: av.x, avY: av.y, avS: av.s,
    tr: t[0], tg: t[1], tb: t[2],
    mr: m[0], mg: m[1], mb: m[2],
    br: b[0], bg: b[1], bb: b[2],
    hsr: hs[0], hsg: hs[1], hsb: hs[2],
    hgr: hg[0], hgg: hg[1], hgb: hg[2], hi: th.hemi[2],
    snr: sn[0], sng: sn[1], snb: sn[2], si: th.sun[1],
  };
}

function measure() {
  tops = sections.map((el) => el.getBoundingClientRect().top + window.scrollY);
}

const target = {};
function computeTarget() {
  const y = window.scrollY, vh = window.innerHeight;
  let i = 0;
  for (let k = 1; k < tops.length; k++) if (y >= tops[k] - vh) i = k;
  if (i === 0) return Object.assign(target, states[0]);
  const p = Math.min(Math.max((y - (tops[i] - vh)) / vh, 0), 1);
  const e = p * p * (3 - 2 * p); // smoothstep
  const a = states[i - 1], b = states[i];
  for (const k in b) target[k] = a[k] + (b[k] - a[k]) * e;
  return target;
}

// call every frame: eases `live` toward where the scroll position says it should be
export function updateLive(dt) {
  const tg = computeTarget();
  const k = reduceMotion ? 1 : 1 - Math.exp(-dt * 7);
  for (const key in tg) live[key] += (tg[key] - live[key]) * k;
}

export function setWide(wide) {
  states = SECTIONS.map((s) => toState(s, wide));
}

// ---- night (dark) mode ----
export function setNight(on, instant = false) {
  gsap.to(live, { night: on ? 1 : 0, duration: instant || reduceMotion ? 0 : 0.8, ease: 'power2.inOut', overwrite: 'auto' });
}

// ---- horror mode (Step 4 will trigger this from the Veil of Secrets card) ----
export function setHorror(on) {
  gsap.to(live, { horror: on ? 1 : 0, duration: on ? 0.9 : 1.4, ease: 'power2.out', overwrite: true });
}
// jump to a section from anywhere (chat citations use this)
window.addEventListener('portfolio:goto', (e) => {
  const i = SECTIONS.findIndex((s) => s.id === e.detail?.section);
  if (i < 0) return;
  gsap.to(window, { duration: reduceMotion ? 0 : 1.4, scrollTo: { y: sections[i], autoKill: true }, ease: 'power2.inOut' });
});
window.addEventListener('portfolio:horror', (e) => setHorror(!!e.detail));

export function initScroll(wide) {
  setWide(wide);
  measure();
  Object.assign(live, computeTarget()); // start exactly where the page is (even after a reload mid-page)
  ScrollTrigger.addEventListener('refresh', measure);
  window.addEventListener('load', () => ScrollTrigger.refresh());

  // nav dots: active state + smooth jump
  const links = [...document.querySelectorAll('#nav a')];
  const setActive = (i) => {
    if (i === active) return;
    active = i;
    links.forEach((a, k) => {
      a.classList.toggle('active', k === i);
      k === i ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current');
    });
    window.dispatchEvent(new CustomEvent('portfolio:section', { detail: { index: i, id: SECTIONS[i].id } }));
  };
  sections.forEach((el, i) =>
    ScrollTrigger.create({
      trigger: el,
      start: 'top center',
      end: 'bottom center',
      onToggle: (self) => self.isActive && setActive(i),
    })
  );
  const mid = window.scrollY + window.innerHeight / 2;
  let first = 0;
  tops.forEach((t, k) => { if (t <= mid) first = k; });
  setActive(first);
  links.forEach((a, i) =>
    a.addEventListener('click', (e) => {
      e.preventDefault();
      gsap.to(window, { duration: reduceMotion ? 0 : 1.4, scrollTo: { y: sections[i], autoKill: true }, ease: 'power2.inOut' });
    })
  );

  // fade the hint once she starts scrolling
  gsap.to('.hint', { opacity: 0, scrollTrigger: { trigger: '#home', start: 'top top', end: '+=250', scrub: true } });

}
