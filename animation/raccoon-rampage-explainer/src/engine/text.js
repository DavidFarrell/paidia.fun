// Text in the game's own fonts. Monthoers (headings) has no punctuation or
// '+', so those glyphs fall back to Littlejoodles, and '+' is hand-inked.
const FONT_HEAD = "'Monthoers', 'Joodles', 'DejaVu Sans', sans-serif";
const FONT_BODY = "'Joodles', 'Monthoers', 'DejaVu Sans', sans-serif";

const T = {
  font(size, head = true) { C.font = `${size}px ${head ? FONT_HEAD : FONT_BODY}`; },

  width(str, size, head = true, spacing = 0) {
    this.font(size, head);
    let w = 0;
    for (const part of str.split('+')) w += C.measureText(part).width;
    w += (str.split('+').length - 1) * size * 0.5;
    return w + spacing * Math.max(0, str.length - 1);
  },

  // draw a string; supports a hand-inked '+'
  draw(str, x, y, o = {}) {
    const size = o.size ?? 60;
    const head = o.head ?? true;
    const spacing = o.spacing ?? 0;
    const w = this.width(str, size, head, spacing);
    let cx = o.align === 'left' ? x : o.align === 'right' ? x - w : x - w / 2;
    this.font(size, head);
    C.save();
    C.textBaseline = 'middle';
    C.textAlign = 'left';
    C.letterSpacing = spacing + 'px';
    C.fillStyle = o.col || PAL.ink;
    if (o.alpha !== undefined) C.globalAlpha *= o.alpha;
    if (o.shadow) {
      C.shadowColor = rgba(o.shadow, 0.55);
      C.shadowOffsetY = size * 0.06;
      C.shadowBlur = 0;
    }
    const parts = str.split('+');
    parts.forEach((part, i) => {
      if (i > 0) {
        const pw = size * 0.5;
        const px = cx + pw * 0.5, py = y - size * 0.04, r = size * 0.19;
        C.lineCap = 'round';
        C.strokeStyle = o.col || PAL.ink;
        C.lineWidth = size * 0.1;
        C.beginPath();
        C.moveTo(px - r, py + 1); C.lineTo(px + r, py - 1);
        C.moveTo(px + 1, py - r); C.lineTo(px - 1, py + r);
        C.stroke();
        cx += pw;
      }
      C.fillText(part, cx, y);
      cx += C.measureText(part).width + (part.length ? spacing : 0);
    });
    C.restore();
    return w;
  },

  // text that pops in letter by letter from local frame a
  pop(str, x, y, f, a, o = {}) {
    const size = o.size ?? 60;
    const stagger = o.stagger ?? 1.2;
    const w = this.width(str, size, o.head ?? true, o.spacing ?? 0);
    let cx = o.align === 'left' ? x : x - w / 2;
    this.font(size, o.head ?? true);
    let i = 0;
    for (const ch of str) {
      const cw = ch === '+' ? size * 0.5 : C.measureText(ch).width + (o.spacing ?? 0);
      const t = seg(f, a + i * stagger, a + i * stagger + 10);
      if (t > 0) {
        const s = lerp(0.4, 1, E.outBack(t));
        C.save();
        C.translate(cx + cw / 2, y + (1 - E.outQ(t)) * size * 0.3);
        C.scale(s, s);
        C.rotate((hash(i + (o.seed ?? 0)) - 0.5) * 0.08);
        this.draw(ch, 0, 0, { ...o, align: 'center', alpha: (o.alpha ?? 1) * clamp(t * 2) });
        C.restore();
      }
      cx += cw;
      if (ch !== ' ') i++;
    }
    return w;
  },
};

// painted plum banner: rounded brush landing on the left, ragged lift-off on the right
function bannerShape(x0, y, w, h, seed = 3, col = PAL.plum) {
  const top = [], bot = [];
  const n = 14;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = x0 + h * 0.35 + t * (w - h * 0.35);
    const wav = (noise1(t * 4, seed) - 0.5) * h * 0.12;
    const lift = t > 0.85 ? (t - 0.85) * h * 0.9 : 0;
    top.push([x, y - h / 2 + wav + lift * 0.4 + (i === n ? h * 0.1 : 0)]);
    bot.push([x + (i === n ? -h * 0.25 : 0), y + h / 2 + wav * 0.6 - lift * 0.5]);
  }
  const cap = [];
  for (let k = 1; k < 6; k++) {
    const a = Math.PI / 2 + (k / 6) * Math.PI;
    cap.push([x0 + h * 0.35 + Math.cos(a) * h * 0.42, y + Math.sin(a) * h * 0.5]);
  }
  const pts = top.concat([[x0 + w + h * 0.1, y - h * 0.05], [x0 + w - h * 0.05, y + h * 0.12], [x0 + w + h * 0.02, y + h * 0.3]], bot.reverse(), cap);
  P.shape(pts, { fill: col, tex: 'mottle', texA: 0.55, texS: 0.8, edge: 0.3, edgeW: 8, ink: false, seed, wob: 1.5, smooth: 0.5 });
  // bristle streaks
  for (let i = 0; i < 6; i++) {
    const yy = y + (hash(seed + i) - 0.5) * h * 0.7;
    const xa = x0 + h * 0.3 + hash(seed + i + 20) * w * 0.3;
    const xb = x0 + w * (0.7 + hash(seed + i + 40) * 0.3);
    P.line([[xa, yy], [(xa + xb) / 2, yy + (hash(seed + i + 60) - 0.5) * 6], [xb, yy + (hash(seed + i + 80) - 0.5) * 8]],
      { w: 2 + hash(seed + i) * 2, col: rgba(shade(col, 0.18), 0.55), seed: seed + i, taper: true });
  }
}

// A caption on a painted plum banner. Visible between local frames a and b.
function caption(f, a, b, str, o = {}) {
  if (f < a - 1 || f > b + 14) return;
  const size = o.size ?? 64;
  const y = o.y ?? (o.top ? 112 : H - 112);
  const x = o.x ?? W / 2;
  const tw = T.width(str, size, true, 2);
  const bw = tw + size * 1.6, bh = size * 1.55;
  const tin = seg(f, a, a + 12);
  const tout = seg(f, b, b + 12);
  C.save();
  // banner paints on from the left, and wipes away to the right
  const x0 = x - bw / 2 - size * 0.3;
  const revealR = x0 + (bw + size) * E.outC(tin);
  const revealL = x0 + (bw + size) * E.inC(tout);
  C.beginPath();
  C.rect(revealL - 10, y - bh, Math.max(0, revealR - revealL + 20), bh * 2);
  C.clip();
  bannerShape(x0, y, bw + size * 0.6, bh, (o.seed ?? 3) + Math.floor(a), o.bannerCol || PAL.plum);
  T.pop(str, x, y + size * 0.04, f, a + 4, { size, col: o.col || PAL.paper, spacing: 2, stagger: 0.8 });
  C.restore();
}

// small cream label tag with an ink outline (for pointing things out)
function tag(x, y, str, f, a, b, o = {}) {
  if (f < a || f > b + 10) return;
  const t = E.outBack(seg(f, a, a + 10)) * (1 - E.inQ(seg(f, b, b + 10)));
  if (t <= 0) return;
  const size = o.size ?? 34;
  const w = T.width(str, size, o.head ?? true, 1) + size * 1.2;
  const h = size * 1.5;
  C.save();
  C.translate(x, y);
  C.scale(t, t);
  C.rotate(o.rot ?? -0.03);
  P.rrect(-w / 2, -h / 2, w, h, h * 0.3, { fill: o.fill || PAL.cardCream, lw: 2.6, seed: hash(x) * 50, edge: 0.18 });
  T.draw(str, 0, 2, { size, col: o.col || PAL.ink, head: o.head ?? true, spacing: 1 });
  C.restore();
}
