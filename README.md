# sajivfrancis.com

Main website for Sajiv Francis, built with Astro.

This repository is the public editorial and navigation surface for the broader personal AI stack:
- Main site: https://sajivfrancis.com
- Docs site: https://docs.sajivfrancis.com
- Chat app: https://chat.sajivfrancis.com

## What this repo contains

- Public pages: home, writing, news, about, and lab
- Writing feed and post pages from Astro content collections
- News aggregation UI backed by a Cloudflare Worker feed service
- Global search and theme handling
- Floating chat launcher (opens chat.sajivfrancis.com in a modal iframe)
- Owner-only authoring surfaces:
  - Write tool: /admin/write
  - Margins tool: /margins

## Architecture (high level)

```text
Browser (sajivfrancis.com)
  ├─ Astro static pages (this repo)
  ├─ Pagefind client-side search index
  ├─ Chat launcher modal → iframe chat.sajivfrancis.com
  └─ News page calls news-worker.sfrancis2017.workers.dev

Cloudflare Workers
  ├─ News worker (feed aggregation for /news and /news.xml)
  └─ Chat worker (separate repo) for chat auth/orchestration

Other repos/services
  ├─ docs.sajivfrancis.com (separate docs repo)
  ├─ personal-chat repo (chat frontend + worker + retrieve service)
  └─ Retrieval service + Postgres/pgvector on droplet (for chat RAG)
```

## Repository map

```text
src/
  components/
    ChatLauncher.astro   # Floating launcher + modal iframe to chat subdomain
    Header.astro         # Main nav (Home, Writing, News, About, Lab, Docs, Chat)
    Search.astro         # Site search UI
    WriterLauncher.astro # Owner token gate shortcut to /admin/write
  content/
    blog/                # Writing posts
    config.ts            # Content schema
  layouts/
    BaseLayout.astro     # Global shell + theme bootstrap + chat launcher
  lib/
    news.ts              # News worker fetch helpers
    utils.ts             # Post URL/date helpers
  pages/
    index.astro
    blog/
    news.astro
    news.xml.ts          # News RSS
    rss.xml.ts           # Writing RSS
    about.astro
    chat.astro           # Redirects to https://chat.sajivfrancis.com
    margins.astro        # Owner-only social draft/share tool
    admin/
      write.astro        # Owner-only writer/editor
      share.astro        # Redirects legacy /admin/share -> /margins
scripts/
  og-default.svg
  render-og.mjs          # OG image generation helper
```

## Key behavior and decisions

- Chat is no longer served from this repo; /chat redirects to chat.sajivfrancis.com.
- Theme is synchronized across subdomains via cookie (`Domain=.sajivfrancis.com`) with localStorage fallback.
- News page data comes from the news worker, with filtering and share actions in the UI.
- Writer and margins tools are owner-only flows gated by token validation.
- Build is static-first; search is generated at build time with Pagefind.

## Stack

- Astro 5
- TypeScript
- Tailwind CSS v4 (via `@tailwindcss/vite`)
- `@astrojs/mdx`, `@astrojs/react`, `@astrojs/sitemap`, `@astrojs/rss`
- Pagefind for search indexing

## Local development

Requirements:
- Node.js 20+
- npm

Install and run:

```bash
npm install
npm run dev
```

Build and preview:

```bash
npm run build
npm run preview
```

The build command runs Astro build, then indexes the output with Pagefind:

```bash
astro build && pagefind --site dist
```

## Deployment

- GitHub Actions workflow: `.github/workflows/deploy.yml`
- Deployment target: GitHub Pages for sajivfrancis.com

## Related repositories

- `sajivfrancis.github.io` (this repo): main website and editorial surfaces
- `personal-chat`: chat frontend, chat worker, retrieval integration, ingestion utilities
- `docs` repo: docs.sajivfrancis.com knowledge base

## Notes

- Keep employer references anonymized in public-facing content.
- If you update cross-surface UX (theme, navigation, chat entry points), verify behavior on:
  - sajivfrancis.com
  - docs.sajivfrancis.com
  - chat.sajivfrancis.com
