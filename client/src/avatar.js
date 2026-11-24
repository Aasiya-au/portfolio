import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CONFIG } from './config.js';

export function loadAvatar(manager, gradientMap) {
  return new Promise((resolve, reject) => {
    new GLTFLoader(manager).load(
      CONFIG.avatarPath,
      (gltf) => {
        const root = gltf.scene;

        // 1) normalise size, feet on the ground, centred
        const box = new THREE.Box3().setFromObject(root);
        root.scale.setScalar(CONFIG.avatarHeight / box.getSize(new THREE.Vector3()).y);
        const b2 = new THREE.Box3().setFromObject(root);
        const c = b2.getCenter(new THREE.Vector3());
        root.position.set(-c.x, -b2.min.y, -c.z);

        const holder = new THREE.Group(); // pivot at her feet
        holder.add(root);
        root.updateMatrixWorld(true);

        // 2) find bones + meshes, toon-ify
        let head = null;
        const armBones = [];
        const hitMeshes = [];
        root.traverse((o) => {
          if (o.isBone) {
            if (!head && CONFIG.headBoneHint.test(o.name)) head = o;
            else if (CONFIG.armBoneHint.test(o.name)) armBones.push(o);
          }
          if (!o.isMesh) return;
          hitMeshes.push(o);
          o.frustumCulled = false;
          if (!CONFIG.toon) return;
          const swap = (m) => {
            const t = new THREE.MeshToonMaterial({
              color: m.color ? m.color.clone() : 0xffffff,
              map: m.map || null,
              gradientMap,
              transparent: m.transparent,
              opacity: m.opacity,
              alphaTest: m.alphaTest,
              side: m.side,
              emissive: m.emissive ? m.emissive.clone() : 0x000000,
              emissiveMap: m.emissiveMap || null,
            });
            m.dispose();
            return t;
          };
          o.material = Array.isArray(o.material) ? o.material.map(swap) : swap(o.material);
        });

        // the arm used for waving: her right arm (viewer's left) if we can tell
        let wave = null, waveDir = 1;
        if (armBones.length) {
          const xs = armBones.map((b) => b.getWorldPosition(new THREE.Vector3()).x);
          const i = xs.indexOf(Math.min(...xs));
          wave = armBones[i];
          waveDir = xs[i] < 0 ? -1 : 1;
        }

        // 3) idle animation clip (if any) + which bones it drives
        let mixer = null;
        const animated = new Set();
        if (gltf.animations.length) {
          mixer = new THREE.AnimationMixer(root);
          const clip = gltf.animations.find((a) => CONFIG.idleClipHint.test(a.name)) || gltf.animations[0];
          clip.tracks.forEach((t) => animated.add(t.name.split('.')[0]));
          mixer.clipAction(clip).play();
        }

        // rest rotations, so we can add gestures on top without drifting
        const rest = new Map();
        [head, ...armBones].filter(Boolean).forEach((b) => rest.set(b, { x: b.rotation.x, y: b.rotation.y, z: b.rotation.z }));
        const drive = (bone, axis, delta) => {
          if (!bone) return;
          if (animated.has(bone.name)) bone.rotation[axis] += delta;
          else bone.rotation[axis] = rest.get(bone)[axis] + delta;
        };

        console.log('Animations:', gltf.animations.map((a) => a.name));
        console.log('Bones:', [head, ...armBones].filter(Boolean).map((b) => b.name));
        console.log('Head bone:', head ? head.name : 'not found (body will turn instead)');
        console.log('Wave arm:', wave ? wave.name : 'not found (whole body will wiggle instead)');

        // gesture values; reactions.js animates these with GSAP
        const fx = { jump: 0, squash: 0, spin: 0, tilt: 0, lean: 0, nod: 0, arm: 0 };
        const tune = { axis: CONFIG.armAxis, sign: CONFIG.armSign, raise: CONFIG.armRaise };
        let yaw = 0, headYaw = 0, headPitch = 0;

        function update(dt, mouse, t) {
          if (mixer) mixer.update(dt);

          if (CONFIG.followMouse) {
            yaw += (mouse.x * 0.35 - yaw) * 0.06;
            headYaw += (mouse.x * 0.5 - headYaw) * 0.08;
            headPitch += (mouse.y * 0.25 - headPitch) * 0.08;
          }
          drive(head, 'y', headYaw);
          drive(head, 'x', headPitch + fx.nod);

          if (wave) {
            const swing = Math.sin(t * 13) * 0.3 * fx.arm;
            drive(wave, tune.axis, tune.sign * waveDir * (tune.raise * fx.arm + swing));
          }

          const wiggle = wave ? 0 : Math.sin(t * 14) * 0.1 * fx.arm; // fallback if no arm bone
          holder.rotation.set(0, yaw + fx.spin, fx.tilt + fx.lean + wiggle);
          holder.position.y = (mixer ? 0 : Math.sin(t * 1.6) * 0.03) + fx.jump;
          const breathe = 1 + Math.sin(t * 1.8) * 0.008;
          holder.scale.set(1 + fx.squash * 0.06, (1 - fx.squash * 0.1) * breathe, 1 + fx.squash * 0.06);
        }

        resolve({ holder, root, update, fx, tune, hitMeshes, hasArm: !!wave, hasHead: !!head });
      },
      undefined,
      reject
    );
  });
}
