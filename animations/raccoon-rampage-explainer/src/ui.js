// On-screen language: captions, step banners, stamps, speech bubbles, arrows, bursts,
// score panels and transitions. All timing helpers take the scene's local time t and
// the moment the element appears (t0) and, where relevant, leaves (t1).

// ---------------------------------------------------------------- captions
// Caption on a torn paper strip, bottom centre by default.
// o: x, y, size, font, col, bg, rot, maxW, align
RR.caption = (text, t, t0, t1, o = {}) => {
  const a = RR.env(t, t0, t1, 0.35, 0.3);
  if (a <= 0) return;
  const k = RR.E.outBack(RR.seg(t, t0, t0 + 0.45));
  const size = o.size ?? 58, font = o.font ?? 'hand';
  const x = o.x ?? RR.W / 2, y = (o.y ?? 972) + (1 - k) * 40 + (t > t1 - 0.3 ? (1 - a) * 20 : 0);
  const tw = RR.textWidth(text, { font, size });
  const w = tw + size * 1.4, h = size * 1.35;
  const seed = RR.strHash(text);
  const bg = o.bg ?? RR.C.white, col = o.col ?? RR.C.ink;
  // The paper strip + text is painted once per caption and reused (drawing it live cost
  // as much as a character).
  const SW = Math.ceil(w + 40), SH = Math.ceil(h + 40);
  const spr = RR.sprite(['cap', text, font, size, bg, col].join('|'), SW, SH, () => {
    push(); translate(SW / 2 - 3, SH / 2 - 4);
    const strip = [];
    const n = 10;
    for (let i = 0; i <= n; i++) strip.push([-w / 2 + (w * i) / n, -h / 2 + RR.hrange(seed + i, -3, 3)]);
    for (let i = n; i >= 0; i--) strip.push([-w / 2 + (w * i) / n, h / 2 + RR.hrange(seed + 50 + i, -3, 3)]);
    RR.flat(strip.map(([px, py]) => [px + 6, py + 8]), RR.C.ink, 40);
    RR.ink(strip, { fill: bg, stroke: RR.C.ink, w: 0.9, curve: 0.1 });
    RR.text(text, 0, size * 0.33, { font, size, col });
    pop();
  }, { res: 1.25 });
  push();
  translate(x, y);
  rotate((o.rot ?? RR.hrange(seed, -0.018, 0.018)));
  scale(RR.lerp(0.85, 1, k));
  RR.drawSprite(spr, 3, 4, { w: SW, h: SH, alpha: a });
  pop();
};

// Big step banner on a painted ribbon (Monthoers). o: x, y, size, col, bg, sub (small line under)
RR.banner = (text, t, t0, t1, o = {}) => {
  const a = RR.env(t, t0, t1, 0.25, 0.35);
  if (a <= 0) return;
  const grow = RR.E.outCubic(RR.seg(t, t0, t0 + 0.45));
  const size = o.size ?? 92;
  const x = o.x ?? RR.W / 2, y = o.y ?? 150;
  const tw = RR.textWidth(text, { font: 'title', size });
  const w = tw + size * 1.2, h = size * 1.25;
  const seed = RR.strHash(text) + 7;
  const bg = o.bg ?? RR.C.plumDark;
  // Ribbon painted once, then stretched open horizontally; text drawn on top.
  const SW = Math.ceil(w + 100), SH = Math.ceil(h + 50);
  const spr = RR.sprite(['ban', text, size, bg].join('|'), SW, SH, () => {
    push(); translate(SW / 2 - 4, SH / 2 - 5);
    const pts = [];
    const n = 14;
    for (let i = 0; i <= n; i++) pts.push([-w / 2 + (w * i) / n, -h / 2 + RR.hrange(seed + i, -5, 5)]);
    pts.push([w / 2 + 26, 0]);
    for (let i = n; i >= 0; i--) pts.push([-w / 2 + (w * i) / n, h / 2 + RR.hrange(seed + 40 + i, -5, 5)]);
    pts.push([-w / 2 - 26, 0]);
    RR.flat(pts.map(([px, py]) => [px + 8, py + 10]), RR.C.ink, 50);
    RR.ink(pts, { fill: bg, stroke: false, curve: 0.05 });
    pop();
  }, { res: 1.25 });
  push();
  translate(x, y - (1 - a) * 30);
  rotate(o.rot ?? -0.015);
  RR.drawSprite(spr, 4 * grow, 5, { w: SW, h: SH, sx: Math.max(0.02, grow), alpha: a });
  if (grow > 0.6) RR.text(text, 0, size * 0.35, { font: 'title', size, col: o.col ?? RR.C.card, alpha: a * RR.seg(t, t0 + 0.2, t0 + 0.45) });
  pop();
  if (o.sub) RR.caption(o.sub, t, t0 + 0.4, t1, { y: y + h * 0.95, size: size * 0.5 });
};

// Rubber stamp that slams down. kind 'pass' | 'fail' or o.col. o: rot, size
RR.stamp = (text, x, y, t, t0, o = {}) => {
  if (t < t0) return;
  const k = RR.seg(t, t0, t0 + 0.22, 'inQuad');
  const sc = RR.lerp(2.4, 1, k) + (k >= 1 ? 0.06 * Math.exp(-(t - t0 - 0.22) * 12) * Math.sin((t - t0) * 40) : 0);
  const a = RR.clamp(k * 1.4) * (o.alpha ?? 1);
  const col = o.col || (o.kind === 'fail' ? RR.C.red : RR.C.greenDeep);
  const size = o.size ?? 80;
  const tw = RR.textWidth(text, { font: 'title', size });
  const w = tw + size * 0.8, h = size * 1.2;
  const SW = Math.ceil(w + 30), SH = Math.ceil(h + 30);
  const spr = RR.sprite(['stamp', text, col, size].join('|'), SW, SH, () => {
    push(); translate(SW / 2, SH / 2);
    RR.ink(RR.rrectPts(-w / 2, -h / 2, w, h, 12), { stroke: col, w: 3.4, curve: 0.2, fill: RR.C.white, alpha: 150 });
    RR.ink(RR.rrectPts(-w / 2 + 10, -h / 2 + 10, w - 20, h - 20, 8), { stroke: col, w: 1.4, curve: 0.2 });
    RR.text(text, 0, size * 0.36, { font: 'title', size, col });
    pop();
  }, { res: 1.5 });
  push();
  translate(x, y);
  rotate(o.rot ?? -0.18);
  scale(sc);
  RR.drawSprite(spr, 0, 0, { w: SW, h: SH, alpha: a });
  pop();
};

// Speech bubble pointing at (tx, ty). o: size, w (max width), col, bg, tail side
RR.bubble = (text, x, y, tx, ty, t, t0, t1, o = {}) => {
  const a = RR.env(t, t0, t1, 0.2, 0.2);
  if (a <= 0) return;
  const k = RR.E.outBack(RR.seg(t, t0, t0 + 0.35));
  const size = o.size ?? 40;
  const lines = RR.wrap(text, o.w ?? 360, { font: 'hand', size });
  const tw = Math.max(...lines.map((l) => RR.textWidth(l, { font: 'hand', size })));
  const w = tw + size * 1.2, h = lines.length * size * 1.1 + size * 0.8;
  push();
  translate(x, y);
  scale(k);
  const body = RR.ellipsePts(0, 0, w * 0.62, h * 0.7, 26);
  const ang = Math.atan2(ty - y, tx - x);
  const base = [Math.cos(ang) * w * 0.35, Math.sin(ang) * h * 0.4];
  const tail = [[base[0] - Math.sin(ang) * 22, base[1] + Math.cos(ang) * 22], [(tx - x) / k * 0.8, (ty - y) / k * 0.8], [base[0] + Math.sin(ang) * 22, base[1] - Math.cos(ang) * 22]];
  RR.ink(tail, { fill: o.bg ?? RR.C.white, w: 1, curve: 0.2 });
  RR.ink(body, { fill: o.bg ?? RR.C.white, w: 1.1, curve: 0.5 });
  RR.ink(RR.ellipsePts(0, 0, w * 0.6, h * 0.66, 26), { fill: o.bg ?? RR.C.white, stroke: false, curve: 0.5 });
  lines.forEach((l, i) => RR.text(l, 0, (i - (lines.length - 1) / 2) * size * 1.1 + size * 0.33, { font: 'hand', size, col: o.col ?? RR.C.ink, alpha: a }));
  pop();
};

// Round badge with a number (vote counts, influence). o: r, col, bg, font size
RR.badge = (label, x, y, o = {}) => {
  const r = o.r ?? 34;
  const s = o.scale ?? 1;
  if (s <= 0.01) return;
  const bg = o.bg ?? RR.C.white, st = o.stroke ?? RR.C.ink, col = o.col ?? RR.C.ink, font = o.font ?? 'title', size = o.size ?? r * 1.3;
  const D = Math.ceil(r * 2 + 16);
  const spr = RR.sprite(['badge', label, r, bg, st, col, font, size].join('|'), D, D, () => {
    RR.inkCircle(D / 2, D / 2, r, { fill: bg, stroke: st, w: 1.2 });
    RR.text(String(label), D / 2, D / 2 + r * 0.4, { font, size, col });
  }, { res: 1.5 });
  push(); translate(x, y); scale(s);
  RR.drawSprite(spr, 0, 0, { w: D, h: D, alpha: o.alpha ?? 1 });
  pop();
};

// Hand-drawn arrow drawn on from p to q with progress u (0..1). o: col, w, bend
RR.arrow = (p, q, u, o = {}) => {
  if (u <= 0) return;
  const bend = o.bend ?? 0.2;
  const mid = [(p[0] + q[0]) / 2 - (q[1] - p[1]) * bend, (p[1] + q[1]) / 2 + (q[0] - p[0]) * bend];
  const N = 12, pts = [];
  for (let i = 0; i <= N * u; i++) {
    const s = i / N;
    pts.push([(1 - s) * (1 - s) * p[0] + 2 * (1 - s) * s * mid[0] + s * s * q[0], (1 - s) * (1 - s) * p[1] + 2 * (1 - s) * s * mid[1] + s * s * q[1]]);
  }
  if (pts.length < 2) return;
  const col = o.col ?? RR.C.ink, w = o.w ?? 2.2;
  RR.inkLine(pts, { col, w, curve: 0.5 });
  if (u >= 0.98) {
    const e = pts[pts.length - 1], d = pts[pts.length - 2];
    const ang = Math.atan2(e[1] - d[1], e[0] - d[0]);
    const L = o.head ?? 26;
    RR.inkLine([[e[0] - Math.cos(ang - 0.5) * L, e[1] - Math.sin(ang - 0.5) * L], e, [e[0] - Math.cos(ang + 0.5) * L, e[1] - Math.sin(ang + 0.5) * L]], { col, w, curve: 0 });
  }
};

// Star burst / sparkles around a point, playing from t0 over dur.
RR.sparkle = (x, y, t, t0, o = {}) => {
  const dur = o.dur ?? 0.8, u = RR.seg(t, t0, t0 + dur);
  if (u <= 0 || u >= 1) return;
  const n = o.n ?? 8, R = o.r ?? 90;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + RR.hr(i + (o.seed ?? 0)) * 0.5;
    const d = R * RR.E.outCubic(u) * RR.hrange(i + 3, 0.7, 1.2);
    const s = (1 - u) * (o.size ?? 18) * RR.hrange(i + 7, 0.6, 1.2);
    push(); translate(x + Math.cos(a) * d, y + Math.sin(a) * d); rotate(u * 3);
    RR.ink(RR.starPts(0, 0, s, s * 0.45, 4), { fill: o.col ?? RR.C.gold, stroke: false, curve: 0.1 });
    pop();
  }
};

// Dust poof (for tokens leaving the board)
RR.poof = (x, y, t, t0, o = {}) => {
  const u = RR.seg(t, t0, t0 + (o.dur ?? 0.6));
  if (u <= 0 || u >= 1) return;
  const n = 7, R = (o.r ?? 40);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const d = R * RR.E.outCubic(u);
    RR.flatEllipse(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.7, R * 0.45 * (1 - u * 0.6), R * 0.4 * (1 - u * 0.6), o.col ?? '#e9e1d4', 220 * (1 - u));
  }
};

// Screen shake offset [dx, dy] after an impact at t0.
RR.shake = (t, t0, dur = 0.4, amp = 12) => {
  const u = (t - t0) / dur;
  if (u < 0 || u > 1) return [0, 0];
  const d = amp * (1 - u) * (1 - u);
  return [Math.sin(t * 71) * d, Math.cos(t * 63) * d];
};

// Full-screen colour fade (alpha 0..1)
RR.fadeScreen = (alpha, col = RR.C.plumDark) => {
  if (alpha <= 0) return;
  RR.flat([[0, 0], [RR.W, 0], [RR.W, RR.H], [0, RR.H]], col, 255 * RR.clamp(alpha));
};

// Ink wipe transition. Big painted swipes cross the screen; u = 0 (clear) .. 1 (covered).
// dir 1 sweeps left-to-right; use `out` to uncover (swipes continue off the far side).
RR.wipe = (u, o = {}) => {
  if (u <= 0 && !o.out) return;
  if (u >= 1 && o.out) return; // fully uncovered
  const col = o.col ?? RR.C.plumDark;
  const dir = o.dir ?? 1;
  const bands = 6;
  RR.flush();
  for (let i = 0; i < bands; i++) {
    const delay = RR.hr(i + 11) * 0.25;
    const k = RR.E.inOutCubic(RR.clamp((u - delay) / (1 - 0.25)));
    if (k <= 0 && !o.out) continue;
    const y0 = (i / bands) * RR.H - 40, y1 = ((i + 1) / bands) * RR.H + 40;
    let xa, xb;
    if (!o.out) { xa = -200; xb = -200 + k * (RR.W + 400); } else { xa = -200 + k * (RR.W + 400); xb = RR.W + 200; }
    if (dir < 0) { const na = RR.W - xb, nb = RR.W - xa; xa = na; xb = nb; }
    const pts = [];
    const N = 8;
    for (let j = 0; j <= N; j++) pts.push([xa + (xb - xa) * (j / N), y0 + RR.hrange(i * 30 + j, -18, 18)]);
    pts.push([xb + 60 * dir * (o.out ? -1 : 1) * 0, (y0 + y1) / 2]);
    for (let j = N; j >= 0; j--) pts.push([xa + (xb - xa) * (j / N), y1 + RR.hrange(i * 30 + j + 15, -18, 18)]);
    RR.flat(pts, col, 255);
  }
};

// Player score strip (screen space): scores = {de, fr, ar, hu}; o: x, y, max, highlight role, crown role, alpha
RR.scoreBoard = (scores, o = {}) => {
  const roles = o.roles ?? ['de', 'fr', 'ar', 'hu'];
  const x = o.x ?? 1480, y = o.y ?? 360, gap = o.gap ?? 92, max = o.max ?? 20;
  const a = o.alpha ?? 1;
  if (a <= 0) return;
  roles.forEach((r, i) => {
    const yy = y + i * gap;
    const v = scores[r] ?? 0;
    // static row panel + role badge, painted once
    const row = RR.sprite('scoreRow:' + r, 440, 88, () => {
      RR.ink(RR.rrectPts(10, 10, 420, 68, 18), { fill: RR.C.white, alpha: 230, w: 0.9 });
      push(); translate(50, 44); RR.ICONS.role(22, { role: r }); pop();
    }, { res: 1.5 });
    RR.drawSprite(row, x - 70, yy - 44, { w: 440, h: 88, ax: 0, ay: 0, alpha: a });
    const bw = 300 * RR.clamp(v / max);
    if (bw > 4) RR.ink(RR.rrectPts(x + 20, yy - 14, bw, 28, 10), { fill: RR.C[r], stroke: RR.C[r + 'Dark'] || RR.C.ink, w: 0.8 });
    RR.text(String(Math.round(v)), x + 30 + bw + 26, yy + 13, { font: 'title', size: 40, col: RR.C.ink, alpha: a });
    if (o.crown === r) { push(); translate(x - 20, yy - 44); RR.ICONS.crown(22, {}); pop(); }
  });
};
