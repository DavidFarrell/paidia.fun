// Scene 3 (22-36 s): the board and the goal.
// The board assembles around the map while the camera pulls back, the setup pieces land,
// then the Impact Tracker shows the stakes: every raccoon added pushes the marker one space
// towards the skull (everyone loses, game over); the film rewinds to neutral, then every
// raccoon removed moves it one space into the green; then the top score wins. A second,
// lighter rewind resets the demo, so the scene ends on the full board in the SETUP state.

(() => {
  const B = RR.board;
  const MAPCAM = RR.cam(1150, 860, 1.2);
  const FULL = RR.cam(1200, 750, 0.66);
  const SETCAM = RR.cam(1185, 765, 0.69);   // gentle push-in while the pieces land
  const T1 = RR.cam(590, 840, 1.08);        // Impact Tracker close-up
  const T2 = RR.cam(580, 795, 1.15);        // leaning in as the marker climbs
  const T3 = RR.cam(590, 870, 1.13);        // following the slide down to the green

  // ---- key times (local seconds)
  const ASSEMBLED = 2.45;       // all board sections in place
  const SETTLED = 5.2;          // all setup pieces (except the tracker marker) at rest
  const MARKER_DROP = 4.95;
  const HOPS = [[6.45, 0.26], [6.8, 0.24], [7.12, 0.22], [7.4, 0.2], [7.63, 0.18], [7.84, 0.17], [8.04, 0.26]];
  const SKULL_T = 8.3;
  // Skull = game over, so the film rewinds: record scratch, freeze, then the whole climb
  // (marker, the pile of raccoons, the Raccoon's cackle) plays backwards to just before it.
  const SCR = 9.3, FRZ = 9.4, RWE = 9.82, REW_TO = 6.3;
  // Then raccoons leave the map one at a time; each removal moves the marker one space
  // towards the green (7 removals: 0 to -7).
  const REMOVED = [['fr', 4], ['fr', 3], ['fr', 2], ['de', 9], ['de', 8], ['de', 7], ['de', 6]];
  const REM = [9.86, 9.99, 10.11, 10.22, 10.32, 10.42, 10.52];    // token j starts to lift off
  const REM_LIFT = 0.09, STEP_D = 0.1;                            // lift before the poof; marker hop
  const GREEN_T = REM[6] + REM_LIFT + STEP_D;                     // marker lands on -7
  const STORM = [10.95, 11.35];                                   // the Raccoon storms off (gone before the scores)
  // A second, lighter rewind resets the demo to SETUP (tokens back, marker to neutral).
  const HOME = [13.15, 13.55];
  const HOME_FROM = GREEN_T + 0.08, HOME_TO = REM[0] - 0.04;
  // Demo clocks: ta drives the climb (rewound once), tb the removals (rewound at HOME).
  const ta = (t) => (t < SCR ? t : t < FRZ ? SCR : t < RWE ? RR.lerp(SCR, REW_TO, RR.E.inOutQuad(RR.seg(t, FRZ, RWE))) : REW_TO);
  const tb = (t) => (t < HOME[0] ? t : t < HOME[1] ? RR.lerp(HOME_FROM, HOME_TO, RR.E.inOutQuad(RR.seg(t, HOME[0], HOME[1]))) : HOME_TO);
  const CROWN_T = 12.25;
  const END = 13.7;             // from here on the frame is exactly drawState(SETUP)

  // ---- camera
  // Asymmetric ease: accelerates over the first `a` of the move, then a long glide in.
  const asym = (a) => (u) => (u < a ? (u * u) / a : a + 2 * (u - a) - ((u - a) * (u - a)) / (1 - a));
  const pullEase = asym(0.32);
  const camAt = (t) => {
    if (t < 2.8) return RR.lerpCam(MAPCAM, FULL, pullEase(RR.clamp(t / 2.8)));
    return RR.camKf(t, [[2.8, FULL], [5.15, SETCAM, 'inOutSine'], [6.25, T1, 'inOutCubic'], [8.1, T2, 'inOutSine'],
      [9.8, T2], [10.35, T3, 'inOutCubic'], [10.8, T3], [12.3, FULL, 'inOutCubic']]);
  };

  // ---- board sections flying in (0-2.4 s)
  const SECS = ['base', 'queue', 'tracker', 'map', 'right', 'story'];
  const ENTER = {
    base: { t0: 0.45, d: 0.6, grow: true },
    queue: { t0: 0.95, d: 0.55, dy: -560, rot: 0.03, dust: [[[520, 432], [1780, 432]], [0, 1]] },
    tracker: { t0: 1.25, d: 0.55, dx: -640, rot: -0.06, dust: [[[512, 470], [512, 1250]], [1, 0]] },
    right: { t0: 1.55, d: 0.55, dx: 700, rot: 0.06, dust: [[[1808, 470], [1808, 1250]], [-1, 0]] },
    story: { t0: 1.85, d: 0.55, dy: 460, rot: -0.03, dust: [[[520, 1292], [1780, 1292]], [0, -1]] },
  };
  const LAND = 0.526; // outBackSoft first reaches 1 at this fraction of the move
  const drawSections = (t) => {
    const lod = RR.curCam.z > 0.8 ? 'hi' : 'lo';
    for (const name of SECS) {
      const S = B.SECTIONS[name], e = ENTER[name];
      let dx = 0, dy = 0, sw = 1, sh = 1, rot = 0, a = 1;
      if (e) {
        const u = RR.seg(t, e.t0, e.t0 + e.d);
        if (u <= 0) continue;
        const k = RR.E.outBackSoft(u);
        dx = (e.dx || 0) * (1 - k);
        dy = (e.dy || 0) * (1 - k);
        rot = (e.rot || 0) * (1 - RR.E.outCubic(u));
        if (e.grow) {   // the board spreads out from beneath the map, evenly on every side
          const g = RR.E.inOutSine(u), M = B.MAP;
          sw = RR.lerp(M.w / S.w, 1, g); sh = RR.lerp(M.h / S.h, 1, g);
          dx = (M.x + M.w / 2 - (S.x + S.w / 2)) * (1 - g); dy = (M.y + M.h / 2 - (S.y + S.h / 2)) * (1 - g);
          a = RR.seg(t, e.t0, e.t0 + 0.12);
        }
      }
      RR.drawSprite(B.sectionSprite(name, lod), S.x + S.w / 2 + dx, S.y + S.h / 2 + dy, { w: S.w * sw, h: S.h * sh, alpha: a, rot });
    }
  };
  // Dust squeezed out of the seam where a section lands: puffs along the edge p..q,
  // drifting along the normal n (away from the map).
  const seamDust = (p, q, n, t, t0) => {
    const N = 9;
    for (let i = 0; i < N; i++) {
      const f = (i + RR.hrange(i * 3 + p[0], 0.2, 0.8)) / N, jit = RR.hr(i * 7 + p[0]);
      const u = RR.seg(t, t0 + Math.abs(f - 0.5) * 0.12, t0 + 0.7 + jit * 0.25);
      if (u <= 0 || u >= 1) continue;
      const e = RR.E.outCubic(u), d = e * RR.hrange(i + p[1], 10, 90);
      const slide = RR.hrange(i * 5 + p[1], -50, 50) * e;
      const x = RR.lerp(p[0], q[0], f) + n[0] * d + slide * Math.abs(n[1]);
      const y = RR.lerp(p[1], q[1], f) + n[1] * d + slide * Math.abs(n[0]);
      const r = RR.hrange(i + 3, 22, 44) * (0.5 + e);
      RR.flatEllipse(x, y, r, r * 0.75, '#d8c9d4', 90 * Math.pow(1 - u, 1.5));
      RR.flatEllipse(x + r * 0.5, y - r * 0.2, r * 0.6, r * 0.5, '#e6dbe2', 70 * Math.pow(1 - u, 1.5));
    }
  };
  const drawDust = (t) => {
    for (const name of SECS) {
      const e = ENTER[name];
      if (!e || !e.dust) continue;
      const [[p, q], n] = e.dust;
      seamDust(p, q, n, t, e.t0 + e.d * LAND);
    }
  };
  // Soft irregular dust puff (tokens vanishing)
  const puff = (x, y, t, t0, r = 44) => {
    const u = RR.seg(t, t0, t0 + 0.55);
    if (u <= 0 || u >= 1) return;
    const e = RR.E.outCubic(u);
    for (let i = 0; i < 9; i++) {
      const a = i * 0.7 + RR.hr(i + 31) * 0.6, d = r * e * RR.hrange(i + 11, 0.4, 1.15);
      const s = r * RR.hrange(i + 5, 0.25, 0.5) * (1 - 0.4 * u);
      RR.flatEllipse(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.7 - r * 0.5 * u, s, s * 0.85, '#efe6da', 190 * Math.pow(1 - u, 1.3));
    }
  };

  // ---- setup pieces (3.0-5.4 s)
  // A falling piece with a bouncy landing: height, squash and alpha, or null before t0.
  const drop = (t, t0, H, dur = 0.45) => {
    const u = t - t0;
    if (u < 0) return null;
    const k = RR.clamp(u / dur);
    const h = H * (1 - RR.E.outBounce(k));
    const hk = RR.clamp(h / H);
    const c = k < 1 ? RR.clamp(1 - h / 14) * (1 - k) : 0;
    return { h, hk, sx: 1 + 0.4 * c - 0.08 * hk, sy: 1 - 0.45 * c + 0.14 * hk, a: RR.clamp(u / 0.07), rest: k >= 1 };
  };
  const FIRST_CONTACT = 0.45 / 2.75;

  const dropToken = (t, t0, pos, kind, size = 40, H = 260, dur = 0.45) => {
    const d = drop(t, t0, H, dur);
    if (!d) return;
    const gy = pos[1] - size * 0.1;
    if (d.rest) return RR.drawToken(pos[0], gy, size, kind);
    const f = 1 - 0.55 * d.hk;
    RR.shadow(pos[0] + size * 0.04, gy + size * 0.36, size * 0.4 * f, size * 0.12 * f, 32 * d.a * f);
    RR.drawToken(pos[0], gy - d.h + size * (1 - d.sy) * 0.5, size, kind, { shadow: false, sx: d.sx, sy: d.sy, alpha: d.a });
  };
  const DE_T = (i) => 3.0 + i * 0.055 + RR.hrange(i + 40, 0, 0.03);
  const FR_T = (i) => 3.28 + i * 0.07;
  const ROE_T = (i) => 3.52 + i * 0.07;
  const drawTokensAnim = (t) => {
    const tk = B.SETUP.tokens;
    for (let i = 0; i < tk.de; i++) dropToken(t, DE_T(i), B.SPOTS.de[i], 'yellow');
    for (let i = 0; i < tk.fr; i++) dropToken(t, FR_T(i), B.SPOTS.fr[i], 'blue');
    for (let i = 0; i < tk.roe; i++) dropToken(t, ROE_T(i), B.SQUARES[i].pos, 'black');
  };

  // Queue: dealt left to right (slot 8 first), then the four front cards flip face up
  // (Inaction in space 1). No votes exist at setup.
  const QDEAL = (k) => 3.05 + (8 - k) * 0.075;
  const QFLY = 0.34;
  const QFLIP = (k) => 3.98 + (4 - k) * 0.08;
  const drawQueueAnim = (t) => {
    for (const c of B.SETUP.queue) {
      const t0 = QDEAL(c.k);
      if (t < t0) continue;
      const [x, y] = B.slot(c.k);
      const u = RR.seg(t, t0, t0 + QFLY);
      const e = RR.E.outCubic(u);
      const px = RR.lerp(x - 300, x, e), py = RR.lerp(-430, y, e);
      const rot = -0.55 * (1 - e);
      let flip = 0, lift = 1 - u;
      if (c.k <= 4) {
        flip = RR.seg(t, QFLIP(c.k), QFLIP(c.k) + 0.26, 'inOutSine');
        lift = Math.max(lift, 0.6 * Math.sin(Math.PI * flip));
      }
      RR.drawCard(c.id, px, py, { w: 190 * (1 + 0.08 * (1 - e)), flip, lift, rot });
    }
  };
  // Storyline: five face-down events slide up into their slots.
  const STORY_T = (i) => 3.7 + i * 0.08;
  const drawStoryAnim = (t) => {
    for (let i = 0; i < 5; i++) {
      const t0 = STORY_T(i);
      if (t < t0) continue;
      const [x, y] = B.story(i);
      const e = RR.E.outCubic(RR.seg(t, t0, t0 + 0.36));
      RR.drawCard('corprelief', RR.lerp(x + 140, x, e), RR.lerp(y + 420, y, e), { w: 300, flip: 0, back: 'back:event', lift: 1 - e, rot: 0.32 * (1 - e) });
    }
  };
  const DECK_T = 4.28, RULES_T = 4.42;
  const drawDeckAnim = (t) => {
    if (t < DECK_T) return;
    const u = RR.seg(t, DECK_T, DECK_T + 0.26), e = RR.E.outCubic(u);
    RR.drawCard('back:spread', B.DECK[0], B.DECK[1] - 60 * (1 - e), { w: 190 * (1 + 0.3 * (1 - e)), lift: 1 - u, alpha: RR.seg(t, DECK_T, DECK_T + 0.08), rot: 0.12 * (1 - e) });
  };
  const drawRulesAnim = (t) => {
    if (t < RULES_T) return;
    const u = RR.seg(t, RULES_T, RULES_T + 0.36), e = RR.E.outBackSoft(u);
    RR.drawCard('rules', B.RULES[0] + 480 * (1 - e), B.RULES[1] + 60 * (1 - e), { w: 170, lift: 1 - u, rot: 0.5 * (1 - RR.E.outCubic(u)) });
  };
  // ---- the Impact Tracker marker
  const trackPt = (v) => RR.along(B.TRACK_PATH, (RR.clamp(v, -7, 7) + 7) / 14);
  const squashAfter = (t, tl, amt, dur = 0.16) => (t >= tl && t < tl + dur ? amt * Math.pow(1 - (t - tl) / dur, 2) : 0);
  const poseOf = (v, lift, sq, st, rot = 0, a = 1) => {
    const p = trackPt(v);
    const rest = lift === 0 && sq === 0 && st === 0 && rot === 0;
    return { x: p[0], y: p[1] - 6, lift, sx: 1 + sq * 0.8 - st * 0.5, sy: 1 - sq + st, a, rot, rest };
  };
  // After the rewind: the marker steps down one space per raccoon removed (u = tb(t)).
  const stepPose = (u) => {
    let v = 0, lift = 0, st = 0, sq = squashAfter(u, RWE, 0.24, 0.16);
    for (let j = 0; j < REM.length; j++) {
      const h = REM[j] + REM_LIFT;
      if (u < h) break;
      if (u < h + STEP_D) {
        const f = (u - h) / STEP_D;
        v = -j - f; lift = Math.sin(Math.PI * f) * (20 + 3 * j); st = Math.sin(Math.PI * f) * 0.14; sq = 0;
        break;
      }
      v = -(j + 1);
      sq = j === REM.length - 1 ? squashAfter(u, h + STEP_D, 0.34, 0.22) : squashAfter(u, h + STEP_D, 0.2, 0.12);
    }
    return poseOf(v, lift, sq, st);
  };
  // Returns {x, y, lift, sx, sy, a, rest} (y = ground point like drawTracker) or null.
  const markerPose = (t) => {
    if (t < RWE) return climbPose(ta(t));
    if (t >= HOME[1]) return poseOf(0, 0, squashAfter(t, HOME[1], 0.3, 0.14), 0);
    return stepPose(tb(t));
  };
  // The climb to the skull (t = demo time ta, so the rewind plays it backwards).
  const climbPose = (t) => {
    if (t < MARKER_DROP) return null;
    let v = 0, lift = 0, sq = 0, st = 0;
    if (t < MARKER_DROP + 0.45) {
      const d = drop(t, MARKER_DROP, 240);
      const p = trackPt(0);
      return { x: p[0], y: p[1] - 6, lift: d.h, sx: d.sx, sy: d.sy, a: d.a, rest: false };
    }
    if (t < HOPS[0][0]) {
      v = 0;
      sq = 0.2 * RR.seg(t, 6.15, HOPS[0][0], 'inOutSine');   // anticipation
    } else if (t < SKULL_T) {
      v = HOPS.length;
      for (let i = 0; i < HOPS.length; i++) {
        const [h, d] = HOPS[i];
        if (t < h) { v = i; sq = i ? squashAfter(t, HOPS[i - 1][0] + HOPS[i - 1][1], 0.22) : 0; break; }
        if (t < h + d) {
          const f = (t - h) / d;
          v = i + f;
          lift = Math.sin(Math.PI * f) * (i === HOPS.length - 1 ? 90 : 24 + 7 * i);
          st = Math.sin(Math.PI * f) * 0.16;
          break;
        }
      }
    } else {
      v = 7;
      sq = squashAfter(t, SKULL_T, 0.36, 0.24);
    }
    return poseOf(v, lift, sq, st);
  };
  const drawMarkerPose = (m, ghost = 0) => {
    const size = 74;
    if (!ghost && m.rest) return RR.drawMarker(m.x, m.y, size);
    if (!ghost) {
      const f = 1 - 0.5 * RR.clamp(m.lift / 240);
      RR.shadow(m.x + size * 0.05, m.y + size * 0.45, size * 0.45 * f, size * 0.12 * f, 40 * m.a);
    }
    RR.drawSprite(RR.markerSprite(), m.x, m.y - m.lift + size * (1 - m.sy) * 0.5, { w: size, h: size, sx: m.sx, sy: m.sy, alpha: ghost || m.a, rot: m.rot || 0 });
  };

  // ---- whole board for time t (matches drawState(SETUP) exactly once everything rests)
  const drawBoard = (t, withMarker) => {
    const st = B.SETUP;
    if (t >= END) return B.drawState(st);
    if (t < ASSEMBLED) drawSections(t); else B.drawStatic();
    if (t >= SETTLED) B.drawState(st, { skip: { static: true, tracker: true }, tokenPop: removedPop(tb(t)) });
    else {
      drawStoryAnim(t); drawDeckAnim(t); drawRulesAnim(t); drawTokensAnim(t); drawQueueAnim(t);
    }
    if (t < 3.2) drawDust(t);
    if (withMarker) drawMarkerAll(t);
  };
  const rewinding = (t) => (t > FRZ && t < RWE + 0.05) || (t > HOME[0] && t < HOME[1] + 0.05);
  const drawMarkerAll = (t) => {
    const m = markerPose(t);
    if (!m) return;
    if (rewinding(t)) for (let j = 4; j >= 1; j--) { const g = markerPose(t - 0.035 * j); if (g) drawMarkerPose(g, 0.28 / j); }
    drawMarkerPose(m);
  };

  // ---- raccoons leaving the map (drawn above the spotlight dimmer), u = tb(t)
  const removedPop = (u) => {
    const pop = { de: [], fr: [] };
    REMOVED.forEach(([k, i], j) => { if (u >= REM[j]) pop[k][i] = 0; });
    return pop;
  };
  const drawRemovals = (t) => {
    const u = tb(t);
    REMOVED.forEach(([k, i], j) => {
      const t0 = REM[j], tp = t0 + REM_LIFT;
      if (u < t0 || u > tp + 0.6) return;
      const [x, y] = B.SPOTS[k][i], gy = y - 4, H = 46;
      if (u < tp) {   // hops up out of the dark map, then vanishes
        const e = RR.E.outCubic(RR.seg(u, t0, tp));
        RR.shadow(x, gy + 15, 17 * (1 - 0.4 * e), 5, 40 * (1 - e));
        RR.drawToken(x, gy - H * e, 40 * (1 + 0.3 * e), k === 'de' ? 'yellow' : 'blue', { shadow: false, sx: 1 - 0.12 * e, sy: 1 + 0.12 * e });
      }
      puff(x, gy - H, u, tp, 36);
      RR.sparkle(x, gy - H, u, tp, { n: 6, r: 62, size: 15, dur: 0.5, col: RR.C.greenLight, seed: j * 3 });
    });
  };

  // ---- spotlight: dim everything except the tracker panel
  // One full-strength layer outside a soft band, the band at half strength (fill-rate is
  // the cost here, so each screen pixel is covered at most once).
  const frameQuads = (x0, y0, x1, y1, X0, Y0, X1, Y1, col, al) => {
    RR.flat([[X0, Y0], [X1, Y0], [X1, y0], [X0, y0]], col, al);
    RR.flat([[X0, y1], [X1, y1], [X1, Y1], [X0, Y1]], col, al);
    RR.flat([[X0, y0], [x0, y0], [x0, y1], [X0, y1]], col, al);
    RR.flat([[x1, y0], [X1, y0], [X1, y1], [x1, y1]], col, al);
  };
  const dimAround = (a) => {
    if (a <= 0) return;
    const X0 = 42, X1 = 510, Y0 = 436, Y1 = 1274, E = 26, F = 8000, col = RR.C.plumDark, al = 160 * a;
    frameQuads(X0 - E, Y0 - E, X1 + E, Y1 + E, -F, -F, F, F, col, al);
    frameQuads(X0, Y0, X1, Y1, X0 - E, Y0 - E, X1 + E, Y1 + E, col, al * 0.5);
  };
  const ring = (x, y, r, w, col, alpha) => {
    if (alpha <= 0 || r <= 0) return;
    const n = 44, pts = [];
    for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI * 2; pts.push([x + Math.cos(a) * (r + w / 2), y + Math.sin(a) * (r + w / 2)]); }
    for (let i = n; i >= 0; i--) { const a = (i / n) * Math.PI * 2; pts.push([x + Math.cos(a) * Math.max(0, r - w / 2), y + Math.sin(a) * Math.max(0, r - w / 2)]); }
    RR.flat(pts, col, alpha);
  };
  const skullSpr = () => RR.sprite('s03:skull', 200, 200, () => {
    RR.inkCircle(100, 100, 70, { fill: RR.C.red, w: 1.2 });
    push(); translate(100, 100); RR.ICONS.skull(46, { col: RR.C.plumDark, bg: RR.C.red }); pop();
  }, { res: 1.5 });
  const drawTrackerFx = (tr) => {
    // skull hit: shock rings and a throbbing skull that swallows the marker (on the rewound clock)
    const t = ta(tr);
    const sk = trackPt(7);
    for (let j = 0; j < 3; j++) {
      const u = RR.seg(t, SKULL_T + j * 0.13, SKULL_T + j * 0.13 + 0.65);
      if (u > 0 && u < 1) ring(sk[0], sk[1], 72 + 190 * RR.E.outCubic(u), 14 * (1 - u) + 3, RR.C.red, 230 * (1 - u));
    }
    if (t >= SKULL_T && t < SKULL_T + 1.0) {
      const grow = RR.E.outBack(RR.seg(t, SKULL_T, SKULL_T + 0.2));
      const back = RR.seg(t, SKULL_T + 0.6, SKULL_T + 0.9, 'inOutCubic');
      const throb = 0.07 * Math.sin((t - SKULL_T) * 22) * (1 - back);
      const s = 1 + (0.45 * grow + throb) * (1 - back);
      const a = 1 - RR.seg(t, SKULL_T + 0.75, SKULL_T + 1.0);
      RR.drawSprite(skullSpr(), sk[0], sk[1], { w: 200 * s, h: 200 * s, alpha: a, rot: 0.06 * Math.sin((t - SKULL_T) * 30) * (1 - back) });
    }
    // green end: happy rings and sparkles
    const g = trackPt(-7);
    for (let j = 0; j < 2; j++) {
      const u = RR.seg(tr, GREEN_T + j * 0.15, GREEN_T + j * 0.15 + 0.7);
      if (u > 0 && u < 1) ring(g[0], g[1], 76 + 150 * RR.E.outCubic(u), 12 * (1 - u) + 3, RR.C.greenLight, 230 * (1 - u));
    }
    RR.sparkle(g[0], g[1] - 10, tr, GREEN_T, { n: 12, r: 170, size: 26, dur: 1.0 });
    RR.sparkle(g[0], g[1] - 10, tr, GREEN_T + 0.12, { n: 8, r: 120, size: 20, dur: 0.9, col: RR.C.greenLight, seed: 5 });
  };

  // ---- rewind: tape lines, a plum wash and a blinking rewind symbol (as in s11)
  const drawRewindFx = (t, t0, t1, k) => {
    const rw = RR.env(t, t0, t1 + 0.08, 0.04, 0.12) * k;
    if (rw <= 0) return;
    RR.fadeScreen(0.14 * rw, RR.C.plumDark);
    for (let i = 0; i < 16; i++) {
      const sp = RR.hrange(i + 3, 1400, 3200);
      const y = ((RR.hr(i + 5) * 1180 + t * sp) % 1180) - 50;
      const h = RR.hrange(i + 9, 4, 30);
      RR.flat([[0, y], [1920, y + RR.hrange(i, -6, 6)], [1920, y + h], [0, y + h]], i % 3 ? '#ffffff' : RR.C.plumMid, RR.hrange(i + 2, 50, 130) * rw);
    }
    if (t > t0 + 0.04 && t < t1 && Math.floor((t - t0) * 6) % 2 === 0) {
      for (const dx of [0, 64]) {
        RR.flat([[210 + dx, 70], [210 + dx, 170], [140 + dx, 120]].map(([x, y]) => [x + 5, y + 6]), RR.C.ink, 90 * k);
        RR.flat([[210 + dx, 70], [210 + dx, 170], [140 + dx, 120]], RR.C.white, 235 * k);
      }
    }
  };

  // ---- the Raccoon cheers the climb and sulks at the green
  const RAC = [735, 1100], RS = 1.05;
  const PILE = [[640, 1132, 'black'], [830, 1126, 'yellow'], [594, 1068, 'blue'], [884, 1064, 'black'], [700, 1178, 'yellow'], [794, 1182, 'blue'], [952, 1132, 'black']];
  // one token per space climbed; the rewind sends them back up where they came from
  const drawPile = (t, behind) => {
    const tp = ta(t);
    PILE.forEach(([x, y, kind], i) => {
      if ((y < RAC[1]) !== behind) return;
      dropToken(tp, HOPS[i][0] - 0.12, [x, y], kind, 56, 130, 0.36);
    });
  };
  const drawRaccoonBeat = (tr, cam, m) => {
    // before the rewind ends the Raccoon runs on the rewound clock (its cackle plays backwards)
    const t = tr < RWE ? ta(tr) : tr;
    if (t < 5.72 || tr > STORM[1]) return;
    let x = RAC[0], y = RAC[1], face = -1;
    const P = RR.raccoonIdle(t, { mouth: 'smile', brow: 'neutral', tail: t * 2.6 });
    const lookAt = (px, py) => {
      const hx = x - 4 * RS, hy = y - 132 * RS;
      const dx = px - hx, dy = py - hy, L = Math.hypot(dx, dy) || 1;
      P.look = [(dx / L) * face, dy / L];
    };
    if (m) lookAt(m.x, m.y - m.lift);   // follow the marker with the eyes
    if (tr >= RWE) {                      // after the rewind: its raccoons leave the map
      const jNow = REM.reduce((n, r) => (tr >= r ? n + 1 : n), 0) - 1;
      if (tr < REM[0]) {                  // "wait, what?"
        const u = RR.seg(tr, RWE, RWE + 0.14, 'outBack');
        Object.assign(P, { mouth: 'flat', eyes: 'wide', brow: 'up', headTilt: -0.14 * u, armF: 0.55, armB: 0.4, ear: 1, squash: squashAfter(tr, RWE, 0.14, 0.18) });
      } else if (tr < GREEN_T) {          // flinches at every raccoon that vanishes
        const [k, i] = REMOVED[jNow], s = B.SPOTS[k][i];
        lookAt(s[0], s[1] - 50);
        const u = RR.seg(tr, REM[0], REM[0] + 0.14, 'outBack');
        Object.assign(P, { mouth: 'o', eyes: 'wide', brow: 'worried', armF: RR.lerp(0.55, 1.9, u), armB: RR.lerp(0.4, 1.7, u), lean: -0.06, ear: -1, tailUp: 0.2, headTilt: 0.05 * Math.sin(tr * 13) });
        for (const r of REM) P.squash += squashAfter(tr, r + REM_LIFT, 0.13, 0.12);
      } else if (tr < STORM[0] - 0.07) {  // the marker is in the green: sulks
        const u = RR.seg(tr, GREEN_T, GREEN_T + 0.2, 'outCubic');
        Object.assign(P, { mouth: 'frown', brow: 'worried', armF: RR.lerp(1.9, 0.12, u), armB: RR.lerp(1.7, 0.05, u), squash: 0.1 * u, headTilt: 0.16 * u, ear: -1, tailUp: 0 });
        if (tr > GREEN_T + 0.3) P.look = [0.4, 0.7];
      } else {                            // storms off to the right
        face = 1;
        const u = RR.seg(tr, STORM[0], STORM[1], 'inQuad');
        x += 2300 * u;
        if (tr < STORM[0]) Object.assign(P, { squash: 0.18, mouth: 'frown', brow: 'angry', look: [1, 0], ear: -1 });
        else Object.assign(P, { run: tr * 19, stride: 1, lean: 0.32, mouth: 'frown', brow: 'angry', tailUp: 1, tail: tr * 12, look: [1, 0], armF: 1.1, armB: 1.3 });
      }
    } else if (t < 6.02) {                // drops in from above
      const u = RR.seg(t, 5.72, 6.02);
      y -= 760 * (1 - u * u);
      Object.assign(P, { armF: 2.6, armB: 2.3, mouth: 'o', eyes: 'wide', brow: 'up', squash: -0.18, tailUp: 1, look: [0, 0.8] });
    } else if (t < 6.45) {                // lands, grins at us
      Object.assign(P, { squash: squashAfter(t, 6.02, 0.32, 0.22), mouth: 'grin', brow: 'sly', look: [-0.25, 0.25], armF: 0.6, armB: 0.35 });
    } else if (t < SKULL_T) {             // watches the marker climb, rubbing its paws
      const ex = RR.seg(t, 6.6, SKULL_T);
      const rub = t > 6.95 ? Math.sin(t * 24) * 0.2 : 0;
      Object.assign(P, { mouth: ex > 0.35 ? 'grin' : 'smile', brow: 'sly', armF: 1.25 + rub + ex * 0.25, armB: 1.05 - rub + ex * 0.25, lean: 0.06 + 0.1 * ex, tailUp: 0.5 + 0.4 * ex, tail: t * (3 + 5 * ex) });
      for (const [h, d] of HOPS) P.squash += squashAfter(t, h + d, 0.1, 0.14);
    } else {                              // skull: leaps and cackles (freezes on the record scratch)
      const u = RR.seg(t, SKULL_T + 0.02, SKULL_T + 0.42);
      y -= Math.sin(Math.PI * u) * 80;
      Object.assign(P, {
        armF: 2.75 + 0.25 * Math.sin(t * 17), armB: 2.55 + 0.25 * Math.sin(t * 17 + 1.2), mouth: 'cackle', eyes: 'happy', brow: 'up',
        tailUp: 1, tail: t * 9, lean: -0.1, headTilt: 0.12 * Math.sin(t * 15),
        squash: u > 0 && u < 1 ? -0.16 : squashAfter(t, SKULL_T + 0.42, 0.24, 0.18) + 0.06 * Math.sin(t * 30),
      });
    }
    P.face = face;
    const sx = RR.toScreen(cam, [x, y]);
    if (sx[0] > RR.W + 320) return;
    const air = RR.clamp((RAC[1] - y) / 400);
    RR.shadow(x + 6, RAC[1] + 4, 70 * (1 - air * 0.6), 16 * (1 - air * 0.6), 45 * (1 - air * 0.5));
    RR.drawRaccoon(x, y, RS, P);
    if (tr < SCR) {
      puff(RAC[0] - 60, RAC[1] - 6, t, 6.02, 40);
      puff(RAC[0] + 60, RAC[1] - 6, t, 6.04, 40);
    }
    puff(RAC[0] - 30, RAC[1] - 6, tr, STORM[0] + 0.02, 46);
  };

  // ---- scores race (screen space)
  const SB = { x: 1440, y: 420, gap: 92 };
  const RACE = { de: [9, 11.42, 12.05, 'outCubic'], fr: [11, 11.36, 11.78, 'outQuad'], ar: [13, 11.46, 12.2, 'inCubic'], hu: [7, 11.39, 11.82, 'outCubic'] };
  const WIN_ROW = 2;   // Animal Rights ('ar') overtakes late and takes the crown
  // Score rows in the style of RR.scoreBoard, with the static parts (panel and role badge)
  // cached as sprites: painting them live cost more than a whole raccoon.
  const ROLES4 = ['de', 'fr', 'ar', 'hu'];
  const rowSpr = (r) => RR.sprite('s03:row:' + r, 440, 88, () => {
    RR.ink(RR.rrectPts(10, 10, 420, 68, 18), { fill: RR.C.white, alpha: 230, w: 0.9 });
    push(); translate(50, 44); RR.ICONS.role(22, { role: r }); pop();
  }, { res: 1.5 });
  const scoreRows = (scores, x, y, gap, max) => {
    ROLES4.forEach((r, i) => {
      const yy = y + i * gap, v = scores[r] ?? 0;
      RR.drawSprite(rowSpr(r), x + 150, yy, { w: 440, h: 88 });
      const bw = 300 * RR.clamp(v / max);
      if (bw > 4) RR.ink(RR.rrectPts(x + 20, yy - 14, bw, 28, 10), { fill: RR.C[r], stroke: RR.C[r + 'Dark'] || RR.C.ink, w: 0.8 });
      RR.text(String(Math.round(v)), x + 30 + bw + 26, yy + 13, { font: 'title', size: 40, col: RR.C.ink });
    });
  };
  const drawScores = (t) => {
    const inU = RR.seg(t, 11.22, 11.64), outU = RR.seg(t, 13.2, 13.62);
    if (inU <= 0 || outU >= 1) return;
    const dx = 640 * (1 - RR.E.outBack(inU)) + 760 * RR.E.inBack(outU);
    const scores = {};
    for (const r in RACE) { const [v, a, b, e] = RACE[r]; scores[r] = v * RR.seg(t, a, b, e); }
    const yy = SB.y + WIN_ROW * SB.gap;
    push();
    translate(dx, 0);
    const cu = RR.seg(t, CROWN_T, CROWN_T + 0.3);
    if (cu > 0) RR.flat(RR.rrectPts(SB.x - 74, yy - 48, 448, 96, 26), RR.C.gold, 170 * cu * (0.75 + 0.25 * Math.sin(t * 9)));
    scoreRows(scores, SB.x, SB.y, SB.gap, 14);
    if (t >= CROWN_T) {
      const k = RR.pop(t, CROWN_T, 0.3);
      const bob = Math.sin((t - CROWN_T) * 7) * 3;
      RR.icon('crown', SB.x - 118, yy - 4 + bob - 80 * (1 - RR.E.outCubic(RR.seg(t, CROWN_T, CROWN_T + 0.25))), 124 * k, {}, { rot: -0.18 + 0.05 * Math.sin((t - CROWN_T) * 5) });
    }
    pop();
    RR.sparkle(SB.x - 118 + dx, yy - 10, t, CROWN_T + 0.1, { n: 10, r: 110, size: 22, dur: 0.8 });
  };

  const CAP = { x: 1400, y: 232, size: 66 };

  RR.scene({
    id: 's03_board', order: 3, dur: 14, music: 'board',
    cues: [
      [0.2, 'whoosh', 0.35], [0.45, 'paper', 0.7],
      [1.24, 'thud', 0.8], [1.54, 'thud', 0.8], [1.84, 'thud', 0.8], [2.14, 'thud', 0.9],
      [3.05, 'deal', 0.7], [3.17, 'pop', 0.7], [3.27, 'deal', 0.6], [3.42, 'pop', 0.6], [3.5, 'deal', 0.6], [3.66, 'pop', 0.6],
      [3.74, 'deal', 0.6], [3.9, 'pop', 0.5], [3.98, 'flip', 0.7], [4.14, 'flip', 0.6], [4.28, 'paper', 0.6], [4.42, 'slide', 0.6],
      [MARKER_DROP + FIRST_CONTACT, 'tock', 0.8],
      [5.3, 'whoosh', 0.5], [5.8, 'whoosh', 0.4], [6.02, 'boing', 0.8], [6.25, 'chitter', 0.5],
      ...HOPS.slice(0, -1).map(([h, d], i) => [h + d, 'tick', 0.5 + i * 0.07]),
      ...HOPS.map(([h], i) => [h + 0.01, 'pop', 0.3 + i * 0.03]),
      [SKULL_T, 'thud', 1], [SKULL_T + 0.02, 'buzz', 0.8], [SKULL_T + 0.15, 'chitter', 0.9],
      [SCR, 'scratch', 0.9], [FRZ + 0.02, 'whoosh', 0.55], [RWE, 'tock', 0.6],
      ...REM.map((r, j) => [r + REM_LIFT, 'poof', 0.32 + j * 0.03]),
      ...REM.map((r, j) => [r + REM_LIFT + STEP_D, 'tick', 0.5 + j * 0.05]),
      [GREEN_T, 'sparkle', 0.9], [GREEN_T + 0.03, 'ding', 0.8], [GREEN_T + 0.15, 'sad', 0.6],
      [STORM[0], 'whoosh', 0.5], [11.22, 'slide', 0.6], [11.36, 'drumroll', 0.7], [CROWN_T, 'ding', 0.9], [CROWN_T + 0.05, 'cheer', 0.6],
      [12.35, 'brush', 0.7], [HOME[0] - 0.03, 'whoosh', 0.45], [13.2, 'slide', 0.4], [HOME[1], 'tock', 0.7],
    ],
    draw(t) {
      let cam = camAt(t);
      const amt = RR.env(t, 2.9, 12.2, 0.8, 0.8);
      if (amt > 0) cam = RR.drift(cam, t, amt);
      const sh = RR.shake(t, SKULL_T, 0.55, 16);
      if (sh[0] || sh[1]) cam = { ...cam, x: cam.x + sh[0] / cam.z, y: cam.y + sh[1] / cam.z };
      const m = markerPose(t);
      // rewinds: a jolt on the record scratch, then the picture wobbles like a rewinding tape
      const rw = Math.max(RR.env(t, SCR, RWE + 0.05, 0.03, 0.1), 0.5 * RR.env(t, HOME[0], HOME[1] + 0.05, 0.05, 0.1));
      const jolt = RR.shake(t, SCR, 0.25, 22);
      push();
      if (rw > 0 || jolt[0] || jolt[1]) {
        translate(RR.W / 2 + jolt[0] + Math.sin(t * 57) * 12 * rw, RR.H / 2 + jolt[1]);
        rotate(Math.sin(t * 23) * 0.012 * rw);
        scale(1 + 0.02 * rw);
        translate(-RR.W / 2, -RR.H / 2);
      }
      RR.withCam(cam, () => {
        const dim = RR.env(t, 5.3, 11.55, 0.7, 0.6);
        drawBoard(t, dim <= 0);
        if (dim > 0) {
          dimAround(dim);
          drawMarkerAll(t);   // above the dimmer, so the marker stays bright when it leaps high
          drawTrackerFx(t);
          drawRemovals(t);
          drawPile(t, true);
          drawRaccoonBeat(t, cam, m);
          drawPile(t, false);
        } else if (t > HOME[0] - 0.1) drawRemovals(t);   // the reset rewind puts them back
      });
      pop();

      // screen space
      if (t >= SKULL_T && t < SKULL_T + 0.5) RR.fadeScreen(0.26 * (1 - RR.seg(t, SKULL_T, SKULL_T + 0.5)), RR.C.red);
      RR.caption('Raccoon impact', t, 5.95, 7.55, CAP);
      // two short strips (setup, punchline): cheaper than one very wide strip, and a better beat
      RR.caption('Hit the skull?', t, SKULL_T + 0.02, 9.6, { x: 1250, y: 205, size: 66, rot: -0.025 });
      RR.caption('Everyone loses', t, SKULL_T + 0.2, 9.6, { x: 1500, y: 318, size: 66, rot: 0.02 });
      drawRewindFx(t, SCR, RWE, 1);
      RR.caption('Keep it green...', t, 9.85, 11.5, CAP);
      drawRewindFx(t, HOME[0], HOME[1], 0.55);
      drawScores(t);
      RR.caption('...then the top score wins', t, 11.5, 13.0, { x: 1500, y: 800, size: 60 });
      RR.banner('WORK TOGETHER. WIN ALONE.', t, 12.35, 13.88, { y: 150, size: 88 });
    },
  });
})();
