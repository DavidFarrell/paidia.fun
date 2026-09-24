// Scene 5 (56-66 s): rounds and the storyline. The five face-down Storyline Events get
// little calendar pages 1-5 (five rounds of five years). The first event lifts up to the
// camera and flips: CORPORATE RELIEF. It settles back into its slot and fires two grey
// corporate votes up to the queue, where they drop onto the two policies with the
// briefcase icon. Then the four players take their turns, clockwise around the table.

(() => {
  const BD = RR.board;
  const STORYCAM = RR.cam(1380, 1300, 1.0);   // hand-off from s04
  const STORY2 = RR.cam(1368, 1296, 1.03);    // slow push-in on the storyline row
  const QCAM3 = RR.cam(1576, 280, 1.2);       // the two corporate policies (cards stay lo-LOD below 1.21)
  const QCAM = RR.cam(1250, 330, 0.95);       // hand-off to s06

  // ---------------------------------------------------------------- timing (local s)
  const TB = [0.3, 0.6, 0.9, 1.2, 1.5];                 // calendar page i pops on
  const T_RAC = 1.72;                                    // the Raccoon pops up
  const T_ANT = 2.5, T_UP = 2.65, T_AT = 3.2;            // event card: crouch, lift, arrive
  const T_RING = 3.55;                                   // pencil loop round the rule
  const T_BACK = 4.95, T_LAND = 5.4;                     // fly home, land in slot 0
  const T_FIRE = 5.46;                                   // two corporate votes shoot out
  const T_TILT0 = 5.55, T_TILT1 = 6.55;                  // camera tilts up to the queue
  const DROPS = [{ id: 'wear', k: 4, land: 6.75, votes: ['hu'] }, { id: 'burgers', k: 2, land: 7.05, votes: [] }];
  const ANIM0 = 6.0, ANIM1 = 7.7;                        // corporate cards drawn by hand
  const T_Q0 = 7.3, T_Q1 = 9.5;                          // glide to QCAM
  const T_FIG = 7.25, T_TURN = [7.6, 8.1, 8.6, 9.1], T_FOUT = 9.3;
  const HOVER = [880, 430], HOVER_W = 840;               // event card close-up (screen)

  // ---------------------------------------------------------------- camera
  const camAt = (t) => {
    if (t <= 0) return STORYCAM;
    if (t >= T_Q1) return QCAM;
    let c;
    if (t < T_TILT0) c = RR.lerpCam(STORYCAM, STORY2, RR.seg(t, 0.2, 3.6, 'inOutSine'));
    else if (t < T_Q0) {
      const u = RR.seg(t, T_TILT0, T_TILT1, 'inOutCubic');
      c = RR.lerpCam(STORY2, QCAM3, u);
      c.z *= 1 - 0.16 * Math.sin(Math.PI * u);   // breathe out during the tilt
    } else c = RR.lerpCam(QCAM3, QCAM, RR.seg(t, T_Q0, T_Q1, 'inOutCubic'));
    return RR.drift(c, t, RR.clamp(t / 1.2) * RR.clamp((T_Q1 - t) / 1.2));
  };

  // ---------------------------------------------------------------- board state
  const stateAt = (t) => {
    const st = BD.clone(BD.SETUP);
    if (t >= T_LAND) st.story[0] = 'corprelief';
    else if (t >= T_ANT) st.story[0] = undefined;          // in the air (screen space)
    if (t >= ANIM0 && t < ANIM1) st.queue = st.queue.filter((c) => c.id !== 'wear' && c.id !== 'burgers');
    else if (t >= ANIM1) {
      st.queue.find((c) => c.id === 'burgers').votes = ['corp'];
      st.queue.find((c) => c.id === 'wear').votes = ['hu', 'corp'];
    }
    return st;
  };

  // Soft halo behind a card (a = 0..1).
  const halo = (x, y, w, h, col, a) => {
    if (a <= 0) return;
    for (let i = 3; i >= 1; i--) {
      const e = i * 9;
      RR.flat(RR.rrectPts(x - w / 2 - e, y - h / 2 - e, w + 2 * e, h + 2 * e, 16 + e, 3), col, 70 * a / i);
    }
  };

  // Squash-and-stretch hop at t0: crouch, jump, land.
  const hopAt = (t, t0, H = 22) => {
    const a = RR.seg(t, t0 - 0.1, t0), u = RR.seg(t, t0, t0 + 0.28), v = RR.seg(t, t0 + 0.28, t0 + 0.42);
    let dy = 0, sq = 0, lift = 0;
    if (t < t0) sq = 0.06 * a;
    else if (u < 1) { dy = -H * Math.sin(Math.PI * u); sq = -0.05 * Math.sin(Math.PI * u); lift = 0.5 * Math.sin(Math.PI * u); }
    else if (v < 1) sq = 0.06 * Math.sin(Math.PI * v);
    return { dy, sx: 1 + sq * 0.6, sy: 1 - sq, lift };
  };

  // ---------------------------------------------------------------- calendar pages 1-5
  const calSprite = (n) => RR.sprite('s05:cal:' + n, 100, 110, () => {
    const page = RR.rrectPts(8, 14, 84, 90, 10);
    RR.ink(page.map(([x, y]) => [x + 4, y + 5]), { fill: RR.C.ink, alpha: 60, stroke: false });
    RR.ink(page, { fill: RR.C.white, stroke: false, curve: 0.15 });
    RR.ink([[8, 44], [8, 24], [11, 17], [18, 14], [82, 14], [89, 17], [92, 24], [92, 44]], { fill: RR.C.rose, stroke: false, curve: 0.1 });
    RR.ink(page, { stroke: RR.C.ink, w: 0.9, curve: 0.15 });
    RR.inkLine([[10, 44], [90, 44]], { col: RR.C.ink, w: 0.6 });
    for (const x of [32, 68]) {
      RR.inkEllipse(x, 12, 5, 9, { stroke: RR.C.inkSoft, w: 0.9, fill: false });
      RR.flatEllipse(x, 22, 3.5, 3.5, RR.C.plumDark);
    }
    RR.text(String(n), 50, 94, { font: 'title', size: 52, col: RR.C.plumDark });
  }, { res: 2 });

  const drawCalendars = (t) => {
    for (let i = 0; i < 5; i++) {
      const k = RR.seg(t, TB[i], TB[i] + 0.42);
      if (k <= 0) continue;
      const [x, y] = BD.story(i);
      const e = RR.E.outBack(k);
      const by = RR.lerp(y - 60, y - 128, e);
      const rot = RR.hrange(i + 40, -0.07, 0.07) + (1 - k) * RR.hsign(i) * 0.3 + 0.02 * Math.sin(t * 2 + i);
      RR.drawSprite(calSprite(i + 1), x, by, { w: 92, h: 101, rot, sx: RR.lerp(0.7, 1, e), sy: RR.lerp(0.7, 1, e) });
    }
  };

  // ---------------------------------------------------------------- storyline row
  const drawStory = (t, st) => {
    for (let i = 0; i < 5; i++) {
      const id = st.story[i];
      if (id === undefined) continue;
      const [x, y] = BD.story(i);
      const h = hopAt(t, TB[i]);
      let { dy, sx, sy, lift } = h;
      if (i === 0 && t >= T_LAND) {
        const v = RR.seg(t, T_LAND, T_LAND + 0.22);
        if (v < 1) { sy = 1 - 0.08 * Math.sin(Math.PI * v); sx = 1 + 0.05 * Math.sin(Math.PI * v); }
        // it glows and swells as it fires the corporate votes
        const p = RR.seg(t, T_FIRE - 0.08, T_FIRE + 0.3);
        if (p > 0 && p < 1) { const b = Math.sin(Math.PI * p); sx *= 1 + 0.06 * b; sy *= 1 + 0.06 * b; }
        halo(x, y, 300, 170, RR.C.gold, RR.env(t, T_FIRE - 0.12, T_FIRE + 0.55, 0.1, 0.3));
      }
      push();
      translate(x, y + dy + 85 * (1 - sy));
      if (sx !== 1 || sy !== 1) scale(sx, sy);
      RR.drawCard(id || 'corprelief', 0, 0, { w: 300, flip: id ? 1 : 0, back: 'back:event', lift });
      pop();
    }
    RR.sparkle(700, 1395, t, T_FIRE - 0.04, { r: 150, n: 9, size: 16 });
  };

  // ---------------------------------------------------------------- event card close-up
  const cardHome = (cam) => { const p = RR.toScreen(cam, BD.story(0)); return { x: p[0], y: p[1], w: 300 * cam.z, rot: cam.r || 0 }; };
  const hoverAt = (t) => ({ x: HOVER[0] + 3 * Math.sin((t - T_AT) * 1.7), y: HOVER[1] + 6 * Math.sin((t - T_AT) * 2.8), w: HOVER_W, rot: 0.012 * Math.sin((t - T_AT) * 2.1) });
  const flyCard = (t, cam) => {
    if (t < T_ANT || t >= T_LAND) return null;
    const home = cardHome(cam);
    if (t < T_UP) { // crouch and shiver
      const a = RR.seg(t, T_ANT, T_UP);
      return { ...home, x: home.x + Math.sin(t * 95) * 2.5 * a, y: home.y + home.w * 0.02 * a, sx: 1 + 0.04 * a, sy: 1 - 0.07 * a, flip: 0, lift: 0 };
    }
    if (t < T_BACK) {
      const H = hoverAt(t);
      const p = RR.seg(t, T_UP, T_AT), pe = RR.E.outCubic(p);
      return {
        x: RR.lerp(home.x, H.x, pe), y: RR.lerp(home.y, H.y, pe) - 60 * Math.sin(Math.PI * p),
        w: RR.lerp(home.w, H.w, RR.E.outBack(p)), rot: RR.lerp(home.rot, H.rot, pe) - 0.12 * Math.sin(Math.PI * p),
        sx: 1, sy: 1 + 0.06 * Math.sin(Math.PI * Math.min(1, p * 2)),
        flip: RR.seg(t, T_UP + 0.04, T_UP + 0.42, 'inOutSine'), lift: RR.seg(t, T_UP, T_UP + 0.2),
      };
    }
    const H0 = hoverAt(T_BACK);
    const r = RR.seg(t, T_BACK, T_LAND), e = RR.E.inOutCubic(r);
    return {
      x: RR.lerp(H0.x, home.x, e), y: RR.lerp(H0.y, home.y, e) - 50 * Math.sin(Math.PI * r),
      w: RR.lerp(H0.w, home.w, e), rot: RR.lerp(H0.rot, home.rot, e) + 0.1 * Math.sin(Math.PI * r),
      sx: 1, sy: 1, flip: 1, lift: 1 - RR.seg(r, 0.75, 1),
    };
  };
  // card-local point (300 x 170 units) to screen
  const cardPt = (fc, lx, ly) => {
    const k = (fc.w * (1 + fc.lift * 0.06)) / 300;
    const dx = (lx - 150) * k * fc.sx, dy = (ly - 85) * k * fc.sy;
    const c = Math.cos(fc.rot), s = Math.sin(fc.rot);
    return [fc.x + dx * c - dy * s, fc.y + dx * s + dy * c];
  };
  const drawFlyCard = (t, fc) => {
    push();
    translate(fc.x, fc.y);
    rotate(fc.rot);
    scale(fc.sx, fc.sy);
    RR.drawCard('corprelief', 0, 0, { w: fc.w, flip: fc.flip, lift: fc.lift });
    pop();
    // pencil loop round the ongoing rule
    const u = RR.seg(t, T_RING, T_RING + 0.4, 'inOutSine');
    if (u > 0 && t < T_BACK) {
      const N = 34, pts = [];
      for (let i = 0; i <= Math.floor(N * u); i++) {
        const s = i / N, a = -2.0 + s * Math.PI * 2.22;
        const r = 1 + 0.03 * Math.sin(s * 11);
        pts.push(cardPt(fc, 150 + Math.cos(a) * 166 * r, 141 + Math.sin(a) * 30 * r + s * 4));
      }
      if (pts.length > 1) RR.inkLine(pts, { col: RR.C.red, w: 1.7, curve: 0.5 });
    }
  };

  // ---------------------------------------------------------------- corporate votes
  // Two grey cubes shoot up out of the event card (world space)...
  const drawFire = (t, cam) => {
    DROPS.forEach((g, j) => {
      const t0 = T_FIRE + j * 0.07;
      if (t < t0 || t > t0 + 0.75) return;
      const s = RR.pop(t, t0, 0.2);
      const r = RR.seg(t, t0 + 0.1, t0 + 0.6, 'inQuad');
      const x = 700 + (j ? 55 : -55) + (j ? 230 : 110) * RR.seg(t, t0, t0 + 0.6);
      const y = 1380 - 80 * RR.E.outCubic(RR.seg(t, t0, t0 + 0.16)) - 1700 * r;
      if (RR.toScreen(cam, [x, y])[1] < -80) return;
      RR.drawCube(x, y, 50 * s, 'corp', { shadow: false, rot: (t - t0) * 9 * (j ? 1 : -1) });
    });
  };
  // ...then drop onto the policies with the briefcase icon.
  const drawDrops = (t) => {
    DROPS.forEach((g, j) => {
      const [x, y] = BD.slot(g.k);
      const tl = g.land, tg = tl - 0.45;
      halo(x, y, 190, 265, RR.C.teal, RR.env(t, tg, tl + 0.55, 0.15, 0.3));
      RR.drawCard(g.id, x, y, { w: 190, flip: 1 });
      // briefcase icon: glow and pop
      const ix = x - 69, iy = 331.5;
      const bk = RR.seg(t, tg, tg + 0.3), bo = RR.seg(t, tl + 0.2, tl + 0.55);
      if (bk > 0 && bo < 1) {
        const k = 1 + 1.1 * RR.E.outBack(bk) * (1 - RR.E.inOutCubic(bo));
        const pulse = 1 + 0.12 * Math.sin((t - tg) * 16);
        RR.flatEllipse(ix, iy, 22 * k * pulse, 22 * k * pulse, RR.C.teal, 90 * (1 - bo));
        RR.flatEllipse(ix, iy, 16 * k, 16 * k, '#bfe6df', 110 * (1 - bo));
        RR.icon('briefcase', ix, iy, 37 * k, {}, { alpha: 1 - bo * bo });
      }
      RR.sparkle(ix, iy, t, tg, { col: RR.C.teal, r: 56, n: 6, size: 12, seed: j * 9 });
      // cubes: the hunter cube on WEAR THEM shuffles over to make room
      const ty = y + 38;
      if (g.votes.length) {
        const sl = RR.E.outBack(RR.seg(t, tl - 0.02, tl + 0.2));
        const hop = 8 * Math.sin(Math.PI * RR.seg(t, tl - 0.02, tl + 0.2));
        RR.drawCube(x - 18.4 * sl, ty - hop, 32, g.votes[0]);
      }
      const cx = g.votes.length ? x + 18.4 : x;
      const f = RR.seg(t, tl - 0.3, tl, 'inQuad');
      if (f <= 0) return;
      if (f < 1) {
        const yy = RR.lerp(-330, ty, f);
        RR.shadow(cx + 2, ty + 14, 17 * f, 5 * f, 45 * f);
        RR.drawCube(cx + (1 - f) * (j ? 30 : -30), yy, 32, 'corp', { shadow: false, rot: (1 - f) * 2.4 * (j ? -1 : 1) });
      } else {
        const v = t - tl;
        const sq = v < 0.5 ? 0.3 * Math.exp(-v * 12) * Math.cos(v * 28) : 0;
        const bounce = 9 * Math.max(0, Math.sin(Math.PI * RR.seg(v, 0.1, 0.3)));
        RR.drawCube(cx, ty + 16 * sq - bounce, 32, 'corp', { sx: 1 + sq * 0.6, sy: 1 - sq });
      }
    });
  };

  // ---------------------------------------------------------------- the Raccoon (world)
  const RAC = [2190, 1800], RS = 1.2;
  const racPose = (t) => {
    const p = RR.raccoonIdle(t, { face: -1, look: [1, -0.25], mouth: 'smile', brow: 'neutral', armF: 0.35, armB: 0.25, tailUp: 0.6 });
    const up = RR.seg(t, T_RAC, T_RAC + 0.36);
    if (up < 1) Object.assign(p, { squash: -0.2 * (1 - up), eyes: 'wide', mouth: 'grin', brow: 'up', armF: 2.5, armB: 2.3, tailUp: 1 });
    else if (t < 2.5) { // lands, grins at us, lowers the paws
      const k = RR.seg(t, T_RAC + 0.36, 2.4, 'outCubic');
      const land = RR.seg(t, T_RAC + 0.36, T_RAC + 0.58);
      Object.assign(p, { squash: 0.18 * Math.sin(Math.PI * land), armF: RR.lerp(2.5, 0.35, k), armB: RR.lerp(2.3, 0.25, k), mouth: 'grin', look: [0.15, 0.05], brow: 'sly' });
    }
    if (t >= 2.5 && t < T_UP) Object.assign(p, { look: [1, -0.05], headTilt: -0.08, ear: 1 });
    if (t >= T_UP && t < T_AT + 0.3) { // it flies up: awe
      const k = RR.seg(t, T_UP, T_UP + 0.25, 'outCubic');
      Object.assign(p, { look: [0.7, -1], eyes: 'wide', mouth: 'o', brow: 'up', lean: -0.12 * k, headTilt: 0.16 * k, armF: RR.lerp(0.35, 1.3, k), armB: RR.lerp(0.25, 0.9, k), ear: 1, blink: 0 });
    }
    if (t >= T_AT + 0.3 && t < 3.9) Object.assign(p, { look: [0.8, -0.8], mouth: 'flat', headTilt: 0.12, lean: -0.05 });
    if (t >= 3.9 && t < T_BACK) { // "it changes the rules": sly grin, rubbing paws
      const r = Math.sin(t * 40);
      Object.assign(p, { look: [0.25, -0.35], mouth: 'grin', brow: 'sly', headTilt: 0.06, armF: 2.05 + 0.18 * r, armB: 1.85 - 0.18 * r, lean: 0.05, squash: 0.03 * r });
      if (t > 4.3 && t < 4.62) p.eyes = 'happy';
    }
    if (t >= T_BACK && t < T_FIRE) Object.assign(p, { look: [1, 0.2], mouth: 'o', brow: 'up', headTilt: -0.05 });
    if (t >= T_FIRE) {
      const k = RR.seg(t, T_FIRE, T_FIRE + 0.2, 'outBack');
      Object.assign(p, { look: [0.6, -1], eyes: 'wide', mouth: 'open', brow: 'up', headTilt: 0.18 * k, armF: RR.lerp(0.35, 2.2, k), armB: RR.lerp(0.25, 2.0, k), ear: -1, squash: -0.1 * k, blink: 0 });
    }
    return p;
  };
  const drawRac = (t, cam) => {
    if (t < T_RAC || t > 6.6) return;
    if (RR.toScreen(cam, [RAC[0], RAC[1] - 260])[1] > RR.H + 20) return;
    const up = RR.seg(t, T_RAC, T_RAC + 0.36);
    const y = RAC[1] + (1 - RR.E.outBack(up)) * 330;
    if (up >= 1) RR.shadow(RAC[0], RAC[1] + 4, 66, 13, 45);
    RR.drawRaccoon(RAC[0], y, RS, racPose(t));
  };

  // ---------------------------------------------------------------- turn order (screen)
  const FIGS = [
    { role: 'de', n: 1, x: 190, y: 238, dir: -1, look: [1, 0.6], turn: 0.35 },
    { role: 'fr', n: 2, x: 1730, y: 238, dir: -1, look: [-1, 0.6], turn: -0.35 },
    { role: 'ar', n: 3, x: 1730, y: 978, dir: 1, look: [-1, -0.4], turn: -0.35 },
    { role: 'hu', n: 4, x: 190, y: 978, dir: 1, look: [1, -0.4], turn: 0.35 },
  ];
  const FIG_W = 190, FIG_H = 238;
  const ARROWS = [[[305, 122], [1610, 122], -0.04], [[1805, 280], [1768, 772], -0.07], [[1600, 858], [310, 858], -0.03]];
  const figSprite = (f, mood) => RR.sprite(`s05:fig:${f.role}:${mood}`, 200, 250, () => {
    const pose = mood === 'go'
      ? { eyes: 'happy', mouth: 'grin', brow: 'up', armR: 2.75, armL: 0.55, blush: 1 }
      : { turn: f.turn, look: f.look, eyes: mood === 'blink' ? 'closed' : 'open', mouth: 'smile', armL: 0.15, armR: 0.15 };
    RR.drawPerson(f.role, 100, 238, 0.66, pose);
    RR.inkCircle(32, 150, 22, { fill: RR.C[f.role], stroke: RR.C.ink, w: 0.9 });
    RR.text(String(f.n), 32, 162, { font: 'title', size: 34, col: RR.C.white });
  }, { res: 1.5 });

  const quad = (p, m, q, s) => [(1 - s) * (1 - s) * p[0] + 2 * (1 - s) * s * m[0] + s * s * q[0], (1 - s) * (1 - s) * p[1] + 2 * (1 - s) * s * m[1] + s * s * q[1]];
  const sweepArrow = (p, q, bend, u0, u1) => {
    const m = [(p[0] + q[0]) / 2 - (q[1] - p[1]) * bend, (p[1] + q[1]) / 2 + (q[0] - p[0]) * bend];
    const N = 18, pts = [];
    for (let i = 0; i <= N; i++) pts.push(quad(p, m, q, u0 + ((u1 - u0) * i) / N));
    RR.inkLine(pts, { col: RR.C.ink, w: 4.2, curve: 0.5 });
    RR.inkLine(pts, { col: RR.C.gold, w: 2.8, curve: 0.5 });
    const e = pts[N], d = quad(p, m, q, Math.max(0, u1 - 0.03));
    const a = Math.atan2(e[1] - d[1], e[0] - d[0]), L = 44;
    RR.ink([[e[0] + Math.cos(a) * 10, e[1] + Math.sin(a) * 10], [e[0] - Math.cos(a - 0.5) * L, e[1] - Math.sin(a - 0.5) * L], [e[0] - Math.cos(a) * L * 0.6, e[1] - Math.sin(a) * L * 0.6], [e[0] - Math.cos(a + 0.5) * L, e[1] - Math.sin(a + 0.5) * L]], { fill: RR.C.gold, stroke: RR.C.ink, w: 0.9, curve: 0.05 });
  };

  const drawTurns = (t) => {
    if (t < T_FIG || t > T_FOUT + 0.5) return;
    ARROWS.forEach(([p, q, bend], i) => {
      const u1 = RR.seg(t, T_TURN[i] + 0.12, T_TURN[i + 1] - 0.06, 'inOutSine');
      const u0 = RR.seg(t, 9.2 + i * 0.03, 9.45 + i * 0.03, 'inOutSine');
      if (u1 > u0 + 0.02) sweepArrow(p, q, bend, u0, u1);
    });
    FIGS.forEach((f, i) => {
      const tin = T_FIG + i * 0.08, tout = T_FOUT + i * 0.04;
      const kin = RR.E.outBack(RR.seg(t, tin, tin + 0.35)), kout = RR.E.inBack(RR.seg(t, tout, tout + 0.25));
      if (kin <= 0 || kout >= 1) return;
      const off = f.dir * 300 * (1 - kin + kout);
      const ta = T_TURN[i];
      const h = hopAt(t, ta, 34);
      const g = RR.env(t, ta - 0.05, ta + 0.65, 0.1, 0.3);
      if (g > 0) for (let r = 3; r >= 1; r--) RR.flatEllipse(f.x, f.y + off, 34 + r * 16, 10 + r * 5, RR.C.gold, 70 * g);
      RR.shadow(f.x, f.y + 2 + off, 50, 10, 40);
      const mood = t >= ta - 0.02 && t < ta + 0.6 ? 'go' : RR.blinkAt(t, 2.2 + i * 0.37, i * 0.9) > 0.5 ? 'blink' : 'idle';
      RR.drawSprite(figSprite(f, mood), f.x, f.y + h.dy + off, { w: FIG_W, h: FIG_H, ax: 0.5, ay: 238 / 250, sx: h.sx, sy: h.sy });
    });
  };

  // ---------------------------------------------------------------- scene
  RR.scene({
    id: 's05_rounds', order: 5, dur: 10, music: 'rounds',
    cues: [
      [0.3, 'tick'], [0.5, 'paper', 0.6], [0.6, 'tick'], [0.9, 'tick'], [1.2, 'tick'], [1.5, 'tick'],
      [1.72, 'boing', 0.7], [1.95, 'chitter', 0.6],
      [2.5, 'rattle', 0.35], [2.65, 'whoosh', 0.7], [2.85, 'flip'], [3.2, 'ding', 0.5],
      [3.55, 'pencil'], [3.95, 'chitter', 0.7],
      [4.95, 'whoosh', 0.5], [5.4, 'deal'], [5.46, 'pop'], [5.48, 'sparkle', 0.5], [5.6, 'whoosh', 0.8],
      [6.3, 'sparkle', 0.4], [6.6, 'sparkle', 0.4], [6.75, 'tock'], [7.05, 'tock'],
      [7.25, 'pop', 0.6], [7.6, 'hop'], [7.75, 'brush', 0.5], [8.1, 'hop'], [8.25, 'brush', 0.5],
      [8.6, 'hop'], [8.75, 'brush', 0.5], [9.1, 'hop'], [9.3, 'whoosh', 0.4],
    ],
    draw(t) {
      const cam = camAt(t);
      const st = stateAt(t);
      RR.withCam(cam, () => {
        BD.drawState(st, { skip: { story: true } });
        drawCalendars(t);
        drawStory(t, st);
        if (t >= ANIM0 && t < ANIM1) drawDrops(t);
        drawFire(t, cam);
      });

      // Beat 1: five rounds
      RR.banner('5 ROUNDS', t, 0.45, 2.55, { y: 862, size: 100, sub: '5 years each' });

      // Beat 2: the Storyline Event close-up
      const dim = RR.env(t, T_UP, T_LAND - 0.05, 0.4, 0.45);
      if (dim > 0) RR.fadeScreen(dim * 0.5);
      RR.withCam(cam, () => drawRac(t, cam));
      const fc = flyCard(t, cam);
      if (fc) drawFlyCard(t, fc);
      RR.caption('Each round starts with a Storyline Event', t, 3.0, 5.0);
      RR.caption('It changes the rules', t, 3.6, 5.2, { x: 1655, y: 665, size: 50 });

      // Beat 4: turn order
      drawTurns(t);
      RR.caption('Then everyone takes a turn', t, 7.5, 9.45, { y: 985 });
    },
  });
})();
