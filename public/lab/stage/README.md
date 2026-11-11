# Companion stage — portable modules (plan 10)

The stage is one screen: a question in (voice or typed), a **scene** out
(layout + data + narration), the avatar seated beside whatever is being
narrated. These modules carry no site-specific code; the page in
`src/pages/tools/stage.astro` composes them and supplies the endpoints.

| Module | Role | Entry points |
|---|---|---|
| `stage-render.js` | Scene → DOM for the 8 layouts (kpi-tiles, list, table, chart, diagram-walkthrough, outline, compare, narrative-only). Charts are SVG with nice ticks and horizontal bars for many/long categories; mermaid diagrams render lazily. | `renderScene(container, scene) → { elements, focus(id) }`, `LAYOUTS`, `STAGE_CSS` |
| `avatar-presence.js` | Seats the avatar layer beside the narrated element from live geometry: never covers the subject, translucent only while overlapping other content, sizes s/m/l animated between, phone mode seats it under the subject via a spacer. | `createPresence(layerEl, stageEl, { home }) → { setSize, moveTo, update, candidates, dispose }`, `PRESENCE_CSS` |
| `narration-player.js` | Speaks `scene.narration` line by line (two lines of TTS prefetched), raises `onLineStart` so focus and presence move with the voice, `stop()` is the barge-in. A line may carry its own `audio` (e.g. the streamed first line). No `speak` → silent reading-time mode for demos and tests. | `createNarrationPlayer({ audioEl, speak, onLineStart, onLineEnd, onEnd, onMetrics }) → { play(lines), stop() }` |
| `voice-input.js` | Speech → final transcripts with timing. Engines: `webspeech` (browser SpeechRecognition, no backend) or `vad` (vad-web voice-activity detection → 16 kHz WAV → an STT endpoint). `onSpeechStart` lets the host barge in on playback. `simulateFinal()` feeds a transcript through the same path (typed fallback, tests). | `createVoiceInput({ engine, sttEndpoint, getToken, onFinal, onPartial, onSpeechStart, onState, onError }) → { start, stop, setEngine, simulateFinal }`, `encodeWav`, `WEBSPEECH_SUPPORTED` |
| `stage-metrics.js` | The §8 harness: one record per turn timed from END OF SPEECH (stt, filler audible, line 1 audible, scene on screen, worker split, tokens, cost), persisted locally, CSV export, p50/p90 summary against the thresholds (audible ≤ 1.5 s, scene ≤ 4 s). | `createTurnLog({ thresholds }) → { add, update, clear, summary, csv, render }`, `COLUMNS`, `METRICS_CSS` |

## Scene contract

See plan 10 §4 (personal-chat `plans/10-companion-stage-prototype.md`) and
`SCENE_SCHEMA` / `validateScene` in the worker's `src/stage.ts`. Sample scenes
for every layout are in `samples/` (saved from live turns; `index.json` lists
them) and drive the page's **Samples** button without an API.

## The turn (what the page does with these)

1. `voice-input` → final transcript (`speechEndAt` is t₀ for every number).
2. A prefetched filler phrase plays at once (audible within the budget).
3. `POST /api/stage/turn` with `Accept: text/event-stream`: `status` events,
   then `line` (the first narration line, parsed out of the model's streamed
   scene before the data is finished) → TTS starts immediately and plays after
   the filler; then `scene` → `stage-render` draws it, `avatar-presence` seats
   the avatar, `narration-player` continues from line 2.
4. Speech onset during playback → `stop()`; a new transcript aborts the
   in-flight turn and starts another. `stage-metrics` logs the turn.

Everything timed in step 3 lands in the page's Measurements and Turn log
panels; **Export CSV** gives the §8 sheet.
