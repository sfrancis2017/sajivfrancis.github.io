# Avatar lab modules

Plain ES modules, engine-neutral apart from `three` (resolved through an
import map or a bundler). Nothing in `lib/` knows about this site, so the
folder can be copied as-is into another project (e.g. Gravitite) when
licensed avatars arrive.

| Module | Responsibility | Depends on |
|---|---|---|
| `lib/avatar-loader.js` | Load a GLB (meshopt/Draco), index morph targets by name across meshes, find head/neck/spine/eye bones, expose `set(name, v)` | three, GLTFLoader |
| `lib/avatar-stage.js` | Scene, camera, portrait lighting, head framing, resize, tick loop | three, OrbitControls |
| `lib/avatar-idle.js` | Breathing, head sway, blinks, eye saccades (all amplitudes tunable) | avatar surface only |
| `lib/avatar-lipsync.js` | Audio → mouth targets. v1: loudness envelope → jaw/lips; `mapping` is the hook for viseme-timed TTS | WebAudio |
| `lib/voice-client.js` | TTS fetch with latency + cost metrics; endpoint and auth injected | fetch |

Requirements on the avatar asset: ARKit-style morph target names
(`jawOpen`, `eyeBlinkLeft`, `eyeLook*`, `mouth*`) and a humanoid rig with
bones named `Head`, `Neck`, `Spine*`, `LeftEye`, `RightEye` (Mixamo /
MetaPerson naming; the regexes in `avatar-loader.js` are the place to widen).

Composition example: `src/pages/tools/avatar-lab.astro`.

## Asset notes (`model.glb`)

- MetaPerson export, optimised with `gltf-transform optimize --compress meshopt
  --texture-compress webp --texture-size 1024` (14.3 MB → 2.36 MB; 51 ARKit
  targets and the 73-joint rig intact).
- The head's base-colour texture shipped with a blue tint across the neck
  (inherited from the source photo, visible in the unlit render too). It was
  repainted to the cheek skin tone with a cool-tint mask over the lower half of
  the texture before the optimise pass. Re-export from MetaPerson will need the
  same pass — check the neck in an unlit render first. Future licensed avatars
  should be checked the same way before they are accepted.
- Default framing in `avatar-stage.js` (`frameHead`) is head-and-shoulders
  (distance 0.95); 0.6 is a tight face crop.
