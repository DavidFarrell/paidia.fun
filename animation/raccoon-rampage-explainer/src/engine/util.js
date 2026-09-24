// Maths, easing, keyframes, deterministic noise and colour helpers.
const W = 1920, H = 1080, FPS = 30;
const BEAT = 15;          // 120 BPM at 30 fps
const BAR = BEAT * 4;     // 2 seconds
const TAU = Math.PI * 2;

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const remap = (v, a, b, c, d) => c + (d - c) * ((v - a) / (b - a));
const smooth = (t) => t * t * (3 - 2 * t);
// progress of frame f through [a, b], clamped to 0..1
const seg = (f, a, b) => clamp((f - a) / (b - a));

const E = {
  lin: (t) => t,
  inQ: (t) => t * t,
  outQ: (t) => 1 - (1 - t) * (1 - t),
  io: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  inC: (t) => t * t * t,
  outC: (t) => 1 - Math.pow(1 - t, 3),
  outQuart: (t) => 1 - Math.pow(1 - t, 4),
  ioS: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  // overshooting eases are pinned at the ends: rounding would otherwise give
  // tiny non-zero values at t = 0, and callers test "> 0" to show things
  outBack: (t) => { if (t <= 0) return 0; if (t >= 1) return 1; const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  outBackS: (t) => { if (t <= 0) return 0; if (t >= 1) return 1; const c1 = 3.2, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  inBack: (t) => { if (t <= 0) return 0; if (t >= 1) return 1; const c1 = 1.70158; return (c1 + 1) * t * t * t - c1 * t * t; },
  outElastic: (t) => (t === 0 || t === 1 ? t : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (TAU / 3)) + 1),
  outBounce: (t) => {
    const n1 = 7.5625, d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  },
};

// ease a segment: ease(f, a, b, fn)
const ez = (f, a, b, fn = E.io) => fn(seg(f, a, b));

// keyframes: kf(f, [[frame, value, easeIntoThisKey], ...]); values may be numbers or arrays
function kf(f, keys) {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [f1, v1, e] = keys[i];
    if (f <= f1) {
      const [f0, v0] = keys[i - 1];
      const t = (e || E.io)((f - f0) / (f1 - f0 || 1));
      if (Array.isArray(v0)) return v0.map((v, j) => lerp(v, v1[j], t));
      return lerp(v0, v1, t);
    }
  }
  return keys[keys.length - 1][1];
}

// hop between two points along an arc; returns [x, y]
function arcPos(t, x0, y0, x1, y1, height) {
  return [lerp(x0, x1, t), lerp(y0, y1, t) - Math.sin(Math.PI * t) * height];
}

// deterministic hashing / random
function hash(n) {
  let x = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
}
function rng(seed) {
  let a = (seed * 2654435761) >>> 0 || 1;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function noise1(x, seed = 0) {
  const i = Math.floor(x), f = x - i;
  const a = hash(i + seed * 101.3), b = hash(i + 1 + seed * 101.3);
  return lerp(a, b, smooth(f));
}
function noise2(x, y, seed = 0) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const h = (a, b) => hash(a * 57.3 + b * 113.1 + seed * 71.7);
  const u = smooth(fx), v = smooth(fy);
  return lerp(lerp(h(ix, iy), h(ix + 1, iy), u), lerp(h(ix, iy + 1), h(ix + 1, iy + 1), u), v);
}
// gentle wobble in -1..1 over time (for idle motion)
const wob = (f, speed = 0.05, seed = 0) => noise1(f * speed, seed) * 2 - 1;

// colours
function hexRgb(h) {
  if (h[0] !== '#') return [0, 0, 0];
  if (h.length === 4) h = '#' + h[1] + h[1] + h[2] + h[2] + h[3] + h[3];
  return [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
}
const rgbHex = (r) => '#' + r.map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
const mix = (a, b, t) => { const A = hexRgb(a), B = hexRgb(b); return rgbHex(A.map((v, i) => lerp(v, B[i], t))); };
// k < 0 darkens towards ink, k > 0 lightens towards white
const shade = (c, k) => (k < 0 ? mix(c, '#1a1320', -k) : mix(c, '#ffffff', k));
const rgba = (c, a) => { const [r, g, b] = hexRgb(c); return `rgba(${r},${g},${b},${a})`; };
