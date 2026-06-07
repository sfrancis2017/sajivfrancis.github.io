import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

import react from '@astrojs/react';

import fs from 'node:fs';
import path from 'node:path';

const SITE = 'https://sajivfrancis.com';

// Per-post lastmod for the sitemap. Blog filenames are YYYY-MM-DD-slug.(md|mdx)
// → /blog/YYYY/MM/DD/slug/; lastmod = updatedDate ?? pubDate — a uniform
// freshness signal every engine reads the same way.
function blogLastmod() {
  const dir = path.resolve('./src/content/blog');
  const map = {};
  let files = [];
  try {
    files = fs.readdirSync(dir);
  } catch {
    return map;
  }
  for (const file of files) {
    const m = file.match(/^(\d{4})-(\d{2})-(\d{2})-(.+)\.(?:md|mdx)$/);
    if (!m) continue;
    const [, y, mo, d, slug] = m;
    let fm = '';
    try {
      fm = fs.readFileSync(path.join(dir, file), 'utf8').split('---')[1] || '';
    } catch {
      /* unreadable — fall back to the filename date */
    }
    const pub = (fm.match(/pubDate:\s*['"]?([0-9-]+)/) || [])[1] || `${y}-${mo}-${d}`;
    const upd = (fm.match(/updatedDate:\s*['"]?([0-9-]+)/) || [])[1];
    map[`${SITE}/blog/${y}/${mo}/${d}/${slug}/`] = new Date(upd || pub).toISOString();
  }
  return map;
}
const LASTMOD = blogLastmod();

export default defineConfig({
  site: SITE,
  integrations: [
    mdx(),
    sitemap({
      // Keep the admin surface out of the index entirely.
      filter: (page) => !page.includes('/admin/'),
      // Attach a per-post lastmod so all engines get the same freshness signal.
      serialize(item) {
        const lm = LASTMOD[item.url];
        if (lm) item.lastmod = lm;
        return item;
      },
    }),
    react(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  build: {
    format: 'directory',
  },
  markdown: {
    shikiConfig: {
      theme: 'github-dark-dimmed',
      wrap: true,
    },
  },
});
