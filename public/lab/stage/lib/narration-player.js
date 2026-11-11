// Narration player (plan 10 §7) — portable: speaks a scene's narration line by
// line, prefetching audio ahead, and raises events the stage uses to move the
// focus and the avatar in time with the speech.
//
//   const player = createNarrationPlayer({ audioEl, speak, onLineStart, onLineEnd, onEnd, onMetrics });
//   await player.play(scene.narration);   // [{ id, text, focus }]
//   player.stop();                        // barge-in: cancels playback + prefetch
//
// `speak(text)` returns { audioUrl, ttfbMs, totalMs, provider } (voice-client)
// or is null → silent mode: lines advance on a reading-time timer so focus and
// presence can be exercised without a voice (demo/offline/tests).

export function createNarrationPlayer({ audioEl, speak = null, wordsPerSecond = 2.6, minLineMs = 900, prefetch = 2, onLineStart, onLineEnd, onEnd, onMetrics } = {}) {
  let run = 0; // increments on stop/play; stale loops exit
  let playing = false;
  let index = -1;

  const readingMs = (text) => Math.max(minLineMs, Math.round(((text.match(/\S+/g) || []).length / wordsPerSecond) * 1000));
  const sleep = (ms, myRun) => new Promise((res) => { const t = setTimeout(res, ms); const guard = setInterval(() => { if (run !== myRun) { clearTimeout(t); clearInterval(guard); res(); } }, 50); setTimeout(() => clearInterval(guard), ms + 60); });

  async function playAudio(url, myRun) {
    return new Promise((res) => {
      if (run !== myRun) return res('cancelled');
      const done = (why) => { audioEl.removeEventListener('ended', onEnded); audioEl.removeEventListener('error', onErr); res(why); };
      const onEnded = () => done('ended'); const onErr = () => done('error');
      audioEl.addEventListener('ended', onEnded); audioEl.addEventListener('error', onErr);
      audioEl.src = url;
      audioEl.play().catch(() => done('blocked'));
      const guard = setInterval(() => { if (run !== myRun) { clearInterval(guard); try { audioEl.pause(); } catch {} done('cancelled'); } }, 50);
      audioEl.addEventListener('ended', () => clearInterval(guard), { once: true });
    });
  }

  return {
    get playing() { return playing; },
    get index() { return index; },
    async play(lines) {
      const myRun = ++run; playing = true; index = -1;
      const t0 = performance.now();
      const fetches = new Map();
      const getAudio = (i) => { if (!speak || !lines[i]) return null; if (!fetches.has(i)) fetches.set(i, speak(lines[i].text).catch((e) => ({ error: e }))); return fetches.get(i); };
      for (let i = 0; i < lines.length; i++) {
        if (run !== myRun) break;
        index = i;
        for (let k = 1; k <= prefetch; k++) getAudio(i + k);
        const line = lines[i];
        const lt0 = performance.now();
        let audio = null;
        if (speak) { audio = await getAudio(i); if (run !== myRun) break; }
        onLineStart?.(i, line, { waitedMs: Math.round(performance.now() - lt0) });
        if (audio && audio.audioUrl) {
          onMetrics?.({ line: i, ttfbMs: audio.ttfbMs, totalMs: audio.totalMs, provider: audio.provider, waitedMs: Math.round(performance.now() - lt0), audioStartMs: Math.round(performance.now() - t0) });
          const why = await playAudio(audio.audioUrl, myRun);
          if (why === 'blocked' || why === 'error') await sleep(readingMs(line.text), myRun); // autoplay blocked → silent timing
        } else {
          if (audio?.error) onMetrics?.({ line: i, error: String(audio.error?.message || audio.error) });
          await sleep(readingMs(line.text), myRun);
        }
        if (run !== myRun) break;
        onLineEnd?.(i, line);
      }
      const finished = run === myRun;
      if (finished) { playing = false; onEnd?.({ totalMs: Math.round(performance.now() - t0), lines: lines.length }); }
      return finished;
    },
    stop() { run++; playing = false; try { audioEl.pause(); audioEl.currentTime = 0; } catch {} },
  };
}
