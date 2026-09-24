// Cards: data for the real cards shown in the film plus painters for faces and backs.
// Card text follows the rulebook and published card images (paidia/ecologygames sites).
//
// RR.drawCard(id, x, y, opts) draws a card centred on (x, y).
//   opts: w (width; portrait 190, landscape 300), rot, flip (0 = back up, 1 = face up;
//   in-between animates the flip), alpha, lift (0-1 raises the shadow), glow (colour),
//   lod ('hi' | 'lo' | auto from camera zoom)

RR.CARD_W = 190; RR.CARD_H = 265;
RR.EVENT_W = 300; RR.EVENT_H = 170;

RR.CARDS = {
  protect: { kind: 'policy', title: 'PROTECT BREEDING SITES', text: 'Electric fences around breeding sites of vulnerable birds and amphibians.', cost: 5, owner: 'de', effects: [['mitigate', 2]], score: 'ar', art: 'protect' },
  burgers: { kind: 'policy', title: 'RACCOON BURGERS', text: 'Restaurants put burgers with meat from hunted raccoons on their menus.', cost: 3, owner: 'hu', effects: [['hunterDie', 2]], score: 'hu', special: 'corp', art: 'burgers' },
  drones: { kind: 'policy', title: 'DRONE ZAPPERS', text: 'Drones patrol nature reserves and zap raccoons that get too close.', cost: 7, owner: 'fr', effects: [['mitigate', 1], ['hunterDie', 1]], score: 'hu', art: 'drones' },
  wear: { kind: 'policy', title: 'WEAR THEM', text: 'Government-funded rewards for raccoon pelts. Sponsored fashion shows featuring raccoon hats.', cost: 3, owner: 'hu', effects: [['hunterDie', 1]], score: 'hu', special: 'corp', art: 'wear' },
  pets: { kind: 'policy', title: 'NO MORE PETS', text: 'Hard crackdown on the pet trade. They might be cute, but it is not worth it.', cost: 5, owner: 'ar', effects: [['shield', 2]], score: 'ar', art: 'pets' },
  behind: { kind: 'action', title: 'BEHIND THE SCENES', text: 'Your lobbyists pull some strings and a vote goes in a surprising direction.', owner: 'fr', phase: 'ANYTIME:', effect: 'Move up to 4 vote tokens from face-up Policy cards to Storyline Events or other face-up Policy cards.', art: 'puppet' },
  celeb: { kind: 'action', title: 'CELEBRITY ENDORSEMENT', text: 'Your cause is championed by a famous actor.', owner: 'ar', phase: 'YOUR MAIN PHASE:', effect: 'Place 2 votes.', art: 'celeb' },
  corprelief: { kind: 'event', title: 'CORPORATE RELIEF', text: 'Regulations and taxes on corporations cut! The rich get richer!', tag: 'ONGOING:', effect: 'Revealed corporate policies get a corporate vote.', art: 'corprelief' },
  corpself: { kind: 'event', title: 'CORPORATE SELF INTEREST', text: 'Europe-wide Biodiversity Treaty rejected after intense corporate lobbying.', tag: 'ACTIVE:', effect: 'Env agencies have 1 fewer influence.', art: 'corpself' },
  bigfarm: { kind: 'event', title: 'BIG FARM CORP', text: 'Small farms are taken over by industrial agriculture!', art: 'bigfarm' },
  freetrade: { kind: 'event', title: 'FREE TRADE', text: 'Goods, and stowaways, cross borders freely.', art: 'freetrade' },
  burns: { kind: 'event', title: 'EUROPE BURNS', text: 'Climate change out of control!', art: 'burns' },
  spread0: { kind: 'spread', n: 0, sub: 'a quiet year', col: 'teal' },
  spread1: { kind: 'spread', n: 1, sub: 'Raccoons can pass parasites to other mammals and birds.', col: 'spread1' },
  spread2: { kind: 'spread', n: 2, sub: 'As predators, raccoons threaten ground-nesting birds.', col: 'spread2' },
  rules: { kind: 'rules' },
};

// ---------------------------------------------------------------- art painters (x, y, w, h = art window)
const ART = (RR.CARD_ART = {});
const bg = (x, y, w, h, col, col2) => {
  RR.water(RR.rrectPts(x, y, w, h, 8), col, { layers: 12, alpha: 40, spread: 0.02, edge: 0.2 });
  if (col2) RR.water(RR.rrectPts(x, y + h * 0.55, w, h * 0.45, 8), col2, { layers: 8, alpha: 40, spread: 0.03, edge: 0.1 });
};
const face = (x, y, s, o) => { push(); translate(x, y); RR.ICONS.raccoonFace(s, o || {}); pop(); };
ART.protect = (x, y, w, h) => {
  bg(x, y, w, h, '#cfe3c4', '#9cc48a');
  for (let i = 0; i < 9; i++) RR.inkLine([[x + 8 + i * 18, y + h], [x + 12 + i * 18 + RR.hrange(i, -6, 6), y + h * RR.hrange(i + 3, 0.25, 0.5)]], { col: '#5f8f4c', w: 1.1 });
  // fence mesh
  for (let i = 0; i < 8; i++) {
    RR.inkLine([[x + 6 + i * 22, y + 12], [x + 6 + i * 22 + 40, y + h - 10]], { col: '#7b8b83', w: 0.5, brush: 'pencil' });
    RR.inkLine([[x + 46 + i * 22, y + 12], [x + 6 + i * 22, y + h - 10]], { col: '#7b8b83', w: 0.5, brush: 'pencil' });
  }
  RR.water(RR.ellipsePts(x + w * 0.52, y + h * 0.78, 42, 16), '#9a7650', { layers: 12, alpha: 40 });
  for (const [dx, dy] of [[-16, -6], [2, -9], [18, -5]]) RR.inkEllipse(x + w * 0.52 + dx, y + h * 0.72 + dy, 9, 11, { fill: '#f4efe2', w: 0.6 });
  RR.inkEllipse(x + w * 0.52, y + h * 0.78, 42, 14, { stroke: '#6d5238', w: 0.8, fill: false });
  // no-raccoon sign
  RR.inkCircle(x + w * 0.5, y + h * 0.33, 26, { fill: '#f7f1e6', w: 0.8 });
  face(x + w * 0.5, y + h * 0.35, 15, { w: 0.5 });
  RR.inkCircle(x + w * 0.5, y + h * 0.33, 26, { stroke: RR.C.red, w: 2.2 });
  RR.inkLine([[x + w * 0.5 - 18, y + h * 0.33 - 18], [x + w * 0.5 + 18, y + h * 0.33 + 18]], { col: RR.C.red, w: 2.2 });
};
ART.burgers = (x, y, w, h) => {
  bg(x, y, w, h, '#f3dcc0');
  // striped tail behind
  for (let i = 0; i < 5; i++) RR.inkEllipse(x + w * 0.8, y + h * (0.2 + i * 0.12), 12, 9, { fill: i % 2 ? RR.C.tailDark : RR.C.tailLight, w: 0.5 });
  const cx = x + w * 0.45, cy = y + h * 0.55;
  RR.ink([[cx - 50, cy + 20], [cx + 50, cy + 20], [cx + 44, cy + 34], [cx - 44, cy + 34]], { fill: '#d9a25e', w: 0.7, curve: 0.5 });
  RR.ink([[cx - 54, cy + 8], [cx + 54, cy + 8], [cx + 50, cy + 20], [cx - 50, cy + 20]], { fill: '#6b4431', w: 0.7, curve: 0.4 });
  RR.ink([[cx - 56, cy + 2], [cx - 30, cy - 4], [cx, cy + 4], [cx + 30, cy - 4], [cx + 56, cy + 2], [cx + 50, cy + 10], [cx - 50, cy + 10]], { fill: '#8cbf5a', w: 0.6, curve: 0.6 });
  RR.ink([[cx - 52, cy], [cx - 40, cy - 30], [cx, cy - 42], [cx + 40, cy - 30], [cx + 52, cy]], { fill: '#e2ae66', w: 0.8, curve: 0.6 });
  for (let i = 0; i < 6; i++) RR.flatEllipse(cx - 30 + i * 12, cy - 22 - (i % 2) * 6, 2.2, 1.4, '#fbf1dc');
  RR.text('RACBURGER', cx, y + h - 6, { font: 'title', size: 13, col: RR.C.red });
};
ART.drones = (x, y, w, h) => {
  bg(x, y, w, h, '#bcd9e8', '#d7ead9');
  const cx = x + w * 0.45, cy = y + h * 0.3;
  RR.ink(RR.rrectPts(cx - 18, cy - 7, 36, 14, 5), { fill: '#9aa5ad', w: 0.8 });
  for (const sx of [-1, 1]) {
    RR.inkLine([[cx + sx * 16, cy - 2], [cx + sx * 40, cy - 12]], { w: 0.8 });
    RR.inkEllipse(cx + sx * 40, cy - 14, 18, 4, { fill: '#d6dde2', w: 0.6 });
  }
  RR.inkLine([[cx - 6, cy + 8], [cx - 14, cy + 22], [cx - 8, cy + 26]], { w: 0.8 });
  RR.inkLine([[cx + 6, cy + 8], [cx + 14, cy + 22], [cx + 8, cy + 26]], { w: 0.8 });
  RR.inkLine([[cx + 4, cy + 30], [cx + 14, cy + 40], [cx + 6, cy + 44], [cx + 18, cy + 56]], { col: '#f2c23a', w: 2, curve: 0 });
  face(x + w * 0.62, y + h * 0.78, 24);
};
ART.wear = (x, y, w, h) => {
  bg(x, y, w, h, '#d9d4e2');
  const cx = x + w * 0.45, cy = y + h * 0.55;
  RR.ink([[cx - 36, cy + 30], [cx - 30, cy - 18], [cx + 6, cy - 34], [cx + 32, cy - 16], [cx + 36, cy + 30]], { fill: '#f1c7a5', w: 0.8, curve: 0.6 }); // face
  RR.ink([[cx - 42, cy - 4], [cx - 36, cy - 36], [cx, cy - 50], [cx + 36, cy - 36], [cx + 42, cy - 4]], { fill: RR.C.fur, w: 0.8, curve: 0.6 }); // fur hat
  for (let i = 0; i < 5; i++) RR.inkEllipse(cx + 50 + i * 6, cy - 16 + i * 13, 11, 8, { fill: i % 2 ? RR.C.tailDark : RR.C.tailLight, w: 0.5 });
  RR.flatEllipse(cx - 12, cy + 6, 3, 3.5, RR.C.ink); RR.flatEllipse(cx + 12, cy + 6, 3, 3.5, RR.C.ink);
  RR.inkLine([[cx - 8, cy + 20], [cx, cy + 23], [cx + 8, cy + 20]], { w: 0.6 });
};
ART.pets = (x, y, w, h) => {
  bg(x, y, w, h, '#f1dca0');
  face(x + w * 0.5, y + h * 0.48, 40);
  RR.ink([[x + w * 0.5 - 30, y + h * 0.75], [x + w * 0.5 + 30, y + h * 0.75], [x + w * 0.5 + 22, y + h * 0.98], [x + w * 0.5 - 22, y + h * 0.98]], { fill: '#a9d6a8', w: 0.7, curve: 0.5 });
  RR.text('BABY', x + w * 0.5, y + h * 0.9, { font: 'title', size: 12, col: '#ffffff' });
};
ART.puppet = (x, y, w, h) => {
  RR.water(RR.ellipsePts(x + w / 2, y + h / 2, w * 0.46, h * 0.46), '#d8cfe0', { layers: 12, alpha: 40 });
  for (const dx of [-26, -8, 12, 30]) RR.inkLine([[x + w / 2 + dx, y + 4], [x + w / 2 + dx * 0.8, y + h * 0.42]], { col: RR.C.inkSoft, w: 0.4, brush: 'pencil' });
  face(x + w / 2, y + h * 0.55, 30);
};
ART.celeb = (x, y, w, h) => {
  RR.water(RR.ellipsePts(x + w / 2, y + h / 2, w * 0.46, h * 0.46), '#f2b6c2', { layers: 12, alpha: 40 });
  face(x + w / 2, y + h * 0.55, 30);
  RR.ink(RR.rrectPts(x + w / 2 - 28, y + h * 0.5, 24, 12, 4), { fill: RR.C.ink, stroke: false });
  RR.ink(RR.rrectPts(x + w / 2 + 4, y + h * 0.5, 24, 12, 4), { fill: RR.C.ink, stroke: false });
  push(); translate(x + w * 0.25, y + h * 0.25); RR.ICONS.heart(10, { col: '#e0556f' }); pop();
  push(); translate(x + w * 0.78, y + h * 0.3); RR.ICONS.heart(8, { col: '#e0556f' }); pop();
};
ART.corprelief = (x, y, w, h) => {
  bg(x, y, w, h, '#e9d9ef', '#f3e3a8');
  RR.ink([[x + w * 0.3, y + h * 0.95], [x + w * 0.35, y + h * 0.45], [x + w * 0.65, y + h * 0.45], [x + w * 0.7, y + h * 0.95]], { fill: '#6f4b86', w: 0.8, curve: 0.2 });
  RR.inkCircle(x + w * 0.5, y + h * 0.32, 13, { fill: RR.C.skin1, w: 0.7 });
  RR.ink(RR.rrectPts(x + w * 0.5 - 12, y + h * 0.05, 24, 18, 2), { fill: RR.C.ink, stroke: false });
  RR.inkLine([[x + w * 0.1, y + h * 0.8], [x + w * 0.3, y + h * 0.6], [x + w * 0.42, y + h * 0.7], [x + w * 0.9, y + h * 0.2]], { col: RR.C.greenDeep, w: 1.6, curve: 0 });
};
ART.corpself = (x, y, w, h) => {
  bg(x, y, w, h, '#cfe0ec');
  RR.ink(RR.rrectPts(x + w * 0.25, y + h * 0.12, w * 0.5, h * 0.76, 3), { fill: '#fbf6ea', w: 0.8, curve: 0.1 });
  RR.text('TREATY', x + w * 0.5, y + h * 0.32, { font: 'title', size: 12, col: RR.C.ink });
  for (let i = 0; i < 4; i++) RR.inkLine([[x + w * 0.32, y + h * (0.45 + i * 0.1)], [x + w * 0.68, y + h * (0.45 + i * 0.1)]], { w: 0.4, brush: 'pencil' });
  RR.inkLine([[x + w * 0.2, y + h * 0.2], [x + w * 0.8, y + h * 0.85]], { col: RR.C.red, w: 2 });
};
ART.bigfarm = (x, y, w, h) => {
  bg(x, y, w, h, '#f1e2c2', '#c9d99a');
  for (const [dx, hh] of [[0.2, 0.7], [0.36, 0.8], [0.52, 0.65]]) RR.ink(RR.rrectPts(x + w * dx, y + h * (0.95 - hh), w * 0.13, h * hh, 6), { fill: '#c9ccd2', w: 0.7 });
  RR.ink([[x + w * 0.68, y + h * 0.95], [x + w * 0.68, y + h * 0.55], [x + w * 0.8, y + h * 0.4], [x + w * 0.92, y + h * 0.55], [x + w * 0.92, y + h * 0.95]], { fill: '#e7a15a', w: 0.7, curve: 0 });
};
ART.freetrade = (x, y, w, h) => {
  bg(x, y, w, h, '#cfe3ea', '#8fb3c7');
  const cols = ['#d9574a', '#6fb3a8', '#e9b52f', '#4f7fbd', '#8c7289'];
  for (let i = 0; i < 5; i++) RR.ink(RR.rrectPts(x + w * 0.12 + (i % 3) * w * 0.25, y + h * (0.55 - Math.floor(i / 3) * 0.2), w * 0.24, h * 0.18, 2), { fill: cols[i], w: 0.6, curve: 0.05 });
  face(x + w * 0.83, y + h * 0.35, 12, { w: 0.4 });
};
ART.burns = (x, y, w, h) => {
  bg(x, y, w, h, '#f4c79a', '#e98a5a');
  for (let i = 0; i < 4; i++) {
    const fx = x + w * (0.18 + i * 0.22);
    RR.ink([[fx - 14, y + h], [fx - 10, y + h * 0.6], [fx, y + h * 0.35], [fx + 10, y + h * 0.6], [fx + 14, y + h]], { fill: i % 2 ? '#e0563f' : '#f2a33a', stroke: false, curve: 0.5 });
  }
  face(x + w * 0.5, y + h * 0.4, 14, { w: 0.4 });
};

// ---------------------------------------------------------------- faces
const inkT = RR.C.ink;
const cardFrame = (w, h, dark, light) => {
  RR.ink(RR.rrectPts(2, 2, w - 4, h - 4, 16), { fill: dark, stroke: false });
  RR.water(RR.rrectPts(9, 9, w - 18, h - 18, 10), light, { layers: 10, alpha: 55, spread: 0.01, edge: 0.25 });
  RR.speckle(12, 12, w - 24, h - 24, '#b9a37d', 90, 30, 1.6);
};
const effectRow = (effects, cx, y, s) => {
  const n = effects.length, gap = 58;
  effects.forEach(([ic, k], i) => {
    const x = cx + (i - (n - 1) / 2) * gap;
    push(); translate(x - 10, y); RR.ICONS[ic](s * (ic === 'hunterDie' ? 0.8 : 1), {}); pop();
    RR.text('x' + k, x + 16, y + 7, { font: 'title', size: 20, col: RR.C.plumDark });
  });
};

RR.paintPolicy = (c, w, h) => {
  cardFrame(w, h, RR.C.cardDark, RR.C.card);
  // cost tab and owner badge
  RR.ink(RR.rrectPts(w - 48, 4, 42, 44, 6), { fill: RR.C.cardDark, stroke: false });
  RR.text(String(c.cost), w - 27, 40, { font: 'title', size: 34, col: RR.C.card });
  push(); translate(w - 27, 66); RR.ICONS.role(14, { role: c.owner }); pop();
  const tl = RR.textBlock(c.title, 16, 34, w - 72, { font: 'title', size: 19, col: RR.C.plumDark, align: 'left', lh: 0.95 });
  // flavour text: shrink until it fits above the art window
  let fs = 8.5, lines;
  const top = tl > 1 ? 72 : 62;
  do { lines = RR.wrap(c.text.toUpperCase(), w - 64, { font: 'hand', size: fs }); fs -= 0.4; } while (top + (lines.length - 1) * (fs + 0.4) * 1.1 > 98 && fs > 6);
  lines.forEach((l, i) => RR.text(l, 16, top + i * (fs + 0.4) * 1.1, { font: 'hand', size: fs + 0.4, col: RR.C.inkSoft, align: 'left' }));
  RR.CARD_ART[c.art](16, 104, w - 32, 96);
  RR.inkRect(16, 104, w - 32, 96, 8, { stroke: RR.C.plumDark, w: 0.8 });
  effectRow(c.effects, w / 2 - 8, 225, 13);
  push(); translate(w - 26, h - 26); RR.ICONS.scoreStar(18, { role: c.score }); pop();
  if (c.special === 'corp') { push(); translate(26, h - 26); RR.ICONS.briefcase(14, {}); pop(); }
};

RR.paintAction = (c, w, h) => {
  RR.ink(RR.rrectPts(2, 2, w - 4, h - 4, 16), { fill: RR.C.card, w: 0.6 });
  RR.water(RR.rrectPts(6, 6, w - 12, h - 12, 12), RR.C.card, { layers: 8, alpha: 50, spread: 0.01, edge: 0.2 });
  RR.speckle(10, 10, w - 20, h - 20, '#b9a37d', 80, 30, 1.6);
  RR.ink(RR.rrectPts(12, 12, w - 24, h - 24, 10), { stroke: RR.C.mauve, w: 0.7, curve: 0.2 });
  push(); translate(w - 32, 32); RR.ICONS.fist(17, {}); pop();
  push(); translate(w - 32, 70); RR.ICONS.role(14, { role: c.owner }); pop();
  RR.textBlock(c.title, 20, 38, w - 70, { font: 'title', size: 17, col: RR.C.plumDark, align: 'left', lh: 0.95 });
  RR.textBlock(c.text.toUpperCase(), 20, 76, w - 64, { font: 'hand', size: 8, col: RR.C.inkSoft, align: 'left', lh: 1.1 });
  RR.CARD_ART[c.art](w / 2 - 50, 104, 100, 90);
  RR.text(c.phase, 20, 212, { font: 'hand', size: 9.5, col: RR.C.plumDark, align: 'left' });
  RR.textBlock(c.effect.toUpperCase(), 20, 224, w - 40, { font: 'hand', size: 8, col: RR.C.ink, align: 'left', lh: 1.05 });
};

RR.paintEvent = (c, w, h) => {
  RR.ink(RR.rrectPts(2, 2, w - 4, h - 4, 14), { fill: RR.C.eventPink, w: 0.7 });
  RR.speckle(8, 8, w - 16, h - 16, '#c9a0a0', 70, 30, 1.5);
  RR.CARD_ART[c.art](w - 118, 12, 106, 96);
  RR.inkRect(w - 118, 12, 106, 96, 8, { stroke: RR.C.plumDark, w: 0.7 });
  RR.textBlock(c.title, 16, 40, w - 146, { font: 'title', size: 22, col: RR.C.plumDark, align: 'left', lh: 0.95 });
  RR.textBlock(c.text, 16, 88, w - 146, { font: 'hand', size: 10, col: RR.C.inkSoft, align: 'left', lh: 1.1 });
  if (c.tag) {
    RR.ink(RR.rrectPts(12, h - 44, 64, 16, 3), { fill: '#c9b3cf', stroke: false });
    RR.text(c.tag, 16, h - 32, { font: 'hand', size: 10, col: RR.C.plumDark, align: 'left' });
    RR.textBlock(c.effect, 82, h - 32, w - 100, { font: 'hand', size: 10, col: RR.C.ink, align: 'left', lh: 1.1 });
  }
};

RR.paintSpread = (c, w, h) => {
  const col = RR.C[c.col];
  RR.ink(RR.rrectPts(2, 2, w - 4, h - 4, 16), { fill: col, stroke: false });
  RR.water(RR.rrectPts(8, 8, w - 16, h - 16, 12), RR.shade(col, 1.12), { layers: 10, alpha: 40, spread: 0.02, edge: 0.3 });
  RR.text('+' + c.n, w / 2, 62, { font: 'title', size: 54, col: RR.C.white });
  RR.text('RACCOONS', w / 2, 96, { font: 'title', size: 30, col: RR.C.white });
  RR.textBlock(c.sub, w / 2, 120, w - 40, { font: 'hand', size: 11, col: RR.C.white, lh: 1.05 });
  if (c.n === 0) { // sleepy raccoon on a stump
    RR.ink(RR.rrectPts(w / 2 - 50, 205, 100, 50, 10), { fill: '#b58b64', w: 0.7 });
    RR.inkEllipse(w / 2, 205, 50, 10, { fill: '#d8b38a', w: 0.6 });
    push(); translate(w / 2, 188); RR.ICONS.raccoonFace(28, { noEyes: true }); pop();
    RR.inkLine([[w / 2 - 16, 188], [w / 2 - 6, 190]], { w: 0.8 }); RR.inkLine([[w / 2 + 6, 190], [w / 2 + 16, 188]], { w: 0.8 });
  } else {
    for (let i = 0; i < c.n; i++) { push(); translate(w / 2 + (i - (c.n - 1) / 2) * 62, 205); RR.ICONS.raccoonFace(28, {}); pop(); }
  }
};

RR.paintSpreadBack = (w, h) => {
  RR.ink(RR.rrectPts(2, 2, w - 4, h - 4, 16), { fill: RR.C.lilac, stroke: false });
  RR.ink(RR.rrectPts(8, 8, w - 16, h - 16, 12), { stroke: RR.C.plumMid, w: 0.8 });
  // body in a suit
  RR.ink([[w * 0.2, h * 0.95], [w * 0.25, h * 0.6], [w * 0.5, h * 0.52], [w * 0.75, h * 0.6], [w * 0.8, h * 0.95]], { fill: RR.C.plumDark, w: 0.8, curve: 0.4 });
  RR.ink([[w * 0.44, h * 0.55], [w * 0.56, h * 0.55], [w * 0.5, h * 0.8]], { fill: '#f4efe4', stroke: false, curve: 0.2 });
  RR.ink([[w * 0.48, h * 0.57], [w * 0.52, h * 0.57], [w * 0.54, h * 0.74], [w * 0.5, h * 0.78], [w * 0.46, h * 0.74]], { fill: RR.C.red, stroke: false, curve: 0.2 });
  push(); translate(w / 2, h * 0.36); RR.ICONS.raccoonFace(52, {}); pop();
  RR.ink(RR.rrectPts(w / 2 - 40, h * 0.33, 36, 16, 5), { fill: RR.C.ink, stroke: false });
  RR.ink(RR.rrectPts(w / 2 + 4, h * 0.33, 36, 16, 5), { fill: RR.C.ink, stroke: false });
  // sign
  push(); translate(w / 2, h * 0.8); rotate(-0.12);
  RR.ink(RR.rrectPts(-58, -20, 116, 40, 4), { fill: '#f4efe4', w: 0.8, curve: 0.1 });
  RR.text('SPREAD', 0, 12, { font: 'title', size: 30, col: RR.C.red });
  pop();
};

RR.paintPolicyBack = (w, h) => {
  RR.ink(RR.rrectPts(2, 2, w - 4, h - 4, 16), { fill: RR.C.mauve, stroke: false });
  RR.water(RR.rrectPts(8, 8, w - 16, h - 16, 12), RR.C.lilac, { layers: 10, alpha: 45, spread: 0.015, edge: 0.3 });
  RR.text('RACCOON', w / 2, 52, { font: 'title', size: 34, col: RR.C.plumDark });
  RR.text('RAMPAGE', w / 2, 84, { font: 'title', size: 34, col: RR.C.plumDark });
  // raccoon waving, peeking from the bottom
  RR.ink([[w * 0.18, h - 10], [w * 0.22, h * 0.62], [w * 0.5, h * 0.55], [w * 0.78, h * 0.62], [w * 0.82, h - 10]], { fill: RR.C.fur, w: 0.8, curve: 0.5 });
  RR.ink([[w * 0.36, h - 10], [w * 0.4, h * 0.72], [w * 0.6, h * 0.72], [w * 0.64, h - 10]], { fill: RR.C.muzzle, stroke: false, curve: 0.5 });
  push(); translate(w / 2, h * 0.5); RR.ICONS.raccoonFace(46, {}); pop();
  for (let i = 0; i < 4; i++) RR.inkEllipse(w * 0.84 - i * 4, h * 0.6 - i * 20, 14, 10, { fill: i % 2 ? RR.C.tailDark : RR.C.tailLight, w: 0.5 });
};

RR.paintEventBack = (w, h) => {
  RR.ink(RR.rrectPts(2, 2, w - 4, h - 4, 14), { fill: RR.C.plum, stroke: false });
  RR.water(RR.rrectPts(8, 8, w - 16, h - 16, 10), RR.C.plumMid, { layers: 10, alpha: 45, spread: 0.015, edge: 0.3 });
  push(); translate(w / 2, h / 2 - 8); RR.ICONS.raccoonFace(34, {}); pop();
  RR.text('STORYLINE', w / 2, h - 26, { font: 'title', size: 22, col: RR.C.lilac });
};

RR.paintRules = (w, h) => {
  RR.ink(RR.rrectPts(2, 2, w - 4, h - 4, 12), { fill: RR.C.lilac, stroke: false });
  RR.water(RR.rrectPts(6, 6, w - 12, h - 12, 10), '#c8b6c6', { layers: 8, alpha: 45, spread: 0.015 });
  RR.text('SPREAD RULES', w / 2, 36, { font: 'title', size: 24, col: RR.C.white });
  RR.text('LEVEL 1', w / 2, 64, { font: 'title', size: 22, col: RR.C.white });
  RR.textBlock('Based on the colour you have reached, draw:', w / 2, 86, w - 30, { font: 'hand', size: 10, col: RR.C.white, lh: 1.05 });
  [['1', 'spread card', 'green'], ['2', 'spread cards', 'orange'], ['3', 'spread cards', 'red']].forEach(([n, lbl, c], i) => {
    const y = 134 + i * 34;
    RR.text(n, 26, y + 8, { font: 'title', size: 26, col: RR.C.white });
    RR.text(lbl, 44, y + 4, { font: 'hand', size: 12, col: RR.C.white, align: 'left' });
    RR.ink(RR.rrectPts(w - 44, y - 10, 24, 20, 3), { fill: RR.C[c], w: 0.6 });
  });
};

// ---------------------------------------------------------------- sprites and drawing
RR.cardSize = (id) => {
  const k = id === 'back:event' ? 'event' : (RR.CARDS[id] || {}).kind;
  if (k === 'event') return [RR.EVENT_W, RR.EVENT_H];
  if (k === 'rules' || id === 'back:rules') return [170, 240];
  return [RR.CARD_W, RR.CARD_H];
};
RR.cardSprite = (id, lod = 'hi') => {
  const [w, h] = RR.cardSize(id);
  const res = lod === 'hi' ? 2.6 : 1.1;
  return RR.sprite(`card:${id}:${lod}`, w, h, () => {
    if (id === 'back:policy') return RR.paintPolicyBack(w, h);
    if (id === 'back:spread') return RR.paintSpreadBack(w, h);
    if (id === 'back:event') return RR.paintEventBack(w, h);
    const c = RR.CARDS[id];
    if (c.kind === 'policy') RR.paintPolicy(c, w, h);
    else if (c.kind === 'action') RR.paintAction(c, w, h);
    else if (c.kind === 'event') RR.paintEvent(c, w, h);
    else if (c.kind === 'spread') RR.paintSpread(c, w, h);
    else if (c.kind === 'rules') RR.paintRules(w, h);
  }, { res });
};
RR.backOf = (id) => {
  const k = (RR.CARDS[id] || {}).kind;
  return k === 'spread' ? 'back:spread' : k === 'event' ? 'back:event' : 'back:policy';
};
RR.drawCard = (id, x, y, o = {}) => {
  const [bw, bh] = RR.cardSize(id);
  const w = o.w ?? bw, h = (w * bh) / bw;
  const flip = o.flip ?? 1;
  const showFace = flip >= 0.5;
  const sx = Math.max(0.02, Math.abs(Math.cos(Math.PI * flip)));
  const sy = 1 + 0.06 * Math.sin(Math.PI * RR.clamp(flip));
  const onScreen = w * (RR.curCam ? RR.curCam.z : 1) * (o.screenScale ?? 1);
  const lod = o.lod || (onScreen > 230 ? 'hi' : 'lo');
  const sid = showFace ? id : o.back || RR.backOf(id);
  const lift = o.lift ?? 0;
  const a = o.alpha ?? 1;
  push();
  translate(x, y);
  if (o.rot) rotate(o.rot);
  // shadow
  RR.flush();
  noStroke();
  fill(46, 39, 51, 42 * a);
  const so = 4 + lift * 22;
  push(); translate(so * 0.6, so); scale(sx * (1 + lift * 0.04), sy);
  beginShape(); for (const p of RR.rrectPts(-w / 2, -h / 2, w, h, w * 0.08, 3)) vertex(p[0], p[1]); endShape(CLOSE);
  pop();
  if (o.glow) {
    RR.flush();
    const g = color(o.glow);
    for (let i = 3; i >= 1; i--) {
      g.setAlpha(55 * a / i); fill(g);
      const e = i * 7;
      push(); scale(sx, sy); beginShape(); for (const p of RR.rrectPts(-w / 2 - e, -h / 2 - e, w + 2 * e, h + 2 * e, w * 0.1 + e, 3)) vertex(p[0], p[1]); endShape(CLOSE); pop();
    }
  }
  const lifted = 1 + lift * 0.06;
  RR.drawSprite(RR.cardSprite(sid, lod), 0, 0, { w: w * lifted, h: h * lifted, sx, sy, alpha: a });
  if (o.dim) { RR.flush(); fill(46, 39, 51, 110 * o.dim * a); push(); scale(sx, sy); beginShape(); for (const p of RR.rrectPts(-w / 2, -h / 2, w, h, w * 0.08, 3)) vertex(p[0], p[1]); endShape(CLOSE); pop(); }
  pop();
};
