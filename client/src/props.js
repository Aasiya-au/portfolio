import * as THREE from 'three';

const rand = (a, b) => a + Math.random() * (b - a);

// floating island: grass-like top + hanging cone underneath
function island(M, topColor, underColor) {
  const g = new THREE.Group();
  const top = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 5.2, 0.4, 48), M(topColor));
  top.position.y = -0.28; // top surface sits at y = -0.08
  const under = new THREE.Mesh(new THREE.ConeGeometry(5.2, 3.2, 40), M(underColor));
  under.rotation.x = Math.PI;
  under.position.y = -2.08;
  g.add(top, under);
  return g;
}

// small round platform that travels with the avatar
export function buildPlatform(M) {
  const g = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.35, 0.1, 40), M('#ffd6e8'));
  disc.position.y = -0.05;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.025, 8, 64), new THREE.MeshBasicMaterial({ color: 0x1f2d3a }));
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.003;
  g.add(disc, ring);
  return g;
}

// ---------- 1. HOME: cute anime sky ----------
export function buildAnime(M, lite = false) {
  const g = new THREE.Group();
  g.add(island(M, '#bfe8d8', '#8cc7b5'));

  const cloudMat = M('#ffffff');
  const clouds = [];
  [[-3.2, 2.6, -3], [3.6, 3.2, -4], [-1.2, 4.2, -6], [5, 1.6, -5]].forEach(([x, y, z], i) => {
    const c = new THREE.Group();
    [[0, 0, 0, 0.55], [0.55, -0.1, 0, 0.42], [-0.55, -0.12, 0, 0.4], [0.15, 0.3, 0, 0.38]].forEach(([dx, dy, dz, r]) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), cloudMat);
      m.position.set(dx, dy, dz);
      c.add(m);
    });
    c.position.set(x, y, z);
    c.userData = { baseY: y, speed: 0.25 + i * 0.07, phase: i * 1.7 };
    g.add(c);
    clouds.push(c);
  });

  const COUNT = lite ? 50 : 140;
  const pos = new Float32Array(COUNT * 3);
  const seed = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    pos[i * 3] = rand(-6, 6);
    pos[i * 3 + 1] = rand(-1, 6);
    pos[i * 3 + 2] = rand(-5, 3);
    seed[i] = Math.random() * Math.PI * 2;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xff9fbe, size: 0.09, transparent: true, opacity: 0.9, depthWrite: false })));

  return {
    group: g,
    update(t, dt) {
      clouds.forEach((c) => {
        c.position.y = c.userData.baseY + Math.sin(t * c.userData.speed + c.userData.phase) * 0.15;
        c.position.x += dt * 0.05;
        if (c.position.x > 7) c.position.x = -7;
      });
      const p = geo.attributes.position;
      for (let i = 0; i < COUNT; i++) {
        p.array[i * 3 + 1] -= dt * 0.35;
        p.array[i * 3] += Math.sin(t + seed[i]) * dt * 0.25;
        if (p.array[i * 3 + 1] < -1) p.array[i * 3 + 1] = 6;
      }
      p.needsUpdate = true;
    },
  };
}

// ---------- 2. ABOUT: cartoon sketchbook ----------
export function buildSketch(M) {
  const g = new THREE.Group();
  g.add(island(M, '#e4e8ff', '#b7bff0'));

  // open sketchbook
  const book = new THREE.Group();
  const cover = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.08, 1.2), M('#ff9fbe'));
  const pageL = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.05, 1.1), M('#ffffff'));
  pageL.position.set(-0.4, 0.065, 0);
  const pageR = pageL.clone();
  pageR.position.x = 0.4;
  book.add(cover, pageL, pageR);
  book.position.set(-2.8, 0.6, -2.2);
  book.rotation.set(-0.5, 0.5, 0.15);
  g.add(book);

  // floating pencils
  const pencils = [];
  ['#ffe08a', '#ff9fbe', '#9fd8ff', '#bfe8d8'].forEach((c, i) => {
    const p = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1, 6), M(c));
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.18, 6), M('#f2d3a8'));
    tip.position.y = -0.59;
    tip.rotation.x = Math.PI;
    const eraser = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.1, 6), M('#e57a9a'));
    eraser.position.y = 0.55;
    p.add(body, tip, eraser);
    const [x, y, z] = [[2.8, 1.6, -2.5], [3.8, 2.6, -3.5], [-1.4, 2.8, -4], [1.2, 3.5, -5]][i];
    p.position.set(x, y, z);
    p.rotation.z = rand(-0.9, 0.9);
    p.userData = { baseY: y, phase: i * 1.4 };
    g.add(p);
    pencils.push(p);
  });

  // a few small doughnuts, kept in the background
  const doughMat = M('#e8a96a');
  const donuts = [];
  [[-3.8, 3.0, -4], [4.3, 0.9, -3.2], [0.4, 1.1, -4.6]].forEach(([x, y, z], i) => {
    const d = new THREE.Group();
    const dough = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.11, 14, 32), doughMat);
    const icing = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.115, 14, 32), M(['#ff9fbe', '#7a4a35', '#bfe8d8'][i]));
    icing.scale.set(1, 1, 0.55);
    icing.position.z = 0.045;
    d.add(dough, icing);
    d.scale.setScalar(0.7);
    d.position.set(x, y, z);
    d.userData = { baseY: y, phase: i * 1.3 };
    g.add(d);
    donuts.push(d);
  });

  return {
    group: g,
    update(t) {
      book.position.y = 0.6 + Math.sin(t * 0.9) * 0.08;
      pencils.forEach((p) => {
        p.position.y = p.userData.baseY + Math.sin(t * 0.8 + p.userData.phase) * 0.15;
        p.rotation.y += 0.004;
      });
      donuts.forEach((d) => {
        d.rotation.x += 0.004;
        d.rotation.y += 0.003;
        d.position.y = d.userData.baseY + Math.sin(t * 0.8 + d.userData.phase) * 0.18;
      });
    },
  };
}

// ---------- 3. SKILLS: manhwa panels ----------
export function buildManhwa(M) {
  const g = new THREE.Group();
  g.add(island(M, '#8b7fe0', '#5f55b0'));
  const panels = [];
  const specs = [
    [-3.2, 1.3, -2.2, 1.0, 1.7], [-1.6, 2.2, -3.6, 1.2, 1.5], [0.3, 1.1, -4.5, 1.4, 2.0],
    [2.4, 1.8, -3.2, 1.0, 1.8], [3.9, 0.9, -2.0, 1.1, 1.5], [-0.4, 3.5, -6, 1.6, 1.2],
  ];
  const colors = ['#ffffff', '#ffd6e8', '#d6f0ff'];
  specs.forEach(([x, y, z, w, h], i) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.06), M(colors[i % 3]));
    m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), new THREE.LineBasicMaterial({ color: 0x1f2d3a })));
    m.position.set(x, y, z);
    m.rotation.y = rand(-0.4, 0.4);
    m.userData = { baseY: y, phase: i * 1.1 };
    g.add(m);
    panels.push(m);
  });
  return {
    group: g,
    update(t) {
      panels.forEach((p) => {
        p.position.y = p.userData.baseY + Math.sin(t * 0.7 + p.userData.phase) * 0.18;
        p.rotation.y += Math.sin(t * 0.3 + p.userData.phase) * 0.0015;
      });
    },
  };
}

// ---------- 4. PROJECTS: arcade (reacts to horror mode) ----------
function cabinet(M, bodyColor, screenColor) {
  const c = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(1, 1.9, 0.85), M(bodyColor));
  body.position.y = 0.95;
  const marquee = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.28, 0.9), M('#ffe08a'));
  marquee.position.y = 1.95;
  const screenMat = new THREE.MeshBasicMaterial({ color: screenColor });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.78, 0.7), screenMat);
  screen.position.set(0, 1.35, 0.43);
  screen.rotation.x = -0.12;
  const panel = new THREE.Mesh(new THREE.BoxGeometry(1, 0.1, 0.5), M('#2a2f5a'));
  panel.position.set(0, 0.88, 0.5);
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.2, 8), M('#ffffff'));
  stick.position.set(-0.22, 1.0, 0.5);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 10), M('#ff6f91'));
  ball.position.set(-0.22, 1.12, 0.5);
  const b1 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 12), M('#ffe08a'));
  b1.position.set(0.1, 0.95, 0.52);
  const b2 = b1.clone();
  b2.position.x = 0.28;
  c.add(body, marquee, screen, panel, stick, ball, b1, b2);
  return { group: c, screenMat, base: new THREE.Color(screenColor) };
}

export function buildArcade(M, lite = false) {
  const g = new THREE.Group();
  g.add(island(M, '#4a4fa8', '#2c2f6e'));
  const cabs = [
    [-3.4, -2.4, 0.45, '#ff6f91', '#7fe3d4'], [-1.1, -4.2, 0.1, '#6fa8ff', '#ffe08a'],
    [1.3, -4.2, -0.1, '#9b7fe0', '#ff9fbe'], [3.6, -2.4, -0.45, '#4ad0b0', '#9fd8ff'],
  ].map(([x, z, ry, body, screen]) => {
    const c = cabinet(M, body, screen);
    c.group.position.set(x, 0, z);
    c.group.rotation.y = ry;
    g.add(c.group);
    return c;
  });
  const cubes = [];
  for (let i = 0; i < (lite ? 4 : 9); i++) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.16), M(['#ffe08a', '#ff9fbe', '#7fe3d4'][i % 3]));
    m.position.set(rand(-4.5, 4.5), rand(1.5, 4.2), rand(-5, -1));
    m.userData = { baseY: m.position.y, phase: rand(0, 6) };
    g.add(m);
    cubes.push(m);
  }
  const red = new THREE.Color('#5a0a12');
  return {
    group: g,
    update(t, dt, live) {
      const h = live.horror || 0;
      cabs.forEach((c, i) => {
        c.screenMat.color.copy(c.base).lerp(red, h);
        if (h > 0.5 && Math.sin(t * 23 + i * 5) > 0.92) c.screenMat.color.setRGB(0.02, 0.0, 0.0);
      });
      cubes.forEach((m) => {
        m.rotation.x += 0.01;
        m.rotation.y += 0.012;
        m.position.y = m.userData.baseY + Math.sin(t + m.userData.phase) * 0.15;
      });
    },
  };
}

// ---------- 5. ANIMATION: lipstick / glam ----------
function lipstick(M, bulletColor, scale) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.55, 28), M('#2b2230'));
  body.position.y = 0.275;
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.255, 0.255, 0.1, 28), M('#e8c36a'));
  ring.position.y = 0.6;
  const geo = new THREE.CylinderGeometry(0.2, 0.2, 0.7, 28);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    if (pos.getY(i) > 0) pos.setY(i, pos.getY(i) + pos.getX(i) * 0.5); // slanted tip
  }
  geo.computeVertexNormals();
  const bullet = new THREE.Mesh(geo, M(bulletColor));
  bullet.position.y = 1.0;
  g.add(body, ring, bullet);
  g.scale.setScalar(scale);
  return g;
}

export function buildGlam(M, lite = false) {
  const g = new THREE.Group();
  g.add(island(M, '#ffb3c7', '#e8829f'));
  [[-3.6, -2.5, '#d4143c', 1.6], [2.8, -3, '#ff6f91', 1.3], [0.6, -5, '#8f1738', 1.9], [4.2, -1.5, '#ff9fbe', 1.1]].forEach(
    ([x, z, c, s]) => {
      const l = lipstick(M, c, s);
      l.position.set(x, 0, z);
      l.rotation.y = rand(-0.5, 0.5);
      g.add(l);
    }
  );
  const sparkles = [];
  const goldMat = new THREE.MeshBasicMaterial({ color: 0xffe08a });
  for (let i = 0; i < (lite ? 6 : 16); i++) {
    const m = new THREE.Mesh(new THREE.OctahedronGeometry(rand(0.06, 0.12)), goldMat);
    m.position.set(rand(-5, 5), rand(0.6, 4.2), rand(-5.5, -0.5));
    m.userData = { baseY: m.position.y, phase: rand(0, 6) };
    g.add(m);
    sparkles.push(m);
  }
  return {
    group: g,
    update(t) {
      sparkles.forEach((m) => {
        m.rotation.y += 0.03;
        m.position.y = m.userData.baseY + Math.sin(t * 1.2 + m.userData.phase) * 0.2;
        m.scale.setScalar(0.8 + Math.sin(t * 2 + m.userData.phase) * 0.3);
      });
    },
  };
}

// ---------- 6. EDUCATION: end-credits night ----------
function starGeo(outer = 0.4, inner = 0.18) {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? inner : outer;
    const a = Math.PI / 2 + (i * Math.PI) / 5;
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    i ? s.lineTo(x, y) : s.moveTo(x, y);
  }
  s.closePath();
  return new THREE.ExtrudeGeometry(s, { depth: 0.1, bevelEnabled: false });
}

export function buildCredits(M, lite = false) {
  const g = new THREE.Group();
  g.add(island(M, '#33486e', '#1f2d4a'));

  const N = lite ? 120 : 320;
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    pos[i * 3] = rand(-14, 14);
    pos[i * 3 + 1] = rand(0.5, 9);
    pos[i * 3 + 2] = rand(-12, -3);
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 0.08, transparent: true, opacity: 0.9 }));
  g.add(stars);

  const gold = M('#e8c36a');
  const golds = [];
  [[-3.4, 1.6, -2.5], [3.2, 2.2, -3], [-1.2, 3.4, -5], [1.6, 1.2, -4.5], [4.4, 3.4, -5.5]].forEach(([x, y, z], i) => {
    const s = new THREE.Mesh(starGeo(), gold);
    s.position.set(x, y, z);
    s.userData = { baseY: y, phase: i * 1.2 };
    g.add(s);
    golds.push(s);
  });

  const beam = new THREE.Mesh(
    new THREE.ConeGeometry(2.4, 7, 32, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xfff6d0, transparent: true, opacity: 0.1, side: THREE.DoubleSide, depthWrite: false })
  );
  beam.position.set(0, 3.5, -3);
  g.add(beam);

  return {
    group: g,
    update(t) {
      stars.rotation.z = Math.sin(t * 0.05) * 0.02;
      golds.forEach((s) => {
        s.rotation.y += 0.01;
        s.position.y = s.userData.baseY + Math.sin(t * 0.9 + s.userData.phase) * 0.15;
      });
    },
  };
}

// ---------- 7. CONTACT: cosy cafe ----------
export function buildCafe(M) {
  const g = new THREE.Group();
  g.add(island(M, '#f2c28e', '#c98f5e'));

  // pancake stack
  const stack = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.75 - i * 0.015, 0.75, 0.16, 32), M('#e8b87a'));
    p.position.set(Math.sin(i * 2) * 0.03, 0.08 + i * 0.17, 0);
    stack.add(p);
  }
  const syrup = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.6, 0.06, 32), M('#8a4b24'));
  syrup.position.y = 0.9;
  const butter = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.14, 0.24), M('#ffe08a'));
  butter.position.set(0, 1.0, 0);
  butter.rotation.y = 0.5;
  stack.add(syrup, butter);
  stack.position.set(-2.0, 0, -2.2);
  g.add(stack);

  // waffle
  const waffle = new THREE.Group();
  const wb = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.14, 1.1), M('#e0a458'));
  wb.position.y = 0.07;
  waffle.add(wb);
  for (let i = -1; i <= 1; i++) {
    const a = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 1.1), M('#b9763a'));
    a.position.set(i * 0.3, 0.15, 0);
    const b = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.03, 0.04), M('#b9763a'));
    b.position.set(0, 0.15, i * 0.3);
    waffle.add(a, b);
  }
  waffle.position.set(0.5, 0, -3.4);
  waffle.rotation.y = 0.35;
  g.add(waffle);

  // coffee cup
  const cup = new THREE.Group();
  const saucer = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.5, 0.04, 28), M('#ffffff'));
  saucer.position.y = 0.02;
  const cb = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.3, 0.5, 28), M('#ffffff'));
  cb.position.y = 0.3;
  const coffee = new THREE.Mesh(new THREE.CircleGeometry(0.34, 28), M('#5b3320'));
  coffee.rotation.x = -Math.PI / 2;
  coffee.position.y = 0.55;
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.04, 8, 20), M('#ffffff'));
  handle.position.set(0.42, 0.32, 0);
  cup.add(saucer, cb, coffee, handle);
  cup.position.set(2.5, 0, -2.2);
  g.add(cup);

  // string lights
  const bulbs = [];
  const pts = [];
  const warm = ['#ffe08a', '#ffb3c9', '#fff3d6'];
  for (let k = 0; k <= 14; k++) {
    const t = k / 14;
    const x = -4.6 + 9.2 * t, y = 3.7 - 1.0 * Math.sin(Math.PI * t), z = -4.2;
    pts.push(new THREE.Vector3(x, y, z));
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), new THREE.MeshBasicMaterial({ color: warm[k % 3] }));
    b.position.set(x, y - 0.08, z);
    g.add(b);
    bulbs.push(b);
  }
  g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x1f2d3a })));

  return {
    group: g,
    update(t) {
      bulbs.forEach((b, i) => b.scale.setScalar(1 + Math.sin(t * 2.2 + i) * 0.25));
    },
  };
}
