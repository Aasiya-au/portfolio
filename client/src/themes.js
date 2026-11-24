import * as THREE from 'three';

// Palette + lighting for each themed "island". Edit freely.
export const THEMES = {
  anime:   { sky: ['#a9dce8', '#d6f0ea', '#ffe9ef'], hemi: ['#dff6ff', '#ffd9e4', 1.4], sun: ['#fff3d6', 2.2] },
  sketch:  { sky: ['#cfdcff', '#eef2ff', '#fff3f8'], hemi: ['#ffffff', '#e8e0ff', 1.5], sun: ['#ffffff', 2.0] },
  manhwa:  { sky: ['#2f2b6b', '#5a4fb0', '#b9a7f5'], hemi: ['#cfc8ff', '#6a5aa8', 1.2], sun: ['#e9e2ff', 2.0] },
  arcade:  { sky: ['#12163a', '#2d2f7a', '#d86aa0'], hemi: ['#9aa6ff', '#3b2a5a', 1.1], sun: ['#ffd6f0', 1.8] },
  glam:    { sky: ['#ffb3c9', '#ffd6e2', '#fff2f5'], hemi: ['#fff0f4', '#ffb3c9', 1.5], sun: ['#fff6f0', 2.2] },
  credits: { sky: ['#070d1a', '#13223b', '#2c3f66'], hemi: ['#8fa8d8', '#1a2540', 0.9], sun: ['#ffe9b0', 1.6] },
  cafe:    { sky: ['#f4a98c', '#ffd2a8', '#fff0d2'], hemi: ['#fff0dc', '#ffc29a', 1.5], sun: ['#ffe2b8', 2.1] },
};

// Order here = order on the page = order of islands in 3D.
// content: which side the text card sits on. avatar: where she stands (camera space) and size (s=0 hides her).
export const SECTIONS = [
  { id: 'home',      label: 'Home',      theme: 'anime',   content: 'left',   avatar: { x: 1.1,  y: 0, s: 1 },    react: 'wave',  line: 'Hi! Welcome to my little world.' },
  { id: 'about',     label: 'About',     theme: 'sketch',  content: 'right',  avatar: { x: -1.2, y: 0, s: 1 },    react: 'nod',   line: 'This is my sketchbook corner.' },
  { id: 'skills',    label: 'Skills',    theme: 'manhwa',  content: 'left',   avatar: { x: 1.2,  y: 0, s: 0.95 }, react: 'jump',  line: 'Level up! My character sheet.' },
  { id: 'projects',  label: 'Projects',  theme: 'arcade',  content: 'wide',   avatar: { x: 0,    y: 0, s: 0 } },
  { id: 'animation', label: 'Animation', theme: 'glam',    content: 'right',  avatar: { x: -1.2, y: 0, s: 1 },    react: 'twirl', line: 'My very first After Effects project!' },
  { id: 'credits',   label: 'Education', theme: 'credits', content: 'center', avatar: { x: 0,    y: 0, s: 0 } },
  { id: 'contact',   label: 'Contact',   theme: 'cafe',    content: 'left',   avatar: { x: 1.2,  y: 0, s: 1 },    react: 'wave',  line: 'Come say hi!' },
];
SECTIONS.forEach((s, i) => (s.index = i));

// Where each island floats in the world (a gentle S-curve).
export const stationPos = (i) => new THREE.Vector3(i * 12, 0, Math.sin(i * 1.3) * 5);
