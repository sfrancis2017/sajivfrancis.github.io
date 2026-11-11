// Stage renderer (plan 10 step 2) — portable: scene JSON in, DOM out.
//
//   const view = renderScene(container, scene);
//   view.focus('tile:series');      // highlight the element a narration line names
//   view.elements                   // Map<id, Element> of every focusable element
//
// Layout catalogue v1: kpi-tiles, list, table, chart, diagram-walkthrough,
// outline, compare, narrative-only. Element ids come from the scene's data
// (tile/item/row/step/node/point ids); the renderer prefixes them exactly as
// the narration's `focus` references them. Unknown focus ids are ignored.
// No framework, no library; the chart is inline SVG following the dataviz
// palette (categorical slots in fixed order, thin marks, one axis).

const PALETTE = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948'];
const PALETTE_DARK = ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767'];

const el = (tag, attrs = {}, children = []) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null) continue;
    if (k === 'class') n.className = v; else if (k === 'text') n.textContent = v; else if (k === 'html') n.innerHTML = v; else n.setAttribute(k, v);
  }
  for (const c of [].concat(children)) if (c != null) n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  return n;
};
const svgEl = (tag, attrs = {}) => { const n = document.createElementNS('http://www.w3.org/2000/svg', tag); for (const [k, v] of Object.entries(attrs)) if (v != null) n.setAttribute(k, v); return n; };
const withId = (node, kind, id) => { node.dataset.el = id.includes(':') ? id : `${kind}:${id}`; node.classList.add('st-el'); return node; };
const isDark = () => matchMedia('(prefers-color-scheme: dark)').matches;
let hostWidth = 0; // set by renderScene before a layout renders
// Integer-friendly axis ticks: 0..top in 4–6 steps, never a repeated label.
function niceTicks(max) {
  const raw = Math.max(1, max) / 5;
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 5, 10].map((m) => m * pow).find((st) => st >= raw) || pow * 10;
  const out = []; for (let v = 0; v <= Math.ceil(max / step) * step + 1e-9; v += step) out.push(Math.round(v * 1000) / 1000);
  return out;
}

const RENDER = {
  'kpi-tiles'(d) {
    return el('div', { class: 'st-tiles' }, (d.tiles || []).map((t) => withId(el('div', { class: 'st-tile' }, [el('div', { class: 'st-tile-value', text: t.value }), el('div', { class: 'st-tile-label', text: t.label }), t.delta ? el('div', { class: 'st-tile-delta', text: t.delta }) : null]), 'tile', t.id)));
  },
  list(d) {
    return el('ol', { class: 'st-list' }, (d.items || []).map((it) => withId(el('li', { class: 'st-item' }, [it.href ? el('a', { href: it.href, target: '_blank', rel: 'noopener', class: 'st-item-title', text: it.title }) : el('div', { class: 'st-item-title', text: it.title }), it.subtitle ? el('div', { class: 'st-item-sub', text: it.subtitle }) : null]), 'item', it.id)));
  },
  table(d) {
    const head = el('tr', {}, (d.columns || []).map((c) => el('th', { text: c })));
    const rows = (d.rows || []).map((r) => withId(el('tr', {}, (r.cells || []).map((c, i) => el('td', { text: c, class: i > 0 && /^[\d,.\s%]+$/.test(c) ? 'num' : null }))), 'row', r.id));
    return el('div', { class: 'st-table-wrap' }, el('table', { class: 'st-table' }, [el('thead', {}, head), el('tbody', {}, rows)]));
  },
  chart(d) {
    const c = d.chart || { kind: 'bar', categories: [], series: [] };
    const pal = isDark() ? PALETTE_DARK : PALETTE;
    // Size the drawing to the host so labels keep their pixel size on phones.
    const W = Math.max(340, Math.min(640, hostWidth || 640)), H = 300, padL = 48, padR = 16, padT = 16, padB = 56;
    const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, class: 'st-chart', role: 'img', 'aria-label': d.caption || 'chart' });
    const cats = c.categories || [], series = (c.series || []).slice(0, 8);
    const max = Math.max(1, ...series.flatMap((s) => s.values || []));
    const innerW = W - padL - padR, innerH = H - padT - padB;
    const wrap = el('div', { class: 'st-chart-wrap' });
    if (c.kind === 'donut') {
      const s = series[0] || { values: [] }; const total = Math.max(1, s.values.reduce((a, b) => a + b, 0));
      const cx = W / 2, cy = H / 2, r = 100, ri = 62; let a0 = -Math.PI / 2;
      cats.forEach((cat, i) => {
        const v = s.values[i] || 0, a1 = a0 + (v / total) * Math.PI * 2;
        const p = (ang, rad) => [cx + rad * Math.cos(ang), cy + rad * Math.sin(ang)];
        const [x0, y0] = p(a0, r), [x1, y1] = p(a1, r), [xi0, yi0] = p(a0, ri), [xi1, yi1] = p(a1, ri);
        const large = a1 - a0 > Math.PI ? 1 : 0;
        const path = svgEl('path', { d: `M${x0},${y0} A${r},${r} 0 ${large} 1 ${x1},${y1} L${xi1},${yi1} A${ri},${ri} 0 ${large} 0 ${xi0},${yi0} Z`, fill: pal[i % 8], stroke: 'var(--st-surface)', 'stroke-width': 2 });
        path.dataset.el = `cat:${cat}`; path.classList.add('st-el');
        path.appendChild(svgEl('title')).textContent = `${cat}: ${v}`;
        svg.appendChild(path); a0 = a1;
      });
    } else if (c.kind === 'bar' && (cats.length > 6 || cats.some((x) => x.length > 12))) {
      // Horizontal bars: long or many category labels read cleanly, and the
      // chart grows by row instead of squeezing (mobile-friendly).
      const rowH = series.length > 1 ? 18 * series.length + 10 : 26, labelW = Math.min(170, Math.round(W * 0.36));
      const HH = padT + cats.length * rowH + 28;
      svg.setAttribute('viewBox', `0 0 ${W} ${HH}`); svg.classList.add('st-chart-h'); svg.style.maxWidth = `${W}px`; // never upscale: rows keep their pixel height
      const x0 = labelW, plotW = W - labelW - padR - 36;
      const ticks = niceTicks(max);
      for (const tv of ticks) {
        const x = x0 + (tv / ticks[ticks.length - 1]) * plotW;
        svg.appendChild(svgEl('line', { x1: x, x2: x, y1: padT, y2: padT + cats.length * rowH, class: 'st-grid' }));
        const t = svgEl('text', { x, y: padT + cats.length * rowH + 16, class: 'st-axis', 'text-anchor': 'middle' }); t.textContent = String(tv); svg.appendChild(t);
      }
      const scale = plotW / ticks[ticks.length - 1];
      const bh = Math.min(16, (rowH - 8) / series.length);
      cats.forEach((cat, i) => {
        const g = svgEl('g'); g.dataset.el = `cat:${cat}`; g.classList.add('st-el');
        const yRow = padT + i * rowH;
        const maxChars = Math.max(10, Math.floor(labelW / 7));
        const lab = svgEl('text', { x: x0 - 10, y: yRow + rowH / 2 + 4, class: 'st-axis st-cat', 'text-anchor': 'end' }); lab.textContent = cat.length > maxChars ? cat.slice(0, maxChars - 1) + '…' : cat; lab.appendChild(svgEl('title')).textContent = cat; g.appendChild(lab);
        series.forEach((s, si) => {
          const v = s.values[i] || 0, w = v * scale;
          const y = yRow + (rowH - (bh * series.length + 2 * (series.length - 1))) / 2 + si * (bh + 2);
          const rect = svgEl('rect', { x: x0, y, width: Math.max(0, w), height: bh, rx: 4, fill: pal[si % 8] });
          rect.appendChild(svgEl('title')).textContent = `${s.name} · ${cat}: ${v}`; g.appendChild(rect);
          if (series.length === 1) { const t = svgEl('text', { x: x0 + w + 6, y: y + bh - 3, class: 'st-value' }); t.textContent = String(v); g.appendChild(t); }
        });
        svg.appendChild(g);
      });
      svg.appendChild(svgEl('line', { x1: x0, x2: x0, y1: padT, y2: padT + cats.length * rowH, class: 'st-baseline' }));
    } else {
      // gridlines + y axis (one axis, recessive)
      const ticks = niceTicks(max);
      for (const tv of ticks) {
        const y = padT + innerH - (tv / ticks[ticks.length - 1]) * innerH;
        svg.appendChild(svgEl('line', { x1: padL, x2: W - padR, y1: y, y2: y, class: 'st-grid' }));
        const t = svgEl('text', { x: padL - 8, y: y + 4, class: 'st-axis', 'text-anchor': 'end' }); t.textContent = String(tv); svg.appendChild(t);
      }
      const yOf = (v) => padT + innerH - (v / ticks[ticks.length - 1]) * innerH;
      for (let g = 0; g < 0; g++) {
        const y = padT + innerH - (innerH * g) / 4;
        svg.appendChild(svgEl('line', { x1: padL, x2: W - padR, y1: y, y2: y, class: 'st-grid' }));
        const t = svgEl('text', { x: padL - 8, y: y + 4, class: 'st-axis', 'text-anchor': 'end' }); t.textContent = String(Math.round((max * g) / 4)); svg.appendChild(t);
      }
      const slot = innerW / Math.max(1, cats.length);
      if (c.kind === 'line') {
        series.forEach((s, si) => {
          const pts = cats.map((_, i) => [padL + slot * (i + 0.5), yOf(s.values[i] || 0)]);
          svg.appendChild(svgEl('polyline', { points: pts.map((p) => p.join(',')).join(' '), fill: 'none', stroke: pal[si % 8], 'stroke-width': 2, 'stroke-linejoin': 'round' }));
          pts.forEach(([x, y], i) => { const dot = svgEl('circle', { cx: x, cy: y, r: 4, fill: pal[si % 8], stroke: 'var(--st-surface)', 'stroke-width': 2 }); dot.dataset.el = `cat:${cats[i]}`; dot.classList.add('st-el'); dot.appendChild(svgEl('title')).textContent = `${s.name} · ${cats[i]}: ${s.values[i]}`; svg.appendChild(dot); });
        });
      } else {
        const bw = Math.min(28, (slot * 0.7) / Math.max(1, series.length));
        cats.forEach((cat, i) => {
          const g = svgEl('g'); g.dataset.el = `cat:${cat}`; g.classList.add('st-el');
          series.forEach((s, si) => {
            const v = s.values[i] || 0, h = padT + innerH - yOf(v);
            const x = padL + slot * i + (slot - bw * series.length - 2 * (series.length - 1)) / 2 + si * (bw + 2);
            const rect = svgEl('rect', { x, y: padT + innerH - h, width: bw, height: h, rx: 4, fill: pal[si % 8] });
            rect.appendChild(svgEl('title')).textContent = `${s.name} · ${cat}: ${v}`;
            g.appendChild(rect);
            if (series.length === 1) { const t = svgEl('text', { x: x + bw / 2, y: padT + innerH - h - 6, class: 'st-value', 'text-anchor': 'middle' }); t.textContent = String(v); g.appendChild(t); }
          });
          svg.appendChild(g);
        });
      }
      cats.forEach((cat, i) => {
        const t = svgEl('text', { x: padL + slot * (i + 0.5), y: H - padB + 18, class: 'st-axis', 'text-anchor': 'middle' });
        t.textContent = cat.length > 14 ? cat.slice(0, 13) + '…' : cat; t.appendChild(svgEl('title')).textContent = cat; svg.appendChild(t);
      });
      svg.appendChild(svgEl('line', { x1: padL, x2: W - padR, y1: padT + innerH, y2: padT + innerH, class: 'st-baseline' }));
    }
    wrap.appendChild(svg);
    if (series.length > 1 || c.kind === 'donut') {
      const names = c.kind === 'donut' ? cats : series.map((s) => s.name);
      wrap.appendChild(el('div', { class: 'st-legend' }, names.map((n, i) => el('span', { class: 'st-legend-item' }, [el('i', { style: `background:${pal[i % 8]}` }), n]))));
    }
    // table view (accessibility): same data as rows
    const tbl = el('details', { class: 'st-chart-table' }, [el('summary', { text: 'Table view' }), el('table', { class: 'st-table' }, [el('thead', {}, el('tr', {}, [el('th', { text: '' }), ...series.map((s) => el('th', { text: s.name }))])), el('tbody', {}, cats.map((cat, i) => el('tr', {}, [el('td', { text: cat }), ...series.map((s) => el('td', { text: String(s.values[i] ?? ''), class: 'num' }))])))])]);
    wrap.appendChild(tbl);
    return wrap;
  },
  'diagram-walkthrough'(d) {
    const steps = d.steps || [];
    const flow = el('div', { class: 'st-flow' }, steps.flatMap((s, i) => [withId(el('div', { class: 'st-step' }, [el('div', { class: 'st-step-n', text: String(i + 1) }), el('div', { class: 'st-step-label', text: s.label }), s.detail ? el('div', { class: 'st-step-detail', text: s.detail }) : null]), 'step', s.id), i < steps.length - 1 ? el('div', { class: 'st-arrow', 'aria-hidden': 'true', text: '→' }) : null]));
    const wrap = el('div', { class: 'st-flow-wrap' }, flow);
    if (d.diagram?.mermaid) {
      const host = el('div', { class: 'st-mermaid' }, el('pre', { class: 'st-mermaid-src', text: d.diagram.mermaid }));
      wrap.appendChild(host);
      renderMermaid(host, d.diagram.mermaid);
    }
    else if (d.diagram?.src) wrap.appendChild(el('img', { src: d.diagram.src, alt: d.caption || 'diagram', class: 'st-diagram-img' }));
    return wrap;
  },
  outline(d) {
    const tree = (nodes, depth) => el('ul', { class: `st-outline d${depth}` }, (nodes || []).map((n) => withId(el('li', {}, [el('div', { class: 'st-node', text: n.title }), n.children?.length ? tree(n.children, depth + 1) : null]), 'node', n.id)));
    return tree(d.nodes, 0);
  },
  compare(d) {
    const c = d.compare || { points: [] };
    const rows = (c.points || []).map((p) => withId(el('div', { class: 'st-cmp-row' }, [el('div', { class: 'st-cmp-label', text: p.label }), el('div', { class: 'st-cmp-cell', text: p.left, 'data-side': c.left }), el('div', { class: 'st-cmp-cell', text: p.right, 'data-side': c.right })]), 'point', p.id));
    const head = el('div', { class: 'st-cmp-row st-cmp-head' }, [el('div', {}), el('div', { class: 'st-cmp-cell', text: c.left }), el('div', { class: 'st-cmp-cell', text: c.right })]);
    return el('div', { class: 'st-cmp' }, [head, ...rows, c.verdict ? el('div', { class: 'st-verdict', text: c.verdict }) : null]);
  },
  'narrative-only'(d) {
    return el('div', { class: 'st-narrative' }, (d.paragraphs || []).map((p, i) => withId(el('p', { text: p }), 'para', `p${i + 1}`)));
  },
};

let mermaidP = null;
async function renderMermaid(host, src) {
  try {
    mermaidP ||= import('https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.esm.min.mjs').then((m) => { m.default.initialize({ startOnLoad: false, theme: isDark() ? 'dark' : 'neutral', securityLevel: 'strict' }); return m.default; });
    const mermaid = await mermaidP;
    const { svg } = await mermaid.render('st-m-' + Math.random().toString(36).slice(2), src);
    host.innerHTML = svg;
  } catch (e) { host.querySelector('.st-mermaid-src')?.classList.add('visible'); console.warn('mermaid render failed', e); }
}

export const LAYOUTS = Object.keys(RENDER);

export function renderScene(container, scene) {
  container.innerHTML = '';
  container.dataset.layout = scene.layout;
  hostWidth = container.clientWidth || container.parentElement?.clientWidth || 0;
  const body = (RENDER[scene.layout] || RENDER['narrative-only'])(scene.data || {});
  container.appendChild(body);
  if (scene.data?.caption) container.appendChild(el('div', { class: 'st-caption', text: scene.data.caption }));
  const elements = new Map();
  for (const n of container.querySelectorAll('[data-el]')) elements.set(n.dataset.el, n);
  let current = null;
  return {
    elements,
    focus(id) {
      if (current) current.classList.remove('st-focus');
      current = null;
      if (!id) return null;
      const n = elements.get(id) || elements.get(String(id).replace(/^[a-z]+:/, '')) || [...elements.entries()].find(([k]) => k.endsWith(':' + String(id).replace(/^[a-z]+:/, '')))?.[1];
      if (!n) return null;
      n.classList.add('st-focus'); current = n;
      try { n.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' }); } catch {}
      return n;
    },
  };
}

// Renderer-side CSS (tokens overridable by the host page).
export const STAGE_CSS = `
.st-el{transition:outline-color .25s, transform .25s, box-shadow .25s}
.st-focus{outline:2px solid var(--st-accent,#2a78d6);outline-offset:3px;border-radius:8px;box-shadow:0 0 0 6px color-mix(in srgb,var(--st-accent,#2a78d6) 18%,transparent)}
svg .st-focus{outline:none;filter:drop-shadow(0 0 6px var(--st-accent,#2a78d6))}
.st-tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px}
.st-tile{padding:16px 18px;border:1px solid var(--st-border,#ddd);border-radius:12px;background:var(--st-surface,#fcfcfb)}
.st-tile-value{font-size:2rem;font-weight:600;line-height:1.1;font-variant-numeric:tabular-nums}
.st-tile-label{color:var(--st-muted,#666);margin-top:4px}
.st-tile-delta{font-size:.85rem;color:var(--st-muted,#666)}
.st-list{list-style:none;margin:0;padding:0;display:grid;gap:8px;counter-reset:it}
.st-item{padding:12px 14px 12px 44px;border:1px solid var(--st-border,#ddd);border-radius:10px;background:var(--st-surface,#fcfcfb);position:relative;counter-increment:it}
.st-item::before{content:counter(it);position:absolute;left:14px;top:12px;width:22px;height:22px;border-radius:50%;background:var(--st-accent,#2a78d6);color:#fff;font-size:.8rem;display:grid;place-items:center}
.st-item-title{font-weight:600;text-decoration:none;color:inherit}
.st-item-sub{color:var(--st-muted,#666);font-size:.9rem;margin-top:2px}
.st-table-wrap{overflow-x:auto}
.st-table{border-collapse:collapse;width:100%;font-size:.95rem}
.st-table th,.st-table td{padding:8px 10px;border-bottom:1px solid var(--st-border,#ddd);text-align:left;vertical-align:top}
.st-table th{color:var(--st-muted,#666);font-weight:600;font-size:.8rem;text-transform:uppercase;letter-spacing:.03em}
.st-table td.num{text-align:right;font-variant-numeric:tabular-nums}
.st-chart-wrap{display:grid;gap:8px}
.st-chart{width:100%;height:auto;max-height:340px}
.st-grid{stroke:var(--st-border,#ddd);stroke-width:1}
.st-baseline{stroke:var(--st-muted,#666);stroke-width:1}
.st-axis{fill:var(--st-muted,#666);font-size:11px}
.st-value{fill:var(--st-fg,#111);font-size:11px}
.st-legend{display:flex;flex-wrap:wrap;gap:12px;font-size:.85rem;color:var(--st-muted,#666)}
.st-legend-item i{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:6px;vertical-align:middle}
.st-chart-table summary{cursor:pointer;color:var(--st-muted,#666);font-size:.85rem}
.st-flow-wrap{display:grid;gap:12px}
.st-flow{display:flex;flex-wrap:wrap;align-items:stretch;gap:8px}
.st-step{flex:1 1 150px;min-width:140px;padding:12px 14px;border:1px solid var(--st-border,#ddd);border-radius:10px;background:var(--st-surface,#fcfcfb)}
.st-step-n{width:22px;height:22px;border-radius:50%;background:var(--st-accent,#2a78d6);color:#fff;font-size:.8rem;display:grid;place-items:center;margin-bottom:6px}
.st-step-label{font-weight:600}
.st-step-detail{color:var(--st-muted,#666);font-size:.85rem;margin-top:4px}
.st-arrow{align-self:center;color:var(--st-muted,#666);font-size:1.2rem}
.st-diagram-img{max-width:100%;border-radius:8px}
.st-outline{list-style:none;margin:0;padding:0}
.st-outline.d1,.st-outline.d2{padding-left:18px;border-left:2px solid var(--st-border,#ddd);margin-left:10px}
.st-node{padding:8px 10px;margin:4px 0;border-radius:8px;background:var(--st-surface,#fcfcfb);border:1px solid var(--st-border,#ddd)}
.st-outline.d0>li>.st-node{font-weight:600}
.st-cmp{display:grid;gap:6px}
.st-cmp-row{display:grid;grid-template-columns:minmax(120px,1fr) 2fr 2fr;gap:8px;padding:8px 10px;border-radius:8px;border:1px solid var(--st-border,#ddd);background:var(--st-surface,#fcfcfb)}
.st-cmp-head{border:none;background:transparent;font-weight:600;color:var(--st-muted,#666)}
.st-cmp-label{font-weight:600}
.st-verdict{margin-top:8px;padding:12px 14px;border-left:3px solid var(--st-accent,#2a78d6);background:var(--st-surface,#fcfcfb);border-radius:0 8px 8px 0}
.st-narrative p{font-size:1.1rem;line-height:1.6;max-width:62ch}
.st-chart-h{max-height:none}
.st-cat{font-size:12px;fill:var(--st-fg,#111)}
.st-mermaid{overflow-x:auto;padding:8px;border:1px solid var(--st-border,#ddd);border-radius:10px;background:var(--st-surface,#fcfcfb)}
.st-mermaid svg{max-width:none;height:auto}
.st-mermaid-src{display:none;white-space:pre-wrap;font-size:.8rem;margin:0}
.st-mermaid-src.visible{display:block}
.st-caption{margin-top:10px;color:var(--st-muted,#666);font-size:.9rem}
@media (max-width:640px){.st-cmp-row{grid-template-columns:1fr}.st-cmp-head{display:none}.st-cmp-cell::before{content:attr(data-side);color:var(--st-muted,#666);font-size:.8rem;display:block}}
`;
