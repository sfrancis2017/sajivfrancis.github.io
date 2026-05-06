import rss from '@astrojs/rss';
import { fetchFeeds } from '@/lib/news';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const { items } = await fetchFeeds();

  return rss({
    title: 'Sajiv Francis — Curated News',
    description:
      "What I'm reading: curated news across SAP, Enterprise Architecture, AI, and Software Engineering. Sources are listed at sajivfrancis.com/news.",
    site: context.site!,
    items: items.map((item) => ({
      title: item.title,
      pubDate: new Date(item.date),
      description: item.excerpt
        ? `${item.excerpt}\n\nSource: ${item.source}`
        : `Source: ${item.source}`,
      link: item.url,
      categories: [item.domain, item.source],
    })),
    customData: `<language>en-us</language>`,
  });
}
