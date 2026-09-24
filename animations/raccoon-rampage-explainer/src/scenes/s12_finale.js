// Scene 12 (168-180 s): finale.
// The plum wipe uncovers a little prize-giving: the Animal Rights player holds the
// trophy aloft while the others clap. The Raccoon tiptoes in, snatches it, dashes off
// (camera whip-pans after it) and dives into its dustbin. End card: title, game details,
// the Raccoon peeking out with the trophy... then it ducks and the lid clangs shut.

(() => {
  const C = RR.C;
  const PAN = 1400;                                    // camera travel from stage to end card
  const BIN = { x: 1440 + PAN, rim: 650, base: 960 };  // same screen spot as the s01 bin after the pan
  const FLOOR = 965;
  const TX = 700;                                      // end-card text centre (screen)
  const SPOT = { hu: [400, FLOOR], de: [670, 800], ar: [910, 720], fr: [1150, 850] };
  const RS = 1.2;                                      // raccoon scale on the stage
  const SNATCH = 2.55, LAND = 2.85, DASH = 3.1, LEAP = 3.62, IN = 3.86, SHUT = 11.5;

  // ---------------------------------------------------------------- sprites
  const backdrop = () => RR.sprite('s12:backdrop', 3600, 1080, () => {
    push(); translate(200, 0); // world x -200 .. 3400
    RR.water(RR.ellipsePts(860, 560, 900, 420, 30), '#e3d0e0', { layers: 14, alpha: 26, spread: 0.05, edge: 0.3 });
    RR.water(RR.ellipsePts(2360, 540, 950, 430, 30), '#e8d6e2', { layers: 12, alpha: 22, spread: 0.05, edge: 0.25 });
    RR.water(RR.ellipsePts(1500, 1000, 2100, 90, 36), '#d7c6b2', { layers: 10, alpha: 40, spread: 0.03 });
    // spotlight beams onto the podium
    for (const [x0, x1] of [[520, 760], [1300, 1060]]) RR.water([[x0 - 50, -20], [x0 + 50, -20], [x1 + 170, 940], [x1 - 170, 940]], '#f6e7b8', { layers: 8, alpha: 22, spread: 0.03, edge: 0.1 });
    // bunting across the stage, like the box art
    const cols = [C.pink, C.gold, C.teal, C.lilac, C.orange];
    // the string sags over the stage and rises steeply to the right, clear of the end-card title
    const rope = (x) => 175 - 0.00012 * (x - 600) * (x - 600);
    RR.inkLine(Array.from({ length: 15 }, (_, i) => [-200 + i * 140, rope(-200 + i * 140)]), { col: C.inkSoft, w: 0.8, curve: 0.6 });
    for (let i = 0; i < 13; i++) {
      const x = -150 + i * 150, y = rope(x);
      if (y < 45) continue;
      RR.ink([[x - 40, y], [x + 40, y + 2], [x, y + 70]], { fill: cols[i % cols.length], w: 0.8, curve: 0.1 });
    }
    // litter around the bin
    RR.ink([[3100, 970], [3150, 945], [3190, 970], [3160, 985]], { fill: '#f0cf5a', w: 0.9, curve: 0.5 });
    RR.ink(RR.rrectPts(2480, 935, 70, 44, 10), { fill: '#d9574a', w: 0.9 });
    RR.inkEllipse(2560, 957, 8, 22, { fill: '#b8c2c9', w: 0.8 });
    RR.ink(RR.ellipsePts(3250, 972, 22, 16, 9), { fill: '#f6f1e6', w: 0.8, curve: 0.2 });
    pop();
  }, { res: 0.6 });

  const podium = () => RR.sprite('s12:podium', 780, 300, () => {
    push(); translate(-530, -700); // world x 530..1310, y 700..1000
    const tiers = [[550, 800, '2', C.lilac], [790, 720, '1', C.pink], [1030, 850, '3', C.lilac]];
    for (const [x, top, n, col] of tiers) {
      const pts = RR.rrectPts(x, top, 240, FLOOR + 10 - top, 8);
      RR.water(pts, col, { layers: 10, alpha: 55, spread: 0.01, edge: 0.4 });
      RR.ink(pts, { stroke: C.plumDark, w: 1.1, curve: 0.1 });
      RR.ink(RR.rrectPts(x + 6, top + 6, 228, 16, 6), { fill: C.gold, stroke: false });
      RR.ink(RR.starPts(x + 120, top + 72, 34, 16), { fill: C.gold, stroke: C.goldDark, w: 0.8, curve: 0.1 });
      RR.text(n, x + 120, top + 86, { font: 'title', size: 44, col: C.plumDark });
    }
    pop();
  }, { res: 1 });

  const binBack = () => RR.sprite('s12:binBack', 380, 120, () => {
    RR.ink(RR.ellipsePts(190, 60, 170, 42, 28), { fill: '#4a5058', w: 1.2 });
    RR.ink(RR.ellipsePts(190, 64, 150, 30, 28), { fill: '#2a2d33', stroke: false });
  }, { res: 1.5 });
  const binFront = () => RR.sprite('s12:binFront', 380, 360, () => {
    const body = [[20, 30], [360, 30], [336, 340], [44, 340]];
    RR.water(body, '#7f8a93', { layers: 12, alpha: 45, spread: 0.01, edge: 0.5 });
    for (let i = 0; i < 6; i++) RR.inkLine([[70 + i * 48, 50], [78 + i * 45, 325]], { col: '#5d676f', w: 0.8, brush: 'pencil' });
    RR.ink(body, { stroke: C.ink, w: 1.3, curve: 0.08 });
    RR.ink(RR.ellipsePts(190, 30, 172, 26, 28), { fill: '#9aa5ad', w: 1.2 });
    RR.ink(RR.ellipsePts(190, 30, 150, 16, 28), { fill: '#2a2d33', stroke: false });
    RR.inkLine([[110, 150], [135, 175], [150, 150]], { col: '#5d676f', w: 0.8 });
    RR.ink(RR.rrectPts(160, 120, 60, 22, 8), { fill: '#6c757d', w: 0.8 });
  }, { res: 1.5 });
  const lid = () => RR.sprite('s12:lid', 400, 140, () => {
    RR.ink(RR.ellipsePts(200, 90, 184, 36, 28), { fill: '#9aa5ad', w: 1.2 });
    RR.ink([[40, 90], [80, 50], [200, 36], [320, 50], [360, 90]], { fill: '#b4bec5', w: 1.1, curve: 0.5 });
    RR.ink(RR.rrectPts(170, 12, 60, 30, 10), { fill: '#6c757d', w: 1 });
  }, { res: 1.5 });

  // clapping / shocked players (sprites; only the winner is drawn live)
  const PPOSE = {
    clapA: { eyes: 'happy', mouth: 'grin', handL: [-40, -150], handR: [40, -150], look: [0.4, -0.3] },
    clapB: { eyes: 'happy', mouth: 'smile', handL: [-8, -158], handR: [8, -158], look: [0.4, -0.3] },
    shock: { eyes: 'wide', mouth: 'o', brow: 'up', armL: 0.9, armR: 0.9, look: [1, -0.2], turn: 0.4 },
  };
  const personSpr = (role, pose) => RR.sprite(`s12:p:${role}:${pose}`, 320, 380, () => {
    RR.drawPerson(role, 160, 366, 1, PPOSE[pose]);
  }, { res: 1.1 });

  // ---------------------------------------------------------------- title (as in s01)
  const titleLetters = (t, word, y, start) => {
    const size = 200;
    const adv = [...word].map((ch) => RR.textWidth(ch, { font: 'title', size }) + 4);
    let x = TX - adv.reduce((a, b) => a + b, 0) / 2;
    [...word].forEach((ch, i) => {
      const cw = adv[i];
      const tt = start + i * 0.07;
      const k = RR.seg(t, tt, tt + 0.35);
      if (k > 0) {
        const s = RR.E.outBack(k);
        const rot = RR.hrange(i + y, -0.08, 0.08) * (1 - k) + RR.hrange(i * 3 + y, -0.03, 0.03);
        const bob = Math.sin(t * 2.4 + i * 0.8) * 3 * k;
        push();
        translate(x + cw / 2, y + bob - size * 0.3);
        rotate(rot);
        scale(s);
        RR.text(ch, -cw / 2, size * 0.3, { font: 'title', size, col: '#d9a6c6', outline: C.plumDark, outlineW: 7, align: 'left', shadow: true });
        pop();
      }
      x += cw;
    });
  };
  const LINES = [
    ['3-4 players  |  45-60 min  |  ages 12+', 652, 54, C.ink, 5.7],
    ['Play free on Tabletopia or print & play', 734, 54, C.ink, 6.15],
    ['raccoonrampage.ecologygames.eu', 818, 56, C.plum, 6.6],
    ['A Paidia game, co-designed with scientists', 906, 48, C.plumMid, 7.2],
  ];
  const drawEndCard = (t) => {
    if (t < 4.2) return;
    RR.text('BIOINVADERS!', TX, 172, { font: 'bold', size: 54, col: C.plum, alpha: RR.seg(t, 4.25, 4.7) });
    titleLetters(t, 'RACCOON', 350, 4.3);
    titleLetters(t, 'RAMPAGE', 528, 4.8);
    // painted underline between the title and the details
    const ul = RR.seg(t, 5.4, 5.8, 'outCubic');
    if (ul > 0) RR.flat(RR.rrectPts(TX - 250, 574, 500 * ul, 7, 3), C.rose, 200);
    for (const [str, y, size, col, t0] of LINES) {
      const k = RR.seg(t, t0, t0 + 0.4, 'outCubic');
      if (k > 0) RR.text(str, TX, y + (1 - k) * 18, { font: 'hand', size, col, alpha: k });
    }
  };

  // ---------------------------------------------------------------- characters
  const arPose = (t) => {
    if (t < SNATCH) return RR.personIdle(t, 2, {
      prop: 'trophy', armR: 2.85 + 0.08 * Math.sin(t * 6), armL: 2.1 + 0.35 * Math.sin(t * 6 + 1),
      eyes: 'happy', mouth: 'grin', brow: 'up', hop: Math.abs(Math.sin(t * Math.PI * 2)) * 14, blush: 1,
    });
    if (t < 2.95) return RR.personIdle(t, 2, { armR: 2.85, armL: 1.2, look: [0.5, -1], eyes: 'wide', mouth: 'o', brow: 'up', squash: -0.04, headTilt: 0.1 });
    return RR.personIdle(t, 2, { armR: Math.PI / 2 + 0.1 * Math.sin(t * 20), armL: 0.3, turn: 0.6, look: [1, 0.1], brow: 'angry', mouth: 'open', lean: 0.06 });
  };

  // Raccoon position and pose over the whole scene. Returns null while hidden in the bin.
  const raccoonAt = (t) => {
    const base = RR.raccoonIdle(t, { tailUp: 0.8 });
    if (t < 0.85) return null;
    if (t < 2.05) { // tiptoe in from the right, one careful step at a time
      const u = RR.seg(t, 0.85, 2.05) * 4, st = Math.floor(Math.min(u, 3.999)), f = u - st;
      const x = 2080 - 160 * (st + RR.E.inOutCubic(f));
      const peek = Math.sin(t * 2.2) > 0.2;
      return { x, y: FLOOR - 12 * Math.sin(Math.PI * f), s: RS, back: false, pose: { ...base, face: -1, run: (st + f) * Math.PI, stride: 0.45, lean: -0.12, armF: 2.3, armB: 1.3, brow: 'sly', mouth: 'smile', look: peek ? [0.6, 0] : [-1, -0.8], tailUp: 0.9 } };
    }
    if (t < 2.35) { // crouch: eyes on the prize
      const c = RR.seg(t, 2.05, 2.3, 'outCubic');
      return { x: 1440, y: FLOOR, s: RS, pose: { ...base, face: -1, squash: 0.22 * c, armF: 0.3, armB: 0.2, lean: -0.15 * c, brow: 'sly', mouth: 'grin', look: [-1, -1], tailUp: 1, ear: 0.6 } };
    }
    if (t < LAND) { // leap, grab at the top, fall back down on the right
      const up = t < SNATCH;
      const u = up ? RR.seg(t, 2.35, SNATCH) : RR.seg(t, SNATCH, LAND);
      const x = up ? RR.lerp(1440, 1048, u) : RR.lerp(1048, 1330, u);
      const y = up ? RR.lerp(FLOOR, 628, RR.E.outQuad(u)) : RR.lerp(628, FLOOR, RR.E.inQuad(u));
      return { x, y, s: RS, pose: { ...base, face: up ? -1 : 1, squash: -0.2, armF: up ? 2.1 : 2.4, armB: 2.6, lean: up ? 0.15 : -0.1, eyes: up ? 'wide' : 'happy', mouth: up ? 'o' : 'grin', brow: 'up', hold: up ? null : 'trophy', tailUp: 1 } };
    }
    if (t < DASH) { // landed: cackle at the camera, trophy up
      const sq = 0.22 * Math.exp(-(t - LAND) * 14);
      return { x: 1330, y: FLOOR, s: RS, pose: { ...base, face: 1, squash: sq - 0.02, armF: 2.6, armB: 1.8, lean: t > 3.02 ? -0.15 : 0, eyes: 'happy', mouth: 'cackle', brow: 'sly', look: [-0.3, 0.2], hold: 'trophy', tailUp: 1 } };
    }
    if (t < LEAP) { // dash to the bin
      const u = RR.seg(t, DASH, LEAP, 'inQuad');
      return { x: RR.lerp(1330, 2560, u), y: FLOOR, s: RS, run: true, pose: { ...base, face: 1, run: t * 18, stride: 1, lean: 0.3, armF: 2.5, armB: 0.9, mouth: 'grin', brow: 'sly', hold: 'trophy', tailUp: 1, tail: t * 8 } };
    }
    if (t < 4.15) { // dive into the bin
      const u = RR.seg(t, LEAP, IN);
      let [x, y] = RR.hop([2560, FLOOR], [BIN.x, BIN.rim + 40], u, 300);
      if (t > IN) y = RR.lerp(BIN.rim + 40, BIN.rim + 470, RR.E.inQuad(RR.seg(t, IN, 4.1)));
      return { x, y, s: RS, back: u > 0.55, pose: { ...base, face: 1, squash: -0.2, lean: RR.lerp(0.2, 0.45, u) * (1 - RR.seg(t, IN, 4.0)), armF: 2.8, armB: 2.8, eyes: 'happy', mouth: 'grin', hold: 'trophy', tailUp: 1 } };
    }
    // end card: peeks out under the lid with the trophy, then ducks at 11
    if (t < 6.25 || t > 11.45) return null;
    let d = RR.kf(t, [[6.25, 420], [6.6, 185, 'outCubic'], [6.95, 185], [7.2, 96, 'outBack'], [11.0, 96], [11.14, 72, 'outQuad'], [11.42, 470, 'inQuad']]);
    const armUp = RR.seg(t, 6.95, 7.25, 'outBack') * (1 - RR.seg(t, 11.1, 11.3));
    let pose = RR.raccoonIdle(t, { face: 1, armF: RR.lerp(0.2, 1.72 + 0.07 * Math.sin(t * 3), armUp), armB: 0.2, hold: 'trophy', mouth: 'grin', brow: 'sly', tailUp: 0.5 });
    if (t < 7.1) pose = { ...pose, mouth: 'smile', look: [Math.sin(t * 5) > 0 ? 1 : -1, -0.2] };
    else if (t < 8.2) pose = { ...pose, look: [-0.2, 0.2], mouth: 'grin' };
    else if (t < 9.2) pose = { ...pose, look: [-1, -0.4], brow: 'sly', mouth: 'smile', headTilt: -0.1 };
    else if (t < 10.2) pose = { ...pose, look: [-0.2, 0.2], brow: Math.floor(t * 7) & 1 ? 'up' : 'sly', mouth: 'grin' };
    else if (t < 11.0) pose = { ...pose, look: [0, 0.3], eyes: 'happy', mouth: 'cackle' };
    else pose = { ...pose, eyes: 'wide', mouth: 'o', brow: 'up', squash: t < 11.14 ? 0.1 : -0.12 };
    if (t < 7.3 && t > 7.1) pose.squash = -0.12 * Math.sin(Math.PI * RR.seg(t, 7.1, 7.3));
    return { x: BIN.x, y: BIN.rim + d, s: 1.7, back: true, pose };
  };
  // Where the lid sits: on the bin, knocked into the air, perched on the Raccoon's head, falling shut.
  const lidAt = (t, r) => {
    const rest = [BIN.x, BIN.rim - 16, 0];
    if (t >= 3.64 && t < 4.2) { // flips up out of the way as the Raccoon dives in, spins, lands back on
      const u = RR.seg(t, 3.64, 4.2);
      const y = u < 0.45 ? RR.lerp(rest[1], rest[1] - 300, RR.E.outQuad(u / 0.45)) : RR.lerp(rest[1] - 300, rest[1], RR.E.inQuad((u - 0.45) / 0.55));
      return [BIN.x + 190 * Math.sin(Math.PI * u), y, Math.PI * 2 * RR.E.inOutQuad(u)];
    }
    if (t >= 6.25 && t < SHUT) {
      const fall = RR.seg(t, 11.14, SHUT);
      const onHead = (tt) => { const rr = raccoonAt(tt); return rr ? rr.y - 1.7 * 186 : rest[1]; };
      if (fall <= 0) {
        const y = Math.min(rest[1], onHead(t));
        const tilt = RR.clamp((rest[1] - y) / 120);
        return [BIN.x - 10 * tilt, y, -0.26 * tilt + 0.03 * Math.sin(t * 3) * tilt];
      }
      const y0 = Math.min(rest[1], onHead(11.14));
      return [BIN.x - 10, RR.lerp(y0, rest[1], RR.E.inQuad(fall)), RR.lerp(-0.26, 0, fall)];
    }
    if (t >= SHUT && t < SHUT + 0.5) { // clang: little bounce and rattle
      const e = t - SHUT;
      return [BIN.x - 10 * Math.exp(-e * 20), rest[1] - Math.abs(Math.sin(e * 22)) * 12 * Math.exp(-e * 9), 0.07 * Math.sin(e * 45) * Math.exp(-e * 8)];
    }
    if (t >= 4.2 && t < 4.7) { // first clang settle
      const e = t - 4.2;
      return [BIN.x, rest[1] - Math.abs(Math.sin(e * 22)) * 10 * Math.exp(-e * 9), 0.06 * Math.sin(e * 45) * Math.exp(-e * 8)];
    }
    return rest;
  };

  const drawStage = (t) => {
    RR.drawSprite(podium(), 920, 850, { w: 780, h: 300 });
    // players: the winner live, the others clapping (sprites)
    for (const role of ['hu', 'de', 'fr']) {
      const [x, y] = SPOT[role];
      const i = { hu: 0, de: 1, fr: 2 }[role];
      const pose = t < SNATCH + 0.08 ? (Math.floor(t * 8 + i) & 1 ? 'clapA' : 'clapB') : 'shock';
      const bob = t < SNATCH ? Math.abs(Math.sin(t * Math.PI * 2 + i)) * 6 : 0;
      const jolt = RR.seg(t, SNATCH + 0.08, SNATCH + 0.25);
      RR.shadow(x, y + 4, 56, 12, 30);
      RR.drawSprite(personSpr(role, pose), x, y - bob, { w: 320, h: 380, ax: 0.5, ay: 366 / 380, sy: 1 + 0.08 * Math.sin(Math.PI * jolt) });
    }
    const [ax, ay] = SPOT.ar;
    RR.shadow(ax, ay + 4, 56, 12, 30);
    RR.drawPerson('ar', ax, ay, 1, arPose(t));
    // celebration confetti over the stage
    const cols = [C.pink, C.gold, C.teal, C.lilac, C.orange];
    for (let i = 0; i < 34; i++) {
      const age = t + RR.hr(i + 400) * 3;
      const y = -40 + (age * RR.hrange(i + 410, 180, 300)) % 1100;
      const x = RR.hrange(i + 420, 120, 1500) + Math.sin(age * 2.5 + i) * 26;
      const rot = age * RR.hrange(i + 430, -6, 6), fl = 0.3 + 0.7 * Math.abs(Math.cos(age * RR.hrange(i + 440, 4, 9)));
      const cr = Math.cos(rot), sr = Math.sin(rot);
      RR.flat([[-10, -6 * fl], [10, -6 * fl], [10, 6 * fl], [-10, 6 * fl]].map(([px, py]) => [x + px * cr - py * sr, y + px * sr + py * cr]), cols[i % cols.length], 230);
    }
  };

  const drawBinAndRaccoon = (t, r) => {
    // bin wobble when the Raccoon lands inside, and on the final clang
    const hit = Math.max(Math.exp(-Math.max(0, t - 4.0) * 7) * (t >= 4.0 ? 1 : 0), t >= SHUT ? Math.exp(-(t - SHUT) * 8) : 0);
    const wob = hit * Math.sin((t - 4.0) * 30) * 0.02;
    const sq = 1 - 0.05 * hit;
    const by = BIN.rim + 330;
    RR.shadow(BIN.x, BIN.base + 6, 210, 26, 50);
    RR.drawSprite(binBack(), BIN.x, by, { w: 380, h: 120, ax: 0.5, ay: 3.25, sy: sq, rot: wob });
    if (r && r.back) {
      RR.drawRaccoon(r.x, r.y, r.s, r.pose);
    }
    RR.drawSprite(binFront(), BIN.x, by, { w: 380, h: 360, ax: 0.5, ay: 1, sy: sq, rot: wob });
    const [lx, ly, lr] = lidAt(t, r);
    RR.drawSprite(lid(), lx, ly + (1 - sq) * 360, { w: 400, h: 140, rot: lr + wob });
  };

  RR.scene({
    id: 's12_finale', order: 12, dur: 12, music: 'finale',
    cues: [
      [0.05, 'whoosh', 0.6], [0.4, 'cheer', 0.8], [1.2, 'tick', 0.35], [1.5, 'tick', 0.35], [1.8, 'tick', 0.35], [2.05, 'tick', 0.35],
      [2.36, 'whoosh', 0.6], [2.55, 'pop'], [2.62, 'sad', 0.5], [2.88, 'chitter'], [3.1, 'whoosh'],
      [3.62, 'boing'], [3.66, 'rattle', 0.6], [4.2, 'clang', 0.8], [4.35, 'brush'], [4.85, 'brush'],
      [5.7, 'paper', 0.6], [6.15, 'paper', 0.6], [6.3, 'rattle', 0.5], [6.6, 'paper', 0.6], [7.2, 'chitter'], [7.25, 'pencil', 0.5],
      [8.6, 'sparkle', 0.7], [10.4, 'sparkle', 0.7], [10.3, 'chitter', 0.8], [11.0, 'hop', 0.6], [SHUT, 'clang'],
    ],
    draw(t) {
      const camX = 960 + PAN * RR.E.inOutCubic(RR.seg(t, 2.95, 4.0));
      let cam = RR.drift(RR.cam(camX, 540, 1), t, 0.6);
      const sh = RR.shake(t, SHUT, 0.45, 12), sh1 = RR.shake(t, 4.2, 0.3, 7);
      cam = { ...cam, x: cam.x + sh[0] + sh1[0], y: cam.y + sh[1] + sh1[1] };
      const r = raccoonAt(t);
      RR.withCam(cam, () => {
        RR.drawSprite(backdrop(), 1600, 540, { w: 3600, h: 1080 });
        if (t < 4.1) drawStage(t);
        // speed lines behind the dash
        const sp = RR.env(t, DASH + 0.05, LEAP + 0.1, 0.1, 0.12);
        if (sp > 0 && r) for (let i = 0; i < 6; i++) {
          const y = FLOOR - 40 - i * 34, len = RR.hrange(i + 7, 140, 320);
          RR.flat(RR.rrectPts(r.x - 90 - len - RR.hr(i + 3) * 60, y, len, 5, 2), C.plumMid, 120 * sp);
        }
        if (r && !r.back) { RR.shadow(r.x, FLOOR + 4, 60 * r.s, 12, 36); RR.drawRaccoon(r.x, r.y, r.s, r.pose); }
        drawBinAndRaccoon(t, r);
        // gleam on the trophy while it is shown off
        if (r && r.back && t > 7.2) {
          const hx = r.x + 1.7 * 74, hy = r.y - 1.7 * 128;
          RR.sparkle(hx, hy, t, 8.6, { r: 70, n: 7, size: 16 });
          RR.sparkle(hx, hy, t, 10.4, { r: 70, n: 7, size: 16, seed: 5 });
        }
      });
      drawEndCard(t);
      // the plum wipe from s11 uncovers the stage, its edge travelling left to right.
      // (A mirrored cover-wipe run backwards: RR.wipe's `out` mode skips bands that have not
      // started moving, so it would leave the first frames uncovered.)
      const u = RR.seg(t, 0, 0.8);
      if (u < 1) RR.wipe(1 - u, { dir: -1 });
    },
  });
})();
