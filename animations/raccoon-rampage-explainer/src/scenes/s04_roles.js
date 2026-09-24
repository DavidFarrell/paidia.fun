// Scene 4 (36-56 s): Meet the roles. The four players pop up in front of the board and wave,
// then each gets a vignette (name plate, agenda line, influence cubes and a little score strip)
// while the camera visits what they care about: Germany, France, the paw policy, the crosshair
// policy and the hunter die. They all duck out as the camera glides down to the storyline row.
//
// Tokens taken off the map during a vignette are quietly put back while that part of the map is
// off screen, so the scene ends on the untouched SETUP state.

(() => {
  const B = RR.board;
  const PI = Math.PI;

  // ------------------------------------------------------------ cameras
  const FULL = RR.cam(1200, 750, 0.66);
  const STORY = RR.cam(1380, 1300, 1.0);
  const DECAM = RR.cam(1014, 756, 2.0);   // Germany, right of the player
  const FRCAM = RR.cam(967, 872, 1.8);    // France
  const ARCAM = RR.cam(1353, 279, 1.3);   // queue: NO MORE PETS (paw)
  const HUQ = RR.cam(1565, 279, 1.3);     // queue: RACCOON BURGERS (crosshair)
  const HUM = RR.cam(940, 712, 1.5);      // map: Benelux and Germany
  const zin = (c, k) => ({ ...c, z: c.z * k });
  const CAM_KEYS = [
    [0, FULL], [1.15, zin(FULL, 1.02), 'inOutSine'], [2.3, DECAM], [5.45, zin(DECAM, 1.04), 'linear'],
    [6.4, FRCAM], [9.95, zin(FRCAM, 1.04), 'linear'], [11.0, ARCAM], [14.5, zin(ARCAM, 1.03), 'linear'],
    [15.3, HUQ], [16.3, zin(HUQ, 1.02), 'linear'], [17.0, HUM], [19.0, zin(HUM, 1.03), 'linear'], [20.0, STORY],
  ];

  // ------------------------------------------------------------ layout (screen space)
  const GROUND = 1150, S_BIG = 2.3;           // vignette player: feet just below the frame
  const ROW_Y = 1125, S_ROW = 1.5;            // line-up at the start and the end
  const ROW_X = { de: 300, fr: 740, ar: 1180, hu: 1620 };
  const OUT_X = { hu: 300, ar: 740, fr: 1180, de: 1620 };
  const OUT_IN = { hu: 18.9, ar: 18.75, fr: 18.82, de: 18.89 };
  const OUT_OFF = { hu: 19.36, ar: 19.40, fr: 19.44, de: 19.48 };
  const INFO = {
    de: { name: 'GERMAN ENVIRONMENTAL AGENCY', line: 'Limit the damage in Germany', inf: 3, label: [1.75, 5.3], strip: [800, 992], stripIn: 2.05 },
    fr: { name: 'FRENCH ENVIRONMENTAL AGENCY', line: "Keep France's raccoons down", inf: 3, label: [6.0, 9.75], strip: [905, 992], stripIn: 6.3 },
    ar: { name: 'ANIMAL RIGHTS ACTIVIST', line: 'Humane policies score', inf: 1, label: [10.55, 14.3], strip: [1010, 992], stripIn: 10.85 },
    hu: { name: 'HUNTING LOBBYIST', line: 'Hunter policies score', inf: 1, label: [14.9, 18.75], strip: [800, 992], stripIn: 15.2 },
  };

  // ------------------------------------------------------------ small helpers
  const bump = (t, t0, dur) => Math.sin(PI * RR.seg(t, t0, t0 + dur));
  // Pop up from below the frame at tIn, duck back down at tOut. Returns {dy, sq} or null when hidden.
  const popIO = (t, tIn, tOut, depth = 820) => {
    if (t < tIn || (tOut !== undefined && t > tOut + 0.26)) return null;
    const k = RR.seg(t, tIn, tIn + 0.42);
    let dy = (1 - RR.E.outBack(k)) * depth;
    let sq = -0.14 * bump(t, tIn, 0.3) + 0.1 * bump(t, tIn + 0.3, 0.22);
    if (tOut !== undefined && t > tOut - 0.12) {
      sq += 0.12 * bump(t, tOut - 0.12, 0.2);
      dy += RR.seg(t, tOut, tOut + 0.26, 'inBack') * depth;
      sq -= 0.1 * RR.seg(t, tOut + 0.05, tOut + 0.2);
    }
    return { dy, sq };
  };
  // Person-local point -> screen (mirrors the transform in RR.drawPerson).
  const pxf = (x, y, s, p, [lx, ly]) => {
    const sq = p.squash ?? 0, a = p.lean ?? 0;
    const u = lx * s * (1 + sq * 0.5), v = ly * s * (1 - sq * 0.5);
    return [x + u * Math.cos(a) - v * Math.sin(a), y - (p.hop ?? 0) + u * Math.sin(a) + v * Math.cos(a)];
  };
  // Screen point -> person-local (inverse of pxf).
  const pinv = (x, y, s, p, [sx0, sy0]) => {
    const sq = p.squash ?? 0, a = -(p.lean ?? 0);
    const dx = sx0 - x, dy = sy0 - (y - (p.hop ?? 0));
    const u = dx * Math.cos(a) - dy * Math.sin(a), v = dx * Math.sin(a) + dy * Math.cos(a);
    return [u / (s * (1 + sq * 0.5)), v / (s * (1 - sq * 0.5))];
  };
  // Raccoon-local point -> screen (mirrors RR.drawRaccoon).
  const rxf = (x, y, s, p, [lx, ly]) => {
    const f = p.face ?? 1, sq = p.squash ?? 0, a = (p.lean ?? 0) * f;
    const u = lx * s * (1 + sq * 0.6) * f, v = ly * s * (1 - sq * 0.6);
    return [x + u * Math.cos(a) - v * Math.sin(a), y + u * Math.sin(a) + v * Math.cos(a)];
  };
  const rot = (th, [x, y]) => [x * Math.cos(th) - y * Math.sin(th), x * Math.sin(th) + y * Math.cos(th)];
  const add = (p, q) => [p[0] + q[0], p[1] + q[1]];
  // Hand at the end of a straight arm hanging at angle a (0 down, PI up), like RR.drawPerson.
  const handAt = (side, a) => [side * 44 + side * Math.sin(a) * 62, -142 + Math.cos(a) * 62];
  const offBottom = (y, dy, s) => y + dy - 300 * s > RR.H + 10;

  // ------------------------------------------------------------ painted overlays (cached)
  const TITLE = 70;
  const nameW = (r) => RR.textWidth(INFO[r].name, { font: 'title', size: TITLE });
  const ribbonW = (r) => Math.ceil(nameW(r) + 124);
  const ribbon = (r) => {
    const W = ribbonW(r), H = 108;
    return RR.sprite('s04:ribbon:' + r, W, H, () => {
      const top = [], bot = [];
      const n = 12;
      for (let i = 0; i <= n; i++) {
        const x = 4 + ((W - 40) * i) / n;
        top.push([x, 12 + RR.hrange(i + 11, -3, 3)]);
        bot.unshift([x, H - 12 + RR.hrange(i + 31, -3, 3)]);
      }
      const pts = [...top, [W - 4, 8], [W - 30, H / 2], [W - 4, H - 8], ...bot];
      RR.water(pts, RR.C[r], { layers: 10, alpha: 75, spread: 0.008, edge: 0.6 });
      RR.ink(pts, { stroke: RR.C.ink, w: 1.1, curve: 0.06 });
      RR.text(INFO[r].name, 66, H / 2 + 2, { font: 'title', size: TITLE, col: RR.C.white, outline: RR.C.plumDark, outlineW: 5, align: 'left', valign: 'middle', shadow: true });
    }, { res: 1 });
  };
  const medal = (r) => RR.sprite('s04:medal:' + r, 150, 150, () => {
    RR.flat(RR.ellipsePts(79, 81, 64, 64, 30), RR.C.ink, 45);
    RR.ink(RR.ellipsePts(75, 75, 64, 64, 30), { fill: RR.C.white, w: 1.3, curve: 0.5 });
    RR.inkCircle(75, 75, 55, { stroke: RR.C[r], w: 2.6 });
    push(); translate(75, 75); RR.ICONS.role(42, { role: r }); pop();
  }, { res: 1.4 });
  const AG = 54;
  const agenda = (r) => {
    const tw = RR.textWidth(INFO[r].line, { font: 'hand', size: AG });
    const W = Math.ceil(tw + 80), H = 96;
    return RR.sprite('s04:agenda:' + r, W, H, () => {
      const pts = [];
      for (let i = 0; i <= 10; i++) pts.push([8 + ((W - 22) * i) / 10, 12 + RR.hrange(i + 5, -3, 3)]);
      for (let i = 10; i >= 0; i--) pts.push([8 + ((W - 22) * i) / 10, H - 20 + RR.hrange(i + 55, -3, 3)]);
      RR.flat(pts.map(([x, y]) => [x + 5, y + 6]), RR.C.ink, 45);
      RR.ink(pts, { fill: RR.C.white, w: 0.9, curve: 0.1 });
      RR.text(INFO[r].line, (W - 6) / 2, (H - 8) / 2, { font: 'hand', size: AG, col: RR.C.ink, valign: 'middle' });
    }, { res: 1.2 });
  };
  const BADGE_W = 320, BADGE_H = 220;
  const badge = () => RR.sprite('s04:badge', BADGE_W, BADGE_H, (W, H) => {
    const pts = RR.rrectPts(8, 8, W - 20, H - 20, 26);
    RR.flat(pts.map(([x, y]) => [x + 6, y + 7]), RR.C.ink, 45);
    RR.ink(pts, { fill: RR.C.white, w: 1.1, curve: 0.15 });
    RR.text('INFLUENCE', (W - 12) / 2, 68, { font: 'title', size: 52, col: RR.C.plum });
    RR.text('votes per turn', (W - 12) / 2, 186, { font: 'hand', size: 48, col: RR.C.inkSoft });
  }, { res: 1.2 });
  const STRIP_W = 380, STRIP_H = 116;
  const strip = (r) => RR.sprite('s04:strip:' + r, STRIP_W, STRIP_H, (W, H) => {
    const pts = RR.rrectPts(8, 8, W - 20, H - 20, 24);
    RR.flat(pts.map(([x, y]) => [x + 5, y + 6]), RR.C.ink, 45);
    RR.ink(pts, { fill: RR.C.card, w: 1.1, curve: 0.15 });
    RR.ink(RR.rrectPts(16, 16, W - 36, H - 36, 18), { stroke: RR.C[r], w: 2.2, curve: 0.15 });
    push(); translate(62, (H - 12) / 2); RR.ICONS.star(27); pop();
    for (let i = 0; i < 4; i++) RR.inkCircle(128 + i * 64, (H - 12) / 2, 25, { fill: RR.C.paperShade, stroke: RR.C.mauve, w: 0.6 });
  }, { res: 1.3 });
  const slotPos = (r, i, dy = 0) => { const [cx, cy] = INFO[r].strip; return [cx - STRIP_W / 2 + 128 + i * 64, cy - STRIP_H / 2 + (STRIP_H - 12) / 2 + dy]; };
  const ring = (r) => RR.sprite('s04:ring:' + r, 140, 140, () => {
    RR.inkCircle(70, 70, 52, { stroke: RR.C.white, w: 4 });
    RR.inkCircle(70, 70, 52, { stroke: RR.C[r + 'Dark'], w: 2.2 });
  }, { res: 1.5 });
  const bino = () => RR.sprite('s04:bino', 470, 270, () => {
    const c1 = [145, 135], c2 = [325, 135], R = 120;
    const pts = [];
    for (let i = 0; i < 90; i++) {
      const a = (i / 90) * PI * 2;
      for (const [c, o] of [[c1, c2], [c2, c1]]) {
        const p = [c[0] + Math.cos(a) * R, c[1] + Math.sin(a) * R];
        if (RR.dist(p, o) >= R - 0.5) pts.push(p);
      }
    }
    pts.sort((p, q) => Math.atan2(p[1] - 135, p[0] - 235) - Math.atan2(q[1] - 135, q[0] - 235));
    RR.water(pts, '#fffbe8', { layers: 4, alpha: 16, spread: 0.006, edge: 0 });
    RR.ink(pts, { stroke: RR.C.white, w: 4.5, curve: 0.3 });
    RR.ink(pts, { stroke: RR.C.ink, w: 2.2, curve: 0.3 });
    RR.inkLine([[235, 20], [235, 60]], { col: RR.C.ink, w: 1 });
    RR.inkLine([[235, 210], [235, 250]], { col: RR.C.ink, w: 1 });
  }, { res: 1 });

  // ------------------------------------------------------------ board (world space)
  const TOK = 40;
  // Removal windows [gone, back] for tokens that leave the map; they return while off screen.
  const GONE = { de: { 9: [3.95, 10.9] }, fr: { 2: [7.33, 10.9], 1: [7.40, 10.9] }, roe: { 1: [18.0, 19.86] } };
  const gone = (kind, i, t) => { const g = GONE[kind][i]; return g && t >= g[0] && t < g[1]; };
  const tokenPos = (kind, i) => (kind === 'roe' ? B.SQUARES[i].pos : B.SPOTS[kind][i]);
  const drawMapTokens = (t) => {
    const n = B.SETUP.tokens;
    for (let i = 0; i < n.de; i++) {
      if (gone('de', i, t)) continue;
      const [x, y] = tokenPos('de', i);
      // "here to stay": the German raccoons bounce happily while the agency looks on
      let hop = 0;
      for (const t0 of [2.35, 2.8]) hop += bump(t, t0 + RR.hr(i + 3) * 0.2, 0.3) * 12;
      RR.drawToken(x, y - TOK * 0.1 - hop, TOK, 'yellow');
    }
    for (let i = 0; i < n.fr; i++) {
      if (gone('fr', i, t)) continue;
      const [x, y] = tokenPos('fr', i);
      const jit = RR.env(t, 6.45, 7.35, 0.1, 0.05) * 2.4;
      RR.drawToken(x + Math.sin(t * 57 + i * 2) * jit, y - TOK * 0.1, TOK, 'blue');
    }
    for (let i = 0; i < n.roe; i++) {
      if (gone('roe', i, t)) continue;
      const [x, y] = tokenPos('roe', i);
      const jit = i === 1 ? RR.env(t, 17.8, 18.0, 0.05, 0.02) * 3 : 0;
      RR.drawToken(x + Math.sin(t * 61) * jit, y - TOK * 0.1, TOK, 'black');
    }
  };
  const starOf = (k) => add(B.slot(k), [69, 106.5]); // scoring star on a policy card in slot k
  const highlight = (t) => {
    if (t > 12.55 && t < 14.8) return { k: 3, role: 'ar', a: RR.env(t, 12.6, 14.8, 0.3, 0.3) };
    if (t > 15.8 && t < 17.2) return { k: 2, role: 'hu', a: RR.env(t, 15.85, 17.2, 0.25, 0.35) };
    return null;
  };
  const drawBoard = (t) => {
    const hl = highlight(t);
    const st = hl ? { ...B.SETUP, queue: B.SETUP.queue.filter((c) => c.k !== hl.k) } : B.SETUP;
    B.drawState(st, { skip: { tokens: true } });
    drawMapTokens(t);
    if (hl) {
      const c = B.SETUP.queue.find((q) => q.k === hl.k);
      const [x, y0] = B.slot(hl.k);
      const y = y0 - hl.a * 8;
      const pulse = 0.85 + 0.15 * Math.sin(t * 9);
      for (let i = 3; i >= 1; i--) {
        const e = i * 10;
        RR.flat(RR.rrectPts(x - 95 - e, y - 132.5 - e, 190 + 2 * e, 265 + 2 * e, 16 + e, 3), RR.C[hl.role], (95 * hl.a * pulse) / i);
      }
      RR.drawCard(c.id, x, y, { w: 190, lift: hl.a * 0.6 });
      if (c.votes && c.votes.length) B.cubesOnCard(x, y, c.votes, { size: 32 });
    }
  };

  // ------------------------------------------------------------ overlays
  const LX = 150, LY = 128; // ribbon left edge / centre line
  const drawLabel = (r, t) => {
    const [tA, tB] = INFO[r].label;
    if (t < tA || t > tB + 0.4) return;
    const out = RR.seg(t, tB, tB + 0.35, 'inBack');
    const alpha = 1 - RR.seg(t, tB + 0.2, tB + 0.35);
    push();
    translate(0, -out * 340);
    const u = RR.seg(t, tA + 0.08, tA + 0.45);
    if (u > 0) RR.drawSprite(ribbon(r), LX, LY, { ax: 0, ay: 0.5, sx: Math.max(0.03, RR.E.outBack(u)), alpha });
    const m = RR.pop(t, tA, 0.4);
    if (m > 0.02) RR.drawSprite(medal(r), LX - 32, LY, { w: 150 * m, h: 150 * m, rot: (1 - m) * -0.8 + Math.sin(t * 2.2) * 0.04, alpha });
    const g = RR.seg(t, tA + 0.35, tA + 0.62);
    if (g > 0) {
      const k = RR.lerp(0.8, 1, RR.E.outBack(g));
      RR.drawSprite(agenda(r), LX + 26, LY + 104, { ax: 0, ay: 0.5, sx: k, sy: k, rot: -0.012, alpha: alpha * Math.min(1, g * 2) });
    }
    const bk = RR.pop(t, tA + 0.55, 0.4);
    if (bk > 0.02) {
      const bx = LX + ribbonW(r) + 34 + BADGE_W / 2, by = 44 + BADGE_H / 2;
      RR.drawSprite(badge(), bx, by, { w: BADGE_W * bk, h: BADGE_H * bk, rot: 0.018, alpha });
      const n = INFO[r].inf;
      for (let i = 0; i < n; i++) {
        const ck = RR.pop(t, tA + 0.8 + i * 0.15, 0.3);
        if (ck > 0.02) RR.drawCube(bx - 6 + (i - (n - 1) / 2) * 70, by + 6 - (1 - Math.min(1, ck)) * 40, 74 * ck, r, { alpha });
      }
    }
    pop();
  };
  const drawStrip = (r, t, dy, items) => {
    const k = RR.pop(t, INFO[r].stripIn, 0.4);
    if (k < 0.02) return;
    const [cx, cy] = INFO[r].strip;
    RR.drawSprite(strip(r), cx, cy + dy, { w: STRIP_W * k, h: STRIP_H * k });
    for (const it of items || []) {
      const [x, y] = slotPos(r, it.i, dy);
      const land = bump(t, it.t, 0.2);
      if (it.cube) RR.drawCube(x, y + 4 + land * 4, 54, it.cube);
      else RR.drawToken(x, y + 2 + land * 4, 58, it.kind, { sy: 1 - land * 0.15 });
    }
  };
  // A piece flying along an arc from p to q between t0 and t1 (screen space).
  const flyer = (t, t0, t1, p, q, h, draw) => {
    const u = RR.seg(t, t0, t1);
    if (u <= 0 || u >= 1) return false;
    const e = RR.E.inOutQuad(u);
    const pos = RR.hop(p, q, e, h);
    draw(pos, u);
    return true;
  };

  // ------------------------------------------------------------ people
  const wave = (t, t0) => 2.55 + 0.35 * Math.sin((t - t0) * 15);
  // Line-up (intro and outro): four people at once would blow the frame budget, so the
  // waving poses are painted once as cels (3 arm angles, ping-ponged at 12 fps) and the
  // pop / squash / duck motion is applied to the cel.
  const CEL_ARM = [2.2, 2.6, 2.95], CEL_SEQ = [0, 1, 2, 1];
  const celIdx = (t, tIn) => CEL_SEQ[Math.floor(Math.max(0, t - tIn) * 12 + 1) % 4];
  const CEL_W = 470, CEL_H = 520, CEL_FX = 260, CEL_FY = 485;
  const celPose = (r, idx, side) => {
    const pose = { armR: CEL_ARM[idx], armL: 0.25, eyes: 'happy', mouth: 'grin', brow: 'up', look: [0, 0], turn: 0.28 * side };
    if (r === 'de') Object.assign(pose, { prop: 'clipboard', propHand: 'L' });
    if (r === 'fr') Object.assign(pose, { prop: 'net', propHand: 'L', propRot: -0.45 });
    if (r === 'ar') Object.assign(pose, { prop: 'placard', propHand: 'L', armL: 0.45 });
    return pose;
  };
  const cel = (r, idx, side) => RR.sprite(`s04:cel:${r}:${idx}:${side}`, CEL_W, CEL_H, () => RR.drawPerson(r, CEL_FX, CEL_FY, S_ROW, celPose(r, idx, side)), { res: 1 });
  const rowPose = (r, t, tIn, tOut, x) => {
    const io = popIO(t, tIn, tOut);
    if (!io) return null;
    const sq = io.sq + 0.02 * Math.sin(t * 3.1 + ROLE_SEED[r]);
    return { x, y: ROW_Y + io.dy, s: S_ROW, cel: { r, idx: celIdx(t, tIn), side: x < 960 ? 1 : -1, sq } };
  };
  const ROLE_SEED = { de: 0.3, fr: 1.4, ar: 2.2, hu: 3.1 };

  // German agency: surprised by the crowd, shrugs, plucks one raccoon and banks it.
  const DE_REST = handAt(1, 0.2), DE_WAVE = handAt(1, CEL_ARM[celIdx(1.2, 0)]), DE_SHRUG = handAt(1, 1.25);
  const DE_REACH = [122, -238], DE_PULL = [72, -176], DE_TOSS = [104, -150];
  const dePose = (t) => {
    if (t < 1.2) return rowPose('de', t, 0.0, undefined, ROW_X.de);
    const io = popIO(t, -1, 5.42);
    if (!io) return null;
    const k = RR.seg(t, 1.2, 1.58);
    const e = RR.E.inOutQuad(k);
    const x = RR.lerp(ROW_X.de, 360, e), y = RR.lerp(ROW_Y, GROUND, e) - Math.sin(k * PI) * 110 + io.dy;
    const s = RR.lerp(S_ROW, S_BIG, RR.E.outCubic(k));
    const p = { ...RR.personIdle(t, 0.3), prop: 'clipboard', propHand: 'L', armL: 0.14 };
    p.squash += io.sq + 0.12 * bump(t, 1.08, 0.14) - 0.12 * bump(t, 1.2, 0.38) + 0.14 * bump(t, 1.56, 0.2);
    p.handR = RR.kf(t, [[1.2, DE_WAVE], [1.5, DE_REST], [2.6, DE_REST], [2.85, DE_SHRUG, 'outBack'], [3.45, DE_SHRUG], [3.66, DE_REST], [3.72, DE_REST], [3.96, DE_REACH, 'outBack'], [4.3, DE_REACH], [4.48, DE_PULL], [4.6, DE_TOSS, 'outQuad'], [4.95, DE_REST]]);
    p.armL = RR.kf(t, [[2.6, 0.14], [2.85, 1.25, 'outBack'], [3.45, 1.25], [3.66, 0.14]]);
    if (t < 2.4) Object.assign(p, { turn: 0.35, look: [1, -0.3], mouth: 'o', brow: 'up', eyes: t > 1.75 && t < 2.3 ? 'wide' : 'open' });
    else if (t < 3.6) {
      const sh = RR.env(t, 2.6, 3.55, 0.2, 0.2);
      Object.assign(p, { turn: 0.05, look: [0, 0], brow: t > 2.65 ? 'worried' : 'neutral', mouth: t > 2.7 ? 'flat' : 'smile', hop: 12 * sh, headTilt: 0.2 * sh });
      if (t > 2.8 && t < 3.25) p.eyes = 'closed';
      p.squash += 0.07 * bump(t, 2.45, 0.2) - 0.05 * sh;
    } else if (t < 4.6) {
      const r = RR.seg(t, 3.66, 3.96);
      Object.assign(p, { turn: 0.5 * r, look: [1, -0.7], brow: 'sly', mouth: t > 4.3 ? 'grin' : 'smile', lean: 0.07 * RR.env(t, 3.66, 4.5, 0.25, 0.2) });
      p.squash += 0.06 * bump(t, 4.28, 0.18);
    } else {
      Object.assign(p, { turn: 0.25, look: [1, 0.8], eyes: t > 4.9 ? 'happy' : 'open', mouth: 'grin', brow: 'up', headTilt: 0.08 * Math.sin((t - 4.9) * 9) * RR.env(t, 4.9, 5.4, 0.1, 0.2) });
      p.hop = 10 * bump(t, 4.9, 0.3);
    }
    return { x, y, s, pose: p };
  };

  // French agency: nets two raccoons out of France and drops them on its score strip.
  const FR_X = 420;
  const frRot = (t) => RR.kf(t, [[5.6, -0.12], [6.9, -0.12], [7.15, -0.8, 'outQuad'], [7.52, 1.45, 'inOutQuad'], [8.0, 0.35, 'outBack'], [8.1, 0.35], [8.45, 2.4, 'inOutCubic'], [8.75, 2.4], [9.15, -0.12, 'outBack']]);
  const frHand = (t) => RR.kf(t, [[5.6, [70, -150]], [6.9, [70, -150]], [7.15, [40, -205], 'outQuad'], [7.52, [105, -178], 'inOutQuad'], [8.0, [85, -200], 'outBack'], [8.1, [85, -200]], [8.45, [105, -170]], [8.75, [105, -170]], [9.15, [70, -150], 'outBack']]);
  const frPose = (t) => {
    const io = popIO(t, 5.65, 9.9);
    if (!io) return null;
    const th = frRot(t);
    const p = { ...RR.personIdle(t, 1.4), prop: 'net', handR: frHand(t), propRot: th + 0.1, armL: 0.2 };
    p.squash += io.sq;
    if (t < 6.3) Object.assign(p, { look: [0.3, 0], mouth: 'smile' });
    else if (t < 6.9) Object.assign(p, { turn: 0.35, look: [1, -0.4], brow: 'sly', mouth: 'grin' });
    else if (t < 7.52) {
      Object.assign(p, { turn: 0.4, look: [1, -0.5], brow: 'angry', mouth: t < 7.15 ? 'flat' : 'grin', lean: RR.kf(t, [[6.9, 0], [7.15, -0.07], [7.52, 0.08]]) });
      p.squash += 0.06 * bump(t, 6.9, 0.3) - 0.06 * bump(t, 7.2, 0.3);
    } else if (t < 8.45) Object.assign(p, { turn: 0.35, look: [1, -1], brow: 'up', mouth: t < 8.0 ? 'o' : 'grin', lean: RR.tw(t, 7.52, 8.0, 0.08, 0) });
    else if (t < 8.8) Object.assign(p, { turn: 0.35, look: [1, 1], brow: 'up', mouth: 'grin' });
    else {
      Object.assign(p, { turn: 0.1, look: [0, 0], eyes: 'happy', mouth: 'grin', brow: 'up', headTilt: -0.08 });
      p.hop = 12 * bump(t, 8.85, 0.3);
    }
    return { x: FR_X, y: GROUND + io.dy, s: S_BIG, pose: p };
  };
  const hoopAt = (P) => {
    const th = P.pose.propRot - 0.1, h = P.pose.handR;
    return pxf(P.x, P.y, P.s, P.pose, add(h, rot(th, [0, -160])));
  };

  // Animal Rights Activist: placard up, hugs a raccoon, paw policy scores.
  const AR_X = 350, RAC_X = 596, RAC_Y = 1140, RAC_S = 1.5;
  const racPose = (t) => {
    const io = popIO(t, 10.95, 14.45, 520);
    if (!io) return null;
    const p = RR.raccoonIdle(t, { face: -1, armF: 0.35, armB: 0.25 });
    p.squash += io.sq;
    if (t < 11.35) Object.assign(p, { look: [-1, -0.2], mouth: 'o', brow: 'up', ear: Math.sin(t * 20) * 0.5 });
    else if (t < 11.55) Object.assign(p, { look: [1, -0.3], eyes: 'wide', brow: 'up', mouth: 'smile' });
    else if (t < 12.7) {
      const h = RR.env(t, 11.55, 13.0, 0.2, 0.3);
      Object.assign(p, { lean: 0.2 * h, headTilt: 0.14 * h, eyes: 'happy', mouth: 'smile', armF: 0.35 + 1.1 * h, tail: t * 6 });
    } else if (t < 13.65) Object.assign(p, { lean: RR.tw(t, 12.7, 13.0, 0.2, 0.05), look: [-0.6, -1], brow: 'up', mouth: t > 13.3 ? 'grin' : 'o', headTilt: -0.12 });
    else {
      Object.assign(p, { eyes: 'happy', mouth: 'grin', armF: 2.6 + 0.3 * Math.sin(t * 14), armB: 2.4, tailUp: 1, tail: t * 8 });
      p.squash += 0.06 * Math.sin((t - 13.65) * 14);
    }
    return { x: RAC_X, y: RAC_Y + io.dy, s: RAC_S, pose: p };
  };
  const arPose = (t, rac) => {
    const io = popIO(t, 10.2, 14.4);
    if (!io) return null;
    const p = { ...RR.personIdle(t, 2.2), prop: 'placard', propHand: 'L' };
    p.squash += io.sq;
    const march = RR.env(t, 10.35, 11.4, 0.1, 0.15);
    const cheer = RR.env(t, 13.65, 14.5, 0.1, 0.05);
    p.armL = 2.3 + 0.16 * Math.sin(t * 2 * PI * 2) * (march + cheer);
    p.propRot = 0.05 * Math.sin(t * 2 * PI * 2) * (march + cheer);
    p.hop = Math.abs(Math.sin(t * 2 * PI * 2)) * 10 * (march + cheer);
    const hug = RR.env(t, 11.55, 14.35, 0.25, 0.2);
    if (t < 11.35) Object.assign(p, { mouth: 'talk', talkT: t, brow: 'up', look: [0.2, 0], armR: 0.3 });
    else if (t < 11.55) Object.assign(p, { turn: 0.45, look: [1, 0.6], eyes: 'wide', mouth: 'o', brow: 'up', armR: 0.3 });
    else if (t < 12.7) Object.assign(p, { turn: 0.5, look: [1, 0.6], eyes: 'happy', mouth: 'grin', brow: 'up', lean: 0.08 * hug, headTilt: 0.14 * hug });
    else if (t < 13.65) Object.assign(p, { turn: 0.5, look: [1, -1], mouth: t > 13.3 ? 'grin' : 'o', brow: 'up', lean: 0.04 * hug });
    else Object.assign(p, { turn: 0.3, eyes: 'happy', mouth: 'grin', brow: 'up', lean: 0.04 * hug });
    // right arm wraps round the raccoon's far shoulder
    if (rac && hug > 0) {
      const shoulder = rxf(rac.x, rac.y, rac.s, rac.pose, [-22, -92]);
      const tgt = pinv(AR_X, GROUND + io.dy, S_BIG, p, shoulder);
      p.handR = RR.lerp2(handAt(1, 0.3), tgt, RR.E.inOutCubic(hug));
    }
    return { x: AR_X, y: GROUND + io.dy, s: S_BIG, pose: p, hug };
  };

  // Hunting Lobbyist: binoculars, spots the crosshair policy, rolls the hunter die.
  const HU_THROW = 17.25;
  const huPose = (t) => {
    const tOut = OUT_OFF.hu;
    const io = popIO(t, 14.55, tOut);
    if (!io) return null;
    const k = RR.seg(t, 18.88, 19.18);
    const e = RR.E.inOutQuad(k);
    const x = RR.lerp(360, OUT_X.hu, e), y = RR.lerp(GROUND, ROW_Y, e) - Math.sin(k * PI) * 90 + io.dy;
    const s = RR.lerp(S_BIG, S_ROW, RR.E.outCubic(k));
    const p = { ...RR.personIdle(t, 3.1), armL: 0.2, armR: 0.2 };
    p.squash += io.sq - 0.1 * bump(t, 18.88, 0.3) + 0.1 * bump(t, 19.16, 0.16);
    if (t < 16.1) {
      p.prop = 'binoculars';
      const sweep = RR.kf(t, [[14.9, -0.3], [15.35, 0.15, 'inOutSine'], [15.5, 0.15], [15.9, 0.55, 'inOutSine']]);
      Object.assign(p, { turn: sweep, headTilt: -0.06 + 0.03 * Math.sin(t * 5), lean: 0.03 * sweep, mouth: t > 15.9 ? 'grin' : 'flat' });
      p.hop = 10 * bump(t, 15.92, 0.2);
    } else if (t < 16.4) Object.assign(p, { turn: 0.5, look: [1, -0.9], eyes: 'wide', brow: 'up', mouth: 'grin', armL: 0.5, armR: RR.tw(t, 16.1, 16.4, 0.6, 1.6, 'outBack') });
    else if (t < HU_THROW) {
      p.prop = 'dice'; p.propRot = 0.1;
      p.handR = RR.kf(t, [[16.4, handAt(1, 1.6)], [16.7, [96, -196], 'outBack'], [16.95, [96, -196]], [17.15, [-6, -232], 'outQuad'], [HU_THROW, [118, -176], 'inQuad']]);
      Object.assign(p, { turn: 0.3, look: t < 16.95 ? [1, -1] : [1, -0.5], brow: 'sly', mouth: 'grin', lean: RR.kf(t, [[16.95, 0], [17.15, -0.08], [HU_THROW, 0.08]]) });
      p.squash += 0.07 * bump(t, 16.95, 0.25);
    } else if (t < 18.5) {
      p.handR = RR.kf(t, [[HU_THROW, [118, -176]], [17.6, handAt(1, 0.5)]]);
      Object.assign(p, { turn: 0.45, look: t < 18.0 ? [1, -0.1] : [1, 1], brow: 'up', mouth: t < 17.95 ? 'o' : 'grin', lean: RR.tw(t, HU_THROW, 17.6, 0.08, 0) });
    } else {
      const ch = RR.seg(t, 18.5, 18.7, 'outBack');
      Object.assign(p, { eyes: 'happy', mouth: 'grin', brow: 'up', turn: RR.lerp(0.2, 0, k), armR: RR.lerp(0.5, 2.8, ch) });
      p.hop = 14 * bump(t, 18.5, 0.3);
      if (t > 19.0) p.armR = wave(t, 19.0);
    }
    return { x, y, s, pose: p };
  };

  const drawP = (role, P) => {
    if (!P || offBottom(P.y, 0, P.s)) return;
    if (!P.cel) return RR.drawPerson(role, P.x, P.y, P.s, P.pose);
    const c = P.cel;
    RR.drawSprite(cel(c.r, c.idx, c.side), P.x, P.y, { w: CEL_W, h: CEL_H, ax: CEL_FX / CEL_W, ay: CEL_FY / CEL_H, sx: 1 + c.sq * 0.5, sy: 1 - c.sq * 0.5 });
  };

  RR.scene({
    id: 's04_roles', order: 4, dur: 20, music: 'roles',
    cues: [
      [0.05, 'pop', 0.7], [0.15, 'pop', 0.7], [0.25, 'pop', 0.7], [0.35, 'pop', 0.7], [0.2, 'paper', 0.6],
      [1.1, 'hop', 0.8], [1.2, 'whoosh', 0.5],
      [1.75, 'paper', 0.6], [2.05, 'pop', 0.5], [2.35, 'chitter', 0.7], [2.55, 'tock', 0.5], [2.7, 'tock', 0.5], [2.85, 'tock', 0.5],
      [3.95, 'pop'], [4.55, 'whoosh', 0.4], [4.88, 'tock'], [4.92, 'ding', 0.7],
      [5.42, 'whoosh', 0.6], [5.7, 'pop', 0.7], [6.0, 'paper', 0.6], [6.3, 'pop', 0.5], [6.8, 'tock', 0.5], [6.95, 'tock', 0.5], [7.1, 'tock', 0.5],
      [7.2, 'whoosh', 0.8], [7.36, 'pop', 0.8], [7.43, 'pop', 0.8], [8.62, 'tock'], [8.72, 'tock'], [8.8, 'ding', 0.7],
      [9.9, 'whoosh', 0.6], [10.25, 'pop', 0.7], [10.55, 'paper', 0.6], [10.85, 'pop', 0.5], [10.98, 'pop', 0.8], [11.1, 'chitter'], [11.35, 'tock', 0.5],
      [11.75, 'sparkle', 0.8], [12.75, 'ding', 0.8], [13.2, 'hop', 0.6], [13.65, 'tock'],
      [14.4, 'whoosh', 0.6], [14.6, 'pop', 0.7], [14.9, 'paper', 0.6], [15.2, 'pop', 0.5], [15.7, 'tock', 0.5], [15.9, 'ding', 0.8],
      [16.3, 'whoosh', 0.5], [17.22, 'whoosh', 0.4], [17.5, 'dice'], [18.0, 'poof'], [18.45, 'tock'], [18.5, 'ding', 0.7],
      [18.75, 'pop', 0.6], [18.82, 'pop', 0.6], [18.89, 'pop', 0.6], [19.4, 'whoosh', 0.7],
    ],
    draw(t) {
      const cam = RR.drift(RR.camKf(t, CAM_KEYS), t, RR.env(t, 0, 19.3, 1.2, 0.8));
      RR.withCam(cam, () => drawBoard(t));
      const S = (p) => RR.toScreen(cam, p);

      // ---------------- intro line-up (0-1.2) and the others ducking as DE steps forward
      if (t < 1.7) for (const [r, tIn] of [['fr', 0.1], ['ar', 0.2], ['hu', 0.3]]) drawP(r, rowPose(r, t, tIn, 1.2 + (tIn - 0.1) * 0.3, ROW_X[r]));

      // ---------------- German agency
      if (t < 5.8) {
        const P = dePose(t);
        const dy = P ? P.y - GROUND : 0;
        const tok0 = S(add(tokenPos('de', 9), [0, -TOK * 0.1]));
        const items = t >= 4.85 ? [{ i: 0, kind: 'yellow', t: 4.85 }] : [];
        if (t > 1.6) drawStrip('de', t, Math.max(0, dy), items);
        drawP('de', P);
        if (P && t >= 3.95) {
          const hand = pxf(P.x, P.y, P.s, P.pose, P.pose.handR);
          const held = add(hand, [0, -26]);
          RR.poof(tok0[0], tok0[1], t, 3.95, { r: 50 });
          const flying = flyer(t, 3.95, 4.3, tok0, held, 140, (q, u) => RR.drawToken(q[0], q[1], RR.lerp(TOK * cam.z, 64, u), 'yellow', { shadow: false, rot: u * 6.3 }));
          if (!flying && t >= 4.3 && t < 4.55) RR.drawToken(held[0], held[1], 64, 'yellow', { shadow: false });
          const R0 = dePose(4.55), rel = add(pxf(R0.x, R0.y, R0.s, R0.pose, R0.pose.handR), [0, -26]);
          if (t >= 4.55) flyer(t, 4.55, 4.85, rel, slotPos('de', 0), 160, (q, u) => RR.drawToken(q[0], q[1], RR.lerp(64, 58, u), 'yellow', { shadow: false, rot: -u * 6.3 }));
          RR.sparkle(...slotPos('de', 0), t, 4.87, { r: 70, col: RR.C.gold });
        }
        drawLabel('de', t);
      }

      // ---------------- French agency
      if (t > 5.6 && t < 10.3) {
        const P = frPose(t);
        const dy = P ? P.y - GROUND : 0;
        const items = [];
        if (t >= 8.62) items.push({ i: 0, kind: 'blue', t: 8.62 });
        if (t >= 8.72) items.push({ i: 1, kind: 'blue', t: 8.72 });
        drawStrip('fr', t, Math.max(0, dy), items);
        drawP('fr', P);
        if (P) {
          const hoop = hoopAt(P);
          const th = P.pose.propRot - 0.1;
          [[2, 7.33, 8.42, 0], [1, 7.40, 8.5, 1]].forEach(([idx, tg, tr, slot], j) => {
            const from = S(add(tokenPos('fr', idx), [0, -TOK * 0.1]));
            const inNet = add(hoop, rot(th, [j ? 20 : -20, 14 + j * 6]));
            if (t >= tg && t < tg + 0.12) {
              const u = RR.seg(t, tg, tg + 0.12);
              const q = RR.hop(from, inNet, u, 60);
              RR.drawToken(q[0], q[1], RR.lerp(TOK * cam.z, 60, u), 'blue', { shadow: false });
            } else if (t >= tg + 0.12 && t < tr) {
              const jig = Math.sin(t * 30 + j) * 3;
              RR.drawToken(inNet[0] + jig, inNet[1], 60, 'blue', { shadow: false, rot: th * 0.3 });
            } else if (t >= tr) {
              flyer(t, tr, tr + 0.2, inNet, slotPos('fr', slot), 30, (q, u) => RR.drawToken(q[0], q[1], RR.lerp(60, 58, u), 'blue', { shadow: false, rot: u * 3 }));
            }
            if (t >= tg && t < tg + 0.6) RR.poof(from[0], from[1], t, tg, { r: 40 });
          });
          RR.sparkle(...slotPos('fr', 1), t, 8.74, { r: 80, col: RR.C.gold });
        }
        drawLabel('fr', t);
      }

      // ---------------- Animal Rights Activist
      if (t > 10.1 && t < 14.8) {
        const R = racPose(t);
        const P = arPose(t, R);
        const dy = P ? P.y - GROUND : 0;
        const items = t >= 13.65 ? [{ i: 0, cube: 'ar', t: 13.65 }] : [];
        drawStrip('ar', t, Math.max(0, dy), items);
        drawP('ar', P);
        if (R) {
          RR.shadow(R.x, R.y + 4, 90, 14, 40);
          RR.drawRaccoon(R.x, R.y, R.s, R.pose);
        }
        if (P && R && P.hug > 0.3) {
          const h = pxf(P.x, P.y, P.s, P.pose, P.pose.handR);
          push(); translate(h[0], h[1]); scale(P.s); RR.inkCircle(0, 0, 11, { fill: RR.PEOPLE.ar.skin, w: 1 }); pop();
        }
        // heart
        const hk = RR.pop(t, 11.75, 0.45);
        const ha = 1 - RR.seg(t, 12.75, 13.0);
        if (t > 11.75 && ha > 0) {
          const y = 730 - RR.E.outCubic(RR.seg(t, 11.75, 13.0)) * 90;
          const beat = 1 + 0.12 * Math.max(0, Math.sin((t - 11.75) * 11));
          RR.icon('heart', 580, y, 130 * hk * beat, { col: '#e7738f', stroke: RR.C.ink }, { alpha: ha });
          for (let i = 0; i < 3; i++) {
            const u = RR.seg(t, 11.9 + i * 0.22, 12.8 + i * 0.22);
            if (u > 0 && u < 1) RR.icon('heart', 580 + (i - 1) * 95 + Math.sin(u * 9 + i) * 14, 700 - u * 220, 44 * (1 - u * 0.4), { col: RR.C.pink }, { alpha: 1 - u });
          }
        }
        // paw star ring, then a pink cube hops to the strip
        const star = S(starOf(3));
        const rk = RR.pop(t, 12.7, 0.4) * (1 - RR.seg(t, 14.35, 14.6));
        if (rk > 0.02) RR.drawSprite(ring('ar'), star[0], star[1], { w: 120 * rk * (1 + 0.08 * Math.sin(t * 9)), h: 120 * rk * (1 + 0.08 * Math.sin(t * 9)) });
        RR.sparkle(star[0], star[1], t, 12.72, { r: 90, col: RR.C.pink });
        flyer(t, 13.2, 13.65, star, slotPos('ar', 0), 200, (q, u) => RR.drawCube(q[0], q[1], RR.lerp(40, 54, u), 'ar', { shadow: false, rot: u * 4 }));
        RR.sparkle(...slotPos('ar', 0), t, 13.67, { r: 70, col: RR.C.gold });
        drawLabel('ar', t);
      }

      // ---------------- Hunting Lobbyist
      if (t > 14.5) {
        const P = huPose(t);
        const dy = RR.seg(t, 18.6, 18.9, 'inBack') * 420;
        const items = t >= 18.45 ? [{ i: 0, kind: 'black', t: 18.45 }] : [];
        if (t < 19.0) drawStrip('hu', t, Math.max(0, dy), items);
        drawP('hu', P);
        // binocular view sweeping the queue, locking on to the crosshair star
        const ba = RR.env(t, 15.0, 16.15, 0.2, 0.25);
        if (ba > 0) {
          const w = RR.kf(t, [[15.0, [1450, 250]], [15.4, [1650, 320], 'inOutSine'], [15.5, [1650, 320]], [15.88, starOf(2), 'inOutSine']]);
          const c = S(w);
          RR.drawSprite(bino(), c[0], c[1], { w: 470 * (0.9 + 0.1 * ba), h: 270 * (0.9 + 0.1 * ba), alpha: ba });
        }
        const star = S(starOf(2));
        const rk = RR.pop(t, 15.9, 0.4) * (1 - RR.seg(t, 16.8, 17.1));
        if (rk > 0.02) RR.drawSprite(ring('hu'), star[0], star[1], { w: 120 * rk * (1 + 0.08 * Math.sin(t * 9)), h: 120 * rk * (1 + 0.08 * Math.sin(t * 9)) });
        RR.sparkle(star[0], star[1], t, 15.92, { r: 90, col: RR.C.gold });
        // the hunter die: thrown, tumbles, lands on the skull
        if (t >= HU_THROW && t < 19.1) {
          const H0 = huPose(HU_THROW - 0.001), rel = pxf(H0.x, H0.y, H0.s, H0.pose, add(H0.pose.handR, [0, -20]));
          const L1 = [930, 520], L2 = [1012, 566];
          let pos, r0, face, sq = 1;
          if (t < 17.62) {
            const u = RR.seg(t, HU_THROW, 17.62);
            pos = RR.hop(rel, L1, u, 260); r0 = u * 10; face = Math.floor(t * 16) % 2 ? 'shield' : 'skull';
          } else if (t < 17.86) {
            const u = RR.seg(t, 17.62, 17.86);
            pos = RR.hop(L1, L2, u, 60); r0 = 10 + u * (0.35 + 4 * PI - 10); face = u < 0.5 ? 'shield' : 'skull';
            sq = 1 - 0.25 * bump(t, 17.62, 0.1);
          } else { pos = L2; r0 = 0.35; face = 'skull'; sq = 1 - 0.18 * bump(t, 17.86, 0.12); }
          const settle = RR.seg(t, 17.86, 18.0, 'outBack');
          const rr = t >= 17.86 ? RR.lerp(0.35, 0.1, settle) : r0;
          const da = 1 - RR.seg(t, 18.8, 19.05);
          RR.shadow(pos[0] + 4, Math.max(pos[1], L2[1]) + 38, 34, 9, 40 * da);
          RR.drawDie(pos[0], pos[1], 76, 'hunter', face, { rot: rr, sx: 1 / sq, sy: sq, alpha: da, shadow: false });
          if (t > 17.9) RR.sparkle(pos[0], pos[1], t, 17.9, { r: 80, col: RR.C.lilac, n: 6 });
        }
        // a raccoon token poofs off the map and lands on the Hunter's strip
        const from = S(add(tokenPos('roe', 1), [0, -TOK * 0.1]));
        RR.poof(from[0], from[1], t, 18.0, { r: 55 });
        flyer(t, 18.0, 18.45, from, slotPos('hu', 0), 180, (q, u) => RR.drawToken(q[0], q[1], RR.lerp(TOK * cam.z, 58, u), 'black', { shadow: false, rot: -u * 6.3 }));
        RR.sparkle(...slotPos('hu', 0), t, 18.47, { r: 70, col: RR.C.gold });
        drawLabel('hu', t);
      }

      // ---------------- outro line-up: everyone waves and ducks out
      if (t > 18.7) for (const r of ['ar', 'fr', 'de']) drawP(r, rowPose(r, t, OUT_IN[r], OUT_OFF[r], OUT_X[r]));

      RR.banner('FOUR ROLES', t, 0.15, 1.75, { y: 128, size: 84 });
    },
  });
})();
