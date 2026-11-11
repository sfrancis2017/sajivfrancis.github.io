// avatar-loader.js — load a rigged GLB avatar and expose a small, engine-neutral
// control surface: named morph targets (ARKit-style), key bones, and a bounding
// box. No site-specific code; depends only on `three` (via an import map or a
// bundler). Portable: copy this folder into any project with three.js.
//
//   const avatar = await loadAvatar('/path/model.glb');
//   avatar.set('jawOpen', 0.4);         // drives every mesh that carries the target
//   avatar.bones.head.rotation.y = 0.1; // bones are three.js Object3D
//
// Supports meshopt (EXT_meshopt_compression) and Draco-compressed files.
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { Box3, Vector3 } from 'three';

const BONE_PATTERNS = {
  head: /(^|[:_])head$/i,
  neck: /(^|[:_])neck$/i,
  spine: /(^|[:_])spine2$/i,
  spineLow: /(^|[:_])spine$/i,
  leftEye: /(^|[:_])lefteye$/i,
  rightEye: /(^|[:_])righteye$/i,
};

export async function loadAvatar(url, { onProgress, dracoDecoderPath } = {}) {
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  if (dracoDecoderPath) {
    const { DRACOLoader } = await import('three/addons/loaders/DRACOLoader.js');
    const draco = new DRACOLoader();
    draco.setDecoderPath(dracoDecoderPath);
    loader.setDRACOLoader(draco);
  }
  const t0 = performance.now();
  let bytes = 0;
  const gltf = await new Promise((resolve, reject) =>
    loader.load(url, resolve, (ev) => { if (ev.total) bytes = ev.total; onProgress?.(ev); }, reject),
  );
  const loadMs = Math.round(performance.now() - t0);
  const root = gltf.scene;

  // Morph index: name → [{ mesh, index }] across every mesh carrying it.
  const morphs = new Map();
  const meshes = [];
  root.traverse((o) => {
    if (!o.isMesh) return;
    meshes.push(o);
    o.frustumCulled = false; // skinned meshes: bind-pose bounds lie
    if (o.morphTargetDictionary) {
      for (const [name, index] of Object.entries(o.morphTargetDictionary)) {
        if (!morphs.has(name)) morphs.set(name, []);
        morphs.get(name).push({ mesh: o, index });
      }
    }
  });

  const bones = {};
  root.traverse((o) => {
    if (!o.isBone && !o.isObject3D) return;
    for (const [key, re] of Object.entries(BONE_PATTERNS)) {
      if (!bones[key] && re.test(o.name)) bones[key] = o;
    }
  });
  if (!bones.spine) bones.spine = bones.spineLow;
  // Remember rest pose so behaviours can apply additive motion.
  const rest = {};
  for (const [k, b] of Object.entries(bones)) if (b) rest[k] = b.quaternion.clone();

  root.updateMatrixWorld(true);
  const bbox = new Box3().setFromObject(root);

  const values = {};
  return {
    root,
    gltf,
    meshes,
    bones,
    rest,
    bbox,
    stats: { bytes, loadMs, meshCount: meshes.length, morphCount: morphs.size, animations: gltf.animations.length },
    morphNames: [...morphs.keys()],
    has(name) { return morphs.has(name); },
    get(name) { return values[name] ?? 0; },
    set(name, v) {
      const list = morphs.get(name);
      if (!list) return false;
      const clamped = v < 0 ? 0 : v > 1 ? 1 : v;
      values[name] = clamped;
      for (const { mesh, index } of list) mesh.morphTargetInfluences[index] = clamped;
      return true;
    },
    reset() { for (const name of morphs.keys()) this.set(name, 0); },
    headWorldPosition() {
      const v = new Vector3();
      if (bones.head) bones.head.getWorldPosition(v); else bbox.getCenter(v);
      return v;
    },
  };
}
