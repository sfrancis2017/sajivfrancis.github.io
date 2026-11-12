// avatar-talk.js — "talking" motion on top of idle + lip-sync: the head moves
// WITH the voice (sway scaled by speech energy, a small nod at the start of
// each phrase), brows lift on emphasis, and every few seconds the reader
// glances toward the text and back. In place only — the avatar never moves
// across the page. Runs after idle.tick and lips.tick in the same frame:
//
//   const talk = createTalk(avatar, lips, { glanceDir: -1 });
//   stage.onTick((dt, t) => { idle.tick(dt, t); lips.tick(dt); talk.tick(dt, t); });
//
// Pure functions of time + `lips.level`; every amplitude is an option.
import { Quaternion, Euler } from 'three';

const DEG = Math.PI / 180;
const rand = (a, b) => a + Math.random() * (b - a);
const smooth = (p) => (p <= 0 ? 0 : p >= 1 ? 1 : p * p * (3 - 2 * p));

export function createTalk(avatar, lips, opts = {}) {
  const o = {
    speakLevel: 0.04,                       // lips.level above this = speaking
    ease: 5,                                // blend in/out of the talking state (1/s)
    swayYawDeg: 2.4, swayPitchDeg: 1.5, swayRollDeg: 0.7, swaySpeed: 1.15,
    nodDeg: 3.0, nodDur: 0.38, nodSilence: 0.45, // nod when speech resumes after ≥ nodSilence s
    browLevel: 0.3, browMax: 0.42, browDecay: 3.2,
    glanceMin: 7, glanceMax: 13, glanceDur: 1.7, glanceYawDeg: 8, glancePitchDeg: -1.5,
    glanceDir: -1,                          // -1: text is to the LEFT of the seat (desktop sidebar); +1: right/above
    enabled: true,
    ...opts,
  };
  const q = new Quaternion(), e = new Euler();
  const seed = rand(0, 6.28);
  let talk = 0, silence = 10, nodT = -1, brow = 0, nextGlance = rand(o.glanceMin, o.glanceMax), glanceT = -1, lvl = 0;

  return {
    options: o,
    get active() { return talk > 0.5; },
    get level() { return lvl; },
    setEnabled(v) { o.enabled = v; if (!v) { avatar.set('browInnerUp', 0); avatar.set('browOuterUpLeft', 0); avatar.set('browOuterUpRight', 0); } },
    tick(dt, t) {
      if (!o.enabled) return;
      const level = lips?.level ?? 0; const speaking = level > o.speakLevel;
      lvl += (level - lvl) * Math.min(1, dt * 8);
      talk += ((speaking ? 1 : 0) - talk) * Math.min(1, dt * o.ease);
      // Phrase onset → a small nod.
      if (speaking && silence >= o.nodSilence && nodT < 0) nodT = 0;
      silence = speaking ? 0 : silence + dt;
      let pitch = 0, yaw = 0, roll = 0;
      if (nodT >= 0) { nodT += dt; const p = nodT / o.nodDur; pitch += o.nodDeg * Math.sin(Math.min(1, p) * Math.PI); if (p >= 1) nodT = -1; }
      // Sway with the voice: amplitude follows the smoothed energy.
      const amp = 0.35 + 0.65 * Math.min(1, lvl * 1.6);
      yaw += o.swayYawDeg * amp * (Math.sin(t * o.swaySpeed * 0.9 + seed) * 0.6 + Math.sin(t * o.swaySpeed * 2.3 + seed * 2) * 0.4);
      pitch += o.swayPitchDeg * amp * Math.sin(t * o.swaySpeed * 1.6 + seed * 3);
      roll += o.swayRollDeg * amp * Math.sin(t * o.swaySpeed * 0.7 + seed);
      // Glance toward the text and back, now and then, only while talking.
      if (talk > 0.5 && glanceT < 0) { nextGlance -= dt; if (nextGlance <= 0) { glanceT = 0; nextGlance = rand(o.glanceMin, o.glanceMax); } }
      let g = 0;
      if (glanceT >= 0) { glanceT += dt; const p = glanceT / o.glanceDur; g = p < 0.3 ? smooth(p / 0.3) : p < 0.7 ? 1 : smooth((1 - p) / 0.3); if (p >= 1) { glanceT = -1; g = 0; } }
      yaw += o.glanceDir * o.glanceYawDeg * g; pitch += o.glancePitchDeg * g;
      const eye = o.glanceDir * 0.5 * g; // eyes lead the head
      if (g > 0) { avatar.set('eyeLookOutLeft', Math.max(0, -eye)); avatar.set('eyeLookInLeft', Math.max(0, eye)); avatar.set('eyeLookInRight', Math.max(0, -eye)); avatar.set('eyeLookOutRight', Math.max(0, eye)); }
      // Brows on emphasis.
      if (level > o.browLevel) brow = Math.max(brow, ((level - o.browLevel) / (1 - o.browLevel)) * o.browMax);
      brow = Math.max(0, brow - dt * o.browDecay * brow - dt * 0.05);
      avatar.set('browInnerUp', brow); avatar.set('browOuterUpLeft', brow * 0.6); avatar.set('browOuterUpRight', brow * 0.6);
      // Apply on top of whatever idle set this frame (additive rotation).
      const head = avatar.bones?.head; if (!head) return;
      const k = talk; // fade the whole layer with the talking state
      e.set(pitch * DEG * k, yaw * DEG * k, roll * DEG * k);
      head.quaternion.multiply(q.setFromEuler(e));
    },
  };
}
