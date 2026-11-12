// Turn log + measurement harness (plan 10 §8) — portable: one record per
// voice turn, timed from END OF SPEECH, persisted locally, exported as CSV,
// summarised against the thresholds that decide voice-only vs voice+typed.
//
//   const log = createTurnLog({ thresholds: { audible_ms: 1500, scene_ms: 4000 } });
//   log.add({ question, engine, stt_ms, ack_ms, line1_ms, scene_ms, ... });
//   log.summary(); log.csv(); log.render(tableEl, summaryEl); log.clear();
//
// Record (all ms from speech end unless noted):
//   stt_ms      end of speech → transcript
//   ack_ms      → filler line audible (prefetched phrase)        \ audible_ms =
//   line1_ms    → first narration line audible                   / min(ack, line1)
//   scene_ms    → full scene rendered
//   turn_ms     client fetch total (transcript → scene body); worker_ms, model_ms,
//               tool_ms, first_line_worker_ms (streamed first line, worker clock), steps
//   tokens_in / tokens_out / tokens_cached, cost_usd, model, layout, valid, error

// Plan 12 columns: mode (lookup|solutioning, as run), mode_suggested (the
// classifier's, when it differed), grounding_ms, evidence_lib / evidence_vs
// (passages in the set), cites_ok (every cite resolved), no_answer.
export const COLUMNS = ['ts', 'question', 'engine', 'stt_backend', 'stt_ms', 'ack_ms', 'line1_ms', 'audible_ms', 'scene_ms', 'turn_ms', 'worker_ms', 'grounding_ms', 'model_ms', 'tool_ms', 'first_line_worker_ms', 'steps', 'tools', 'layout', 'lines', 'tokens_in', 'tokens_out', 'tokens_cached', 'cost_usd', 'model', 'mode', 'mode_suggested', 'evidence_lib', 'evidence_vs', 'cites_ok', 'no_answer', 'tts_ttfb_ms', 'valid', 'error', 'viewport', 'ua'];

const num = (v) => (v == null || v === '' || Number.isNaN(Number(v)) ? null : Number(v));
export function quantile(values, q) {
  const xs = values.filter((v) => v != null).sort((a, b) => a - b);
  if (!xs.length) return null;
  const pos = (xs.length - 1) * q, lo = Math.floor(pos), hi = Math.ceil(pos);
  return Math.round(xs[lo] + (xs[hi] - xs[lo]) * (pos - lo));
}

export function createTurnLog({ storageKey = 'stage-turns', thresholds = { audible_ms: 1500, scene_ms: 4000 }, keep = 500 } = {}) {
  let turns = [];
  try { turns = JSON.parse(localStorage.getItem(storageKey) || '[]'); if (!Array.isArray(turns)) turns = []; } catch { turns = []; }
  const persist = () => { try { localStorage.setItem(storageKey, JSON.stringify(turns.slice(-keep))); } catch {} };

  function normalise(r) {
    const ack = num(r.ack_ms), line1 = num(r.line1_ms);
    const audible = ack != null && line1 != null ? Math.min(ack, line1) : (ack ?? line1);
    return {
      ts: r.ts || new Date().toISOString(), question: String(r.question ?? ''), engine: r.engine ?? '', stt_backend: r.stt_backend ?? '',
      stt_ms: num(r.stt_ms), ack_ms: ack, line1_ms: line1, audible_ms: audible, scene_ms: num(r.scene_ms), turn_ms: num(r.turn_ms),
      worker_ms: num(r.worker_ms), grounding_ms: num(r.grounding_ms), model_ms: num(r.model_ms), tool_ms: num(r.tool_ms), first_line_worker_ms: num(r.first_line_worker_ms), steps: num(r.steps),
      tools: r.tools ?? '', layout: r.layout ?? '', lines: num(r.lines), tokens_in: num(r.tokens_in), tokens_out: num(r.tokens_out), tokens_cached: num(r.tokens_cached),
      cost_usd: num(r.cost_usd), model: r.model ?? '', mode: r.mode ?? '', mode_suggested: r.mode_suggested ?? '', evidence_lib: num(r.evidence_lib), evidence_vs: num(r.evidence_vs),
      cites_ok: r.cites_ok == null ? null : r.cites_ok === true || r.cites_ok === 'true', no_answer: r.no_answer == null ? null : r.no_answer === true || r.no_answer === 'true',
      tts_ttfb_ms: num(r.tts_ttfb_ms), valid: r.valid !== false, error: r.error ?? '',
      viewport: r.viewport ?? (typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : ''), ua: r.ua ?? (typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 80) : ''),
    };
  }

  function summary(rows = turns) {
    const valid = rows.filter((r) => r.valid);
    const pick = (k) => rows.map((r) => r[k]);
    const passes = (k, lim) => rows.filter((r) => r[k] != null && r[k] <= lim).length;
    return {
      n: rows.length, valid: valid.length, failures: rows.length - valid.length,
      audible: { p50: quantile(pick('audible_ms'), 0.5), p90: quantile(pick('audible_ms'), 0.9), pass: passes('audible_ms', thresholds.audible_ms), limit: thresholds.audible_ms },
      line1: { p50: quantile(pick('line1_ms'), 0.5), p90: quantile(pick('line1_ms'), 0.9) },
      scene: { p50: quantile(pick('scene_ms'), 0.5), p90: quantile(pick('scene_ms'), 0.9), pass: passes('scene_ms', thresholds.scene_ms), limit: thresholds.scene_ms },
      stt: { p50: quantile(pick('stt_ms'), 0.5), p90: quantile(pick('stt_ms'), 0.9) },
      turn: { p50: quantile(pick('turn_ms'), 0.5), p90: quantile(pick('turn_ms'), 0.9) },
      cost_usd: rows.reduce((a, r) => a + (r.cost_usd ?? 0), 0),
      engines: [...new Set(rows.map((r) => r.engine))].join('/'),
    };
  }

  const esc = (v) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  function csv(rows = turns) { return [COLUMNS.join(','), ...rows.map((r) => COLUMNS.map((c) => esc(r[c])).join(','))].join('\n'); }

  const fmt = (v) => (v == null ? '—' : `${v}`);
  function render(tableEl, summaryEl, { last = 20 } = {}) {
    if (summaryEl) {
      const s = summary();
      const flag = (ok) => (ok ? '✓' : '✗');
      summaryEl.textContent = s.n
        ? `${s.n} turns (${s.failures} invalid) · audible p50 ${fmt(s.audible.p50)} / p90 ${fmt(s.audible.p90)} ms, ${s.audible.pass}/${s.n} ≤ ${s.audible.limit} ${flag(s.audible.pass === s.n)} · scene p50 ${fmt(s.scene.p50)} / p90 ${fmt(s.scene.p90)} ms, ${s.scene.pass}/${s.n} ≤ ${s.scene.limit} ${flag(s.scene.pass === s.n)} · stt p50 ${fmt(s.stt.p50)} · turn p50 ${fmt(s.turn.p50)} ms · $${s.cost_usd.toFixed(3)} · ${s.engines}`
        : 'No turns yet.';
    }
    if (tableEl) {
      const cols = ['ts', 'engine', 'stt_ms', 'ack_ms', 'line1_ms', 'scene_ms', 'turn_ms', 'model_ms', 'tool_ms', 'steps', 'layout', 'mode', 'evidence_lib', 'evidence_vs', 'cost_usd', 'valid'];
      const rows = turns.slice(-last).reverse();
      tableEl.innerHTML = `<thead><tr>${cols.map((c) => `<th>${c.replace(/_ms$/, '')}</th>`).join('')}<th>question</th></tr></thead><tbody>${rows.map((r) => `<tr class="${r.valid ? '' : 'invalid'}${r.audible_ms != null && r.audible_ms > thresholds.audible_ms ? ' slow-audible' : ''}${r.scene_ms != null && r.scene_ms > thresholds.scene_ms ? ' slow-scene' : ''}">${cols.map((c) => `<td>${c === 'ts' ? r.ts.slice(11, 19) : c === 'cost_usd' ? (r.cost_usd == null ? '—' : r.cost_usd.toFixed(3)) : c === 'valid' ? (r.valid ? '✓' : `✗ ${r.error}`) : fmt(r[c])}</td>`).join('')}<td class="q">${r.question.replace(/</g, '&lt;')}</td></tr>`).join('')}</tbody>`;
    }
  }

  return {
    get turns() { return turns; },
    thresholds,
    add(record) { const r = normalise(record); turns.push(r); persist(); return r; },
    // Patch a record after the fact (e.g. line1_ms arrives after the scene).
    update(r, patch) { const i = turns.indexOf(r); if (i < 0) return r; const n = normalise({ ...r, ...patch }); turns[i] = n; persist(); return n; },
    clear() { turns = []; persist(); },
    summary, csv, render,
  };
}

export const METRICS_CSS = `
.turn-log{width:100%;border-collapse:collapse;font-size:.78rem;font-variant-numeric:tabular-nums}
.turn-log th,.turn-log td{padding:.2rem .4rem;border-bottom:1px solid var(--st-border,#ddd);text-align:right;white-space:nowrap}
.turn-log th:first-child,.turn-log td:first-child,.turn-log td.q,.turn-log th:last-child{text-align:left}
.turn-log td.q{white-space:normal;min-width:12rem;max-width:28rem}
.turn-log tr.invalid td{color:#b3261e}
.turn-log tr.slow-audible td:nth-child(4),.turn-log tr.slow-audible td:nth-child(5){color:#b3261e;font-weight:600}
.turn-log tr.slow-scene td:nth-child(6){color:#b3261e;font-weight:600}
`;
