// Drawing layer: ink (p5.brush), watercolour glazes, sprites, text and camera.
//
// Ordering rule: p5.brush defers its marks and composites them in batches, so any
// native p5 drawing (text, images, flat fills) must call RR.flush() first. All the
// helpers below do that for you.

RR.flush = () => brush.flush();

// ---------------------------------------------------------------- brushes
RR.initBrushes = () => {
  brush.scaleBrushes(RR.BRUSH_SCALE);
  // Dip-pen style ink line: fairly solid with a gentle swell.
  brush.add('ink', {
    type: 'default', weight: 1.7, scatter: 0.12, sharpness: 0.7, grain: 22, opacity: 235,
    spacing: 0.25, pressure: [0.85, 1.25, 0.8], rotate: 'none', noise: 0.15,
  });
  // Softer pencil for sketchy details and hatching.
  brush.add('pencil', {
    type: 'default', weight: 0.55, scatter: 0.25, sharpness: 0.35, grain: 10, opacity: 150,
    spacing: 0.3, pressure: [1, 0.9], rotate: 'none', noise: 0.3,
  });
  // Dry brush for bold painted marks (titles, wipes, stamps).
  brush.add('dry', {
    type: 'default', weight: 5, scatter: 0.6, sharpness: 0.25, grain: 9, opacity: 170,
    spacing: 0.35, pressure: [1.1, 0.9, 0.7], rotate: 'none', noise: 0.35,
  });
  // Custom brushes are added after scaleBrushes, so scale them too.
  brush.scaleBrushes(1);
};

const _verts = (pts, closed) => {
  for (const p of pts) brush.vertex(p[0], p[1], p[2]);
};
// p5.brush culls points whose RAW (pre-transform) coordinates fall outside roughly one
// canvas size, whatever the current transform is. So every helper below translates to
// the shape's own centre and passes small local coordinates.
const _recentre = (pts) => {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of pts) { if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; }
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  return [cx, cy, pts.map((p) => (p.length > 2 ? [p[0] - cx, p[1] - cy, p[2]] : [p[0] - cx, p[1] - cy]))];
};

// Closed shape with an optional wash fill, hatching and ink outline.
// opts: fill, alpha (0-255), stroke (colour or false), w, brush, curve (0-1), hatch {d, a, col, w}
RR.ink = (pts0, o = {}) => {
  const curve = o.curve ?? 0.35;
  const [cx, cy, pts] = _recentre(pts0);
  push();
  translate(cx, cy);
  brush.noHatch();
  brush.noFill();
  if (o.fill) {
    brush.noStroke();
    brush.wash(o.fill, o.alpha ?? 255);
    brush.beginShape(curve); _verts(pts); brush.endShape(true);
    brush.noWash();
  }
  if (o.hatch) {
    const h = o.hatch;
    brush.noStroke();
    brush.hatch(h.d ?? 8, h.a ?? 0.8, { rand: h.rand ?? 0.08, continuous: false, gradient: h.gradient ?? false });
    brush.hatchStyle(h.brush || 'pencil', h.col || RR.C.ink, h.w ?? 1);
    brush.polygon(pts.map((p) => [p[0], p[1]]));
    brush.noHatch();
  }
  if (o.stroke !== false) {
    brush.set(o.brush || 'ink', o.stroke || RR.C.ink, o.w ?? 1);
    // p5.brush stops plotting a stroke once it wanders off the canvas, so a big outline
    // that leaves the frame (or a sprite tile) and comes back loses its far side. Large
    // outlines are therefore drawn as short overlapping open pieces.
    const span = Math.max(...pts.map((p) => Math.abs(p[0])), ...pts.map((p) => Math.abs(p[1])));
    if (span > 300 && pts.length >= 6) {
      const ring = pts.concat([pts[0], pts[1]]);
      const step = 3;
      for (let i = 0; i < pts.length; i += step) brush.spline(ring.slice(i, Math.min(ring.length, i + step + 2)).map((p) => [p[0], p[1]]), curve);
    } else {
      brush.beginShape(curve); _verts(pts); brush.endShape(true);
    }
    brush.noStroke();
  }
  pop();
};

// Open ink line through points (spline). opts: col, w, brush, curve
RR.inkLine = (pts0, o = {}) => {
  if (pts0.length < 2) return;
  const [cx, cy, pts] = _recentre(pts0);
  push();
  translate(cx, cy);
  brush.set(o.brush || 'ink', o.col || RR.C.ink, o.w ?? 1);
  if (pts.length === 2 && !o.curve) brush.line(pts[0][0], pts[0][1], pts[1][0], pts[1][1]);
  else brush.spline(pts, o.curve ?? 0.5);
  brush.noStroke();
  pop();
};
RR.inkEllipse = (cx, cy, rx, ry, o = {}) => RR.ink(RR.ellipsePts(cx, cy, rx, ry, o.n ?? Math.max(12, Math.min(36, Math.round((rx + ry) / 6))), o.rot ?? 0), { curve: 0.5, ...o });
RR.inkCircle = (cx, cy, r, o = {}) => RR.inkEllipse(cx, cy, r, r, o);
RR.inkRect = (x, y, w, h, r, o = {}) => RR.ink(RR.rrectPts(x, y, w, h, r), { curve: 0.15, ...o });

// Flat native fill (fast, crisp edges). Flushes pending brush work first.
RR.flat = (pts, col, alpha = 255) => {
  RR.flush();
  const c = color(col); c.setAlpha(alpha);
  noStroke(); fill(c);
  beginShape(); for (const p of pts) vertex(p[0], p[1]); endShape(CLOSE);
};
RR.flatEllipse = (cx, cy, rx, ry, col, alpha = 255) => {
  RR.flush();
  const c = color(col); c.setAlpha(alpha);
  noStroke(); fill(c); ellipse(cx, cy, rx * 2, ry * 2, 32);
};
// Soft drop shadow under props and characters.
RR.shadow = (cx, cy, rx, ry, alpha = 40) => {
  RR.flush();
  noStroke();
  for (let i = 0; i < 4; i++) {
    fill(46, 39, 51, alpha / 4);
    ellipse(cx, cy, rx * 2 * (1 - i * 0.12), ry * 2 * (1 - i * 0.12), 28);
  }
};

// ---------------------------------------------------------------- watercolour glaze
// Tyler Hobbs-style layered, deformed translucent polygons. Uses p5 random(), so call
// it inside RR.sprite() (fixed seed) or on static layers for a stable result.
function _deform(pts, depth, amt) {
  for (let d = 0; d < depth; d++) {
    const out = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      const nx = -(b[1] - a[1]) / len, ny = (b[0] - a[0]) / len;
      const off = randomGaussian(0, len * amt * a[2]);
      const tan = randomGaussian(0, len * amt * 0.3);
      out.push(a, [(a[0] + b[0]) / 2 + nx * off + (ny * -1) * tan, (a[1] + b[1]) / 2 + ny * off + nx * tan, (a[2] + b[2]) / 2 * random(0.8, 1.2)]);
    }
    pts = out;
  }
  return pts;
}
// opts: layers, alpha (per layer 0-255), spread (edge wobble), edge (edge-darkening strength)
RR.water = (pts, col, o = {}) => {
  RR.flush();
  const layers = o.layers ?? 16, alpha = o.alpha ?? 22, spread = o.spread ?? 0.05;
  const base = _deform(pts.map((p) => [p[0], p[1], random(0.4, 1.4)]), o.baseDepth ?? 1, spread * 1.2);
  const c = color(col);
  noStroke();
  for (let l = 0; l < layers; l++) {
    const poly = _deform(base, 2, spread);
    c.setAlpha(alpha);
    fill(c);
    beginShape(); for (const p of poly) vertex(p[0], p[1]); endShape(CLOSE);
  }
  if (o.edge ?? 0.5) {
    const e = color(o.edgeCol || col);
    e.setRed(red(e) * 0.8); e.setGreen(green(e) * 0.8); e.setBlue(blue(e) * 0.82);
    e.setAlpha(60 * (o.edge ?? 0.5));
    noFill(); stroke(e); strokeWeight(o.edgeW ?? 2.2);
    for (let l = 0; l < 3; l++) {
      const poly = _deform(base, 2, spread * 0.7);
      beginShape(); for (const p of poly) vertex(p[0], p[1]); endShape(CLOSE);
    }
    noStroke();
  }
};
// Scatter of tiny pigment specks inside a bounding box (granulation), for sprites.
RR.speckle = (x, y, w, h, col, n = 80, alpha = 40, rmax = 2.2) => {
  RR.flush();
  const c = color(col); c.setAlpha(alpha); noStroke(); fill(c);
  for (let i = 0; i < n; i++) circle(x + random(w), y + random(h), random(0.6, rmax));
};

// ---------------------------------------------------------------- sprites
// Paint something once into an offscreen framebuffer, then reuse it as a cut-out.
// drawFn(w, h) draws in local units with the origin at the top-left.
//
// p5.brush misbehaves when it switches between targets of different sizes (composites
// get lost or offset). So all brush painting happens in ONE scratch framebuffer the
// size of the main canvas; large sprites are painted tile by tile (the painter re-runs
// per tile with the same seed, so strokes line up) and each tile is copied across.
const _getMatrix = () => {
  const m = p5.instance._renderer.states.uModelMatrix;
  return m ? m.clone() : null;
};
const _setMatrix = (m) => { if (m) p5.instance._renderer.states.setValue('uModelMatrix', m.clone()); };
RR._sprites = {};
RR._spriteCalls = 0;
RR._scratchFb = null;
const _scratch = () => {
  if (!RR._scratchFb) {
    const sc = createFramebuffer({ width: RR.W, height: RR.H, density: 1, antialias: false });
    // Warm-up composite so the compositor has settled on this target before real work.
    sc.begin(); clear(); brush.load(sc);
    push(); translate(-RR.W / 2, -RR.H / 2);
    brush.noStroke(); brush.wash('#808080', 255); brush.rect(10, 10, 20, 20); brush.noWash();
    brush.set('HB', '#404040', 1); brush.line(40, 40, 80, 80);
    brush.flush();
    pop(); clear(); sc.end(); brush.load();
    RR._scratchFb = sc;
  }
  return RR._scratchFb;
};
RR.sprite = (key, w, h, drawFn, o = {}) => {
  const res = o.res ?? 1.5, variants = o.variants ?? 1;
  let s = RR._sprites[key];
  RR.flush();
  if (!s) {
    s = { w, h, res, fbs: [] };
    const PW = Math.ceil(w * res), PH = Math.ceil(h * res);
    for (let v = 0; v < variants; v++) {
      const fb = createFramebuffer({ width: PW, height: PH, density: 1, antialias: false });
      fb.begin(); clear(); fb.end();
      const sc = _scratch();
      for (let ty = 0; ty < PH; ty += RR.H) {
        for (let tx = 0; tx < PW; tx += RR.W) {
          const tw = Math.min(RR.W, PW - tx), th = Math.min(RR.H, PH - ty);
          sc.begin();
          clear();
          brush.load(sc);
          push();
          translate(-RR.W / 2 - tx, -RR.H / 2 - ty);
          scale(res);
          randomSeed(RR.strHash(key) + v * 101);
          noiseSeed(RR.strHash(key) + v);
          RR._deferText = [];
          drawFn(w, h, v);
          brush.flush();
          const texts = RR._deferText;
          RR._deferText = null;
          for (const [str, x, y, to, m] of texts) { push(); _setMatrix(m); RR._textNative(str, x, y, to); pop(); }
          pop();
          sc.end();
          brush.load();
          // copy the tile across, replacing pixels (keeps alpha exact)
          fb.begin();
          push();
          translate(-PW / 2, -PH / 2);
          blendMode(REPLACE);
          imageMode(CORNER);
          image(sc, tx, ty, tw, th, 0, 0, tw, th);
          blendMode(BLEND);
          pop();
          fb.end();
        }
      }
      s.fbs.push(fb);
    }
    RR._sprites[key] = s;
  }
  // Keep the random stream identical whether or not the sprite was just created.
  randomSeed(RR.frameSeed + RR.strHash(key) + ++RR._spriteCalls * 7);
  return s;
};
// Fast textured quad. p5's default image shader costs ~8x more per pixel under
// SwiftShader, so all sprite/background blits go through this minimal shader.
// Textures hold premultiplied colour (p5's WebGL convention), so alpha scales rgb too.
const _BLIT_VS = `precision highp float;
attribute vec3 aPosition; attribute vec2 aTexCoord;
uniform mat4 uModelViewMatrix; uniform mat4 uProjectionMatrix;
uniform vec4 uUV;
varying vec2 vUV;
void main(){ vUV = mix(uUV.xy, uUV.zw, aTexCoord); gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0); }`;
const _BLIT_FS = `precision mediump float;
varying vec2 vUV; uniform sampler2D uTex; uniform float uAlpha;
void main(){ gl_FragColor = texture2D(uTex, vUV) * uAlpha; }`;
let _blitShader = null;
RR.blit = (tex, x, y, w, h, alpha = 1, flipY = false) => {
  RR.flush();
  if (!_blitShader) _blitShader = createShader(_BLIT_VS, _BLIT_FS);
  shader(_blitShader);
  _blitShader.setUniform('uTex', tex);
  _blitShader.setUniform('uAlpha', alpha);
  _blitShader.setUniform('uUV', flipY ? [0, 1, 1, 0] : [0, 0, 1, 1]);
  noStroke();
  rect(x, y, w, h);
  resetShader();
};

// Draw a sprite. opts: w, h (display size), rot, alpha (0-1), sx, sy (flip/squash), ax, ay (anchor 0-1), variant
RR.drawSprite = (s, x, y, o = {}) => {
  if (!s) return;
  RR.flush();
  const w = o.w ?? s.w, h = o.h ?? (o.w ? (o.w * s.h) / s.w : s.h);
  const v = o.variant ?? (s.fbs.length > 1 ? RR.boilIndex % s.fbs.length : 0);
  push();
  translate(x, y);
  if (o.rot) rotate(o.rot);
  scale(o.sx ?? 1, o.sy ?? 1);
  if (o.slow) {
    if (o.alpha !== undefined && o.alpha < 1) tint(255, 255 * Math.max(0, o.alpha));
    imageMode(CORNER);
    image(s.fbs[v], -w * (o.ax ?? 0.5), -h * (o.ay ?? 0.5), w, h);
  } else {
    RR.blit(s.fbs[v], -w * (o.ax ?? 0.5), -h * (o.ay ?? 0.5), w, h, Math.max(0, o.alpha ?? 1), RR.FB_FLIP);
  }
  pop();
};

// ---------------------------------------------------------------- text
// Draws text with per-character font fallback. fonts: 'title' (Monthoers, the game's
// title face), 'hand' (Patrick Hand, captions), 'bold' (Kalam Bold, fallback/accents).
// opts: font, size, col, alpha (0-1), align ('left'|'center'|'right'), valign ('baseline'|'middle'|'top'),
//       rot, track (letter spacing, px), outline (colour) , outlineW
RR._runs = (str, font) => {
  const cov = RR.FONT_COVERAGE[font];
  const runs = [];
  for (const ch of str) {
    const f = !cov || cov.includes(ch) ? font : 'bold';
    if (runs.length && runs[runs.length - 1].f === f) runs[runs.length - 1].s += ch;
    else runs.push({ f, s: ch });
  }
  return runs;
};
// Advance widths come from a 2D canvas (p5's textWidth returns tight glyph bounds, which
// breaks spacing for swash letters like Monthoers' R).
const _measureCtx = document.createElement('canvas').getContext('2d');
const _family = (key) => {
  const f = RR.fonts[key].face ? RR.fonts[key].face.family : RR.fonts[key].name;
  return /^['"]/.test(f) ? f : `"${f}"`;
};
RR.measure = (str, key, size) => {
  _measureCtx.font = `${size}px ${_family(key)}`;
  return _measureCtx.measureText(str).width;
};
RR.textWidth = (str, o = {}) => {
  const font = o.font || 'hand', size = o.size || 40;
  let w = 0;
  for (const r of RR._runs(String(str), font)) {
    const sz = r.f === font ? size : size * (o.fallbackScale ?? 0.9);
    w += RR.measure(r.s, r.f, sz) + (o.track || 0) * [...r.s].length;
  }
  return w;
};
RR._deferText = null;
// Text is expensive to draw live in WebGL (~250 ms for a big line under SwiftShader), so
// by default each distinct string/style is painted once into a sprite and blitted.
// o.live draws it natively (used inside sprite painters, where it is cached anyway).
RR.text = (str, x, y, o = {}) => {
  // Inside sprite painting, text is queued and drawn after all brush work (see RR.sprite).
  if (RR._deferText) { RR._deferText.push([str, x, y, o, _getMatrix()]); return; }
  if (o.live) return RR._textNative(str, x, y, o);
  str = String(str);
  if (!str.trim()) return;
  const font = o.font || 'hand', size = o.size || 40;
  const tw = RR.textWidth(str, o);
  const pad = size * 0.25 + (o.outline ? (o.outlineW ?? size * 0.06) : 0);
  const w = Math.ceil(tw + pad * 2), h = Math.ceil(size * 1.45 + pad * 2);
  const base = pad + size * 1.05; // baseline inside the sprite
  const res = o.res ?? RR.TEXT_RES;
  const key = ['txt', font, size, o.col || RR.C.ink, o.outline || '', o.outlineW ?? '', o.shadow ? 1 : 0, o.track || 0, o.fallbackScale ?? '', res, str].join('|');
  const spr = RR.sprite(key, w, h, () => RR._textNative(str, pad, base, { ...o, align: 'left', valign: 'baseline', alpha: 1, rot: 0, scale: 1 }), { res });
  const x0 = o.align === 'left' ? 0 : o.align === 'right' ? -tw : -tw / 2;
  const vy = o.valign === 'middle' ? size * 0.34 : o.valign === 'top' ? size * 0.75 : 0;
  push();
  translate(x, y);
  if (o.rot) rotate(o.rot);
  if (o.scale) scale(o.scale);
  RR.drawSprite(spr, x0 - pad, vy - base, { w, h, ax: 0, ay: 0, alpha: o.alpha ?? 1 });
  pop();
};
RR._textNative = (str, x, y, o = {}) => {
  RR.flush();
  const font = o.font || 'hand', size = o.size || 40;
  const runs = RR._runs(String(str), font);
  const total = RR.textWidth(String(str), o);
  let x0 = o.align === 'left' ? 0 : o.align === 'right' ? -total : -total / 2;
  const vy = o.valign === 'middle' ? size * 0.34 : o.valign === 'top' ? size * 0.75 : 0;
  push();
  translate(x, y);
  if (o.rot) rotate(o.rot);
  if (o.scale) scale(o.scale);
  const c = color(o.col || RR.C.ink); c.setAlpha(255 * (o.alpha ?? 1));
  textAlign(LEFT, BASELINE);
  const drawRuns = (col, dx, dy) => {
    let cx = x0;
    for (const r of runs) {
      textFont(RR.fonts[r.f]);
      const sz = r.f === font ? size : size * (o.fallbackScale ?? 0.9);
      textSize(sz);
      fill(col); noStroke();
      if (o.track) {
        for (const ch of r.s) { text(ch, cx + dx, vy + dy); cx += RR.measure(ch, r.f, sz) + o.track; }
      } else {
        text(r.s, cx + dx, vy + dy); cx += RR.measure(r.s, r.f, sz);
      }
    }
  };
  if (o.outline) {
    const oc = color(o.outline); oc.setAlpha(255 * (o.alpha ?? 1));
    const ow = o.outlineW ?? size * 0.06;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      drawRuns(oc, Math.cos(a) * ow, Math.sin(a) * ow);
    }
  }
  if (o.shadow) {
    const sc = color(RR.C.ink); sc.setAlpha(60 * (o.alpha ?? 1));
    drawRuns(sc, size * 0.04, size * 0.06);
  }
  drawRuns(c, 0, 0);
  pop();
};

// ---------------------------------------------------------------- camera
// cam: {x, y} world point shown at screen centre, z zoom, r roll (radians).
RR.cam = (x, y, z = 1, r = 0) => ({ x, y, z, r });
RR.lerpCam = (a, b, t) => ({ x: RR.lerp(a.x, b.x, t), y: RR.lerp(a.y, b.y, t), z: Math.exp(RR.lerp(Math.log(a.z), Math.log(b.z), t)), r: RR.lerp(a.r || 0, b.r || 0, t) });
// Keyframed camera: keys = [[time, cam, ease], ...]
RR.camKf = (t, keys) => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) return RR.lerpCam(keys[i - 1][1], keys[i][1], RR.seg(t, keys[i - 1][0], keys[i][0], keys[i][2] || 'inOutCubic'));
  }
  return keys[keys.length - 1][1];
};
RR.withCam = (cam, fn) => {
  RR.flush();
  push();
  translate(RR.W / 2, RR.H / 2);
  if (cam.r) rotate(cam.r);
  scale(cam.z);
  translate(-cam.x, -cam.y);
  RR.curCam = cam;
  fn();
  RR.flush();
  pop();
  RR.curCam = null;
};
RR.toScreen = (cam, p) => {
  const dx = (p[0] - cam.x) * cam.z, dy = (p[1] - cam.y) * cam.z, r = cam.r || 0;
  return [RR.W / 2 + dx * Math.cos(r) - dy * Math.sin(r), RR.H / 2 + dx * Math.sin(r) + dy * Math.cos(r)];
};
RR.toWorld = (cam, p) => {
  const r = -(cam.r || 0), dx = p[0] - RR.W / 2, dy = p[1] - RR.H / 2;
  return [cam.x + (dx * Math.cos(r) - dy * Math.sin(r)) / cam.z, cam.y + (dx * Math.sin(r) + dy * Math.cos(r)) / cam.z];
};
// Gentle hand-held drift to keep static shots alive.
RR.drift = (cam, t, amt = 1) => ({ ...cam, x: cam.x + RR.wob(t, 0.07, 1) * 6 * amt / cam.z, y: cam.y + RR.wob(t, 0.06, 2) * 4 * amt / cam.z, r: (cam.r || 0) + RR.wob(t, 0.05, 3) * 0.002 * amt });

// Word-wrapped text block. Returns the number of lines drawn. opts as RR.text plus lh (line height factor).
RR.wrap = (str, maxW, o = {}) => {
  const lines = [];
  for (const para of String(str).split('\n')) {
    let line = '';
    for (const word of para.split(' ')) {
      const test = line ? line + ' ' + word : word;
      if (line && RR.textWidth(test, o) > maxW) { lines.push(line); line = word; } else line = test;
    }
    lines.push(line);
  }
  return lines;
};
RR.textBlock = (str, x, y, maxW, o = {}) => {
  const lines = RR.wrap(str, maxW, o);
  const lh = (o.size || 40) * (o.lh ?? 1.15);
  lines.forEach((l, i) => RR.text(l, x, y + i * lh, o));
  return lines.length;
};
