// avatar-stage.js — a three.js scene tuned for a head-and-shoulders avatar:
// renderer, camera, lights, framing, resize, and a tick loop that runs any
// number of behaviours (idle, lipsync, …). Engine-neutral; no site code.
//
//   const stage = createStage(containerEl);
//   stage.add(avatar.root); stage.frameHead(avatar);
//   stage.onTick((dt, t) => idle.tick(dt, t)); stage.start();
import {
  Scene, PerspectiveCamera, WebGLRenderer, HemisphereLight, DirectionalLight,
  Color, SRGBColorSpace, ACESFilmicToneMapping, Vector3, PCFSoftShadowMap,
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function createStage(container, { background = 0xf4f4f5, controls = true, pixelRatioCap = 2, transparent = false } = {}) {
  const scene = new Scene();
  if (!transparent) scene.background = new Color(background);
  const camera = new PerspectiveCamera(28, 1, 0.05, 50);
  const renderer = new WebGLRenderer({ antialias: true, alpha: transparent, powerPreference: 'high-performance' });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, pixelRatioCap));
  container.appendChild(renderer.domElement);

  // Three-point-ish portrait lighting.
  const hemi = new HemisphereLight(0xffffff, 0xb0b4bb, 0.9);
  const key = new DirectionalLight(0xffffff, 2.2); key.position.set(1.2, 2.2, 1.8); key.castShadow = true;
  const fill = new DirectionalLight(0xdfe7ff, 0.8); fill.position.set(-1.8, 1.2, 1.2);
  const rim = new DirectionalLight(0xffffff, 1.2); rim.position.set(0, 1.8, -2.2);
  scene.add(hemi, key, fill, rim);

  let orbit = null;
  if (controls) {
    orbit = new OrbitControls(camera, renderer.domElement);
    orbit.enableDamping = true; orbit.enablePan = false;
    orbit.minDistance = 0.3; orbit.maxDistance = 3;
  }

  function resize() {
    const w = container.clientWidth || 1, h = container.clientHeight || 1;
    camera.aspect = w / h; camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }
  const ro = new ResizeObserver(resize); ro.observe(container); resize();

  const ticks = new Set();
  let running = false, last = 0, frames = 0, fpsAt = 0, fps = 0;
  function loop(now) {
    if (!running) return;
    const t = now / 1000; const dt = last ? Math.min(0.1, t - last) : 0.016; last = t;
    for (const fn of ticks) fn(dt, t);
    orbit?.update();
    renderer.render(scene, camera);
    frames++; if (now - fpsAt > 1000) { fps = frames; frames = 0; fpsAt = now; }
    requestAnimationFrame(loop);
  }

  return {
    scene, camera, renderer, controls: orbit,
    add(obj) { scene.add(obj); },
    // Frame head-and-shoulders: camera in front of the head bone, slightly above eye line
    // (distance ≈ 0.6 is a tight face crop; 0.95 shows the shoulders).
    frameHead(avatar, { distance = 0.95, lift = 0.02, lookDown = 0.03 } = {}) {
      const head = avatar.headWorldPosition();
      camera.position.set(head.x, head.y + lift, head.z + distance);
      const target = new Vector3(head.x, head.y - lookDown, head.z);
      camera.lookAt(target);
      if (orbit) { orbit.target.copy(target); orbit.update(); }
    },
    onTick(fn) { ticks.add(fn); return () => ticks.delete(fn); },
    start() { if (!running) { running = true; last = 0; requestAnimationFrame(loop); } },
    stop() { running = false; },
    get fps() { return fps; },
    get drawCalls() { return renderer.info.render.calls; },
    dispose() { running = false; ro.disconnect(); orbit?.dispose(); renderer.dispose(); renderer.domElement.remove(); },
  };
}
