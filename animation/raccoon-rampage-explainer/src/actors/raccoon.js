// Rascal and friends: a parametric cartoon raccoon drawn with the painterly
// renderer. Local units are pixels at scale 1 (about 230 px tall with ears);
// the origin is on the ground between the feet.
//
// o: x, y, s (scale), face (1 = facing right, -1 = left), lean, squash, tilt,
//    turn (-1..1 head turn), arms [l, r] (0 = down, PI = straight up),
//    legs [l, r] (swing angles), tail (swing), eyes, blink, mouth, look [x, y],
//    shades, suit, prop ('burger' | 'sign' | 'cube'), propCol, seed, alpha, shadow
const RACCOON_DEFAULT = {
  x: 0, y: 0, s: 1, face: 1, lean: 0, squash: 0, tilt: 0, turn: 0,
  arms: [0.25, 0.25], legs: [0, 0], tail: 0, eyes: 'open', blink: 0, mouth: 'smile',
  look: [0, 0], seed: 1, shadow: true, sit: false,
};

function raccoon(opts) {
  const o = { ...RACCOON_DEFAULT, ...opts };
  // unless a scene says otherwise, blink now and then and breathe gently
  const fr = P.frame + o.seed * 37;
  if (opts.blink === undefined) { const k = fr % 113; o.blink = k < 3 ? 1 : k < 5 ? 0.5 : 0; }
  if (opts.squash === undefined) o.squash = Math.sin(fr * 0.09) * 0.012;
  if (o.alpha !== undefined && o.alpha <= 0) return;
  const sd = o.seed * 37;
  const lw = 3.4 / Math.sqrt(Math.max(0.2, o.s));
  C.save();
  if (o.alpha !== undefined) C.globalAlpha *= o.alpha;
  C.translate(o.x, o.y);
  if (o.shadow) P.shadow(0, 2 * o.s, 70 * o.s, 14 * o.s, 0.24);
  C.scale(o.s * o.face, o.s);
  // squash and stretch from the ground
  const sq = o.squash;
  C.scale(1 + sq * 0.55, 1 - sq);

  const hipY = o.sit ? -26 : -40;
  // lean: rotate the whole upper body around the hips
  const drawUpper = (fn) => {
    C.save();
    C.translate(0, hipY);
    C.rotate(o.lean);
    C.translate(0, -hipY);
    fn();
    C.restore();
  };

  // ---- tail (behind everything) ----
  drawUpper(() => raccoonTail(o, sd, lw, hipY));

  // ---- legs and feet ----
  for (const side of [-1, 1]) {
    const ang = side < 0 ? o.legs[0] : o.legs[1];
    C.save();
    C.translate(side * 20, hipY + 4);
    C.rotate(ang);
    if (o.sit) {
      P.ellipse(side * 14, 18, 22, 14, { fill: PAL.furDark, lw, seed: sd + 3 + side, texA: 0.35 });
    } else {
      P.shape([[-11, -6], [11, -6], [10, 26], [-10, 26]], { fill: PAL.furDark, lw, seed: sd + 3 + side, smooth: 0.4, texA: 0.35 });
      P.ellipse(side * 4, 32, 16, 8.5, { fill: PAL.furDark, lw, seed: sd + 5 + side, texA: 0.3 });
    }
    C.restore();
  }

  drawUpper(() => {
    // ---- body ----
    const bodyCol = o.suit ? '#2b2530' : PAL.fur;
    P.shape([[-44, -34], [-40, -86], [-26, -116], [0, -124], [26, -116], [40, -86], [44, -34], [26, -18], [0, -14], [-26, -18]],
      { fill: bodyCol, lw, seed: sd + 10, texA: 0.45 });
    if (o.suit) {
      // shirt, lapels and tie
      P.shape([[-16, -118], [16, -118], [6, -60], [-6, -60]], { fill: PAL.white, lw: lw * 0.8, seed: sd + 11, texA: 0.2, edge: 0.1 });
      P.shape([[-5, -112], [5, -112], [8, -70], [0, -58], [-8, -70]], { fill: '#c9403a', lw: lw * 0.8, seed: sd + 12, texA: 0.3 });
      P.line([[-18, -118], [-8, -84], [-4, -60]], { w: lw * 0.8, seed: sd + 13 });
      P.line([[18, -118], [8, -84], [4, -60]], { w: lw * 0.8, seed: sd + 14 });
    } else {
      P.ellipse(0, -62, 27, 36, { fill: PAL.belly, lw: 0, ink: false, seed: sd + 15, texA: 0.35, edge: 0.18 });
      // fur flecks
      for (let i = 0; i < 4; i++) {
        const fx = (hash(sd + i) - 0.5) * 50, fy = -40 - hash(sd + i + 9) * 60;
        P.line([[fx, fy], [fx + 2, fy + 6]], { w: lw * 0.45, col: PAL.furDark, seed: sd + 20 + i });
      }
    }

    // ---- arms ----
    for (const side of [-1, 1]) {
      const ang = side < 0 ? o.arms[0] : o.arms[1];
      C.save();
      C.translate(side * 30, -104);
      C.rotate(side * ang);
      P.shape([[-8, -4], [8, -4], [9, 40], [-9, 40]], { fill: o.suit ? '#2b2530' : PAL.fur, lw, seed: sd + 30 + side, smooth: 0.4, texA: 0.4 });
      P.ellipse(0, 44, 10.5, 9, { fill: PAL.furDark, lw, seed: sd + 32 + side, texA: 0.3 });
      // tiny claws
      for (let k = -1; k <= 1; k++) P.line([[k * 4, 50], [k * 5, 55]], { w: lw * 0.4, seed: sd + 34 + k });
      C.restore();
    }

    // ---- props held in the paws ----
    if (o.prop) raccoonProp(o, sd, lw);

    // ---- head ----
    C.save();
    C.translate(0, -118);
    C.rotate(o.tilt);
    C.translate(0, 118);
    raccoonHead(o, sd, lw);
    C.restore();
  });

  C.restore();
}

function raccoonTail(o, sd, lw, hipY) {
  const sw = o.tail;
  // S-curved centreline from the rump, sweeping back and up
  const b0 = [-26, hipY + 4];
  const b1 = [-92, hipY + 16];
  const b2 = [-128 + Math.sin(sw) * 26, hipY - 58];
  const b3 = [-86 + Math.sin(sw) * 58, hipY - 132 + Math.abs(Math.sin(sw)) * 18];
  const N = 22;
  const cl = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N, u = 1 - t;
    cl.push([
      u * u * u * b0[0] + 3 * u * u * t * b1[0] + 3 * u * t * t * b2[0] + t * t * t * b3[0],
      u * u * u * b0[1] + 3 * u * u * t * b1[1] + 3 * u * t * t * b2[1] + t * t * t * b3[1],
    ]);
  }
  const width = (t) => 10 + 24 * Math.pow(Math.sin(Math.min(1, t * 1.05 + 0.08) * Math.PI * 0.82), 0.9);
  const L = [], R = [];
  for (let i = 0; i <= N; i++) {
    const a = cl[Math.max(0, i - 1)], b = cl[Math.min(N, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], m = Math.hypot(dx, dy) || 1;
    const nx = -dy / m, ny = dx / m, w = width(i / N);
    L.push([cl[i][0] + nx * w, cl[i][1] + ny * w]);
    R.push([cl[i][0] - nx * w, cl[i][1] - ny * w]);
  }
  const e = cl[N], p = cl[N - 1];
  const ang = Math.atan2(e[1] - p[1], e[0] - p[0]);
  const wt = width(1);
  const tip = [];
  for (let k = 1; k < 8; k++) {
    const a = ang + Math.PI / 2 - (k / 8) * Math.PI;
    tip.push([e[0] + Math.cos(a) * wt, e[1] + Math.sin(a) * wt]);
  }
  const poly = P.wobble(L.concat(tip, R.reverse()), 0.8, sd + 50 + P.boil);
  const path = P.path(poly, true, 0.5);
  C.fillStyle = PAL.tailLight;
  C.fill(path);
  C.save();
  C.clip(path);
  // rings: a dashed stroke along the spine, ending in a dark tip
  let len = 0;
  for (let i = 1; i <= N; i++) len += Math.hypot(cl[i][0] - cl[i - 1][0], cl[i][1] - cl[i - 1][1]);
  const ext = [...cl, [e[0] + Math.cos(ang) * 40, e[1] + Math.sin(ang) * 40]];
  const band = len / 7.5;
  C.setLineDash([band, band]);
  C.lineDashOffset = -(len - Math.floor(len / (2 * band)) * 2 * band) + band * 0.2;
  C.lineCap = 'butt';
  C.lineJoin = 'round';
  C.strokeStyle = PAL.furDark;
  C.lineWidth = 110;
  C.stroke(P.path(ext, false, 0.5));
  C.setLineDash([]);
  // texture and pooled edges
  C.globalCompositeOperation = 'multiply';
  C.globalAlpha = 0.45;
  const pat = P.pat.mottle_fine;
  if (pat) {
    pat.setTransform(new DOMMatrix().translate(hash(sd) * 500, 0).scale(0.5));
    C.fillStyle = pat;
    C.fillRect(-240, hipY - 200, 260, 260);
  }
  C.globalCompositeOperation = 'source-over';
  C.globalAlpha = 0.25;
  C.strokeStyle = PAL.plumDark;
  C.lineWidth = 10;
  C.stroke(path);
  C.restore();
  P.ink(P.dense(poly, true, 0.5, 4), { w: lw, closed: true, seed: sd + 51 });
}

function raccoonHead(o, sd, lw) {
  const tn = o.turn;
  const fx = tn * 14; // facial features shift for a 3/4 turn
  const hy = -150;
  // ears
  for (const side of [-1, 1]) {
    const ex = side * 34 + tn * 6;
    P.shape([[ex - 18, hy - 22], [ex + side * 6, hy - 60], [ex + 16, hy - 26]], { fill: PAL.furDark, lw, seed: sd + 70 + side, smooth: 0.35, texA: 0.3 });
    P.shape([[ex - 9, hy - 28], [ex + side * 4, hy - 50], [ex + 7, hy - 30]], { fill: PAL.lilac, ink: false, seed: sd + 72 + side, smooth: 0.35, texA: 0.35, edge: 0.15 });
  }
  // head silhouette with fluffy cheek tufts
  const hp = [];
  const HN = 30;
  for (let i = 0; i < HN; i++) {
    const a = (i / HN) * TAU; // 0 = right, PI/2 = down
    const s = Math.sin(a), c = Math.cos(a);
    let rx = 55, ry = 45;
    // cheeks bulge sideways below the eye line, with alternating tufts
    const cheek = Math.max(0, s) * Math.pow(Math.abs(c), 1.5);
    rx += cheek * (i % 2 ? 20 : 9);
    ry += s > 0 ? -4 : 0;
    hp.push([fx * 0.2 + c * rx, hy + 4 + s * ry]);
  }
  const hpw = P.wobble(hp, 0.8, sd + 80 + P.boil);
  const hpath = P.path(hpw, true, 0.45);
  C.fillStyle = PAL.muzzle;
  C.fill(hpath);
  C.save();
  C.clip(hpath);
  // grey crown down to the brows, with a stripe to the nose
  P.shape([[-90, hy - 80], [90, hy - 80], [90, hy - 14], [44 + fx, hy - 18], [20 + fx, hy - 22], [fx + 7, hy - 16],
    [fx + 5, hy - 2], [fx - 5, hy - 2], [fx - 7, hy - 16], [fx - 20, hy - 22], [-44 + fx, hy - 18], [-90, hy - 14]],
  { fill: PAL.furMid, ink: false, seed: sd + 81, smooth: 0.25, texA: 0.45, edge: 0.12 });
  P.shape([[fx * 0.6 - 7, hy - 60], [fx * 0.6 + 7, hy - 60], [fx + 6, hy - 6], [fx - 6, hy - 6]], { fill: PAL.furDark, ink: false, seed: sd + 82, smooth: 0.3, texA: 0.3, edge: 0 });
  // bandit mask: dark band across the eyes, sweeping down the cheeks
  const mk = [[-64 + fx * 0.5, hy - 2], [-50 + fx, hy - 13], [-24 + fx, hy - 13], [fx - 6, hy - 6], [fx + 6, hy - 6], [24 + fx, hy - 13],
    [50 + fx, hy - 13], [64 + fx * 0.5, hy - 2], [58 + fx * 0.6, hy + 20], [34 + fx, hy + 16], [14 + fx, hy + 8],
    [fx, hy + 4], [-14 + fx, hy + 8], [-34 + fx, hy + 16], [-58 + fx * 0.6, hy + 20]];
  P.shape(mk, { fill: PAL.furDark, ink: false, seed: sd + 83, smooth: 0.4, texA: 0.3, edge: 0.1 });
  C.globalAlpha = 0.22;
  C.strokeStyle = PAL.plumDark;
  C.lineWidth = 10;
  C.stroke(hpath);
  C.restore();
  P.ink(P.dense(hpw, true, 0.45, 4), { w: lw, closed: true, seed: sd + 84 });
  // eye patches and eyes
  for (const side of [-1, 1]) {
    const far = side * tn < 0;
    const ex = fx + side * 23 * (far ? 0.85 : 1), ey = hy + 1;
    P.ellipse(ex, ey, far ? 11 : 13, 12, { fill: PAL.furLight, ink: false, seed: sd + 90 + side, texA: 0.25, edge: 0.15 });
    raccoonEye(o, ex, ey, side, sd, lw);
  }
  if (o.shades) {
    for (const side of [-1, 1]) P.rrect(fx + side * 23 - 18, hy - 11, 36, 23, 8, { fill: '#1b1620', lw, seed: sd + 95 + side, texA: 0.15, edge: 0 });
    P.line([[fx - 5, hy - 4], [fx + 5, hy - 4]], { w: lw, seed: sd + 97 });
    for (const side of [-1, 1]) P.line([[fx + side * 23 - 11, hy - 6], [fx + side * 23 - 4, hy]], { w: 2.4, col: '#9d97a8', seed: sd + 98 + side });
  }
  // muzzle, nose and mouth
  P.shape([[fx * 1.1 - 22, hy + 22], [fx * 1.1 - 14, hy + 10], [fx * 1.1 + 14, hy + 10], [fx * 1.1 + 22, hy + 22], [fx * 1.1 + 12, hy + 34], [fx * 1.1 - 12, hy + 34]],
    { fill: PAL.muzzle, lw: lw * 0.8, seed: sd + 100, smooth: 0.6, texA: 0.25, edge: 0.12 });
  P.shape([[fx * 1.25 - 9, hy + 10], [fx * 1.25 + 9, hy + 10], [fx * 1.25, hy + 20]], { fill: PAL.black, lw: lw * 0.7, seed: sd + 101, smooth: 0.5, texA: 0.2, edge: 0 });
  C.fillStyle = 'rgba(255,255,255,0.7)';
  C.beginPath();
  C.ellipse(fx * 1.25 - 2, hy + 12.5, 2.6, 1.4, 0, 0, TAU);
  C.fill();
  raccoonMouth(o, fx * 1.25, hy + 25, sd, lw);
}

function raccoonEye(o, ex, ey, side, sd, lw) {
  if (o.shades) return;
  const blink = clamp(o.blink);
  const kind = blink > 0.85 ? 'closed' : o.eyes;
  const lx = o.look[0] * 3, ly = o.look[1] * 3;
  if (kind === 'happy') {
    P.line([[ex - 7, ey + 3], [ex, ey - 4], [ex + 7, ey + 3]], { w: lw * 1.1, seed: sd + 110 + side, col: PAL.black });
    return;
  }
  if (kind === 'closed') {
    P.line([[ex - 7, ey + 1], [ex, ey + 4], [ex + 7, ey + 1]], { w: lw * 1.1, seed: sd + 112 + side, col: PAL.black });
    return;
  }
  if (kind === 'dizzy') {
    P.line([[ex - 6, ey - 6], [ex + 6, ey + 6]], { w: lw, seed: sd + 113, col: PAL.black });
    P.line([[ex + 6, ey - 6], [ex - 6, ey + 6]], { w: lw, seed: sd + 114, col: PAL.black });
    return;
  }
  const big = kind === 'wide' ? 1.25 : 1;
  const ry = 7.5 * big * (1 - blink);
  C.save();
  C.fillStyle = PAL.black;
  C.beginPath();
  C.ellipse(ex + lx, ey + ly, 6.2 * big, Math.max(0.8, ry), 0, 0, TAU);
  C.fill();
  C.fillStyle = PAL.white;
  C.beginPath();
  C.arc(ex + lx + 2, ey + ly - 3 * big, 2.1 * big, 0, TAU);
  C.fill();
  C.restore();
  if (kind === 'sly' || kind === 'sad') {
    // heavy lid
    const tilt = kind === 'sly' ? side * 3 : -side * 4;
    P.shape([[ex - 10, ey - 11 - tilt], [ex + 10, ey - 11 + tilt], [ex + 10, ey - 1 + tilt * 0.3], [ex - 10, ey - 1 - tilt * 0.3]],
      { fill: PAL.furLight, ink: false, seed: sd + 115 + side, smooth: 0.2, texA: 0.2, edge: 0 });
    P.line([[ex - 9, ey - 1 - tilt * 0.3], [ex + 9, ey - 1 + tilt * 0.3]], { w: lw * 0.8, seed: sd + 117 + side, col: PAL.black });
  }
}

function raccoonMouth(o, mx, my, sd, lw) {
  const m = o.mouth;
  const col = PAL.black;
  if (m === 'smile') P.line([[mx - 8, my], [mx - 3, my + 4], [mx, my + 1], [mx + 3, my + 4], [mx + 8, my]], { w: lw * 0.8, seed: sd + 120, col });
  else if (m === 'smirk') P.line([[mx - 6, my + 2], [mx + 2, my + 3], [mx + 9, my - 2]], { w: lw * 0.8, seed: sd + 121, col });
  else if (m === 'flat') P.line([[mx - 6, my + 2], [mx + 6, my + 2]], { w: lw * 0.8, seed: sd + 122, col });
  else if (m === 'frown') P.line([[mx - 7, my + 5], [mx, my + 1], [mx + 7, my + 5]], { w: lw * 0.8, seed: sd + 123, col });
  else if (m === 'o') P.ellipse(mx, my + 4, 4.5, 5.5, { fill: '#5a2c38', lw: lw * 0.7, seed: sd + 124, texA: 0.1, edge: 0 });
  else if (m === 'open' || m === 'grin') {
    const h = m === 'grin' ? 7 : 11;
    P.shape([[mx - 10, my], [mx + 10, my], [mx + 6, my + h], [mx - 6, my + h]], { fill: '#5a2c38', lw: lw * 0.7, seed: sd + 125, smooth: 0.6, texA: 0.1, edge: 0 });
    P.ellipse(mx, my + h - 2, 5, 2.5, { fill: '#e27d95', ink: false, seed: sd + 126, texA: 0, edge: 0 });
    if (m === 'grin') {
      C.fillStyle = PAL.white;
      C.fillRect(mx - 5, my, 4, 3.5);
      C.fillRect(mx + 1, my, 4, 3.5);
    }
  } else if (m === 'chomp') {
    P.ellipse(mx, my + 3, 7, 4, { fill: '#5a2c38', lw: lw * 0.7, seed: sd + 127, texA: 0, edge: 0 });
  }
}

function raccoonProp(o, sd, lw) {
  if (o.prop === 'burger') {
    C.save();
    C.translate(0, -60);
    burger(0, 0, 1, sd);
    C.restore();
  } else if (o.prop === 'sign') {
    C.save();
    C.translate(0, -74);
    C.rotate(-0.05);
    P.rrect(-58, -34, 116, 58, 8, { fill: PAL.cardCream, lw, seed: sd + 140, texA: 0.3 });
    T.draw(o.signText || 'SPREAD', 0, -4, { size: 34, col: '#c9403a', spacing: 1 });
    C.restore();
  }
}

function burger(x, y, s = 1, seed = 0) {
  C.save();
  C.translate(x, y);
  C.scale(s, s);
  const lw = 2.6;
  P.shape([[-26, 6], [26, 6], [24, 16], [-24, 16]], { fill: '#d99a4e', lw, seed: seed + 1, smooth: 0.5, texA: 0.35 });
  P.shape([[-28, 0], [28, 0], [22, 8], [-22, 8]], { fill: '#5b3a2e', lw, seed: seed + 2, smooth: 0.5, texA: 0.35 });
  P.shape([[-30, -4], [-18, 2], [-6, -3], [6, 2], [18, -3], [30, 1], [24, 4], [-24, 4]], { fill: '#79b35a', lw: lw * 0.8, seed: seed + 3, smooth: 0.4, texA: 0.3 });
  P.shape([[-27, -2], [-24, -16], [-10, -24], [10, -24], [24, -16], [27, -2]], { fill: '#e2a95a', lw, seed: seed + 4, smooth: 0.5, texA: 0.35 });
  for (let i = 0; i < 5; i++) P.ellipse(-14 + i * 7, -14 - (i % 2) * 4, 1.6, 1, { fill: PAL.white, ink: false, tex: false, edge: 0, seed: seed + 5 + i });
  C.restore();
}

// walking helper: returns pose params for a walk/run cycle at frame f
function walkPose(f, speed = 0.35, amp = 0.55, seed = 0) {
  const ph = f * speed + seed;
  return {
    legs: [Math.sin(ph) * amp, -Math.sin(ph) * amp],
    arms: [0.3 + Math.sin(ph) * amp * 0.45, 0.3 - Math.sin(ph) * amp * 0.45],
    squash: Math.abs(Math.sin(ph)) * 0.05 - 0.02,
    bob: -Math.abs(Math.sin(ph)) * 8,
    tail: Math.sin(ph * 0.5) * 0.4,
    tilt: Math.sin(ph) * 0.04,
  };
}
