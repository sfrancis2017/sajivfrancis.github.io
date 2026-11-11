// avatar-idle.js — "alive" behaviours on top of the avatar control surface:
// breathing, gentle head sway, eye saccades and blinks. Pure functions of time;
// every amplitude is a tunable option so the same module fits any rig that
// exposes ARKit-style targets and head/spine bones. No site code.
//
//   const idle = createIdle(avatar); stage.onTick((dt, t) => idle.tick(dt, t));
import { Quaternion, Euler } from 'three';

const DEG = Math.PI / 180;
const rand = (a, b) => a + Math.random() * (b - a);

export function createIdle(avatar, opts = {}) {
  const o = {
    headYawDeg: 2.2, headPitchDeg: 1.1, headRollDeg: 0.6, headSpeed: 0.27,
    breathDeg: 0.6, breathHz: 0.22,
    blinkMin: 2.4, blinkMax: 6.0, blinkDur: 0.17,
    saccadeMin: 1.4, saccadeMax: 4.2, saccadeAmp: 0.35, saccadeEase: 9,
    enabled: true,
    ...opts,
  };
  const q = new Quaternion(), e = new Euler();
  let nextBlink = rand(o.blinkMin, o.blinkMax), blinkT = -1;
  let nextSaccade = rand(o.saccadeMin, o.saccadeMax);
  const look = { x: 0, y: 0 }, lookTarget = { x: 0, y: 0 };

  function applyLook() {
    const lx = look.x, ly = look.y; // x: left(−)/right(+), y: down(−)/up(+)
    avatar.set('eyeLookOutLeft', Math.max(0, -lx)); avatar.set('eyeLookInLeft', Math.max(0, lx));
    avatar.set('eyeLookInRight', Math.max(0, -lx)); avatar.set('eyeLookOutRight', Math.max(0, lx));
    avatar.set('eyeLookUpLeft', Math.max(0, ly)); avatar.set('eyeLookUpRight', Math.max(0, ly));
    avatar.set('eyeLookDownLeft', Math.max(0, -ly)); avatar.set('eyeLookDownRight', Math.max(0, -ly));
  }

  return {
    options: o,
    setEnabled(v) { o.enabled = v; if (!v) { avatar.set('eyeBlinkLeft', 0); avatar.set('eyeBlinkRight', 0); } },
    tick(dt, t) {
      if (!o.enabled) return;
      // Head sway (additive on the rest pose).
      const { head, spine } = avatar.bones; const rest = avatar.rest;
      if (head && rest.head) {
        e.set(
          o.headPitchDeg * DEG * Math.sin(t * o.headSpeed * 1.7 + 1.3),
          o.headYawDeg * DEG * (Math.sin(t * o.headSpeed) * 0.7 + Math.sin(t * o.headSpeed * 2.6) * 0.3),
          o.headRollDeg * DEG * Math.sin(t * o.headSpeed * 0.8 + 0.4),
        );
        head.quaternion.copy(rest.head).multiply(q.setFromEuler(e));
      }
      if (spine && rest.spine) {
        e.set(o.breathDeg * DEG * Math.sin(t * o.breathHz * Math.PI * 2), 0, 0);
        spine.quaternion.copy(rest.spine).multiply(q.setFromEuler(e));
      }
      // Blink.
      nextBlink -= dt;
      if (nextBlink <= 0 && blinkT < 0) { blinkT = 0; nextBlink = rand(o.blinkMin, o.blinkMax); }
      if (blinkT >= 0) {
        blinkT += dt; const p = blinkT / o.blinkDur;
        const v = p >= 1 ? 0 : Math.sin(Math.min(1, p) * Math.PI);
        avatar.set('eyeBlinkLeft', v); avatar.set('eyeBlinkRight', v);
        if (p >= 1) blinkT = -1;
      }
      // Saccades: pick a new small gaze target now and then, ease toward it.
      nextSaccade -= dt;
      if (nextSaccade <= 0) {
        lookTarget.x = rand(-o.saccadeAmp, o.saccadeAmp); lookTarget.y = rand(-o.saccadeAmp * 0.5, o.saccadeAmp * 0.5);
        if (Math.random() < 0.35) { lookTarget.x *= 0.2; lookTarget.y *= 0.2; } // often re-centre
        nextSaccade = rand(o.saccadeMin, o.saccadeMax);
      }
      const k = Math.min(1, dt * o.saccadeEase);
      look.x += (lookTarget.x - look.x) * k; look.y += (lookTarget.y - look.y) * k;
      applyLook();
    },
  };
}
