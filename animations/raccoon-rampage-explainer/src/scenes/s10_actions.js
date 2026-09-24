// Scene 10 (140-152 s): action cards. The French player flicks up BEHIND THE SCENES (anytime):
// puppet strings lift two votes off WEAR THEM (3/3 becomes 1/3) and drop them on NO MORE PETS.
// Then CELEBRITY ENDORSEMENT (your main phase) adds two pink votes and pets reaches its cost.
// The Raccoon cheers the chaos as the camera pulls back to the whole board.

(() => {
  const BD = RR.board;
  const FULL = RR.cam(1200, 750, 0.66), QCAM = RR.cam(1250, 330, 0.95), C_STR = RR.cam(1860, 300, 1.4);
  const CAMS = [[0, QCAM], [2.4, QCAM], [3.4, C_STR], [9.9, C_STR], [11.6, FULL]];
  const camAt = (t) => RR.drift(RR.camKf(t, CAMS), t, RR.env(t, 0, 11.6, 1.2, 1.2));

  // ---------------------------------------------------------------- board state S9 (from s09)
  const S9 = BD.clone(BD.SETUP);
  S9.story = ['corprelief', 'corpself', null, null, null];
  S9.tokens = { de: 10, fr: 6, roe: 9 };
  S9.tracker = 4;
  S9.prot = [];
  S9.queue = [
    { id: 'pets', k: 1 }, { id: 'wear', k: 2 }, { id: 'drones', k: 3, votes: ['fr', 'fr'] }, { id: 'protect', k: 4, votes: [] },
    { id: 'back:policy', k: 5 }, { id: 'back:policy', k: 6 }, { id: 'back:policy', k: 7 }, { id: 'back:policy', k: 8 },
  ];
  // Animated vote lists (land: arrival time, -1 = already there; leave: lifted away at)
  const LIFT = 4.0, L_CORP = 5.66, L_FR = 5.74, L_PINK = [8.3, 8.45];
  const WEAR = [{ role: 'hu', land: -1 }, { role: 'corp', land: -1, leave: LIFT }, { role: 'fr', land: -1, leave: LIFT }];
  const PETS = [{ role: 'ar', land: -1 }, { role: 'fr', land: -1 }, { role: 'fr', land: L_FR }, { role: 'corp', land: L_CORP }, { role: 'ar', land: L_PINK[0] }, { role: 'ar', land: L_PINK[1] }];
  // End state: pets ['ar','fr','fr','corp','ar','ar'], wear ['hu'], drones ['fr','fr'], protect [].

  // ---------------------------------------------------------------- helpers
  const cubeLayout = (x, y, i, n, size = 32) => {
    const col = i % 3, row = Math.floor(i / 3);
    const inRow = Math.min(3, n - row * 3);
    return [x + (col - (inRow - 1) / 2) * size * 1.15 + (row % 2) * 6, y + 38 - row * size * 0.9];
  };
  const cubesOn = (k, list, t) => {
    const [x, y] = BD.slot(k);
    let nf = 0;
    for (const c of list) {
      nf += c.land < 0 ? 1 : RR.seg(t, c.land - 0.24, c.land - 0.02, 'inOutCubic');
      if (c.leave) nf -= RR.seg(t, c.leave + 0.35, c.leave + 0.65, 'inOutCubic');
    }
    const f = nf - Math.floor(nf);
    let idx = 0;
    return list.map((c) => {
      const gone = !!c.leave && t >= c.leave;
      const i = idx;
      if (!gone) idx++;
      const n0 = Math.max(i + 1, Math.floor(nf)), n1 = Math.max(i + 1, Math.ceil(nf));
      return { ...c, gone, pos: RR.lerp2(cubeLayout(x, y, i, n0), cubeLayout(x, y, i, n1), f) };
    });
  };
  const drawCubes = (cubes, t) => {
    for (const q of cubes) {
      if (q.gone || q.land > t) continue;
      const u = q.land > 0 ? RR.seg(t, q.land, q.land + 0.28) : 1;
      const sq = u < 1 ? Math.sin(Math.PI * u) * (1 - u) : 0;
      RR.drawCube(q.pos[0], q.pos[1], 32, q.role, { sx: 1 + sq * 0.35, sy: 1 - sq * 0.45 });
    }
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
  // Highlighter swipe over one line of a card's text (card-local coordinates, 190 x 265 card)
  // (lw = rendered width of the line in card units; lift enlarges the drawn card by up to 6%)
  const highlight = (cx, cy, w, rot, lift, lx, ly, lw, col, u) => {
    if (u <= 0) return;
    const k = (w / 190) * (1 + lift * 0.06);
    push(); translate(cx, cy); rotate(rot); scale(k); translate(-95, -132.5);
    RR.flat(RR.rrectPts(lx - 3, ly - 8.5, (lw + 6) * u, 12, 4), col, 120);
    pop();
  };
  const sleeve = (hand, dir, len, col, dark, skin, w = 34) => {
    // arm coming in from off screen along dir (unit vector pointing from the hand outwards)
    const [hx, hy] = hand, ex = hx + dir[0] * len, ey = hy + dir[1] * len;
    const nx = -dir[1], ny = dir[0];
    RR.ink([[ex + nx * w, ey + ny * w], [hx + dir[0] * 24 + nx * w * 0.8, hy + dir[1] * 24 + ny * w * 0.8], [hx + dir[0] * 24 - nx * w * 0.8, hy + dir[1] * 24 - ny * w * 0.8], [ex - nx * w, ey - ny * w]], { fill: col, w: 1.1, curve: 0.3 });
    RR.ink([[hx + dir[0] * 34 + nx * w * 0.85, hy + dir[1] * 34 + ny * w * 0.85], [hx + dir[0] * 20 + nx * w * 0.8, hy + dir[1] * 20 + ny * w * 0.8], [hx + dir[0] * 20 - nx * w * 0.8, hy + dir[1] * 20 - ny * w * 0.8], [hx + dir[0] * 34 - nx * w * 0.85, hy + dir[1] * 34 - ny * w * 0.85]], { fill: dark, stroke: false, curve: 0.2 });
    RR.inkCircle(hx, hy, w * 0.72, { fill: skin, w: 1 });
  };
  // Wooden puppet control (cross bar)
  const controlSpr = () => RR.sprite('s10:control', 200, 110, () => {
    RR.ink(RR.rrectPts(16, 44, 168, 18, 8), { fill: '#b58b64', w: 1, curve: 0.2 });
    RR.ink(RR.rrectPts(91, 10, 18, 90, 8), { fill: '#a07650', w: 1, curve: 0.2 });
    for (const x of [22, 178]) RR.inkCircle(x, 53, 9, { fill: '#8a6242', w: 0.8 });
    RR.inkLine([[40, 49], [160, 49]], { col: '#d6b48c', w: 0.6, brush: 'pencil' });
  }, { res: 1.8 });

  // ---------------------------------------------------------------- the strings
  const [WX, WY] = BD.slot(2), [PX, PY] = BD.slot(1);
  const SRC = [cubeLayout(WX, WY, 1, 3), cubeLayout(WX, WY, 2, 3)];   // corp, fr on WEAR THEM
  const DST = [cubeLayout(PX, PY, 3, 4), cubeLayout(PX, PY, 2, 4)];   // corp, fr on NO MORE PETS
  const LAND = [L_CORP, L_FR];
  const HIGH = 60, STR_L = 125;
  const uCarry = (t) => RR.seg(t, 4.5, 5.3, 'inOutCubic');
  const swingAt = (t) => {
    const u = uCarry(t);
    let s = -34 * Math.sin(2 * Math.PI * u);
    if (t > 5.3) s += 18 * Math.exp(-(t - 5.3) * 5) * Math.sin((t - 5.3) * 13);
    return s * (1 - RR.seg(t, 5.3, 5.66));
  };
  const movedPos = (m, t) => {
    const src = SRC[m], dst = DST[m];
    const lift = RR.seg(t, LIFT, LIFT + 0.5, 'outBack');
    const low = RR.seg(t, 5.3, LAND[m], 'inOutCubic');
    const x = RR.lerp(src[0], dst[0], uCarry(t)) + swingAt(t) * (1 + m * 0.25);
    const y = RR.lerp(RR.lerp(src[1], HIGH, lift), dst[1], low);
    return [x, y];
  };
  const barAt = (t) => {
    const x = RR.lerp((SRC[0][0] + SRC[1][0]) / 2, (DST[0][0] + DST[1][0]) / 2, uCarry(t));
    const top = Math.min(movedPos(0, t)[1], movedPos(1, t)[1]);
    const hang = top - 17 - STR_L - 8;
    const y = RR.kf(t, [[3.15, -560], [3.6, SRC[0][1] - 17 - STR_L - 8, 'outBack'], [LIFT - 0.02, SRC[0][1] - 17 - STR_L - 8]]);
    if (t < LIFT) return [x, y];
    if (t < 5.85) return [x, hang];
    return [x, RR.lerp(hang, -620, RR.seg(t, 5.95, 6.45, 'inCubic'))];
  };

  // ---------------------------------------------------------------- scene
  RR.scene({
    id: 's10_actions', order: 10, dur: 12, music: 'actions',
    cues: [
      [0.1, 'brush'], [0.45, 'whoosh'], [1.1, 'flip', 0.5], [1.35, 'pencil'], [2.5, 'slide'],
      [3.0, 'pop', 0.6], [3.1, 'pop', 0.6], [3.2, 'whoosh', 0.6], [3.3, 'paper'], [3.9, 'tick'], [3.95, 'tick'],
      [LIFT, 'whoosh'], [4.25, 'buzz', 0.6], [4.6, 'whoosh', 0.4], [L_CORP, 'tock'], [L_FR, 'tock'], [5.95, 'whoosh', 0.4],
      [6.3, 'whoosh'], [6.5, 'slide', 0.6], [6.95, 'flip'], [6.9, 'paper', 0.6], [7.3, 'pencil'], [7.55, 'pop'], [7.7, 'pop'],
      [L_PINK[0], 'tock'], [L_PINK[1], 'tock'], [8.45, 'sparkle'], [8.5, 'ding'],
      [9.45, 'boing'], [9.7, 'chitter'], [10.2, 'whoosh', 0.6], [10.45, 'chitter'], [11.05, 'hop'],
    ],
    draw(t) {
      const cam = camAt(t);
      const wear = cubesOn(2, WEAR, t), pets = cubesOn(1, PETS, t);

      // ---- world
      RR.withCam(cam, () => {
        BD.drawState(S9, { skip: { queue: true } });
        const glows = {
          2: [RR.C.green, RR.env(t, 3.0, 4.2, 0.3, 0.1)], 1: [RR.C.green, RR.env(t, 8.5, 9.5, 0.1, 0.4)],
        };
        const redFlash = RR.env(t, 4.2, 5.0, 0.05, 0.6);
        for (const c of S9.queue) {
          const [x, y] = BD.slot(c.k);
          if (glows[c.k]) glowRect(x, y, 190, 265, glows[c.k][0], glows[c.k][1]);
          if (c.k === 2) glowRect(x, y, 190, 265, RR.C.red, redFlash);
          RR.drawCard(c.id, x, y, { w: 190, flip: c.k <= 4.5 ? 1 : 0 });
          if (c.k === 1) drawCubes(pets, t);
          else if (c.k === 2) drawCubes(wear, t);
          else if (c.votes && c.votes.length) BD.cubesOnCard(x, y, c.votes, { size: 32 });
        }
        // vote badges
        const bA = RR.pop(t, 3.0, 0.3) * (1 - RR.seg(t, 9.3, 9.55));
        const bB = RR.pop(t, 3.1, 0.3) * (1 - RR.seg(t, 9.3, 9.55));
        const bump = (tt) => 1 + 0.25 * Math.exp(-Math.abs(t - tt) * 12);
        if (bA > 0.01) countBadge(t < 4.25 ? '3/3' : '1/3', t < 4.25, WX, 382, bA * bump(4.25));
        if (bB > 0.01) countBadge(t < 5.75 ? '2/5' : t < 8.5 ? '4/5' : '6/5', t >= 8.5, PX, 382, bB * bump(t < 7 ? 5.75 : 8.5));

        // puppet strings: a hand from above lowers the control, strings hook two votes
        if (t > 3.15 && t < 6.5) {
          const bar = barAt(t);
          for (let m = 0; m < 2; m++) {
            const anchor = [bar[0] + (m ? 50 : -50), bar[1]];
            let cube = t < LIFT ? SRC[m] : t < LAND[m] ? movedPos(m, t) : DST[m];
            const top = [cube[0], cube[1] - 17];
            let tip;
            if (t < 3.6) tip = [anchor[0] + (m ? 6 : -6), anchor[1] + 40];
            else if (t < 3.92) tip = RR.lerp2([anchor[0], anchor[1] + 40], top, RR.seg(t, 3.6, 3.92, 'inCubic'));
            else if (t < 5.8) tip = top;
            else tip = RR.lerp2(top, [anchor[0], anchor[1] + 30], RR.seg(t, 5.8, 6.05, 'inCubic'));
            const mid = [(anchor[0] + tip[0]) / 2 + (t > 5.8 ? 8 : 0), (anchor[1] + tip[1]) / 2];
            RR.inkLine([anchor, mid, tip], { col: RR.C.inkSoft, w: 0.9, curve: 0.5 });
          }
          RR.drawSprite(controlSpr(), bar[0], bar[1] + 1, { w: 130, h: 72, rot: swingAt(t) * -0.003 });
          sleeve([bar[0] + 4, bar[1] - 14], [0.25, -0.97], 520, RR.C.fr, RR.C.frDark, RR.PEOPLE.fr.skin, 30);
        }
        // the lifted votes dangle on their strings
        for (let m = 0; m < 2; m++) {
          if (t < LIFT || t >= LAND[m]) continue;
          const p = movedPos(m, t);
          const yank = RR.env(t, LIFT, LIFT + 0.25, 0.05, 0.2);
          RR.drawCube(p[0], p[1], 32, m ? 'fr' : 'corp', { rot: swingAt(t) * -0.008, sx: 1 - yank * 0.12, sy: 1 + yank * 0.2, shadow: false });
        }
      });
      RR.sparkle(...RR.toScreen(cam, [PX, 382]), t, 8.48, { n: 10, r: 120, col: RR.C.gold });
      RR.sparkle(...RR.toScreen(cam, [PX, 250]), t, 8.4, { n: 6, r: 110, col: RR.C.pink, seed: 5, size: 14 });

      // ---- BEHIND THE SCENES flies up from the French player's hand
      if (t < 1.0) {
        const up = RR.kf(t, [[0, 520], [0.4, 0, 'outBack'], [0.5, -30, 'outQuad'], [1.0, 520, 'inCubic']]);
        const hand = [760, 900 + up];
        if (t < 0.5) RR.drawCard('behind', hand[0] + 6, hand[1] - 90, { w: 170, rot: -0.22 });
        sleeve(hand, [0.12, 0.99], 400, RR.C.fr, RR.C.frDark, RR.PEOPLE.fr.skin, 36);
      }
      if (t >= 0.5 && t < 6.8) {
        const u = RR.seg(t, 0.5, 1.15, 'outBack');
        const v = RR.seg(t, 2.5, 3.1, 'inOutCubic');
        const x0 = RR.lerp(766, 960, RR.seg(t, 0.5, 1.15, 'outCubic')), y0 = RR.lerp(780, 625, RR.seg(t, 0.5, 1.15, 'outCubic'));
        let x = RR.lerp(x0, 1650, v), y = RR.lerp(y0, 600, v) + Math.sin(t * 2.2) * 5 * v;
        let w = RR.lerp(RR.lerp(170, 560, u), 300, v), rot = RR.lerp(RR.lerp(-0.22, 0, u), 0.04, v);
        const out = RR.seg(t, 6.3, 6.75, 'inCubic');
        x += out * 700; y -= out * 80; rot += out * 0.4;
        const lift = 0.6 + 0.4 * (1 - v);
        RR.drawCard('behind', x, y, { w, rot, lift });
        highlight(x, y, w, rot, lift, 20, 212, 34, RR.C.gold, RR.seg(t, 1.35, 1.7, 'inOutQuad'));
      }

      // ---- CELEBRITY ENDORSEMENT: the Animal Rights player's card, two pink votes
      if (t >= 6.45 && t < 7.6) {
        const up = RR.kf(t, [[6.45, 520], [6.85, 0, 'outBack'], [7.2, 0], [7.6, 560, 'inCubic']]);
        const hand = [1690, 930 + up];
        if (t < 6.95) RR.drawCard('celeb', hand[0] - 10, hand[1] - 100, { w: 200, rot: 0.15, flip: 0 });
        sleeve(hand, [0.1, 0.99], 400, RR.C.ar, RR.C.arDark, RR.PEOPLE.ar.skin, 36);
      }
      if (t >= 6.95 && t < 9.6) {
        const u = RR.seg(t, 6.95, 7.35, 'outBack');
        const out = RR.seg(t, 9.1, 9.55, 'inCubic');
        const x = RR.lerp(1680, 1640, u) + out * 600, y = RR.lerp(830, 560, RR.seg(t, 6.95, 7.35, 'outCubic')) + Math.sin(t * 2.2) * 4 - out * 60;
        const w = RR.lerp(200, 440, u), rot = RR.lerp(0.15, -0.03, u) + out * 0.4;
        RR.drawCard('celeb', x, y, { w, rot, flip: RR.seg(t, 6.95, 7.25, 'inOutCubic'), lift: 0.7 });
        highlight(x, y, w, rot, 0.7, 20, 212, 67, RR.C.ar, RR.seg(t, 7.3, 7.65, 'inOutQuad'));
      }
      // two pink votes pop out of the card and hop onto NO MORE PETS
      L_PINK.forEach((L, j) => {
        const P0 = 7.55 + j * 0.15, F = L - 0.5;
        if (t < P0 || t >= L) return;
        const from = [1640 + (j ? 40 : -40), 600];
        const hover = [from[0], 470 + Math.sin(t * 6 + j) * 4];
        let pos, size = 44;
        if (t < F) {
          const u = RR.E.outBack(RR.seg(t, P0, P0 + 0.3));
          pos = RR.lerp2(from, hover, u); size = 44 * RR.clamp(u * 1.2, 0, 1.1);
        } else {
          const q = cubesOn(1, PETS, L)[4 + j];
          const target = RR.toScreen(cam, q.pos);
          const u = RR.seg(t, F, L, 'inOutSine');
          pos = RR.hop([from[0], 470 + Math.sin(F * 6 + j) * 4], target, u, 160);
          size = RR.lerp(44, 32 * cam.z, u);
        }
        RR.drawCube(pos[0], pos[1], size, 'ar', { rot: t >= F ? Math.sin(Math.PI * RR.seg(t, F, L)) * -0.7 : 0, shadow: false });
      });

      // ---- the Raccoon cheers the chaos from the corner
      if (t > 9.4 && t < 11.5) {
        const beat = Math.sin((t - 9.8) * 15);
        const y = RR.kf(t, [[9.4, 1520], [9.8, 1150, 'outBack'], [10.95, 1150], [11.45, 1560, 'inBack']]) - (t > 9.8 && t < 10.95 ? 22 * Math.max(0, beat) : 0);
        const pose = RR.raccoonIdle(t, {
          face: 1, look: [0.8, -0.7], brow: 'sly', mouth: t > 9.65 ? 'cackle' : 'o', eyes: t > 9.65 && beat > -0.2 ? 'happy' : 'open',
          armF: t > 9.8 ? 2.35 + 0.45 * beat : 0.6, armB: t > 9.8 ? 2.2 - 0.45 * beat : 0.5, tailUp: 1, tail: t * 9,
          squash: t < 9.95 ? -0.18 * Math.sin(Math.PI * RR.seg(t, 9.4, 9.95)) : 0.09 * Math.max(0, -beat),
          headTilt: 0.1 * Math.sin((t - 9.8) * 7.5),
        });
        RR.drawRaccoon(320, y, 1.7, pose);
      }

      // ---- words
      RR.banner('ACTION CARDS', t, 0.1, 2.4);
      RR.caption('Play them to twist the vote', t, 3.3, 6.3);
      RR.caption('Anytime, or on your turn', t, 6.9, 9.35, { size: 52 });
    },
  });
})();
