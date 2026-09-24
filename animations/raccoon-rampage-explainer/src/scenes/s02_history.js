// Scene 2 (10-22 s): how it started. The whip-pan from the title settles on a painted
// map of Europe. 1934: a crate opens at Lake Edersee and two raccoons hop out.
// 1945: raccoons slip through a broken fur-farm fence east of Berlin. The camera pulls
// back while the population spreads across Germany and into France, then everything
// shrinks away and the camera eases to MAPCAM with only the board's map section.

(() => {
  const B = RR.board;
  const C = RR.C;
  const ED = B.lonlat(9.05, 51.18);   // Lake Edersee, Hesse
  const WH = B.lonlat(13.9, 52.55);   // Wolfshagen, near Strausberg (fur farm)

  // ------------------------------------------------------------------ layout (world units)
  const LAKE_C = [ED[0] + 6, ED[1] - 8];
  const CRATE = [ED[0] - 4, ED[1] + 34];   // bottom centre of the crate's front face
  const FENCE = [WH[0] - 18, WH[1] + 10];   // base centre of the fur-farm fence
  const HOLE = { x0: -22, x1: -6, top: -17 }; // hole in the fence's left panel (relative to FENCE)
  const HOLE_X = FENCE[0] + (HOLE.x0 + HOLE.x1) / 2;
  const LAST = B.lonlat(2.4, 48.3);         // a straggler far into France
  const RS = 0.18;                          // small raccoon scale (world)

  // ------------------------------------------------------------------ camera
  const camFor = (p, sx, sy, z) => RR.cam(p[0] + (960 - sx) / z, p[1] + (540 - sy) / z, z);
  const Z1 = 3.6, Z2 = 4.4;
  const CAM_A0 = camFor(ED, 790, 540, Z1 * 0.97);
  const CAM_A1 = camFor(ED, 790, 540, Z1);
  const CAM_B0 = camFor(FENCE, 860, 660, Z2);
  const CAM_B1 = camFor(FENCE, 860, 660, Z2 * 1.03);
  const CAM_C0 = RR.cam(1236, 822, 2.1);
  const CAM_C1 = RR.cam(1232, 826, 2.03);
  const MAPCAM = RR.cam(1150, 860, 1.2);
  const WHIP_T = 0.7, WHIP_PX = 1250;   // settle time, and screen distance still to travel at t = 0

  const camAt = (t) => {
    if (t < WHIP_T) {
      const k = RR.E.outCubic(t / WHIP_T);
      return RR.drift({ ...CAM_A0, x: CAM_A0.x - (WHIP_PX / CAM_A0.z) * (1 - k) }, t, 0.8);
    }
    const cam = RR.camKf(t, [
      [WHIP_T, CAM_A0], [3.2, CAM_A1, 'inOutSine'], [4.1, CAM_B0, 'inOutCubic'], [5.6, CAM_B1, 'inOutSine'],
      [6.7, CAM_C0, 'inOutCubic'], [9.2, CAM_C1, 'inOutSine'], [11.6, MAPCAM, 'inOutCubic'],
    ]);
    const amt = 1 - RR.seg(t, 9.2, 11.6);
    return amt > 0 ? RR.drift(cam, t, amt * 0.8) : cam;
  };
  const onScreen = (cam, p, m = 160) => {
    const s = RR.toScreen(cam, p);
    return s[0] > -m && s[0] < RR.W + m && s[1] > -m && s[1] < RR.H + m * 1.5;
  };

  // ------------------------------------------------------------------ map
  // The board's map section repainted at a higher resolution and without the spread
  // squares (those fade in as the map settles into the game board). Same painter and
  // random seed as board.js, so the watercolour matches the board's own map sprite.
  const MAP_S = B.SECTIONS.map;
  const mapDetail = () => RR.sprite('s02:map', MAP_S.w, MAP_S.h, () => {
    const seed = RR.strHash('board:map:hi');
    randomSeed(seed); noiseSeed(seed);
    push(); translate(-MAP_S.x, -MAP_S.y);
    const M = B.MAP;
    RR.water(RR.rrectPts(M.x, M.y, M.w, M.h, 20), C.sea, { layers: 10, alpha: 60, spread: 0.006, edge: 0.5 });
    for (const c of EUROPE.countries) {
      const tint = c.name === 'France' ? C.franceTint : c.name === 'Germany' ? C.germanyTint : C.land;
      for (const poly of c.polys) RR.water(poly.map(B.mapPt), tint, { layers: 5, alpha: 70, spread: 0.01, edge: 0.3, baseDepth: 0 });
    }
    for (const c of EUROPE.countries) for (const poly of c.polys) {
      const special = c.name === 'France' || c.name === 'Germany';
      RR.ink(poly.map(B.mapPt), { stroke: special ? C.ink : C.landEdge, w: special ? 0.8 : 0.45, curve: 0.1 });
    }
    pop();
  }, { res: 2.4 });
  const drawMapDetail = (dx = 0, alpha = 1) =>
    RR.drawSprite(mapDetail(), MAP_S.x + MAP_S.w / 2 + dx, MAP_S.y + MAP_S.h / 2, { w: MAP_S.w, h: MAP_S.h, alpha });

  // ------------------------------------------------------------------ props (sprites in world units)
  const K = 6; // sprite pixels per world unit
  // Lake Edersee: a long, winding reservoir
  const LAKE = { w: 46, h: 15 };
  const lake = () => RR.sprite('s02:lake', LAKE.w * K, LAKE.h * K, (w, h) => {
    const N = 16, top = [], bot = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N, x = 12 + u * (w - 24);
      const y = h / 2 + Math.sin(u * 7.5) * h * 0.13 - (u - 0.5) * h * 0.1;
      const r = h * (0.08 + 0.26 * Math.sin(u * Math.PI) ** 0.6 + 0.05 * Math.sin(u * 17));
      top.push([x, y - r]); bot.push([x, y + r * 0.9]);
    }
    const pts = top.concat(bot.reverse());
    RR.water(pts, '#7fb0c9', { layers: 12, alpha: 60, spread: 0.02, edge: 0.7 });
    RR.ink(pts, { stroke: '#355f78', w: 0.9, curve: 0.5 });
    RR.inkLine([[w * 0.28, h * 0.44], [w * 0.4, h * 0.41]], { col: '#eef5f6', w: 0.9, brush: 'pencil' });
    RR.inkLine([[w * 0.56, h * 0.53], [w * 0.66, h * 0.5]], { col: '#eef5f6', w: 0.9, brush: 'pencil' });
  }, { res: 1 });

  // Map pin (tip at the bottom centre)
  const PIN = { w: 16, h: 23 };
  const pin = () => RR.sprite('s02:pin', PIN.w * K, PIN.h * K, (w, h) => {
    const cx = w / 2, cy = w * 0.47, r = w * 0.41, pts = [];
    for (let i = 0; i <= 20; i++) {
      const a = Math.PI * 0.72 + (i / 20) * Math.PI * 1.56;
      pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
    pts.push([cx, h - 3]);
    RR.ink(pts, { fill: C.red, w: 1.2, curve: 0.35 });
    RR.inkCircle(cx, cy, r * 0.38, { fill: C.white, w: 0.8 });
    RR.inkLine([[cx - r * 0.62, cy - r * 0.2], [cx - r * 0.35, cy - r * 0.62]], { col: '#f6c9bf', w: 1.3 });
  }, { res: 1 });

  // Wooden crate with an open top (oblique view). Anchor = bottom centre of the front face.
  const CR = { x0: -25, y0: -37, w: 58, h: 40 };
  const cw = (p) => [(p[0] - CR.x0) * K, (p[1] - CR.y0) * K];
  const OPEN = [[-22, -24], [22, -24], [30, -34], [-14, -34]];
  const WOOD = '#c99a5f', WOOD_D = '#9b6e3e', WOOD_L = '#e0b87f';
  const crateBack = () => RR.sprite('s02:crateBack', CR.w * K, CR.h * K, () => {
    RR.ink(OPEN.map(cw), { fill: '#4a3527', w: 1, curve: 0.05 });
    RR.ink([[-22, -24], [-14, -34], [-14, -28], [-20, -20]].map(cw), { fill: '#6b4b33', stroke: false, curve: 0.05 });
    for (const x of [-3, 9, 20]) RR.inkLine([[x, -34], [x, -29]].map(cw), { col: '#2e2019', w: 0.6 });
  }, { res: 1 });
  const crateFront = () => RR.sprite('s02:crateFront', CR.w * K, CR.h * K, () => {
    const front = [[-22, -24], [22, -24], [22, 0], [-22, 0]];
    const side = [[22, -24], [30, -34], [30, -10], [22, 0]];
    RR.water(front.map(cw), WOOD, { layers: 8, alpha: 70, spread: 0.01, edge: 0.4 });
    RR.water(side.map(cw), WOOD_D, { layers: 8, alpha: 70, spread: 0.01, edge: 0.4 });
    for (const y of [-16, -8]) RR.inkLine([[-21, y], [21, y]].map(cw), { col: '#7a5230', w: 0.7 });
    for (const y of [-20, -12, -4]) RR.inkLine([[-18, y], [-5, y + 0.4]].map(cw), { col: '#a57a4a', w: 0.5, brush: 'pencil' });
    for (const x of [-22, 18.5]) RR.ink([[x, -24], [x + 3.5, -24], [x + 3.5, 0], [x, 0]].map(cw), { fill: WOOD_L, w: 0.8, curve: 0.05 });
    RR.ink([[-18.5, -3], [-15.5, 0], [18.5, -21], [15.5, -24]].map(cw), { fill: WOOD_L, w: 0.7, curve: 0.05 });
    RR.ink(front.map(cw), { stroke: C.ink, w: 1.1, curve: 0.05 });
    RR.ink(side.map(cw), { stroke: C.ink, w: 1.0, curve: 0.05 });
    for (const y of [-20, -11]) RR.inkLine([[23, y], [29, y - 7.5]].map(cw), { col: '#6b4b2c', w: 0.6 });
  }, { res: 1 });
  // lid: the same parallelogram as the opening, centred on its own origin
  const LID = { w: 58, h: 16 };
  const LID_PTS = OPEN.map(([x, y]) => [x - 4, y + 29]); // centred near (0, 0)
  const lid = () => RR.sprite('s02:lid', LID.w * K, LID.h * K, () => {
    const lw = (p) => [(p[0] + 29) * K, (p[1] + 8) * K];
    RR.ink([[-26, 5], [18, 5], [18, 8], [-26, 8]].map(lw), { fill: WOOD_D, w: 0.9, curve: 0.05 });
    RR.ink(LID_PTS.map(lw), { fill: WOOD_L, w: 1.1, curve: 0.05 });
    for (const f of [0.33, 0.66]) RR.inkLine([lw([-26 + 44 * f, 5]), lw([-18 + 44 * f, -5])], { col: '#8d6437', w: 0.6 });
  }, { res: 1 });

  // Fur farm: a cage shed behind a wire fence whose left panel has a torn hole.
  const FEN = { x0: -32, y0: -38, w: 64, h: 41 };
  const fw = (p) => [(p[0] - FEN.x0) * K, (p[1] - FEN.y0) * K];
  const MESH = '#5f636b', GLAZE = '#eef1f2';
  const PANEL_TOP = -30;
  // parallel 45-degree wires clipped to a box (dir 1 = '/', -1 = '\')
  const diag = (x0, x1, y0, y1, step, dir) => {
    const out = [], H = y1 - y0;
    for (let c = x0 - H; c < x1 + H; c += step) {
      let a = [dir > 0 ? c + H : c, y0], b = [dir > 0 ? c : c + H, y1];
      if (a[0] > b[0]) [a, b] = [b, a];
      if (b[0] < x0 || a[0] > x1) continue;
      const at = (xv) => [xv, a[1] + ((b[1] - a[1]) * (xv - a[0])) / (b[0] - a[0])];
      const p = a[0] < x0 ? at(x0) : a, q = b[0] > x1 ? at(x1) : b;
      out.push([p, q]);
    }
    return out;
  };
  const holeTop = (x) => HOLE.top - Math.sin(RR.clamp((x - HOLE.x0) / (HOLE.x1 - HOLE.x0)) * Math.PI) * 2;
  const inHole = (p) => p[0] > HOLE.x0 && p[0] < HOLE.x1 && p[1] > holeTop(p[0]);
  const wires = (x0, x1, y0, y1, skipHole, map) => {
    for (const [a, b] of diag(x0, x1, y0, y1, 3.6, 1).concat(diag(x0, x1, y0, y1, 3.6, -1))) {
      if (!skipHole) { RR.inkLine([map(a), map(b)], { col: MESH, w: 0.5, brush: 'pencil' }); continue; }
      const N = 14;
      let run = [];
      const flushRun = () => { if (run.length > 1) RR.inkLine([map(run[0]), map(run[run.length - 1])], { col: MESH, w: 0.5, brush: 'pencil' }); run = []; };
      for (let i = 0; i <= N; i++) { const pt = RR.lerp2(a, b, i / N); if (inHole(pt)) flushRun(); else run.push(pt); }
      flushRun();
    }
  };
  const shed = () => RR.sprite('s02:shed', 62 * K, 34 * K, () => {
    const s = (p) => [(p[0] + 31) * K, (p[1] + 32) * K];
    RR.ink([[-24, -13], [16, -13], [16, 0], [-24, 0]].map(s), { fill: '#bd8f7c', w: 1, curve: 0.05 });
    RR.ink([[16, -13], [26, -17], [26, -4], [16, 0]].map(s), { fill: '#9c6f60', w: 0.9, curve: 0.05 });
    RR.ink([[-28, -12], [-19, -28], [21, -28], [30, -16], [18, -12]].map(s), { fill: C.plumMid, w: 1, curve: 0.05 });
    for (const x of [-19, -7.5, 4]) {
      RR.ink([[x, -10.5], [x + 8.5, -10.5], [x + 8.5, -3], [x, -3]].map(s), { fill: '#3f3238', w: 0.7, curve: 0.05 });
      for (const k of [2.1, 4.2, 6.4]) RR.inkLine([[x + k, -10.5], [x + k, -3]].map(s), { col: '#aeb2b7', w: 0.4, brush: 'pencil' });
    }
    for (const x of [-16, -4, 8]) RR.inkLine([[x, -26], [x - 5, -14]].map(s), { col: '#5a4757', w: 0.5, brush: 'pencil' });
  }, { res: 1 });
  const fence = () => RR.sprite('s02:fence', FEN.w * K, FEN.h * K, () => {
    // pale glaze so the mesh reads as a panel (left panel has the hole cut out)
    const hp = [];
    for (let i = 0; i <= 8; i++) { const x = RR.lerp(HOLE.x1, HOLE.x0, i / 8); hp.push([x, holeTop(x)]); }
    const left = [[-28, PANEL_TOP], [0, PANEL_TOP], [0, 0], [HOLE.x1, 0], ...hp, [HOLE.x0, 0], [-28, 0]];
    RR.flat(left.map(fw), GLAZE, 110);
    RR.flat([[0, PANEL_TOP], [28, PANEL_TOP], [28, 0], [0, 0]].map(fw), GLAZE, 110);
    wires(-28, 0, PANEL_TOP, 0, true, fw);
    wires(0, 28, PANEL_TOP, 0, false, fw);
    // bent wire ends around the hole
    for (let i = 0; i <= 7; i++) {
      const x = RR.lerp(HOLE.x0 + 0.5, HOLE.x1 - 0.5, i / 7), y = holeTop(x);
      RR.inkLine([fw([x, y]), fw([x + (i % 2 ? 1.2 : -1), y + 1.8])], { col: '#3d4046', w: 0.6 });
    }
    RR.inkLine([[HOLE.x0, 0], [HOLE.x0 - 0.4, holeTop(HOLE.x0)], [HOLE.x0 + 3, holeTop(HOLE.x0 + 3)]].map(fw), { col: '#3d4046', w: 0.7, curve: 0.4 });
    RR.inkLine([[HOLE.x1, 0], [HOLE.x1 + 0.3, holeTop(HOLE.x1)]].map(fw), { col: '#3d4046', w: 0.7 });
    // top wire and posts
    RR.inkLine([[-29, PANEL_TOP], [29, PANEL_TOP]].map(fw), { col: '#7b7f86', w: 1.2 });
    for (const x of [-28, 0, 28]) {
      RR.ink([[x - 2, PANEL_TOP - 4], [x + 2, PANEL_TOP - 4.5], [x + 2.3, 1], [x - 2.3, 1]].map(fw), { fill: WOOD_D, w: 0.9, curve: 0.05 });
      RR.inkLine([[x - 0.8, PANEL_TOP - 2], [x - 0.5, -2]].map(fw), { col: '#c89c68', w: 0.5, brush: 'pencil' });
    }
  }, { res: 1 });
  // the torn flap of mesh that covers the hole, hinged along its top edge
  const FLAP = { w: 18, h: 19 };
  const flap = () => RR.sprite('s02:flap', FLAP.w * K, FLAP.h * K, () => {
    const f = (p) => [(p[0] - HOLE.x0 + 1) * K, (p[1] - HOLE.top + 2) * K];
    const shape = [];
    for (let i = 0; i <= 8; i++) { const x = RR.lerp(HOLE.x0, HOLE.x1, i / 8); shape.push([x, holeTop(x)]); }
    const rag = [];
    for (let i = 8; i >= 0; i--) rag.push([RR.lerp(HOLE.x0, HOLE.x1, i / 8), -0.6 + (i % 2 ? 0.9 : -0.5)]);
    RR.flat(shape.concat(rag).map(f), GLAZE, 120);
    for (const [a, b] of diag(HOLE.x0, HOLE.x1, HOLE.top - 2, 0, 3.6, 1).concat(diag(HOLE.x0, HOLE.x1, HOLE.top - 2, 0, 3.6, -1))) {
      if (a[1] < holeTop(a[0]) && b[1] < holeTop(b[0])) continue;
      const clip = (p) => [p[0], Math.max(p[1], holeTop(p[0]))];
      RR.inkLine([f(clip(a)), f(clip(b))], { col: MESH, w: 0.5, brush: 'pencil' });
    }
    RR.inkLine(rag.map(f), { col: '#3d4046', w: 0.9, curve: 0.2 }); // torn bottom edge
  }, { res: 1 });

  // ------------------------------------------------------------------ population dots
  const inPoly = (pt, poly) => {
    let c = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
  };
  const grid = (poly, step, seed, keep, filter) => {
    const xs = poly.map((p) => p[0]), ys = poly.map((p) => p[1]);
    const out = [];
    let n = 0;
    for (let y = Math.min(...ys); y < Math.max(...ys); y += step * 0.87) {
      for (let x = Math.min(...xs) + ((Math.round(y / step) % 2) * step) / 2; x < Math.max(...xs); x += step) {
        n++;
        const p = [x + RR.hrange(seed + n, -step * 0.3, step * 0.3), y + RR.hrange(seed + n * 3, -step * 0.3, step * 0.3)];
        const m = 6;
        if (!inPoly(p, poly) || ![0, 1, 2, 3].every((k) => inPoly([p[0] + Math.cos(k * 1.57) * m, p[1] + Math.sin(k * 1.57) * m], poly))) continue;
        if (RR.hr(seed + n * 7) > keep || (filter && !filter(p))) continue;
        out.push(p);
      }
    }
    return out;
  };
  const DE_DOTS = (() => {
    const pts = grid(B.country('Germany'), 18, 100, 0.8, (p) => RR.dist(p, CRATE) > 20 && RR.dist(p, [FENCE[0], FENCE[1] - 12]) > 24);
    const withD = pts.map((p) => {
      const de = RR.dist(p, ED), dw = RR.dist(p, FENCE) + 18; // the Edersee group had a head start
      return { p, d: Math.min(de, dw) + RR.hrange(p[0] * 3.1 + p[1], 0, 26) };
    }).sort((a, b) => a.d - b.d);
    return withD.map((o, k) => ({ p: o.p, t: 5.95 + 1.9 * Math.sqrt(k / withD.length), s: RR.hrange(k + 40, 0.85, 1.1) }));
  })();
  const FR_DOTS = (() => {
    const pts = grid(B.country('France'), 20, 300, 0.8, (p) => p[0] > 1034 && p[1] < 925);
    const edge = B.lonlat(7.6, 49.0);
    const withD = pts.map((p) => ({ p, d: RR.dist(p, edge) + RR.hrange(p[0] + p[1] * 2.3, 0, 20) })).sort((a, b) => a.d - b.d);
    const out = withD.map((o, k) => ({ p: o.p, t: 7.05 + 1.1 * Math.sqrt(k / withD.length), s: RR.hrange(k + 90, 0.8, 1.0) }));
    out.push({ p: LAST, t: 8.35, s: 0.95, last: true }); // the straggler, far ahead of the rest
    return out;
  })();
  const DOTS = DE_DOTS.concat(FR_DOTS).map((d, i) => ({ ...d, out: d.last ? 9.2 : 8.98 + RR.hr(i * 5.3 + 2) * 0.5 }));
  const DOTS_Y = DOTS.slice().sort((a, b) => a.p[1] - b.p[1]);
  const DOT = 19; // world size of a raccoon-face dot
  const dotSprite = () => RR.sprite('s02:dot', 100, 100, () => {
    push(); translate(50, 56); RR.ICONS.raccoonFace(40, { w: 1.1 }); pop();
  }, { res: 1.6 });

  // ------------------------------------------------------------------ text
  const DATE = { x: 1520, y: 300, size: 210 };
  const DSTYLE = { font: 'title', size: DATE.size, col: C.white, outline: C.plumDark, outlineW: 8, shadow: true };
  let _cellW = 0;
  const cellW = () => _cellW || (_cellW = Math.max(...'0123456789'.split('').map((d) => RR.textWidth(d, DSTYLE))) * 0.92);
  // Odometer: the year as a continuous number; a digit rolls while the ones below wrap.
  const drawYear = (Y, x, y, o = {}) => {
    const h = DATE.size * 0.8, n = 4;
    for (let p = 0; p < n; p++) {
      const pw = Math.pow(10, n - 1 - p);
      const d = Math.floor(Y / pw) % 10;
      const rem = Y - Math.floor(Y / pw) * pw;
      const f = pw === 1 ? Y - Math.floor(Y) : RR.clamp(rem - (pw - 1));
      const pk = o.pops ? o.pops[p] : 1;
      if (pk <= 0.01) continue;
      const a = o.alpha ?? 1, dy = o.dys ? o.dys[p] : 0;
      push(); translate(x + (p - (n - 1) / 2) * cellW(), y + dy); scale(pk);
      RR.text(String(d), 0, -f * h, { ...DSTYLE, alpha: a * (1 - f) ** 1.5 });
      if (f > 0.001) RR.text(String((d + 1) % 10), 0, (1 - f) * h, { ...DSTYLE, alpha: a * f ** 1.5 });
      pop();
    }
  };
  const YEAR_T = [3.3, 4.15];
  const yearAt = (t) => 1934 + 11 * RR.seg(t, YEAR_T[0], YEAR_T[1], 'inOutCubic');
  const yearTicks = []; // a soft tick each time the odometer passes a whole year
  for (let yv = 1935; yv <= 1945; yv++) {
    let a = YEAR_T[0], b = YEAR_T[1];
    for (let i = 0; i < 30; i++) { const m = (a + b) / 2; if (yearAt(m) < yv - 0.5) a = m; else b = m; }
    yearTicks.push([+a.toFixed(3), 'tick', 0.3]);
  }

  // ------------------------------------------------------------------ raccoons
  const drawR = (cam, x, y, s, pose) => { if (onScreen(cam, [x, y - 20])) RR.drawRaccoon(x, y, s, pose); };

  // The two 1934 raccoons. i = 0 hops out left and runs west; i = 1 hops out right, then runs south-west.
  const crateRaccoon = (t, i) => {
    if (t < 1.2 || t > 4.3) return null;
    const inX = CRATE[0] + (i ? 10 : -8), inY = CRATE[1] - 2;
    const tHop = i ? 1.85 : 1.55, tLand = tHop + 0.32;
    const land = i ? [CRATE[0] + 38, CRATE[1] + 13] : [CRATE[0] - 38, CRATE[1] + 8];
    const tRun = i ? 2.66 : 2.46;
    const pose = RR.raccoonIdle(t + i * 1.3, { mouth: 'o', brow: 'up', eyes: 'wide', face: i ? 1 : -1, tail: t * 3 + i });
    let x = inX, y = inY, front = false;
    if (t < tHop) {
      // peek up out of the crate after the lid pops
      const up = RR.seg(t, 1.25 + i * 0.1, 1.45 + i * 0.1);
      if (up <= 0) return null;
      pose.squash = RR.lerp(0.34, 0, RR.E.outBack(up)) - 0.2 * Math.sin(up * Math.PI);
      pose.look = [Math.sin(t * 7 + i * 2) > 0 ? 1 : -1, -0.2];
      pose.ear = Math.sin(t * 20) * 0.5;
      if (t > tHop - 0.13) { pose.squash = 0.24; pose.eyes = 'open'; pose.brow = 'sly'; pose.mouth = 'grin'; } // anticipation
    } else if (t < tLand) {
      const u = RR.seg(t, tHop, tLand);
      [x, y] = RR.hop([inX, inY], land, u, 22);
      pose.squash = -0.2 * Math.sin(u * Math.PI);
      Object.assign(pose, { armF: 2.6, armB: 2.4, tailUp: 1, mouth: 'open', eyes: 'open', brow: 'up', lean: 0.2 });
      front = u > 0.3;
    } else if (t < tRun) {
      [x, y] = land; front = true;
      const u = RR.seg(t, tLand, tLand + 0.2);
      pose.squash = 0.25 * Math.sin(u * Math.PI) * (1 - u * 0.3);
      Object.assign(pose, { eyes: 'open', mouth: 'grin', brow: 'neutral' });
      const lk = t - tLand;
      pose.look = lk < 0.12 ? [0, 0] : lk < 0.28 ? [i ? -1 : 1, -0.1] : [0.2, 0.3];
      if (i === 0 && t > 2.06 && t < 2.34) { pose.face = 1; pose.look = [1, 0]; pose.mouth = 'smile'; pose.armF = 2.2; } // a wave at the other one
      if (i === 1 && t > 2.24) { pose.face = -1; pose.look = [1, 0]; pose.brow = 'sly'; }
      pose.blink = RR.blinkAt(t, 1.1, i * 0.4);
      if (t > tRun - 0.12) { pose.squash = 0.18; pose.lean = -0.12; pose.face = -1; }
    } else {
      const u = t - tRun;
      const acc = u < 0.25 ? (u * u) / 0.5 : u - 0.125; // ramp up to full speed
      const sp = i ? 80 : 95;
      x = land[0] - acc * sp; y = land[1] + acc * sp * (i ? 0.4 : 0.1);
      front = true;
      Object.assign(pose, { face: -1, run: t * 22, stride: 1, lean: 0.28, squash: 0, mouth: i ? 'grin' : 'open', eyes: 'open', brow: 'neutral', tailUp: 0.9, look: [1, 0] });
    }
    return { x, y, pose, front };
  };

  // The two 1945 fur-farm raccoons: shuffle up behind the fence, squeeze through the hole, dash off.
  const farmRaccoon = (t, i) => {
    if (t < 3.72 || t > 6.05) return null;
    const t0 = i ? 4.42 : 4.1;             // start squeezing through
    const behind = [HOLE_X + (i ? 9 : 2), FENCE[1] - 4];
    const out = [HOLE_X - 3, FENCE[1] + 9];
    const pose = RR.raccoonIdle(t + i, { face: -1, eyes: 'open', mouth: 'o', brow: 'up', tail: t * 3 });
    let x, y, front = false;
    if (t < t0) {
      const u = RR.seg(t, 3.72 + i * 0.1, t0 - 0.12, 'outCubic');
      x = behind[0] + (1 - u) * 22; y = behind[1];
      if (u < 1) { pose.run = t * 16; pose.stride = 0.7 * (1 - u); }
      Object.assign(pose, { lean: 0.15, armF: 1.3, armB: 1.1, brow: i ? 'worried' : 'angry', mouth: i ? 'o' : 'flat', look: [1, 0.5] });
      if (i === 0 && t > 3.9) { pose.armF = 1.6 + 0.3 * Math.sin(t * 40); pose.lean = 0.3; } // shoving the flap
      if (t > t0 - 0.12) { pose.squash = 0.28; pose.lean = 0.45; }
    } else if (t < t0 + 0.34) {
      const u = RR.seg(t, t0, t0 + 0.34);
      x = RR.lerp(behind[0], out[0], u); y = RR.lerp(behind[1], out[1], u) - Math.sin(u * Math.PI) * 5;
      pose.squash = u < 0.6 ? -0.28 : 0.2 * Math.sin(((u - 0.6) / 0.4) * Math.PI);
      Object.assign(pose, { lean: 0.55 * Math.sin(u * Math.PI), armF: 2.3, armB: 2.1, tailUp: 1, eyes: u < 0.55 ? 'closed' : 'wide', mouth: u < 0.55 ? 'flat' : 'open' });
      front = u > 0.5;
    } else {
      const u = t - t0 - 0.34;
      const acc = u < 0.2 ? (u * u) / 0.4 : u - 0.1;
      // one dashes off north-west, the other south-east
      x = out[0] + acc * (i ? 26 : -70); y = out[1] + acc * (i ? 56 : -22);
      front = true;
      Object.assign(pose, { face: i ? 1 : -1, run: t * 22, stride: 1, lean: 0.3, squash: 0, mouth: 'grin', eyes: 'happy', brow: 'neutral', tailUp: 1 });
      if (u < 0.25) { pose.eyes = 'wide'; pose.mouth = 'open'; }
    }
    const gone = RR.seg(t, 5.85, 6.05, 'inBack'); // they vanish in a puff as the population takes over
    return { x, y, pose, front, s: RS * (1 - gone) };
  };

  // The straggler (beat 4): pops up from its dot, grins at us, and scurries off the map.
  const lastRaccoon = (t) => {
    if (t < 9.2 || t > 11.5) return null;
    const s = 0.24 * RR.pop(t, 9.2, 0.35);
    const pose = RR.raccoonIdle(t, { face: 1, eyes: 'open', mouth: 'smile', brow: 'neutral' });
    let x = LAST[0], y = LAST[1] + 7;
    if (t < 9.78) {
      pose.look = t < 9.45 ? [-1, -0.1] : [0.3, 0.35];
      if (t > 9.45) { pose.mouth = 'grin'; pose.brow = 'sly'; pose.headTilt = 0.14; }
      pose.blink = t > 9.58 && t < 9.64 ? 1 : 0;
      if (t > 9.66) { pose.squash = 0.22; pose.face = -1; pose.lean = -0.12; pose.look = [1, 0]; }
    } else {
      const u = t - 9.78;
      const acc = u < 0.3 ? (u * u) / 0.6 : u - 0.15;
      x -= acc * 470; y += acc * 45;
      const edge = RR.clamp(1 - Math.abs(x - B.MAP.x) / 45); // little hop over the map's edge
      y -= Math.sin(edge * Math.PI) * 16;
      Object.assign(pose, { face: -1, run: t * 28, stride: 1, lean: 0.34, squash: 0, mouth: 'grin', eyes: 'happy', tailUp: 1, look: [1, 0] });
    }
    return { x, y, s, pose };
  };

  // ------------------------------------------------------------------ scene
  const popOut = (t, t0, dur = 0.3) => 1 - RR.E.inBack(RR.seg(t, t0, t0 + dur));

  RR.scene({
    id: 's02_history', order: 2, dur: 12, music: 'history',
    cues: [
      [0.1, 'whoosh', 0.8], [0.62, 'tock', 0.7], [0.84, 'thud', 0.8], [0.92, 'pencil', 0.6], [1.0, 'rattle', 0.7], [1.22, 'pop'],
      [1.26, 'whoosh', 0.35], [1.32, 'boing', 0.45], [1.45, 'paper', 0.6], [1.55, 'hop'], [1.85, 'hop'], [2.1, 'chitter', 0.7], [2.5, 'slide', 0.35],
      [3.25, 'whoosh', 0.45], ...yearTicks, [3.5, 'tock', 0.5], [3.62, 'tock', 0.5], [3.95, 'rattle', 0.4], [4.06, 'clang', 0.55],
      [4.12, 'boing', 0.5], [4.3, 'paper', 0.6], [4.44, 'hop', 0.8], [4.62, 'chitter', 0.6],
      [5.6, 'whoosh', 0.7], [5.9, 'poof', 0.35], [6.05, 'pop', 0.25], [6.35, 'pop', 0.25], [6.6, 'pop', 0.3], [6.85, 'pop', 0.3],
      [7.02, 'stamp', 0.7], [7.15, 'pop', 0.3], [7.4, 'pop', 0.3], [7.5, 'paper', 0.6], [7.7, 'pop', 0.3], [8.0, 'pop', 0.25],
      [8.35, 'pop', 0.3], [9.02, 'pop', 0.2], [9.2, 'poof', 0.45], [9.25, 'pop', 0.2], [9.45, 'chitter', 0.6], [9.8, 'whoosh', 0.35],
      [10.6, 'brush', 0.35], [10.9, 'hop', 0.4],
    ],
    draw(t) {
      const cam = camAt(t);
      const whipV = t < WHIP_T ? ((3 * WHIP_PX) / WHIP_T) * (1 - t / WHIP_T) ** 2 : 0; // screen px/s
      const mapIn = RR.seg(t, 0.0, 0.3, 'inQuad');
      const toBoard = RR.seg(t, 10.0, 11.1, 'inOutSine');

      RR.withCam(cam, () => {
        // --- the map (motion-smeared during the whip), cross-fading to the board's own map
        if (toBoard > 0) B.drawStatic({ only: ['map'] });
        if (toBoard < 1) {
          const spanPx = whipV / 48; // half a frame of travel (180-degree shutter), smeared over up to 6 copies
          const n = Math.min(6, Math.max(1, Math.round(spanPx / 9)));
          const span = spanPx / cam.z;
          for (let i = n - 1; i >= 0; i--) {
            const dx = n > 1 ? (i / (n - 1)) * span : 0;
            drawMapDetail(dx, (1 - toBoard) * mapIn * (n > 1 ? 1 / (n - i) : 1));
          }
        }

        // --- 1934: Lake Edersee, pin and crate
        if (t < 9.6) {
          // the pin drops onto the spot and the lake ripples out beneath it
          const lk = RR.E.outBack(RR.seg(t, 0.6, 0.95)) * popOut(t, 9.12, 0.3);
          if (lk > 0.01) RR.drawSprite(lake(), LAKE_C[0], LAKE_C[1], { w: LAKE.w * lk, h: LAKE.h * lk, rot: -0.08 });
          const rp = RR.seg(t, 0.62, 1.25);
          if (rp > 0 && rp < 1) {
            RR.flush(); noFill(); stroke(255, 255, 255, 220 * (1 - rp)); strokeWeight(0.5);
            ellipse(LAKE_C[0] + 2, LAKE_C[1] + 1, 10 + rp * 30, 3.5 + rp * 10);
            if (rp > 0.3) ellipse(LAKE_C[0] + 2, LAKE_C[1] + 1, 6 + (rp - 0.3) * 26, 2 + (rp - 0.3) * 8);
            noStroke();
          }
          if (t >= 0.4) {
            const u = RR.seg(t, 0.4, 0.62, 'inQuad');
            const land = RR.seg(t, 0.62, 0.86);
            const sq = land > 0 && land < 1 ? Math.sin(land * Math.PI) * 0.2 * (1 - land) : 0;
            const pOut = popOut(t, 9.08, 0.3);
            if (pOut > 0.01) {
              const tip = [LAKE_C[0] + 2, LAKE_C[1] + 1];
              RR.shadow(tip[0] + 1, tip[1] + 0.5, 5 * (0.4 + u * 0.6), 1.8, 60 * u * pOut);
              RR.drawSprite(pin(), tip[0], tip[1] - (1 - u) * 80, { w: PIN.w * (1 + sq) * pOut, h: PIN.h * (1 - sq) * pOut, ay: 1, rot: (1 - u) * 0.3 });
            }
          }

          // the crate drops in, rattles, and its lid pops off and spins away out of shot
          const cOut = popOut(t, 9.18, 0.3);
          const fall = RR.seg(t, 0.62, 0.84, 'inQuad');
          const landK = RR.seg(t, 0.84, 1.06);
          const rattle = RR.env(t, 1.0, 1.2, 0.05, 0.05);
          const yOff = -(1 - fall) * 90;
          let cSq = t < 0.84 ? 0.08 * fall : -0.17 * Math.sin(landK * Math.PI) * (1 - landK * 0.5);
          cSq += rattle * 0.05 * Math.sin(t * 45) + (t > 1.2 && t < 1.44 ? 0.1 * Math.sin(RR.seg(t, 1.2, 1.44) * Math.PI) : 0);
          const shake = rattle * Math.sin(t * 60) * 0.8;
          const rs = [0, 1].map((i) => crateRaccoon(t, i));
          if (t >= 0.62 && cOut > 0.01) {
            RR.shadow(CRATE[0] + 5, CRATE[1] + 1, 30 * (0.5 + 0.5 * fall), 4.5, 45 * fall);
            push(); translate(CRATE[0] + shake, CRATE[1] + yOff); scale(cOut * (1 - cSq), cOut * (1 + cSq)); translate(-CRATE[0], -CRATE[1]);
            RR.drawSprite(crateBack(), CRATE[0] + CR.x0 + CR.w / 2, CRATE[1] + CR.y0 + CR.h / 2, { w: CR.w, h: CR.h });
            for (const r of rs) if (r && !r.front) drawR(cam, r.x, r.y, RS, r.pose);
            RR.drawSprite(crateFront(), CRATE[0] + CR.x0 + CR.w / 2, CRATE[1] + CR.y0 + CR.h / 2, { w: CR.w, h: CR.h });
            if (t < 1.22) {
              const lidP = [CRATE[0] + 4, CRATE[1] - 29 - rattle * Math.abs(Math.sin(t * 38)) * 2.2];
              RR.drawSprite(lid(), lidP[0], lidP[1], { w: LID.w, h: LID.h, rot: rattle * Math.sin(t * 50) * 0.05 });
            }
            pop();
            RR.poof(CRATE[0] - 18, CRATE[1] - 2, t, 0.84, { r: 12, dur: 0.45 });
            RR.poof(CRATE[0] + 24, CRATE[1] - 2, t, 0.86, { r: 10, dur: 0.4 });
          }
          if (t >= 1.22 && t < 2.0) {
            const u = (t - 1.22) / 0.7;
            const lidP = [CRATE[0] + 4 + 95 * u, CRATE[1] - 29 - 300 * u + 60 * u * u];
            if (onScreen(cam, lidP, 200)) RR.drawSprite(lid(), lidP[0], lidP[1], { w: LID.w, h: LID.h, rot: -u * 5.5 });
          }
          for (const r of rs) if (r && r.front) {
            RR.shadow(r.x, r.y + 0.5, 9, 2, 30);
            drawR(cam, r.x, r.y, RS, r.pose);
          }
        }

        // --- 1945: the fur farm
        if (t > 3.3 && t < 9.7) {
          const fOut = popOut(t, 9.22, 0.3);
          const grow = (t0) => RR.E.outBack(RR.seg(t, t0, t0 + 0.35)) * fOut;
          const sh = grow(3.62);
          if (sh > 0.01) RR.drawSprite(shed(), FENCE[0] + 8, FENCE[1] - 12, { w: 62 * sh, h: 34 * sh, ay: 32 / 34 });
          const fr = [0, 1].map((i) => farmRaccoon(t, i));
          for (const r of fr) if (r && !r.front && r.s > 0.005) drawR(cam, r.x, r.y, r.s, r.pose);
          const fg = grow(3.48);
          if (fg > 0.01) {
            RR.shadow(FENCE[0], FENCE[1] + 1, 34 * fg, 3, 30);
            RR.drawSprite(fence(), FENCE[0] + FEN.x0 + FEN.w / 2, FENCE[1], { w: FEN.w * Math.min(1, fg * 1.1), h: FEN.h * fg, ay: -FEN.y0 / FEN.h });
            // flap: bulges as they shove it, then springs up and stays curled open
            const shove = RR.env(t, 3.88, 4.06, 0.06, 0.02) * (0.5 + 0.5 * Math.sin(t * 42));
            const open = RR.seg(t, 4.04, 4.4);
            const sy = open > 0 ? RR.lerp(1, 0.2, RR.E.outElastic(open)) : 1 - shove * 0.1;
            const rot = open > 0 ? RR.lerp(0, 0.12, RR.E.outBack(open)) : shove * 0.04;
            const hinge = [FENCE[0] + HOLE.x0 - 1 + FLAP.w / 2, FENCE[1] + (HOLE.top - 2) * fg];
            RR.drawSprite(flap(), hinge[0], hinge[1], { w: FLAP.w * fg, h: FLAP.h * sy * fg, ay: 0, rot });
          }
          for (const r of fr) if (r && r.front && r.s > 0.005) {
            RR.shadow(r.x, r.y + 0.5, 9 * r.s / RS, 2, 30);
            drawR(cam, r.x, r.y, r.s, r.pose);
          }
          for (const r of fr) if (r) RR.poof(r.x, r.y - 6, t, 5.9, { r: 12, dur: 0.45 });
        }

        // --- the population spreads (raccoon-face dots)
        if (t > 5.9 && t < 9.9) {
          for (const d of DOTS_Y) {
            const s = RR.pop(t, d.t, 0.32) * popOut(t, d.out, 0.25);
            if (s <= 0.01) continue;
            const bob = Math.sin(t * 5 + d.p[0] * 0.3) * 0.6;
            RR.drawSprite(dotSprite(), d.p[0], d.p[1] + bob, { w: DOT * d.s * s, h: DOT * d.s * s, rot: Math.sin(t * 3 + d.p[1]) * 0.08 });
          }
        }

        // --- the straggler scurries off the edge of the map
        const lr = lastRaccoon(t);
        if (lr) {
          RR.poof(LAST[0], LAST[1] + 2, t, 9.18, { r: 14, dur: 0.5 });
          if (t > 9.85) for (let k = 1; k <= 3; k++) RR.poof(lr.x + 14 * k, lr.y - 2, t, t - 0.001 - k * 0.07, { r: 7, dur: 0.3 });
          RR.shadow(lr.x, lr.y + 1, 12, 2.6, 35);
          drawR(cam, lr.x, lr.y, lr.s, lr.pose);
        }
      });

      // --- whip-pan speed streaks carried over from scene 1, slowing and fading
      const whip = 0.83 * (1 - RR.seg(t, 0, 0.5, 'outQuad'));
      if (whip > 0.01) {
        RR.flush();
        const travel = (10 - 8.9) * 6000 + 1.1 * WHIP_PX * RR.E.outCubic(RR.seg(t, 0, WHIP_T));
        for (let i = 0; i < 26; i++) {
          const y = RR.hr(i) * RR.H, len = RR.hrange(i + 5, 300, 900) * (0.4 + 0.6 * whip / 0.83);
          const x = RR.W + len - ((travel + RR.hr(i + 9) * 2400) % (RR.W + len * 2));
          RR.flat(RR.rrectPts(x - len, y, len, RR.hrange(i + 2, 3, 9), 3), C.plumMid, 120 * whip);
        }
      }

      // --- dates and captions (screen space)
      if (t > 0.85 && t < 6.2) {
        const dIn = [0, 1, 2, 3].map((i) => RR.pop(t, 0.9 + i * 0.07, 0.4));
        const dOut = [0, 1, 2, 3].map((i) => RR.seg(t, 5.65 + i * 0.05, 5.95 + i * 0.05, 'inBack'));
        drawYear(yearAt(t), DATE.x, DATE.y, { pops: dIn.map((v, i) => v * (1 - dOut[i])), dys: dOut.map((v) => -v * 30) });
      }
      RR.caption('released in Germany', t, 1.4, 3.45, { x: DATE.x, y: DATE.y + 125, size: 60 });
      RR.caption('escaped from a fur farm', t, 4.25, 6.0, { x: DATE.x, y: DATE.y + 125, size: 60 });

      // 1.5 MILLION slams in
      const mA = RR.env(t, 7.0, 9.25, 0.05, 0.3);
      if (mA > 0) {
        const k = RR.seg(t, 7.0, 7.2, 'inQuad');
        const sc = RR.lerp(2.2, 1, k) + (k >= 1 ? 0.05 * Math.exp(-(t - 7.2) * 9) * Math.sin((t - 7.2) * 38) : 0);
        push(); translate(1470, 400); rotate(-0.04); scale(sc);
        RR.text('1.5', 0, 0, { font: 'title', size: 250, col: C.gold, outline: C.plumDark, outlineW: 9, shadow: true, alpha: mA * RR.clamp(k * 1.5) });
        pop();
        const k2 = RR.pop(t, 7.2, 0.35);
        if (k2 > 0.01) {
          push(); translate(1470, 530); rotate(-0.02); scale(k2);
          RR.text('MILLION', 0, 0, { font: 'title', size: 120, col: C.white, outline: C.plumDark, outlineW: 7, shadow: true, alpha: mA });
          pop();
        }
      }
      RR.caption('raccoons in Germany today', t, 7.5, 9.25, { x: 1470, y: 650, size: 60 });
    },
  });
})();
