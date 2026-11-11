// voice-client.js — minimal TTS client with timing + cost metrics. Endpoint
// and auth are injected, so the same module talks to any speech backend that
// returns an audio body (this site: the chat worker's /api/voice/tts, which
// streams MP3 and reports provider latency in X-Voice-Ms). No site code.
//
//   const voice = createVoiceClient({ endpoint, getToken });
//   const r = await voice.speak('Hello'); audioEl.src = r.audioUrl;
export function createVoiceClient({ endpoint, getToken, pricePerMillionChars = { grok: 4.2, aura: 0 } }) {
  return {
    async speak(text, { voice } = {}) {
      const token = typeof getToken === 'function' ? await getToken() : getToken;
      const t0 = performance.now();
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ text, ...(voice ? { voice } : {}) }),
      });
      const ttfbMs = Math.round(performance.now() - t0);
      if (!res.ok) {
        const detail = await res.text().catch(() => '');
        const err = new Error(`TTS ${res.status}: ${detail.slice(0, 160)}`); err.status = res.status; throw err;
      }
      const blob = await res.blob();
      const totalMs = Math.round(performance.now() - t0);
      const provider = res.headers.get('X-Voice-Provider') || 'unknown';
      const providerMs = Number(res.headers.get('X-Voice-Ms') || 0);
      const chars = text.length;
      const price = pricePerMillionChars[provider] ?? 0;
      return {
        audioUrl: URL.createObjectURL(blob), blob, bytes: blob.size, chars,
        ttfbMs, totalMs, providerMs, provider,
        estCostUsd: (chars / 1e6) * price,
      };
    },
  };
}
