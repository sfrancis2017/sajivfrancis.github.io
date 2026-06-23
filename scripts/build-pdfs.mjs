#!/usr/bin/env node
/**
 * Build-time PDF generation for blog posts (mirrors the docs repo's script).
 *
 * For each post (src/content/blog/YYYY-MM-DD-slug.mdx): strip frontmatter + MDX
 * machinery (imports/exports/JSX component tags → prose) → render Mermaid fences to
 * high-DPI PNG via mmdc → splice as base64 data-URIs → POST to docrender (WeasyPrint,
 * `modern` template, watermarked) → write public/pdf/blog/YYYY/MM/DD/slug.pdf. A
 * manifest lists generated slugs (consumed by the Download-PDF button) and caches
 * content hashes so unchanged posts are skipped.
 *
 *  - Skips entirely if DOCRENDER_URL/DOCRENDER_TOKEN unset (local dev) — exit 0.
 *  - NON-BLOCKING: a failure logs and continues; never fails the build.
 *  - Mermaid → PNG (WeasyPrint drops Mermaid <foreignObject> labels; PNG keeps them).
 *  - v1: MDX components are stripped to their text; prose-first posts render cleanly.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const CONTENT = path.join(ROOT, 'src/content/blog');
const OUT = path.join(ROOT, 'public/pdf');
const MANIFEST = path.join(OUT, 'manifest.json');
const TEMPLATE = 'modern';
const WATERMARK = 'sajivfrancis.com · © Sajiv Francis';
const SCRIPT_VERSION = '1';

let RENDER_URL = (process.env.DOCRENDER_URL || '').trim();
const TOKEN = (process.env.DOCRENDER_TOKEN || '').trim();
if (!RENDER_URL || !TOKEN) {
  console.log('[build-pdfs] DOCRENDER_URL/DOCRENDER_TOKEN not set — skipping PDF generation.');
  process.exit(0);
}
// Tolerate a secret pasted without a scheme (the #1 cause of "Failed to parse URL").
if (!/^https?:\/\//i.test(RENDER_URL)) RENDER_URL = 'https://' + RENDER_URL;
const ONLY = process.argv.slice(2).find((a) => !a.startsWith('-'));

function parseFront(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  const fm = {};
  let body = raw;
  if (m) {
    body = raw.slice(m[0].length);
    for (const line of m[1].split('\n')) {
      const mm = line.match(/^(\w[\w-]*):\s*"?(.*?)"?\s*$/);
      if (mm) fm[mm[1]] = mm[2];
    }
  }
  return { fm, body };
}

// Strip MDX machinery so docrender's markdown renderer doesn't print it literally:
// import/export lines, and JSX component tags (keep their inner text).
function stripMdx(body) {
  return body
    .replace(/^import\s.*$/gm, '')
    .replace(/^export\s.*$/gm, '')
    .replace(/<\/?[A-Z][A-Za-z0-9]*(?:\s[^>]*?)?\/?>/g, '')
    .replace(/\n{3,}/g, '\n\n');
}

function renderMermaid(body, tmp) {
  if (!/```mermaid/.test(body)) return body;
  const inFile = path.join(tmp, 'in.md');
  const outFile = path.join(tmp, 'out.md');
  const pptr = path.join(tmp, 'pptr.json');
  fs.writeFileSync(pptr, '{"args":["--no-sandbox","--disable-gpu"]}');
  fs.writeFileSync(inFile, body);
  execFileSync('npx', ['-y', '@mermaid-js/mermaid-cli', '-i', inFile, '-o', outFile, '-e', 'png', '-s', '3', '-b', 'white', '-p', pptr], { stdio: 'pipe' });
  let out = fs.readFileSync(outFile, 'utf8');
  out = out.replace(/!\[[^\]]*\]\(([^)]+\.png)\)/g, (_m, ref) => {
    const png = path.isAbsolute(ref) ? ref : path.join(tmp, path.basename(ref));
    try {
      return `<figure><img src="data:image/png;base64,${fs.readFileSync(png).toString('base64')}" /></figure>`;
    } catch {
      return '';
    }
  });
  return out;
}

async function render(markdown, title) {
  const res = await fetch(RENDER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify({ markdown, template: TEMPLATE, format: 'pdf', meta: { title, watermark: WATERMARK, author: 'Sajiv Francis' } }),
  });
  if (!res.ok) throw new Error(`docrender HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

// 2026-05-23-ai-economic-trap.mdx -> blog/2026/05/23/ai-economic-trap
function slugFor(filename) {
  const m = filename.match(/^(\d{4})-(\d{2})-(\d{2})-(.+)\.mdx?$/);
  return m ? `blog/${m[1]}/${m[2]}/${m[3]}/${m[4]}` : null;
}

const prev = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8')).hashes ?? {} : {};
const hashes = {};
const slugs = [];
let built = 0, cached = 0, failed = 0;

for (const file of fs.readdirSync(CONTENT).filter((f) => f.endsWith('.mdx') || f.endsWith('.md'))) {
  const slug = slugFor(file);
  if (!slug) continue;
  if (ONLY && !slug.includes(ONLY)) continue;
  const { fm, body } = parseFront(fs.readFileSync(path.join(CONTENT, file), 'utf8'));
  if (fm.draft === 'true') continue;
  const hash = crypto.createHash('sha256').update(body + TEMPLATE + SCRIPT_VERSION).digest('hex').slice(0, 16);
  const pdfPath = path.join(OUT, `${slug}.pdf`);
  if (prev[slug] === hash && fs.existsSync(pdfPath)) { hashes[slug] = hash; slugs.push(slug); cached++; continue; }
  let tmp;
  try {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'blogpdf-'));
    const md = `# ${fm.title || slug}\n\n${renderMermaid(stripMdx(body), tmp)}`;
    const pdf = await render(md, fm.title || slug);
    fs.mkdirSync(path.dirname(pdfPath), { recursive: true });
    fs.writeFileSync(pdfPath, pdf);
    hashes[slug] = hash; slugs.push(slug); built++;
    console.log('[build-pdfs] ✓', slug);
  } catch (e) {
    failed++;
    console.warn('[build-pdfs] ✗', slug, '—', e.message);
    if (fs.existsSync(pdfPath)) { hashes[slug] = prev[slug] ?? 'stale'; slugs.push(slug); }
  } finally {
    if (tmp) fs.rmSync(tmp, { recursive: true, force: true });
  }
}

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(MANIFEST, JSON.stringify({ slugs, hashes }));
console.log(`[build-pdfs] done — ${built} built, ${cached} cached, ${failed} failed; ${slugs.length} PDFs available.`);
