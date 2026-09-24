// Scene 8 (96-120 s): Evaluation fails, then the raccoons SPREAD.
// A few turns later RACCOON BURGERS reaches the evaluation spot with 1 vote of 3: FAILED.
// The Raccoon pops up in shades and cackles. The Spread Rules card shows 2 cards per pile
// (raccoons have reached orange), six spread cards are dealt to France, Germany and the rest
// of Europe, two protection cubes cancel one card each, the rest are revealed (+0, +1, +0, +2),
// new tokens pop onto the map and the impact tracker climbs to +4 while the Raccoon cheers.
// Starts on FULL + S7, ends on FULL + S8 (see STORYBOARD.md).

(() => {
  const B = RR.board, C = RR.C, E = RR.E, seg = RR.seg;

  // ---------------------------------------------------------------- cameras
  const FULL = RR.cam(1200, 750, 0.66);
  const TL = RR.cam(1200, 712, 0.62);      // time-lapse: pulled back, room for the caption
  const QV = RR.cam(1780, 440, 0.95);      // queue front + evaluation spot
  const CU = RR.cam(2300, 650, 1.45);      // evaluation close-up, count on the table
  const MAP1 = RR.cam(1250, 800, 1.15);    // map + rules inset
  const DEAL = RR.cam(1090, 830, 0.93);    // deck, piles, protection circle
  const REV = RR.cam(930, 820, 1.1);       // piles + impact tracker
  const CHEER = RR.cam(330, 760, 1.0);     // tracker + the Raccoon on the table
  const CAM_KEYS = [
    [0, FULL], [0.5, TL, 'outCubic'], [2.2, TL], [2.8, QV], [3.4, QV], [4.0, CU], [7.45, CU], [8.35, MAP1],
    [10.3, MAP1], [10.95, DEAL], [15.2, DEAL], [15.7, REV], [18.95, REV], [19.55, CHEER], [21.9, CHEER], [23.6, FULL],
  ];

  // ---------------------------------------------------------------- timings
  const ADV = 2.8;                                     // queue advances
  const TICKS = [0.6, 0.85, 1.1, 17.1, 18.42, 18.7];   // impact tracker steps (-2 .. +4)
  const TICK_DUR = 0.22;
  const SHAKES = [[3.36, 0.3, 5], [4.97, 0.45, 14], [6.2, 0.3, 6], [19.45, 0.4, 12], [20.45, 0.35, 10], [21.0, 0.35, 10]]
    .concat(TICKS.slice(3).map((t0) => [t0 + TICK_DUR, 0.3, 9]));

  // ---------------------------------------------------------------- helpers
  // Hand-drawn ring that draws itself on (u 0..1), slightly spiralling like a pen circle.
  const ringOn = (x, y, r, u, o = {}) => {
    if (u <= 0) return;
    const n = 26, pts = [], a0 = o.a0 ?? -2.3, span = Math.PI * 2 * 1.1;
    for (let i = 0; i <= Math.ceil(n * u); i++) {
      const k = Math.min(i / n, u), a = a0 + k * span;
      const rr = r * (1 + 0.05 * Math.sin(k * 9) + k * 0.1);
      pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr * (o.squash ?? 0.9)]);
    }
    if (pts.length > 1) RR.inkLine(pts, { col: o.col ?? C.red, w: o.w ?? 2.2, curve: 0.5 });
  };
  // View culling: skip pieces that are off screen (set per frame from the camera).
  let VIEW = null;
  const setView = (cam) => { const hw = 960 / cam.z, hh = 540 / cam.z; VIEW = [cam.x - hw, cam.y - hh, cam.x + hw, cam.y + hh]; };
  const vis = (x, y, r) => !VIEW || (x + r > VIEW[0] && x - r < VIEW[2] && y + r > VIEW[1] && y - r < VIEW[3]);
  // Soft light: stacked translucent discs.
  const glow = (x, y, r, col, a) => {
    if (a <= 0.01) return;
    for (let k = 0; k < 4; k++) RR.flatEllipse(x, y, r * (1 + k * 0.4), r * (1 + k * 0.4), col, (90 * a) / (k + 1));
  };
  const trackerAt = (t) => -2 + TICKS.reduce((s, t0) => s + seg(t, t0, t0 + TICK_DUR, 'inOutQuad'), 0);

  // ---------------------------------------------------------------- cached art
  const shades = () => RR.sprite('s08:shades', 150, 50, () => {
    const lens = (cx) => RR.ink([[cx - 19, 12], [cx + 19, 12], [cx + 18, 27], [cx + 8, 36], [cx - 8, 36], [cx - 18, 27]], { fill: '#211b27', w: 1.1, curve: 0.35 });
    RR.inkLine([[19, 17], [31, 14]], { w: 1.3 });
    RR.inkLine([[119, 14], [131, 17]], { w: 1.3 });
    lens(51); lens(99);
    RR.inkLine([[68, 16], [75, 12], [82, 16]], { w: 1.5, curve: 0.5 });
    RR.inkLine([[38, 19], [48, 16]], { col: '#ffffff', w: 1.1, brush: 'pencil' });
    RR.inkLine([[86, 19], [96, 16]], { col: '#ffffff', w: 1.1, brush: 'pencil' });
  }, { res: 3 });
  const clockSpr = () => RR.sprite('s08:clock', 140, 150, () => {
    RR.inkLine([[42, 124], [28, 144]], { w: 1.8 });
    RR.inkLine([[98, 124], [112, 144]], { w: 1.8 });
    RR.ink(RR.ellipsePts(34, 34, 20, 16, 16, -0.6), { fill: C.gold, w: 1 });
    RR.ink(RR.ellipsePts(106, 34, 20, 16, 16, 0.6), { fill: C.gold, w: 1 });
    RR.inkCircle(70, 84, 56, { fill: C.red, w: 1.3 });
    RR.inkCircle(70, 84, 45, { fill: C.white, w: 0.8 });
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6;
      RR.inkLine([[70 + Math.cos(a) * 35, 84 + Math.sin(a) * 35], [70 + Math.cos(a) * 42, 84 + Math.sin(a) * 42]], { w: i % 3 ? 0.6 : 1.2 });
    }
  }, { res: 2 });
  const slotSpr = () => RR.sprite('s08:slot', 100, 100, () => {
    RR.ink(RR.rrectPts(12, 12, 76, 76, 14), { fill: '#dccbb4', stroke: false });
    const pts = RR.rrectPts(12, 12, 76, 76, 14, 3);
    for (let i = 0; i < pts.length; i += 2) RR.inkLine([pts[i], pts[(i + 1) % pts.length]], { col: C.plumMid, w: 1.3 });
  }, { res: 2 });
  const LABEL_SIZE = 44;
  // SPREAD! ribbon and FAILED stamp, painted once (same look as RR.banner / RR.stamp).
  const BAN = { text: 'SPREAD!', size: 120, y: 150 };
  const bannerSpr = () => {
    const size = BAN.size, tw = RR.textWidth(BAN.text, { font: 'title', size });
    const w = tw + size * 1.2, h = size * 1.25, W = Math.ceil(w + 90), H = Math.ceil(h + 50);
    return RR.sprite('s08:banner', W, H, () => {
      const seed = RR.strHash(BAN.text) + 7, pts = [], n = 14;
      for (let i = 0; i <= n; i++) pts.push([-w / 2 + (w * i) / n, -h / 2 + RR.hrange(seed + i, -5, 5)]);
      pts.push([w / 2 + 26, 0]);
      for (let i = n; i >= 0; i--) pts.push([-w / 2 + (w * i) / n, h / 2 + RR.hrange(seed + 40 + i, -5, 5)]);
      pts.push([-w / 2 - 26, 0]);
      const P = pts.map(([x, y]) => [x + W / 2, y + H / 2 - 5]);
      RR.flat(P.map(([x, y]) => [x + 8, y + 10]), C.ink, 50);
      RR.ink(P, { fill: C.redDeep, stroke: false, curve: 0.05 });
    }, { res: 1 });
  };
  const drawBanner = (t, t0, t1) => {
    const a = RR.env(t, t0, t1, 0.25, 0.35);
    if (a <= 0) return;
    const grow = E.outCubic(seg(t, t0, t0 + 0.45)), spr = bannerSpr();
    push(); translate(RR.W / 2, BAN.y - (1 - a) * 30); rotate(-0.015);
    RR.drawSprite(spr, 0, 5, { w: spr.w, h: spr.h, sx: Math.max(0.01, grow), alpha: a });
    if (grow > 0.6) RR.text(BAN.text, 0, BAN.size * 0.35, { font: 'title', size: BAN.size, col: C.card, alpha: a * seg(t, t0 + 0.2, t0 + 0.45) });
    pop();
  };
  const STAMP_SIZE = 50;
  const stampSpr = () => {
    const tw = RR.textWidth('FAILED', { font: 'title', size: STAMP_SIZE });
    const w = tw + STAMP_SIZE * 0.8, h = STAMP_SIZE * 1.2, W = Math.ceil(w + 24), H = Math.ceil(h + 24);
    return RR.sprite('s08:stamp', W, H, () => {
      RR.ink(RR.rrectPts(12, 12, w, h, 12), { stroke: C.red, w: 3.4, curve: 0.2, fill: C.white, alpha: 150 });
      RR.ink(RR.rrectPts(22, 22, w - 20, h - 20, 8), { stroke: C.red, w: 1.4, curve: 0.2 });
      RR.text('FAILED', W / 2, H / 2 + STAMP_SIZE * 0.36, { font: 'title', size: STAMP_SIZE, col: C.red });
    }, { res: 2.2 });
  };
  const drawStamp = (x, y, t, t0, rot) => {
    if (t < t0) return;
    const k = seg(t, t0, t0 + 0.22, 'inQuad');
    const sc = RR.lerp(2.4, 1, k) + (k >= 1 ? 0.06 * Math.exp(-(t - t0 - 0.22) * 12) * Math.sin((t - t0) * 40) : 0);
    const spr = stampSpr();
    push(); translate(x, y); rotate(rot); scale(sc);
    RR.drawSprite(spr, 0, 0, { w: spr.w, h: spr.h, alpha: RR.clamp(k * 1.4) });
    pop();
  };
  const labelSpr = (txt) => {
    const tw = RR.textWidth(txt, { font: 'title', size: LABEL_SIZE });
    const w = Math.ceil(tw + 44), h = 70;
    return RR.sprite('s08:label:' + txt, w, h, () => {
      RR.ink(RR.rrectPts(4, 6, w - 8, h - 12, 12), { fill: C.white, w: 0.9, curve: 0.15 });
      RR.text(txt, w / 2, h / 2 + LABEL_SIZE * 0.36, { font: 'title', size: LABEL_SIZE, col: C.plumDark });
    }, { res: 2 });
  };

  // ---------------------------------------------------------------- the Raccoon's shades
  // Draws the sunglasses (and, if raised, the front arm again on top) with the same
  // transform RR.drawRaccoon uses for the head.
  const shadesOn = (x, y, s, p, dy = 0) => {
    const f = p.face ?? 1, sq = p.squash ?? 0;
    const bob = p.run !== undefined ? -Math.abs(Math.sin(p.run)) * 10 * (p.stride ?? 1) : 0;
    const bodyY = -72 + bob;
    RR.flush();
    push();
    translate(x, y);
    if (p.lean) rotate(p.lean * f);
    scale(s * (1 + sq * 0.6) * f, s * (1 - sq * 0.6));
    push();
    translate(4, bodyY - 60);
    rotate(p.headTilt ?? 0);
    RR.drawSprite(shades(), 0, 2 + dy, { w: 150, h: 50 });
    pop();
    const a = p.armF ?? 0.35;
    if (Math.cos(a) < -0.3) {
      const x0 = 28, y0 = bodyY - 16, len = 44, w0 = 10, w1 = 7.5;
      const ex = x0 + Math.sin(a) * len, ey = y0 + Math.cos(a) * len;
      const nx = Math.cos(a), ny = -Math.sin(a);
      RR.ink([[x0 - nx * w0, y0 - ny * w0], [ex - nx * w1, ey - ny * w1], [ex + nx * w1, ey + ny * w1], [x0 + nx * w0, y0 + ny * w0]], { fill: p.col || C.fur, w: 1, curve: 0.45 });
      RR.inkCircle(ex, ey, 8, { fill: C.mask, w: 0.8 });
    }
    pop();
  };

  // ---------------------------------------------------------------- queue
  const Q = [
    { id: 'burgers', k: 1, votes: ['corp'] },
    { id: 'pets', k: 2, votes: ['ar', 'fr'] },
    { id: 'wear', k: 3, votes: ['hu', 'corp'] },
    { id: 'drones', k: 4, votes: [] },
    { id: 'protect', k: 5, votes: [] },          // face down; flips when it enters space 4
    { id: 'back:policy', k: 6 }, { id: 'back:policy', k: 7 },
    { id: 'back:policy', k: 8 },                  // placed during the time-lapse
  ];
  const drawQueue = (t) => {
    for (let j = 1; j < Q.length; j++) {
      const c = Q[j];
      const u = seg(t, ADV + j * 0.035, ADV + 0.5 + j * 0.035, 'inOutCubic');
      let [x, y] = B.slot(c.k - u);
      let lift = Math.sin(Math.PI * u) * 0.5, rot = Math.sin(Math.PI * u) * 0.025;
      let flip = c.k <= 4 ? 1 : 0;
      if (c.id === 'protect') {
        const f = seg(t, 3.12, 3.47, 'inOutQuad');
        flip = f; lift = Math.max(lift, Math.sin(Math.PI * f) * 0.8); y -= Math.sin(Math.PI * f) * 14;
      }
      if (j === 7) {
        const a = seg(t, 0.25, 0.62, 'outCubic');
        if (a <= 0) continue;
        x -= (1 - a) * 900; lift = Math.max(lift, (1 - a) * 0.9); rot -= (1 - a) * 0.15;
      }
      if (!vis(x, y, 180)) continue;
      RR.drawCard(c.id, x, y, { w: 190, flip, lift, rot });
      if (c.votes && c.votes.length && flip >= 0.5) B.cubesOnCard(x, y, c.votes, { size: 32 });
    }
  };

  // ---------------------------------------------------------------- evaluation: burgers fails
  const burgersPos = (t) => {
    const u = seg(t, ADV, ADV + 0.55, 'inOutCubic');
    const p = RR.bezier(B.slot(1), [2085, 120], [2240, 400], B.EVAL, u);
    const d = seg(t, 7.4, 7.9, 'inCubic');
    return { x: p[0] + d * 1150, y: p[1] - d * 60, rot: Math.sin(Math.PI * u) * 0.14 + d * 0.25, lift: Math.max(Math.sin(Math.PI * u), d * 0.8) };
  };
  const drawBurgers = (t) => {
    if (t > 7.92) return;
    const b = burgersPos(t);
    const land = Math.sin(Math.PI * seg(t, 3.35, 3.55));
    push(); translate(b.x, b.y); rotate(b.rot);
    RR.drawCard('burgers', 0, 0, { w: 190 * (1 + 0.035 * land), lift: b.lift });
    const cnt = Math.sin(Math.PI * seg(t, 3.9, 4.12));
    B.cubesOnCard(0, 0, ['corp'], { size: 32, pop: [1 + 0.4 * cnt] });
    const ba = RR.pop(t, 3.95, 0.3) * (1 - seg(t, 4.8, 4.95));
    if (ba > 0.01) RR.badge('1', 46, 8, { r: 24, scale: ba });
    ringOn(68, -106, 34, seg(t, 4.15, 4.45), { col: C.red, w: 2.4 });
    drawStamp(0, -16, t, 4.97, -0.2);
    pop();
  };
  const METER = { x: 2535, y: 590, gap: 100 };
  const drawMeter = (t) => {
    const a = 1 - seg(t, 5.4, 5.65);
    if (t < 4.28 || a <= 0) return;
    for (let i = 0; i < 3; i++) {
      const sc = RR.pop(t, 4.28 + i * 0.07, 0.3) * a;
      const wob = i > 0 ? Math.sin((t - 4.8) * 30 + i) * 0.14 * RR.env(t, 4.8, 5.3, 0.05, 0.3) : 0;
      if (sc > 0.01) RR.drawSprite(slotSpr(), METER.x + i * METER.gap, METER.y, { w: 90 * sc, h: 90 * sc, rot: wob });
    }
    // the counted vote hops from the card into the first slot
    const hu = seg(t, 4.45, 4.72, 'inOutQuad');
    if (hu > 0) {
      const p = RR.hop([2215, 678], [METER.x, METER.y + 2], hu, 170);
      RR.drawCube(p[0], p[1], 46 * a * (1 + 0.25 * Math.sin(Math.PI * seg(t, 4.72, 4.9))), 'corp');
    }
    const ts = RR.pop(t, 4.75, 0.35) * a;
    if (ts > 0.01) RR.text('1 of 3', METER.x + METER.gap, METER.y + 130, { font: 'title', size: 64, col: C.plumDark, scale: ts });
  };

  // ---------------------------------------------------------------- tokens and tracker
  // Tokens added in this scene: [appear time, 'pop' (time-lapse) | 'land' (flew in)]
  const ADD = {
    de: { 8: [0.5, 'pop'], 9: [16.8, 'land'] },
    fr: { 5: [0.75, 'pop'] },
    roe: { 5: [1.0, 'pop'], 6: [1.25, 'pop'], 7: [18.15, 'land'], 8: [18.4, 'land'] },
  };
  const tokensAt = (t) => ({
    de: 8 + (t >= 0.5) + (t >= 16.8),
    fr: 5 + (t >= 0.75),
    roe: 5 + (t >= 1.0) + (t >= 1.25) + (t >= 18.15) + (t >= 18.4),
  });
  const drawTokens = (t) => {
    const n = tokensAt(t);
    const party = RR.env(t, 19.55, 21.75, 0.2, 0.25);
    const one = (pos, kind, role, i) => {
      if (!vis(pos[0], pos[1], 60)) return;
      let sc = 1;
      const add = ADD[role][i];
      if (add) sc = add[1] === 'pop' ? RR.pop(t, add[0], 0.35) : 1 + 0.3 * Math.sin(Math.PI * seg(t, add[0], add[0] + 0.25));
      if (sc <= 0.01) return;
      if (add) glow(pos[0], pos[1] - 4, 26, role === 'de' ? C.de : role === 'fr' ? C.fr : C.orange, RR.env(t, add[0], add[0] + 0.7, 0.05, 0.6));
      let dy = 0;
      if (role === 'roe' && i === 6) dy += Math.sin(Math.PI * seg(t, 8.45, 8.75)) * 16;
      if (party > 0) dy += Math.max(0, Math.sin((t - 19.55) * 10 + RR.hr(i * 7 + role.length) * 6)) * 14 * party;
      const size = 40 * sc;
      if (dy > 0.5) {
        RR.shadow(pos[0] + 1.6, pos[1] + 10, 16, 5, 26);
        RR.drawToken(pos[0], pos[1] - 4 - dy, size, kind, { shadow: false });
      } else RR.drawToken(pos[0], pos[1] - 4, size, kind);
    };
    for (let i = 0; i < n.de; i++) one(B.SPOTS.de[i % B.SPOTS.de.length], 'yellow', 'de', i);
    for (let i = 0; i < n.fr; i++) one(B.SPOTS.fr[i % B.SPOTS.fr.length], 'blue', 'fr', i);
    for (let i = 0; i < n.roe; i++) one(B.SQUARES[i % B.SQUARES.length].pos, 'black', 'roe', i);
  };
  const drawTrackerGlow = (t) => {
    // flash on each step
    for (const t0 of TICKS) {
      const k = RR.env(t, t0 + TICK_DUR - 0.05, t0 + TICK_DUR + 0.6, 0.05, 0.5);
      if (k > 0) { const p = B.track(Math.round(trackerAt(t0 + TICK_DUR + 0.01))); glow(p[0], p[1], 34, C.orange, k); }
    }
    // danger glow once impact is up
    const g = RR.env(t, 18.95, 22.4, 0.5, 0.5);
    if (g > 0) {
      for (let i = 1; i <= 4; i++) {
        const p = B.track(i), pulse = 0.65 + 0.35 * Math.sin(t * 8 - i * 0.9);
        glow(p[0], p[1], 34 + 4 * pulse, RR.mix(C.orange, C.red, (i - 1) / 3), g * pulse);
      }
      const s = B.track(7);
      glow(s[0], s[1], 70, C.red, g * (0.35 + 0.25 * Math.sin(t * 6)));
    }
  };
  const drawTracker = (t) => {
    const v = trackerAt(t);
    const p = RR.along(B.TRACK_PATH, (v + 7) / 14);
    let hop = 0;
    for (const t0 of TICKS) hop += Math.sin(Math.PI * seg(t, t0, t0 + TICK_DUR)) * 24;
    const g = RR.env(t, 18.95, 22.4, 0.5, 0.5);
    if (g > 0) glow(p[0], p[1] - 6, 44, C.red, g * (0.6 + 0.3 * Math.sin(t * 8)));
    if (vis(p[0], p[1], 80)) RR.drawMarker(p[0], p[1] - hop - 6, 74);
  };

  // ---------------------------------------------------------------- storyline and protection
  const drawStory = (t) => {
    for (let i = 0; i < 5; i++) {
      const [x, y] = B.story(i);
      if (!vis(x, y, 200)) continue;
      if (i === 1) {
        const f = seg(t, 1.5, 1.85, 'inOutQuad'), l = Math.sin(Math.PI * f);
        RR.drawCard('corpself', x, y - l * 24, { w: 300 * (1 + 0.06 * l), flip: f, back: 'back:event', lift: l });
      } else RR.drawCard('corprelief', x, y, { w: 300, flip: i === 0 ? 1 : 0, back: 'back:event' });
    }
  };
  const protPos = (i) => [B.PROT[0] - 40 + (i % 3) * 40, B.PROT[1] + 10];
  const HOPS = { de: { i: 0, t0: 13.22 }, fr: { i: 1, t0: 13.0 } };
  const drawProt = (t) => {
    // yellow was already there; blue drops in during the time-lapse
    for (const role of ['de', 'fr']) {
      const h = HOPS[role];
      if (t >= h.t0) continue;
      let [x, y] = protPos(h.i);
      if (role === 'fr') {
        if (t < 1.85) continue;
        y -= (1 - E.outBounce(seg(t, 1.85, 2.2))) * 320;
      }
      const an = RR.env(t, h.t0 - 0.16, h.t0, 0.1, 0.02); // anticipation squash
      if (vis(x, y, 60)) RR.drawCube(x, y + an * 3, 38, role, { sx: 1 + 0.15 * an, sy: 1 - 0.2 * an });
    }
  };

  // ---------------------------------------------------------------- spread cards
  const PILE = { fr: [690, 882], de: [1012, 560], roe: [1622, 790] };
  const LABELS = [['fr', 'FRANCE', [690, 726], 11.32], ['de', 'GERMANY', [1012, 402], 11.54], ['roe', 'REST OF EUROPE', [1622, 630], 11.76]];
  const CW = 140, DEAL_DUR = 0.42;
  const DEALT = [
    { pile: 'fr', j: 0, td: 10.9, face: 'spread0', rev: 15.65, rest: [690, 884, -0.03], di: 0 },
    { pile: 'de', j: 0, td: 11.12, face: 'spread1', rev: 16.05, rest: [1012, 562, 0.03], di: 1 },
    { pile: 'roe', j: 0, td: 11.34, face: 'spread0', rev: 16.95, rest: [1548, 796, -0.04], di: 2 },
    { pile: 'fr', j: 1, td: 11.56, face: 'spread1', cube: 'fr', out: [-1050, 40], tout: 14.05 },
    { pile: 'de', j: 1, td: 11.78, face: 'spread2', cube: 'de', out: [60, -580], tout: 14.2 },
    { pile: 'roe', j: 1, td: 12.0, face: 'spread2', rev: 17.35, rest: [1696, 784, 0.05], di: 3 },
  ];
  const HOP_DUR = 0.5;
  const slotOf = (c) => { const P = PILE[c.pile]; return c.j ? [P[0] + 34, P[1] - 5, 0.07] : [P[0] - 34, P[1] + 5, -0.08]; };
  const cardAt = (c, t) => {
    const s = slotOf(c);
    let x = s[0], y = s[1], rot = s[2], w = CW, lift = 0, flip = 0, dim = 0;
    const u = seg(t, c.td, c.td + DEAL_DUR);
    if (u < 1) {
      const e = E.outCubic(u);
      const p = RR.hop(B.DECK, [s[0], s[1]], e, 140);
      x = p[0]; y = p[1]; rot = s[2] - (1 - e) * 3.4; w = RR.lerp(190, CW, e); lift = Math.sin(Math.PI * u);
    } else w = CW + 7 * Math.sin(Math.PI * seg(t, c.td + DEAL_DUR, c.td + DEAL_DUR + 0.18));
    if (c.rest) {
      const r = seg(t, 14.7, 15.2, 'inOutCubic');
      x = RR.lerp(x, c.rest[0], r); y = RR.lerp(y, c.rest[1], r); rot = RR.lerp(rot, c.rest[2], r);
    }
    if (c.rev) {
      const f = seg(t, c.rev, c.rev + 0.4, 'inOutQuad');
      flip = f; w = RR.lerp(CW, 152, f) + Math.sin(Math.PI * f) * 18; lift = Math.max(lift, Math.sin(Math.PI * f) * 0.9 + 0.12 * f);
      y -= Math.sin(Math.PI * f) * 8;
    }
    if (c.cube) {
      const land = HOPS[c.cube].t0 + HOP_DUR;
      rot += Math.sin((t - land) * 42) * 0.07 * RR.env(t, land, land + 0.45, 0.01, 0.4);
      dim = seg(t, land + 0.25, land + 0.5) * 0.55;
      const o = seg(t, c.tout, c.tout + 0.5, 'inCubic');
      x += c.out[0] * o; y += c.out[1] * o; rot += o * 0.35;
    }
    if (c.di !== undefined) { // dealt cards go to the discard at the end
      const d0 = 22.0 + c.di * 0.1, d = seg(t, d0, d0 + 0.55, 'inCubic');
      if (d > 0) {
        const p = RR.hop([x, y], [3000, 300 + c.di * 110], d, 160);
        x = p[0]; y = p[1]; rot += d * 2.6; lift = Math.max(lift, d);
      }
    }
    return { x, y, rot, w, lift, flip, dim };
  };
  const cardVisible = (c, t) => t >= c.td && !(c.cube && t > c.tout + 0.5) && !(c.di !== undefined && t > 22.0 + c.di * 0.1 + 0.55);

  const FLY = [ // new tokens jump out of the revealed cards
    { kind: 'yellow', card: 1, to: () => B.SPOTS.de[9], t0: 16.45, t1: 16.8, h: 150 },
    { kind: 'black', card: 5, to: () => B.SQUARES[7].pos, t0: 17.8, t1: 18.15, h: 210 },
    { kind: 'black', card: 5, to: () => B.SQUARES[8].pos, t0: 18.02, t1: 18.4, h: 300 },
  ];
  const SPARKS = [[16.8, 17.1, 0], [18.15, 18.42, 1], [18.42, 18.7, 2]]; // token -> tracker

  const drawSpread = (t) => {
    if (t < 10.85 || t > 22.9) return;
    // cards
    for (const c of DEALT) {
      if (!cardVisible(c, t)) continue;
      const s = cardAt(c, t);
      RR.drawCard(c.face, s.x, s.y, { w: s.w, rot: s.rot, flip: s.flip, lift: s.lift, dim: s.dim });
      if (c.cube && t >= HOPS[c.cube].t0 + HOP_DUR) {
        const land = HOPS[c.cube].t0 + HOP_DUR;
        // cancelled: a quick red cross, then the cube rides the card away
        const x1 = seg(t, land + 0.12, land + 0.27), x2 = seg(t, land + 0.27, land + 0.42);
        if (x1 > 0) {
          const hw = s.w * 0.36, hh = s.w * 0.5;
          push(); translate(s.x, s.y); rotate(s.rot);
          RR.inkLine([[-hw, -hh], [-hw + 2 * hw * x1, -hh + 2 * hh * x1]], { col: C.red, w: 3.2 });
          if (x2 > 0) RR.inkLine([[hw, -hh], [hw - 2 * hw * x2, -hh + 2 * hh * x2]], { col: C.red, w: 3.2 });
          pop();
        }
        const b = Math.sin(Math.PI * seg(t, land, land + 0.2));
        RR.drawCube(s.x, s.y - 6, 42 * (1 + 0.2 * b), c.cube);
      }
    }
    // protection cubes in flight
    for (const role of ['fr', 'de']) {
      const h = HOPS[role], u = seg(t, h.t0, h.t0 + HOP_DUR, 'inOutQuad');
      if (u <= 0 || u >= 1) continue;
      const c = DEALT.find((d) => d.cube === role), s = cardAt(c, h.t0 + HOP_DUR);
      const p = RR.hop(protPos(h.i), [s.x, s.y - 6], u, 380);
      RR.drawCube(p[0], p[1], RR.lerp(38, 42, u) * (1 + 0.25 * Math.sin(Math.PI * u)), role, { rot: Math.sin(Math.PI * u) * 0.5 });
    }
    for (const role of ['fr', 'de']) {
      const c = DEALT.find((d) => d.cube === role), land = HOPS[role].t0 + HOP_DUR, s = cardAt(c, land);
      RR.sparkle(s.x, s.y - 6, t, land, { col: C[role], r: 80, dur: 0.6, seed: land });
    }
    // France: a quiet year
    for (let i = 0; i < 3; i++) {
      const z0 = 16.0 + i * 0.18, k = seg(t, z0, z0 + 0.8);
      if (k > 0 && k < 1) RR.text('z', 712 + k * 50 + i * 8 + Math.sin(k * 6) * 5, 918 - k * 80 - i * 6, { font: 'bold', size: 26 + i * 8, col: C.plumDark, alpha: Math.sin(Math.PI * k) });
    }
    // labels
    for (const [, txt, pos, t0] of LABELS) {
      const sc = RR.pop(t, t0, 0.35), a = 1 - seg(t, 18.85, 19.15);
      if (sc <= 0.01 || a <= 0) continue;
      const spr = labelSpr(txt);
      RR.drawSprite(spr, pos[0], pos[1], { w: spr.w * sc, h: spr.h * sc, alpha: a, rot: RR.hrange(txt.length, -0.03, 0.03) });
    }
    // new tokens fly from the cards onto the map
    for (const f of FLY) {
      const u = seg(t, f.t0, f.t1, 'inOutQuad');
      if (t < f.t0 - 0.12 || u >= 1) continue;
      const s = cardAt(DEALT[f.card], f.t0), from = [s.x, s.y + 50], to = f.to();
      const p = RR.hop(from, [to[0], to[1] - 4], u, f.h);
      const sc = t < f.t0 ? RR.pop(t, f.t0 - 0.12, 0.12) : 1 + 0.35 * Math.sin(Math.PI * u);
      RR.drawToken(p[0], p[1], 40 * sc, f.kind, { rot: u * Math.PI * 2 });
    }
    for (const f of FLY) RR.poof(f.to()[0], f.to()[1], t, f.t1, { r: 30, dur: 0.45 });
    // sparks: each new token nudges the tracker
    for (const [s0, s1, fi] of SPARKS) {
      const u = seg(t, s0, s1, 'inOutQuad');
      if (u <= 0 || u >= 1) continue;
      const a = FLY[fi].to(), b = B.track(Math.round(trackerAt(s1 - 0.01)));
      for (let k = 4; k >= 0; k--) {
        const uk = Math.max(0, u - k * 0.05);
        const p = RR.hop(a, b, uk, 180);
        RR.flatEllipse(p[0], p[1], 16 - k * 2.5, 16 - k * 2.5, k ? C.orange : '#fff1c4', 230 - k * 40);
      }
      const p = RR.hop(a, b, u, 180);
      glow(p[0], p[1], 18, C.orange, 0.7);
    }
  };

  // ---------------------------------------------------------------- the Raccoon cheers by the tracker
  const CHEER_X = -330, CHEER_Y = 1090, CHEER_S = 2.2;
  const drawCheer = (t) => {
    if (t < 18.95 || t > 22.35) return;
    let x = CHEER_X, y = CHEER_Y, air = 0;
    const p = RR.raccoonIdle(t, { face: 1, mouth: 'grin', brow: 'sly', tailUp: 0.9, tail: t * 4, armF: 0.5, armB: -0.4 });
    if (t < 19.45) { // hops in from the left
      const u = seg(t, 18.95, 19.45);
      const q = RR.hop([-1150, CHEER_Y], [CHEER_X, CHEER_Y], u, 280);
      x = q[0]; y = q[1]; air = CHEER_Y - y;
      Object.assign(p, { lean: 0.22, squash: -0.16, armF: 2.0, armB: -1.7, tailUp: 1, mouth: 'open', brow: 'up' });
    } else if (t < 20.0) { // lands, spots the glowing tracker, points
      p.squash = 0.28 * Math.exp(-(t - 19.45) * 9) * Math.cos((t - 19.45) * 22);
      const k = seg(t, 19.55, 19.7, 'outBack');
      p.armF = RR.lerp(0.5, 1.95, k); p.look = [1, -0.6]; p.headTilt = -0.08;
      p.mouth = t < 19.78 ? 'o' : 'grin'; p.brow = t < 19.78 ? 'up' : 'sly';
    } else if (t < 21.4) { // cackling jumps
      const j = [[20.05, 20.45], [20.6, 21.0]];
      for (const [a, b] of j) {
        const u = seg(t, a, b);
        if (u > 0 && u < 1) { air = Math.sin(Math.PI * u) * 95; p.squash = -0.14; }
        const l = t - b;
        if (l >= 0 && l < 0.3) p.squash = 0.24 * Math.exp(-l * 10);
        const pre = RR.env(t, a - 0.1, a, 0.08, 0.02);
        if (pre > 0) p.squash = 0.14 * pre;
      }
      y -= air;
      const fl = Math.sin(t * 22);
      Object.assign(p, { mouth: 'cackle', brow: 'sly', headTilt: -0.16 + 0.05 * fl, armF: 2.0 + 0.3 * fl, armB: -1.9 - 0.3 * fl, tailUp: 1, tail: t * 9 });
    } else { // scampers off left
      const k = seg(t, 21.4, 21.55);
      const r = Math.max(0, t - 21.55);
      x = CHEER_X - r * r * 700 - r * 900;
      Object.assign(p, { face: -1, squash: 0.12 * Math.sin(Math.PI * k), lean: 0.3 * k, mouth: 'grin', run: t * 18, stride: k, tail: t * 8, armF: 0.9, armB: -0.6 });
    }
    RR.shadow(x, CHEER_Y + 6, 62 * CHEER_S * (1 - air / 500), 12 * CHEER_S, 45 * (1 - air / 400));
    RR.drawRaccoon(x, y, CHEER_S, p);
    shadesOn(x, y, CHEER_S, p);
  };

  // ---------------------------------------------------------------- screen-space pieces
  const INSET = [1560, 500], INSET_W = 380;
  const insetK = (t) => seg(t, 8.5, 9.1, 'inOutCubic') * (1 - seg(t, 10.2, 10.75, 'inOutCubic'));
  const drawInset = (t, cam) => {
    const k = insetK(t);
    if (k <= 0) return;
    const from = RR.toScreen(cam, B.RULES);
    const x = RR.lerp(from[0], INSET[0], k), y = RR.lerp(from[1], INSET[1], k);
    const w = RR.lerp(170 * cam.z, INSET_W, k), s = w / 170;
    const rot = -0.03 * k + Math.sin(Math.PI * k) * 0.1;
    RR.drawCard('rules', x, y, { w, rot, lift: k });
    const h = seg(t, 9.15, 9.4) * (1 - seg(t, 10.05, 10.25));
    if (h > 0) {
      push(); translate(x, y); rotate(rot);
      for (const i of [0, 2]) RR.flat(RR.rrectPts(-78 * s, (13 + i * 34 - 16) * s, 158 * s, 32 * s, 6 * s), C.lilac, 170 * h);
      RR.flat(RR.rrectPts(-82 * s, 29 * s, 164 * s, 36 * s, 8 * s), C.orange, 80 * h);
      const pulse = 1 + 0.04 * Math.sin((t - 9.15) * 12) * h;
      RR.ink(RR.rrectPts(-84 * s * pulse, 27 * s * pulse, 168 * s * pulse, 40 * s * pulse, 9 * s), { stroke: RR.shade(C.orange, 0.75), w: 2.6, curve: 0.2 });
      pop();
      // arrow from the token on the orange square to the orange row
      const tok = RR.toScreen(cam, B.SQUARES[6].pos);
      const ca = Math.cos(rot), sa = Math.sin(rot), ex = -92 * s, ey = 47 * s;
      const q = [x + ex * ca - ey * sa, y + ex * sa + ey * ca];
      RR.arrow([tok[0] + 34, tok[1] + 10], q, seg(t, 9.3, 9.75, 'outCubic'), { col: C.ink, w: 2.6, bend: 0.22 });
    }
  };

  const drawClock = (t) => {
    const a = RR.pop(t, 0.1, 0.35) * (1 - seg(t, 2.15, 2.35, 'inBack'));
    if (a <= 0.01) return;
    const cx = 690, cy = 60, sz = 100 * a;
    const rattle = Math.sin(t * 60) * 0.07 * RR.env(t, 0.3, 2.1, 0.1, 0.2);
    push(); translate(cx, cy - Math.abs(Math.sin(t * 30)) * 4); rotate(rattle);
    RR.drawSprite(clockSpr(), 0, 0, { w: sz, h: sz * 150 / 140 });
    const fy = (84 - 75) * sz / 140, R = 42 * sz / 140;
    const m = (t - 0.1) * 26, hh = (t - 0.1) * 2.2 - 1.2;
    RR.inkLine([[0, fy], [Math.sin(hh) * R * 0.5, fy - Math.cos(hh) * R * 0.5]], { w: 1.6 });
    RR.inkLine([[0, fy], [Math.sin(m) * R * 0.8, fy - Math.cos(m) * R * 0.8]], { w: 1.1 });
    RR.flatEllipse(0, fy, 3, 3, C.ink);
    pop();
  };

  const spreadRaccoon = (t) => {
    if (t < 5.6 || t > 7.66) return;
    const X = 1480, S = 2.85;
    const y = RR.kf(t, [[5.6, 1950], [5.72, 1600, 'outCubic'], [5.84, 1610], [5.92, 1680, 'inOutQuad'], [6.2, 1085, 'outBack'], [7.28, 1085], [7.36, 1060, 'outQuad'], [7.66, 1950, 'inCubic']]);
    const p = RR.raccoonIdle(t, { face: -1, mouth: 'grin', brow: 'sly', tailUp: 0.9, tail: t * 5, armF: 0.4, armB: -0.3, look: [-0.4, 0] });
    let dy = 0;
    if (t < 5.92) { p.ear = Math.sin(t * 50) * 0.6; p.mouth = 'o'; }
    else if (t < 6.2) p.squash = -0.2;
    else p.squash += 0.14 * Math.exp(-(t - 6.2) * 9) * Math.cos((t - 6.2) * 30);
    if (t >= 6.25 && t < 6.95) { // "cool": pulls the shades down, peeks over them, flicks them back up
      p.armF = RR.kf(t, [[6.25, 0.4], [6.42, 3.4, 'outBack'], [6.5, 3.4], [6.62, 3.72], [6.78, 3.72], [6.86, 3.1, 'outQuad'], [6.95, 2.4]]);
      dy = RR.kf(t, [[6.5, 0], [6.62, 14, 'outQuad'], [6.8, 14], [6.87, 0, 'inQuad']]);
      if (t >= 6.55 && t < 6.85) {
        p.look = [0.1, -0.7]; p.mouth = 'smile'; p.headTilt = 0.12;
        p.brow = Math.floor((t - 6.55) / 0.07) % 2 ? 'up' : 'sly';
      }
    }
    if (t >= 6.95 && t < 7.34) { // cackles
      const fl = Math.sin(t * 40);
      Object.assign(p, { mouth: 'cackle', brow: 'sly', headTilt: -0.22 + 0.05 * fl, armF: 2.1 + 0.25 * fl, armB: -1.9 - 0.25 * fl, squash: 0.05 * fl, tail: t * 12, tailUp: 1 });
    }
    if (t >= 7.34) Object.assign(p, { mouth: 'grin', armF: 2.4, armB: -2.2, squash: -0.15, brow: 'up' });
    const jx = t >= 6.95 && t < 7.34 ? Math.sin(t * 55) * 4 : 0;
    RR.drawRaccoon(X + jx, y, S, p);
    shadesOn(X + jx, y, S, p, dy);
  };

  // ---------------------------------------------------------------- scene
  RR.scene({
    id: 's08_spread', order: 8, dur: 24, music: 'spread',
    cues: [
      [0.08, 'whoosh', 0.5], [0.15, 'tick', 0.5], [0.28, 'slide', 0.7], [0.5, 'pop', 0.7], [0.75, 'pop', 0.7], [0.8, 'tick', 0.6],
      [1.0, 'pop', 0.7], [1.05, 'tick', 0.6], [1.25, 'pop', 0.8], [1.3, 'tick', 0.6], [1.5, 'flip'], [2.0, 'tock'],
      [2.25, 'whoosh', 0.4], [2.82, 'slide'], [3.15, 'flip', 0.7], [3.36, 'thud', 0.7],
      [3.95, 'pop'], [4.15, 'pencil'], [4.3, 'tick', 0.4], [4.72, 'tock'], [4.97, 'stamp'], [5.0, 'buzz'],
      [5.55, 'whoosh'], [5.62, 'drumroll', 0.5], [5.95, 'boing'], [6.5, 'slide', 0.4], [6.86, 'pop', 0.5], [6.95, 'chitter'], [7.34, 'hop'],
      [7.45, 'whoosh', 0.6], [8.15, 'pencil'], [8.5, 'whoosh', 0.7], [9.15, 'sparkle'], [9.3, 'pencil'], [10.2, 'whoosh', 0.5],
      [10.9, 'deal'], [11.12, 'deal'], [11.34, 'deal'], [11.56, 'deal'], [11.78, 'deal'], [12.0, 'deal'],
      [13.0, 'hop'], [13.22, 'hop'], [13.5, 'tock'], [13.72, 'tock'], [14.05, 'slide'], [14.2, 'slide'],
      [15.65, 'flip'], [16.05, 'flip'], [16.45, 'boing', 0.6], [16.8, 'pop'], [16.95, 'flip'], [17.3, 'tick'], [17.35, 'flip'],
      [17.8, 'boing', 0.6], [18.15, 'pop'], [18.4, 'pop'], [18.62, 'tick'], [18.92, 'tick'],
      [18.95, 'hop'], [19.45, 'thud'], [19.6, 'chitter'], [20.05, 'hop', 0.6], [20.45, 'thud', 0.8], [20.6, 'chitter'], [21.0, 'thud', 0.8],
      [21.45, 'whoosh', 0.6], [22.0, 'whoosh'], [22.1, 'deal', 0.5], [22.3, 'deal', 0.5],
    ],
    draw(t) {
      let cam = RR.camKf(t, CAM_KEYS);
      const amt = Math.min(RR.clamp(t / 0.6), RR.clamp((23.6 - t) / 1.2));
      cam = RR.drift(cam, t, amt);
      for (const [t0, d, a] of SHAKES) { const s = RR.shake(t, t0, d, a); cam.x += s[0] / cam.z; cam.y += s[1] / cam.z; }

      setView(cam);
      RR.withCam(cam, () => {
        // static board (only the sections in view) + spread deck and rules card, as B.drawState draws them
        B.drawStatic({ only: Object.keys(B.SECTIONS).filter((n) => { const S = B.SECTIONS[n]; return !(S.x > VIEW[2] || S.x + S.w < VIEW[0] || S.y > VIEW[3] || S.y + S.h < VIEW[1]); }) });
        if (vis(B.DECK[0], B.DECK[1], 200)) RR.drawCard('back:spread', ...B.DECK, { w: 190 });
        if (insetK(t) <= 0 && vis(B.RULES[0], B.RULES[1], 200)) RR.drawCard('rules', ...B.RULES, { w: 170 });
        drawTrackerGlow(t);
        drawStory(t);
        drawProt(t);
        if (t > 8.0 && t < 10.6) { // the black token on the first orange square
          const sq = B.SQUARES[6].pos, k = RR.env(t, 8.1, 10.5, 0.3, 0.3);
          glow(sq[0], sq[1], 26, C.orange, k * (0.7 + 0.3 * Math.sin(t * 7)));
        }
        drawTokens(t);
        drawTracker(t);
        drawQueue(t);
        drawBurgers(t);
        drawMeter(t);
        if (t > 8.0 && t < 10.6) ringOn(B.SQUARES[6].pos[0], B.SQUARES[6].pos[1] - 4, 36, seg(t, 8.15, 8.45), { col: C.red, w: 2.6 });
        drawSpread(t);
        drawCheer(t);
      });

      drawInset(t, cam);
      RR.fadeScreen(0.3 * RR.env(t, 5.6, 7.55, 0.3, 0.3));
      spreadRaccoon(t);
      drawBanner(t, 5.55, 7.5);
      RR.caption('A few turns later...', t, 0.12, 2.3, { x: 1010, y: 60, size: 50 });
      RR.caption('Not enough votes?', t, 4.05, 5.85);
      RR.caption('More spread, more cards', t, 8.65, 10.45);
      RR.caption('Protection cancels a card', t, 13.45, 15.55);
      RR.caption('New raccoons: impact up', t, 16.85, 19.35);
      drawClock(t);
    },
  });
})();
