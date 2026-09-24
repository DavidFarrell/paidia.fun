// Scene 7 (80-96 s): evaluating the front policy, and it passes. Protect Breeding Sites
// lifts into a close-up, its five votes are counted against the cost of 5 and PASSED is
// stamped. Yellow has the most votes, so the German agency decides where the effect
// happens: two raccoons leave Germany for the German score track and the Impact Tracker
// steps two spaces towards green. The paw icon scores Animal Rights a cube too. The card
// is discarded and the camera pulls back to the whole board.

(() => {
  const B = RR.board;
  const ECAM = RR.cam(1850, 680, 1.1);     // hand-off from s06
  const MCAM = RR.cam(780, 850, 1.2);      // Germany + Impact Tracker
  const FULL = RR.cam(1200, 750, 0.66);    // hand-off to s08

  // S6 without the evaluated card (it is drawn separately); S7 = the same with 2 fewer tokens.
  const S6 = B.clone(B.SETUP);
  S6.story[0] = 'corprelief';
  S6.queue = [
    { id: 'burgers', k: 1, votes: ['corp'] },
    { id: 'pets', k: 2, votes: ['ar', 'fr'] },
    { id: 'wear', k: 3, votes: ['hu', 'corp'] },
    { id: 'drones', k: 4, votes: [] },
    { id: 'back:policy', k: 5 }, { id: 'back:policy', k: 6 }, { id: 'back:policy', k: 7 },
  ];
  const VOTES = ['de', 'de', 'de', 'fr', 'ar'];

  // ---------------------------------------------------------------- timing
  const LIFT0 = 0.25, LIFT1 = 1.35;
  const LINE0 = 1.4;                                  // cubes hop into a counting line
  const TC = [2.4, 2.85, 3.3, 3.75, 4.2];             // counts 1..5
  const STAMP = 4.5;                                  // PASSED slams at STAMP + 0.22
  const MAJ = 6.2;                                    // yellow majority glows
  const DEUP = 6.55;                                  // German agency pops up
  const MOVE0 = 8.0, MOVE1 = 8.9;                     // to the map; card shrinks to an inset
  const TOK = [9.0, 10.1];                            // tokens lift off Germany
  const FLY = 0.55;
  const TRK = [9.62, 10.72];                          // tracker steps
  const DEDOWN = 11.95, ARUP = 12.4, PAW = 12.0, CUBE0 = 12.75, CUBE1 = 13.5;
  const OUT0 = 14.4;                                  // discard + pull back

  const SC = 520 / 190;                               // close-up: screen px per card unit
  const INSET = [1745, 255], INSET_S = 240 / 190;
  const CLOSE = [720, 470];

  // Card placement in screen space: position, scale (px per card unit), rotation, lift.
  const cardT = (t) => {
    const E0 = RR.toScreen(ECAM, B.EVAL);
    let x, y, s, rot = 0, lift = 0;
    if (t < MOVE0) {
      const u = RR.seg(t, LIFT0, LIFT1, 'inOutCubic');
      x = RR.lerp(E0[0], CLOSE[0], u);
      y = RR.lerp(E0[1], CLOSE[1], u) - 80 * Math.sin(Math.PI * u);
      s = Math.exp(RR.lerp(Math.log(ECAM.z), Math.log(SC), u));
      rot = -0.08 * Math.sin(Math.PI * u) + 0.012 * Math.sin(Math.PI * RR.seg(t, LIFT1 - 0.1, LIFT1 + 0.5)) ;
      lift = 0.35 * RR.seg(t, LIFT0, LIFT0 + 0.4) + 0.4 * Math.sin(Math.PI * u);
    } else {
      const u = RR.seg(t, MOVE0, MOVE1, 'inOutCubic');
      x = RR.lerp(CLOSE[0], INSET[0], u);
      y = RR.lerp(CLOSE[1], INSET[1], u) - 60 * Math.sin(Math.PI * u);
      s = Math.exp(RR.lerp(Math.log(SC), Math.log(INSET_S), u));
      rot = 0.06 * Math.sin(Math.PI * u);
      lift = 0.35;
    }
    if (t > OUT0) { // discard: slide off to the right
      const u = RR.seg(t, OUT0 + 0.05, OUT0 + 0.75, 'inBack');
      x += 700 * u; y -= 40 * u; rot += 0.45 * u;
    }
    return { x, y, s, rot, lift };
  };
  const withCard = (ct, fn) => { push(); translate(ct.x, ct.y); if (ct.rot) rotate(ct.rot); fn(); pop(); };
  // local card units -> screen
  const cardPt = (ct, p) => {
    const c = Math.cos(ct.rot), sn = Math.sin(ct.rot);
    return [ct.x + (p[0] * c - p[1] * sn) * ct.s, ct.y + (p[0] * sn + p[1] * c) * ct.s];
  };

  // Cube layout: B.cubesOnCard (3 + 2) at first, then a counting line of five.
  const L0 = (i) => {
    const n = VOTES.length, col = i % 3, row = Math.floor(i / 3), inRow = Math.min(3, n - row * 3);
    return [(col - (inRow - 1) / 2) * 32 * 1.15 + (row % 2) * 6, 38 - row * 32 * 0.9];
  };
  const L1 = (i) => [(i - 2) * 32, 42];
  const cubeState = (t, i) => {
    const u = RR.seg(t, LINE0 + i * 0.07, LINE0 + i * 0.07 + 0.34, 'inOutCubic');
    let [x, y] = RR.hop(L0(i), L1(i), u, 16);
    const size = RR.lerp(32, 30, u);
    // count hop
    y -= Math.sin(Math.PI * RR.seg(t, TC[i], TC[i] + 0.32)) * 15;
    // majority hop (yellow only)
    if (VOTES[i] === 'de') y -= Math.sin(Math.PI * RR.seg(t, MAJ + 0.05 + i * 0.06, MAJ + 0.35 + i * 0.06)) * 10;
    return { x, y, size, alpha: 1 };
  };

  // ---------------------------------------------------------------- painted props
  const STRIP_W = 380, STRIP_H = 84;
  const stripSprite = (role) => RR.sprite('s07:strip:' + role, STRIP_W, STRIP_H, () => {
    const body = RR.rrectPts(6, 8, STRIP_W - 12, STRIP_H - 16, 22);
    RR.water(body, RR.C.white, { layers: 8, alpha: 70, spread: 0.01, edge: 0.3 });
    RR.water(RR.rrectPts(8, 10, 70, STRIP_H - 20, 20), RR.C[role], { layers: 8, alpha: 60, spread: 0.02, edge: 0.3 });
    RR.ink(body, { stroke: RR.C.ink, w: 1, curve: 0.2 });
    push(); translate(44, STRIP_H / 2); RR.ICONS.role(22, { role }); pop();
    for (let i = 0; i < 5; i++) RR.inkCircle(114 + i * 56, STRIP_H / 2, 22, { fill: RR.C.paperShade, stroke: RR.C.inkSoft, w: 0.6 });
  }, { res: 1.5 });
  const slotPos = (strip, i) => [strip[0] - STRIP_W / 2 + 114 + i * 56, strip[1]];
  const DE_STRIP = (t) => [760, RR.lerp(-70, 96, RR.E.outBack(RR.seg(t, 8.55, 8.95))) - 180 * RR.seg(t, OUT0 + 0.1, OUT0 + 0.5, 'inBack')];
  const AR_STRIP = (t) => [RR.lerp(2150, 1700, RR.E.outBack(RR.seg(t, 12.1, 12.5))) + 500 * RR.seg(t, OUT0 + 0.1, OUT0 + 0.5, 'inBack'), 655];

  // PASSED stamp, painted once and slammed down as a sprite.
  const STAMP_SIZE = 84;
  const stampSprite = () => {
    const tw = RR.textWidth('PASSED', { font: 'title', size: STAMP_SIZE });
    const w = tw + STAMP_SIZE * 0.8, h = STAMP_SIZE * 1.2, W = Math.ceil(w + 40), H = Math.ceil(h + 40);
    return RR.sprite('s07:stamp', W, H, () => {
      push(); translate(W / 2, H / 2);
      RR.ink(RR.rrectPts(-w / 2, -h / 2, w, h, 12), { stroke: RR.C.greenDeep, w: 3.4, curve: 0.2, fill: RR.C.white, alpha: 150 });
      RR.ink(RR.rrectPts(-w / 2 + 10, -h / 2 + 10, w - 20, h - 20, 8), { stroke: RR.C.greenDeep, w: 1.4, curve: 0.2 });
      RR.text('PASSED', 0, STAMP_SIZE * 0.36, { font: 'title', size: STAMP_SIZE, col: RR.C.greenDeep });
      pop();
    }, { res: 1.3 });
  };
  const drawStamp = (t, x, y) => {
    if (t < STAMP) return;
    const k = RR.seg(t, STAMP, STAMP + 0.22, 'inQuad');
    const sc = RR.lerp(2.4, 1, k) + (k >= 1 ? 0.06 * Math.exp(-(t - STAMP - 0.22) * 12) * Math.sin((t - STAMP) * 40) : 0);
    const spr = stampSprite();
    push(); translate(x, y); rotate(-0.2); scale(sc);
    RR.drawSprite(spr, 0, 0, { w: spr.w, h: spr.h, alpha: RR.clamp(k * 1.4) });
    pop();
  };

  // Callout bubble next to the inset card, pointing at an icon on it.
  const bubbleSprite = () => RR.sprite('s07:bubble', 200, 116, () => {
    RR.ink(RR.rrectPts(8, 8, 184, 100, 40), { fill: RR.C.white, w: 1.2, curve: 0.2 });
  }, { res: 1.5 });
  const callout = (t, t0, t1, tip, draw) => {
    const a = RR.env(t, t0, t1, 0.2, 0.3);
    if (a <= 0) return;
    const k = RR.E.outBack(RR.seg(t, t0, t0 + 0.35));
    const c = [INSET[0], 505];
    push(); translate(c[0], c[1]); scale(k);
    const tail = [[-18, -40], [(tip[0] - c[0]) / k, (tip[1] - c[1]) / k], [18, -40]];
    RR.flat(RR.rrectPts(-92, -50, 184, 100, 40).map(([x, y]) => [x + 5, y + 7]), RR.C.ink, 40 * a);
    RR.ink(tail, { fill: RR.C.white, w: 1, curve: 0.1 });
    RR.drawSprite(bubbleSprite(), 0, 0, { w: 200, h: 116 });
    draw(a);
    pop();
  };

  // ---------------------------------------------------------------- people
  const person = (t) => {
    // German agency: pops up beside the close-up, walks to the corner, cheers, ducks away
    if (t >= DEUP && t < DEDOWN + 0.4) {
      const up = RR.E.outBack(RR.seg(t, DEUP, DEUP + 0.4));
      const down = RR.E.inBack(RR.seg(t, DEDOWN, DEDOWN + 0.35));
      const x = RR.tw(t, MOVE0, MOVE1, 1480, 1740, 'inOutCubic');
      const y = 1150 + (1 - up) * 420 + down * 440;
      let p = RR.personIdle(t, 1, { mouth: 'smile', turn: -0.4, look: [-1, -0.2], armL: 0.15, armR: 0.2 });
      p.squash = -0.12 * Math.sin(Math.PI * RR.seg(t, DEUP, DEUP + 0.3)) + 0.1 * Math.sin(Math.PI * RR.seg(t, DEUP + 0.3, DEUP + 0.55)) + p.squash;
      if (t < 7.15) p = { ...p, mouth: 'o', brow: 'up', look: [-1, 0.1] };
      else if (t < MOVE0) { // proud: "that's me!"
        const k = RR.E.outBack(RR.seg(t, 7.15, 7.45));
        p = { ...p, mouth: 'talk', talkT: t, eyes: t > 7.2 && t < 7.5 ? 'happy' : 'open', brow: 'up', armR: 0.2 + 2.3 * k, look: [-0.6, -0.3], turn: -0.2, hop: 10 * Math.sin(Math.PI * RR.seg(t, 7.15, 7.45)) };
      } else if (t < MOVE1 + 0.05) {
        p = { ...p, walk: t * 11, turn: 0.4, look: [1, 0], mouth: 'smile', armR: 0.3 + 0.2 * Math.sin(t * 11), armL: 0.3 - 0.2 * Math.sin(t * 11) };
      } else { // point at Germany
        const k = RR.E.outBack(RR.seg(t, MOVE1, MOVE1 + 0.3));
        p = { ...p, turn: -0.5, look: [-1, -1], mouth: 'smile', brow: 'neutral', handL: [RR.lerp(-50, -76, k), RR.lerp(-90, -200, k)] };
      }
      for (const t0 of TOK.map((a) => a + FLY)) {
        const c = RR.seg(t, t0, t0 + 0.5);
        if (c > 0 && c < 1) {
          const h = Math.sin(Math.PI * c);
          p = { ...p, hop: 26 * h, squash: -0.08 * h, eyes: 'happy', mouth: 'grin', armL: 2.7, armR: 2.7, handL: undefined, look: [0, 0], turn: 0 };
        }
      }
      if (t > 11.2 && t < DEDOWN) p = { ...p, handL: undefined, armL: 0.2, turn: 0, look: [0.2, 0.3], mouth: 'grin' };
      if (t >= DEDOWN) p = { ...p, eyes: 'happy', mouth: 'smile', armL: 0.2, handL: undefined };
      RR.drawPerson('de', x, y, 1.4, { prop: 'clipboard', ...p });
    }
    // Animal Rights: pops up in the corner when the paw scores and cheers
    if (t >= ARUP && t < OUT0 + 0.45) {
      const up = RR.E.outBack(RR.seg(t, ARUP, ARUP + 0.4));
      const down = RR.E.inBack(RR.seg(t, OUT0, OUT0 + 0.4));
      const y = 1150 + (1 - up) * 420 + down * 440;
      let p = RR.personIdle(t, 3, { mouth: 'o', brow: 'up', turn: -0.3, look: [-0.5, -1], armL: 0.15, armR: 0.2 });
      p.squash += -0.12 * Math.sin(Math.PI * RR.seg(t, ARUP, ARUP + 0.3));
      const c = RR.seg(t, CUBE1, CUBE1 + 0.55);
      if (t >= CUBE1) {
        const h = Math.sin(Math.PI * c);
        p = { ...p, hop: 30 * h, squash: -0.08 * h, eyes: 'happy', mouth: 'grin', brow: 'neutral', armL: 2.7, armR: 2.7, look: [0, 0], turn: 0 };
        if (c >= 1) p = { ...p, hop: 0, squash: p.squash, armL: 2.2 + 0.2 * Math.sin(t * 9), armR: 2.2 - 0.2 * Math.sin(t * 9), eyes: 'happy', mouth: 'grin' };
      } else if (t > CUBE0) p = { ...p, look: [-1, -1], mouth: 'o', turn: -0.5 };
      RR.drawPerson('ar', INSET[0], y, 1.4, p);
    }
  };

  // ---------------------------------------------------------------- overlays on the card
  // (drawn in "close-up pixels": the close-up card is 520 px wide, scaled with the card)
  const drawCardAndVotes = (t, ct) => {
    const k = ct.s / SC;
    withCard(ct, () => {
      scale(ct.s);
      RR.drawCard('protect', 0, 0, { w: 190, lift: ct.lift, screenScale: ct.s });
      // majority halo behind the yellow cubes
      const halo = RR.env(t, MAJ, MOVE0 + 0.4, 0.3, 0.4) * (0.8 + 0.2 * Math.sin(t * 8));
      VOTES.forEach((r, i) => {
        const c = cubeState(t, i);
        if (halo > 0 && r === 'de') { RR.flatEllipse(c.x, c.y + 3, 21, 19, RR.C.gold, 70 * halo); RR.flatEllipse(c.x, c.y + 3, 16, 14, RR.C.gold, 110 * halo); }
      });
      VOTES.forEach((r, i) => {
        const c = cubeState(t, i);
        RR.drawCube(c.x, c.y, c.size, r, { alpha: c.alpha });
      });
    });
    withCard(ct, () => {
      scale(k);
      // cost badge: highlighted while the votes are counted, pulses at the start and at 5
      const tab = [68 * SC, -106.5 * SC];
      const ring = RR.env(t, 1.95, STAMP + 0.3, 0.25, 0.3);
      if (ring > 0) {
        const rk = RR.E.outBack(RR.seg(t, 1.95, 2.3));
        RR.ink(RR.rrectPts(tab[0] - 72 * rk, tab[1] - 72 * rk, 144 * rk, 144 * rk, 26), { stroke: RR.C.gold, w: 2.6 * ring, fill: false, curve: 0.25 });
      }
      for (const p0 of [2.0, TC[4] + 0.1]) {
        const u = RR.seg(t, p0, p0 + 0.6);
        if (u > 0 && u < 1) {
          const pk = 1 + 0.3 * Math.sin(Math.PI * Math.min(1, u * 1.6));
          RR.flatEllipse(tab[0], tab[1], 95 * pk, 95 * pk, RR.C.gold, 120 * (1 - u));
          push(); translate(tab[0], tab[1]); scale(pk);
          RR.flat(RR.rrectPts(-58, -60, 116, 120, 16), RR.C.cardDark);
          RR.text('5', 0, 34, { font: 'title', size: 96, col: RR.C.card });
          pop();
        }
      }
      const tk = RR.pop(t, TC[4] + 0.2, 0.3) * (1 - RR.seg(t, STAMP + 0.1, STAMP + 0.3));
      if (tk > 0.01) RR.icon('tick', tab[0] + 132, tab[1] + 6, 150 * tk, { w: 5 });
      // count badges 1..5
      const fade = 1 - RR.seg(t, 5.9, 6.2);
      TC.forEach((t0, i) => {
        const sc = RR.pop(t, t0 + 0.06, 0.3) * fade;
        if (sc <= 0.01) return;
        const c = cubeState(t, i);
        RR.badge(i + 1, c.x * SC, (c.y - 36) * SC, { r: 32, scale: sc, bg: i === 4 ? RR.C.gold : RR.C.white });
      });
      // majority tally: 3 yellow, 1 blue, 1 pink
      const mfade = 1 - RR.seg(t, MOVE0 - 0.1, MOVE0 + 0.2);
      [['de', -32, '3', MAJ + 0.05], ['fr', 32, '1', MAJ + 0.2], ['ar', 64, '1', MAJ + 0.28]].forEach(([r, x, n, t0]) => {
        const sc = RR.pop(t, t0, 0.3) * mfade;
        if (sc > 0.01) RR.badge(n, x * SC, (r === 'de' ? -4 : 2) * SC, { r: r === 'de' ? 38 : 28, scale: sc, bg: RR.C[r], col: RR.C.ink });
      });
      // PASSED
      drawStamp(t, -40, -175);
    });
  };

  // Tokens flying from Germany to the German score strip (screen space).
  const tokenFlight = (t, i, cam) => {
    const spot = B.SPOTS.de[9 - i];
    const t0 = TOK[i];
    const u = RR.seg(t, t0, t0 + FLY);
    const p0 = RR.toScreen(cam, [spot[0], spot[1] - 4]);
    const p1 = slotPos(DE_STRIP(t), i);
    if (t < t0) return;
    const size = 48;
    if (u < 1) {
      const e = RR.E.inOutQuad(u);
      const pos = RR.bezier(p0, [p0[0] - 60, p0[1] - 260], [p1[0] + 240, p1[1] - 140], p1, e);
      const pop = 1 + 0.35 * Math.sin(Math.PI * RR.seg(u, 0, 0.35));
      RR.drawToken(pos[0], pos[1], size * pop, 'yellow', { rot: -0.6 * Math.sin(Math.PI * u) });
    } else {
      const land = RR.seg(t, t0 + FLY, t0 + FLY + 0.25);
      const sq = Math.sin(Math.PI * land) * 0.18;
      RR.drawToken(p1[0], p1[1], size * 0.92, 'yellow', { sx: 1 + sq, sy: 1 - sq });
    }
  };

  // ---------------------------------------------------------------- scene
  RR.scene({
    id: 's07_pass', order: 7, dur: 16, music: 'pass',
    cues: [
      [0.25, 'whoosh', 0.6], [0.35, 'paper', 0.6], [0.95, 'paper'], [1.42, 'hop', 0.5], [1.6, 'tock', 0.5], [2.0, 'tick', 0.7],
      ...TC.flatMap((t0) => [[t0 + 0.06, 'tick'], [t0 + 0.3, 'tock']]),
      [TC[4] + 0.12, 'tick'], [STAMP + 0.2, 'stamp'], [STAMP + 0.32, 'ding'], [5.0, 'paper'],
      [MAJ, 'sparkle', 0.6], [DEUP, 'pop'], [DEUP + 0.05, 'boing', 0.5], [6.7, 'paper'],
      [MOVE0, 'whoosh', 0.6], [8.55, 'paper', 0.5], [8.7, 'sparkle', 0.5],
      [TOK[0], 'poof'], [TOK[0] + FLY, 'tock'], [TRK[0], 'hop', 0.6], [TRK[0] + 0.3, 'sparkle'], [9.2, 'paper'],
      [TOK[1], 'poof'], [TOK[1] + FLY, 'tock'], [TRK[1], 'hop', 0.6], [TRK[1] + 0.3, 'sparkle'], [TOK[0] + FLY + 0.05, 'cheer', 0.35],
      [PAW, 'sparkle'], [12.1, 'paper', 0.5], [12.2, 'paper'], [ARUP, 'pop'], [CUBE0, 'hop'], [CUBE1, 'tock'], [CUBE1 + 0.05, 'cheer', 0.4],
      [OUT0 + 0.1, 'slide'], [OUT0 + 0.2, 'whoosh', 0.6],
    ],
    draw(t) {
      let cam = RR.camKf(t, [[0, ECAM], [MOVE0, ECAM], [MOVE1, MCAM], [OUT0, MCAM], [15.75, FULL]]);
      const d = RR.env(t, MOVE1 - 0.3, OUT0 + 0.8, 1.0, 1.0);
      if (d > 0) cam = RR.drift(cam, t, d);
      const sh = RR.shake(t, STAMP + 0.22, 0.35, 7);

      // board state: tokens leave Germany, tracker steps towards green, evaluated card gone
      const st = B.clone(S6);
      const gone = TOK.filter((t0) => t >= t0).length;
      st.tokens.de = 10 - gone;
      st.tracker = RR.kf(t, [[TRK[0], 0], [TRK[0] + 0.32, -1, 'inOutQuad'], [TRK[1], -1], [TRK[1] + 0.32, -2, 'inOutQuad']]);

      RR.withCam(cam, () => {
        B.drawState(st);
        // the evaluated card sits on the board until it lifts off
        if (t < LIFT0) {
          push(); translate(...B.EVAL);
          RR.drawCard('protect', 0, 0, { w: 190, lift: 0 });
          B.cubesOnCard(0, 0, VOTES, { size: 32 });
          pop();
        }
        // poof where each token leaves; tracker sparkles
        TOK.forEach((t0, i) => { const s = B.SPOTS.de[9 - i]; RR.poof(s[0], s[1], t, t0, { r: 34, dur: 0.5 }); });
        TRK.forEach((t0, i) => {
          const p = B.track(-1 - i);
          RR.sparkle(p[0], p[1], t, t0 + 0.28, { r: 90, n: 9, size: 16, col: i ? RR.C.greenLight : RR.C.gold, seed: i * 5 });
          const g = RR.env(t, t0 + 0.25, t0 + 1.0, 0.1, 0.5);
          if (g > 0) RR.flatEllipse(p[0], p[1], 56, 56, RR.C.greenLight, 110 * g);
        });
      });

      // focus: dim the board behind the close-up
      const dim = RR.env(t, LIFT0, MOVE0 + 0.6, 0.8, 0.6);
      if (dim > 0) RR.fadeScreen(0.5 * dim);

      push(); translate(sh[0], sh[1]);
      // score strips
      if (t > 8.5 && t < OUT0 + 0.6) RR.drawSprite(stripSprite('de'), ...DE_STRIP(t), { w: STRIP_W, h: STRIP_H });
      if (t > 12.05 && t < OUT0 + 0.6) RR.drawSprite(stripSprite('ar'), ...AR_STRIP(t), { w: STRIP_W, h: STRIP_H });
      if (t < OUT0 + 0.6) TOK.forEach((t0, i) => { if (t >= t0 && t < OUT0 + 0.6) tokenFlight(t, i, cam); });
      // pink cube: out of the paw star, onto the Animal Rights strip
      if (t >= CUBE0 && t < OUT0 + 0.6) {
        const p0 = [INSET[0], 505], p1 = slotPos(AR_STRIP(t), 0);
        const u = RR.seg(t, CUBE0, CUBE1);
        if (u < 1) {
          const pos = RR.hop(p0, p1, RR.E.inOutQuad(u), 150);
          const pk = 1 + 0.3 * Math.sin(Math.PI * RR.seg(u, 0, 0.3));
          RR.drawCube(pos[0], pos[1], 46 * pk, 'ar', { rot: Math.sin(Math.PI * u) * -0.8 });
        } else {
          const sq = Math.sin(Math.PI * RR.seg(t, CUBE1, CUBE1 + 0.25)) * 0.18;
          RR.drawCube(p1[0], p1[1] - 2, 42, 'ar', { sx: 1 + sq, sy: 1 - sq });
        }
      }

      // the evaluated card
      const ct = cardT(t);
      if (t >= LIFT0 && t < OUT0 + 0.9) drawCardAndVotes(t, ct);

      // callouts: the effect, then the paw scoring star
      if (t < OUT0) {
        const ic = cardPt(ct, [-18, 92.5]);
        callout(t, 8.75, 11.9, ic, (a) => {
          RR.icon('mitigate', -34, 0, 96);
          RR.text('x2', 44, 16, { font: 'title', size: 48, col: RR.C.plumDark, alpha: a });
        });
        const st2 = cardPt(ct, [69, 106.5]);
        callout(t, PAW, CUBE0 + 0.2, st2, () => {
          const pk = 1 + 0.12 * Math.sin((t - PAW) * 9);
          RR.flatEllipse(0, 0, 44 * pk, 44 * pk, RR.C.gold, 90);
          RR.icon('scoreStar', 0, 0, 110 * pk, { role: 'ar' });
        });
      }
      person(t);
      pop();

      RR.caption('Count the votes', t, 0.95, 4.3);
      RR.caption('Enough votes? It passes!', t, 5.0, 6.55);
      RR.caption('Most votes decides where', t, 6.7, 8.45);
      RR.caption('Raccoons removed: impact down', t, 9.2, 11.9);
      RR.caption('Paw icon? Animal Rights scores too', t, 12.2, 14.35);
    },
  });
})();
