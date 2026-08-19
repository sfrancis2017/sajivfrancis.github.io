/* Avatar Engine — 2.5D depth-mesh avatar renderer (plan 05, phase A).
 *
 * Renders an "avatar package" (texture.png + depth.png + landmarks.json +
 * config.json, produced by scripts/make_package.py) onto a depth-displaced
 * three.js plane with landmark-driven facial animation:
 *   - jaw stretch + inner-mouth shading along the fitted lip-seam curve
 *   - procedural eyelids: the avatar's own above-eye skin stretches down,
 *     its own lash/eyeliner color rides the curved closing edge
 *   - idle sway, breathing, scheduled blinks, depth parallax
 *
 * Design rules proven in the phase-S spike (see plan 05 build log):
 *   - texture.colorSpace = NoColorSpace (ShaderMaterial bypasses three's
 *     color management; passthrough keeps exact portrait colors)
 *   - ALL synthetic shading derives from the avatar's own texture —
 *     no palette constants — so any complexion/style renders correctly
 *   - facial guide-lines are landmark-FITTED CURVES, never straight lines
 *   - blink touches only the eye openings, by construction
 *
 * Usage (classic script; three.js is imported dynamically on first use):
 *   AvatarEngine.create(canvasEl, '/avatars/maya-head').then(function (eng) {
 *     eng.setLevel(0.6);   // speech amplitude 0..1 → jaw (attack/decay inside)
 *     eng.blink();         // manual blink (auto-blinks are scheduled anyway)
 *     eng.setIdle(true);   // sway/breath/blink scheduler (default true)
 *     eng.setLook(x, y);   // -1..1 parallax bias (idle drift adds on top)
 *     eng.dispose();
 *   });
 * create() rejects when WebGL/CDN is unavailable — callers keep their
 * static <img> fallback in that case.
 */
(function () {
  'use strict';

  var THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js';
  var threePromise = null;
  function loadThree() {
    if (!threePromise) threePromise = import(THREE_URL);
    return threePromise;
  }

  var VERT = [
    'uniform sampler2D uDepth;',
    'uniform float uDepthScale, uJaw;',
    'uniform vec2 uLook, uMouth;',
    'uniform vec3 uLipCurve;',
    'uniform float uMouthHalfW, uChinV, uJawDrop;',
    'varying vec2 vUv;',
    'void main() {',
    '  vUv = uv;',
    '  float d = texture2D(uDepth, uv).r;',
    '  vec3 p = position;',
    '  p.z += d * uDepthScale;',
    '  float jawDrop = uJawDrop * uJaw;',
    '  float wx = 1.0 - smoothstep(0.0, uMouthHalfW * 2.6, abs(uv.x - uMouth.x));',
    '  float lipV = uLipCurve.x * uv.x * uv.x + uLipCurve.y * uv.x + uLipCurve.z;',
    '  float m = uMouthHalfW;', // face-relative unit for the seam band
    '  float below = smoothstep(lipV + m * 0.12, lipV - m * 0.18, uv.y);',
    '  float chinFade = smoothstep(uChinV - m * 1.0, uChinV - m * 0.35, uv.y);',
    '  p.y -= jawDrop * wx * below * chinFade;',
    '  p.x += (d - 0.45) * uLook.x * 0.055;',
    '  p.y += (d - 0.45) * uLook.y * 0.035;',
    '  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);',
    '}',
  ].join('\n');

  var FRAG = [
    'uniform sampler2D uTex;',
    'uniform float uJaw, uBlink;',
    'uniform vec2 uMouth, uEyeL, uEyeR, uEyeAxL, uEyeAxR;',
    'uniform vec3 uLipCurve;',
    'uniform float uMouthHalfW;',
    'varying vec2 vUv;',
    // Synthetic eyelid — see file header. Skin band above the opening
    // stretches down (seamless at top); own lash color rides the curved
    // edge; at full close the edge rests at the lower-lash position.
    'vec3 lid(vec3 col, vec2 eyeC, vec2 ax) {',
    '  vec2 e = (vUv - eyeC) / ax;',
    '  float inside = 1.0 - smoothstep(0.80, 1.10, length(e));',
    '  if (inside <= 0.0 || uBlink <= 0.01) return col;',
    '  float exc = clamp(e.x, -0.99, 0.99);',
    '  float topC = sqrt(1.0 - exc * exc);',
    '  float edgeC = topC * max(1.0 - 2.35 * uBlink, -0.85);',
    '  float covered = smoothstep(edgeC - 0.07, edgeC + 0.05, e.y);',
    '  if (covered <= 0.0) return col;',
    '  float t = clamp((e.y - edgeC) / max(topC - edgeC, 0.05), 0.0, 1.0);',
    '  float srcY = topC + 0.10 + 0.32 * (1.0 - t);',
    '  float sv = eyeC.y + ax.y * srcY;',
    '  float du = ax.x * 0.13;',
    '  vec3 skin = (texture2D(uTex, vec2(vUv.x - du, sv)).rgb',
    '             + texture2D(uTex, vec2(vUv.x,      sv)).rgb',
    '             + texture2D(uTex, vec2(vUv.x + du, sv)).rgb) / 3.0;',
    '  vec3 lidCol = skin * (1.0 - 0.10 * (1.0 - t));',
    '  vec3 lashCol = texture2D(uTex, vec2(vUv.x, eyeC.y + ax.y * (topC - 0.02))).rgb;',
    '  float dEdge = (e.y - edgeC) / 0.09;',
    '  float lash = exp(-dEdge * dEdge) * smoothstep(0.05, 0.25, uBlink);',
    '  lidCol = mix(lidCol, lashCol * vec3(0.62, 0.60, 0.60), lash * 0.85);',
    '  return mix(col, lidCol, covered * inside);',
    '}',
    'void main() {',
    '  vec4 c = texture2D(uTex, vUv);',
    '  c.rgb = lid(c.rgb, uEyeL, uEyeAxL);',
    '  c.rgb = lid(c.rgb, uEyeR, uEyeAxR);',
    // Inner-mouth shading: fixed soft band at the inner-lip seam in
    // texture space (the jaw stretch pulls it open on screen). Interior
    // tone = the lip's own color darkened warm — no black slot.
    '  float dx = (vUv.x - uMouth.x) / (uMouthHalfW * 0.9);',
    '  float wx2 = 1.0 - smoothstep(0.55, 1.0, abs(dx));',
    '  float lipV = uLipCurve.x * vUv.x * vUv.x + uLipCurve.y * vUv.x + uLipCurve.z;',
    '  float dy = (vUv.y - (lipV - uMouthHalfW * 0.02)) / (uMouthHalfW * 0.11);',
    '  float band = exp(-dy * dy * 1.45) * (1.0 - smoothstep(0.8, 1.4, abs(dx)));',
    '  float cavity = band * wx2 * smoothstep(0.18, 0.55, uJaw);',
    '  vec3 cavityCol = c.rgb * vec3(0.48, 0.34, 0.36);',
    // upper teeth: an ivory band at the top of the opening. Brightness is
    // scaled from the LOCAL pixel's luminance (any complexion/art style
    // gets matching teeth); faint cosine striping suggests individual
    // teeth; they appear only once the mouth is genuinely open.
    '  float lum = dot(c.rgb, vec3(0.299, 0.587, 0.114));',
    '  vec3 toothCol = clamp(vec3(lum * 1.2 + 0.45) * vec3(1.0, 0.975, 0.93), 0.0, 1.0);',
    '  toothCol *= 0.93 + 0.07 * cos((vUv.x - uMouth.x) / max(uMouthHalfW, 1e-4) * 20.0);',
    '  float teethBand = smoothstep(-1.05, -0.55, dy) * (1.0 - smoothstep(-0.35, 0.0, dy));',
    '  float teethVis = smoothstep(0.30, 0.60, uJaw);',
    // cavity first, then teeth as their own opaque layer — blending them
    // through the cavity opacity washed them into lip gloss
    '  c.rgb = mix(c.rgb, cavityCol, cavity * 0.72);',
    '  c.rgb = mix(c.rgb, toothCol, band * wx2 * teethBand * teethVis * 0.8);',
    '  gl_FragColor = c;',
    '}',
  ].join('\n');

  // quadratic fit v = a·u² + b·u + c through three points (lip-seam curve)
  function fitCurve(p0, pc, p1) {
    var x0 = p0.u, y0 = p0.v, x1 = pc.u, y1 = pc.v, x2 = p1.u, y2 = p1.v;
    var d = (x0 - x1) * (x0 - x2) * (x1 - x2);
    return [
      (x2 * (y1 - y0) + x1 * (y0 - y2) + x0 * (y2 - y1)) / d,
      (x2 * x2 * (y0 - y1) + x1 * x1 * (y2 - y0) + x0 * x0 * (y1 - y2)) / d,
      (x1 * x2 * (x1 - x2) * y0 + x2 * x0 * (x2 - x0) * y1 + x0 * x1 * (x0 - x1) * y2) / d,
    ];
  }

  // source: either a base URL string ('/avatars/maya-full') or an object
  // spec for in-memory packages (the maker tool previews before export):
  //   { textureUrl, depthUrl, landmarks: <array>, config: {width, height} }
  function create(canvas, source, opts) {
    opts = opts || {};
    return loadThree().then(function (THREE) {
      if (typeof source === 'object' && source !== null) {
        return build(THREE, canvas, {
          texture: source.textureUrl,
          depth: source.depthUrl,
        }, source.landmarks, source.config, opts);
      }
      return Promise.all([
        fetch(source + '/landmarks.json').then(function (r) { return r.json(); }),
        fetch(source + '/config.json').then(function (r) { return r.json(); }),
      ]).then(function (loaded) {
        return build(THREE, canvas, {
          texture: source + '/texture.png',
          depth: source + '/depth.png',
        }, loaded[0], loaded[1], opts);
      });
    });
  }

  function build(THREE, canvas, urls, lms, config, opts) {
    var aspect = config.width / config.height;
    function uv(i) { return { u: lms[i][0], v: 1 - lms[i][1] }; }
    function avgPt(ids) {
      var u = 0, v = 0;
      ids.forEach(function (i) { u += uv(i).u; v += uv(i).v; });
      return { u: u / ids.length, v: v / ids.length };
    }
    function dist(a, b) { return Math.hypot(a.u - b.u, a.v - b.v); }

    var mouth = avgPt([13, 14]);
    var cornerL = uv(61), cornerR = uv(291);
    var mouthHalfW = dist(cornerL, cornerR) / 2;
    var lip = fitCurve(cornerL, mouth, cornerR);
    var mouthCU = (cornerL.u + cornerR.u) / 2;
    var chin = uv(152);
    var eyeL = avgPt([33, 133, 159, 145]);
    var eyeR = avgPt([362, 263, 386, 374]);

    var PLANE_H = 1.42;
    var renderer, texture, depthTex;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    } catch (e) {
      return Promise.reject(e);
    }
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(28, aspect, 0.1, 10);
    camera.position.z = (PLANE_H / 2) / Math.tan((28 / 2) * Math.PI / 180) * 1.005;

    var loader = new THREE.TextureLoader();
    return Promise.all([
      loader.loadAsync(urls.texture),
      loader.loadAsync(urls.depth),
    ]).then(function (tex) {
      texture = tex[0];
      depthTex = tex[1];
      texture.colorSpace = THREE.NoColorSpace; // exact portrait colors

      var uniforms = {
        uTex:        { value: texture },
        uDepth:      { value: depthTex },
        uDepthScale: { value: opts.depthScale != null ? opts.depthScale : 0.12 },
        uJaw:        { value: 0 },
        uBlink:      { value: 0 },
        uLook:       { value: new THREE.Vector2(0, 0) },
        uMouth:      { value: new THREE.Vector2(mouthCU, mouth.v) },
        uMouthHalfW: { value: mouthHalfW },
        uLipCurve:   { value: new THREE.Vector3(lip[0], lip[1], lip[2]) },
        uChinV:      { value: chin.v },
        // face-relative jaw drop: ≈ the spike's hand-tuned 0.030 for the
        // head package (mouthHalfW ≈ 0.10) and scales down for small
        // faces in full-body packages automatically
        uJawDrop:    { value: mouthHalfW * 0.30 },
        uEyeL:       { value: new THREE.Vector2(eyeL.u, eyeL.v) },
        uEyeR:       { value: new THREE.Vector2(eyeR.u, eyeR.v) },
        uEyeAxL:     { value: new THREE.Vector2(dist(uv(33), uv(133)) / 2 * 1.12, dist(uv(159), uv(145)) / 2 * 1.35) },
        uEyeAxR:     { value: new THREE.Vector2(dist(uv(362), uv(263)) / 2 * 1.12, dist(uv(386), uv(374)) / 2 * 1.35) },
      };

      var material = new THREE.ShaderMaterial({ uniforms: uniforms, vertexShader: VERT, fragmentShader: FRAG });
      var mesh = new THREE.Mesh(new THREE.PlaneGeometry(aspect * PLANE_H, PLANE_H, 128, 160), material);
      scene.add(mesh);

      function fitCanvas() {
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        var w = canvas.clientWidth, h = canvas.clientHeight;
        if (!w || !h) return;
        var bw = Math.round(w * dpr), bh = Math.round(h * dpr);
        if (canvas.width !== bw || canvas.height !== bh) {
          renderer.setSize(bw, bh, false);
        }
      }

      var st = {
        jaw: 0, level: 0, blinkPhase: 0, idle: opts.idle !== false,
        lookX: 0, lookY: 0, disposed: false,
      };
      var nextBlink = performance.now() + 2000 + Math.random() * 3000;
      var raf = 0;

      function tick(now) {
        if (st.disposed) return;
        raf = requestAnimationFrame(tick);
        fitCanvas();
        var t = now / 1000;

        // jaw: fast attack / slow decay toward the fed speech level
        var target = Math.min(0.85, st.level);
        st.jaw += (target - st.jaw) * (target > st.jaw ? 0.45 : 0.18);
        uniforms.uJaw.value = st.jaw;

        // blinks
        if (st.idle && st.blinkPhase === 0 && now > nextBlink) {
          st.blinkPhase = 0.0001;
          nextBlink = now + 2800 + Math.random() * 3500;
        }
        if (st.blinkPhase > 0) {
          st.blinkPhase += 0.09;
          uniforms.uBlink.value = Math.sin(Math.min(st.blinkPhase, Math.PI));
          if (st.blinkPhase >= Math.PI) { st.blinkPhase = 0; uniforms.uBlink.value = 0; }
        }

        // idle drift + parallax
        var lx = st.lookX, ly = st.lookY;
        if (st.idle) {
          lx += Math.sin(t * 0.45) * 0.28;
          ly += Math.sin(t * 0.31 + 1.7) * 0.16;
          mesh.rotation.z = Math.sin(t * 0.5) * 0.006;
          mesh.position.y = Math.sin(t * 0.8) * 0.004 + (st.level > 0.05 ? Math.sin(t * 2.2) * 0.004 : 0);
        }
        uniforms.uLook.value.set(lx, ly);
        mesh.rotation.y = lx * 0.05;
        mesh.rotation.x = -ly * 0.03;

        renderer.render(scene, camera);
      }
      raf = requestAnimationFrame(tick);

      return {
        setLevel: function (v) { st.level = Math.max(0, Math.min(1, v || 0)); },
        blink: function () { if (st.blinkPhase === 0) st.blinkPhase = 0.0001; },
        setIdle: function (v) { st.idle = !!v; },
        setLook: function (x, y) { st.lookX = x || 0; st.lookY = y || 0; },
        uniforms: uniforms, // exposed for tests/tuning
        dispose: function () {
          st.disposed = true;
          cancelAnimationFrame(raf);
          mesh.geometry.dispose();
          material.dispose();
          texture.dispose();
          depthTex.dispose();
          renderer.dispose();
        },
      };
    });
  }

  window.AvatarEngine = { create: create };
})();
