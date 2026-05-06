// Shared fetch helper for the news worker. Used at build time by
// news.astro and the landing page widget. The worker handles aggregation,
// timeouts, and edge caching — this is just a thin client.

export type FeedDomain = 'SAP' | 'Architecture' | 'AI' | 'Engineering';

export interface FeedItem {
  id: string;
  title: string;
  url: string;
  source: string;
  domain: FeedDomain;
  date: string;
  timestamp: number;
  excerpt?: string;
}

export interface FeedsResponse {
  items: FeedItem[];
  fetchedAt: string;
  domain: FeedDomain | 'all';
}

export const NEWS_WORKER_URL = 'https://news-worker.sfrancis2017.workers.dev';

/**
 * Fetch aggregated feed items from the worker. Used at build time
 * (Astro frontmatter) so the page is fully static. Failures throw —
 * the build fails loudly per the design decision in CLAUDE.md.
 */
export async function fetchFeeds(domain?: FeedDomain): Promise<FeedsResponse> {
  const url = domain
    ? `${NEWS_WORKER_URL}/feeds?domain=${encodeURIComponent(domain)}`
    : `${NEWS_WORKER_URL}/feeds`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`news-worker returned ${res.status}`);
  }
  return (await res.json()) as FeedsResponse;
}

/** Domain-to-color mapping for badges + filter tabs */
export const DOMAIN_COLORS: Record<FeedDomain, string> = {
  SAP: '#0066cc',
  Architecture: '#059669',
  AI: '#d97706',
  Engineering: '#7c3aed',
};

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${Math.max(m, 1)}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}
