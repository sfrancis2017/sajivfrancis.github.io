# Mermaid: build-time pre-render (parked)

**Status:** parked / future work. Current behavior works on laptop; mobile shows
mindmaps as a code block by design.

## The problem
Mermaid **mindmaps** use the **cytoscape** layout engine, which **iOS WebKit
cannot render** (blank/throws on every iOS browser — Chrome, Safari, DuckDuckGo
all use WebKit). Flowcharts/sequence/etc. use **dagre** and render fine
everywhere. This is a WebKit + cytoscape limitation, not a syntax or version
bug — verified: the exact blog mindmap renders to a clean 114KB SVG via
`mermaid-cli` headlessly.

## Current state (the workaround that shipped)
- **Blog/writing:** bundled mermaid **`11.14.0`** (exact pin, no caret). Renders
  mindmaps on desktop.
- **Mobile (≤640px):** `BlogPost.astro` `renderAll()` **skips** mindmaps
  (`/^\s*mindmap\b/`), leaving the Shiki code block. iOS can't render them anyway.
- **Tools / chat / Doc Studio:** mermaid **`10.9.1`** via CDN.
- Blog diagrams always render the **light** theme (so they print correctly).

## The real fix: pre-render diagrams to static SVG at build time
Render every ```mermaid block to an inline `<svg>` (or `<img>`) **during the
Astro build**, so the browser does zero client-side Mermaid work.

**Why it's the right answer:**
- Renders identically on **every** device — laptop, iPhone, no JS, no cytoscape,
  no version drift, no font-timing races.
- Lets us **delete** all the client-side gymnastics in `BlogPost.astro`:
  `extractMermaidSource`, `fonts.ready`, the mobile mindmap skip, the
  theme-toggle re-render, the dynamic `import('mermaid')`.
- `mermaid-cli` is already a devDep and proven to render our diagrams.

**Approaches (pick one):**
1. **`rehype-mermaid`** (uses Playwright) as a `markdown.rehypePlugins` entry —
   cleanest integration; cost is a Playwright/Chromium dep in CI.
2. **`@mermaid-js/mermaid-cli` (mmdc)** in a small build step / Astro integration
   — already installed; renders each block to SVG. We control the pipeline.

**Tradeoffs:**
- Loses live light/dark **theme switching** of diagrams (pre-rendered = one
  theme). Minor — we already force light for print and it reads fine on dark.
- Adds a headless-browser dependency to CI (Chromium). Build gets slower.
- Need to keep the expand-to-fullscreen modal working against static SVGs (it
  already operates on rendered `.mermaid-rendered` SVGs, so should be fine).

## Hard-won learnings (don't relearn these)
- **Pin Mermaid exactly, no caret.** `^11.14.0` floated to **`11.16.0`, which
  regressed mindmap rendering** → blank/code-block. `11.14.0` and `11.15.0` are
  fine. This was the root cause of the "it used to work" mystery.
- **`securityLevel: 'loose'` is required** on v11. In `'strict'`, Mermaid runs the
  SVG through DOMPurify, which **strips the XHTML inside `<foreignObject>`
  labels** → nodes render blank. (Safe here: diagram source is authored by us.)
- **Source extraction must rebuild newlines from Shiki `.line` spans.** Shiki's
  output has no newlines between line spans, so `el.textContent` collapses a
  diagram to one line → "Parse error on line 1". `extractMermaidSource` joins
  `.line` spans with `\n`. (Build-time pre-render removes this concern entirely.)
- **`import('mermaid')` (bare specifier) only works in Vite-BUNDLED scripts.**
  The blog's `BlogPost` script is bundled, so it resolves. The **`/tools/*`
  pages use inline scripts** — a bare `import('mermaid')` there throws
  "Module name 'mermaid' does not resolve to a valid URL". Inline scripts must
  import from a full CDN URL. (A build step / import map would fix this too.)
- **Mindmaps are the only fragile type.** Flowcharts/sequence render everywhere
  in both 10.9.1 and 11.x. If a diagram must work on mobile today, author it as a
  flowchart, not a mindmap.

## Pointers
- Client render + mobile skip: `src/layouts/BlogPost.astro` (`renderAll`,
  `extractMermaidSource`, `configure`).
- PDF export path (already light-theme, bundled): `src/scripts/pdf-export.js`.
- Tools (CDN 10.9.1, inline scripts): `src/pages/tools/{map-maker,flow-to-diagram,
  markdown-convert,image-to-mermaid}.astro`.
- Headless render check that proved validity:
  `mmdc -i diagram.mmd -o out.svg -c '{securityLevel:loose}' -p '{args:[--no-sandbox]}'`
