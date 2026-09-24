// Scene 10: steps 2 and 3 of a turn (French player active): add a policy
// face down, vote with your influence, negotiate, bend the rules with an
// action card, then draw back up to five cards.

const FR_HAND = [
  { type: 'policy', title: 'Raccoon-Proof Bins', cost: 3, owner: 'fr', art: 'bins', effect: { icon: 'mitigate', n: 1 } },
  { type: 'action', title: 'Behind the Scenes', art: 'puppet', phase: 'ANYTIME' },
  { type: 'policy', title: 'Drone Zappers', cost: 7, owner: 'fr', art: 'drone', effect: { icon: 'die', n: 1 }, score: 'hunt' },
  { type: 'policy', title: 'Raccoon Burgers', cost: 3, art: 'burger', effect: { icon: 'die', n: 2 }, score: 'hunt' },
  { type: 'action', title: 'Radical Rewrite', art: 'rewrite', phase: 'ANYTIME' },
];

function handFan(cards, f, o = {}) {
  const n = cards.length;
  cards.forEach((c, i) => {
    if (!c || (o.skip && o.skip.includes(i))) return;
    const a = (i - (n - 1) / 2) * 0.12;
    const lift = o.lift && o.lift[i] ? o.lift[i] : 0;
    const x = W / 2 + (i - (n - 1) / 2) * 120 + (o.dx || 0);
    const y = H + 20 - lift * 110 + Math.abs(i - (n - 1) / 2) * 16 + (o.dy || 0);
    card({ ...c, x, y, w: 170, h: 238, rot: a, seed: 150 + i });
  });
}

scene({
  id: 'main', bars: 10, mood: 'bouncy', trans: { type: 'brush', len: 36, stroke: 'stroke_b' },
  draw(f) {
    tableBG(f);
    const CX = kf(f, [[0, 1150], [600, 1150]]), CY = kf(f, [[0, 420], [600, 440]]);
    const Z = kf(f, [[0, 0.9], [150, 0.95, E.io], [600, 0.95]]);
    // queue state: FR adds a card at slot 8, then votes
    const addT = ez(f, 60, 104, E.io);
    const vote = (i, a) => ({ a, t: seg(f, a, a + 26) });
    const blueVotes = [vote(0, 176), vote(1, 188), vote(2, 200)]; // two on slot 1, one on slot 4
    const moved = seg(f, 440, 476); // puppet strings move the hunter's vote
    const Q = JSON.parse(JSON.stringify(Q2S));
    Q[1].votes = [PK, ...(f >= 202 ? [B, B] : f >= 190 ? [B] : []), ...(moved >= 1 ? [G] : [])];
    Q[2].votes = moved > 0 ? [] : [G];
    Q[4].votes = f >= 226 ? [B] : [];
    cam(CX, CY, Z, 0, () => {
      boardBase();
      mapSpaces(1);
      const toks = tokensAfterEval();
      toks.push({ kind: 'eu', i: 5 }, { kind: 'eu', i: 6 });
      drawTokens(toks, f);
      trackerMarker(0, f);
      card({ type: 'spreadBack', x: BOARD.deck[0], y: BOARD.deck[1], w: CARD_W, h: CARD_H, seed: 90 });
      drawQueue(Q, f);
      if (f > 30 && f < 104) ring(...qpos(8), 150, f);
      if (f >= 104) card({ type: 'back', x: qx(8), y: qpos(8)[1], w: CARD_W, h: CARD_H, seed: 158 });
    });
    const sq = (bx, by) => toScreen(bx, by, CX, CY, Z);

    // 2a. play a policy face down onto the back of the queue
    const handIn = ez(f, 6, 30, E.outBack) * (1 - ez(f, 300, 330, E.inQ)) + ez(f, 512, 532, E.outBack);
    if (handIn > 0) {
      const pick = ez(f, 36, 56, E.outBack);
      const redraw = f > 532 ? seg(f, 532, 552) : 1;
      const hand = FR_HAND.map((c, i) => (i === 0 ? null : c));
      if (f > 512) hand[0] = { type: 'back' };
      C.save();
      C.translate(0, (1 - clamp(handIn)) * 360);
      handFan(f < 60 ? FR_HAND : hand, f, { lift: [pick, 0, 0, 0, 0], skip: f > 512 && redraw < 1 ? [0] : [] });
      if (f > 512 && redraw < 1) {
        const [dx, dy] = [W + 200, 300];
        const x = lerp(dx, W / 2 - 240, E.io(redraw)), y = lerp(dy, H + 52, E.io(redraw));
        card({ type: 'back', x, y, w: 170, h: 238, rot: (1 - redraw) * 1.2 - 0.24, seed: 150 });
      }
      C.restore();
    }
    if (f >= 56 && f < 104) {
      const [tx, ty] = sq(...qpos(8));
      const t = addT;
      const x0 = W / 2 - 240, y0 = H + 20 - 110 + 32;
      card({ ...FR_HAND[0], x: lerp(x0, tx, t), y: lerp(y0, ty, t) - Math.sin(t * Math.PI) * 120, w: lerp(170, CARD_W * Z, t), h: lerp(238, CARD_H * Z, t),
        flip: ez(f, 62, 80, E.io), rot: (1 - t) * -0.24, seed: 150 });
    }
    cue('card', 58, 0.8);
    cue('slide', 100, 0.5);

    // 2b. vote: influence 3 = three blue cubes
    const pb = ez(f, 130, 150, E.outBack) * (1 - ez(f, 290, 306, E.inQ));
    if (pb > 0) {
      C.save();
      C.translate(0, (1 - pb) * 300);
      playerBoard('fr', 330, 960, 0.8, { influence: 3, glow: seg(f, 150, 170) * (1 - seg(f, 200, 220)) });
      C.restore();
      if (f > 150 && f < 176) ring(330 + (-100 + 3 * 34) * 0.8, 960 - 34 * 0.8, 26, f);
    }
    const targets = [sq(qx(1), qpos(1)[1] + 70), sq(qx(1) + 30, qpos(1)[1] + 70), sq(qx(4), qpos(4)[1] + 70)];
    blueVotes.forEach((v, k) => {
      if (v.t <= 0 || v.t >= 1) return;
      const [x, y] = arcPos(E.io(v.t), 330 + (k - 1) * 40, 900, targets[k][0], targets[k][1], 260);
      cube(x, y, 40, PAL.blue, 1600 + k, v.t * 6);
    });
    for (const v of blueVotes) cue('clack', v.a + 26, 0.8);

    // negotiation: the others lobby with icon bubbles
    const others = [['de', 250], ['ar', 960], ['hu', 1670]];
    const negIn = ez(f, 300, 324, E.outBack) * (1 - ez(f, 530, 550, E.inQ));
    if (negIn > 0) {
      others.forEach(([r, x], k) => {
        const angry = r === 'hu' && f > 470;
        portrait(r, x, H - 150 + (1 - negIn) * 320, 92, { expr: angry ? 'cross' : f > 380 && r === 'de' ? 'happy' : 'sly', talk: f > 330 && f < 420 ? 0.5 + 0.5 * Math.sin(f * 0.5 + k) : 0, f, look: [x < W / 2 ? 1 : -1, -0.5] });
      });
      bubble(250 + 130, H - 330, 200, 120, f, 330 + 0, 420, () => {
        P.line([[-40, 10], [-10, 30], [40, -20]], { w: 10, col: PAL.green, seed: 1610 });
        cube(-50, -18, 34, PAL.yellow, 1611);
      });
      bubble(960 + 140, H - 330, 200, 120, f, 344, 420, () => {
        heartIcon(-30, 0, 30, PAL.pink, 2);
        cube(40, 0, 36, PAL.blue, 1612);
        T.draw('?', 76, 0, { size: 40, col: PAL.plumDark });
      }, { tail: [-60, 90] });
      bubble(1670 - 150, H - 330, 220, 120, f, 358, 420, () => {
        crosshairIcon(-50, 0, 30, PAL.plumDark);
        T.draw('+', 0, 0, { size: 50, col: PAL.plumDark });
        cube(56, 0, 36, PAL.blue, 1613);
      }, { tail: [60, 90] });
      cue('pop', 331, 0.6); cue('pop', 345, 0.6); cue('pop', 359, 0.6);
    }
    // an action card bends the rules: puppet strings move the hunter's vote
    const act = ez(f, 424, 440, E.outBack) * (1 - ez(f, 500, 514, E.inQ));
    if (act > 0) {
      card({ ...FR_HAND[1], x: 1560, y: 480, w: 250 * act, h: 350 * act, rot: 0.06, seed: 151, glow: PAL.lavender });
      cue('card', 425, 0.8);
    }
    if (f > 436 && f < 490) {
      const [ax, ay] = sq(qx(2), qpos(2)[1] + 70), [bx, by] = sq(qx(1), qpos(1)[1] + 70);
      const t = moved;
      const [x, y] = arcPos(E.io(t), ax, ay, bx + 60, by, 180);
      C.save();
      C.strokeStyle = rgba(PAL.cardCream, 0.8);
      C.lineWidth = 2;
      for (let k = -1; k <= 1; k++) { C.beginPath(); C.moveTo(x + k * 14, y - 20); C.lineTo(x + k * 60, -20); C.stroke(); }
      C.restore();
      if (t < 1) cube(x, y, 34 * Z * 1.2, PAL.green, 1620, Math.sin(f * 0.3) * 0.2);
      cue('whoosh', 441, 0.6);
    }

    // step 3: draw back up to five, then play passes clockwise
    const step = f < 510 ? 2 : f < 568 ? 3 : 1;
    turnHUD(step, f, f < 568 ? 'fr' : 'ar', 1);
    if (f > 568) sparkle(84, 78, f, 569, 60, ROLES.ar.col);
    cue('card', 534, 0.7);
    cue('whoosh', 568, 0.5);

    caption(f, 14, 118, 'STEP 2: ADD A POLICY, FACE DOWN, AT THE BACK', { size: 50, top: true, x: 1180 });
    caption(f, 132, 290, 'VOTE ON FACE-UP POLICIES WITH YOUR INFLUENCE', { size: 48, top: true, x: 1180 });
    caption(f, 312, 420, 'NEGOTIATE, TRADE AND PERSUADE', { size: 56, top: true, x: 1180 });
    caption(f, 426, 506, 'ACTION CARDS BEND THE RULES', { size: 56, top: true, x: 1180 });
    caption(f, 514, 590, 'STEP 3: DRAW BACK UP TO 5 CARDS', { size: 54, top: true, x: 1180 });
  },
});
