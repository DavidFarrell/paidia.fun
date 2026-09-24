// The Raccoon: the film's mischievous star. Drawn live (wash + ink) so it can act.
//
// RR.drawRaccoon(x, y, s, pose) - (x, y) is the point between the feet on the ground,
// s the scale (1 = about 200 px tall). pose fields (all optional):
//   face      1 facing right, -1 facing left
//   lean      body tilt in radians (positive leans forward)
//   squash    -0.3..0.3 (positive squashes, negative stretches)
//   headTilt  radians; look [dx, dy] in -1..1 moves the pupils
//   blink     0..1; eyes 'open' | 'closed' | 'happy' | 'wide'
//   mouth     'smile' | 'grin' | 'open' | 'o' | 'flat' | 'frown' | 'cackle'
//   brow      'neutral' | 'up' | 'angry' | 'sly' | 'worried'
//   armF, armB  front/back arm angle (0 hangs down, PI/2 points forward, PI straight up)
//   run       run-cycle phase in radians (omit to stand); stride 0..1
//   tail      tail swing phase; tailUp 0..1 raises the tail
//   hold      'burger' | 'trophy' | null (held in the front hand)
//   ear       ear twitch -1..1
//   col       fur colour override (tokens/variants)

RR.drawRaccoon = (x, y, s = 1, p = {}) => {
  const f = p.face ?? 1;
  const sq = p.squash ?? 0;
  const C = RR.C;
  const furCol = p.col || C.fur;
  push();
  translate(x, y);
  if (p.lean) rotate(p.lean * f);
  scale(s * (1 + sq * 0.6) * f, s * (1 - sq * 0.6));
  // With face = -1 the x axis is mirrored, so everything below is drawn facing right.

  const run = p.run !== undefined;
  const ph = p.run ?? 0;
  const stride = p.stride ?? 1;
  const bob = run ? -Math.abs(Math.sin(ph)) * 10 * stride : 0;
  const bodyY = -72 + bob;

  // ---- tail (behind everything): spline from the rump, curling up and back
  const tp = p.tail ?? 0;
  const up = p.tailUp ?? 0.5;
  const swing = Math.sin(tp) * 0.25;
  const N = 12;
  const c0 = [-26, bodyY + 36], c1 = [-70, bodyY + 46 - up * 8];
  const c2 = [-104 + swing * 16, bodyY + 16 - up * 40], c3 = [-88 + swing * 46, bodyY - 26 - up * 46];
  const tailPts = Array.from({ length: N + 1 }, (_, i) => RR.bezier(c0, c1, c2, c3, i / N));
  const L = [], R = [];
  for (let i = 0; i <= N; i++) {
    const a = tailPts[Math.max(0, i - 1)], b = tailPts[Math.min(N, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
    const u = i / N;
    const wdt = 11 + Math.sin(u * Math.PI * 0.85) * 12 - u * 5;
    L.push([tailPts[i][0] - (dy / d) * wdt, tailPts[i][1] + (dx / d) * wdt]);
    R.push([tailPts[i][0] + (dy / d) * wdt, tailPts[i][1] - (dx / d) * wdt]);
  }
  const tailPoly = L.concat(R.slice().reverse());
  RR.ink(tailPoly, { fill: C.tailLight, stroke: false, curve: 0.5 });
  for (let i = 2; i < N; i += 2) {
    RR.ink([L[i], L[i + 1], R[i + 1], R[i]], { fill: C.tailDark, stroke: false, curve: 0.3 });
  }
  RR.ink([L[N - 1], L[N], R[N], R[N - 1]].concat([[tailPts[N][0] + (tailPts[N][0] - tailPts[N - 1][0]) * 0.6, tailPts[N][1] + (tailPts[N][1] - tailPts[N - 1][1]) * 0.6]]), { fill: C.tailDark, stroke: false, curve: 0.5 });
  RR.ink(tailPoly, { stroke: C.ink, w: 1.1, curve: 0.5 });

  // ---- limbs helpers
  const limb = (x0, y0, ang, len, w0, w1, col) => {
    const ex = x0 + Math.sin(ang) * len, ey = y0 + Math.cos(ang) * len;
    const nx = Math.cos(ang), ny = -Math.sin(ang);
    RR.ink([[x0 - nx * w0, y0 - ny * w0], [ex - nx * w1, ey - ny * w1], [ex + nx * w1, ey + ny * w1], [x0 + nx * w0, y0 + ny * w0]], { fill: col, w: 1, curve: 0.45 });
    return [ex, ey];
  };
  const legs = (back) => {
    const hx = back ? -14 : 14;
    const phase = ph + (back ? Math.PI : 0);
    let fx = hx + (run ? Math.sin(phase) * 26 * stride : 0);
    let fy = run ? -Math.max(0, Math.cos(phase)) * 18 * stride : 0;
    const col = back ? C.furShade : furCol;
    RR.ink([[hx - 13, bodyY + 40], [fx - 10, fy - 10], [fx + 10, fy - 10], [hx + 13, bodyY + 40]], { fill: col, w: 1, curve: 0.4 });
    RR.inkEllipse(fx + 5, fy - 6, 15, 7.5, { fill: C.mask, w: 0.9 });
  };
  const arm = (back) => {
    const ang = back ? (p.armB ?? 0.25) : (p.armF ?? 0.35);
    const sx = back ? -22 : 28, sy = bodyY - 16;
    const [hx, hy] = limb(sx, sy, ang, 44, 10, 7.5, back ? C.furShade : furCol);
    RR.inkCircle(hx, hy, 8, { fill: C.mask, w: 0.8 });
    return [hx, hy];
  };

  legs(true);
  arm(true);
  legs(false);

  // ---- body (pear) and belly
  const body = RR.ellipsePts(0, bodyY, 44, 56, 22).map(([bx, by]) => {
    const k = RR.clamp((by - (bodyY - 56)) / 112);
    return [bx * (0.78 + k * 0.32), by];
  });
  RR.ink(body, { fill: furCol, w: 1.2, curve: 0.5 });
  RR.ink(RR.ellipsePts(8, bodyY + 12, 25, 36, 16), { fill: C.muzzle, alpha: 200, stroke: false, curve: 0.5 });
  RR.inkLine([[-30, bodyY - 20], [-36, bodyY + 10], [-30, bodyY + 36]], { col: C.furDark, w: 0.6, brush: 'pencil' });

  // ---- head
  push();
  translate(4, bodyY - 60);
  rotate(p.headTilt ?? 0);
  const earT = p.ear ?? 0;
  for (const sx of [-1, 1]) {
    push();
    translate(sx * 34, -34);
    rotate(sx * (0.25 + (sx > 0 ? earT * 0.3 : 0)));
    RR.ink([[-16, 6], [-4, -30], [16, 6]], { fill: furCol, w: 1, curve: 0.4 });
    RR.ink([[-8, 2], [-3, -18], [8, 2]], { fill: C.earInner, stroke: false, curve: 0.4 });
    pop();
  }
  const head = [[-62, 12], [-52, -14], [-40, -34], [-18, -44], [0, -46], [18, -44], [40, -34], [52, -14], [62, 12], [70, 20], [50, 24], [30, 36], [0, 42], [-30, 36], [-50, 24], [-70, 20]];
  RR.ink(head, { fill: furCol, w: 1.2, curve: 0.45 });
  // pale brows, cheeks and muzzle
  RR.ink([[-54, 10], [-44, -12], [-26, -22], [-10, -18], [0, -10], [10, -18], [26, -22], [44, -12], [54, 10], [40, 22], [20, 32], [0, 38], [-20, 32], [-40, 22]], { fill: C.muzzle, stroke: false, curve: 0.5 });
  RR.ink([[-6, -44], [6, -44], [4, -12], [-4, -12]], { fill: C.furDark, alpha: 170, stroke: false, curve: 0.5 });
  // mask
  RR.ink([[-50, 4], [-40, -10], [-20, -12], [-6, -2], [0, 6], [6, -2], [20, -12], [40, -10], [50, 4], [40, 16], [20, 16], [8, 12], [0, 18], [-8, 12], [-20, 16], [-40, 16]], { fill: C.mask, stroke: false, curve: 0.45 });

  // eyes
  const look = p.look || [0, 0];
  const blink = RR.clamp(p.blink ?? 0);
  const eyes = p.eyes || 'open';
  for (const sx of [-1, 1]) {
    const ex = sx * 24, ey = 2;
    if (eyes === 'closed' || blink > 0.85) {
      RR.inkLine([[ex - 9, ey], [ex, ey + 4], [ex + 9, ey]], { col: C.muzzle, w: 1.1, curve: 0.6 });
    } else if (eyes === 'happy') {
      RR.inkLine([[ex - 9, ey + 3], [ex, ey - 5], [ex + 9, ey + 3]], { col: C.muzzle, w: 1.2, curve: 0.6 });
    } else {
      const big = eyes === 'wide' ? 1.25 : 1;
      RR.flatEllipse(ex, ey, 10 * big, 10 * big * (1 - blink), C.muzzle);
      RR.flatEllipse(ex + look[0] * 3.5 + 1, ey + look[1] * 3 * (1 - blink), 5.5 * big, 6 * big * (1 - blink), C.ink);
      if (blink < 0.5) RR.flatEllipse(ex + look[0] * 3.5 + 3, ey + look[1] * 3 - 3, 1.8, 1.8, '#ffffff');
    }
  }
  // brows (expression marks above the mask)
  const brow = p.brow || 'neutral';
  const browA = { neutral: [0, 0], up: [-0.35, 0.35], angry: [0.45, -0.45], sly: [0.4, 0.2], worried: [-0.45, 0.45] }[brow];
  for (const sx of [-1, 1]) {
    const a = sx < 0 ? browA[0] : browA[1];
    const bx = sx * 25, by = -18 - (brow === 'up' ? 5 : 0);
    RR.inkLine([[bx - 9, by + a * 8 * sx * -1], [bx + 9, by - a * 8 * sx * -1]].map(([u, v]) => [u, v]), { col: C.furDark, w: 1, curve: 0 });
  }
  // nose and mouth
  RR.ink([[-7, 20], [7, 20], [0, 28]], { fill: C.nose, stroke: false, curve: 0.6 });
  const m = p.mouth || 'smile';
  if (m === 'smile') RR.inkLine([[-11, 30], [-5, 35], [0, 32], [5, 35], [11, 30]], { w: 0.9, curve: 0.6 });
  else if (m === 'flat') RR.inkLine([[-8, 34], [8, 34]], { w: 0.9 });
  else if (m === 'frown') RR.inkLine([[-10, 37], [0, 32], [10, 37]], { w: 0.9, curve: 0.6 });
  else if (m === 'o') RR.inkEllipse(0, 36, 5, 6, { fill: '#6b2f3a', w: 0.8 });
  else {
    const big = m === 'cackle' ? 1.35 : m === 'open' ? 1 : 0.85;
    const mouthPts = [[-16 * big, 29], [16 * big, 29], [10 * big, 29 + 14 * big], [0, 29 + 17 * big], [-10 * big, 29 + 14 * big]];
    RR.ink(mouthPts, { fill: '#6b2f3a', w: 0.9, curve: 0.4 });
    RR.ink([[-6 * big, 29 + 11 * big], [6 * big, 29 + 11 * big], [0, 29 + 16 * big]], { fill: '#e38a9b', stroke: false, curve: 0.6 });
    if (m === 'grin' || m === 'cackle') RR.ink([[-14 * big, 29.5], [14 * big, 29.5], [12 * big, 33], [-12 * big, 33]], { fill: '#fbf7ef', stroke: false, curve: 0.2 });
  }
  pop();

  // ---- front arm and held item
  const hand = arm(false);
  if (p.hold === 'burger') {
    push(); translate(hand[0] + 6, hand[1] - 10); rotate(-0.15);
    RR.ink([[-20, 6], [20, 6], [16, 12], [-16, 12]], { fill: '#d9a25e', w: 0.8, curve: 0.5 });
    RR.ink([[-21, 1], [21, 1], [20, 7], [-20, 7]], { fill: '#6b4431', w: 0.8, curve: 0.4 });
    RR.ink([[-22, -2], [0, 2], [22, -2], [20, 3], [-20, 3]], { fill: '#8cbf5a', stroke: false, curve: 0.6 });
    RR.ink([[-20, 0], [-14, -14], [0, -18], [14, -14], [20, 0]], { fill: '#e2ae66', w: 0.9, curve: 0.6 });
    pop();
    RR.inkCircle(hand[0], hand[1], 8, { fill: C.mask, w: 0.8 });
  } else if (p.hold === 'trophy') {
    push(); translate(hand[0] + 2, hand[1] - 34);
    RR.ink([[-24, -26], [24, -26], [18, 0], [6, 10], [6, 24], [16, 32], [-16, 32], [-6, 24], [-6, 10], [-18, 0]], { fill: C.gold, stroke: C.goldDark, w: 1, curve: 0.3 });
    RR.inkLine([[-22, -18], [-34, -14], [-30, -2], [-18, -2]], { col: C.goldDark, w: 1.2, curve: 0.6 });
    RR.inkLine([[22, -18], [34, -14], [30, -2], [18, -2]], { col: C.goldDark, w: 1.2, curve: 0.6 });
    RR.inkLine([[-10, -20], [-12, -6]], { col: '#fff4c9', w: 1.4 });
    pop();
    RR.inkCircle(hand[0], hand[1], 8, { fill: C.mask, w: 0.8 });
  }
  pop();
};

// Convenience poses for common beats. t = local time for idle motion.
RR.raccoonIdle = (t, extra = {}) => ({
  squash: 0.03 * Math.sin(t * 4.2),
  tail: t * 2.2,
  blink: RR.blinkAt(t, 3.1),
  headTilt: 0.05 * Math.sin(t * 1.3),
  ...extra,
});
// Blink curve: quick blink every `period` seconds.
RR.blinkAt = (t, period = 3, offset = 0) => {
  const u = ((t + offset) % period) / period;
  const d = Math.abs(u - 0.95) * period;
  return d < 0.08 ? 1 - d / 0.08 : 0;
};
