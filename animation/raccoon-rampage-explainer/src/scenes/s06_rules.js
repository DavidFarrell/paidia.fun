// Scenes 6-8: a round starts with a storyline event; step 1 of a turn moves
// the queue; the card that drops off is evaluated (pass and fail examples).

const toScreen = (bx, by, cx, cy, z) => [(bx - cx) * z + W / 2, (by - cy) * z + H / 2];
const toBoard = (sx, sy, cx, cy, z) => [(sx - W / 2) / z + cx, (sy - H / 2) / z + cy];
const EVAL_POS = [BOARD.evalX, 296];

// the turn-step HUD (top left): who is playing and which step we are on
function turnHUD(step, f, role, t = 1) {
  if (t <= 0) return;
  C.save();
  C.translate(0, -(1 - E.outBack(t)) * 220);
  P.rrect(28, 26, 700, 104, 40, { fill: rgba(PAL.plumDark, 0.9), lw: 3, seed: 1400, tex: 'mottle', texA: 0.35 });
  portrait(role, 84, 78, 42, { active: true, f });
  const steps = ['QUEUE', 'MAIN', 'DRAW'];
  steps.forEach((s, i) => {
    const on = i + 1 === step;
    const x = 150 + i * 190;
    P.rrect(x, 50, 176, 56, 24, { fill: on ? ROLES[role].col : '#6a5570', lw: 2.4, seed: 1401 + i, texA: 0.3 });
    T.draw(`${i + 1} ${s}`, x + 88, 80, { size: 34, col: on ? PAL.plumDark : PAL.lavender, spacing: 1 });
  });
  C.restore();
}

// draw the queue Q (slot -> card spec). If shiftAt is set, the whole queue
// moves one slot to the right from that frame: slot 1 drops into evaluation
// and the card arriving in slot 4 flips face up.
function drawQueue(Q, f, shiftAt = null, o = {}) {
  for (let i = 8; i >= 1; i--) {
    const spec = Q[i];
    if (!spec) continue;
    let [x, y] = qpos(i);
    let flip = spec.down ? 1 : 0;
    let rot = 0;
    if (shiftAt !== null) {
      const a = shiftAt + (i - 1) * 4;
      const t = ez(f, a, a + 24, E.io);
      if (i === 1 && o.skipFront && t > 0) continue;
      const [tx, ty] = i === 1 ? EVAL_POS : qpos(i - 1);
      x = lerp(x, tx, t);
      y = lerp(y, ty, t) - Math.sin(t * Math.PI) * 36;
      rot = Math.sin(t * Math.PI) * 0.05;
      if (i === 5) flip = 1 - ez(f, a + 16, a + 34, E.io);
      if (t > 0 && t < 1) cue('slide', a, 0.25);
    }
    card({ ...spec, x, y, w: CARD_W, h: CARD_H, flip, rot, votes: flip > 0.5 ? null : spec.votes, seed: 40 + i + (spec.title || '').length });
  }
}

function shiftQueue(Q) {
  const R = {};
  for (let i = 2; i <= 8; i++) if (Q[i]) R[i - 1] = { ...Q[i], down: i === 5 ? false : Q[i].down };
  return R;
}

// geometry of a policy card drawn at (x, y) with width w
function cardGeom(x, y, w) {
  const h = w * (CARD_H / CARD_W), k = w / 190;
  return {
    cost: [x + w / 2 - 30 * k, y - h / 2 + 30 * k],
    paw: [x + w / 2 - 26 * k, y + h / 2 - 26 * k],
    effect: [x - 18 * k, y - h / 2 + 118 * k + 0.42 * h],
    cube: (i, n) => {
      const cs = w * 0.18, r = Math.floor(i / 5), c = i % 5, m = Math.min(5, n - r * 5);
      return [x + (c - (m - 1) / 2) * cs * 1.08, y + h * 0.34 - r * cs * 0.78];
    },
    h,
  };
}

function ring(x, y, r, f, col = PAL.cardCream) {
  C.save();
  C.strokeStyle = col;
  C.lineWidth = 6;
  C.globalAlpha *= 0.6 + 0.4 * Math.sin(f * 0.4);
  C.beginPath();
  C.arc(x, y, r * (1 + 0.08 * Math.sin(f * 0.4)), 0, TAU);
  C.stroke();
  C.restore();
}

// ---- 6: a round begins with a storyline event ---------------------------
scene({
  id: 'event', bars: 3, mood: 'bouncy', trans: { type: 'fade', len: 12 },
  draw(f) {
    tableBG(f);
    const [sx, sy] = storyPos(0);
    const zin = ez(f, 0, 40, E.io) * (1 - ez(f, 150, 178, E.io));
    const cx = lerp(1200, sx + 240, zin), cy = lerp(760, sy - 180, zin), z = lerp(0.69, 1.35, zin);
    const flipT = ez(f, 36, 52, E.io);
    cue('flip', 38, 0.7);
    const lift = ez(f, 54, 80, E.outBack) * (1 - ez(f, 144, 170, E.io));
    cam(cx, cy, z, 0, () => {
      boardBase();
      mapSpaces(1);
      drawTokens(startTokens(), f);
      trackerMarker(0, f);
      drawQueue(QUEUE0, f);
      card({ type: 'spreadBack', x: BOARD.deck[0], y: BOARD.deck[1], w: CARD_W, h: CARD_H, seed: 90 });
      for (let k = 1; k < 5; k++) card({ type: 'back', x: storyPos(k)[0], y: storyPos(k)[1], w: 150, h: 200, seed: 70 + k });
      if (lift <= 0) {
        const ev = STORY_EVENTS[0];
        card({ type: 'event', title: ev.title, art: ev.art, artBg: ev.bg, artT: 1, x: sx, y: sy, w: 150, h: 200, flip: 1 - flipT, backType: 'back', seed: 70 });
      }
    });
    if (lift > 0) {
      // the event card lifts up to the middle of the screen, its picture comes alive
      const [ex, ey] = toScreen(sx, sy, cx, cy, z);
      const x = lerp(ex, W / 2 - 220, lift), y = lerp(ey, H / 2 + 10, lift), s = lerp(z, 3.3, lift);
      P.glow(x, y, 520 * lift, PAL.cardCream, 0.35 * lift);
      const ev = STORY_EVENTS[0];
      card({ type: 'event', title: ev.title, art: ev.art, artBg: ev.bg, artT: seg(f, 70, 130), x, y, w: 150 * s, h: 200 * s, seed: 70, tagline: 'IMMEDIATELY' });
      cue('whoosh', 56, 0.6);
      const chips = [['ONGOING', 'for the rest of the game'], ['IMMEDIATELY', 'happens right now'], ['ACTIVE', 'until its goal is met']];
      chips.forEach(([name, desc], i) => {
        const a = 92 + i * 14;
        const t = ez(f, a, a + 12, E.outBack) * (1 - ez(f, 142, 150, E.inQ));
        if (t <= 0) return;
        C.save();
        C.translate(1330, 340 + i * 150);
        C.scale(t, t);
        P.rrect(-20, -52, 560, 104, 30, { fill: PAL.cardCream, lw: 3, seed: 1410 + i, texA: 0.35 });
        T.draw(name, 18, -12, { size: 46, col: PAL.plumDark, align: 'left', spacing: 2 });
        T.draw(desc, 18, 28, { size: 32, col: PAL.plumMid, align: 'left', head: false });
        C.restore();
        cue('pop', a, 0.5);
      });
    }
    caption(f, 24, 168, 'EVERY ROUND, A STORY EVENT CHANGES THE RULES', { size: 54 });
  },
});

// ---- 7: step 1, the queue moves -------------------------------------------
scene({
  id: 'queue', bars: 4, mood: 'bouncy', trans: { type: 'fade', len: 14 },
  draw(f) {
    tableBG(f);
    const z = kf(f, [[0, 0.8], [40, 0.88, E.io], [190, 0.9], [236, 1.25, E.io]]);
    const cx = kf(f, [[0, 1180], [190, 1180], [236, 1700, E.io]]);
    const cy = kf(f, [[0, 520], [190, 520], [236, 360, E.io]]);
    cam(cx, cy, z, 0, () => {
      boardBase();
      mapSpaces(1);
      drawTokens(startTokens(), f);
      trackerMarker(0, f);
      card({ type: 'spreadBack', x: BOARD.deck[0], y: BOARD.deck[1], w: CARD_W, h: CARD_H, seed: 90 });
      drawQueue(QUEUE0, f, 52);
      // arrow sweeping along the queue
      drawArrow([[qx(8) - 40, 34], [qx(4), 22], [BOARD.evalX + 40, 40]], f, 40, 80, { w: 9 });
      tag(qx(4), 470, 'FLIPS FACE UP', f, 110, 236, { size: 46 });
      tag(BOARD.evalX, 470, 'EVALUATE IT', f, 124, 236, { size: 46 });
      if (f > 130 && f < 190) ring(EVAL_POS[0], EVAL_POS[1], 150, f);
      tag(qx(8), 470, 'EMPTY SLOT', f, 138, 236, { size: 46 });
    });
    turnHUD(1, f, 'de', ez(f, 4, 20));
    cue('whoosh', 6, 0.4);
    caption(f, 16, 230, 'STEP 1: THE QUEUE MOVES ALONG ONE SPACE', { size: 56 });
  },
});

// ---- 8: evaluation ------------------------------------------------------
const Q1 = shiftQueue(QUEUE0);                                  // after the first move
const Q1b = { ...Q1, 8: { type: 'back', down: true } };          // a new policy joins at the back later
const Q2 = shiftQueue(Q1b);                                      // after the next turn's move

scene({
  id: 'evaluate', bars: 8, mood: 'bouncy', trans: { type: 'fade', len: 14 },
  draw(f) {
    tableBG(f);
    // camera: on the card while counting, over the map for the effects,
    // back to the queue for the next turn
    const CX = kf(f, [[0, 1700], [30, 1560, E.io], [136, 1560], [166, 1020, E.io], [246, 1020], [276, 1480, E.io], [400, 1480], [440, 1200, E.io]]);
    const CY = kf(f, [[0, 360], [30, 560, E.io], [136, 560], [166, 790, E.io], [246, 790], [276, 520, E.io], [400, 520], [440, 700, E.io]]);
    const Z = kf(f, [[0, 1.25], [30, 0.95, E.io], [136, 0.95], [166, 0.8, E.io], [246, 0.8], [276, 0.95, E.io], [400, 0.95], [440, 0.7, E.io]]);
    const shake = f > 418 && f < 450 ? Math.sin(f * 2.1) * 10 * (1 - seg(f, 418, 450)) : 0;
    const bigX = 1480, bigY = 450, bigS = 2.1, bigW = CARD_W * bigS;
    // the passed card stays big until it flies away at f 244 (drawn separately)
    const up1 = f < 244 ? ez(f, 4, 30, E.outBack) : 0;
    const pass = seg(f, 96, 110);
    // the two raccoons mitigated from Germany go to the German player's score
    const toks = startTokens();
    toks[0].r = 170; toks[0].noFly = true;
    toks[1].r = 186; toks[1].noFly = true;
    const trk = kf(f, [[0, 0], [194, 0], [204, -1, E.outBack], [210, -1], [220, -2, E.outBack]]);
    const shift2 = 268;
    const up2 = ez(f, shift2, shift2 + 34, E.io);
    const fail = seg(f, 368, 380);
    const crumple = seg(f, 392, 418);

    C.save();
    C.translate(shake, 0);
    cam(CX, CY, Z, 0, () => {
      boardBase();
      mapSpaces(1);
      drawTokens(toks, f);
      trackerMarker(trk, f);
      card({ type: 'spreadBack', x: BOARD.deck[0], y: BOARD.deck[1], w: CARD_W, h: CARD_H, seed: 90,
        rot: f > 410 ? Math.sin(f * 1.3) * 0.08 * (1 - seg(f, 440, 470)) : 0, glow: f > 400 ? '#e2574c' : null });
      if (f < shift2) drawQueue({ ...Q1, 8: f >= 264 ? Q1b[8] : null }, f);
      else drawQueue(Q1b, f, shift2, { skipFront: true });
      if (f > 248 && f < 264) {
        // a new policy joins at the back (added during the turn's main phase)
        const t = ez(f, 248, 264, E.outQ);
        card({ type: 'back', x: lerp(-200, qx(8), t), y: qpos(8)[1], w: CARD_W, h: CARD_H, seed: 48 });
      }
    });
    C.restore();

    // score boards slide up while the effects happen
    const deBoard = [420, 985], arBoard = [880, 985], bs = 0.75;
    const deScore = (f > 194 ? 1 : 0) + (f > 210 ? 1 : 0);
    const bt = ez(f, 140, 160, E.outBack) * (1 - ez(f, 246, 262, E.inQ));
    if (bt > 0) {
      C.save();
      C.translate(0, (1 - bt) * 300);
      playerBoard('de', ...deBoard, bs, { score: deScore, scoreT: f > 210 ? seg(f, 210, 222) : seg(f, 194, 206), pieces: ['token', 'token'], tokenKind: 'de', glow: seg(f, 160, 170) });
      playerBoard('ar', ...arBoard, bs, { score: f > 240 ? 1 : 0, scoreT: seg(f, 240, 252), glow: seg(f, 226, 236) * (1 - seg(f, 248, 254)) });
      C.restore();
    }
    // star positions on the boards (first two stars)
    const star = (b, k) => [b[0] + (-205 + k * 68) * bs, b[1] + 22 * bs];
    [[0, 170], [1, 186]].forEach(([i, a]) => {
      const t = seg(f, a, a + 24);
      if (t <= 0 || t >= 1) return;
      const [sx, sy] = toScreen(...deSlot(i), CX, CY, Z);
      const [tx, ty] = star(deBoard, i);
      const [x, y] = arcPos(E.io(t), sx, sy, tx, ty, 200);
      token(x, y, lerp(36 * Z, 26, t), 'de', i, { rot: t * 5 });
      cue('pop', a, 0.6);
    });
    cue('score', 195, 0.6); cue('score', 211, 0.6); cue('score', 241, 0.7);
    popText(...toScreen(...trackPos(-1), CX, CY, Z), '-1', f, 198, { col: PAL.good });
    popText(...toScreen(...trackPos(-2), CX, CY, Z), '-1', f, 214, { col: PAL.good });
    if (f > 196 && f < 236) ring(...toScreen(...trackPos(trk), CX, CY, Z), 46, f, PAL.good);
    cue('step', 198, 0.6); cue('step', 214, 0.6);
    tag(...toScreen(1072, 640, CX, CY, Z), 'YELLOW CHOOSES GERMANY', f, 150, 196, { size: 40 });

    // the evaluated card, enlarged
    if (up1 > 0) {
      const [ex, ey] = toScreen(...EVAL_POS, CX, CY, Z);
      const x = lerp(ex, bigX, up1), y = lerp(ey, bigY, up1), w = lerp(CARD_W * Z, bigW, up1);
      const spec = QUEUE0[1];
      const counted = Math.floor(seg(f, 38, 96) * 5.99);
      const g = cardGeom(x, y, w);
      card({ ...spec, x, y, w, h: g.h, votes: spec.votes, stamp: pass > 0 ? 'pass' : null, stampT: pass, seed: 41 + spec.title.length,
        glow: pass > 0 && f < 150 ? '#8fd18a' : null });
      if (f > 26 && f < 96) ring(...g.cost, 44, f);
      for (let i = 0; i < counted; i++) {
        const [qx2, qy2] = g.cube(i, 5);
        countBadge(qx2, qy2 - 58, i + 1, f, 38 + i * 12);
        cue('tick', 38 + i * 12, 0.6);
      }
      cue('stamp', 97, 1);
      if (f > 118 && f < 240) {
        for (let i = 0; i < 3; i++) P.glow(...g.cube(i, 5), 60, PAL.yellow, 0.6);
        const [c0x, c0y] = g.cube(1, 5);
        const ct = ez(f, 120, 132, E.outBack);
        C.save();
        C.translate(c0x, c0y - 80 - ct * 10);
        C.scale(ct, ct);
        P.shape([[-30, 10], [-34, -24], [-14, -6], [0, -32], [14, -6], [34, -24], [30, 10]], { fill: '#f1c542', lw: 3, seed: 1420, smooth: 0.1, texA: 0.3 });
        C.restore();
        cue('sparkle', 121, 0.7);
      }
      if (f > 160 && f < 226) ring(...g.effect, 40, f);
      if (f > 222 && f < 250) ring(...g.paw, 34, f, PAL.pink);
      if (f > 226 && f < 242) {
        const t = seg(f, 226, 242);
        const [tx, ty] = star(arBoard, 0);
        const [px, py] = arcPos(E.io(t), g.paw[0], g.paw[1], tx, ty, 240);
        cube(px, py, 30, PAL.pink, 1430);
      }
    }
    if (f >= 244 && f < 268) {
      const t = seg(f, 244, 268);
      card({ ...QUEUE0[1], x: bigX + t * 800, y: bigY - Math.sin(t * Math.PI) * 120, w: bigW, h: CARD_H * bigS, rot: t * 0.6, stamp: 'pass', seed: 63 });
      cue('whoosh', 246, 0.5);
    }
    if (up2 > 0 && crumple < 1) {
      const [ex, ey] = toScreen(...qpos(1), CX, CY, Z);
      const spec = Q1[1];
      let x = lerp(ex, bigX, up2), y = lerp(ey, bigY, up2) - Math.sin(up2 * Math.PI) * 60, w = lerp(CARD_W * Z, bigW, up2);
      if (crumple > 0) {
        const [dx, dy] = toScreen(...BOARD.deck, CX, CY, Z);
        x = lerp(bigX, dx, E.inQ(crumple)); y = lerp(bigY, dy, E.inQ(crumple)) - Math.sin(crumple * Math.PI) * 140;
        w = lerp(bigW, 20, E.inQ(crumple));
      }
      const g = cardGeom(x, y, w);
      card({ ...spec, x, y, w, h: g.h, rot: crumple * 5, votes: spec.votes, stamp: fail > 0 ? 'fail' : null, stampT: fail, seed: 41 + spec.title.length });
      if (crumple <= 0) {
        if (f > 322 && f < 372) ring(...g.cost, 44, f, '#e2574c');
        const counted = Math.floor(seg(f, 326, 370) * 4.99);
        for (let i = 0; i < counted; i++) {
          const [qx2, qy2] = g.cube(i, 4);
          countBadge(qx2, qy2 - 58, i + 1, f, 326 + i * 11);
          cue('tick', 326 + i * 11, 0.6);
        }
      }
      cue('fail', 369, 1);
      cue('crumple', 392, 0.8);
    }
    if (f > 418) {
      const t = ez(f, 418, 440, E.outBack);
      P.glow(W / 2, H / 2, 900 * t, '#e2574c', 0.3);
      raccoon({ x: W / 2 + 330, y: H + 70 - t * 40, s: 2.6 * t, suit: true, shades: true, mouth: 'grin', prop: 'sign', arms: [1.3, 1.3], seed: 77, shadow: false });
      cue('boom', 420, 0.9);
    }
    turnHUD(1, f, f < 262 ? 'de' : 'fr', 1);
    caption(f, 28, 132, 'ENOUGH VOTES? THE POLICY PASSES', { size: 56 });
    caption(f, 140, 240, 'MOST VOTES DECIDES WHERE IT TAKES EFFECT', { size: 46, top: true, x: 1230 });
    caption(f, 252, 304, 'NEXT TURN...', { size: 56 });
    caption(f, 312, 392, 'NOT ENOUGH VOTES?', { size: 58 });
    caption(f, 400, 470, 'THE RACCOONS SPREAD!', { size: 68, top: true, x: 1230 });
  },
});
