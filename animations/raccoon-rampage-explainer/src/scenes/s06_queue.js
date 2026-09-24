// Scene 6 (66-80 s): Step 1, the queue phase. The Raccoon shoves the whole queue one
// space to the right: the front policy (Protect Breeding Sites) tips off the end onto the
// evaluation spot, the card entering space 4 (Drone Zappers) flips face up and space 8 is
// left empty. The Raccoon hops along the row, reads the new card and flees in a panic;
// the camera follows the front policy down to the evaluation spot.

(() => {
  const B = RR.board;
  const QCAM = RR.cam(1250, 330, 0.95);   // hand-off from s05
  const WIDE = RR.cam(1270, 400, 0.86);   // whole queue + evaluation spot
  const K4CAM = RR.cam(1394, 170, 1.3);   // space 4 close-up
  const ECAM = RR.cam(1850, 680, 1.1);    // hand-off to s07

  // S5 (start) board state, without the queue (the queue is animated below).
  const S5 = B.clone(B.SETUP);
  S5.story[0] = 'corprelief';
  S5.queue = [];

  // Queue cards in S5. k0 = starting space; every card ends on k0 - 1.
  const PROTECT_VOTES = ['de', 'de', 'de', 'fr', 'ar'];
  const Q = [
    { id: 'burgers', k0: 2, votes: ['corp'] },
    { id: 'pets', k0: 3, votes: ['ar', 'fr'] },
    { id: 'wear', k0: 4, votes: ['hu', 'corp'] },
    { id: 'drones', k0: 5, votes: [] },
    { id: 'back:policy', k0: 6 }, { id: 'back:policy', k0: 7 }, { id: 'back:policy', k0: 8 },
  ];

  // ---------------------------------------------------------------- timing
  const PUSH = 2.2;                                  // hands meet the back card
  const slideStart = (k0) => PUSH + (8 - k0) * 0.035; // ripple from the back
  const SLIDE = 0.8;
  const backOut = (s) => (u) => 1 + (s + 1) * Math.pow(u - 1, 3) + s * Math.pow(u - 1, 2);
  const slideEase = backOut(1.3);                    // ~6% overshoot
  const FALL0 = 2.9, FALL1 = 3.44;                   // protect tips off and lands on EVAL
  const FLIP0 = 3.6, FLIP1 = 4.06;                   // drones flips face up in space 4
  const HOPS = [[4.98, 5.48, [372, 330], [728, 92], 170], [5.75, 6.15, [728, 92], [940, 92], 80],
    [6.3, 6.7, [940, 92], [1152, 92], 80], [6.85, 7.28, [1152, 92], [1364, 92], 90]];
  const RS = 1.0; // raccoon scale

  // cube layout identical to RR.board.cubesOnCard, with optional per-cube lift
  const CUBE = 32;
  const cubeXY = (roles, i, size = CUBE) => {
    const n = roles.length, col = i % 3, row = Math.floor(i / 3), inRow = Math.min(3, n - row * 3);
    return [(col - (inRow - 1) / 2) * size * 1.15 + (row % 2) * 6, 38 - row * size * 0.9];
  };
  const drawCubes = (x, y, roles, lift = () => 0) => roles.forEach((r, i) => {
    const [cx, cy] = cubeXY(roles, i);
    RR.drawCube(x + cx, y + cy - lift(i), CUBE, r);
  });

  // Landing dip of a card when the Raccoon lands on it.
  const cardDip = (k, t) => {
    let d = 0;
    for (const [, t1, , q] of HOPS) {
      if (Math.abs(q[0] - B.slot(k)[0]) < 5 && q[1] < 100) {
        const u = (t - t1) / 0.35;
        if (u > 0 && u < 1) d += Math.sin(u * Math.PI) * 7 * (1 - u);
      }
    }
    return d;
  };

  // Soft gold halo behind a card (a = 0..1).
  const glow = (x, y, a) => {
    if (a <= 0) return;
    for (let i = 3; i >= 1; i--) {
      const e = i * 9;
      RR.flat(RR.rrectPts(x - 95 - e, y - 132 - e, 190 + 2 * e, 265 + 2 * e, 16 + e, 3), RR.C.gold, 75 * a / i);
    }
  };

  const drawQueue = (t) => {
    for (const c of Q) {
      const t0 = slideStart(c.k0);
      const u = RR.clamp((t - t0) / SLIDE);
      const k = c.k0 - slideEase(u);
      const arc = Math.sin(Math.PI * Math.min(1, u * 1.25));
      let dy = -8 * arc + cardDip(Math.round(k), t);
      let lift = 0.55 * arc, rot = 0.025 * arc;
      let flip = c.k0 <= 4 ? 1 : 0;
      if (c.id === 'drones') {
        const f = RR.seg(t, FLIP0, FLIP1, 'inOutCubic');
        const fa = Math.sin(Math.PI * RR.seg(t, FLIP0 - 0.08, FLIP1 + 0.1));
        flip = f;
        dy -= 26 * fa;
        lift = Math.max(lift, fa);
        rot += -0.05 * fa;
      }
      const [x, y] = B.slot(k);
      const o = { w: 190, flip, lift };
      if (rot) o.rot = rot;
      if (c.id === 'drones') glow(x, y + dy, RR.env(t, 7.45, 9.9, 0.3, 0.5));
      RR.drawCard(c.id, x, y + dy, o);
      if (c.votes && c.votes.length && flip >= 0.5) drawCubes(x, y + dy, c.votes);
    }
  };

  // The front policy: slides off the end, tips over and lands on the evaluation spot.
  const drawProtect = (t) => {
    const t0 = slideStart(1);
    let x, y, rot = 0, lift = 0, sx = 1, sy = 1;
    const cubeLift = (i) => {
      const u = RR.seg(t, FALL1 + 0.02 + i * 0.035, FALL1 + 0.24 + i * 0.035);
      return Math.sin(Math.PI * u) * 14;
    };
    if (t < FALL0) {
      const u = RR.seg(t, t0, FALL0);
      x = RR.lerp(2000, 2196, RR.E.outQuad(u));
      y = 225 - 8 * Math.sin(Math.PI * Math.min(1, u * 1.25));
      lift = 0.55 * Math.sin(Math.PI * Math.min(1, u * 1.25));
      rot = 0.025 * Math.sin(Math.PI * u);
    } else if (t < FALL1) {
      const u = RR.seg(t, FALL0, FALL1);
      const g = RR.E.inQuad(u);
      x = RR.lerp(2196, 2215, u);
      y = RR.lerp(225, 640, g) - Math.sin(Math.PI * u) * 46;
      rot = 0.32 * Math.sin(Math.PI * Math.pow(u, 0.8));
      lift = 0.9;
    } else {
      x = 2215; y = 640;
      const u = RR.seg(t, FALL1, FALL1 + 0.4);
      const sq = Math.exp(-u * 5) * Math.cos(u * 14) * (u < 1 ? 1 : 0);
      sx = 1 + 0.06 * sq; sy = 1 - 0.06 * sq;
      lift = 0.4 * (1 - RR.E.outCubic(u));
    }
    // glow while the camera arrives at the evaluation spot
    glow(x, y, RR.env(t, 11.4, 13.7, 0.5, 0.6) * (0.75 + 0.25 * Math.sin((t - 11.4) * 6)));
    push();
    translate(x, y);
    if (rot) rotate(rot);
    if (sx !== 1) scale(sx, sy);
    RR.drawCard('protect', 0, 0, { w: 190, lift });
    drawCubes(0, 0, PROTECT_VOTES, cubeLift);
    pop();
  };

  // Soft pulse on the now-empty space 8.
  const drawEmptyPulse = (t) => {
    const [x, y] = B.slot(8);
    for (const p0 of [4.1, 4.55]) {
      const u = RR.seg(t, p0, p0 + 0.7);
      if (u <= 0 || u >= 1) continue;
      const e = 6 + 26 * RR.E.outCubic(u), a = 1 - u;
      RR.flat(RR.rrectPts(x - 102, y - 140, 204, 280, 16), RR.C.lilac, 70 * a);
      RR.ink(RR.rrectPts(x - 102 - e, y - 140 - e, 204 + 2 * e, 280 + 2 * e, 16 + e), { stroke: RR.C.white, w: 1.4 * a + 0.3, curve: 0.2, fill: false });
    }
  };

  // ---------------------------------------------------------------- the Raccoon
  const raccoon = (t) => {
    if (t < 0.25 || t > 10.1) return null;
    let x, y = 330, face = 1;
    let p = RR.raccoonIdle(t, { mouth: 'smile', armF: 0.35, armB: 0.25 });
    if (t < 1.0) { // scamper in
      x = RR.tw(t, 0.25, 1.0, 50, 330, 'outQuad');
      p = { ...p, run: t * 19, stride: 1, lean: 0.22, tail: t * 9, tailUp: 0.9, mouth: 'grin', armF: 1.0 + 0.5 * Math.sin(t * 19), armB: 1.0 - 0.5 * Math.sin(t * 19) };
    } else if (t < 2.06) {
      x = 330;
      const skid = Math.exp(-(t - 1.0) * 7);
      p = { ...p, lean: -0.2 * skid, squash: 0.14 * skid * Math.cos((t - 1.0) * 18) };
      if (t < 1.28) p = { ...p, mouth: 'o', brow: 'up', look: [1, 0] };
      else if (t < 1.6) p = { ...p, look: t < 1.4 ? [1, 0.1] : [-0.2, 0.3], brow: 'sly', mouth: 'grin', headTilt: t < 1.4 ? 0.05 : -0.1 };
      else if (t < 1.86) { // rub paws
        const r = Math.sin(t * 42);
        p = { ...p, armF: 2.05 + 0.18 * r, armB: 1.85 - 0.18 * r, eyes: 'happy', mouth: 'grin', brow: 'sly', squash: 0.03 * r };
      } else { // anticipation crouch
        const k = RR.seg(t, 1.86, 2.04, 'outCubic');
        p = { ...p, squash: 0.2 * k, lean: -0.22 * k, armF: RR.lerp(2.0, 0.6, k), armB: RR.lerp(1.8, 0.5, k), brow: 'angry', mouth: 'flat', look: [1, 0] };
      }
    } else if (t < 2.5) { // lunge: the paws meet the back card at PUSH, then follow through
      const k = RR.seg(t, 2.06, PUSH, 'inOutQuad');
      x = t < PUSH ? RR.lerp(330, 335, k) : RR.tw(t, PUSH, 2.5, 335, 372, 'outQuad');
      p = { ...p, lean: RR.lerp(-0.22, 0.34, k), squash: RR.lerp(0.2, -0.12, k), armF: RR.lerp(0.6, 1.55, k), armB: RR.lerp(0.5, 1.45, k), eyes: t < PUSH ? 'open' : 'closed', mouth: t < PUSH ? 'flat' : 'open', brow: 'angry', look: [1, 0] };
    } else if (t < 4.98) {
      x = 372;
      const rec = RR.seg(t, 2.5, 2.95, 'inOutCubic');
      p = { ...p, lean: RR.lerp(0.34, 0.06, rec), squash: RR.lerp(-0.12, 0, rec), armF: RR.lerp(1.55, 0.9, rec), armB: RR.lerp(1.45, 0.5, rec), mouth: 'o', brow: 'up', look: [1, RR.tw(t, 2.9, 3.4, -0.1, 0.7)], blink: 0 };
      if (t >= FALL1 && t < 3.72) p = { ...p, eyes: 'closed', squash: 0.12, mouth: 'frown', brow: 'worried', armF: 2.3, armB: 2.1, headTilt: 0.1 };
      else if (t >= 3.72 && t < 4.12) p = { ...p, mouth: 'cackle', eyes: 'happy', brow: 'neutral', armF: 2.25, armB: 0.4, squash: 0.05 * Math.sin(t * 34), headTilt: -0.08, look: [0, 0] };
      else if (t >= 4.12 && t < 4.45) p = { ...p, look: [1, 0.4], mouth: 'o', brow: 'up', armF: 0.5, armB: 0.3, headTilt: 0.08 };
      else if (t >= 4.45 && t < 4.84) { // shrug
        const k = RR.E.outBack(RR.seg(t, 4.45, 4.68));
        p = { ...p, look: [0.1, 0.2], mouth: 'smile', brow: 'up', armF: 0.3 + 1.1 * k, armB: 0.3 + 1.1 * k, headTilt: 0.16 * k, squash: -0.04 * k };
      } else if (t >= 4.84) { // crouch before the leap
        const k = RR.seg(t, 4.84, 4.98, 'outCubic');
        p = { ...p, squash: 0.18 * k, lean: 0.1, armF: 0.4, armB: 0.3, look: [1, -0.6], brow: 'sly', mouth: 'grin' };
      }
    } else if (t < 7.4) { // hop along the tops of the cards
      let h = HOPS.find((hh) => t < hh[1] + 0.001);
      const idx = h ? HOPS.indexOf(h) : HOPS.length - 1;
      h = h || HOPS[HOPS.length - 1];
      const [a, b, P, Qp, H] = h;
      if (t < a) { // resting on a card between hops
        x = P[0]; y = P[1];
        const land = RR.seg(t, HOPS[idx - 1] ? HOPS[idx - 1][1] : a, (HOPS[idx - 1] ? HOPS[idx - 1][1] : a) + 0.3);
        const pre = RR.seg(t, a - 0.14, a, 'outCubic');
        p = { ...p, squash: 0.16 * Math.sin(Math.PI * land) * (1 - land) * 2 + 0.16 * pre, look: [1, 0.2], mouth: 'grin', armF: 0.5, armB: 0.3, tailUp: 0.7 };
      } else {
        const u = RR.seg(t, a, b);
        [x, y] = RR.hop(P, Qp, RR.E.inOutQuad(u), H);
        p = { ...p, squash: -0.16 * Math.sin(Math.PI * u), armF: 2.4, armB: 2.2, tailUp: 1, tail: t * 6, mouth: 'grin', eyes: idx === 0 ? 'happy' : 'open', look: [1, 0.3], lean: 0.12 };
      }
      if (t >= HOPS[3][1]) {
        x = 1364; y = 92;
        const land = RR.seg(t, HOPS[3][1], HOPS[3][1] + 0.3);
        p = { ...p, squash: 0.16 * Math.sin(Math.PI * land) * (1 - land) * 2, armF: 0.5, armB: 0.3 };
      }
    } else { // on top of the card in space 4
      x = 1364; y = 92;
      if (t < 8.0) { // peering down to read it
        const k = RR.seg(t, 7.4, 7.7, 'inOutCubic');
        p = { ...p, lean: 0.34 * k, look: [0.3, 1], headTilt: 0.18 * k, mouth: 'flat', brow: 'neutral', armF: 0.8, armB: 0.3, blink: 0 };
      } else if (t < 8.75) { // DRONE ZAPPERS! jump in fright
        const u = RR.seg(t, 8.0, 8.34);
        y = 92 - Math.sin(Math.PI * u) * 46;
        const land = RR.seg(t, 8.34, 8.6);
        p = { ...p, eyes: 'wide', brow: 'worried', mouth: 'o', tailUp: 1, armF: 2.8 - land * 1.2, armB: 2.6 - land * 1.2, squash: u < 1 ? -0.2 * Math.sin(Math.PI * u) : 0.14 * Math.sin(Math.PI * land), look: [0, 0.4], ear: 1, blink: 0 };
      } else if (t < 9.3) { // gulp at the camera
        const tr = Math.sin(t * 70) * 2.2;
        x += tr;
        p = { ...p, eyes: 'wide', brow: 'worried', mouth: t > 8.95 && t < 9.1 ? 'flat' : 'frown', look: [-0.3, 0.35], armF: 1.4, armB: 1.3, tailUp: 1, squash: t > 8.95 && t < 9.1 ? 0.06 : 0, blink: 0 };
      } else { // flee left along the card tops
        face = -1;
        x = RR.tw(t, 9.3, 10.1, 1364, 420, 'inQuad');
        p = { ...p, run: t * 22, stride: 1, lean: 0.3, tail: t * 10, tailUp: 1, eyes: 'wide', brow: 'worried', mouth: 'open', armF: 1.3 + 0.6 * Math.sin(t * 22), armB: 1.3 - 0.6 * Math.sin(t * 22), look: [1, 0] };
      }
    }
    return { x, y, face, p: { ...p, face } };
  };

  const drawRaccoon = (t) => {
    const r = raccoon(t);
    if (!r) return;
    // skip it entirely once it is off screen (p5.brush is very slow for off-canvas shapes)
    const c = RR.curCam, a = RR.toScreen(c, [r.x - 115, r.y - 215]), b = RR.toScreen(c, [r.x + 115, r.y + 10]);
    if (b[0] < 0 || a[0] > RR.W || b[1] < 0 || a[1] > RR.H) return;
    // skid dust, landing dust
    RR.poof(350, 334, t, PUSH, { r: 26, dur: 0.45 });
    RR.poof(300, 334, t, 1.0, { r: 22, dur: 0.4 });
    for (const [, t1, , q] of HOPS) RR.poof(q[0], q[1] + 4, t, t1, { r: 20, dur: 0.35, col: '#efe3cc' });
    // dotted trail of each hop, pointing the way the queue moves
    for (const [a, b, P, Qp, H] of HOPS) {
      const fade = 1 - RR.seg(t, b + 0.15, b + 0.7);
      if (t < a || fade <= 0) continue;
      const u = RR.seg(t, a, b);
      for (let i = 1; i < 9; i++) {
        const s = i / 9;
        if (s > u) break;
        const [px, py] = RR.hop(P, Qp, RR.E.inOutQuad(s), H);
        RR.flatEllipse(px, py - 30, 5, 5, RR.C.white, 200 * fade);
      }
    }
    // speed lines while fleeing
    if (t > 9.35) {
      const a = RR.env(t, 9.35, 10.1, 0.1, 0.2);
      for (let i = 0; i < 4; i++) {
        const ly = r.y - 30 - i * 32, lx = r.x + 90 + RR.hr(i + 3) * 40, len = 70 + RR.hr(i + 7) * 60;
        RR.flat(RR.rrectPts(lx, ly, len, 5, 2.5), RR.C.inkSoft, 140 * a);
      }
    }
    if (r.y > 200) RR.shadow(r.x, r.y + 2, 52 * RS, 11 * RS, 45);
    RR.drawRaccoon(r.x, r.y, RS, r.p);
  };

  // ---------------------------------------------------------------- scene
  RR.scene({
    id: 's06_queue', order: 6, dur: 14, music: 'queue',
    cues: [
      [0.12, 'brush'], [0.35, 'hop', 0.5], [1.0, 'scratch', 0.35], [1.4, 'chitter'],
      [2.18, 'whoosh'], [2.22, 'slide'], [2.6, 'chitter', 0.6], [3.0, 'slide', 0.6], [3.44, 'thud'], [3.5, 'tock', 0.7], [3.62, 'tock', 0.6],
      [3.62, 'flip'], [3.76, 'chitter', 0.7], [4.1, 'pop', 0.5], [4.55, 'pop', 0.4], [4.85, 'paper'],
      [4.98, 'hop'], [5.75, 'hop'], [6.3, 'hop'], [6.85, 'hop'], [7.45, 'paper'], [7.5, 'sparkle', 0.6],
      [8.0, 'boing'], [8.05, 'chitter'], [8.95, 'pop', 0.35], [9.3, 'whoosh', 0.7],
      [9.85, 'whoosh', 0.4], [10.3, 'paper'], [11.6, 'sparkle', 0.6],
    ],
    draw(t) {
      let cam = RR.camKf(t, [[0, QCAM], [0.3, QCAM], [1.8, WIDE], [5.7, WIDE], [7.35, K4CAM], [9.8, K4CAM], [13.5, ECAM]]);
      const d = RR.env(t, 0, 13.4, 1.5, 1.5);
      if (d > 0) { const dr = RR.drift(cam, t, d); cam = dr; }
      const sh = RR.shake(t, FALL1, 0.3, 5);
      cam = { ...cam, x: cam.x + sh[0] / cam.z, y: cam.y + sh[1] / cam.z };

      RR.withCam(cam, () => {
        B.drawState(S5, { skip: { queue: true } });
        drawEmptyPulse(t);
        drawQueue(t);
        // highlight ring around the space 4 number
        const hl = RR.env(t, 7.45, 9.95, 0.3, 0.4);
        if (hl > 0) {
          const [x, y] = B.slot(4);
          const k = RR.E.outBack(RR.seg(t, 7.45, 7.8));
          push(); translate(x, y + 162); scale(Math.max(0.01, k));
          RR.flatEllipse(0, 0, 30, 30, RR.C.gold, 230 * hl);
          RR.text('4', 0, 11, { font: 'title', size: 32, col: RR.C.plumDark, alpha: hl });
          pop();
          RR.sparkle(x, y, t, 7.5, { r: 185, n: 10, size: 15 });
        }
        drawProtect(t);
        drawRaccoon(t);
        RR.sparkle(2215, 640, t, 11.6, { r: 150, n: 9, size: 16 });
      });

      RR.banner('STEP 1: QUEUE PHASE', t, 0.1, 2.0);
      RR.caption('Everything moves up one', t, 4.85, 7.3);
      RR.caption('Space 4 flips face up', t, 7.45, 9.9);
      RR.caption('The front policy is evaluated', t, 10.3, 13.6);
    },
  });
})();
