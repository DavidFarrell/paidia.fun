// Timeline: scene registry, transitions, audio cues and frame rendering.
//
// Scenes register themselves with scene({ id, bars, draw(f), trans }).
// draw(f) receives the scene-local frame (it keeps being called past the end
// of the scene while the next scene's transition plays).
const SCENES = [];
let TOTAL = 0;
let IMAGES = {};
let READY = false;
let MAIN = null;              // main canvas context
const CUES = new Map();       // audio cues: key -> { t, name, gain }
let SCENE_START = 0;

function scene(def) { SCENES.push(def); }

function buildTimeline() {
  let f = 0;
  for (const s of SCENES) {
    s.start = f;
    s.len = Math.round(s.bars * BAR);
    f += s.len;
  }
  TOTAL = f;
}

// register an audio cue at scene-local frame lf (deduplicated)
function cue(name, lf, gain = 1, extra = {}) {
  const fr = SCENE_START + Math.round(lf);
  const key = name + '@' + fr;
  if (!CUES.has(key)) CUES.set(key, { t: fr / FPS, frame: fr, name, gain, ...extra });
}

// ---- offscreen buffers for transitions ----
const BUF = {};
function buffer(name) {
  if (!BUF[name]) {
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    BUF[name] = c.getContext('2d');
  }
  return BUF[name];
}

function drawScene(s, lf, ctx) {
  const prev = C;
  C = ctx;
  SCENE_START = s.start;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  s.draw(lf);
  ctx.restore();
  C = prev;
}

function renderFrame(F) {
  F = clamp(Math.round(F), 0, TOTAL - 1);
  P.boil = Math.floor(F / 4) % 3; // hand-drawn line boil, on fours
  let i = SCENES.findIndex((s) => F >= s.start && F < s.start + s.len);
  if (i < 0) i = SCENES.length - 1;
  const s = SCENES[i];
  const lf = F - s.start;
  const tr = s.trans;
  const ctx = MAIN;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (tr && i > 0 && lf < tr.len) {
    const a = buffer('a'), b = buffer('b');
    const prevScene = SCENES[i - 1];
    drawScene(prevScene, F - prevScene.start, a);
    drawScene(s, lf, b);
    const t = lf / tr.len;
    TRANSITIONS[tr.type](ctx, a.canvas, b.canvas, t, tr, lf);
  } else {
    drawScene(s, lf, ctx);
  }
  // paper grain over everything
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = 0.32;
  if (IMAGES.paper) ctx.drawImage(IMAGES.paper, 0, 0, W, H);
  ctx.restore();
  // gentle vignette
  ctx.save();
  const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 1.05);
  g.addColorStop(0, 'rgba(40,25,45,0)');
  g.addColorStop(1, 'rgba(40,25,45,0.28)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

// ---- transitions ----
const TRANSITIONS = {
  // cross dissolve
  fade(ctx, A, B, t) {
    ctx.drawImage(A, 0, 0);
    ctx.globalAlpha = E.ioS(t);
    ctx.drawImage(B, 0, 0);
    ctx.globalAlpha = 1;
  },
  // one big plum brush stroke sweeps across; the next scene appears behind it
  brush(ctx, A, B, t, tr) {
    const img = IMAGES[tr.stroke || 'stroke_b'];
    const dir = tr.dir ?? 1;
    const e = E.io(t);
    const sw = W * 1.9, sh = H * 1.9;
    // x of the stroke's leading (right) edge, travelling from off-left to off-right
    const lead = lerp(-60, W + sw * 0.72, e);
    const tail = lead - sw * 0.72;
    ctx.drawImage(A, 0, 0);
    ctx.save();
    ctx.beginPath();
    if (dir > 0) ctx.rect(0, 0, Math.max(0, tail + sw * 0.35), H);
    else ctx.rect(W - Math.max(0, tail + sw * 0.35), 0, W, H);
    ctx.clip();
    ctx.drawImage(B, 0, 0);
    ctx.restore();
    if (img) {
      ctx.save();
      if (dir < 0) { ctx.translate(W, 0); ctx.scale(-1, 1); }
      ctx.translate(lead, H / 2);
      ctx.rotate(-0.06);
      ctx.drawImage(img, -sw, -sh / 2, sw, sh);
      ctx.restore();
    }
  },
  // ragged watercolour iris opening from a point
  iris(ctx, A, B, t, tr) {
    ctx.drawImage(A, 0, 0);
    const cx = tr.x ?? W / 2, cy = tr.y ?? H / 2;
    const R = Math.hypot(W, H) * E.inQ(t) * 1.05;
    ctx.save();
    const pts = [];
    for (let k = 0; k < 48; k++) {
      const a = (k / 48) * TAU;
      const r = R * (0.9 + noise1(k * 0.7 + t * 3, 5) * 0.2);
      pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
    ctx.clip(P.path(pts, true, 0.5));
    ctx.drawImage(B, 0, 0);
    ctx.restore();
  },
  // slide the new scene in from the right, pushing the old one out
  push(ctx, A, B, t, tr) {
    const e = E.io(t);
    const dir = tr.dir ?? 1;
    ctx.drawImage(A, -e * W * dir, 0);
    ctx.drawImage(B, (1 - e) * W * dir, 0);
  },
  cut(ctx, A, B) { ctx.drawImage(B, 0, 0); },
};

// ---- camera helper: look at (cx, cy) with zoom z and rotation r ----
function cam(cx, cy, z, r, fn) {
  C.save();
  C.translate(W / 2, H / 2);
  C.scale(z, z);
  if (r) C.rotate(r);
  C.translate(-cx, -cy);
  fn();
  C.restore();
}

