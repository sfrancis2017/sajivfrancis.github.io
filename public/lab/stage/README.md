# Companion stage — portable modules (plan 10)

The stage is one screen: a question in (voice or typed), a **scene** out
(layout + data + narration), the avatar seated beside whatever is being
narrated. These modules carry no site-specific code; the page in
`src/pages/tools/stage.astro` composes them and supplies the endpoints.

| Module | Role | Entry points |
|---|---|---|
| `stage-render.js` | Scene → DOM for the 8 layouts (kpi-tiles, list, table, chart, diagram-walkthrough, outline, compare, narrative-only). Charts are SVG with nice ticks and horizontal bars for many/long categories; mermaid diagrams render lazily. | `renderScene(container, scene) → { elements, focus(id) }`, `LAYOUTS`, `STAGE_CSS` |
| `avatar-presence.js` | Seats the avatar layer (by default at its home seat beside the scene — moving to the narrated element is parked, plan 10 Amendment B; the page's `?move=1` re-enables it). When moving, seats it beside the narrated element from live geometry: never covers the subject, translucent only while overlapping other content, sizes s/m/l animated between, phone mode seats it under the subject via a spacer. | `createPresence(layerEl, stageEl, { home }) → { setSize, moveTo, update, candidates, dispose }`, `PRESENCE_CSS` |
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
4. Barge-in: an interim transcript during playback that is not an echo of the
   avatar's own lines → `stop()` (speech onset alone never stops playback — on
   speakers it is usually the avatar itself); a new final transcript aborts the
   in-flight turn and starts another. `stage-metrics` logs the turn.

Everything timed in step 3 lands in the page's Measurements and Turn log
panels; **Export CSV** gives the §8 sheet.

## Grounding, registers, modes (plan 12 — step 5a)

- The worker builds an EVIDENCE SET before the model call: library pages
  first, then passages from the topic vector stores (professional corpora
  only — personal stores such as a reading list are never retrieved or
  named). Pages the model reads mid-turn (`search`, `page_text`) join the
  set with their own `lib:n` id, so they are citable too.
  The scene echoes `scene.evidence[]`: `{ id: "lib:1", kind: "library",
  title, url }` or `{ id: "vs:1", kind: "vector", label: "SAP vector store" }`
  — a vector item NEVER carries a title or url (IP rule), only its topic's
  label. The page's **Sources** strip renders both kinds.
- Every narration line carries `register: "evidence" | "inference"` and
  `cites: [ids]`; evidence lines must cite (the worker rejects a scene that
  does not). The text track styles inference as "my read" and shows each
  line's cites. Data items (tiles/items/rows/steps/nodes/points) may carry
  `cites` too.
- `scene.mode` is `lookup` (Sonnet) or `solutioning` (Opus). The page keeps a
  sticky mode (`localStorage` `stage-mode`, `?mode=` pins it); the turn
  payload sends `{ mode, mode_pinned }`. The worker's SSE `mode` event says
  which mode the turn runs in; when the classifier switched an unpinned
  mode, the page speaks "Treating this as a scenario." / "Looking that up."
  after the filler and the switch follows. Clicking a mode pins it (manual
  override); clicking the pinned mode again returns to auto. Spoken or typed
  "just look it up" / "treat this as a scenario" flips + pins the mode and
  re-asks the last question — the phrase itself is never sent.
- `scene.no_answer` marks the "Not in the library" scene. Turn-log columns:
  `mode, mode_suggested, grounding_ms, evidence_lib, evidence_vs, cites_ok,
  no_answer`.
