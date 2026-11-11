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
