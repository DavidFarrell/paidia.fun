// Painterly drawing on a Canvas2D context.
// Shapes get a flat colour, a watercolour texture painted with p5.brush
// (multiplied inside the shape), darker pooled edges and a hand-inked outline
// of varying width.
let C = null; // current 2D context

const P = {
  img: {},    // loaded images (p5.brush assets)
  pat: {},    // CanvasPatterns built from textures
  boil: 0,    // changes every few frames for a hand-drawn line boil
  frame: 0,   // current frame, for idle motion such as blinking

  init(images) {
    this.img = images;
    const ctx = document.createElement('canvas').getContext('2d');
    for (const k of ['mottle', 'mottle_fine', 'paper']) {
      if (images[k]) this.pat[k] = ctx.createPattern(images[k], 'repeat');
    }
  },

  // ---- geometry -----------------------------------------------------------
  // Catmull-Rom spline through pts as cubic Béziers; s = 0 gives straight lines
  path(pts, closed = true, s = 0.5) {
    const p = new Path2D();
    const n = pts.length;
    if (n < 2) return p;
    p.moveTo(pts[0][0], pts[0][1]);
    if (s <= 0) {
      for (let i = 1; i < n; i++) p.lineTo(pts[i][0], pts[i][1]);
      if (closed) p.closePath();
      return p;
    }
    const k = s / 3;
    const last = closed ? n : n - 1;
    for (let i = 0; i < last; i++) {
      const p0 = pts[closed ? (i - 1 + n) % n : Math.max(i - 1, 0)];
      const p1 = pts[i];
      const p2 = pts[(i + 1) % n];
      const p3 = pts[closed ? (i + 2) % n : Math.min(i + 2, n - 1)];
      p.bezierCurveTo(
        p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k,
        p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k,
        p2[0], p2[1]);
    }
    if (closed) p.closePath();
    return p;
  },

  // points along the same spline, roughly `step` apart
  dense(pts, closed = true, s = 0.5, step = 5) {
    const out = [];
    const n = pts.length;
    const k = s / 3;
    const last = closed ? n : n - 1;
    for (let i = 0; i < last; i++) {
      const p0 = pts[closed ? (i - 1 + n) % n : Math.max(i - 1, 0)];
      const p1 = pts[i];
      const p2 = pts[(i + 1) % n];
      const p3 = pts[closed ? (i + 2) % n : Math.min(i + 2, n - 1)];
      const c1 = [p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k];
      const c2 = [p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k];
      const len = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
      const m = Math.max(2, Math.ceil(len / step));
      for (let j = 0; j < m; j++) {
        const t = j / m, u = 1 - t;
        out.push([
          u * u * u * p1[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p2[0],
          u * u * u * p1[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p2[1],
        ]);
      }
    }
    if (!closed) out.push(pts[n - 1]);
    return out;
  },

  wobble(pts, amp = 1.2, seed = 0) {
    if (!amp) return pts;
    return pts.map(([x, y], i) => [
      x + (noise2(i * 0.61, seed * 3.1) - 0.5) * 2 * amp,
      y + (noise2(i * 0.61 + 40, seed * 3.1) - 0.5) * 2 * amp,
    ]);
  },

  ellipsePts(cx, cy, rx, ry, n = 18, rot = 0) {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      const x = Math.cos(a) * rx, y = Math.sin(a) * ry;
      pts.push([cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]);
    }
    return pts;
  },

  rrectPts(x, y, w, h, r, n = 4) {
    r = Math.min(r, w / 2, h / 2);
    const pts = [];
    const corner = (cx, cy, a0) => {
      for (let i = 0; i <= n; i++) {
        const a = a0 + (i / n) * (Math.PI / 2);
        pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
      }
    };
    corner(x + w - r, y + r, -Math.PI / 2);
    corner(x + w - r, y + h - r, 0);
    corner(x + r, y + h - r, Math.PI / 2);
    corner(x + r, y + r, Math.PI);
    return pts;
  },

  bbox(pts) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const [x, y] of pts) {
      if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y;
    }
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  },

  // ---- painting -------------------------------------------------------------
  // o: fill, tex ('mottle_fine' | 'mottle' | false), texA, texS, texX, texY,
  //    edge (alpha of pooled edge), edgeW, ink (colour | false), lw, smooth,
  //    wob (wobble px), seed, closed, alpha
  shape(pts, o = {}) {
    const ctx = C;
    const closed = o.closed !== false;
    const s = o.smooth ?? 0.5;
    const seed = o.seed ?? 0;
    const wp = this.wobble(pts, o.wob ?? 0.8, seed + this.boil);
    const path = this.path(wp, closed, s);
    const b = this.bbox(wp);
    if (o.alpha !== undefined) { ctx.save(); ctx.globalAlpha *= o.alpha; }
    if (o.fill && closed) {
      ctx.fillStyle = o.fill;
      ctx.fill(path);
      const texName = o.tex === undefined ? 'mottle_fine' : o.tex;
      if (texName && this.pat[texName]) {
        ctx.save();
        ctx.clip(path);
        ctx.globalCompositeOperation = 'multiply';
        ctx.globalAlpha *= o.texA ?? 0.5;
        const pat = this.pat[texName];
        const sc = o.texS ?? 0.5;
        pat.setTransform(new DOMMatrix().translate(o.texX ?? (hash(seed) * 700), o.texY ?? (hash(seed + 9) * 700)).scale(sc));
        ctx.fillStyle = pat;
        ctx.fillRect(b.x - 4, b.y - 4, b.w + 8, b.h + 8);
        ctx.restore();
      }
      const edge = o.edge ?? 0.28;
      if (edge > 0) {
        ctx.save();
        ctx.clip(path);
        ctx.globalAlpha *= edge;
        ctx.strokeStyle = o.edgeCol || shade(o.fill, -0.4);
        ctx.lineWidth = (o.edgeW ?? 6) * 2;
        ctx.lineJoin = 'round';
        ctx.stroke(path);
        ctx.globalAlpha *= 0.6;
        ctx.lineWidth = (o.edgeW ?? 6) * 0.9;
        ctx.stroke(path);
        ctx.restore();
      }
    }
    if (o.ink !== false) {
      const d = this.dense(wp, closed, s, 4);
      this.ink(d, { col: o.ink || PAL.ink, w: o.lw ?? 3, closed, seed, taper: o.taper });
    }
    if (o.alpha !== undefined) ctx.restore();
    return path;
  },

  // variable-width ink line along a dense polyline, batched by width
  ink(d, o = {}) {
    const ctx = C;
    const n = d.length;
    if (n < 2) return;
    const w = o.w ?? 3;
    const seed = o.seed ?? 0;
    const closed = !!o.closed;
    const taper = o.taper ?? !closed;
    const LV = 7;
    const buckets = Array.from({ length: LV }, () => new Path2D());
    const segs = closed ? n : n - 1;
    for (let i = 0; i < segs; i++) {
      const t = i / segs;
      let k = 0.62 + 0.75 * noise1(i * 0.09 + seed * 7.7, seed);
      if (taper) k *= Math.min(1, Math.sin(Math.PI * t) * 2.2 + 0.15);
      const lv = clamp(Math.round(k * (LV - 1) / 1.4), 0, LV - 1);
      const a = d[i], b = d[(i + 1) % n];
      buckets[lv].moveTo(a[0], a[1]);
      buckets[lv].lineTo(b[0], b[1]);
    }
    ctx.save();
    ctx.strokeStyle = o.col || PAL.ink;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let lv = 0; lv < LV; lv++) {
      ctx.lineWidth = w * (0.25 + (lv / (LV - 1)) * 1.4);
      ctx.stroke(buckets[lv]);
    }
    ctx.restore();
  },

  // open ink stroke through control points
  line(pts, o = {}) {
    const wp = this.wobble(pts, o.wob ?? 0.6, (o.seed ?? 0) + this.boil);
    const d = this.dense(wp, false, o.smooth ?? 0.5, 4);
    this.ink(d, { col: o.col || PAL.ink, w: o.w ?? 3, seed: o.seed ?? 0, taper: o.taper ?? true });
  },

  ellipse(cx, cy, rx, ry, o = {}) {
    return this.shape(this.ellipsePts(cx, cy, rx, ry, o.n ?? 18, o.rot ?? 0), o);
  },

  rrect(x, y, w, h, r, o = {}) {
    return this.shape(this.rrectPts(x, y, w, h, r, o.n ?? 4), { smooth: 0.15, ...o });
  },

  // soft contact shadow
  shadow(cx, cy, rx, ry, a = 0.22) {
    const ctx = C;
    ctx.save();
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rx);
    g.addColorStop(0, rgba(PAL.plumDark, a));
    g.addColorStop(0.7, rgba(PAL.plumDark, a * 0.6));
    g.addColorStop(1, rgba(PAL.plumDark, 0));
    ctx.fillStyle = g;
    ctx.translate(cx, cy);
    ctx.scale(1, ry / rx);
    ctx.translate(-cx, -cy);
    ctx.beginPath();
    ctx.arc(cx, cy, rx, 0, TAU);
    ctx.fill();
    ctx.restore();
  },

  glow(cx, cy, r, col, a = 0.5) {
    const ctx = C;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, rgba(col, a));
    g.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = g;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  },

  // full-rect texture wash (e.g. to texture a background)
  texRect(x, y, w, h, name = 'mottle', a = 0.4, sc = 1, ox = 0, oy = 0) {
    const ctx = C;
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha *= a;
    const pat = this.pat[name];
    pat.setTransform(new DOMMatrix().translate(ox, oy).scale(sc));
    ctx.fillStyle = pat;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  },

  // helper: run fn with a transform
  at(x, y, rot, sc, fn) {
    C.save();
    C.translate(x, y);
    if (rot) C.rotate(rot);
    if (sc !== undefined && sc !== 1) {
      if (Array.isArray(sc)) C.scale(sc[0], sc[1]); else C.scale(sc, sc);
    }
    fn();
    C.restore();
  },
};
