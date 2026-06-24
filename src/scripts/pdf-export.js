/**
 * Runtime "Download PDF" for blog posts.
 *
 * Reads the page's embedded source markdown (#pdf-source JSON), rasterizes any
 * ```mermaid fences to OPAQUE PNG data-URIs in the browser, then POSTs the
 * markdown to the chat worker's public render endpoint, which forwards to the
 * droplet WeasyPrint service and streams back a watermarked PDF.
 *
 * Mirrors the proven transform in personal-chat/public/chat.js — in particular
 * the opaque-canvas raster (alpha:false) so diagrams don't render as black
 * boxes in Edge's PDF reader. No build-time step; nothing renders unless the
 * visitor clicks the button.
 */

const RENDER_ENDPOINT = 'https://chat-worker.sfrancis2017.workers.dev/api/render/public';
const MERMAID_CDN = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
const SVG_NS = 'http://www.w3.org/2000/svg';

let _mermaid = null;
function loadMermaid() {
  if (!_mermaid) {
    _mermaid = import(/* @vite-ignore */ MERMAID_CDN).then((m) => {
      const mermaid = m.default;
      // Force the LIGHT theme — dark-mode pages would otherwise render dark
      // diagrams that look wrong on a white PDF page.
      mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
        flowchart: { useMaxWidth: true },
      });
      return mermaid;
    });
  }
  return _mermaid;
}

// Pad a mermaid SVG's viewBox so edge labels aren't clipped once rasterized.
function expandViewBox(svgString, margin = 16) {
  return svgString.replace(/viewBox="([^"]+)"/, (_, vb) => {
    const parts = vb.split(/\s+/).map(Number);
    if (parts.length !== 4 || parts.some(Number.isNaN)) return `viewBox="${vb}"`;
    const [x, y, w, h] = parts;
    const pad = Math.max(margin, Math.round(Math.max(w, h) * 0.04));
    return `viewBox="${x - pad} ${y - pad} ${w + pad * 2} ${h + pad * 2}"`;
  });
}

// Convert mermaid <foreignObject> HTML labels into native <text> — WeasyPrint
// (and canvas rasterization) drop foreignObject content, so labels would vanish.
function inlineForeignObjectsAsText(svg) {
  const fos = Array.from(svg.querySelectorAll('foreignObject'));
  for (const fo of fos) {
    const label = fo.querySelector('span.nodeLabel') || fo.querySelector('div') || fo;
    const html = label.innerHTML || '';
    let lines = html
      .split(/<br\s*\/?>/i)
      .map((l) => l.replace(/<[^>]+>/g, '').trim())
      .map((l) =>
        l
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
      )
      .filter(Boolean);
    if (lines.length === 0) {
      const t = (fo.textContent ?? '').trim();
      if (t) lines = [t];
    }
    if (lines.length === 0) { fo.remove(); continue; }

    const x = parseFloat(fo.getAttribute('x') ?? '0') || 0;
    const y = parseFloat(fo.getAttribute('y') ?? '0') || 0;
    const w = parseFloat(fo.getAttribute('width') ?? '0') || 0;
    const h = parseFloat(fo.getAttribute('height') ?? '0') || 0;

    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('font-family', 'Inter, ui-sans-serif, system-ui, sans-serif');
    text.setAttribute('font-size', '13');
    text.setAttribute('fill', 'currentColor');

    const cx = x + w / 2;
    const lineHeight = 16;
    const startY = y + h / 2 - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((line, i) => {
      const ts = document.createElementNS(SVG_NS, 'tspan');
      ts.setAttribute('x', String(cx));
      ts.setAttribute('y', String(startY + i * lineHeight));
      ts.textContent = line;
      text.appendChild(ts);
    });
    fo.replaceWith(text);
  }
  const style = document.createElementNS(SVG_NS, 'style');
  style.textContent = 'svg { color: #1a1a1a; }';
  svg.insertBefore(style, svg.firstChild);
}

// Rasterize an <svg> element to an OPAQUE PNG data-URL (no alpha channel → no
// SMask → no black-box in Edge's PDF reader).
function svgToPngDataUrl(svgEl, scale = 3) {
  const clone = svgEl.cloneNode(true);
  if (!clone.getAttribute('xmlns')) clone.setAttribute('xmlns', SVG_NS);
  inlineForeignObjectsAsText(clone);
  const xml = new XMLSerializer().serializeToString(clone);
  const dataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(xml)));
  const bbox = svgEl.getBoundingClientRect();
  const w = Math.max(bbox.width, 200);
  const h = Math.max(bbox.height, 200);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(w * scale);
        canvas.height = Math.round(h * scale);
        const ctx = canvas.getContext('2d', { alpha: false });
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/png'));
      } catch (e) { reject(e); }
    };
    img.onerror = () => reject(new Error('SVG load failed'));
    img.src = dataUrl;
  });
}

let _mmdCounter = 0;
async function mermaidToPng(code) {
  const mermaid = await loadMermaid();
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:absolute;left:-9999px;top:0;';
  document.body.appendChild(wrap);
  try {
    const { svg } = await mermaid.render(`pdf-mmd-${Date.now()}-${++_mmdCounter}`, code);
    wrap.innerHTML = expandViewBox(svg, 16);
    const svgEl = wrap.querySelector('svg');
    if (!svgEl) return null;
    const bw = Math.max(svgEl.getBoundingClientRect().width, 1);
    // Moderate scale: crisp for print but keeps the base64 payload reasonable
    // (a diagram-heavy page must fit the worker's render cap). 2–4× target ~1400px.
    const scale = Math.max(2, Math.min(4, Math.ceil(1400 / bw)));
    return await svgToPngDataUrl(svgEl, scale);
  } catch (e) {
    console.warn('mermaid render failed; leaving fence as code block', e);
    return null;
  } finally {
    wrap.remove();
  }
}

// Plotly/chart fences are interactive (JSON specs) — dumping the raw JSON into a
// PDF is ugly, so replace them with a short placeholder pointing back online.
// (v1 scope: structure diagrams render; quantitative charts stay online.)
function replaceChartFences(markdown) {
  return markdown.replace(
    /```(?:plotly|chart)[^\n]*\n[\s\S]*?```/g,
    '\n> *Interactive chart omitted from the PDF — view it on the online version of this page.*\n'
  );
}

// Replace every ```mermaid fence with an opaque-PNG image. A fence that fails
// to render is left as-is (renders as a code block in the PDF — graceful).
async function rasterizeMermaid(markdown) {
  const fenceRe = /```mermaid[^\n]*\n([\s\S]*?)```/g;
  const jobs = [];
  let m;
  while ((m = fenceRe.exec(markdown)) !== null) {
    jobs.push({ full: m[0], code: m[1] });
  }
  if (jobs.length === 0) return markdown;
  let out = markdown;
  for (const job of jobs) {
    const png = await mermaidToPng(job.code.trim());
    if (png) out = out.replace(job.full, `\n![diagram](${png})\n`);
  }
  return out;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function runExport(btn) {
  const srcEl = document.getElementById('pdf-source');
  if (!srcEl) { console.warn('no #pdf-source on page'); return; }
  let src;
  try { src = JSON.parse(srcEl.textContent || '{}'); } catch { return; }
  if (!src.markdown) return;

  const label = btn.querySelector('.pdf-btn-label');
  const original = label ? label.textContent : '';
  btn.setAttribute('disabled', 'true');
  if (label) label.textContent = 'Generating…';

  try {
    const markdown = await rasterizeMermaid(replaceChartFences(src.markdown));
    const res = await fetch(RENDER_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        markdown,
        template: src.template || 'modern',
        meta: src.meta || {},
      }),
    });
    if (!res.ok) {
      let detail = '';
      try { detail = (await res.json())?.error || ''; } catch {}
      throw new Error(`render failed (${res.status}) ${detail}`);
    }
    const blob = await res.blob();
    downloadBlob(blob, `${src.slug || 'document'}.pdf`);
    if (label) label.textContent = original;
  } catch (e) {
    console.error('PDF export failed', e);
    if (label) label.textContent = 'Failed — retry';
    setTimeout(() => { if (label) label.textContent = original; }, 2500);
  } finally {
    btn.removeAttribute('disabled');
  }
}

export function initPdfExport() {
  const btn = document.getElementById('download-pdf-btn');
  if (!btn || btn.dataset.pdfBound) return;
  btn.dataset.pdfBound = '1';
  btn.addEventListener('click', () => runExport(btn));
}
