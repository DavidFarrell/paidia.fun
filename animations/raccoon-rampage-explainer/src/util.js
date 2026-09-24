// Timing, easing, interpolation and deterministic randomness.
// Scene code must never use p5's random() for layout: it is re-seeded every boil
// frame. Use RR.hr(seed) / RR.hrange() for anything that should stay put.

RR.clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
RR.lerp = (a, b, t) => a + (b - a) * t;
RR.inv = (a, b, v) => (b === a ? 0 : (v - a) / (b - a));
RR.remap = (v, a, b, c, d) => RR.lerp(c, d, RR.inv(a, b, v));
RR.lerp2 = (p, q, t) => [RR.lerp(p[0], q[0], t), RR.lerp(p[1], q[1], t)];
RR.dist = (p, q) => Math.hypot(q[0] - p[0], q[1] - p[1]);

// Easing (t in 0..1)
RR.E = {
  linear: (t) => t,
  inQuad: (t) => t * t,
  outQuad: (t) => 1 - (1 - t) * (1 - t),
  inOutQuad: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  inCubic: (t) => t * t * t,
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outQuart: (t) => 1 - Math.pow(1 - t, 4),
  inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  outSine: (t) => Math.sin((t * Math.PI) / 2),
  inBack: (t) => 2.70158 * t * t * t - 1.70158 * t * t,
  outBack: (t) => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2),
  outBackSoft: (t) => 1 + 1.9 * Math.pow(t - 1, 3) + 0.9 * Math.pow(t - 1, 2),
  outElastic: (t) => (t === 0 || t === 1 ? t : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1),
  outBounce: (t) => {
    const n = 7.5625, d = 2.75;
    if (t < 1 / d) return n * t * t;
    if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
    if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
    return n * (t -= 2.625 / d) * t + 0.984375;
  },
};
const _ease = (e) => (typeof e === 'function' ? e : RR.E[e || 'inOutCubic']);

// Progress of t through [a, b], clamped and eased.
RR.seg = (t, a, b, ease = 'linear') => _ease(ease)(RR.clamp(RR.inv(a, b, t)));
// Tween a value (number or [x, y]) between times a and b.
RR.tw = (t, a, b, from, to, ease = 'inOutCubic') => {
  const k = RR.seg(t, a, b, ease);
  return Array.isArray(from) ? from.map((v, i) => RR.lerp(v, to[i], k)) : RR.lerp(from, to, k);
};
// Keyframes: [[time, value, easeIntoThisKey], ...] sorted by time. Values: numbers or arrays.
RR.kf = (t, keys) => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1, e] = keys[i];
    if (t <= t1) {
      const [t0, v0] = keys[i - 1];
      return RR.tw(t, t0, t1, v0, v1, e || 'inOutCubic');
    }
  }
  return keys[keys.length - 1][1];
};
// Rise-hold-fall envelope: 0 before a, ramps to 1 over fadeIn, holds, ramps down to 0 at b.
RR.env = (t, a, b, fadeIn = 0.3, fadeOut = 0.3) => {
  if (t < a || t > b) return 0;
  return Math.min(RR.clamp((t - a) / fadeIn), RR.clamp((b - t) / fadeOut));
};
// Pop-in scale with overshoot, starting at time a.
RR.pop = (t, a, dur = 0.35) => RR.E.outBack(RR.clamp((t - a) / dur));

// Deterministic hash randomness
RR.hr = (n) => {
  let x = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
};
RR.hrange = (n, a, b) => a + (b - a) * RR.hr(n);
RR.hsign = (n) => (RR.hr(n) < 0.5 ? -1 : 1);
RR.strHash = (s) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) % 100000;
};
// Smooth deterministic wobble (sum of sines) for idle motion.
RR.wob = (t, freq = 1, seed = 0) =>
  0.6 * Math.sin(t * freq * 6.283 + seed * 1.7) + 0.4 * Math.sin(t * freq * 2.31 * 6.283 + seed * 3.1);

// Paths
RR.bezier = (p0, p1, p2, p3, t) => {
  const u = 1 - t;
  return [
    u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
    u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
  ];
};
// Arc (hop) between two points: returns point at t with a vertical lift of `h`.
RR.hop = (p, q, t, h = 80) => [RR.lerp(p[0], q[0], t), RR.lerp(p[1], q[1], t) - Math.sin(Math.PI * t) * h];
// Point at arc-length fraction u along a polyline.
RR.along = (pts, u) => {
  const L = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + RR.dist(pts[i - 1], pts[i]));
  const target = RR.clamp(u) * L[L.length - 1];
  for (let i = 1; i < pts.length; i++) {
    if (target <= L[i]) return RR.lerp2(pts[i - 1], pts[i], RR.inv(L[i - 1], L[i], target));
  }
  return pts[pts.length - 1];
};

// Shape point generators (closed polygons as [[x, y], ...])
RR.ellipsePts = (cx, cy, rx, ry, n = 24, rot = 0) =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const x = Math.cos(a) * rx, y = Math.sin(a) * ry;
    return [cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)];
  });
RR.rrectPts = (x, y, w, h, r = 12, seg = 4) => {
  r = Math.min(r, w / 2, h / 2);
  const out = [];
  const corners = [[x + w - r, y + r, -Math.PI / 2], [x + w - r, y + h - r, 0], [x + r, y + h - r, Math.PI / 2], [x + r, y + r, Math.PI]];
  for (const [cx, cy, a0] of corners)
    for (let i = 0; i <= seg; i++) {
      const a = a0 + (i / seg) * (Math.PI / 2);
      out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
  return out;
};
RR.starPts = (cx, cy, r1, r2, n = 5, rot = -Math.PI / 2) =>
  Array.from({ length: n * 2 }, (_, i) => {
    const r = i % 2 ? r2 : r1, a = rot + (i / (n * 2)) * Math.PI * 2;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  });
RR.xform = (pts, x = 0, y = 0, s = 1, rot = 0, sx = 1) =>
  pts.map(([px, py]) => {
    px *= s * sx; py *= s;
    return [x + px * Math.cos(rot) - py * Math.sin(rot), y + px * Math.sin(rot) + py * Math.cos(rot)];
  });

// Colour helpers on '#rrggbb' strings
RR.hex2rgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
RR.rgb2hex = (r, g, b) => '#' + [r, g, b].map((v) => Math.round(RR.clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
RR.shade = (h, k) => { const [r, g, b] = RR.hex2rgb(h); return k <= 1 ? RR.rgb2hex(r * k, g * k, b * k) : RR.rgb2hex(r + (255 - r) * (k - 1), g + (255 - g) * (k - 1), b + (255 - b) * (k - 1)); };
RR.mix = (a, b, t) => { const p = RR.hex2rgb(a), q = RR.hex2rgb(b); return RR.rgb2hex(RR.lerp(p[0], q[0], t), RR.lerp(p[1], q[1], t), RR.lerp(p[2], q[2], t)); };
