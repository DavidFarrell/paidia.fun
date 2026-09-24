// The game board: static painted sections (cached sprites) plus helpers that give
// scenes the world positions of every slot, space and token spot.
// World units: board is 2400 x 1500, origin top-left. See STORYBOARD.md for the layout.

const B = (RR.board = {});
B.W = 2400; B.H = 1500;

// ---------------------------------------------------------------- layout
B.slot = (k) => [2000 - (k - 1) * 212, 225];            // queue space k = 1..8 (1 = front, right)
B.EVAL = [2215, 640];                                     // evaluation spot
B.MAP = { x: 520, y: 440, w: 1260, h: 840, k: 1.26 };
B.DECK = [1950, 760];                                     // spread deck
B.RULES = [2215, 1010];                                   // spread rules card (170 x 240)
B.PROT = [1985, 1120];                                    // spread protection circle
B.PROT_R = 100;
B.STORY_Y = 1395;
B.story = (i) => [700 + i * 340, B.STORY_Y];              // storyline slot i = 0..4
B.STORY_LABELS = ['BEGINNING', '5 YEARS', '10 YEARS', '15 YEARS', '20 YEARS'];

B.mapPt = ([mx, my]) => [B.MAP.x + mx * B.MAP.k, B.MAP.y + my * B.MAP.k];
// Same projection as tools/build_map.mjs (Lambert azimuthal equal-area at 10E, 50N).
B.lonlat = (lon, lat) => {
  const D = Math.PI / 180, l0 = 10 * D, p0 = 50 * D, l = lon * D, p = lat * D;
  const k = Math.sqrt(2 / (1 + Math.sin(p0) * Math.sin(p) + Math.cos(p0) * Math.cos(p) * Math.cos(l - l0)));
  const x = k * Math.cos(p) * Math.sin(l - l0), y = -k * (Math.cos(p0) * Math.sin(p) - Math.sin(p0) * Math.cos(p) * Math.cos(l - l0));
  const S = 1000 / 0.66;
  return B.mapPt([(x + 0.33) * S, (y + 0.19) * S]);
};

// Impact tracker: 15 spaces, -7 (green end) .. 0 (neutral start) .. +7 (skull)
B.TRACK_PATH = [[250, 1185], [380, 1120], [405, 1010], [300, 950], [160, 900], [110, 800], [200, 730], [340, 690], [410, 600], [360, 515], [250, 470]];
B.track = (i) => RR.along(B.TRACK_PATH, (i + 7) / 14);
B.trackCol = (i) => {
  if (i === 0) return RR.C.neutral;
  if (i < 0) return RR.mix(RR.C.greenLight, RR.C.greenDeep, (-i - 1) / 6);
  return RR.mix('#f2c46b', RR.C.redDeep, (i - 1) / 6);
};
B.trackAngle = (i) => {
  const a = RR.along(B.TRACK_PATH, RR.clamp((i + 7 - 0.3) / 14)), b = RR.along(B.TRACK_PATH, RR.clamp((i + 7 + 0.3) / 14));
  return Math.atan2(b[1] - a[1], b[0] - a[0]);
};

// Spread squares in the rest of Europe, in fill order: green, then orange, then red.
B.SQUARES = [
  ['green', 4.6, 50.6], ['green', 5.6, 52.3], ['green', 8.3, 46.9], ['green', 14.3, 47.7], ['green', 15.4, 49.9], ['green', 9.6, 55.6],
  ['orange', 18.6, 52.2], ['orange', 11.2, 44.9], ['orange', -1.4, 52.4], ['orange', -3.6, 42.6], ['orange', 19.0, 47.3], ['orange', 15.8, 45.4], ['orange', 14.8, 57.3],
  ['red', -7.8, 53.3], ['red', -8.0, 39.8], ['red', -4.3, 37.6], ['red', 16.3, 40.6], ['red', 24.6, 45.9], ['red', 21.4, 42.6], ['red', 24.3, 55.3],
].map(([col, lon, lat]) => ({ col, pos: B.lonlat(lon, lat) }));

// Token spots inside Germany and France (grid points inside the country outline).
const _inPoly = (pt, poly) => {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};
B.country = (name) => {
  const c = EUROPE.countries.find((k) => k.name === name);
  const main = c.polys.slice().sort((a, b) => b.length - a.length)[0];
  return main.map(B.mapPt);
};
const _spots = (name, centre, n, step) => {
  const poly = B.country(name);
  const xs = poly.map((p) => p[0]), ys = poly.map((p) => p[1]);
  const pts = [];
  for (let y = Math.min(...ys) + step / 2; y < Math.max(...ys); y += step * 0.86)
    for (let x = Math.min(...xs) + step / 2 + ((Math.round(y / step) % 2) * step) / 2; x < Math.max(...xs); x += step) {
      // keep a margin from the border
      if (_inPoly([x, y], poly) && [0, 1, 2, 3].every((k) => _inPoly([x + Math.cos(k * 1.57) * step * 0.4, y + Math.sin(k * 1.57) * step * 0.4], poly))) pts.push([x, y]);
    }
  pts.sort((a, b) => RR.dist(a, centre) - RR.dist(b, centre));
  return pts.slice(0, n);
};
B.init = () => {
  B.SPOTS = {
    de: _spots('Germany', B.lonlat(10.2, 51.2), 18, 44),
    fr: _spots('France', B.lonlat(2.6, 47.0), 16, 46),
  };
};

// ---------------------------------------------------------------- static painting
const panel = (x, y, w, h, col, r = 18) => RR.water(RR.rrectPts(x, y, w, h, r), col, { layers: 8, alpha: 55, spread: 0.008, edge: 0.4 });
const label = (s, x, y, size, col = RR.C.lilac, o = {}) => RR.text(s, x, y, { font: 'title', size, col, ...o });

B.SECTIONS = {
  base: { x: 0, y: 0, w: 2400, h: 1500, res: [1.0, 0.5], paint() {
    RR.water(RR.rrectPts(6, 6, 2388, 1488, 46), RR.C.plumDark, { layers: 10, alpha: 70, spread: 0.004, edge: 0.6 });
    RR.speckle(20, 20, 2360, 1460, '#1f1a24', 900, 35, 3);
    RR.ink(RR.rrectPts(16, 16, 2368, 1468, 40), { stroke: RR.C.plumMid, w: 1.4, curve: 0.2 });
  } },
  queue: { x: 40, y: 40, w: 2320, h: 390, res: [1.5, 0.7], paint(o) {
    panel(40, 40, 2320, 380, RR.C.plum);
    for (let k = 1; k <= 8; k++) {
      const [x, y] = B.slot(k);
      RR.ink(RR.rrectPts(x - 102, y - 140, 204, 280, 16), { fill: k <= 4 ? '#6d5a70' : '#5d4b60', stroke: RR.C.lilac, w: 0.7, curve: 0.2 });
      RR.inkCircle(x, y + 162, 16, { fill: RR.C.lilac, stroke: false });
      label(String(k), x, y + 172, 28, RR.C.plumDark);
    }
    RR.ink(RR.rrectPts(1238, 70, 4, 300, 2), { fill: RR.C.lilac, stroke: false });
    label('QUEUE', 175, 190, 40); label('PHASE', 175, 232, 40);
    RR.inkCircle(175, 205, 88, { stroke: RR.C.lilac, w: 1.2 });
    RR.text('face down', 830, 402, { font: 'hand', size: 26, col: RR.C.lilac });
    RR.text('face up', 1680, 402, { font: 'hand', size: 26, col: RR.C.lilac });
    // direction arrow
    RR.inkLine([[330, 402], [620, 402]], { col: RR.C.lilac, w: 1.2 });
    RR.ink([[640, 402], [618, 390], [618, 414]], { fill: RR.C.lilac, stroke: false, curve: 0 });
    RR.inkLine([[1900, 402], [2280, 402]], { col: RR.C.lilac, w: 1.2 });
    RR.ink([[2300, 402], [2278, 390], [2278, 414]], { fill: RR.C.lilac, stroke: false, curve: 0 });
  } },
  tracker: { x: 40, y: 400, w: 470, h: 900, res: [1.5, 0.7], paint() {
    panel(46, 440, 460, 830, '#4a3b4d', 30);
    RR.inkLine(B.TRACK_PATH, { col: '#2a232e', w: 9, curve: 0.6 });
    for (let i = -6; i <= 6; i++) {
      const [x, y] = B.track(i), a = B.trackAngle(i);
      const pts = RR.xform(RR.rrectPts(-26, -24, 52, 48, 10), x, y, 1, a);
      RR.ink(pts, { fill: B.trackCol(i), stroke: RR.C.ink, w: 0.8, curve: 0.3 });
    }
    // neutral start ring
    const n = B.track(0);
    RR.inkCircle(n[0], n[1], 30, { fill: RR.C.neutral, w: 1 });
    RR.inkCircle(n[0], n[1], 12, { fill: RR.C.ink, stroke: false });
    // green end: sleepy raccoon in the leaves
    const g = B.track(-7);
    RR.inkCircle(g[0], g[1], 74, { fill: '#a9cf8c', w: 1.2 });
    for (let i = 0; i < 9; i++) {
      const a = i * 0.7, r = 50;
      RR.ink(RR.ellipsePts(g[0] + Math.cos(a) * r, g[1] + Math.sin(a) * r, 22, 11, 12, a + 0.8), { fill: i % 2 ? RR.C.greenDeep : RR.C.green, stroke: false });
    }
    push(); translate(g[0], g[1] + 8); RR.ICONS.raccoonFace(40, { noEyes: true }); pop();
    RR.inkLine([[g[0] - 22, g[1] + 8], [g[0] - 8, g[1] + 11]], { w: 1 }); RR.inkLine([[g[0] + 8, g[1] + 11], [g[0] + 22, g[1] + 8]], { w: 1 });
    // red end: skull
    const r = B.track(7);
    RR.inkCircle(r[0], r[1], 70, { fill: RR.C.red, w: 1.2 });
    push(); translate(r[0], r[1]); RR.ICONS.skull(46, { col: RR.C.plumDark, bg: RR.C.red }); pop();
    push(); translate(88, 1000); rotate(-Math.PI / 2); label('IMPACT TRACKER', 0, 0, 34); pop();
  } },
  map: { x: 510, y: 430, w: 1280, h: 860, res: [1.5, 0.7], paint() {
    const M = B.MAP;
    RR.water(RR.rrectPts(M.x, M.y, M.w, M.h, 20), RR.C.sea, { layers: 10, alpha: 60, spread: 0.006, edge: 0.5 });
    for (const c of EUROPE.countries) {
      const tint = c.name === 'France' ? RR.C.franceTint : c.name === 'Germany' ? RR.C.germanyTint : RR.C.land;
      for (const poly of c.polys) RR.water(poly.map(B.mapPt), tint, { layers: 5, alpha: 70, spread: 0.01, edge: 0.3, baseDepth: 0 });
    }
    for (const c of EUROPE.countries) for (const poly of c.polys) {
      const special = c.name === 'France' || c.name === 'Germany';
      RR.ink(poly.map(B.mapPt), { stroke: special ? RR.C.ink : RR.C.landEdge, w: special ? 0.8 : 0.45, curve: 0.1 });
    }
    for (const s of B.SQUARES) RR.ink(RR.rrectPts(s.pos[0] - 15, s.pos[1] - 15, 30, 30, 5), { fill: RR.C[s.col], stroke: RR.C.ink, w: 0.6, curve: 0.1 });
    RR.ink(RR.rrectPts(M.x, M.y, M.w, M.h, 20), { stroke: RR.C.ink, w: 1.2, curve: 0.2 });
  } },
  right: { x: 1810, y: 430, w: 570, h: 870, res: [1.5, 0.7], paint() {
    panel(1830, 450, 530, 820, '#4a3b4d', 26);
    const [dx, dy] = B.DECK;
    RR.ink(RR.rrectPts(dx - 102, dy - 140, 204, 280, 16), { fill: '#5d4b60', stroke: RR.C.lilac, w: 0.7 });
    label('SPREAD', dx, dy - 158, 30);
    label('DECK', dx, dy + 176, 26);
    const [ex, ey] = B.EVAL;
    RR.ink(RR.rrectPts(ex - 104, ey - 142, 208, 284, 16), { fill: '#6d5a70', stroke: RR.C.gold, w: 1, curve: 0.2 });
    label('EVALUATE', ex, ey - 160, 30, RR.C.gold);
    const [rx, ry] = B.RULES;
    RR.ink(RR.rrectPts(rx - 90, ry - 124, 180, 248, 14), { fill: '#5d4b60', stroke: RR.C.lilac, w: 0.7 });
    const [px, py] = B.PROT;
    RR.inkCircle(px, py, B.PROT_R, { fill: '#5d4b60', stroke: RR.C.lilac, w: 1 });
    push(); translate(px, py - 22); RR.ICONS.shield(34, { col: RR.C.lilac }); pop();
    label('SPREAD', px, py + 46, 24); label('PROTECTION', px, py + 72, 24);
  } },
  story: { x: 40, y: 1290, w: 2320, h: 200, res: [1.5, 0.7], paint() {
    panel(46, 1300, 2308, 184, RR.C.plum, 26);
    RR.inkCircle(330, B.STORY_Y, 74, { fill: '#4a3b4d', stroke: RR.C.lilac, w: 1 });
    label('NEW', 330, B.STORY_Y - 6, 36); label('ROUND', 330, B.STORY_Y + 30, 36);
    for (let i = 0; i < 5; i++) {
      const [x, y] = B.story(i);
      RR.ink(RR.rrectPts(x - 156, y - 88, 312, 176, 14), { fill: '#5d4b60', stroke: RR.C.lilac, w: 0.7, curve: 0.2 });
      label(B.STORY_LABELS[i], x, y + 8, 30, '#8a7590');
    }
  } },
};

B.sectionSprite = (name, lod) => {
  const S = B.SECTIONS[name];
  return RR.sprite(`board:${name}:${lod}`, S.w, S.h, () => { push(); translate(-S.x, -S.y); S.paint(); pop(); }, { res: S.res[lod === 'hi' ? 0 : 1] });
};
// Draw the static board. o.sections: {name: {alpha, scale, dy}} for assembly animations;
// o.only: list of section names; o.lod forces 'hi'/'lo'.
B.drawStatic = (o = {}) => {
  const z = RR.curCam ? RR.curCam.z : 1;
  const lod = o.lod || (z > 0.8 ? 'hi' : 'lo');
  for (const name of o.only || Object.keys(B.SECTIONS)) {
    const S = B.SECTIONS[name];
    const st = (o.sections && o.sections[name]) || {};
    if ((st.alpha ?? 1) <= 0) continue;
    const sc = st.scale ?? 1;
    RR.drawSprite(B.sectionSprite(name, lod), S.x + S.w / 2, S.y + S.h / 2 + (st.dy ?? 0), { w: S.w * sc, h: S.h * sc, alpha: st.alpha ?? 1 });
  }
};

// ---------------------------------------------------------------- dynamic pieces
// Tokens on the map. counts = {de, fr, roe}; o.pop = {de: [scale...], ...} optional per-token scales
// (0 hides, 1 normal) so scenes can animate arrivals/removals. size in world units.
B.drawTokens = (counts, o = {}) => {
  const size = o.size ?? 40;
  const draw = (pos, kind, sc) => { if (sc > 0.01) RR.drawToken(pos[0], pos[1] - size * 0.1, size * sc, kind); };
  for (let i = 0; i < (counts.de || 0); i++) draw(B.SPOTS.de[i % B.SPOTS.de.length], 'yellow', o.pop?.de?.[i] ?? 1);
  for (let i = 0; i < (counts.fr || 0); i++) draw(B.SPOTS.fr[i % B.SPOTS.fr.length], 'blue', o.pop?.fr?.[i] ?? 1);
  for (let i = 0; i < (counts.roe || 0); i++) draw(B.SQUARES[i % B.SQUARES.length].pos, 'black', o.pop?.roe?.[i] ?? 1);
};
// Tracker marker at (possibly fractional) space v, with an optional hop between spaces.
B.drawTracker = (v, o = {}) => {
  const vi = RR.clamp(v, -7, 7);
  const p = RR.along(B.TRACK_PATH, (vi + 7) / 14);
  const frac = Math.abs(vi - Math.round(vi));
  const hop = (o.hop ?? 1) * Math.sin(Math.PI * Math.min(1, frac * 2)) * 18;
  RR.drawMarker(p[0], p[1] - hop - 6, o.size ?? 74);
};
// Queue cards: list of {id, k (slot, fractional allowed), flip, dy, lift, glow, alpha}
B.drawQueue = (cards) => {
  for (const c of cards) {
    const [x, y] = B.slot(c.k);
    RR.drawCard(c.id, x + (c.dx || 0), y + (c.dy || 0), { w: 190, flip: c.flip ?? (c.k <= 4.5 ? 1 : 0), lift: c.lift ?? 0, glow: c.glow, alpha: c.alpha, rot: c.rot });
  }
};
// Vote cubes stacked on a card at (x, y): list of roles, e.g. ['de','de','ar']
B.cubesOnCard = (x, y, roles, o = {}) => {
  const n = roles.length, size = o.size ?? 34;
  roles.forEach((r, i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const px = x - 40 + col * 40 + (row % 2) * 8, py = y + 60 - row * 30;
    const sc = o.pop?.[i] ?? 1;
    if (sc > 0.01) RR.drawCube(px, py, size * sc, r);
  });
};
RR.INITS.push(B.init);
