// Avatar presence (plan 10 §6) — portable: positions an avatar layer inside a
// stage container, beside whatever element is being narrated.
//
//   const presence = createPresence(layerEl, stageEl, { home: homeEl });
//   presence.setSize('m');            // s | m | l (pre-built keyframes, animated between)
//   presence.moveTo(targetEl);        // sit beside this element (null → home)
//   presence.update();                // re-place after layout/resize
//
// Rules: never covers the target; prefers the side with free space, falls
// back to below (phones); clamps inside the stage; becomes translucent when
// its box overlaps content; movement is eased so size and position read as
// continuous. All geometry is computed from live rects, so it follows
// whatever layout is on screen.

export function createPresence(layerEl, stageEl, { home = null, sizes = { s: 110, m: 160, l: 230 }, aspect = 3 / 4, margin = 12, ease = 600, contentSelector = '.st-el, .st-caption, .st-verdict, .st-legend, .st-chart-table, .st-narrative p' } = {}) {
  let size = 'm';
  let target = null;
  let lastRect = null;
  let lastCands = [];
  layerEl.style.position = 'absolute';
  layerEl.style.transition = `left ${ease}ms cubic-bezier(.2,.8,.2,1), top ${ease}ms cubic-bezier(.2,.8,.2,1), width ${ease}ms ease, height ${ease}ms ease, opacity .3s ease`;
  layerEl.style.pointerEvents = 'none';
  if (getComputedStyle(stageEl).position === 'static') stageEl.style.position = 'relative';

  const NARROW = 600;
  const spacer = document.createElement('div'); spacer.className = 'avatar-seat-spacer'; spacer.setAttribute('aria-hidden', 'true');
  const px = () => { const narrow = stageEl.clientWidth < NARROW; const w = narrow ? sizes.s : (sizes[size] ?? sizes.m); return { w, h: Math.round(w / aspect), narrow }; };
  const rel = (r) => { const s = stageEl.getBoundingClientRect(); return { left: r.left - s.left, top: r.top - s.top, right: r.right - s.left, bottom: r.bottom - s.top, width: r.width, height: r.height, stageW: s.width, stageH: s.height }; };

  function place() {
    const { w, h, narrow } = px();
    // Narrow stages: make room below the subject instead of covering neighbours.
    if (narrow && target && target.isConnected) {
      const host = target.ownerSVGElement ? target.ownerSVGElement.parentElement : target;
      if (spacer.previousElementSibling !== host) host.insertAdjacentElement('afterend', spacer);
      spacer.style.height = `${h + margin * 2}px`;
    } else if (spacer.isConnected) spacer.remove();
    const stageW = stageEl.clientWidth, stageH = stageEl.scrollHeight;
    let left, top;
    const t = target && target.isConnected ? rel(target.getBoundingClientRect()) : null;
    if (t) {
      // Candidate seats around the target, in preference order; pick the first
      // with no overlap on other content, else the least overlap (translucent).
      const content = [...stageEl.querySelectorAll(contentSelector)].filter((n) => n !== target && !(target && target.contains(n)) && !n.contains(target)).map((n) => rel(n.getBoundingClientRect())).filter((r) => r.width > 0 && r.height > 0);
      const overlapArea = (L, T) => content.reduce((a, r) => a + Math.max(0, Math.min(r.right, L + w) - Math.max(r.left, L)) * Math.max(0, Math.min(r.bottom, T + h) - Math.max(r.top, T)), 0);
      // Seats are clamped horizontally; vertically the stage may GROW (up to
      // `maxGrow` px) so a seat below the content stays near the subject.
      const maxLeft = stageW - w - margin, maxGrow = 240;
      const clamp = ([L, T]) => [Math.max(margin, Math.min(maxLeft, L)), Math.max(margin, T)];
      const homeSeat = home && home.isConnected ? (() => { const hr = rel(home.getBoundingClientRect()); return [hr.left + Math.max(0, (hr.width - w) / 2), hr.top]; })() : null;
      const cands = [
        [t.right + margin, t.top + t.height / 2 - h / 2],            // right of target
        [t.left - margin - w, t.top + t.height / 2 - h / 2],         // left of target
        [Math.max(margin, t.right - w), t.bottom + margin],          // below, right-aligned
        [t.left, t.bottom + margin],                                 // below, left-aligned
        [Math.max(margin, t.right - w), t.top - margin - h],         // above
        ...(homeSeat ? [homeSeat] : []),                             // the free gutter
      ].map(clamp).map(([L, T]) => {
        const coversTarget = !(t.right < L || t.left > L + w || t.bottom < T || t.top > T + h);
        const grow = Math.max(0, T + h + margin - stageH);
        const dist = Math.hypot((L + w / 2) - (t.left + t.width / 2), (T + h / 2) - (t.top + t.height / 2));
        return { L, T, area: overlapArea(L, T) / (w * h), coversTarget, grow, dist };
      });
      const ok = cands.filter((c) => !c.coversTarget && c.grow <= maxGrow).sort((x, y) => x.dist - y.dist);
      // Near beats clean: a close seat with moderate overlap (translucent) wins;
      // a close seat with heavy overlap still beats a far clean one on narrow
      // stages; the clean gutter is the fallback.
      const pick = ok.find((c) => c.area <= 0.5) || ok.find((c) => c.area <= 0.85 && c.dist < 320) || ok.find((c) => c.area === 0) || ok.sort((x, y) => x.area - y.area)[0] || cands[cands.length - 1];
      lastCands = cands.map((c) => ({ ...c, picked: c === pick }));
      left = pick.L; top = pick.T;
      stageEl.style.minHeight = pick.grow > 0 ? `${Math.ceil(stageH + pick.grow)}px` : '';
    } else if (home && home.isConnected) {
      const hr = rel(home.getBoundingClientRect());
      left = hr.left + Math.max(0, (hr.width - w) / 2); top = hr.top;
    } else { left = stageW - w - margin; top = margin; }
    left = Math.max(margin, Math.min(stageW - w - margin, left));
    top = t ? Math.max(margin, top) : Math.max(margin, Math.min(Math.max(margin, stageH - h - margin), top));
    if (!t) stageEl.style.minHeight = '';
    Object.assign(layerEl.style, { width: `${w}px`, height: `${h}px`, left: `${Math.round(left)}px`, top: `${Math.round(top)}px` });
    lastRect = { left, top, right: left + w, bottom: top + h };
    layerEl.dataset.size = size;
    layerEl.dataset.anchored = t ? 'target' : 'home';
    // Translucency: overlapping any content (except the target itself, which we never cover).
    const overlaps = [...stageEl.querySelectorAll(contentSelector)].some((n) => {
      if (n === target || (target && target.contains(n))) return false;
      const r = rel(n.getBoundingClientRect());
      if (r.width === 0 || r.height === 0) return false;
      return !(r.right < lastRect.left || r.left > lastRect.right || r.bottom < lastRect.top || r.top > lastRect.bottom);
    });
    layerEl.classList.toggle('translucent', overlaps);
    return { left, top, w, h, anchored: layerEl.dataset.anchored, translucent: overlaps };
  }

  const ro = new ResizeObserver(() => place());
  ro.observe(stageEl);
  window.addEventListener('scroll', onScroll, { passive: true });
  function onScroll() { /* positions are stage-relative; nothing to do unless the stage itself reflows */ }

  return {
    get size() { return size; },
    get target() { return target; },
    get rect() { return lastRect; },
    get candidates() { return lastCands; },
    setSize(s) { if (sizes[s]) size = s; return place(); },
    moveTo(el) { target = el || null; return place(); },
    update: place,
    dispose() { ro.disconnect(); spacer.remove(); window.removeEventListener('scroll', onScroll); },
  };
}

export const PRESENCE_CSS = `
.avatar-seat-spacer{width:100%}
.avatar-layer{z-index:3;border-radius:14px;overflow:hidden;opacity:1}
.avatar-layer.translucent{opacity:.62}
.avatar-layer.translucent::after{content:"";position:absolute;inset:0;backdrop-filter:blur(2px);pointer-events:none}
.avatar-layer canvas{display:block;width:100%!important;height:100%!important}
.avatar-layer .avatar-fallback{width:100%;height:100%;display:grid;place-items:center;background:linear-gradient(160deg,#e8ebf2,#cfd5e3);color:#3b4252;font-weight:600;font-size:1.4rem}
`;
