import * as THREE from 'three';
import { SECTIONS, stationPos } from './themes.js';
import * as P from './props.js';

// 3-band gradient texture = the "cel shading" look
export function makeGradientMap(steps = 3) {
  const data = new Uint8Array(steps);
  for (let i = 0; i < steps; i++) data[i] = Math.round(70 + (185 * i) / (steps - 1));
  const tex = new THREE.DataTexture(data, steps, 1, THREE.RedFormat);
  tex.minFilter = tex.magFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

const BUILDERS = {
  anime: P.buildAnime,
  sketch: P.buildSketch,
  manhwa: P.buildManhwa,
  arcade: P.buildArcade,
  glam: P.buildGlam,
  credits: P.buildCredits,
  cafe: P.buildCafe,
};

const lin = (h) => {
  const c = new THREE.Color(h);
  return [c.r, c.g, c.b];
};
const DARK = ['#07070c', '#150a10', '#2a0c10'].map(lin); // horror mode
const NIGHT = ['#0b1024', '#141a3a', '#232a55'].map(lin); // night (dark) mode
const BLOOD = new THREE.Color('#ff3a2a');

export function createWorld(scene, gradientMap, { lite = false } = {}) {
  const M = (color, extra = {}) => new THREE.MeshToonMaterial({ color, gradientMap, ...extra });

  const hemi = new THREE.HemisphereLight(0xffffff, 0xffffff, 1.4);
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  scene.add(hemi, sun, sun.target);

  const stations = SECTIONS.map((sec) => {
    const s = BUILDERS[sec.theme](M, lite);
    const pos = stationPos(sec.index);
    s.group.position.copy(pos);
    s.x = pos.x;
    scene.add(s.group);
    return s;
  });

  const css = document.documentElement.style;
  const cache = {};
  const tmp = new THREE.Color();
  // blend the base sky colour toward the night colour, then toward the horror colour
  const setSky = (name, base, night, n, dark, h) => {
    const r = base[0] + (night[0] - base[0]) * n, g = base[1] + (night[1] - base[1]) * n, b = base[2] + (night[2] - base[2]) * n;
    tmp.setRGB(r + (dark[0] - r) * h, g + (dark[1] - g) * h, b + (dark[2] - b) * h);
    const s = tmp.getStyle();
    if (cache[name] !== s) {
      css.setProperty(name, s);
      cache[name] = s;
    }
  };
  const vignette = document.querySelector('#vignette');
  const swayRef = { x: 0 };

  return {
    M,
    apply(live, t) {
      const h = (live.horror || 0) * 0.9;
      const n = (live.night || 0) * 0.7;
      setSky('--sky-top', [live.tr, live.tg, live.tb], NIGHT[0], n, DARK[0], h);
      setSky('--sky-mid', [live.mr, live.mg, live.mb], NIGHT[1], n, DARK[1], h);
      setSky('--sky-low', [live.br, live.bg, live.bb], NIGHT[2], n, DARK[2], h);

      const hz = live.horror || 0;
      const nt = live.night || 0;
      hemi.color.setRGB(live.hsr, live.hsg, live.hsb);
      hemi.groundColor.setRGB(live.hgr, live.hgg, live.hgb);
      hemi.intensity = live.hi * (1 - 0.35 * nt) * (1 - 0.72 * hz);

      sun.color.setRGB(live.snr, live.sng, live.snb).lerp(BLOOD, hz * 0.55);
      const flicker = hz > 0.4 && Math.sin(t * 37) * Math.sin(t * 11.3) > 0.85 ? 0.25 : 1;
      sun.intensity = live.si * (1 - 0.4 * nt) * (1 - 0.78 * hz) * flicker;
      sun.position.set(live.cx + 3, 5, live.cz + 4);
      sun.target.position.set(live.lx, 0.5, live.lz);

      if (vignette) vignette.style.opacity = String(hz);
    },
    update(t, dt, live, mouse) {
      swayRef.x += ((mouse?.x || 0) - swayRef.x) * 0.04;
      stations.forEach((s) => {
        const near = Math.abs(s.x - live.cx) < 16;
        s.group.visible = near;
        if (near) {
          s.group.rotation.y = swayRef.x * 0.05; // props drift gently with the mouse
          s.update?.(t, dt, live);
        }
      });
    },
  };
}
