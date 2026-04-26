import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { buildPostUrl } from '@/lib/utils';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const posts = (await getCollection('blog', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
  );

  return rss({
    title: 'Sajiv Francis — Writing',
    description:
      'Essays and articles on enterprise architecture, AI, and the future of practice.',
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: buildPostUrl(post),
      categories: post.data.tags,
    })),
    customData: `<language>en-us</language>`,
  });
}
