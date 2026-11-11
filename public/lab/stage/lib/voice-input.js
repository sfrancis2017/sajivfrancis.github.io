// Voice input (plan 10 step 4) — portable: turns speech into final transcripts
// with timing, through one of two engines, and reports speech onset so the
// host can barge in on playback.
//
//   const mic = createVoiceInput({ engine: 'webspeech' | 'vad', sttEndpoint, getToken,
//     onState, onPartial, onFinal, onSpeechStart, onError });
//   await mic.start(); mic.stop(); mic.simulateFinal('text');   // tests
//
// Engines:
//   webspeech — the browser's SpeechRecognition (Chrome: Google's recogniser,
//               Safari: Siri's). No backend, interim results, no audio leaves
//               the page's control. Not available in every browser.
//   vad       — @ricky0123/vad-web (WASM voice-activity detection) → 16 kHz WAV
//               → POST sttEndpoint (this site: the worker's /api/voice/stt
//               chain, Grok first). Works wherever getUserMedia works.
// onFinal(text, { engine, sttMs, speechEndAt, backend }) — sttMs is the gap
// between end of speech and the transcript (the number the harness logs).
// States: off → starting → listening ⇄ processing.

const ORT_SRC = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.14.0/dist/ort.js';
const VAD_SRC = 'https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.19/dist/bundle.min.js';

function loadScript(src) {
  return new Promise((res, rej) => {
    if ([...document.scripts].some((s) => s.src === src)) return res();
    const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error(`failed to load ${src}`)); document.head.appendChild(s);
  });
}

// Float32 mono → PCM16 WAV blob.
export function encodeWav(float32, sampleRate = 16000) {
  const pcm = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) { const s = Math.max(-1, Math.min(1, float32[i])); pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff; }
  const buf = new ArrayBuffer(44 + pcm.length * 2); const dv = new DataView(buf);
  const str = (off, txt) => { for (let j = 0; j < txt.length; j++) dv.setUint8(off + j, txt.charCodeAt(j)); };
  str(0, 'RIFF'); dv.setUint32(4, 36 + pcm.length * 2, true); str(8, 'WAVE');
  str(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
  dv.setUint32(24, sampleRate, true); dv.setUint32(28, sampleRate * 2, true); dv.setUint16(32, 2, true); dv.setUint16(34, 16, true);
  str(36, 'data'); dv.setUint32(40, pcm.length * 2, true);
  new Int16Array(buf, 44).set(pcm);
  return new Blob([buf], { type: 'audio/wav' });
}

export const WEBSPEECH_SUPPORTED = typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);

export function createVoiceInput({ engine = 'webspeech', lang = 'en-US', sttEndpoint = null, getToken = () => '', onState, onPartial, onFinal, onSpeechStart, onError, vadOptions = {} } = {}) {
  let state = 'off'; let active = false; let rec = null; let vad = null;
  const setState = (s) => { if (state !== s) { state = s; onState?.(s); } };
  const fail = (e) => { onError?.(e instanceof Error ? e : new Error(String(e))); };

  // ---- Web Speech -------------------------------------------------------------
  function startWebSpeech() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) throw new Error('SpeechRecognition not supported in this browser — use the vad engine');
    let speechEndAt = 0; let sawSpeech = false;
    const make = () => {
      const r = new SR(); r.lang = lang; r.continuous = true; r.interimResults = true; r.maxAlternatives = 1;
      r.onstart = () => setState('listening');
      r.onspeechstart = () => { sawSpeech = true; onSpeechStart?.(); };
      r.onspeechend = () => { speechEndAt = performance.now(); setState('processing'); };
      r.onresult = (ev) => {
        let interim = '';
        for (let i = ev.resultIndex; i < ev.results.length; i++) {
          const res = ev.results[i]; const text = res[0].transcript.trim();
          if (res.isFinal) {
            if (!text) continue;
            const now = performance.now(); const endAt = speechEndAt || now;
            onFinal?.(text, { engine: 'webspeech', sttMs: Math.max(0, Math.round(now - endAt)), speechEndAt: endAt, backend: 'browser' });
            speechEndAt = 0; sawSpeech = false; setState('listening');
          } else interim += text + ' ';
        }
        if (interim.trim()) { if (!sawSpeech) { sawSpeech = true; onSpeechStart?.(); } onPartial?.(interim.trim()); }
      };
      r.onerror = (ev) => {
        if (ev.error === 'no-speech' || ev.error === 'aborted') return; // benign; onend restarts
        if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') { active = false; setState('off'); }
        fail(new Error(`speech: ${ev.error}`));
      };
      r.onend = () => { if (active) { try { rec = make(); rec.start(); } catch (e) { fail(e); } } else setState('off'); };
      return r;
    };
    rec = make(); setState('starting'); rec.start();
  }

  // ---- VAD + STT route ------------------------------------------------------------
  async function startVad() {
    if (!window.vad?.MicVAD) { setState('starting'); await loadScript(ORT_SRC); await loadScript(VAD_SRC); }
    vad = await window.vad.MicVAD.new({
      positiveSpeechThreshold: 0.7, negativeSpeechThreshold: 0.45, minSpeechFrames: 4, preSpeechPadFrames: 8,
      additionalAudioConstraints: { echoCancellation: true, noiseSuppression: true },
      ...vadOptions,
      onSpeechStart: () => onSpeechStart?.(),
      onSpeechEnd: (audio) => transcribe(audio),
    });
    vad.start(); setState('listening');
  }
  async function transcribe(float32) {
    const speechEndAt = performance.now(); setState('processing');
    try {
      if (!sttEndpoint) throw new Error('no sttEndpoint for the vad engine');
      const token = await getToken();
      const r = await fetch(sttEndpoint, { method: 'POST', headers: { 'Content-Type': 'audio/wav', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: encodeWav(float32, 16000) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error || `stt ${r.status}`);
      const text = String(j?.text ?? '').trim();
      if (text) onFinal?.(text, { engine: 'vad', sttMs: Math.round(performance.now() - speechEndAt), speechEndAt, backend: j?.backend ?? 'stt', providerMs: j?.ms });
    } catch (e) { fail(e); }
    finally { if (active) setState('listening'); }
  }

  return {
    get state() { return state; },
    get engine() { return engine; },
    get active() { return active; },
    get supported() { return engine === 'webspeech' ? WEBSPEECH_SUPPORTED : !!(navigator.mediaDevices?.getUserMedia); },
    setEngine(e) { if (active) throw new Error('stop before switching engines'); engine = e; },
    async start() {
      if (active) return; active = true;
      try { if (engine === 'vad') await startVad(); else startWebSpeech(); }
      catch (e) { active = false; setState('off'); fail(e); throw e; }
    },
    stop() {
      active = false;
      if (rec) { try { rec.onend = null; rec.abort(); } catch {} rec = null; }
      if (vad) { try { vad.pause(); } catch {} }
      setState('off');
    },
    // Tests / typed fallback: feed a transcript through the same path.
    simulateSpeechStart() { onSpeechStart?.(); },
    simulateFinal(text, extra = {}) { const now = performance.now(); onFinal?.(String(text), { engine: 'sim', sttMs: 0, speechEndAt: now, backend: 'sim', ...extra }); },
  };
}
