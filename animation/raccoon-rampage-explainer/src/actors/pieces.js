// Game pieces: vote cubes, raccoon tokens, dice, icons and cards.

// ---- icons ----------------------------------------------------------------
function pawIcon(x, y, r, col = PAL.plum, lw = 2) {
  P.ellipse(x, y + r * 0.25, r * 0.48, r * 0.4, { fill: col, lw, seed: 301, texA: 0.2, edge: 0, ink: lw ? PAL.ink : false });
  const toes = [[-0.52, -0.22], [-0.2, -0.55], [0.2, -0.55], [0.52, -0.22]];
  toes.forEach(([tx, ty], i) => P.ellipse(x + tx * r, y + ty * r, r * 0.17, r * 0.21, { fill: col, lw: lw * 0.8, seed: 302 + i, texA: 0.2, edge: 0, ink: lw ? PAL.ink : false }));
}

function heartIcon(x, y, r, col = PAL.pink, lw = 2) {
  const pts = [];
  for (let i = 0; i < 24; i++) {
    const t = (i / 24) * TAU;
    pts.push([x + 16 * Math.pow(Math.sin(t), 3) * r / 17, y - (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * r / 17]);
  }
  P.shape(pts, { fill: col, lw, seed: 310, texA: 0.25, edge: 0.15 });
}

function crosshairIcon(x, y, r, col = PAL.plum, lw = 2) {
  C.save();
  C.strokeStyle = col;
  C.lineWidth = r * 0.16;
  C.beginPath(); C.arc(x, y, r * 0.62, 0, TAU); C.stroke();
  C.lineCap = 'round';
  C.beginPath();
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { C.moveTo(x + dx * r * 0.3, y + dy * r * 0.3); C.lineTo(x + dx * r, y + dy * r); }
  C.stroke();
  C.fillStyle = col;
  C.beginPath(); C.arc(x, y, r * 0.12, 0, TAU); C.fill();
  C.restore();
}

function skullIcon(x, y, r, col = PAL.cardCream, lw = 2) {
  P.shape([[x - r * 0.8, y - r * 0.1], [x - r * 0.7, y - r * 0.75], [x, y - r], [x + r * 0.7, y - r * 0.75], [x + r * 0.8, y - r * 0.1],
    [x + r * 0.5, y + r * 0.35], [x + r * 0.45, y + r * 0.75], [x - r * 0.45, y + r * 0.75], [x - r * 0.5, y + r * 0.35]],
  { fill: col, lw, seed: 320, smooth: 0.5, texA: 0.2, edge: 0.1 });
  for (const s of [-1, 1]) P.ellipse(x + s * r * 0.33, y - r * 0.15, r * 0.22, r * 0.25, { fill: PAL.plumDark, ink: false, seed: 321 + s, tex: false, edge: 0 });
  P.shape([[x - r * 0.1, y + r * 0.3], [x + r * 0.1, y + r * 0.3], [x, y + r * 0.12]], { fill: PAL.plumDark, ink: false, seed: 323, tex: false, edge: 0, smooth: 0 });
  for (let k = -1; k <= 1; k++) P.line([[x + k * r * 0.2, y + r * 0.5], [x + k * r * 0.2, y + r * 0.72]], { w: lw * 0.7, seed: 324 + k });
}

function shieldIcon(x, y, r, col = PAL.plum, lw = 2) {
  P.shape([[x - r * 0.85, y - r * 0.75], [x, y - r], [x + r * 0.85, y - r * 0.75], [x + r * 0.75, y + r * 0.2], [x, y + r], [x - r * 0.75, y + r * 0.2]],
    { fill: col, lw, seed: 330, smooth: 0.4, texA: 0.3 });
  raccoonHeadIcon(x, y - r * 0.05, r * 0.5, PAL.cardCream, 0);
}

// small raccoon face used in icons and tokens
function raccoonHeadIcon(x, y, r, col, lw = 2, maskCol = PAL.furDark) {
  const ink = lw ? PAL.ink : false;
  for (const s of [-1, 1]) P.shape([[x + s * r * 0.35, y - r * 0.55], [x + s * r * 0.85, y - r * 1.05], [x + s * r * 0.95, y - r * 0.35]], { fill: col, lw, ink, seed: 340 + s, smooth: 0.3, texA: 0.25, edge: 0.1 });
  P.shape([[x - r, y - r * 0.2], [x - r * 0.7, y - r * 0.75], [x, y - r * 0.9], [x + r * 0.7, y - r * 0.75], [x + r, y - r * 0.2], [x + r * 1.1, y + r * 0.25],
    [x + r * 0.55, y + r * 0.55], [x, y + r * 0.75], [x - r * 0.55, y + r * 0.55], [x - r * 1.1, y + r * 0.25]], { fill: col, lw, ink, seed: 343, smooth: 0.45, texA: 0.3, edge: 0.15 });
  P.shape([[x - r * 0.95, y - r * 0.05], [x - r * 0.5, y - r * 0.38], [x, y - r * 0.18], [x + r * 0.5, y - r * 0.38], [x + r * 0.95, y - r * 0.05], [x + r * 0.55, y + r * 0.22], [x, y + r * 0.08], [x - r * 0.55, y + r * 0.22]],
    { fill: maskCol, ink: false, seed: 344, smooth: 0.45, texA: 0.2, edge: 0 });
  for (const s of [-1, 1]) {
    C.fillStyle = PAL.white;
    C.beginPath(); C.arc(x + s * r * 0.45, y - r * 0.1, r * 0.13, 0, TAU); C.fill();
  }
  P.ellipse(x, y + r * 0.42, r * 0.15, r * 0.1, { fill: PAL.black, ink: false, tex: false, edge: 0, seed: 345 });
}

function flagIcon(kind, x, y, w, lw = 1.5) {
  const h = w * 0.66;
  C.save();
  C.translate(x - w / 2, y - h / 2);
  const cols = kind === 'de' ? ['#1f1a1e', '#cf3b32', '#e9b83a'] : ['#2f5da8', '#f7f2e6', '#d2403a'];
  for (let i = 0; i < 3; i++) {
    C.fillStyle = cols[i];
    if (kind === 'de') C.fillRect(0, (i * h) / 3, w, h / 3 + 0.5);
    else C.fillRect((i * w) / 3, 0, w / 3 + 0.5, h);
  }
  C.strokeStyle = PAL.ink;
  C.lineWidth = lw;
  C.strokeRect(0, 0, w, h);
  C.restore();
}

function starShape(x, y, r, col, lw = 2, seed = 350) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i / 10) * TAU;
    const rr = i % 2 ? r * 0.48 : r;
    pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
  }
  return P.shape(pts, { fill: col, lw, seed, smooth: 0.2, texA: 0.3, edge: 0.15 });
}

// role scoring icon inside a star: 'paw' | 'hunt'
function scoreStar(kind, x, y, r) {
  starShape(x, y, r, '#d9a441', 2.2, 360 + (kind === 'paw' ? 1 : 2));
  if (kind === 'paw') pawIcon(x, y + r * 0.05, r * 0.45, PAL.plumDark, 0);
  else crosshairIcon(x, y + r * 0.05, r * 0.4, PAL.plumDark);
}

function mitigateIcon(x, y, r, col = PAL.plum) {
  raccoonHeadIcon(x - r * 0.25, y + r * 0.2, r * 0.55, col, 0, PAL.cardCream);
  P.line([[x + r * 0.55, y + r * 0.5], [x + r * 0.55, y - r * 0.6]], { w: r * 0.16, col, seed: 370 });
  P.line([[x + r * 0.3, y - r * 0.3], [x + r * 0.55, y - r * 0.65], [x + r * 0.8, y - r * 0.3]], { w: r * 0.16, col, seed: 371 });
}

// ---- vote cube ------------------------------------------------------------
function cube(x, y, s, col, seed = 0, rot = 0) {
  C.save();
  C.translate(x, y);
  if (rot) C.rotate(rot);
  const h = s * 0.5, d = s * 0.28;
  const lw = Math.max(1.4, s * 0.06);
  const top = [[-h, -h + d * 0.2], [0, -h - d * 0.6], [h, -h + d * 0.2], [0, -h + d]];
  const left = [[-h, -h + d * 0.2], [0, -h + d], [0, h], [-h, h - d * 0.6]];
  const right = [[0, -h + d], [h, -h + d * 0.2], [h, h - d * 0.6], [0, h]];
  const o = { smooth: 0.12, lw: 0, ink: false, texA: 0.35, edge: 0.12, wob: 0.4 };
  P.shape(left, { ...o, fill: col, seed: seed + 1 });
  P.shape(right, { ...o, fill: shade(col, -0.22), seed: seed + 2 });
  P.shape(top, { ...o, fill: shade(col, 0.22), seed: seed + 3 });
  const outline = [[-h, -h + d * 0.2], [0, -h - d * 0.6], [h, -h + d * 0.2], [h, h - d * 0.6], [0, h], [-h, h - d * 0.6]];
  P.shape(outline, { fill: false, ink: PAL.ink, lw, smooth: 0.12, seed: seed + 4, wob: 0.4 });
  P.line([[0, -h + d], [0, h]], { w: lw * 0.6, seed: seed + 5, taper: false, wob: 0.3 });
  C.restore();
}

// ---- raccoon token ---------------------------------------------------------
const TOKEN_COL = { de: PAL.yellow, fr: PAL.blue, eu: '#3a3340' };
function token(x, y, s, kind = 'eu', seed = 0, o = {}) {
  if (o.alpha !== undefined && o.alpha <= 0) return;
  C.save();
  C.translate(x, y);
  if (o.alpha !== undefined) C.globalAlpha *= o.alpha;
  if (o.rot) C.rotate(o.rot);
  C.scale(s / 40, s / 40);
  if (o.shadow !== false) P.shadow(0, 20, 26, 7, 0.25);
  const col = TOKEN_COL[kind];
  raccoonHeadIcon(0, 0, 20, col, 2.2, kind === 'eu' ? PAL.black : PAL.furDark);
  C.restore();
}

// ---- dice -------------------------------------------------------------------
// hunting die: faces are skulls (reduce population) and shields (protection)
function huntDie(x, y, s, face = 0, rot = 0, seed = 0) {
  C.save();
  C.translate(x, y);
  C.rotate(rot);
  const h = s / 2;
  P.rrect(-h, -h, s, s, s * 0.2, { fill: PAL.plumDark, lw: Math.max(1.5, s * 0.05), seed: seed + 1, texA: 0.3, edge: 0.2 });
  P.shape([[-h + 3, h - s * 0.18], [h - 3, h - s * 0.18], [h - 5, h - 3], [-h + 5, h - 3]], { fill: '#1d171f', ink: false, seed: seed + 2, smooth: 0.3, texA: 0.2, edge: 0 });
  if (face === 0) skullIcon(0, -s * 0.03, s * 0.3, PAL.cardCream, Math.max(1, s * 0.03));
  else if (face === 1) shieldIcon(0, -s * 0.03, s * 0.3, PAL.cardCream, Math.max(1, s * 0.03));
  C.restore();
}

function d6(x, y, s, face = 1, rot = 0, seed = 0) {
  C.save();
  C.translate(x, y);
  C.rotate(rot);
  const h = s / 2;
  P.rrect(-h, -h, s, s, s * 0.2, { fill: PAL.white, lw: Math.max(1.5, s * 0.05), seed: seed + 1, texA: 0.25, edge: 0.15 });
  const pips = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
    5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] }[face];
  C.fillStyle = PAL.plumDark;
  for (const [px, py] of pips) { C.beginPath(); C.arc(px * s * 0.26, py * s * 0.26, s * 0.08, 0, TAU); C.fill(); }
  C.restore();
}

// ---- cards -----------------------------------------------------------------
// o: x, y, w, h, rot, type ('policy' | 'back' | 'action' | 'event' | 'spreadBack' | 'spread'),
//    flip (0 = face shown, 1 = back shown; animated flips pass values between),
//    title, cost, owner ('de' | 'fr' | 'ar' | 'hu'), effect ({ icon, n }), score ('paw' | 'hunt'),
//    art (key in CARD_ART), votes ([colours]), glow (colour), stamp ('pass' | 'fail'), n (spread value)
function card(o) {
  const w = o.w ?? 190, h = o.h ?? 266;
  const flip = o.flip ?? 0;
  const sx = Math.cos(flip * Math.PI);
  const showBack = sx < 0;
  C.save();
  C.translate(o.x ?? 0, o.y ?? 0);
  if (o.rot) C.rotate(o.rot);
  if (o.s) C.scale(o.s, o.s);
  if (o.alpha !== undefined) C.globalAlpha *= o.alpha;
  if (o.shadow !== false) P.shadow(6, h * 0.46, w * 0.62, h * 0.1, 0.25);
  if (o.lift) C.translate(0, -o.lift);
  C.scale(Math.max(0.02, Math.abs(sx)), 1);
  if (o.glow) {
    P.glow(0, 0, Math.max(w, h) * 0.85, o.glow, 0.55);
  }
  const sd = (o.seed ?? 1) * 17;
  const lw = o.lw ?? 3;
  const type = showBack ? (o.backType || (o.type === 'spread' ? 'spreadBack' : 'back')) : o.type;
  if (type === 'back') cardBack(w, h, sd, lw);
  else if (type === 'spreadBack') spreadBack(w, h, sd, lw);
  else if (type === 'policy') policyFace(o, w, h, sd, lw);
  else if (type === 'action') actionFace(o, w, h, sd, lw);
  else if (type === 'event') eventFace(o, w, h, sd, lw);
  else if (type === 'spread') spreadFace(o, w, h, sd, lw);
  if (!showBack && o.stamp) stamp(o.stamp, 0, h * 0.02, w, o.stampT ?? 1);
  C.restore();
  // vote cubes sit on the card, unaffected by the flip squash
  if (o.votes && o.votes.length && !showBack) {
    C.save();
    C.translate(o.x ?? 0, o.y ?? 0);
    if (o.rot) C.rotate(o.rot);
    if (o.s) C.scale(o.s, o.s);
    voteStack(o.votes, 0, h * 0.34, w, o.voteT);
    C.restore();
  }
}

function voteStack(votes, x, y, w, t = null) {
  const cs = w * 0.18;
  const perRow = 5;
  votes.forEach((col, i) => {
    const r = Math.floor(i / perRow), c = i % perRow;
    const n = Math.min(perRow, votes.length - r * perRow);
    const cx = x + (c - (n - 1) / 2) * cs * 1.08;
    const cy = y - r * cs * 0.78;
    const k = t ? clamp(t[i] ?? 1) : 1;
    if (k <= 0) return;
    cube(cx, cy - (1 - E.outBounce(k)) * 120, cs * lerp(0.6, 1, k), col, 900 + i);
  });
}

function stamp(kind, x, y, w, t) {
  if (t <= 0) return;
  const s = lerp(2.2, 1, E.outBack(clamp(t)));
  C.save();
  C.translate(x, y);
  C.rotate(kind === 'pass' ? -0.2 : 0.18);
  C.scale(s, s);
  C.globalAlpha *= clamp(t * 3);
  const col = kind === 'pass' ? '#3f8a3a' : '#c23b33';
  const label = kind === 'pass' ? 'PASSED' : 'FAILED';
  const tw = T.width(label, w * 0.2, true, 2) + w * 0.14;
  C.lineWidth = w * 0.028;
  C.strokeStyle = col;
  P.rrect(-tw / 2, -w * 0.13, tw, w * 0.26, w * 0.05, { fill: rgba(PAL.white, 0.0), ink: col, lw: w * 0.022, seed: 400, tex: false, edge: 0 });
  T.draw(label, 0, 2, { size: w * 0.2, col, spacing: 2 });
  C.restore();
}

function cardFrame(w, h, fill, border, sd, lw, borderW = 0.07) {
  P.rrect(-w / 2, -h / 2, w, h, w * 0.1, { fill: border, lw, seed: sd + 1, texA: 0.35, edge: 0.15 });
  const b = w * borderW;
  P.rrect(-w / 2 + b, -h / 2 + b, w - 2 * b, h - 2 * b, w * 0.06, { fill, ink: false, seed: sd + 2, texA: 0.35, edge: 0.18, edgeCol: shade(fill, -0.25) });
}

function cardBack(w, h, sd, lw) {
  cardFrame(w, h, '#5e4a63', PAL.plumDark, sd, lw, 0.06);
  // ringed tail motif and a peeking raccoon, as on the game's card backs
  C.save();
  const k = w / 190;
  C.translate(0, h * 0.04);
  for (let i = 0; i < 4; i++) {
    const y = -h * 0.1 + i * 16 * k;
    P.shape([[-w * 0.36, y], [w * 0.36, y - 6 * k], [w * 0.36, y + 8 * k], [-w * 0.36, y + 12 * k]], { fill: i % 2 ? PAL.furDark : PAL.tailLight, ink: false, seed: sd + 10 + i, smooth: 0.3, texA: 0.3, edge: 0 });
  }
  raccoonHeadIcon(0, -h * 0.26, w * 0.18, PAL.furMid, 1.8, PAL.furDark);
  T.draw('RACCOON', 0, h * 0.26, { size: w * 0.15, col: PAL.lavender, spacing: 1 });
  T.draw('RAMPAGE', 0, h * 0.36, { size: w * 0.15, col: PAL.lavender, spacing: 1 });
  C.restore();
}

function spreadBack(w, h, sd, lw) {
  cardFrame(w, h, '#b8a3c2', PAL.plumDark, sd, lw, 0.06);
  C.save();
  C.beginPath();
  C.rect(-w / 2 + 12, -h / 2 + 12, w - 24, h - 24);
  C.clip();
  raccoon({ x: 0, y: h * 0.62, s: w / 190 * 0.95, suit: true, shades: true, mouth: 'smirk', prop: 'sign', arms: [1.3, 1.3], shadow: false, seed: 77 });
  C.restore();
}

function policyFace(o, w, h, sd, lw) {
  cardFrame(w, h, PAL.cardCream, o.border || PAL.plumDark, sd, lw, 0.07);
  const k = w / 190;
  // cost box
  P.rrect(w / 2 - 50 * k, -h / 2 + 8 * k, 40 * k, 44 * k, 6 * k, { fill: PAL.plumDark, lw: lw * 0.8, seed: sd + 3, texA: 0.3 });
  T.draw(String(o.cost ?? 3), w / 2 - 30 * k, -h / 2 + 32 * k, { size: 38 * k, col: PAL.cardCream });
  // owner icon under the cost
  const oy = -h / 2 + 70 * k, ox = w / 2 - 30 * k;
  if (o.owner === 'de' || o.owner === 'fr') flagIcon(o.owner, ox, oy, 26 * k, 1.2);
  else if (o.owner === 'ar') pawIcon(ox, oy, 12 * k, PAL.plumDark, 0);
  else if (o.owner === 'hu') crosshairIcon(ox, oy, 11 * k, PAL.plumDark);
  // title (wraps onto two lines)
  const words = (o.title || 'POLICY').split(' ');
  const lines = [];
  let cur = '';
  for (const wd of words) {
    const test = cur ? cur + ' ' + wd : wd;
    if (T.width(test, 22 * k) > w * 0.62 && cur) { lines.push(cur); cur = wd; } else cur = test;
  }
  lines.push(cur);
  lines.forEach((ln, i) => T.draw(ln, -w / 2 + 18 * k, -h / 2 + 30 * k + i * 22 * k, { size: 22 * k, col: PAL.plumDark, align: 'left' }));
  // art window
  const ax = -w / 2 + 16 * k, ay = -h / 2 + 88 * k, aw = w - 32 * k, ah = h * 0.42;
  C.save();
  const artPath = P.rrect(ax, ay, aw, ah, 10 * k, { fill: o.artBg || '#cfd9e4', ink: false, seed: sd + 4, texA: 0.4 });
  C.clip(artPath);
  C.translate(ax + aw / 2, ay + ah / 2);
  C.scale(aw / 160, ah / 110);
  (CARD_ART[o.art] || CARD_ART.none)(sd);
  C.restore();
  P.rrect(ax, ay, aw, ah, 10 * k, { fill: false, lw: lw * 0.8, seed: sd + 5 });
  // effect row
  const ey = ay + ah + 30 * k;
  if (o.effect) {
    const ic = o.effect.icon;
    const ix = -18 * k;
    if (ic === 'mitigate') mitigateIcon(ix, ey, 20 * k, PAL.plumDark);
    else if (ic === 'die') huntDie(ix, ey, 30 * k, 0, 0, sd + 6);
    else if (ic === 'shield') shieldIcon(ix, ey, 17 * k, PAL.plumDark, 1.5);
    T.draw('x' + o.effect.n, ix + 34 * k, ey + 2 * k, { size: 30 * k, col: PAL.plumDark });
  }
  if (o.score) scoreStar(o.score, w / 2 - 26 * k, h / 2 - 26 * k, 22 * k);
}

function actionFace(o, w, h, sd, lw) {
  cardFrame(w, h, PAL.cardCream, PAL.cardEdge, sd, lw, 0.05);
  const k = w / 190;
  P.ellipse(w / 2 - 28 * k, -h / 2 + 30 * k, 18 * k, 18 * k, { fill: PAL.plumDark, lw: lw * 0.8, seed: sd + 3 });
  // raised fist (action icon)
  P.rrect(w / 2 - 38 * k, -h / 2 + 22 * k, 20 * k, 16 * k, 5 * k, { fill: PAL.cardCream, ink: false, seed: sd + 4, tex: false, edge: 0 });
  P.rrect(w / 2 - 33 * k, -h / 2 + 36 * k, 10 * k, 10 * k, 2 * k, { fill: PAL.cardCream, ink: false, seed: sd + 5, tex: false, edge: 0 });
  T.draw(o.title || 'ACTION', -w / 2 + 18 * k, -h / 2 + 32 * k, { size: 21 * k, col: PAL.plumDark, align: 'left' });
  C.save();
  const r = w * 0.34;
  const circ = P.ellipse(0, -h * 0.02, r, r, { fill: o.artBg || '#e8d6e4', ink: false, seed: sd + 6, texA: 0.4, n: 26 });
  C.clip(circ);
  C.translate(0, -h * 0.02);
  C.scale(r * 2 / 160, r * 2 / 160);
  (CARD_ART[o.art] || CARD_ART.none)(sd);
  C.restore();
  P.ellipse(0, -h * 0.02, r, r, { fill: false, lw: lw * 0.8, seed: sd + 7, n: 26 });
  if (o.phase) T.draw(o.phase, 0, h / 2 - 50 * k, { size: 16 * k, col: PAL.plumMid, head: false });
  for (let i = 0; i < 2; i++) P.line([[-w * 0.32, h / 2 - 30 * k + i * 11 * k], [w * (0.3 - i * 0.12), h / 2 - 30 * k + i * 11 * k]], { w: 2 * k, col: PAL.mauve, seed: sd + 8 + i });
}

function eventFace(o, w, h, sd, lw) {
  cardFrame(w, h, PAL.eventPink, PAL.plumDark, sd, lw, 0.05);
  const k = w / 190;
  C.save();
  const ax = -w / 2 + 12 * k, ay = -h / 2 + 12 * k, aw = w - 24 * k, ah = h * 0.45;
  const artPath = P.rrect(ax, ay, aw, ah, 8 * k, { fill: o.artBg || '#e9c7a6', ink: false, seed: sd + 3, texA: 0.4 });
  C.clip(artPath);
  C.translate(ax + aw / 2, ay + ah / 2);
  C.scale(aw / 160, ah / 110);
  (CARD_ART[o.art] || CARD_ART.none)(sd, o.artT);
  C.restore();
  P.line([[ax, ay + ah], [ax + aw, ay + ah]], { w: lw, seed: sd + 4 });
  const words = (o.title || 'EVENT').split(' ');
  words.forEach((wd, i) => T.draw(wd, -w / 2 + 18 * k, ay + ah + 28 * k + i * 26 * k, { size: 26 * k, col: PAL.plumDark, align: 'left' }));
  const ty = ay + ah + 30 * k + words.length * 26 * k;
  for (let i = 0; i < 3; i++) P.line([[-w * 0.4, ty + i * 12 * k], [w * (0.38 - (i % 2) * 0.15), ty + i * 12 * k]], { w: 2 * k, col: PAL.mauve, seed: sd + 5 + i });
  if (o.tagline) {
    P.rrect(-w * 0.42, h / 2 - 44 * k, w * 0.5, 18 * k, 4 * k, { fill: PAL.lavender, ink: false, seed: sd + 9, tex: false, edge: 0 });
    T.draw(o.tagline, -w * 0.17, h / 2 - 35 * k, { size: 13 * k, col: PAL.plumDark, head: false });
  }
}

const SPREAD_STYLE = {
  0: { bg: '#8fc3a8', title: '+0', sub: 'A QUIET YEAR' },
  1: { bg: '#e59a54', title: '+1', sub: 'RACCOON' },
  2: { bg: '#cf5a4a', title: '+2', sub: 'RACCOONS' },
};
function spreadFace(o, w, h, sd, lw) {
  const st = SPREAD_STYLE[o.n ?? 0];
  cardFrame(w, h, st.bg, PAL.plumDark, sd, lw, 0.05);
  const k = w / 190;
  T.draw(st.title, 0, -h * 0.3, { size: 64 * k, col: PAL.white, shadow: PAL.plumDark });
  T.draw(st.sub, 0, -h * 0.13, { size: 24 * k, col: PAL.white, spacing: 1 });
  C.save();
  C.beginPath();
  C.rect(-w / 2 + 10, -h * 0.04, w - 20, h * 0.5);
  C.clip();
  if ((o.n ?? 0) === 0) {
    // a sleepy raccoon in a tree stump
    P.shape([[-60 * k, h * 0.5], [-52 * k, h * 0.14], [52 * k, h * 0.14], [60 * k, h * 0.5]], { fill: '#8a6450', lw, seed: sd + 3, smooth: 0.2, texA: 0.4 });
    P.ellipse(0, h * 0.14, 52 * k, 12 * k, { fill: '#c9a078', lw, seed: sd + 4 });
    raccoon({ x: 0, y: h * 0.36, s: 0.5 * k, eyes: 'closed', mouth: 'flat', arms: [0.1, 0.1], shadow: false, seed: 31, tilt: 0.2 });
  } else {
    for (let i = 0; i < o.n; i++) {
      raccoon({ x: (i - (o.n - 1) / 2) * 60 * k, y: h * 0.47, s: 0.46 * k, eyes: 'wide', mouth: 'grin', arms: [2.4, 2.4], shadow: false, seed: 40 + i, turn: (i - 0.5) * 0.6 });
    }
  }
  C.restore();
}

// ---- tiny card illustrations (drawn in a 160 x 110 box centred on 0,0) -----
const CARD_ART = {
  none() {},
  nest(sd) {
    P.rrect(-80, 10, 160, 60, 0, { fill: '#8cc07a', ink: false, seed: sd + 20, texA: 0.4, edge: 0 });
    for (let i = -3; i <= 3; i++) P.line([[i * 24, -55], [i * 24, 20]], { w: 2.5, col: PAL.plumMid, seed: sd + 21 + i });
    for (let j = 0; j < 3; j++) P.line([[-80, -40 + j * 22], [80, -40 + j * 22]], { w: 2, col: PAL.plumMid, seed: sd + 30 + j });
    P.ellipse(0, 22, 46, 18, { fill: '#9b7650', lw: 2.4, seed: sd + 35 });
    for (let i = 0; i < 3; i++) P.ellipse(-16 + i * 16, 12, 9, 11, { fill: '#e8eef0', lw: 2, seed: sd + 36 + i, texA: 0.2 });
  },
  burger(sd) {
    P.rrect(-80, -55, 160, 110, 0, { fill: '#f0c98a', ink: false, seed: sd + 20, texA: 0.4, edge: 0 });
    burger(0, 8, 1.7, sd + 21);
  },
  helpline(sd) {
    P.rrect(-80, -55, 160, 110, 0, { fill: '#a9d4c4', ink: false, seed: sd + 20, texA: 0.4, edge: 0 });
    raccoon({ x: 10, y: 80, s: 0.52, eyes: 'happy', mouth: 'smile', shadow: false, arms: [0.3, 2.3], seed: 51 });
    P.rrect(-66, -30, 36, 58, 8, { fill: '#e2574c', lw: 2.4, seed: sd + 22 });
    P.rrect(-60, -22, 24, 18, 3, { fill: '#cfe3e8', lw: 1.6, seed: sd + 23 });
  },
  handshake(sd) {
    P.rrect(-80, -55, 160, 110, 0, { fill: '#3e5fa3', ink: false, seed: sd + 20, texA: 0.4, edge: 0 });
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU;
      starShape(Math.cos(a) * 44, Math.sin(a) * 36 - 4, 6, '#f2cf4a', 0, sd + 21 + i);
    }
    capsule(-80, 20, -8, 6, 14, 12, { fill: '#e7c19a', lw: 2.2, seed: sd + 40 });
    capsule(80, 20, 8, 6, 14, 12, { fill: '#b07a58', lw: 2.2, seed: sd + 41 });
  },
  drone(sd) {
    P.rrect(-80, -55, 160, 110, 0, { fill: '#9fc6dc', ink: false, seed: sd + 20, texA: 0.4, edge: 0 });
    P.rrect(-26, -34, 52, 20, 8, { fill: '#6d7a8c', lw: 2.2, seed: sd + 21 });
    for (const s of [-1, 1]) {
      P.line([[s * 20, -30], [s * 50, -42]], { w: 2.4, seed: sd + 22 + s });
      P.ellipse(s * 52, -44, 22, 5, { fill: '#c9d2dc', lw: 1.8, seed: sd + 24 + s });
    }
    raccoon({ x: 0, y: 92, s: 0.46, eyes: 'wide', mouth: 'o', shadow: false, arms: [2.6, 2.6], seed: 52 });
  },
  pets(sd) {
    P.rrect(-80, -55, 160, 110, 0, { fill: '#f0d49a', ink: false, seed: sd + 20, texA: 0.4, edge: 0 });
    raccoon({ x: 0, y: 92, s: 0.55, eyes: 'happy', mouth: 'open', shadow: false, arms: [0.5, 0.5], seed: 53 });
    P.ellipse(0, 12, 22, 12, { fill: '#9ed2a6', lw: 2, seed: sd + 21 });
  },
  hat(sd) {
    P.rrect(-80, -55, 160, 110, 0, { fill: '#cfd3d8', ink: false, seed: sd + 20, texA: 0.4, edge: 0 });
    // a coonskin cap with its ringed tail hanging down
    P.shape([[-46, 14], [-44, -18], [-26, -38], [0, -44], [26, -38], [44, -18], [46, 14]], { fill: PAL.furMid, lw: 2.4, seed: sd + 21, smooth: 0.5, texA: 0.45 });
    P.rrect(-50, 6, 100, 16, 6, { fill: PAL.furDark, lw: 2.4, seed: sd + 22 });
    const tl = [[38, 14], [54, 22], [64, 44], [62, 62], [48, 60], [46, 40], [34, 26]];
    P.shape(tl, { fill: PAL.tailLight, lw: 2.4, seed: sd + 23, smooth: 0.5 });
    for (let i = 0; i < 3; i++) P.line([[40 + i * 7, 26 + i * 12], [56 + i * 3, 24 + i * 13]], { w: 7, col: PAL.furDark, seed: sd + 24 + i, taper: false });
  },
  bins(sd) {
    P.rrect(-80, -55, 160, 110, 0, { fill: '#c9b8d4', ink: false, seed: sd + 20, texA: 0.4, edge: 0 });
    P.shape([[-40, -24], [40, -24], [34, 60], [-34, 60]], { fill: '#8e9a7c', lw: 2.4, seed: sd + 21, smooth: 0.1 });
    P.rrect(-46, -36, 92, 14, 5, { fill: '#a3ad92', lw: 2.4, seed: sd + 22 });
    P.rrect(-10, -46, 20, 12, 4, { fill: '#c9403a', lw: 2, seed: sd + 23 });
  },
  city(sd, t = 0) {
    P.rrect(-80, -55, 160, 110, 0, { fill: '#f1c7a1', ink: false, seed: sd + 20, texA: 0.4, edge: 0 });
    const hts = [60, 86, 50, 100, 70, 44];
    hts.forEach((ht, i) => {
      const grow = clamp(t * 1.4 - i * 0.08, 0.35, 1);
      P.rrect(-78 + i * 27, 55 - ht * grow, 24, ht * grow + 4, 2, { fill: mix('#8a86a8', '#6d6a8e', i % 2), lw: 1.8, seed: sd + 21 + i, texA: 0.35 });
    });
    // fat-cat raccoon in a suit
    raccoon({ x: 26, y: 96, s: 0.5, suit: true, shades: false, eyes: 'sly', mouth: 'smirk', arms: [0.3, 2.2], shadow: false, seed: 54 });
    T.draw('SALE', -46, -30, { size: 22, col: '#c9403a' });
  },
  treaty(sd) {
    P.rrect(-80, -55, 160, 110, 0, { fill: '#c9d9ea', ink: false, seed: sd + 20, texA: 0.4, edge: 0 });
    C.save();
    C.rotate(-0.12);
    P.rrect(-44, -46, 76, 92, 4, { fill: PAL.white, lw: 2.2, seed: sd + 21, texA: 0.2 });
    T.draw('TREATY', -6, -30, { size: 18, col: PAL.plumDark });
    for (let i = 0; i < 4; i++) P.line([[-34, -10 + i * 12], [20 - (i % 2) * 12, -10 + i * 12]], { w: 1.8, col: PAL.mauve, seed: sd + 22 + i });
    P.line([[-40, -40], [26, 40]], { w: 5, col: '#c9403a', seed: sd + 27 });
    P.line([[26, -40], [-40, 40]], { w: 5, col: '#c9403a', seed: sd + 28 });
    C.restore();
    raccoon({ x: 50, y: 96, s: 0.46, suit: true, eyes: 'sly', mouth: 'smirk', arms: [1.9, 1.9], shadow: false, seed: 57 });
  },
  farm(sd) {
    P.rrect(-80, -55, 160, 110, 0, { fill: '#e8d59a', ink: false, seed: sd + 20, texA: 0.4, edge: 0 });
    P.rrect(-80, 30, 160, 30, 0, { fill: '#a9b870', ink: false, seed: sd + 21, texA: 0.4, edge: 0 });
    for (let i = 0; i < 3; i++) {
      P.rrect(-70 + i * 26, -34, 22, 70, 8, { fill: '#b9bcc4', lw: 1.8, seed: sd + 22 + i, texA: 0.35 });
      P.ellipse(-59 + i * 26, -34, 11, 6, { fill: '#cfd2d8', lw: 1.6, seed: sd + 25 + i });
    }
    P.shape([[14, 36], [14, -6], [42, -30], [70, -6], [70, 36]], { fill: '#c9573f', lw: 2, seed: sd + 28, smooth: 0.05, texA: 0.35 });
    P.rrect(34, 8, 16, 28, 2, { fill: PAL.white, lw: 1.6, seed: sd + 29 });
    raccoon({ x: 42, y: -8, s: 0.28, eyes: 'happy', mouth: 'grin', arms: [2.4, 2.4], shadow: false, seed: 58 });
  },
  trade(sd) {
    P.rrect(-80, -55, 160, 110, 0, { fill: '#bcd6e8', ink: false, seed: sd + 20, texA: 0.4, edge: 0 });
    P.rrect(-80, 26, 160, 34, 0, { fill: '#5d7fb0', ink: false, seed: sd + 21, texA: 0.4, edge: 0 });
    P.shape([[-70, 10], [60, 10], [48, 34], [-60, 34]], { fill: '#6d5a70', lw: 2, seed: sd + 22, smooth: 0.05, texA: 0.35 });
    const cols = ['#d9784f', '#6f9f5c', '#e4b43c', '#4f87c2'];
    for (let i = 0; i < 4; i++) P.rrect(-60 + i * 28, -12, 26, 22, 2, { fill: cols[i], lw: 1.6, seed: sd + 23 + i, texA: 0.35 });
    for (let i = 0; i < 2; i++) P.rrect(-46 + i * 28, -34, 26, 22, 2, { fill: cols[(i + 2) % 4], lw: 1.6, seed: sd + 27 + i, texA: 0.35 });
    raccoonHeadIcon(22, -26, 12, PAL.furMid, 1.4, PAL.furDark);
  },
  fire(sd) {
    P.rrect(-80, -55, 160, 110, 0, { fill: '#f0a36e', ink: false, seed: sd + 20, texA: 0.4, edge: 0 });
    P.glow(0, 40, 110, '#f7d36a', 0.6);
    for (let i = 0; i < 5; i++) {
      const x = -64 + i * 32;
      P.shape([[x - 4, 56], [x - 4, 0], [x + 4, 0], [x + 4, 56]], { fill: '#4a3438', ink: false, seed: sd + 21 + i, smooth: 0, texA: 0.2, edge: 0 });
      P.shape([[x - 14, 8], [x - 6, -18], [x, -34], [x + 6, -18], [x + 14, 8]], { fill: i % 2 ? '#e2574c' : '#f08a3c', lw: 1.6, seed: sd + 26 + i, smooth: 0.5, texA: 0.3 });
    }
    raccoon({ x: -10, y: 100, s: 0.42, eyes: 'wide', mouth: 'o', arms: [2.6, 2.6], shadow: false, seed: 59, face: -1 });
  },
  puppet(sd) {
    P.rrect(-80, -80, 160, 160, 0, { fill: '#e2d6ea', ink: false, seed: sd + 20, texA: 0.4, edge: 0 });
    for (let i = 0; i < 4; i++) P.line([[-30 + i * 20, -80], [-26 + i * 18, -10 + (i % 2) * 20]], { w: 1.4, col: PAL.plumMid, seed: sd + 21 + i, taper: false });
    raccoon({ x: 0, y: 72, s: 0.55, eyes: 'happy', mouth: 'open', arms: [2.2, 1.4], legs: [0.3, -0.3], shadow: false, seed: 55 });
  },
  rewrite(sd) {
    P.rrect(-80, -80, 160, 160, 0, { fill: '#dfe3ea', ink: false, seed: sd + 20, texA: 0.4, edge: 0 });
    P.shape([[-40, -56], [40, -56], [40, 56], [-40, 56]], { fill: PAL.white, lw: 2.4, seed: sd + 21, smooth: 0.05, texA: 0.2 });
    T.draw('POLICY', 0, -36, { size: 20, col: '#c9403a' });
    for (let i = 0; i < 4; i++) P.line([[-28, -10 + i * 16], [26 - (i % 2) * 14, -10 + i * 16]], { w: 2.2, col: PAL.mauve, seed: sd + 22 + i });
    P.line([[-30, 6], [30, 30], [-24, 40], [34, 50]], { w: 4, col: '#c9403a', seed: sd + 30 });
  },
  celebrity(sd) {
    P.rrect(-80, -80, 160, 160, 0, { fill: '#f3b9c7', ink: false, seed: sd + 20, texA: 0.4, edge: 0 });
    raccoon({ x: 0, y: 76, s: 0.58, shades: true, mouth: 'grin', arms: [0.4, 2.6], shadow: false, seed: 56 });
    heartIcon(-48, -44, 14, '#e2574c', 1.6);
    heartIcon(50, -30, 11, '#e2574c', 1.6);
  },
};
