// Scene 9 (120-140 s): Step 2, the main phase. The French player adds a policy face down
// at the back of the queue, spends influence 3 on three blue votes (one of them as a favour
// to the Hunter), haggles with the German player, discards a card and draws back up to five.

(() => {
  const BD = RR.board;
  const FULL = RR.cam(1200, 750, 0.66), QCAM = RR.cam(1250, 330, 0.95);
  const C_ADD = RR.cam(860, 400, 1.1), C_VOTE = RR.cam(1640, 330, 1.45), C_TALK = RR.cam(1420, 435, 1.0);
  const CAMS = [[0, FULL], [2.0, FULL], [3.4, C_ADD], [6.0, C_ADD], [7.1, C_VOTE], [10.3, C_VOTE], [11.2, C_TALK], [15.2, C_TALK], [19.7, QCAM, 'inOutSine']];
  const camAt = (t) => RR.drift(RR.camKf(t, CAMS), t, RR.env(t, 0, 19.7, 1.5, 1.5));

  // ---------------------------------------------------------------- board state S8 (from s08)
  const S8 = BD.clone(BD.SETUP);
  S8.story = ['corprelief', 'corpself', null, null, null];
  S8.tokens = { de: 10, fr: 6, roe: 9 };
  S8.tracker = 4;
  S8.prot = [];
  S8.queue = [
    { id: 'pets', k: 1, votes: ['ar', 'fr'] },
    { id: 'wear', k: 2, votes: ['hu', 'corp'] },
    { id: 'drones', k: 3, votes: [] },
    { id: 'protect', k: 4, votes: [] },
    { id: 'back:policy', k: 5 }, { id: 'back:policy', k: 6 }, { id: 'back:policy', k: 7 },
  ];
  const COST = { 1: 5, 2: 3, 3: 7, 4: 5 };

  // Blue votes: [queue space, landing time]. Ends as drones ['fr','fr'], wear ['hu','corp','fr'].
  const VOTES = [[3, 7.95], [3, 8.55], [2, 9.9]];
  const LAND_K8 = 3.95;

  // ---------------------------------------------------------------- small helpers
  const cubeLayout = (x, y, i, n, size = 32) => {
    const col = i % 3, row = Math.floor(i / 3);
    const inRow = Math.min(3, n - row * 3);
    return [x + (col - (inRow - 1) / 2) * size * 1.15 + (row % 2) * 6, y + 38 - row * size * 0.9];
  };
  // All cubes on queue space k at time t: [{role, pos (world), land}]
  const cubesOn = (k, t) => {
    const [x, y] = BD.slot(k);
    const base = (S8.queue.find((c) => c.k === k) || {}).votes || [];
    const list = base.map((r) => ({ role: r, land: -1 }));
    VOTES.forEach(([kk, L]) => { if (kk === k) list.push({ role: 'fr', land: L }); });
    // room is made just before each arrival
    let nf = base.length;
    for (const c of list) if (c.land > 0) nf += RR.seg(t, c.land - 0.24, c.land - 0.02, 'inOutCubic');
    const f = nf - Math.floor(nf);
    return list.map((c, i) => {
      const n0 = Math.max(i + 1, Math.floor(nf)), n1 = Math.max(i + 1, Math.ceil(nf));
      return { ...c, i, pos: RR.lerp2(cubeLayout(x, y, i, n0), cubeLayout(x, y, i, n1), f) };
    });
  };
  const personPt = (x, y, s, p, [lx, ly]) => {
    const sq = p.squash ?? 0, a = p.lean ?? 0;
    const px = lx * s * (1 + sq * 0.5), py = ly * s * (1 - sq * 0.5);
    return [x + px * Math.cos(a) - py * Math.sin(a), y - (p.hop ?? 0) + px * Math.sin(a) + py * Math.cos(a)];
  };
  const glowRect = (x, y, w, h, col, amt, r = 18) => {
    if (amt <= 0.01) return;
    RR.flush();
    const g = color(col);
    noStroke();
    for (let i = 3; i >= 1; i--) {
      g.setAlpha(70 * amt / i); fill(g);
      const e = i * 8;
      beginShape(); for (const p of RR.rrectPts(x - w / 2 - e, y - h / 2 - e, w + 2 * e, h + 2 * e, r + e, 3)) vertex(p[0], p[1]); endShape(CLOSE);
    }
  };
  const glowRing = (x, y, w, h, col, amt, r = 18) => {
    if (amt <= 0.01) return;
    RR.flush();
    const g = color(col);
    noFill();
    for (let i = 4; i >= 1; i--) {
      g.setAlpha(Math.min(255, 150 * amt / i)); stroke(g); strokeWeight(i * 5);
      beginShape(); for (const p of RR.rrectPts(x - w / 2, y - h / 2, w, h, r, 3)) vertex(p[0], p[1]); endShape(CLOSE);
    }
    noStroke();
  };
  const badgeSpr = (ok) => RR.sprite('s09:badge:' + ok, 100, 100, () => {
    RR.inkCircle(50, 50, 42, { fill: ok ? '#e3f1d2' : '#f8ded8', stroke: ok ? RR.C.greenDeep : RR.C.redDeep, w: 1.4 });
  }, { res: 1.6 });
  const countBadge = (label, ok, x, y, sc, size = 84) => {
    if (sc <= 0.01) return;
    push(); translate(x, y); scale(sc);
    RR.drawSprite(badgeSpr(ok), 0, 0, { w: size, h: size });
    RR.text(label, 0, size * 0.15, { font: 'bold', size: size * 0.4, col: ok ? RR.C.greenDeep : RR.C.redDeep });
    pop();
  };
  // Player board strip with the influence track (1-5)
  const PANEL = [760, 800];
  const panelSpr = () => RR.sprite('s09:influence', 420, 150, () => {
    RR.water(RR.rrectPts(10, 10, 400, 130, 18), RR.C.card, { layers: 10, alpha: 60, spread: 0.01, edge: 0.3 });
    RR.ink(RR.rrectPts(10, 10, 400, 130, 18), { stroke: RR.C.ink, w: 1.1, curve: 0.2 });
    RR.ink(RR.rrectPts(18, 18, 384, 114, 12), { stroke: RR.C.fr, w: 0.7, curve: 0.2 });
    RR.text('INFLUENCE', 210, 52, { font: 'title', size: 30, col: RR.C.plumDark });
    for (let i = 0; i < 5; i++) {
      RR.inkCircle(82 + i * 64, 96, 24, { fill: RR.C.white, stroke: RR.C.plumDark, w: 0.9 });
      RR.text(String(i + 1), 82 + i * 64, 106, { font: 'title', size: 28, col: RR.C.plumMid });
    }
  }, { res: 1.6 });
  const ringSpr = () => RR.sprite('s09:ring', 100, 100, () => {
    RR.inkCircle(50, 50, 38, { stroke: RR.C.frDark, w: 3.2 });
  }, { res: 1.6 });
  const circlePt = (i) => [PANEL[0] - 210 + 82 + i * 64, PANEL[1] - 75 + 96]; // i = 0..4, screen
  const hoverPt = (j, t) => {
    const c = circlePt(j);
    return [c[0], c[1] - 122 + Math.sin(t * 5 + j * 1.3) * 4];
  };

  // ---------------------------------------------------------------- the hand of cards
  const CARD_OF = { wear: 'wear', drones1: 'drones', behind: 'behind', pets: 'pets', burgers: 'burgers', protect: 'protect', drones2: 'drones' };
  const HAND = [
    [0, ['wear', 'drones1', 'behind', 'pets', 'burgers']],
    [3.05, ['wear', 'behind', 'pets', 'burgers']],
    [16.0, ['wear', 'behind', 'pets']],
    [17.1, ['wear', 'behind', 'pets', 'protect']],
    [17.6, ['wear', 'behind', 'pets', 'protect', 'drones2']],
  ];
  const FAN_W = 112, SPREAD = 0.2, FAN_TILT = 0.12;
  const fanAng = (list, key) => (list.indexOf(key) - (list.length - 1) / 2) * SPREAD + FAN_TILT;
  const fanAt = (t) => {
    let si = 0;
    for (let i = 0; i < HAND.length; i++) if (t >= HAND[i][0]) si = i;
    const [T, list] = HAND[si];
    const prev = si > 0 ? HAND[si - 1][1] : list;
    const u = RR.seg(t, T, T + 0.35, 'outBack');
    const open = RR.seg(t, 1.2, 1.55, 'outBack'); // the fan spreads open after the walk-in
    return list.map((key) => {
      const a1 = fanAng(list, key), a0 = prev.includes(key) ? fanAng(prev, key) : a1;
      return { key, ang: RR.lerp(FAN_TILT, RR.lerp(a0, a1, u), open) };
    });
  };
  // card lift inside the fan (choosing / picking)
  const liftOf = (key, t) => {
    // a ripple as the thumb flicks through the cards while choosing
    const idx = HAND[0][1].indexOf(key);
    let l = idx >= 0 ? 16 * RR.env(t, 2.0 + idx * 0.1, 2.4 + idx * 0.1, 0.12, 0.2) : 0;
    if (key === 'drones1') l += RR.kf(t, [[2.55, 0], [2.65, -8, 'inOutQuad'], [2.95, 76, 'outBack']]);
    if (key === 'burgers') l += RR.kf(t, [[15.55, 0], [15.75, 30, 'outBack'], [15.95, 40]]);
    return l;
  };
  const fanCardPos = (pivot, ang, lift) => {
    const d = 62 + lift;
    return [pivot[0] + Math.sin(ang) * d, pivot[1] - Math.cos(ang) * d];
  };

  // ---------------------------------------------------------------- characters
  const REST_R = [51, -80], REST_L = [-51, -80], FAN_L = [-102, -172];
  const kfv = (t, keys) => RR.kf(t, keys);

  const frAt = (t) => {
    const x = kfv(t, [[0.15, -330], [1.25, 390, 'outCubic'], [13.3, 390], [13.65, 580], [14.75, 580], [15.2, 390], [18.75, 390], [19.55, -400, 'inCubic']]);
    const walkIn = t > 0.15 && t < 1.25, walkOut = t > 18.75;
    const p = RR.personIdle(t, 1, { mouth: 'smile', brow: 'neutral', look: [0, 0], turn: 0 });
    if (walkIn || walkOut) { p.walk = t * 11; p.hop = Math.abs(Math.sin(t * 11)) * 12; }
    if (t >= 1.25 && t < 1.9) p.squash = 0.14 * Math.exp(-(t - 1.25) * 7) * Math.cos((t - 1.25) * 18);
    p.lean = 0.07 * Math.sin(Math.PI * RR.seg(t, 13.3, 13.65)) - 0.07 * Math.sin(Math.PI * RR.seg(t, 14.75, 15.2)) + (walkIn ? 0.06 : 0) - (walkOut ? 0.08 : 0);
    // face acting, beat by beat
    const set = (o) => Object.assign(p, o);
    if (t < 1.25) set({ turn: 0.3, look: [0.6, 0] });
    else if (t < 2.0) set({ look: [0, 0], mouth: t > 1.35 && t < 1.95 ? 'grin' : 'smile', brow: 'up' });
    else if (t < 2.6) set({ turn: -0.35, look: [-0.9, 0.5], brow: 'worried', mouth: 'flat' });
    else if (t < 3.05) set({ turn: -0.3, look: [-0.7, -0.4], eyes: 'wide', brow: 'up', mouth: t < 2.8 ? 'o' : 'grin' });
    else if (t < 4.0) set({ turn: 0.35, look: [0.7, -0.9], mouth: 'smile' });
    else if (t < 4.7) set({ eyes: 'happy', mouth: 'grin', headTilt: 0.1 * Math.sin((t - 4.0) * 12) * (1 - RR.seg(t, 4.0, 4.7)) });
    else if (t < 4.95) set({ look: [0, 0], mouth: 'smile' });
    else if (t < 5.75) set({ look: [0, 0], eyes: 'happy', brow: 'sly', mouth: 'flat', headTilt: 0.12 }); // shh, it's a secret
    else if (t < 6.1) set({ turn: 0.2, look: [0.5, -0.6] });
    else if (t < 7.2) set({ turn: 0.35, look: [1, -0.2], mouth: t < 6.7 ? 'o' : 'smile', brow: 'up' });
    else if (t < 8.7) set({ turn: 0.4, look: [0.9, -0.8], brow: 'neutral' });
    else if (t < 9.1) set({ turn: 0.7, look: [1, 0], brow: 'up', mouth: 'o' });
    else if (t < 9.3) set({ turn: 0.6, look: [1, 0], eyes: 'happy', mouth: 'smile', headTilt: 0.12 * Math.sin((t - 9.1) * 30) });
    else if (t < 10.3) set({ turn: 0.4, look: [0.9, -0.8], mouth: t > 9.9 ? 'grin' : 'smile' });
    else if (t < 12.3) set({ turn: 0.6, look: [1, -0.1], brow: t > 11.8 ? 'sly' : 'up', mouth: t > 11.8 ? 'flat' : 'smile' });
    else if (t < 13.3) set({ turn: 0.6, look: [1, -0.2], brow: 'sly', mouth: 'talk', talkT: t });
    else if (t < 14.8) set({ turn: 0.6, look: [1, 0], eyes: t > 13.7 ? 'happy' : 'open', mouth: 'grin' });
    else if (t < 15.4) set({ look: [0, 0], mouth: 'smile' });
    else if (t < 16.0) set({ turn: -0.35, look: [-0.9, 0.4], brow: 'worried', mouth: 'frown' });
    else if (t < 16.5) set({ turn: 0.4, look: [1, 0.7], mouth: 'smile', brow: 'sly' });
    else if (t < 17.6) set({ turn: 0.2, look: t % 0.5 < 0.25 && t < 17.3 ? [1, 0.6] : [-0.9, 0.3], eyes: t > 17.05 && t < 17.3 ? 'wide' : 'open', mouth: 'o' });
    else if (t < 18.2) set({ turn: -0.2, look: [-0.6, 0.2], eyes: 'happy', mouth: 'grin' });
    else if (t < 18.75) set({ look: [0, 0], mouth: 'grin', brow: 'up' });
    else set({ turn: -0.7, look: [-1, 0] });
    // right hand: think, point, throw votes, handshake, flick, wave
    const shake = 10 * Math.sin((t - 13.75) * 24) * RR.env(t, 13.75, 14.5, 0.1, 0.15);
    p.handR = kfv(t, [
      [2.0, REST_R], [2.25, [28, -176]], [2.55, [28, -176]], [2.72, [70, -300], 'outBack'], [2.95, [60, -230]], [3.12, [150, -270], 'outBack'], [3.6, [150, -270]], [4.0, REST_R], [4.75, REST_R], [4.98, [10, -186], 'outBack'], [5.7, [10, -186]], [6.0, REST_R],
      [7.1, REST_R], [7.2, [80, -170]], [7.35, [130, -300], 'outBack'], [7.6, [130, -300]], [7.78, [80, -170]], [7.95, [130, -300], 'outBack'], [8.25, [130, -300]], [8.5, REST_R],
      [8.85, REST_R], [9.0, [110, -150], 'outBack'], [9.12, [100, -150]], [9.2, [80, -170]], [9.3, [130, -300], 'outBack'], [9.7, [130, -300]], [10.0, REST_R],
      [12.3, REST_R], [12.5, [140, -285], 'outBack'], [13.2, [140, -285]], [13.72, [185, -190]], [14.6, [185, -190]], [14.95, REST_R],
      [15.75, REST_R], [15.92, [-26, -212]], [16.0, [-20, -214]], [16.18, [160, -150], 'outCubic'], [16.5, REST_R],
      [18.2, REST_R], [18.35, [110, -300], 'outBack'], [18.7, [110, -300]], [18.85, REST_R],
    ]).slice();
    p.handR[1] += shake;
    if (t > 18.35 && t < 18.7) p.handR[0] += Math.sin((t - 18.35) * 16) * 22;
    p.handL = FAN_L;
    return { x, y: 1230, s: 2.0, p };
  };

  const deAt = (t) => {
    if (t < 10.35 || t > 15.6) return null;
    const x = kfv(t, [[10.35, 2250], [10.95, 1480, 'outBack'], [13.3, 1480], [13.65, 1310], [14.8, 1310], [15.55, 2350, 'inCubic']]);
    const p = RR.personIdle(t, 2, { turn: -0.6, look: [-1, -0.1], mouth: 'smile', prop: 'clipboard', propHand: 'R' });
    p.lean = -0.22 * (1 - RR.seg(t, 10.35, 11.0, 'outCubic')) + 0.1 * RR.seg(t, 14.9, 15.1);
    if (t > 14.9) { p.walk = t * 11; p.turn = 0.5; p.look = [0.8, 0]; }
    if (t >= 11.1 && t < 12.4) Object.assign(p, { mouth: 'talk', talkT: t + 0.3, brow: 'up', look: [-0.8, -0.3] });
    else if (t >= 12.4 && t < 13.0) Object.assign(p, { mouth: 'flat', brow: 'worried' });
    else if (t >= 13.0 && t < 13.3) Object.assign(p, { mouth: 'smile', brow: 'up', headTilt: 0.12 * Math.sin((t - 13.0) * 30) });
    else if (t >= 13.3 && t < 14.9) Object.assign(p, { mouth: 'grin', eyes: t > 13.7 ? 'happy' : 'open' });
    const shake = 10 * Math.sin((t - 13.75) * 24) * RR.env(t, 13.75, 14.5, 0.1, 0.15);
    p.handL = kfv(t, [[11.15, REST_L], [11.35, [-150, -290], 'outBack'], [12.3, [-150, -290]], [12.55, REST_L], [13.3, REST_L], [13.72, [-180, -190]], [14.6, [-180, -190]], [14.95, REST_L]]).slice();
    p.handL[1] += shake;
    p.handR = kfv(t, [[14.85, [62, -150]], [15.0, [100, -290], 'outBack']]);
    if (t < 14.85) p.handR = [62, -150];
    return { x, y: 1230, s: 2.0, p };
  };

  const huAt = (t) => {
    let x, y;
    const p = RR.personIdle(t, 3, { turn: -0.7, look: [-1, 0], mouth: 'smile' });
    if (t >= 8.3 && t < 10.55) {
      x = kfv(t, [[8.3, 2250], [8.8, 1790, 'outBack'], [10.2, 1790], [10.55, 2350, 'inCubic']]);
      y = 1250;
      p.lean = -0.2;
      if (t < 9.3) Object.assign(p, { look: [-0.8, -0.8], brow: 'up', mouth: 'grin' });
      else if (t < 9.9) Object.assign(p, { look: [-1, 0.1], brow: 'worried', mouth: 'o' });
      else Object.assign(p, { eyes: 'happy', mouth: 'grin', hop: 26 * Math.sin(Math.PI * RR.seg(t, 9.9, 10.2)) });
      p.handL = kfv(t, [[8.7, REST_L], [8.9, [-140, -300], 'outBack'], [9.35, [-140, -300]], [9.55, [-60, -170]], [9.85, [-60, -170]], [10.0, [-110, -290], 'outBack'], [10.25, [-110, -290]]]);
      p.handR = [60, -170];
    } else if (t >= 13.1 && t < 15.45) {
      // peeking side-eye: a near-static pose, so it is a cached (boiling) sprite, not a live figure
      x = kfv(t, [[13.1, 2250], [13.5, 1800, 'outBack'], [14.95, 1800], [15.45, 2350, 'inCubic']]);
      const pose = t < 13.9 ? 'flat' : Math.floor(t * 8) % 2 ? 'grinA' : 'grinB';
      return { x, y: 1275, s: 2.0, sprite: pose, lean: -0.12 };
    } else return null;
    return { x, y, s: 2.0, p };
  };
  const HU_BASE = { turn: -0.4, look: [-1, 0.15], brow: 'sly', blink: 0, squash: 0 };
  const HU_POSES = {
    flat: { ...HU_BASE, mouth: 'flat', handL: [-22, -172], handR: [24, -168] },
    grinA: { ...HU_BASE, mouth: 'grin', handL: [-16, -174], handR: [18, -166] },
    grinB: { ...HU_BASE, mouth: 'grin', handL: [-28, -170], handR: [30, -170] },
  };
  const HU_SPR = { w: 380, h: 540, gy: 660 }; // ground point sits below the sprite (legs are off screen)
  const huSprite = (name) => RR.sprite('s09:hu:' + name, HU_SPR.w, HU_SPR.h, () => RR.drawPerson('hu', HU_SPR.w / 2, HU_SPR.gy, 2.0, HU_POSES[name]), { res: 1, variants: 2 });

  // ---------------------------------------------------------------- deck and discard (screen)
  const DECK = [720, 885], DISCARD = [905, 885], PILE_W = 118;
  const pilesDy = (t) => 320 * (1 - RR.seg(t, 15.35, 15.75, 'outBack')) + 360 * RR.seg(t, 18.6, 19.1, 'inCubic');
  const DRAWS = [['protect', 16.7, 17.1], ['drones2', 17.2, 17.6]];

  // ---------------------------------------------------------------- scene
  RR.scene({
    id: 's09_main', order: 9, dur: 20, music: 'main',
    cues: [
      [0.1, 'brush'], [0.4, 'hop', 0.4], [0.8, 'hop', 0.4], [1.25, 'hop', 0.6], [1.3, 'deal'],
      [2.05, 'tick', 0.5], [2.65, 'pop'], [3.05, 'whoosh'], [3.3, 'flip'], [3.1, 'paper'], [3.95, 'slide'], [4.0, 'tock'],
      [6.25, 'paper'], [6.62, 'tock'], [6.7, 'paper', 0.6], [6.9, 'pop'], [7.05, 'pop'], [7.2, 'pop'],
      [7.35, 'whoosh', 0.5], [7.95, 'tock'], [7.95, 'whoosh', 0.5], [8.55, 'tock'], [8.4, 'hop'], [9.3, 'whoosh', 0.5], [9.9, 'tock'], [9.95, 'ding'],
      [10.45, 'slide'], [11.1, 'pop', 0.6], [12.3, 'pop', 0.6], [12.9, 'paper'], [13.3, 'hop', 0.5], [13.75, 'pop'], [13.8, 'sparkle'],
      [15.0, 'whoosh', 0.6], [15.4, 'paper'], [16.0, 'whoosh', 0.6], [16.35, 'slide'], [16.45, 'paper', 0.6],
      [16.7, 'deal'], [17.05, 'flip'], [17.2, 'deal'], [17.55, 'flip'], [17.65, 'ding'], [18.3, 'hop', 0.4], [18.8, 'whoosh'],
    ],
    draw(t) {
      const cam = camAt(t);
      const fr = frAt(t), de = deAt(t), hu = huAt(t);

      // ---- world: board, queue, votes
      RR.withCam(cam, () => {
        BD.drawState(S8, { skip: { queue: true } });
        // vacancy pulse on space 8, then the new card's arrival glow
        const [x8, y8] = BD.slot(8);
        glowRing(x8, y8, 206, 282, RR.C.gold, RR.env(t, 2.1, LAND_K8 - 0.05, 0.3, 0.1) * (0.6 + 0.4 * Math.sin(t * 9)));
        glowRect(x8, y8, 190, 265, RR.C.gold, RR.env(t, LAND_K8, 5.0, 0.05, 0.6));
        // glows on cards being voted on / talked about
        const glows = {
          3: [RR.C.fr, RR.env(t, 7.9, 8.9, 0.1, 0.4) + RR.env(t, 12.4, 13.8, 0.2, 0.3)],
          2: [RR.C.green, RR.env(t, 9.85, 10.7, 0.1, 0.4)],
          4: [RR.C.de, RR.env(t, 11.2, 12.6, 0.2, 0.3)],
        };
        for (const c of S8.queue) {
          const [x, y] = BD.slot(c.k);
          if (glows[c.k]) glowRect(x, y, 190, 265, glows[c.k][0], glows[c.k][1]);
          RR.drawCard(c.id, x, y, { w: 190, flip: c.k <= 4.5 ? 1 : 0 });
          if (c.k <= 4) for (const q of cubesOn(c.k, t)) {
            if (q.land > t) continue;
            const u = q.land > 0 ? RR.seg(t, q.land, q.land + 0.28) : 1;
            const sq = u < 1 ? Math.sin(Math.PI * u) * (1 - u) : 0;
            RR.drawCube(q.pos[0], q.pos[1], 32, q.role, { sx: 1 + sq * 0.35, sy: 1 - sq * 0.45 });
          }
        }
        // the new policy, face down in space 8
        if (t >= LAND_K8) {
          const b = Math.exp(-(t - LAND_K8) * 9) * Math.sin((t - LAND_K8) * 26);
          RR.drawCard('back:policy', x8, y8, { w: 190 * (1 + 0.05 * b), flip: 0 });
        }
        // vote badges under the cards
        const pop = (a, b) => RR.pop(t, a, 0.3) * (1 - RR.seg(t, b, b + 0.25));
        const [x3] = BD.slot(3), [x2] = BD.slot(2);
        if (t > 7.9 && t < 10.7) countBadge((t < 8.55 ? 1 : 2) + '/' + COST[3], false, x3, 382, pop(7.95, 10.35) * (1 + 0.15 * Math.exp(-Math.abs(t - 8.6) * 14)));
        if (t > 9.15 && t < 10.9) countBadge((t < 9.9 ? 2 : 3) + '/' + COST[2], t >= 9.9, x2, 382, pop(9.2, 10.55) * (1 + 0.2 * Math.exp(-Math.abs(t - 9.95) * 12)));
      });
      RR.sparkle(...RR.toScreen(cam, [BD.slot(2)[0], 382]), t, 9.92, { n: 9, r: 100, col: RR.C.gold });

      // ---- influence track on the French player's board
      const pa = RR.pop(t, 6.2, 0.4) * (1 - RR.seg(t, 10.05, 10.4, 'inBack'));
      if (pa > 0.01) {
        push(); translate(PANEL[0], PANEL[1]); scale(pa);
        RR.drawSprite(panelSpr(), 0, 0, { w: 420, h: 150 });
        pop();
        // marker drops onto 3; spaces 1-3 light up
        const mk = RR.seg(t, 6.35, 6.62, 'outBounce');
        const c3 = circlePt(2);
        for (let i = 0; i < 3; i++) {
          const g = RR.seg(t, 6.65 + i * 0.07, 6.8 + i * 0.07) * pa;
          if (g > 0) RR.flatEllipse(circlePt(i)[0], circlePt(i)[1], 20 * g, 20 * g, RR.C.fr, 90);
        }
        if (mk > 0) RR.drawSprite(ringSpr(), c3[0], c3[1] - (1 - mk) * 120, { w: 74 * pa, h: 74 * pa, alpha: RR.seg(t, 6.35, 6.45) });
      }
      // three blue cubes pop out of the track and fly one by one onto the policies
      VOTES.forEach(([k, L], j) => {
        const P0 = 6.9 + j * 0.15, F = L - 0.6;
        if (t < P0 || t >= L) return;
        const c = circlePt(j);
        let pos, size = 50, rot = 0;
        if (t < F) {
          const u = RR.E.outBack(RR.seg(t, P0, P0 + 0.35));
          const h = hoverPt(j, t);
          pos = [c[0], RR.lerp(c[1], h[1], u)];
          size = 50 * RR.clamp(u * 1.2, 0, 1.1);
        } else {
          const q = cubesOn(k, L).find((qq) => qq.land === L);
          const target = RR.toScreen(cam, q.pos);
          const u = RR.seg(t, F, L, 'inOutSine');
          pos = RR.hop(hoverPt(j, F), target, u, 170);
          size = RR.lerp(50, 32 * cam.z, u);
          rot = Math.sin(Math.PI * u) * 0.7 + cam.r * u;
        }
        RR.drawCube(pos[0], pos[1], size, 'fr', { rot, shadow: t < F });
      });

      // ---- characters (screen space)
      if (hu && hu.sprite) RR.drawSprite(huSprite(hu.sprite), hu.x, hu.y, { w: HU_SPR.w, h: HU_SPR.h, rot: hu.lean, ax: 0.5, ay: HU_SPR.gy / HU_SPR.h });
      else if (hu) RR.drawPerson('hu', hu.x, hu.y, hu.s, hu.p);
      RR.drawPerson('fr', fr.x, fr.y, fr.s, fr.p);
      // the fan of cards in the French player's hand
      const pivot = personPt(fr.x, fr.y, fr.s, fr.p, FAN_L);
      for (const c of fanAt(t)) {
        const lift = liftOf(c.key, t);
        const pos = fanCardPos(pivot, c.ang, lift);
        RR.drawCard(CARD_OF[c.key], pos[0], pos[1], { w: FAN_W, rot: c.ang, lift: lift > 20 ? 0.4 : 0 });
      }
      RR.inkCircle(pivot[0] + 3, pivot[1] - 2, 21, { fill: RR.PEOPLE.fr.skin, w: 1 });
      if (de) RR.drawPerson('de', de.x, de.y, de.s, de.p);
      if (de) RR.sparkle(950, 850, t, 13.78, { n: 7, r: 90, col: RR.C.gold });

      // ---- the chosen policy flies face down to the back of the queue
      if (t >= 3.05 && t < LAND_K8) {
        const f0 = frAt(3.05), pv = personPt(f0.x, f0.y, f0.s, f0.p, FAN_L);
        const a0 = fanAng(HAND[0][1], 'drones1');
        const start = fanCardPos(pv, a0, liftOf('drones1', 3.05));
        const target = RR.toScreen(cam, BD.slot(8));
        const u = RR.seg(t, 3.05, LAND_K8, 'inOutSine');
        const pos = RR.hop(start, target, u, 190);
        RR.drawCard('drones', pos[0], pos[1], { w: RR.lerp(FAN_W, 190 * cam.z, u), rot: RR.lerp(a0, cam.r, u) + Math.sin(Math.PI * u) * 0.5, flip: 1 - RR.seg(t, 3.15, 3.6, 'inOutCubic'), lift: Math.sin(Math.PI * u) });
      }

      // ---- end of turn: discard one, draw back up to five
      const pdy = pilesDy(t);
      if (t > 15.3 && pdy < 340) {
        const [dx, dy] = DECK, [sx, sy] = DISCARD;
        for (let i = 0; i < 4; i++) RR.drawCard('back:policy', dx - i * 2.5, dy + pdy - i * 3.5, { w: PILE_W, flip: 0, rot: RR.hrange(i, -0.04, 0.04) });
        RR.flat(RR.rrectPts(sx - PILE_W / 2, sy + pdy - 82, PILE_W, 164, 12), RR.C.plumDark, 70);
        if (t >= 16.35) RR.drawCard('burgers', sx, sy + pdy, { w: PILE_W, rot: 0.1 });
        RR.text('deck', dx, sy + pdy + 128, { font: 'hand', size: 44, col: RR.C.white, outline: RR.C.plumDark, outlineW: 3 });
        RR.text('discard', sx, sy + pdy + 128, { font: 'hand', size: 44, col: RR.C.white, outline: RR.C.plumDark, outlineW: 3 });
      }
      if (t >= 16.0 && t < 16.35) { // flick the burger card to the discard pile
        const f0 = frAt(16.0), pv = personPt(f0.x, f0.y, f0.s, f0.p, FAN_L);
        const a0 = fanAng(HAND[1][1], 'burgers');
        const start = fanCardPos(pv, a0, liftOf('burgers', 16.0));
        const u = RR.seg(t, 16.0, 16.35, 'outQuad');
        const pos = RR.hop(start, [DISCARD[0], DISCARD[1] + pdy], u, 330);
        RR.drawCard('burgers', pos[0], pos[1], { w: RR.lerp(FAN_W, PILE_W, u), rot: RR.lerp(a0, 0.1 + Math.PI * 2, u), lift: Math.sin(Math.PI * u) });
      }
      for (const [key, a, b] of DRAWS) {
        if (t < a || t >= b) continue;
        const f1 = frAt(b), pv = personPt(f1.x, f1.y, f1.s, f1.p, FAN_L);
        const list = HAND.find(([T]) => T === b)[1];
        const ang = fanAng(list, key);
        const u = RR.seg(t, a, b, 'inOutSine');
        const pos = RR.hop([DECK[0], DECK[1] + pdy], fanCardPos(pv, ang, 0), u, 330);
        RR.drawCard(CARD_OF[key], pos[0], pos[1], { w: RR.lerp(PILE_W, FAN_W, u), rot: RR.lerp(0, ang, u) - Math.sin(Math.PI * u) * 0.4, flip: RR.seg(t, a + 0.1, b - 0.05, 'inOutCubic'), lift: Math.sin(Math.PI * u) });
      }
      // hand size counter
      if (t > 15.4 && t < 18.9) {
        const n = t < 16.0 ? 4 : t < 17.1 ? 3 : t < 17.6 ? 4 : 5;
        const bump = 1 + 0.25 * Math.exp(-Math.abs(t - [16.0, 17.1, 17.6].reduce((a, b) => (Math.abs(t - b) < Math.abs(t - a) ? b : a))) * 12);
        const ba = RR.pop(t, 15.5, 0.35) * (1 - RR.seg(t, 18.45, 18.7));
        const bp = personPt(fr.x, fr.y, fr.s, fr.p, [-146, -262]);
        countBadge(String(n), n === 5, bp[0], bp[1], ba * bump, 76);
      }

      // ---- words
      RR.banner('STEP 2: MAIN PHASE', t, 0.1, 2.3);
      RR.caption('Add a policy to the queue', t, 3.1, 5.9);
      RR.caption('Vote with your influence', t, 6.7, 10.2);
      if (de) RR.bubble('Back my policy?', 1360, 560, 1440, 790, t, 11.1, 12.55, { size: 48, w: 520 });
      RR.bubble('Only if you back mine!', 680, 560, 450, 790, t, 12.3, 13.95, { size: 48, w: 560 });
      RR.caption('Make deals... or break them', t, 12.9, 15.25, { y: 96 });
      RR.caption('Draw back up to 5', t, 16.45, 18.7, { x: 1330 });
    },
  });
})();
