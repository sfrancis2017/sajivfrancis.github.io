// Controlled content taxonomy for the public surfaces. Mirrors the
// docs.sajivfrancis.com landing-page sections and the rules in
// CATEGORY-CRITERIA.md (repo root). Every non-legacy post has exactly ONE
// `category`; sub-topics stay in freeform `tags`.

export const CATEGORIES = [
  { value: 'architecture', label: 'Architecture' },
  { value: 'ai', label: 'AI' },
  { value: 'software-engineering', label: 'Software Engineering' },
  { value: 'sap', label: 'SAP & Enterprise Systems' },
  { value: 'finance', label: 'Finance' },
  { value: 'strategy', label: 'Strategy' },
  { value: 'reference', label: 'Reference' },
] as const;

export type CategoryValue = (typeof CATEGORIES)[number]['value'];

// Non-empty readonly tuple for z.enum().
export const CATEGORY_VALUES = CATEGORIES.map((c) => c.value) as [
  CategoryValue,
  ...CategoryValue[],
];

export const categoryLabel = (v: string): string =>
  CATEGORIES.find((c) => c.value === v)?.label ?? v;
