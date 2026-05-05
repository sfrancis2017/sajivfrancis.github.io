// Worker call + helpers for translating diagram data to Mermaid syntax.

import type { Architecture, GenerateResult, Selections } from './types';
import { LAYERS, VENDORS, INDUSTRIES } from './data';

const WORKER_URL =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1')
    ? 'https://ea-explorer-worker.sfrancis2017.workers.dev'
    : 'https://ea-explorer-worker.sfrancis2017.workers.dev';

export interface GenerateError {
  error: string;
  retryAfter?: number;
}

export async function generateArchitectures(
  industryId: string,
  selections: Selections,
): Promise<GenerateResult> {
  const industry = INDUSTRIES.find((i) => i.id === industryId);
  if (!industry) throw new Error(`Unknown industry: ${industryId}`);

  // Resolve vendor IDs to {name, layerLabel} so the worker doesn't need
  // to know about the taxonomy.
  const resolved: Record<string, { name: string; layerLabel: string }[]> = {};
  for (const layer of LAYERS) {
    const ids = selections[layer.id] ?? [];
    if (ids.length === 0) continue;
    const pool = VENDORS[industryId]?.[layer.id] ?? [];
    resolved[layer.id] = ids
      .map((id) => pool.find((v) => v.id === id))
      .filter((v): v is { id: string; name: string; desc: string } => Boolean(v))
      .map((v) => ({ name: v.name, layerLabel: layer.label }));
  }

  const res = await fetch(`${WORKER_URL}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      industryLabel: industry.label,
      selections: resolved,
    }),
  });

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const err = (await res.json()) as GenerateError;
      message = err.error ?? message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  return (await res.json()) as GenerateResult;
}

// Convert an Architecture to a Mermaid `graph TD` diagram source.
// Used by the "Copy as Mermaid" button.
export function architectureToMermaid(arch: Architecture): string {
  const lines: string[] = ['graph TD'];

  for (const node of arch.nodes) {
    const safeId = node.id.replace(/[^a-zA-Z0-9]/g, '_');
    const safeVendor = node.vendor.replace(/"/g, "'");
    lines.push(`  ${safeId}["${safeVendor}"]`);
  }

  for (const edge of arch.edges) {
    const fromId = edge.from.replace(/[^a-zA-Z0-9]/g, '_');
    const toId = edge.to.replace(/[^a-zA-Z0-9]/g, '_');
    const label = (edge.label ?? '').replace(/"/g, "'");
    lines.push(label ? `  ${fromId} -->|${label}| ${toId}` : `  ${fromId} --> ${toId}`);
  }

  return lines.join('\n');
}
