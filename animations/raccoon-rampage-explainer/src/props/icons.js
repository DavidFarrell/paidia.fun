// Game iconography (after the rulebook's icon legend). Each painter draws centred on
// (0, 0) at radius ~s. Use RR.icon(name, x, y, size) to draw a cached sprite version.

RR.ICONS = {};
const IC = RR.ICONS;
const P = (pts, x, y, s) => pts.map(([a, b]) => [x * s + a * s, y * s + b * s]);

// Raccoon face: the core motif of tokens and many icons.
IC.raccoonFace = (s, o = {}) => {
  const fur = o.fur || RR.C.fur, dark = o.mask || RR.C.mask, pale = o.pale || RR.C.muzzle;
  // ears
  for (const sx of [-1, 1]) {
    RR.ink([[0.22, -0.4], [0.48, -0.92], [0.8, -0.35]].map(([x, y]) => [sx * x * s, y * s]), { fill: fur, w: o.w ?? 0.9, curve: 0.45 });
    RR.ink([[0.34, -0.45], [0.49, -0.75], [0.66, -0.42]].map(([x, y]) => [sx * x * s, y * s]), { fill: RR.C.earInner, stroke: false, curve: 0.45 });
  }
  // head
  RR.ink(P([[-0.95, 0.05], [-0.7, -0.5], [0, -0.68], [0.7, -0.5], [0.95, 0.05], [0.55, 0.45], [0, 0.62], [-0.55, 0.45]], 0, 0, s), { fill: fur, w: o.w ?? 0.9, curve: 0.55 });
  // pale brows and cheeks
  RR.ink(P([[-0.78, 0.08], [-0.45, -0.2], [0, -0.3], [0.45, -0.2], [0.78, 0.08], [0.4, 0.4], [0, 0.55], [-0.4, 0.4]], 0, 0, s), { fill: pale, stroke: false, curve: 0.55 });
  // mask
  RR.ink(P([[-0.72, 0.02], [-0.45, -0.14], [-0.1, -0.02], [0, 0.08], [0.1, -0.02], [0.45, -0.14], [0.72, 0.02], [0.45, 0.22], [0.12, 0.16], [0, 0.22], [-0.12, 0.16], [-0.45, 0.22]], 0, 0, s), { fill: dark, stroke: false, curve: 0.5 });
  // eyes
  if (!o.noEyes) {
    RR.flatEllipse(-0.36 * s, 0.03 * s, 0.1 * s, 0.1 * s, pale);
    RR.flatEllipse(0.36 * s, 0.03 * s, 0.1 * s, 0.1 * s, pale);
    RR.flatEllipse(-0.35 * s, 0.04 * s, 0.055 * s, 0.06 * s, RR.C.ink);
    RR.flatEllipse(0.37 * s, 0.04 * s, 0.055 * s, 0.06 * s, RR.C.ink);
  }
  // nose
  RR.ink(P([[-0.1, 0.3], [0.1, 0.3], [0, 0.4]], 0, 0, s), { fill: RR.C.nose, stroke: false, curve: 0.6 });
};

IC.paw = (s, o = {}) => {
  const c = o.col || RR.C.ink;
  RR.ink(RR.ellipsePts(0, 0.28 * s, 0.42 * s, 0.34 * s, 16), { fill: c, stroke: false });
  for (const [x, y, r] of [[-0.55, -0.12, 0.17], [-0.2, -0.45, 0.18], [0.2, -0.45, 0.18], [0.55, -0.12, 0.17]])
    RR.ink(RR.ellipsePts(x * s, y * s, r * s, r * 1.2 * s, 12), { fill: c, stroke: false });
};

IC.crosshair = (s, o = {}) => {
  const c = o.col || RR.C.ink, w = o.w ?? 1.1;
  RR.inkCircle(0, 0, 0.62 * s, { stroke: c, w });
  RR.inkCircle(0, 0, 0.3 * s, { stroke: c, w: w * 0.8 });
  RR.inkLine([[0, -0.95 * s], [0, -0.35 * s]], { col: c, w }); RR.inkLine([[0, 0.35 * s], [0, 0.95 * s]], { col: c, w });
  RR.inkLine([[-0.95 * s, 0], [-0.35 * s, 0]], { col: c, w }); RR.inkLine([[0.35 * s, 0], [0.95 * s, 0]], { col: c, w });
  RR.flatEllipse(0, 0, 0.08 * s, 0.08 * s, c);
};

IC.skull = (s, o = {}) => {
  const c = o.col || RR.C.plumDark, bg = o.bg || RR.C.paper;
  RR.ink([[-0.7, 0.05], [-0.62, -0.5], [0, -0.82], [0.62, -0.5], [0.7, 0.05], [0.45, 0.35], [0.4, 0.7], [-0.4, 0.7], [-0.45, 0.35]].map(([x, y]) => [x * s, y * s]), { fill: c, stroke: o.stroke ?? false, curve: 0.45 });
  RR.flatEllipse(-0.28 * s, -0.08 * s, 0.19 * s, 0.21 * s, bg);
  RR.flatEllipse(0.28 * s, -0.08 * s, 0.19 * s, 0.21 * s, bg);
  RR.flat([[0, 0.12 * s], [-0.09 * s, 0.3 * s], [0.09 * s, 0.3 * s]], bg);
  for (const x of [-0.2, 0, 0.2]) RR.flat(RR.rrectPts((x - 0.05) * s, 0.48 * s, 0.1 * s, 0.2 * s, 0.03 * s), bg);
};

// Spread protection: shield with a raccoon face
IC.shield = (s, o = {}) => {
  const c = o.col || RR.C.plumDark;
  RR.ink([[0, -0.9], [0.75, -0.6], [0.7, 0.15], [0, 0.95], [-0.7, 0.15], [-0.75, -0.6]].map(([x, y]) => [x * s, y * s]), { fill: c, w: 0.9, curve: 0.25 });
  push(); translate(0, -0.02 * s); IC.raccoonFace(0.48 * s, { fur: RR.C.paper, mask: c, pale: RR.C.paper, w: 0.5 }); pop();
};

// Mitigate impact: little raccoon with an arrow pointing up (it is taken off the map)
IC.mitigate = (s, o = {}) => {
  const c = o.col || RR.C.plumDark;
  RR.ink([[-0.75, 0.55], [-0.72, 0.05], [-0.35, -0.15], [0.2, -0.12], [0.45, -0.3], [0.62, -0.1], [0.55, 0.1], [0.3, 0.2], [0.35, 0.55], [0.18, 0.55], [0.1, 0.3], [-0.35, 0.3], [-0.45, 0.55]].map(([x, y]) => [x * s, y * s]), { fill: c, stroke: false, curve: 0.3 });
  RR.inkLine([[-0.72, 0.1], [-0.95, -0.35]].map(([x, y]) => [x * s, y * s]), { col: c, w: 2.2 });
  RR.inkLine([[0.2 * s, -0.25 * s], [0.2 * s, -0.95 * s]], { col: c, w: 1.4 });
  RR.ink([[0.2, -1.05], [0.02, -0.78], [0.38, -0.78]].map(([x, y]) => [x * s, y * s]), { fill: c, stroke: false, curve: 0 });
};

IC.star = (s, o = {}) => {
  RR.ink(RR.starPts(0, 0, 1.0 * s, 0.5 * s), { fill: o.col || RR.C.gold, stroke: o.stroke ?? RR.C.goldDark, w: 0.8, curve: 0.2 });
};

IC.briefcase = (s, o = {}) => {
  RR.inkCircle(0, 0, 0.95 * s, { fill: o.bg || RR.C.teal, stroke: false });
  RR.ink(RR.rrectPts(-0.55 * s, -0.3 * s, 1.1 * s, 0.75 * s, 0.1 * s), { fill: RR.C.white, stroke: false, curve: 0.1 });
  RR.inkLine([[-0.2 * s, -0.3 * s], [-0.2 * s, -0.5 * s], [0.2 * s, -0.5 * s], [0.2 * s, -0.3 * s]], { col: RR.C.white, w: 1.6, curve: 0.2 });
  RR.flat(RR.rrectPts(-0.08 * s, -0.02 * s, 0.16 * s, 0.14 * s, 0.03 * s), RR.C.teal);
};

// Action card icon: raised fist in a dark circle
IC.fist = (s, o = {}) => {
  RR.inkCircle(0, 0, 0.95 * s, { fill: o.bg || RR.C.cardDark, stroke: false });
  const c = RR.C.card;
  RR.ink(RR.rrectPts(-0.38 * s, -0.4 * s, 0.76 * s, 0.55 * s, 0.14 * s), { fill: c, stroke: false });
  RR.ink(RR.rrectPts(-0.26 * s, 0.1 * s, 0.52 * s, 0.6 * s, 0.1 * s), { fill: c, stroke: false });
  for (const x of [-0.19, 0, 0.19]) RR.inkLine([[x * s, -0.38 * s], [x * s, -0.12 * s]], { col: RR.C.cardDark, w: 0.6 });
  for (const a of [-0.9, -0.45, 0, 0.45, 0.9]) {
    const r1 = 0.62, r2 = 0.8;
    RR.inkLine([[Math.sin(a) * r1 * s, -Math.cos(a) * r1 * s - 0.15 * s], [Math.sin(a) * r2 * s, -Math.cos(a) * r2 * s - 0.15 * s]], { col: c, w: 0.7 });
  }
};

IC.flag = (s, o = {}) => {
  const w = 1.5 * s, h = 1.0 * s, x = -w / 2, y = -h / 2;
  if (o.country === 'fr') {
    const cols = ['#3b62a8', '#f4efe4', '#d6423d'];
    cols.forEach((c, i) => RR.flat([[x + (i * w) / 3, y], [x + ((i + 1) * w) / 3, y], [x + ((i + 1) * w) / 3, y + h], [x + (i * w) / 3, y + h]], c));
  } else {
    const cols = ['#2b2629', '#d6423d', '#f1c232'];
    cols.forEach((c, i) => RR.flat([[x, y + (i * h) / 3], [x + w, y + (i * h) / 3], [x + w, y + ((i + 1) * h) / 3], [x, y + ((i + 1) * h) / 3]], c));
  }
  RR.inkRect(x, y, w, h, 2, { stroke: RR.C.ink, w: 0.6 });
};

// Role badge: flag for the agencies, paw for Animal Rights, crosshair for the Hunter.
IC.role = (s, o = {}) => {
  if (o.role === 'de' || o.role === 'fr') return IC.flag(s * 0.75, { country: o.role });
  RR.inkCircle(0, 0, 0.95 * s, { fill: o.bg || RR.C.cardDark, stroke: false });
  if (o.role === 'ar') IC.paw(0.55 * s, { col: RR.C.card });
  else IC.crosshair(0.62 * s, { col: RR.C.card, w: 0.9 });
};

// Scoring star with the role symbol (bottom-right of policy cards)
IC.scoreStar = (s, o = {}) => {
  IC.star(s);
  if (o.role === 'ar') IC.paw(0.36 * s, { col: RR.C.plumDark });
  else IC.crosshair(0.4 * s, { col: RR.C.plumDark, w: 0.7 });
};

IC.hunterDie = (s, o = {}) => {
  const c = o.col || RR.C.plumDark;
  // simple 3/4 view cube
  RR.ink([[-0.8, -0.35], [0.05, -0.85], [0.85, -0.45], [0, 0.05]].map(([x, y]) => [x * s, y * s]), { fill: RR.C.plumMid, w: 0.8, curve: 0.08 });
  RR.ink([[-0.8, -0.35], [0, 0.05], [0, 0.95], [-0.8, 0.45]].map(([x, y]) => [x * s, y * s]), { fill: c, w: 0.8, curve: 0.08 });
  RR.ink([[0, 0.05], [0.85, -0.45], [0.85, 0.45], [0, 0.95]].map(([x, y]) => [x * s, y * s]), { fill: RR.C.plum, w: 0.8, curve: 0.08 });
  push(); translate(-0.4 * s, 0.33 * s); IC.skull(0.3 * s, { col: RR.C.lilac, bg: c }); pop();
};

IC.d6 = (s, o = {}) => {
  RR.ink(RR.rrectPts(-0.8 * s, -0.8 * s, 1.6 * s, 1.6 * s, 0.3 * s), { fill: RR.C.white, w: 0.8 });
  const pips = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] }[o.n || 5];
  for (const [x, y] of pips) RR.flatEllipse(x * 0.42 * s, y * 0.42 * s, 0.13 * s, 0.13 * s, RR.C.ink);
};

IC.crown = (s, o = {}) => {
  RR.ink([[-0.9, 0.5], [-0.9, -0.35], [-0.45, 0.05], [0, -0.6], [0.45, 0.05], [0.9, -0.35], [0.9, 0.5]].map(([x, y]) => [x * s, y * s]), { fill: o.col || RR.C.gold, stroke: RR.C.goldDark, w: 0.9, curve: 0.08 });
  for (const x of [-0.9, 0, 0.9]) RR.flatEllipse(x * s, (x === 0 ? -0.65 : -0.42) * s, 0.12 * s, 0.12 * s, RR.C.gold);
  RR.flatEllipse(0, 0.2 * s, 0.13 * s, 0.13 * s, RR.C.red);
};

IC.heart = (s, o = {}) => {
  const pts = [];
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    pts.push([16 * Math.pow(Math.sin(a), 3) / 17 * s, -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) / 17 * s]);
  }
  RR.ink(pts, { fill: o.col || RR.C.rose, stroke: o.stroke ?? false, w: 0.8, curve: 0.3 });
};

IC.tick = (s, o = {}) => RR.inkLine([[-0.6 * s, 0], [-0.15 * s, 0.5 * s], [0.7 * s, -0.55 * s]], { col: o.col || RR.C.greenDeep, w: o.w ?? 3, curve: 0.1 });
IC.cross = (s, o = {}) => {
  RR.inkLine([[-0.55 * s, -0.55 * s], [0.55 * s, 0.55 * s]], { col: o.col || RR.C.red, w: o.w ?? 3 });
  RR.inkLine([[0.55 * s, -0.55 * s], [-0.55 * s, 0.55 * s]], { col: o.col || RR.C.red, w: o.w ?? 3 });
};

IC.arrow = (s, o = {}) => { // points up
  const c = o.col || RR.C.ink;
  RR.ink([[-0.25, 0.9], [-0.25, -0.1], [-0.6, -0.1], [0, -0.9], [0.6, -0.1], [0.25, -0.1], [0.25, 0.9]].map(([x, y]) => [x * s, y * s]), { fill: c, stroke: o.stroke ?? false, curve: 0.05 });
};

// Cached sprite version of any icon. extra = options passed to the painter.
RR.icon = (name, x, y, size, extra = {}, drawOpts = {}) => {
  const key = 'icon:' + name + ':' + JSON.stringify(extra);
  const spr = RR.sprite(key, 100, 100, () => { push(); translate(50, 50); IC[name](38, extra); pop(); }, { res: extra.res ?? 2 });
  RR.drawSprite(spr, x, y, { w: size, h: size, ...drawOpts });
};
