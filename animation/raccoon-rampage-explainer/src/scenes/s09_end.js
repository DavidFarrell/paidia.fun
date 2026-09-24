// Scenes 11-13: the rounds roll on, the end of the game, and the outro.

const QEND = {
  1: { ...CARDS.helpline, votes: [PK, B, B, G] },
  2: { ...CARDS.wear, votes: [G] },
  3: { ...CARDS.pets, votes: [PK, PK, Y, B, Y] },
  4: { ...CARDS.burgers, votes: [B] },
  5: { type: 'back', down: true },
  6: { type: 'back', down: true },
  7: { type: 'back', down: true },
  8: { type: 'back', down: true },
};

// ---- 11: round after round ---------------------------------------------------
scene({
  id: 'rounds', bars: 4, mood: 'bouncy', trans: { type: 'fade', len: 16 },
  draw(f) {
    tableBG(f);
    const CX = kf(f, [[0, 1200], [240, 1260]]), CY = kf(f, [[0, 930], [240, 960]]), Z = kf(f, [[0, 0.72], [240, 0.76]]);
    const flips = [20, 68, 116, 164];
    const flipped = 1 + flips.filter((a) => f >= a + 8).length;
    const trk = kf(f, [[0, 0], [30, 2], [60, 1], [90, 4], [120, 2], [150, -1], [180, 1], [214, -3]]);
    cam(CX, CY, Z, 0, () => {
      boardBase();
      mapSpaces(1);
      // time-lapse: raccoons come and go
      const toks = tokensAfterEval();
      toks.push({ kind: 'eu', i: 5 }, { kind: 'eu', i: 6 });
      for (let k = 0; k < 6; k++) {
        const a = 20 + k * 30;
        toks.push({ kind: k % 3 === 0 ? 'fr' : k % 3 === 1 ? 'de' : 'eu', i: k % 3 === 2 ? 7 + k : 5 + k, a, r: a + 50 + (k % 2) * 30, noFly: true });
      }
      drawTokens(toks, f);
      trackerMarker(trk, f);
      drawQueue(f < 200 ? Q2S : QEND, f);
      card({ type: 'spreadBack', x: BOARD.deck[0], y: BOARD.deck[1], w: CARD_W, h: CARD_H, seed: 90 });
      for (let k = 0; k < 5; k++) {
        const [x, y] = storyPos(k);
        const ev = STORY_EVENTS[k];
        let flip = k < flipped ? 0 : 1;
        if (k > 0 && f >= flips[k - 1] && f < flips[k - 1] + 16) flip = 1 - ez(f, flips[k - 1], flips[k - 1] + 16, E.io);
        card({ type: 'event', title: ev.title, art: ev.art, artBg: ev.bg, artT: 1, x, y, w: 150, h: 200, flip, backType: 'back', seed: 70 + k });
      }
      const cur = Math.min(4, flipped - 1);
      ring(storyPos(cur)[0], storyPos(cur)[1], 140, f);
    });
    flips.forEach((a) => cue('flip', a, 0.8));
    // year counter
    const years = [0, 5, 10, 15, 20][Math.min(4, flipped - 1)];
    C.save();
    C.translate(W - 250, 150);
    P.ellipse(0, 0, 130, 130, { fill: PAL.cardCream, lw: 4, seed: 1700, texA: 0.35 });
    T.draw(String(years), 0, -14, { size: 110, col: PAL.plumDark });
    T.draw('YEARS', 0, 62, { size: 40, col: PAL.plumMid, spacing: 2 });
    C.restore();
    caption(f, 10, 150, 'ROUND AFTER ROUND, EUROPE CHANGES', { size: 56, top: true, x: 820 });
    caption(f, 168, 236, 'FINAL ROUND: NO DRAWING NEW CARDS', { size: 52, top: true, x: 820 });
  },
});

// ---- 12: the end of the game -------------------------------------------------
const FINAL_SCORES = { de: 7, fr: 6, ar: 9, hu: 5 };
scene({
  id: 'ending', bars: 9, mood: 'finale', trans: { type: 'fade', len: 14 },
  draw(f) {
    // a. end-game evaluation of all face-up policies (no spread for failures)
    if (f < 132) {
      tableBG(f);
      cam(1000, 300, 1.02, 0, () => {
        boardBase();
        for (let i = 8; i >= 1; i--) {
          const spec = QEND[i];
          const [x, y] = qpos(i);
          if (i > 4) { card({ ...spec, x, y, w: CARD_W, h: CARD_H, flip: 1, seed: 40 + i }); continue; }
          const need = spec.cost, have = spec.votes.length;
          const ok = have >= need;
          const a = 24 + (4 - i) * 10;
          const st = seg(f, a, a + 12);
          const gone = !ok ? ez(f, 80, 110, E.inQ) : 0;
          card({ ...spec, x, y: y - gone * 60, w: CARD_W, h: CARD_H, votes: gone > 0 ? [] : spec.votes, alpha: 1 - gone, stamp: st > 0 ? (ok ? 'pass' : 'fail') : null, stampT: st, seed: 40 + i,
            glow: ok && st > 0 ? '#8fd18a' : null });
          cue(ok ? 'stamp' : 'thud', a, 0.7);
        }
      });
      caption(f, 8, 70, 'GAME END: EVERY FACE-UP POLICY IS EVALUATED', { size: 48 });
      caption(f, 76, 128, 'FAILURES NOW JUST GET DISCARDED', { size: 52 });
      return;
    }
    const g = f - 132;
    // b. is the Impact Tracker in the green?
    lavenderBG(f);
    const check = ez(g, 40, 56, E.outBack);
    const trkIn = ez(g, 0, 22, E.outBack) * (1 - ez(g, 150, 170, E.inQ));
    if (trkIn > 0) {
      C.save();
      C.translate(0, -(1 - trkIn) * 500);
      const at = bigTracker(W / 2, 330, 1500, -3, f);
      // lose zone (neutral and red) and win zone (green)
      if (check > 0) {
        const [nx, ny] = at(0), [rx] = at(9.6), [gx] = at(-9), [gx2] = at(-1);
        C.save();
        C.globalAlpha = 0.9 * check;
        P.line([[nx - 30, ny + 60], [rx + 40, ny + 60]], { w: 8, col: PAL.bad, seed: 1710, taper: false });
        T.draw('EVERYONE LOSES', (nx + rx) / 2, ny + 110, { size: 50, col: PAL.badDark, spacing: 2 });
        P.line([[gx - 30, ny + 60], [gx2 + 20, ny + 60]], { w: 8, col: PAL.greenDeep, seed: 1711, taper: false });
        T.draw('SAVED!', (gx + gx2) / 2, ny + 110, { size: 56, col: PAL.greenDeep, spacing: 2 });
        C.restore();
      }
      C.restore();
      cue('whoosh', 133, 0.6);
      cue('sparkle', 172, 0.8);
    }
    // the players watch, then cheer
    if (g < 170) {
      ROLE_ORDER.forEach((r, i) => {
        const cheer = seg(g, 70 + i * 4, 84 + i * 4);
        person({ role: r, x: 330 + i * 420, y: 1110 + Math.sin(f * 0.3 + i) * cheer * 10, s: 1.15, expr: cheer > 0 ? 'grin' : 'shock', look: [0, -1],
          armL: [0.2 + cheer * 2.5, 0.3], armR: [0.2 + cheer * 2.5, 0.3], seed: 5 });
      });
      cue('cheer', 204, 0.8);
      caption(g, 20, 160, 'FINISH ON THE GREEN SIDE, OR EVERYONE LOSES', { size: 50, y: 610 });
      return;
    }
    // c. only now compare scores: the most points wins
    const h = g - 170;
    const rows = ROLE_ORDER.map((r, i) => [r, 150 + i * 196]);
    const fill = (r) => Math.min(FINAL_SCORES[r], Math.floor(seg(h, 30, 150) * 9.99));
    rows.forEach(([r, y], i) => {
      const t = ez(h, i * 6, i * 6 + 18, E.outBack);
      C.save();
      C.translate((1 - t) * -1100, 0);
      const winner = r === 'ar' && h > 160;
      if (winner) P.glow(560, y, 480, PAL.pink, 0.45);
      playerBoard(r, 520, y, 0.82, { score: fill(r) });
      // running total
      P.ellipse(1000, y, 66, 66, { fill: winner ? '#f3d27a' : PAL.cardCream, lw: 3.4, seed: 1720 + i, texA: 0.3, n: 24 });
      T.draw(String(fill(r)), 1000, y + 4, { size: 84, col: PAL.plumDark });
      if (winner) {
        const ct = ez(h, 164, 176, E.outBack);
        C.save();
        C.translate(1000, y - 84 - ct * 6);
        C.scale(ct * 1.3, ct * 1.3);
        P.shape([[-30, 10], [-34, -24], [-14, -6], [0, -32], [14, -6], [34, -24], [30, 10]], { fill: '#f1c542', lw: 3, seed: 1730, smooth: 0.1, texA: 0.3 });
        C.restore();
      }
      C.restore();
    });
    for (let k = 1; k <= 9; k++) cue('tick', 302 + 30 + ((k - 0.5) / 10) * 120, 0.35);
    // winner
    const win = ez(h, 160, 180, E.outBack);
    const reactions = { de: 'happy', fr: 'sad', ar: 'grin', hu: 'cross' };
    ROLE_ORDER.forEach((r, i) => {
      const isWin = r === 'ar';
      const [x, y] = { ar: [1340, 640], de: [1680, 640], fr: [1340, 1090], hu: [1680, 1090] }[r];
      const bob = isWin && win > 0 ? Math.abs(Math.sin(f * 0.25)) * 20 : 0;
      person({ role: r, x, y: y - bob, s: 0.8, expr: win > 0 ? reactions[r] : 'neutral', look: [r === 'ar' ? 0 : -1, 0],
        armL: isWin && win > 0 ? [2.6, 0.2] : r === 'de' && win > 0 ? [0.9, 1.9 + Math.sin(f * 0.8) * 0.3] : [0.15, 0.2],
        armR: isWin && win > 0 ? [2.6, 0.2] : r === 'de' && win > 0 ? [0.9, 1.9 - Math.sin(f * 0.8) * 0.3] : [0.15, 0.2], seed: 6 });
    });
    if (win > 0) {
      trophy(1340, 180 - (1 - win) * 300, 0.9, f);
      confetti(f, 132 + 170 + 160, 1340, 300, 90, 1100, 4);
      cue('fanfare', 132 + 170 + 160, 1);
    }
    caption(h, 12, 150, '...THEN THE MOST POINTS WINS', { size: 58, y: H - 76, x: 640 });
    caption(h, 160, 236, 'A TIE IS A SHARED VICTORY', { size: 52, y: H - 76, x: 640 });
  },
});

// ---- 13: outro ---------------------------------------------------------------
scene({
  id: 'outro', bars: 6, mood: 'title', trans: { type: 'brush', len: 36, stroke: 'stroke_a' },
  draw(f) {
    lavenderBG(f);
    P.glow(W / 2, 300, 800, '#f4c5d3', 0.35);
    bunting(f, 30, 50);
    const tt = ez(f, 6, 26, E.outBack);
    C.save();
    C.translate(W / 2, 175);
    C.scale(tt, tt);
    T.draw('RACCOON RAMPAGE', 0, 0, { size: 120, col: PAL.plumDark, shadow: PAL.cardCream, spacing: 4 });
    C.restore();
    caption(f, 24, 340, 'WORK TOGETHER. WIN ALONE.', { size: 62, y: 330 });
    // fact chips
    const chips = ['3-4 PLAYERS', '45-60 MINUTES', 'AGES 12+'];
    chips.forEach((c, i) => {
      const t = ez(f, 50 + i * 10, 62 + i * 10, E.outBack);
      if (t <= 0) return;
      C.save();
      C.translate(W / 2 + (i - 1) * 380, 460);
      C.scale(t, t);
      P.rrect(-165, -38, 330, 76, 32, { fill: PAL.cardCream, lw: 3, seed: 1800 + i, texA: 0.35 });
      T.draw(c, 0, 2, { size: 44, col: PAL.plumDark, spacing: 2 });
      C.restore();
      cue('pop', 50 + i * 10, 0.6);
    });
    const pt = ez(f, 96, 112, E.outBack);
    if (pt > 0) {
      C.save();
      C.translate(W / 2, 560);
      C.scale(pt, pt);
      T.draw('PLAY IT FREE ON TABLETOPIA, OR PRINT AND PLAY', 0, 0, { size: 44, col: PAL.plumDark, spacing: 1 });
      T.draw('raccoonrampage.ecologygames.eu', 0, 58, { size: 46, col: PAL.plumMid, head: false });
      C.restore();
    }
    // credits
    const ct = ez(f, 150, 170, E.io);
    if (ct > 0) {
      C.save();
      C.globalAlpha = ct;
      T.draw('Game design: Col Anderson & David Farrell  ·  Art: Kristina Tsenova', W / 2, 690, { size: 36, col: PAL.plumDark, head: false });
      T.draw('A Paidia game made with scientists from the InvasiBES and AlienScenarios projects', W / 2, 738, { size: 33, col: PAL.plumMid, head: false });
      C.restore();
    }
    // the cast waves goodbye; Rascal steals a burger and runs
    ROLE_ORDER.forEach((r, i) => {
      const t = ez(f, 20 + i * 6, 40 + i * 6, E.outBack);
      const x = [260, 610, 1310, 1660][i];
      const wave = Math.sin(f * 0.25 + i) * 0.35;
      person({ role: r, x, y: 1180 + (1 - t) * 400, s: 0.95, expr: 'grin', armR: [2.4 + wave, 0.4], armL: [0.2, 0.3], seed: 7 });
    });
    const run = seg(f, 280, 350);
    const wp = walkPose(f, 0.6, 0.8, 0);
    const rx = lerp(W / 2, W + 300, E.inQ(run));
    raccoon({ x: rx, y: 1010 + (run > 0 ? wp.bob : 0), s: 1.25, prop: 'burger', face: run > 0 ? 1 : 1, turn: run > 0 ? 0.6 : 0,
      eyes: run > 0 ? 'happy' : f > 250 ? 'sly' : 'happy', mouth: run > 0 ? 'grin' : 'smile', arms: [1.2, 1.2], seed: 1,
      ...(run > 0 ? { legs: wp.legs, lean: 0.15 } : { tail: Math.sin(f * 0.15) * 0.4 }) });
    cue('chitter', 284, 0.8);
    // fade out
    const out = seg(f, 330, 358);
    if (out > 0) {
      C.fillStyle = rgba('#1d1720', out);
      C.fillRect(0, 0, W, H);
    }
  },
});
