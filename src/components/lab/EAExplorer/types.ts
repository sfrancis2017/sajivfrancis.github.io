// Types shared across the EA Explorer component tree.

export interface Industry {
  id: string;
  label: string;
  icon: string;
  desc: string;
  accent: string; // hex, used for subtle layer accents
}

export interface Layer {
  id: string;
  label: string;
  sublabel: string;
  icon: string;
  accent: string;
  onlyFor?: string[]; // industries this layer applies to (default: all)
}

export interface Vendor {
  id: string;
  name: string;
  desc: string;
}

export type VendorMap = Record<string, Record<string, Vendor[]>>;

// What the user has selected, by layer id → vendor id list.
export type Selections = Record<string, string[]>;

// The shape of the JSON returned by the worker.
export interface ArchitectureNode {
  id: string;
  vendor: string;
  layer: string;
}

export interface ArchitectureEdge {
  from: string;
  to: string;
  label: string;
  description?: string;
}

export interface RoadmapPhase {
  phase: string;
  duration: string;
  items: string[];
}

export interface Architecture {
  type: 'primary' | 'alternate1' | 'alternate2';
  name: string;
  executiveSummary: string;
  rationale: string;
  strengths: string[];
  considerations: string[];
  roadmap: RoadmapPhase[];
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
}

export interface GenerateResult {
  architectures: Architecture[];
}
