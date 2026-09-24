// Shared scene furniture: backgrounds, player boards, pop-ups and particles.

function tableBG(f = 0, tint = '#5d4b62') {
  C.fillStyle = tint;
  C.fillRect(0, 0, W, H);
  P.texRect(0, 0, W, H, 'mottle', 0.55, 1.3, 0, 0);
  const g = C.createRadialGradient(W / 2, H * 0.45, 100, W / 2, H / 2, W * 0.7);
  g.addColorStop(0, 'rgba(255,235,220,0.10)');
  g.addColorStop(1, 'rgba(20,10,25,0.35)');
  C.fillStyle = g;
  C.fillRect(0, 0, W, H);
}

function lavenderBG(f = 0) {
  if (P.img.lavender) C.drawImage(P.img.lavender, 0, 0, W, H);
  else { C.fillStyle = PAL.lavender; C.fillRect(0, 0, W, H); }
  P.texRect(0, 0, W, H, 'mottle', 0.35, 1.6, 200, 100);
}

// a player's board: name, influence track and score stars
// o: score (filled stars), scoreT (0..1 pop of the newest star), influence, glow
function playerBoard(role, x, y, s, o = {}) {
  const R = ROLES[role];
  C.save();
  C.translate(x, y);
  C.scale(s, s);
  P.shadow(0, 118, 250, 22, 0.25);
  P.rrect(-260, -110, 520, 220, 26, { fill: R.col, tex: 'mottle', texA: 0.5, lw: 3.2, seed: 500 + ROLE_ORDER.indexOf(role) });
  if (o.glow) P.glow(0, 0, 330, PAL.white, 0.25 * o.glow);
  T.draw(R.name.toUpperCase(), -236, -80, { size: 30, col: PAL.plumDark, align: 'left', spacing: 1 });
  // influence dots 1..5
  T.draw('INFLUENCE', -236, -34, { size: 22, col: PAL.plumDark, align: 'left', spacing: 1 });
  const inf = o.influence ?? R.influence;
  for (let k = 1; k <= 5; k++) {
    const cx = -100 + k * 34;
    P.ellipse(cx, -34, 14, 14, { fill: PAL.cardCream, lw: 2, seed: 510 + k, texA: 0.2 });
    T.draw(String(k), cx, -32, { size: 18, col: PAL.plumDark });
    if (k === Math.round(inf)) {
      C.save();
      C.strokeStyle = PAL.plumDark;
      C.lineWidth = 5;
      C.beginPath(); C.arc(cx, -34, 18, 0, TAU); C.stroke();
      C.restore();
    }
  }
  // score track: 12 stars in two rows
  const n = o.score ?? 0;
  for (let k = 0; k < 12; k++) {
    const cx = -205 + (k % 6) * 68 + Math.floor(k / 6) * 34, cy = 22 + Math.floor(k / 6) * 52;
    starShape(cx, cy, 22, k < n ? '#f3d27a' : shade(R.col, 0.35), 2, 520 + k);
    if (k < n) {
      const pop = k === n - 1 && o.scoreT !== undefined ? E.outBack(clamp(o.scoreT)) : 1;
      if (o.pieces && o.pieces[k] === 'token') token(cx, cy + 2 - (1 - pop) * 40, 30 * pop, o.tokenKind || 'de', k, { shadow: false });
      else cube(cx, cy + 2 - (1 - pop) * 40, 22 * pop, R.col, 530 + k);
    }
  }
  C.restore();
}

// portrait in a round frame, used as a HUD for who is acting
function portrait(role, x, y, r, o = {}) {
  const R = ROLES[role];
  C.save();
  C.translate(x, y);
  if (o.active) P.glow(0, 0, r * 1.6, R.col, 0.55 + 0.2 * Math.sin((o.f || 0) * 0.2));
  const circ = P.ellipse(0, 0, r, r, { fill: shade(R.col, 0.45), lw: 3.2, seed: 540 + ROLE_ORDER.indexOf(role), n: 26 });
  C.save();
  C.clip(circ);
  person({ role, x: 0, y: r * 1.85, s: r / 118, expr: o.expr || 'happy', talk: o.talk || 0, blink: o.blink || 0, look: o.look || [0, 0], seed: 3 });
  C.restore();
  P.ellipse(0, 0, r, r, { fill: false, lw: 3.2, seed: 541, n: 26 });
  if (o.label) {
    P.rrect(-r * 0.95, r * 0.72, r * 1.9, r * 0.44, 10, { fill: R.col, lw: 2.4, seed: 542 });
    T.draw(o.label, 0, r * 0.95, { size: r * 0.26, col: PAL.plumDark, spacing: 1 });
  }
  C.restore();
}

// floating text such as '+1' or '-2'
function popText(x, y, str, f, a, o = {}) {
  const t = seg(f, a, a + (o.dur ?? 34));
  if (t <= 0 || t >= 1) return;
  const size = o.size ?? 54;
  C.save();
  C.globalAlpha *= 1 - E.inQ(seg(t, 0.6, 1));
  C.translate(x, y - E.outC(t) * (o.rise ?? 70));
  const s = E.outBack(clamp(t * 4));
  C.scale(s, s);
  T.draw(str, 0, 0, { size, col: o.col || PAL.cardCream, shadow: PAL.plumDark });
  C.restore();
}

function confetti(f, a, x, y, n = 60, spread = 700, seed = 1) {
  if (f < a) return;
  const t = f - a;
  const cols = [PAL.yellow, PAL.blue, PAL.pink, PAL.green, PAL.cardCream, '#e2574c'];
  C.save();
  for (let i = 0; i < n; i++) {
    const r = rng(seed * 1000 + i);
    const vx = (r() - 0.5) * spread / 30, vy = -r() * 22 - 8;
    const px = x + vx * t, py = y + vy * t + 0.55 * t * t;
    if (py > H + 40) continue;
    C.save();
    C.translate(px, py);
    C.rotate(t * (r() - 0.5) * 0.5);
    C.fillStyle = cols[i % cols.length];
    C.fillRect(-7, -4, 14, 8);
    C.restore();
  }
  C.restore();
}

function sparkle(x, y, f, a, r = 30, col = PAL.cardCream) {
  const t = seg(f, a, a + 18);
  if (t <= 0 || t >= 1) return;
  C.save();
  C.translate(x, y);
  C.rotate(t * 0.8);
  C.globalAlpha *= 1 - t;
  C.strokeStyle = col;
  C.lineCap = 'round';
  C.lineWidth = 5;
  const R = r * E.outC(t);
  C.beginPath();
  for (let k = 0; k < 4; k++) {
    const ang = (k / 4) * TAU;
    C.moveTo(Math.cos(ang) * R * 0.4, Math.sin(ang) * R * 0.4);
    C.lineTo(Math.cos(ang) * R, Math.sin(ang) * R);
  }
  C.stroke();
  C.restore();
}

// ink arrow drawn on progressively along pts between frames a and b
function drawArrow(pts, f, a, b, o = {}) {
  const t = seg(f, a, b);
  if (t <= 0) return;
  const d = P.dense(pts, false, 0.5, 6);
  const n = Math.max(2, Math.floor(d.length * E.outC(t)));
  const part = d.slice(0, n);
  P.ink(part, { w: o.w ?? 6, col: o.col || PAL.cardCream, seed: 600, taper: false });
  if (t > 0.6) {
    const p = part[part.length - 1], q = part[Math.max(0, part.length - 4)];
    const ang = Math.atan2(p[1] - q[1], p[0] - q[0]);
    const L = (o.w ?? 6) * 4;
    C.save();
    C.strokeStyle = o.col || PAL.cardCream;
    C.lineWidth = o.w ?? 6;
    C.lineCap = 'round';
    C.beginPath();
    C.moveTo(p[0] + Math.cos(ang + 2.5) * L, p[1] + Math.sin(ang + 2.5) * L);
    C.lineTo(p[0], p[1]);
    C.lineTo(p[0] + Math.cos(ang - 2.5) * L, p[1] + Math.sin(ang - 2.5) * L);
    C.stroke();
    C.restore();
  }
}

function zzz(x, y, f, col = PAL.cardCream) {
  for (let k = 0; k < 3; k++) {
    const t = ((f * 0.015 + k / 3) % 1);
    C.save();
    C.globalAlpha *= Math.sin(t * Math.PI);
    T.draw('Z', x + t * 40 + k * 6, y - t * 80, { size: 26 + k * 8, col });
    C.restore();
  }
}

// speech bubble with an icon drawer inside
function bubble(x, y, w, h, f, a, b, drawInside, o = {}) {
  const t = E.outBack(seg(f, a, a + 10)) * (1 - E.inQ(seg(f, b, b + 8)));
  if (t <= 0) return;
  C.save();
  C.translate(x, y);
  C.scale(t, t);
  const tail = o.tail ?? [-w * 0.25, h / 2 + 30];
  P.shape([[-w * 0.35, h / 2 - 6], tail, [-w * 0.1, h / 2 - 6]], { fill: PAL.white, lw: 2.8, seed: 610, smooth: 0.2 });
  P.rrect(-w / 2, -h / 2, w, h, h * 0.35, { fill: PAL.white, lw: 2.8, seed: 611, texA: 0.25 });
  C.fillStyle = PAL.white;
  C.fillRect(-w * 0.34, h / 2 - 12, w * 0.26, 12);
  drawInside();
  C.restore();
}

// count badge that pops over a cube: '1', '2', ...
function countBadge(x, y, n, f, a, col = PAL.cardCream) {
  const t = seg(f, a, a + 12);
  if (t <= 0) return;
  C.save();
  C.translate(x, y - E.outC(t) * 14);
  const s = E.outBack(t);
  C.scale(s, s);
  P.ellipse(0, 0, 20, 20, { fill: col, lw: 2.4, seed: 620 + n, texA: 0.2 });
  T.draw(String(n), 0, 2, { size: 28, col: PAL.plumDark });
  C.restore();
}
