// Scene 11 (152-168 s): end of the game.
// Opens on s10's closing board (STATES.S10, FULL); calendar pages flutter past (time passes)
// and hide the jump to STATES.END, the last three storyline events flip,
// the four face-up policies get one last vote (passes resolve, fails are simply
// discarded: no spread), then the tracker check. Red: the raccoons party and everyone
// loses... record scratch, rewind. Green: the scores count up and the Animal Rights
// player is crowned. A plum ink wipe covers the frame for the finale.

(() => {
  const B = RR.board, C = RR.C;

  // ---------------------------------------------------------------- cameras
  const FULL = RR.cam(1200, 750, 0.66);
  const SF = RR.cam(1200, 870, 0.74);    // gentle push towards the storyline row
  const EF = RR.cam(1085, 560, 0.9);     // queue + tracker for the final vote
  const TC = RR.cam(850, 850, 1.0);      // tracker check
  const TCB = RR.cam(800, 880, 1.06);    // push towards the green end

  // ---------------------------------------------------------------- start state
  // RR.board.STATES.END (after five rounds): Raccoonimation [FR] 1/5 fails, Rural
  // Sterilisation 4/4 passes (one Rest-of-Europe raccoon), Raccoon Land 5/5 passes (Germany
  // has the majority: one German and one Rest-of-Europe raccoon mitigated), Raccoon Helpline
  // 1/3 fails. Tokens DE 9, FR 6, rest 9; tracker +4.
  const S0 = B.clone(B.STATES.END);
  const QUEUE = S0.queue;
  // The scene opens on s10's closing board (STATES.S10 at FULL, pixel for pixel) and jumps to
  // END only once the falling calendar pages cover the queue row (the only part that changes).
  const S10 = B.STATES.S10, SWAP = 0.3;

  // ---------------------------------------------------------------- timings
  const FLIPS = { 2: ['bigfarm', 0.95], 3: ['freetrade', 1.4], 4: ['burns', 1.85] };
  const EV = [
    { k: 1, t0: 3.0, pass: false },
    { k: 2, t0: 3.65, pass: true },
    { k: 3, t0: 4.3, pass: true },
    { k: 4, t0: 5.1, pass: false },
  ];
  const VERDICT = 0.28, DISCARD = 0.46;
  // token index -> time it leaves: Sterilisation (k2) takes the last Rest-of-Europe raccoon,
  // then Raccoon Land (k3) mitigates the last German raccoon and the next Rest-of-Europe one.
  // Outcome B (after the rewind): four more raccoons leave, one per tracker step (+1 to -3).
  const { de: DE0, fr: FR0, roe: ROE0 } = S0.tokens;
  const REMOVE = {
    roe: { [ROE0 - 1]: 4.0, [ROE0 - 2]: 4.86, [ROE0 - 3]: 10.44, [ROE0 - 4]: 11.04 },
    de: { [DE0 - 1]: 4.64, [DE0 - 2]: 10.84 },
    fr: { [FR0 - 1]: 10.64 },
  };
  const STEPS = [[4.12, 4, 3], [4.74, 3, 2], [4.97, 2, 1]];            // tracker steps [start, from, to]
  const STEPS_B = [[10.55, 1, 0], [10.75, 0, -1], [10.95, -1, -2], [11.15, -2, -3]];
  const SCR = 9.6, FRZ = 9.72, RWE = 10.15;                             // record scratch, freeze end, rewind end
  const HERO = [1165, 950], FRIENDS = [[860, 890, 0], [1540, 880, 1]];
  const POP_T = [6.95, 7.1, 7.25];
  const FINAL = { de: 7, fr: 8, ar: 9, hu: 6 };
  const CROWN_T = 13.05;
  const ROW = [['de', 720], ['fr', 980], ['ar', 1240], ['hu', 1500]];
  const ROW_Y = 1168, ROW_S = 1.1;

  // Party time runs forwards, freezes on the scratch, then rewinds to just before the check.
  const aTime = (t) => (t < SCR ? t : t < FRZ ? SCR : RR.lerp(SCR, 6.62, RR.E.inOutQuad(RR.seg(t, FRZ, RWE))));

  // ---------------------------------------------------------------- sprites
  const PAGE_COL = [C.red, C.teal, C.plumMid, C.orange];
  const PAGE_NUM = ['12', '31', '7', '24'];
  const pageSpr = (v) => RR.sprite('s11:page' + v, 300, 360, (w, h) => {
    RR.ink(RR.rrectPts(10, 18, w - 20, h - 28, 14), { fill: C.white, w: 1.1, curve: 0.1 });
    RR.ink(RR.rrectPts(10, 18, w - 20, 84, 14), { fill: PAGE_COL[v], stroke: false });
    RR.inkLine([[24, 102], [w - 24, 102]], { col: C.ink, w: 0.8 });
    for (const x of [90, 210]) RR.ink(RR.rrectPts(x - 8, 4, 16, 44, 8), { fill: C.inkSoft, w: 0.8 });
    for (let r = 0; r < 2; r++) for (let c = 0; c < 7; c++) RR.flatEllipse(46 + c * 35, 300 + r * 26, 5, 5, C.lilac);
    RR.text(PAGE_NUM[v], w / 2, 270, { font: 'title', size: 150, col: C.plumDark });
  }, { res: 1 });

  const markSpr = (pass) => RR.sprite('s11:mark:' + (pass ? 'tick' : 'cross'), 140, 140, () => {
    RR.inkCircle(70, 70, 58, { fill: C.white, stroke: pass ? C.greenDeep : C.red, w: 1.8 });
    if (pass) RR.inkLine([[38, 72], [62, 98], [104, 42]], { col: C.greenDeep, w: 4.2, curve: 0.1 });
    else {
      RR.inkLine([[44, 44], [96, 96]], { col: C.red, w: 4.2 });
      RR.inkLine([[96, 44], [44, 96]], { col: C.red, w: 4.2 });
    }
  }, { res: 1.5 });

  const noSpr = () => RR.sprite('s11:nospread', 240, 240, () => {
    RR.inkCircle(120, 120, 100, { stroke: C.red, w: 4 });
    RR.inkCircle(120, 120, 94, { stroke: C.red, w: 2.5 });
    RR.inkLine([[52, 52], [188, 188]], { col: C.red, w: 4.5 });
  }, { res: 1.3 });

  // rubbish confetti for the raccoon party
  const JUNK = {
    banana: () => {
      RR.ink([[45, 18], [54, 20], [58, 46], [48, 58], [40, 46], [38, 22]], { fill: '#f0cf5a', w: 0.9, curve: 0.4 });
      RR.ink([[42, 44], [18, 62], [14, 74], [28, 70], [46, 54]], { fill: '#f0cf5a', w: 0.9, curve: 0.4 });
      RR.ink([[52, 44], [74, 60], [78, 72], [64, 68], [48, 54]], { fill: '#e8c04a', w: 0.9, curve: 0.4 });
      RR.ink([[45, 50], [44, 76], [50, 80], [52, 54]], { fill: '#f5dc7a', w: 0.8, curve: 0.4 });
      RR.ink(RR.rrectPts(43, 10, 10, 12, 3), { fill: '#6b5132', stroke: false });
    },
    can: () => {
      RR.ink(RR.rrectPts(26, 16, 38, 60, 8), { fill: '#d9574a', w: 1 });
      RR.inkEllipse(45, 18, 19, 6, { fill: '#c7cfd4', w: 0.8 });
      RR.ink(RR.rrectPts(30, 38, 30, 14, 4), { fill: C.white, stroke: false });
      RR.inkLine([[34, 56], [40, 64], [36, 70]], { col: '#8e3a31', w: 0.7 });
    },
    core: () => {
      RR.ink([[30, 22], [60, 22], [52, 44], [60, 68], [30, 68], [38, 44]], { fill: '#f3e6c4', w: 0.9, curve: 0.5 });
      RR.ink([[26, 18], [64, 18], [62, 28], [28, 28]], { fill: '#cf4b45', w: 0.8, curve: 0.5 });
      RR.ink([[28, 64], [62, 64], [64, 74], [26, 74]], { fill: '#cf4b45', w: 0.8, curve: 0.5 });
      RR.inkLine([[45, 18], [48, 6]], { col: '#6b5132', w: 1.2 });
      RR.flatEllipse(42, 44, 2.5, 4, '#5a3b25'); RR.flatEllipse(49, 46, 2.5, 4, '#5a3b25');
    },
    paper: () => {
      RR.ink(RR.ellipsePts(45, 45, 28, 25, 11), { fill: '#f6f1e6', w: 1, curve: 0.2 });
      RR.inkLine([[26, 40], [40, 48], [52, 36], [64, 46]], { col: C.inkSoft, w: 0.6, curve: 0.2 });
      RR.inkLine([[32, 58], [46, 54], [58, 62]], { col: C.inkSoft, w: 0.6, curve: 0.2 });
    },
    fish: () => {
      RR.ink([[66, 45], [80, 32], [80, 58]], { fill: '#d8d2c4', w: 0.9, curve: 0.2 });
      RR.inkLine([[22, 45], [68, 45]], { col: C.ink, w: 1.1 });
      for (let i = 0; i < 4; i++) RR.inkLine([[32 + i * 9, 34], [36 + i * 9, 45], [32 + i * 9, 56]], { col: C.ink, w: 0.8, curve: 0.4 });
      RR.ink(RR.ellipsePts(18, 45, 12, 10, 10), { fill: '#d8d2c4', w: 0.9 });
      RR.flatEllipse(15, 42, 2.5, 2.5, C.ink);
    },
    crisps: () => {
      RR.ink([[22, 20], [68, 16], [72, 72], [20, 76]], { fill: C.teal, w: 1, curve: 0.25 });
      RR.inkLine([[22, 26], [68, 22]], { col: C.tealDark, w: 0.8 });
      RR.inkLine([[20, 68], [72, 66]], { col: C.tealDark, w: 0.8 });
      RR.ink(RR.starPts(46, 46, 14, 7, 5), { fill: C.gold, stroke: false });
    },
  };
  const JUNK_N = Object.keys(JUNK);
  const junkSpr = (n) => RR.sprite('s11:junk:' + n, 90, 90, JUNK[n], { res: 1.2 });

  // two dancing friends, two frames each (cheap sprite animation)
  const friendSpr = (v, f) => RR.sprite(`s11:friend${v}${f}`, 280, 310, () => {
    const b = f ? -1 : 1;
    RR.drawRaccoon(140, 296, 1.0, {
      face: v ? -1 : 1, col: v ? '#a0949f' : C.fur, eyes: 'happy', mouth: f ? 'cackle' : 'grin', brow: 'sly',
      armF: f ? 1.75 : 0.45, armB: f ? 1.1 : 2.9, lean: 0.12 * b, headTilt: -0.1 * b, tail: f * 2, tailUp: 1,
    });
  }, { res: 1.2 });

  // the four players, pre-painted in the few poses this scene needs
  const PPOSE = {
    watch: (r) => ({ look: [-0.9, -0.7], mouth: 'o', brow: 'up', turn: -0.35, headTilt: -0.05 }),
    slump: (r) => ({ eyes: 'closed', mouth: 'frown', brow: 'worried', turn: -0.1, headTilt: r === 'fr' || r === 'hu' ? 0.2 : -0.2, armL: 0.02, armR: 0.02, blush: 0 }),
    count: (r) => ({ look: [0.9, -0.8], mouth: 'o', brow: 'up', turn: 0.4, headTilt: 0.05 }),
    clapA: (r) => ({ eyes: 'happy', mouth: 'grin', turn: 0.15, handL: [-40, -148], handR: [40, -148] }),
    clapB: (r) => ({ eyes: 'happy', mouth: 'smile', turn: 0.15, handL: [-8, -156], handR: [8, -156] }),
  };
  const personSpr = (role, pose) => RR.sprite(`s11:p:${role}:${pose}`, 320, 380, () => {
    RR.drawPerson(role, 160, 366, 1, PPOSE[pose](role));
  }, { res: 1.1 });

  // ---------------------------------------------------------------- helpers
  const trackerAt = (t) => {
    let v = S0.tracker;
    for (const [ts, a, b] of t < 10.3 ? STEPS : STEPS.concat(STEPS_B)) if (t >= ts) v = RR.lerp(a, b, RR.seg(t, ts, ts + 0.2, 'inOutQuad'));
    return v;
  };
  const drawMarkerAt = (v, pulse = 0) => {
    const p = RR.along(B.TRACK_PATH, (RR.clamp(v, -7, 7) + 7) / 14);
    const f = v - Math.floor(v);
    const hop = Math.sin(Math.PI * f) * 30;
    RR.drawMarker(p[0], p[1] - 6 - hop, 74 * (1 + 0.1 * Math.sin(Math.PI * f) + pulse));
  };
  // Pulsing rings around a run of tracker spaces (native strokes: cheap).
  const zoneGlow = (lo, hi, col, a, endR) => {
    if (a <= 0.01) return;
    RR.flush();
    const c = color(col);
    noFill();
    for (let i = lo; i <= hi; i++) {
      const [x, y] = B.track(i);
      const big = Math.abs(i) === 7;
      c.setAlpha(230 * a); stroke(c); strokeWeight(big ? 9 : 7);
      circle(x, y, big ? endR : 76);
    }
    noStroke();
  };
  const tokenPop = (t, kind, n) => Array.from({ length: n }, (_, i) => {
    const tr = REMOVE[kind] && REMOVE[kind][i];
    if (tr === undefined || t < tr) return 1;
    const u = RR.seg(t, tr, tr + 0.3);
    return u < 0.35 ? 1 + 0.5 * RR.E.outQuad(u / 0.35) : 1.5 * (1 - RR.E.inQuad((u - 0.35) / 0.65));
  });
  const tokenPos = (kind, i) => (kind === 'roe' ? B.SQUARES[i].pos : B.SPOTS[kind][i]);
  // Dark tray under a card's vote cubes (same layout as B.cubesOnCard at size 32), so the
  // cubes read against the busy card art (Raccoon Land's yellow sign under three German votes).
  const voteTray = (n, a = 1) => {
    const rows = Math.ceil(n / 3), cols = Math.min(3, n);
    const hw = (cols - 1) * 18.4 + 25 + (rows > 1 ? 3 : 0);
    const top = 38 - (rows - 1) * 28.8 - 25;
    RR.flat(RR.rrectPts(-hw, top, 2 * hw, 62 - top, 14), C.plumDark, 125 * a);
  };

  // ---------------------------------------------------------------- board pieces
  const drawStory = (t) => {
    // the NEW ROUND circle pulses as each year's event flips
    RR.flush();
    noFill();
    for (const i of [2, 3, 4]) {
      const u = RR.seg(t, FLIPS[i][1] - 0.05, FLIPS[i][1] + 0.45);
      if (u <= 0 || u >= 1) continue;
      const c = color(C.gold); c.setAlpha(230 * (1 - u)); stroke(c); strokeWeight(10 * (1 - u) + 2);
      circle(330, B.STORY_Y, 150 + 90 * RR.E.outCubic(u));
    }
    noStroke();
    for (let i = 0; i < 5; i++) {
      const [x, y] = B.story(i);
      if (i < 2) { RR.drawCard(S0.story[i], x, y, { w: 300 }); continue; }
      const [id, tf] = FLIPS[i];
      const f = RR.seg(t, tf, tf + 0.32, 'inOutCubic');
      const up = Math.sin(Math.PI * f);
      const glow = RR.env(t, tf + 0.16, tf + 0.9, 0.05, 0.3);
      RR.drawCard(id, x, y - 30 * up, { w: 300, flip: f, lift: up * 0.9, glow: glow > 0.05 ? C.gold : null });
    }
  };
  const drawDeck = (t) => {
    const [dx, dy] = B.DECK;
    let tw = 0;
    for (const e of EV) if (!e.pass) tw = Math.max(tw, Math.sin(Math.PI * RR.seg(t, e.t0 + VERDICT, e.t0 + VERDICT + 0.24)));
    RR.drawCard('back:spread', dx, dy - 30 * tw, { w: 190, lift: tw, rot: 0.06 * tw * Math.sin(t * 50) });
    const k = RR.pop(t, EV[0].t0 + VERDICT + 0.2, 0.3);
    const a = 1 - RR.seg(t, 5.95, 6.3);
    if (k > 0 && a > 0) {
      const e = EV[3].t0 + VERDICT + 0.2;
      const pulse = 1 + 0.14 * Math.sin(Math.PI * RR.seg(t, e, e + 0.25));
      // slow (p5 image) path: the fast blit of this sprite right after the deck card came out
      // blank in every rendered frame, so the "no spread" sign was never seen
      RR.drawSprite(noSpr(), dx, dy, { w: 250 * k * pulse, h: 250 * k * pulse, alpha: a, rot: -0.05, slow: true });
    }
  };
  const drawQueue = (t) => {
    for (const c of QUEUE) {
      const [x0, y0] = B.slot(c.k);
      const ev = EV.find((e) => e.k === c.k);
      let x = x0, y = y0, rot = 0, lift = 0, glow = null, alpha = 1, pops;
      if (ev) {
        const on = RR.env(t, ev.t0, ev.t0 + 0.8, 0.12, 0.25);
        lift = 0.8 * on; glow = on > 0.05 ? C.gold : null; y -= 16 * on;
        pops = c.votes.map((_, i) => 1 + 0.45 * Math.sin(Math.PI * RR.seg(t, ev.t0 + 0.04 + i * 0.032, ev.t0 + 0.16 + i * 0.032)));
        if (!ev.pass) {
          const u = RR.seg(t, ev.t0 + DISCARD, ev.t0 + DISCARD + 0.42);
          if (u >= 1) continue;
          y -= 600 * RR.E.inBack(u); x += 110 * u * u; rot = 0.7 * u * u; alpha = 1 - RR.seg(u, 0.75, 1);
        }
      }
      push(); translate(x, y); if (rot) rotate(rot);
      RR.drawCard(c.id, 0, 0, { w: 190, flip: c.k <= 4 ? 1 : 0, lift, glow, alpha });
      if (c.votes && c.votes.length) {
        voteTray(c.votes.length, alpha);
        B.cubesOnCard(0, 0, c.votes, { size: 32, pop: pops });
      }
      if (ev && t >= ev.t0 + VERDICT) {
        // over the title and text, clear of the votes and the cost, so "5 votes, cost 5, tick" reads
        const k = RR.pop(t, ev.t0 + VERDICT, 0.3);
        const settle = ev.pass ? RR.seg(t, ev.t0 + 0.8, ev.t0 + 1.1, 'inOutCubic') : 0;
        const s = 116 * k * RR.lerp(1, 0.86, settle);
        RR.drawSprite(markSpr(ev.pass), -4, -66, { w: s, h: s, rot: -0.12, alpha });
      }
      pop();
      if (ev && ev.pass) RR.sparkle(x0, y0 - 10, t, ev.t0 + VERDICT, { r: 150, n: 10, size: 22 });
    }
  };
  const drawTokens = (t) => {
    B.drawTokens(S0.tokens, { pop: { de: tokenPop(t, 'de', DE0), fr: tokenPop(t, 'fr', FR0), roe: tokenPop(t, 'roe', ROE0) } });
    for (const kind in REMOVE) for (const i in REMOVE[kind]) {
      const [x, y] = tokenPos(kind, +i);
      RR.poof(x, y - 4, t, REMOVE[kind][i] + 0.12, { r: 46 });
      RR.sparkle(x, y, t, REMOVE[kind][i] + 0.1, { r: 70, n: 6, size: 14, col: C.greenLight, seed: +i });
    }
  };

  // ---------------------------------------------------------------- the party (world space)
  const drawJunk = (tA, front) => {
    for (let i = 0; i < 24; i++) {
      const n = JUNK_N[i % JUNK_N.length];
      if (front) { // burst thrown up by the Raccoon
        if (i >= 10) break;
        const age = tA - 7.08 - i * 0.02;
        if (age < 0 || age > 1.6) continue;
        const a = -Math.PI / 2 + RR.hrange(i + 300, -0.8, 0.8), v = RR.hrange(i + 310, 900, 1300);
        const x = HERO[0] + Math.cos(a) * v * age, y = HERO[1] - 200 + Math.sin(a) * v * age + 1700 * age * age;
        RR.drawSprite(junkSpr(n), x, y, { w: 70, h: 70, rot: age * RR.hrange(i + 320, -9, 9) });
      } else { // steady rain of rubbish
        const age = tA - 7.3 - RR.hr(i + 60) * 1.6;
        if (age < 0) continue;
        const cyc = age % 3.0;
        const x = 600 + RR.hr(i + 80) * 1180 + Math.sin(age * 2.2 + i) * 40;
        const y = 290 + cyc * (380 + RR.hr(i + 90) * 160);
        RR.drawSprite(junkSpr(n), x, y, { w: 60, h: 60, rot: age * RR.hrange(i + 70, -5, 5) });
      }
    }
  };
  const drawParty = (tA, t) => {
    if (tA < POP_T[0] - 0.05) return;
    drawJunk(tA, false);
    const beat = (tA - 7.0) / 0.5;
    const groove = RR.seg(tA, 7.2, 7.5);
    const hop = Math.abs(Math.sin(Math.PI * beat)) * groove;
    const ph = ((beat % 1) + 1) % 1;
    const land = Math.max(0, 1 - Math.min(ph, 1 - ph) / 0.14) * groove;
    FRIENDS.forEach(([x, y, v], i) => {
      const k = RR.pop(tA, POP_T[i + 1], 0.4);
      RR.poof(x, y - 20, tA, POP_T[i + 1] - 0.04, { r: 60 });
      if (k <= 0) return;
      const f = Math.floor(beat + (v ? 0.5 : 0)) & 1;
      const h = (v ? Math.abs(Math.cos(Math.PI * beat)) * groove : hop) * 30;
      RR.shadow(x, y + 4, 60 * k, 12 * k, 30);
      RR.drawSprite(friendSpr(v, f), x, y - h, { w: 280 * 1.1 * k, h: 310 * 1.1 * k, ax: 0.5, ay: 296 / 310, sy: 1 - 0.12 * land });
    });
    // the Raccoon (live)
    const k = RR.pop(tA, POP_T[0], 0.4);
    RR.poof(HERO[0], HERO[1] - 30, tA, POP_T[0] - 0.04, { r: 80 });
    if (k > 0) {
      const sw = Math.cos(Math.PI * beat);
      let pose = RR.raccoonIdle(tA, {
        eyes: 'happy', mouth: Math.floor(beat * 2) & 1 ? 'cackle' : 'grin', brow: 'sly',
        armF: RR.lerp(1.8, 1.2 + 0.65 * sw, groove), armB: RR.lerp(2.9, 2.0 - 0.9 * sw, groove),
        lean: 0.14 * sw * groove, headTilt: -0.12 * sw * groove, tail: tA * 9, tailUp: 1,
        squash: 0.16 * land - 0.06 * hop,
      });
      if (tA < 7.2) pose = { ...pose, eyes: 'wide', mouth: 'open', brow: 'up', squash: -0.15 * (1 - RR.seg(tA, 6.95, 7.2)) };
      const caught = RR.env(t, SCR, FRZ + 0.06, 0.02, 0.05);
      if (caught > 0) pose = { ...pose, eyes: 'wide', mouth: 'o', brow: 'up', look: [0, 0.3], headTilt: 0.1 };
      RR.shadow(HERO[0], HERO[1] + 4, 80 * k, 16 * k, 36);
      RR.drawRaccoon(HERO[0], HERO[1] - hop * 40, 1.45 * k, pose);
    }
    drawJunk(tA, true);
  };

  // ---------------------------------------------------------------- players (screen space)
  const drawPlayers = (tA, t) => {
    ROW.forEach(([role, x], i) => {
      const rise = RR.E.outBack(RR.seg(tA, 6.0 + i * 0.07, 6.4 + i * 0.07));
      if (rise <= 0) return;
      let pose = 'watch', dy = (1 - rise) * 400, sy = 1, rot = 0;
      if (t < RWE) {
        const ts = 6.75 + i * 0.08;
        if (tA >= ts) {
          pose = 'slump';
          const u = RR.seg(tA, ts, ts + 0.35);
          dy += 26 * RR.E.outBack(u) + 4 * Math.sin(tA * 2 + i);
          sy = 1 - 0.1 * Math.sin(Math.PI * Math.min(1, u * 1.4));
          rot = (i % 2 ? 0.05 : -0.05) * u;
        }
      } else {
        // outcome B: hop of relief as the marker lands in the green, then watch the scores
        const rel = Math.sin(Math.PI * RR.seg(t, 11.4 + i * 0.05, 11.75 + i * 0.05));
        dy -= 40 * rel; sy = 1 + 0.06 * rel;
        if (t >= 11.55) pose = 'count';
        if (t >= CROWN_T) {
          if (role === 'ar') {
            const c = t - CROWN_T;
            const jump = Math.abs(Math.sin(c * Math.PI * 2)) * 70 * Math.min(1, c * 6);
            RR.drawPerson('ar', x, ROW_Y, ROW_S, RR.personIdle(t, 2, {
              hop: jump, armL: 2.7 + 0.2 * Math.sin(c * 12), armR: 2.7 - 0.2 * Math.sin(c * 12),
              eyes: 'happy', mouth: 'grin', brow: 'up', squash: jump < 8 ? 0.08 : -0.05, blush: 1,
            }));
            return;
          }
          pose = Math.floor((t - CROWN_T) * 8 + i) & 1 ? 'clapA' : 'clapB';
        }
        dy += 3 * Math.sin(t * 2.3 + i);
      }
      RR.drawSprite(personSpr(role, pose), x, ROW_Y + dy, { w: 320 * ROW_S, h: 380 * ROW_S, ax: 0.5, ay: 366 / 380, sy, rot });
    });
  };

  // ---------------------------------------------------------------- scoreboard + confetti (screen space)
  const SB = { x: 1500, y: 290, gap: 92 };
  const drawScores = (t) => {
    const k = RR.seg(t, 11.55, 11.95, 'outBack');
    if (k <= 0) return;
    const sc = {};
    for (const r in FINAL) sc[r] = Math.min(FINAL[r], Math.max(0, Math.floor((t - 11.95) / 0.115)));
    push(); translate((1 - k) * 760, 0);
    const win = RR.seg(t, CROWN_T, CROWN_T + 0.3);
    const yy = SB.y + 2 * SB.gap;
    if (win > 0) RR.flat(RR.rrectPts(SB.x - 76, yy - 50, 452, 100, 26), C.gold, 170 * win * (0.75 + 0.25 * Math.sin(t * 9)));
    RR.scoreBoard(sc, { x: SB.x, y: SB.y, gap: SB.gap, max: 10 });
    const ck = RR.pop(t, CROWN_T, 0.4);
    if (ck > 0) RR.icon('crown', SB.x - 122, yy - 10, 118 * ck, {}, { rot: -0.3 + 0.06 * Math.sin(t * 5) });
    pop();
    RR.sparkle(SB.x - 122, yy - 10, t, CROWN_T + 0.05, { r: 120, n: 9, size: 22 });
  };
  const CONF = [C.pink, C.gold, C.teal, C.lilac, C.orange, C.greenLight];
  const drawConfetti = (t) => {
    for (let i = 0; i < 48; i++) {
      const age = t - CROWN_T - RR.hr(i + 200) * (i < 18 ? 0.15 : 0.9);
      if (age < 0) continue;
      let x, y;
      if (i < 18) { // burst from the winner
        const a = -Math.PI / 2 + RR.hrange(i + 210, -0.95, 0.95), v = RR.hrange(i + 220, 900, 1500);
        x = 1240 + Math.cos(a) * v * age + Math.sin(age * 4 + i) * 20 * age;
        y = 930 + Math.sin(a) * v * age + 1100 * age * age;
      } else {
        x = RR.hr(i + 230) * 1920 + Math.sin(age * 3 + i) * 30;
        y = -30 + age * RR.hrange(i + 240, 260, 420);
      }
      if (y > 1110 || y < -40) continue;
      const rot = age * RR.hrange(i + 250, -8, 8), fl = 0.25 + 0.75 * Math.abs(Math.cos(age * RR.hrange(i + 260, 5, 11)));
      const w = 11, h = 7 * fl, cr = Math.cos(rot), sr = Math.sin(rot);
      RR.flat([[-w, -h], [w, -h], [w, h], [-w, h]].map(([px, py]) => [x + px * cr - py * sr, y + px * sr + py * cr]), CONF[i % CONF.length]);
    }
  };

  // ---------------------------------------------------------------- overlays
  // Calendar pages fall through the frame (time passes). On the first frame only the first few
  // are peeking in at the top of s10's closing board; by SWAP the queue row (screen x 1000-1556,
  // y 98-290) is fully covered for frames 7-9 (two big pages at x 1150 and 1440 plus their
  // neighbours), so the jump from STATES.S10 to END never shows. Clear of the frame by ~0.9 s.
  // [start, x, scale, rot, spin, phase]
  const PAGE_D = 0.62;
  const PAGES = [
    [-0.08, 330, 1.1, 0.3, -1.6, 0.0], [-0.05, 1690, 1.15, -0.25, 1.8, 1.0], [-0.02, 880, 1.0, 0.1, 2.2, 2.0],
    [0.03, 1250, 1.2, -0.12, -1.2, 3.0], [0.05, 90, 1.05, 0.35, 1.4, 4.0], [0.08, 1080, 1.2, 0.15, 0.8, 5.0], [0.1, 1500, 1.25, -0.2, -0.9, 0.5],
    [0.12, 560, 1.1, -0.3, 2.0, 1.5], [0.15, 1150, 1.3, 0.06, 0.6, 2.5], [0.165, 1440, 1.3, -0.08, -0.6, 3.5], [0.18, 1860, 1.1, 0.4, 1.9, 4.5],
    [0.2, 320, 1.15, -0.2, -2.2, 5.5], [0.22, 1290, 1.25, 0.12, 1.0, 0.2], [0.24, 780, 1.1, -0.35, 1.7, 1.2], [0.25, 1010, 1.2, 0.2, -1.0, 2.2],
    [0.27, 1620, 1.15, -0.3, 1.3, 3.2], [0.3, 140, 1.0, 0.25, -1.5, 4.2], [0.32, 1120, 1.1, -0.15, 2.1, 5.2], [0.34, 1780, 1.2, 0.3, -1.8, 0.7], [0.36, 600, 1.05, 0.1, 1.2, 1.7],
  ];
  const drawPages = (t) => {
    if (t > 1.0) return;
    PAGES.forEach(([t0, x0, s, r0, spin, ph], i) => {
      const u = (t - t0) / PAGE_D;
      if (u <= 0 || u >= 1) return;
      const x = x0 + Math.sin(u * 5 + ph) * 40, y = -260 + u * 1760;
      RR.drawSprite(pageSpr(i % 4), x, y, { w: 300 * s, h: 360 * s * (0.82 + 0.18 * Math.cos(u * 8 + ph)), rot: r0 + u * spin });
    });
  };
  const drawRewind = (t) => {
    const rw = RR.env(t, SCR, RWE + 0.08, 0.04, 0.12);
    if (rw <= 0) return;
    RR.fadeScreen(0.14 * rw, C.plumDark);
    for (let i = 0; i < 16; i++) {
      const sp = RR.hrange(i + 3, 1400, 3200);
      const y = ((RR.hr(i + 5) * 1180 + t * sp) % 1180) - 50;
      const h = RR.hrange(i + 9, 4, 30);
      RR.flat([[0, y], [1920, y + RR.hrange(i, -6, 6)], [1920, y + h], [0, y + h]], i % 3 ? '#ffffff' : C.plumMid, RR.hrange(i + 2, 50, 130) * rw);
    }
    if (t > FRZ && t < RWE && Math.floor(t * 8) % 2 === 0) { // rewind symbol, top left
      for (const dx of [0, 64]) {
        RR.flat([[210 + dx, 70], [210 + dx, 170], [140 + dx, 120]].map(([x, y]) => [x + 5, y + 6]), C.ink, 90);
        RR.flat([[210 + dx, 70], [210 + dx, 170], [140 + dx, 120]], C.white, 235);
      }
    }
  };

  // Closing plum wipe, left to right (s12 uncovers with its trailing edge moving the same way).
  // RR.wipe's painted bands, but each band travels far past the right edge so its tip is still
  // moving fast as it crosses the frame, and the middle bands (the scoreboard) lead while the
  // outer ones follow: no bright scrap is left floating on the dark board. A darker rim runs
  // just ahead of each tip so the strokes read over the plum board too. Fully plum from WIPE_END.
  const WIPE_T = 14.8, WIPE_D = 0.62, WIPE_DELAY = [0.07, 0.02, 0, 0.03, 0.08, 0.12];
  const WIPE_END = WIPE_T + Math.max(...WIPE_DELAY) + WIPE_D;
  const plumWipe = (t) => {
    if (t < WIPE_T) return;
    if (t >= WIPE_END) { RR.fadeScreen(1, C.plumDark); return; }
    const W = RR.W, H = RR.H, bands = WIPE_DELAY.length;
    const shapes = [];
    for (let i = 0; i < bands; i++) {
      const k = RR.seg(t, WIPE_T + WIPE_DELAY[i], WIPE_T + WIPE_DELAY[i] + WIPE_D, 'inOutSine');
      if (k <= 0) continue;
      const y0 = (i / bands) * H - 40, y1 = ((i + 1) / bands) * H + 40;
      const xa = -260, xb = -260 + k * (W + 1200);
      const capW = RR.hrange(i * 50, 60, 85), cap = (s) => capW * RR.hrange(i * 50 + s, 0.92, 1.05);
      const pts = [];
      const N = 8, M = 12;
      for (let j = 0; j <= N; j++) pts.push([xa + (xb - xa) * (j / N), y0 + RR.hrange(i * 30 + j, -18, 18)]);
      for (let j = 1; j < M; j++) pts.push([xb + cap(j) * Math.sin((Math.PI * j) / M), y0 + ((y1 - y0) * j) / M]);
      for (let j = N; j >= 0; j--) pts.push([xa + (xb - xa) * (j / N), y1 + RR.hrange(i * 30 + j + 15, -18, 18)]);
      for (let j = 1; j < M; j++) pts.push([xa - cap(j + 20) * Math.sin((Math.PI * j) / M), y1 - ((y1 - y0) * j) / M]);
      shapes.push(pts);
    }
    for (const pts of shapes) RR.flat(pts.map(([x, y]) => [x + 16, y + 5]), '#271f2c', 255);
    for (const pts of shapes) RR.flat(pts, C.plumDark, 255);
  };

  // ---------------------------------------------------------------- scene
  RR.scene({
    id: 's11_endgame', order: 11, dur: 16, music: 'endgame',
    cues: [
      [0, 'paper'], [0.05, 'whoosh', 0.7], [0.95, 'flip'], [1.4, 'flip'], [1.85, 'flip'], [2.35, 'whoosh', 0.4],
      [3.0, 'tick', 0.5], [3.28, 'buzz'], [3.48, 'thud', 0.6], [3.62, 'whoosh', 0.35],
      [3.65, 'tick', 0.5], [3.93, 'ding'], [4.1, 'poof'], [4.32, 'tock'],
      [4.3, 'tick', 0.5], [4.58, 'ding'], [4.74, 'poof'], [4.94, 'tock'], [4.96, 'poof'], [5.17, 'tock'],
      [5.1, 'tick', 0.5], [5.38, 'buzz'], [5.72, 'whoosh', 0.35],
      [6.0, 'whoosh', 0.5], [6.45, 'tock'], [6.6, 'sad'], [6.95, 'pop'], [7.1, 'pop'], [7.25, 'pop'], [7.3, 'chitter'], [7.5, 'crumple', 0.6], [8.5, 'chitter', 0.7],
      [9.6, 'scratch'], [10.4, 'tock', 0.6],
      [10.54, 'poof', 0.8], [10.74, 'poof', 0.8], [10.75, 'tock'], [10.94, 'poof', 0.8], [10.95, 'tock'], [11.14, 'poof', 0.8], [11.15, 'tock'], [11.35, 'tock'], [11.42, 'ding'],
      [11.6, 'slide'], [11.95, 'drumroll'], [13.05, 'cheer'], [13.1, 'sparkle'], [14.8, 'whoosh'],
    ],
    draw(t) {
      if (t >= WIPE_END) { plumWipe(t); return; }   // covered: s12 uncovers from here
      const tA = aTime(t);
      // camera
      let cam = RR.camKf(t, [[0, FULL], [0.7, FULL], [2.3, SF, 'inOutSine'], [2.95, EF], [5.95, EF], [6.6, TC], [10.3, TC], [11.35, TCB], [11.6, TCB], [12.4, TC]]);
      cam = RR.drift(cam, t, 0.7 * RR.seg(t, 0, 1));   // exact FULL on the first frame (s10 hand-off)
      // record scratch: jolt, then a wobbling rewind
      const rw = RR.env(t, SCR, RWE + 0.05, 0.03, 0.1);
      const jolt = RR.shake(t, SCR, 0.25, 26);
      push();
      if (rw > 0 || jolt[0]) {
        translate(RR.W / 2 + jolt[0] + Math.sin(t * 57) * 12 * rw, RR.H / 2 + jolt[1]);
        rotate(Math.sin(t * 23) * 0.012 * rw);
        scale(1 + 0.02 * rw);
        translate(-RR.W / 2, -RR.H / 2);
      }
      RR.withCam(cam, () => {
        if (t < SWAP) { B.drawState(S10); return; }   // exactly s10's last frame, under the pages
        B.drawState(S0, { skip: { story: true, tracker: true, queue: true, deck: true, tokens: true } });
        drawStory(t);
        drawDeck(t);
        drawTokens(t);
        // tracker check: red zone (outcome A), green zone (outcome B)
        if (t < RWE) zoneGlow(0, 7, C.red, RR.env(tA, 6.64, 9.7, 0.25, 0.3) * (0.65 + 0.35 * Math.sin(tA * 10)), 176);
        else zoneGlow(-7, -1, C.greenDeep, RR.env(t, 10.45, 16, 0.25, 0.3) * (0.65 + 0.35 * Math.sin(t * 10)), 176);
        const focus = 0.22 * Math.sin(Math.PI * RR.seg(t < RWE ? tA : t, t < RWE ? 6.38 : 10.3, t < RWE ? 6.62 : 10.52));
        drawMarkerAt(trackerAt(t < RWE ? tA : t), focus);
        const mp = RR.along(B.TRACK_PATH, 4 / 14);
        RR.sparkle(mp[0], mp[1], t, 11.38, { r: 120, n: 10, size: 22, col: C.greenLight });
        drawQueue(t);
        if (t < RWE) drawParty(tA, t);
      });
      if (t > 5.9) {
        drawPlayers(tA, t);
        if (t >= RWE) { drawScores(t); drawConfetti(t); }
      }
      pop();

      // words
      RR.banner('AFTER 5 ROUNDS...', t, 0.55, 2.75);
      RR.caption('Last vote: no spread', t, 3.3, 5.85);
      RR.caption('Neutral or red? Everyone loses', t, 6.55, 9.45, { y: 92, x: 1150 });
      RR.caption("If it's green...", t, 10.25, 11.9, { y: 92, x: 1150 });
      RR.caption('Green? Highest score wins!', t, 12.05, 14.75, { y: 92, x: 1150 });

      drawRewind(t);
      drawPages(t);
      // ink wipe to the finale: fully plum from WIPE_END (15.54 s)
      plumWipe(t);
    },
  });
})();
