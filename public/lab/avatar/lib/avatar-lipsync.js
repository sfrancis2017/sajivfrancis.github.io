// avatar-lipsync.js — drive the mouth from audio. v1 maps the signal's loudness
// envelope to ARKit jaw/lip targets (works with any TTS that returns audio and
// no timings). The `mapping` option is the extension point: a viseme-timed
// mapping (from a TTS that returns word/phoneme timings) plugs in here without
// touching the rest. Engine-neutral; no site code.
//
//   const lips = createLipsync(avatar); lips.attach(audioEl);
//   stage.onTick((dt) => lips.tick(dt));
export function createLipsync(avatar, opts = {}) {
  const o = {
    gain: 2.2, floor: 0.02, attack: 28, release: 10, fftSize: 1024,
    // level ∈ [0,1] → target weights
    mapping: (level) => ({
      jawOpen: Math.min(1, level),
      mouthFunnel: Math.min(0.6, level * 0.35),
      mouthPucker: 0,
      mouthClose: 0,
      mouthSmileLeft: 0.04, mouthSmileRight: 0.04,
    }),
    ...opts,
  };
  let ctx = null, analyser = null, source = null, data = null, audio = null;
  let env = 0, speaking = false;

  return {
    options: o,
    get level() { return env; },
    get speaking() { return speaking; },
    attach(audioEl) {
      this.detach();
      audio = audioEl;
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      analyser = ctx.createAnalyser(); analyser.fftSize = o.fftSize; analyser.smoothingTimeConstant = 0.2;
      source = ctx.createMediaElementSource(audioEl);
      source.connect(analyser); analyser.connect(ctx.destination);
      data = new Float32Array(analyser.fftSize);
      audioEl.addEventListener('play', () => { speaking = true; ctx.resume(); });
      const stop = () => { speaking = false; };
      audioEl.addEventListener('pause', stop); audioEl.addEventListener('ended', stop);
      if (!audioEl.paused && !audioEl.ended) { speaking = true; ctx.resume(); } // attached mid-playback (e.g. the reader avatar loads after the clip starts)
    },
    detach() {
      try { source?.disconnect(); analyser?.disconnect(); } catch { /* ignore */ }
      source = analyser = null; audio = null; speaking = false; env = 0;
      for (const [k] of Object.entries(o.mapping(0))) avatar.set(k, 0);
    },
    tick(dt) {
      let level = 0;
      if (speaking && analyser) {
        analyser.getFloatTimeDomainData(data);
        let sum = 0; for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
        const rms = Math.sqrt(sum / data.length);
        level = Math.max(0, Math.min(1, (rms - o.floor) * o.gain));
      }
      const rate = level > env ? o.attack : o.release;
      env += (level - env) * Math.min(1, dt * rate);
      if (env < 0.001 && !speaking) { env = 0; }
      for (const [k, v] of Object.entries(o.mapping(env))) avatar.set(k, v);
    },
  };
}
