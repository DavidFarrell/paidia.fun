// The game board, laid out like the real one in a 2400 x 1500 "board space":
// policy queue along the top, Impact Tracker on the left, the map in the
// middle, the spread area on the right and the storyline along the bottom.
const BOARD = {
  w: 2400, h: 1500,
  cardW: 172, cardH: 240,
  queueY: 250,
  map: { x: 610, y: 470, w: 1080, h: 720 },
  evalX: 2130,
  deck: [1880, 640],
  rules: [2195, 640],
  protect: [2040, 1000],
  storyY: 1340,
};

// queue slot centre (slot 1 is the front, on the right)
const qx = (i) => 210 + (8 - i) * 206;
const qpos = (i) => [qx(i), BOARD.queueY];
const storyPos = (k) => [470 + k * 380, BOARD.storyY];
const STORY_LABELS = ['BEGINNING', '5 YEARS', '10 YEARS', '15 YEARS', '20 YEARS'];

// map data coordinates (1800 x 1200) to board space
function mapPt(x, y) {
  const m = BOARD.map, k = m.w / 1800;
  return [m.x + x * k, m.y + y * k];
}

// ---- Impact Tracker path: index -9 (best) .. 0 (neutral) .. 10 (skull) ----
const TRACK = (() => {
  const pts = [];
  const n = 20;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    pts.push([300 + 150 * Math.sin(t * Math.PI * 2.3 + 0.2), 1150 - t * 640]);
  }
  return pts;
})();
const trackPos = (p) => {
  const i = clamp(p + 9, 0, 19);
  const a = Math.floor(i), b = Math.min(19, a + 1), t = i - a;
  return [lerp(TRACK[a][0], TRACK[b][0], t), lerp(TRACK[a][1], TRACK[b][1], t)];
};
function trackCol(p) {
  if (p < 0) return mix(PAL.good, '#cfe39a', clamp((p + 9) / 9) * 0.8);
  if (p === 0) return PAL.plumDark;
  if (p >= 10) return PAL.badDark;
  return mix('#f0c168', PAL.bad, clamp((p - 1) / 8));
}

// ---- static board ---------------------------------------------------------
function boardBase(o = {}) {
  const b = BOARD;
  // table shadow and board
  P.shadow(b.w / 2, b.h + 20, b.w * 0.55, 60, 0.35);
  P.rrect(0, 0, b.w, b.h, 60, { fill: PAL.plum, tex: 'mottle', texA: 0.55, texS: 1.1, lw: 5, seed: 1, edge: 0.3, edgeW: 16 });
  // queue band
  P.rrect(40, 44, 2320, 412, 34, { fill: '#4c3b50', tex: 'mottle', texA: 0.4, ink: false, seed: 2, edge: 0.25 });
  for (let i = 8; i >= 1; i--) {
    const [x, y] = qpos(i);
    const up = i <= 4;
    P.rrect(x - b.cardW / 2 - 6, y - b.cardH / 2 - 6, b.cardW + 12, b.cardH + 12, 18,
      { fill: up ? '#e3d3bb' : '#7c6582', tex: 'mottle_fine', texA: 0.4, lw: 2.5, seed: 10 + i, edge: 0.25 });
    // slot number badge
    P.ellipse(x, y + b.cardH / 2 + 30, 19, 19, { fill: up ? PAL.cardCream : PAL.lavender, lw: 2, seed: 30 + i });
    T.draw(String(i), x, y + b.cardH / 2 + 32, { size: 26, col: PAL.plumDark });
  }
  // flow arrow along the queue
  P.line([[70, 150], [72, 250], [70, 350]], { w: 0, col: PAL.lavender, seed: 40, taper: false });
  // evaluation box
  P.rrect(b.evalX - 190, 70, 380, 360, 26, { fill: '#e8dccb', tex: 'mottle_fine', texA: 0.45, lw: 3, seed: 42, edge: 0.2 });
  T.draw('POLICY', b.evalX, 118, { size: 40, col: PAL.plumDark, spacing: 2 });
  T.draw('EVALUATION', b.evalX, 160, { size: 40, col: PAL.plumDark, spacing: 2 });
  P.rrect(b.evalX - 96, 190, 192, 212, 14, { fill: '#d8c8b2', ink: PAL.mauve, lw: 2, seed: 43, texA: 0.3, edge: 0.15 });

  // map panel
  const m = b.map;
  P.shadow(m.x + m.w / 2, m.y + m.h + 10, m.w * 0.52, 26, 0.3);
  C.save();
  const mp = P.rrect(m.x, m.y, m.w, m.h, 30, { fill: PAL.sea, ink: false, seed: 50, tex: false, edge: 0 });
  C.clip(mp);
  if (P.img.map) C.drawImage(P.img.map, m.x, m.y, m.w, m.h);
  C.restore();
  P.rrect(m.x, m.y, m.w, m.h, 30, { fill: false, lw: 4, seed: 51 });

  // Impact Tracker
  boardTracker();

  // spread area
  P.rrect(1740, 470, 620, 720, 30, { fill: '#4c3b50', tex: 'mottle', texA: 0.4, ink: false, seed: 60, edge: 0.25 });
  spreadRules(b.rules[0], b.rules[1], o.spreadLevel ?? 1, 0.95);
  // spread protection ring
  const [px, py] = b.protect;
  P.ellipse(px, py, 150, 150, { fill: '#5d4a62', lw: 3, seed: 61, n: 30, texA: 0.4 });
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * TAU;
    P.line([[px + Math.cos(a) * 118, py + Math.sin(a) * 118], [px + Math.cos(a) * 144, py + Math.sin(a) * 144]], { w: 3, col: PAL.lavender, seed: 62 + k, taper: false });
  }
  P.ellipse(px, py, 108, 108, { fill: PAL.lilac, lw: 2.5, seed: 80, n: 28, texA: 0.35 });
  shieldIcon(px, py - 26, 42, PAL.plumMid, 2.5);
  T.draw('SPREAD', px, py + 42, { size: 30, col: PAL.plumDark, spacing: 1 });
  T.draw('PROTECTION', px, py + 72, { size: 24, col: PAL.plumDark, spacing: 1 });

  // storyline band
  P.rrect(40, 1225, 2320, 240, 34, { fill: '#4c3b50', tex: 'mottle', texA: 0.4, ink: false, seed: 90, edge: 0.25 });
  for (let k = 0; k < 5; k++) {
    const [x, y] = storyPos(k);
    P.rrect(x - 90, y - 104, 180, 208, 16, { fill: '#7c6582', tex: 'mottle_fine', texA: 0.4, lw: 2.5, seed: 91 + k, edge: 0.25 });
    C.save();
    C.translate(x - 130, y);
    C.rotate(-Math.PI / 2);
    P.rrect(-96, -22, 192, 44, 10, { fill: PAL.lavender, lw: 2, seed: 100 + k, texA: 0.3 });
    T.draw(STORY_LABELS[k], 0, 2, { size: 26, col: PAL.plumDark, spacing: 1 });
    C.restore();
  }
}

function boardTracker() {
  P.rrect(40, 470, 540, 720, 30, { fill: '#4c3b50', tex: 'mottle', texA: 0.4, ink: false, seed: 110, edge: 0.25 });
  // happy raccoon napping in the leaves at the good end, skull at the bad end
  const [gx, gy] = trackPos(-9);
  P.ellipse(gx - 90, gy + 4, 70, 70, { fill: '#9cc98a', lw: 3, seed: 111, texA: 0.45 });
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * TAU;
    P.ellipse(gx - 90 + Math.cos(a) * 44, gy + 4 + Math.sin(a) * 44, 18, 11, { fill: PAL.leaf, lw: 1.8, seed: 112 + k, rot: a, texA: 0.4 });
  }
  raccoon({ x: gx - 90, y: gy + 44, s: 0.36, eyes: 'closed', mouth: 'smile', arms: [0.2, 0.2], shadow: false, seed: 60, tilt: 0.25 });
  const [sx, sy] = trackPos(10);
  // path tiles
  for (let p = -9; p <= 10; p++) {
    const [x, y] = trackPos(p);
    const [x2, y2] = trackPos(Math.min(10, p + 0.5));
    const [x1, y1] = trackPos(Math.max(-9, p - 0.5));
    const ang = Math.atan2(y2 - y1, x2 - x1);
    C.save();
    C.translate(x, y);
    C.rotate(ang);
    if (p === 0) P.ellipse(0, 0, 26, 26, { fill: PAL.plumDark, lw: 3, seed: 120 });
    else if (p === 10) {
      P.ellipse(0, 0, 40, 40, { fill: PAL.badDark, lw: 3, seed: 121 });
      C.rotate(-ang);
      skullIcon(0, 2, 24, PAL.cardCream, 2);
    } else P.rrect(-16, -30, 32, 60, 9, { fill: trackCol(p), lw: 2.4, seed: 130 + p, texA: 0.35 });
    C.restore();
  }
  C.save();
  C.translate(90, 830);
  C.rotate(-Math.PI / 2);
  T.draw('IMPACT TRACKER', 0, 0, { size: 34, col: PAL.lavender, spacing: 3 });
  C.restore();
}

function spreadRules(x, y, level = 1, s = 1) {
  C.save();
  C.translate(x, y);
  C.scale(s, s);
  P.rrect(-90, -126, 180, 252, 16, { fill: PAL.lilac, lw: 3, seed: 140, texA: 0.4 });
  T.draw('SPREAD RULES', 0, -96, { size: 26, col: PAL.plumDark, spacing: 1 });
  T.draw('LEVEL ' + level, 0, -64, { size: 30, col: PAL.plumDark, spacing: 1 });
  const cols = ['#6fb466', '#ea9550', '#cf4b40'];
  for (let k = 0; k < 3; k++) {
    const yy = -14 + k * 48;
    P.rrect(-66, yy - 16, 32, 32, 5, { fill: cols[k], lw: 2, seed: 141 + k, texA: 0.3 });
    T.draw('=', -18, yy, { size: 26, col: PAL.plumDark, head: false });
    // number of cards dealt to each pile
    const n = k + level;
    for (let c = 0; c < Math.min(n, 3); c++) P.rrect(4 + c * 20, yy - 16, 16, 30, 3, { fill: '#8b7392', lw: 1.6, seed: 145 + k * 3 + c, texA: 0.2, edge: 0 });
  }
  C.restore();
}

// ---- dynamic helpers --------------------------------------------------------
function highlightRect(x, y, w, h, f, col = PAL.cardCream) {
  C.save();
  C.globalAlpha = 0.5 + 0.35 * Math.sin(f * 0.25);
  C.strokeStyle = col;
  C.lineWidth = 8;
  C.setLineDash([22, 14]);
  C.lineDashOffset = -f * 2;
  C.beginPath();
  C.roundRect(x, y, w, h, 24);
  C.stroke();
  C.restore();
}

// Germany / France tint on the map (alpha 0..1)
function countryTint(iso, col, a) {
  if (a <= 0 || !MAPDATA) return;
  const c = MAPDATA.countries.find((k) => k.iso === iso);
  if (!c) return;
  C.save();
  const m = BOARD.map, k = m.w / 1800;
  C.translate(m.x, m.y);
  C.scale(k, k);
  C.globalAlpha *= a;
  for (const ring of c.rings) {
    if (ring.length < 20) continue;
    P.shape(ring, { fill: col, tex: 'mottle', texA: 0.5, texS: 1.4, lw: 3.5 / k * 0.6, seed: iso === 'DEU' ? 150 : 151, smooth: 0, wob: 0, edge: 0.35, edgeW: 14 });
  }
  C.restore();
}

// coloured spread spaces (the 'Rest of Europe' squares) on the map
function mapSpaces(a = 1) {
  if (!MAPDATA || a <= 0) return;
  const cols = { green: '#6fb466', orange: '#ea9550', red: '#cf4b40' };
  C.save();
  C.globalAlpha *= a;
  for (const [k, list] of Object.entries(MAPDATA.spaces)) {
    list.forEach(([x, y], i) => {
      const [bx, by] = mapPt(x, y);
      P.rrect(bx - 17, by - 17, 34, 34, 6, { fill: cols[k], lw: 2.2, seed: 160 + i + k.length * 10, texA: 0.35 });
    });
  }
  C.restore();
}

// the ordered list of Rest-of-Europe spaces: all green, then orange, then red
function euSpace(i) {
  const s = MAPDATA.spaces;
  const all = [...s.green, ...s.orange, ...s.red];
  return mapPt(...all[Math.min(i, all.length - 1)]);
}
const deSlot = (i) => mapPt(...MAPDATA.slots.DEU[i % MAPDATA.slots.DEU.length]);
const frSlot = (i) => mapPt(...MAPDATA.slots.FRA[i % MAPDATA.slots.FRA.length]);

// tokens: list of { kind: 'de' | 'fr' | 'eu', i (slot index), a (appear frame), r (remove frame), to: [x, y] (fly target on removal) }
function drawTokens(list, f, size = 36) {
  for (const t of list) {
    const pos = t.kind === 'de' ? deSlot(t.i) : t.kind === 'fr' ? frSlot(t.i) : euSpace(t.i);
    const inT = t.a === undefined ? 1 : seg(f, t.a, t.a + 10);
    if (inT <= 0) continue;
    if (t.r !== undefined && f >= t.r) {
      if (t.noFly) continue;
      const k = seg(f, t.r, t.r + 22);
      if (k >= 1) continue;
      const to = t.to || [pos[0], pos[1] - 300];
      const [x, y] = arcPos(E.io(k), pos[0], pos[1], to[0], to[1], 160);
      token(x, y, size * lerp(1, 0.8, k), t.kind, t.i, { rot: k * 4 });
      continue;
    }
    const drop = (1 - E.outBounce(inT)) * 120;
    token(pos[0], pos[1] - drop, size * lerp(0.4, 1, E.outBack(inT)), t.kind, t.i, { alpha: clamp(inT * 3) });
  }
}

// the Impact Tracker marker: a little raccoon standing on the path
function trackerMarker(p, f, mood) {
  const [x, y] = trackPos(p);
  const happy = p < 0, bad = p > 3;
  raccoon({ x, y: y + 16, s: 0.4, eyes: mood || (happy ? 'happy' : bad ? 'wide' : 'open'), mouth: happy ? 'smile' : bad ? 'grin' : 'flat',
    arms: bad ? [2.2, 2.2] : [0.3, 0.3], tail: Math.sin(f * 0.2) * 0.3, squash: Math.abs(Math.sin(f * 0.25)) * 0.04, seed: 70 });
}
