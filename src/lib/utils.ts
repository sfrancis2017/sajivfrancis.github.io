import type { CollectionEntry } from 'astro:content';

/**
 * Convert a tag name to a URL-safe slug.
 * Handles slashes, dots, and other special characters.
 */
export function tagToSlug(tag: string): string {
  return tag
    .toLowerCase()
    .replace(/[/\\]/g, '-') // slashes → hyphen
    .replace(/[^\w\s-]/g, '') // strip non-word/space/hyphen
    .replace(/\s+/g, '-') // spaces → hyphen
    .replace(/-+/g, '-') // collapse repeats
    .replace(/^-|-$/g, ''); // trim
}

/**
 * Build the URL for a blog post: /blog/yyyy/mm/dd/slug/
 * Uses UTC date components to avoid local-timezone shifts on dates parsed
 * as midnight-UTC (which would otherwise drift by a day in non-UTC zones).
 */
export function buildPostUrl(post: CollectionEntry<'blog'>): string {
  const date = post.data.pubDate;
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const cleanSlug = post.slug.replace(/^\d{4}-\d{2}-\d{2}-/, '');
  return `/blog/${year}/${month}/${day}/${cleanSlug}/`;
}

/**
 * Format a date for display. Uses UTC to match the URL date components.
 */
export function formatDate(d: Date, opts?: Intl.DateTimeFormatOptions): string {
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
    ...opts,
  });
}
