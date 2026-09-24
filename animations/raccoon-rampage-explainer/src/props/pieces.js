// Game pieces: vote cubes, raccoon tokens, dice and the impact-tracker marker.
// All are cached sprites, so dozens can be on screen cheaply.

RR.CUBE_COL = { de: 'de', fr: 'fr', ar: 'ar', hu: 'hu', corp: 'corp' };

// Vote cube (isometric), role in de | fr | ar | hu | corp
RR.cubeSprite = (role) => RR.sprite('cube:' + role, 100, 100, () => {
  const base = RR.C[role], s = 36, cx = 50, cy = 54;
  const top = [[cx, cy - s], [cx + s * 0.95, cy - s * 0.5], [cx, cy], [cx - s * 0.95, cy - s * 0.5]];
  const left = [[cx - s * 0.95, cy - s * 0.5], [cx, cy], [cx, cy + s * 1.05], [cx - s * 0.95, cy + s * 0.55]];
  const right = [[cx, cy], [cx + s * 0.95, cy - s * 0.5], [cx + s * 0.95, cy + s * 0.55], [cx, cy + s * 1.05]];
  RR.water(left, base, { layers: 10, alpha: 45, spread: 0.025, edge: 0.3 });
  RR.water(right, RR.shade(base, 0.78), { layers: 10, alpha: 45, spread: 0.025, edge: 0.3 });
  RR.water(top, RR.shade(base, 1.18), { layers: 10, alpha: 45, spread: 0.025, edge: 0.3 });
  RR.ink(top.concat([]), { stroke: RR.C.ink, w: 0.8, curve: 0.08 });
  RR.inkLine([left[0], left[3], left[2], right[2], right[1]], { col: RR.C.ink, w: 0.8, curve: 0.08 });
  RR.inkLine([[cx, cy], [cx, cy + s * 1.05]], { col: RR.C.ink, w: 0.7 });
  RR.inkLine([[cx - s * 0.5, cy - s * 0.62], [cx - s * 0.1, cy - s * 0.8]], { col: '#ffffff', w: 0.8, brush: 'pencil' });
}, { res: 1.6 });
// size = width in current units
RR.drawCube = (x, y, size, role, o = {}) => {
  if (o.shadow !== false) RR.shadow(x + size * 0.05, y + size * 0.42, size * 0.42, size * 0.13, 30 * (o.alpha ?? 1));
  RR.drawSprite(RR.cubeSprite(role), x, y, { w: size * 1.05, h: size * 1.05, ...o });
};

// Raccoon tokens: yellow (Germany), blue (France), black (rest of Europe)
RR.TOKEN_COL = { yellow: 'tokYellow', blue: 'tokBlue', black: 'tokBlack' };
RR.tokenSprite = (kind) => RR.sprite('token:' + kind, 100, 100, () => {
  push(); translate(50, 56);
  const fur = RR.C[RR.TOKEN_COL[kind]];
  RR.ICONS.raccoonFace(40, { fur, mask: kind === 'black' ? '#15121a' : RR.C.mask, pale: RR.C.muzzle, w: 1.1 });
  pop();
}, { res: 1.6 });
RR.drawToken = (x, y, size, kind, o = {}) => {
  if (o.shadow !== false) RR.shadow(x + size * 0.04, y + size * 0.36, size * 0.4, size * 0.12, 32 * (o.alpha ?? 1));
  RR.drawSprite(RR.tokenSprite(kind), x, y, { w: size, h: size, ...o });
};

// Dice: kind 'hunter' (dark, skull / shield faces) or 'd6' (white with pips)
RR.dieSprite = (kind, face) => RR.sprite(`die:${kind}:${face}`, 100, 100, () => {
  push(); translate(50, 50);
  if (kind === 'd6') RR.ICONS.d6(40, { n: face });
  else {
    RR.ink(RR.rrectPts(-40, -40, 80, 80, 14), { fill: RR.C.plumDark, w: 0.9 });
    if (face === 'shield') { push(); scale(0.7); RR.ICONS.shield(40, { col: RR.C.lilac }); pop(); }
    else RR.ICONS.skull(26, { col: RR.C.lilac, bg: RR.C.plumDark });
  }
  pop();
}, { res: 1.6 });
RR.drawDie = (x, y, size, kind, face, o = {}) => {
  if (o.shadow !== false) RR.shadow(x + size * 0.06, y + size * 0.45, size * 0.45, size * 0.13, 35);
  RR.drawSprite(RR.dieSprite(kind, face), x, y, { w: size, h: size, ...o });
};

// Impact tracker marker: a raccoon standee in a ring
RR.markerSprite = () => RR.sprite('tracker-marker', 120, 120, () => {
  RR.inkCircle(60, 60, 50, { fill: RR.C.white, w: 1.2 });
  RR.inkCircle(60, 60, 43, { stroke: RR.C.plumDark, w: 0.7 });
  push(); translate(60, 66); RR.ICONS.raccoonFace(33, { w: 1 }); pop();
}, { res: 1.6 });
RR.drawMarker = (x, y, size, o = {}) => {
  RR.shadow(x + size * 0.05, y + size * 0.45, size * 0.45, size * 0.12, 40);
  RR.drawSprite(RR.markerSprite(), x, y, { w: size, h: size, ...o });
};

// Influence marker ring (player boards)
RR.drawRing = (x, y, r, col = RR.C.ink) => RR.inkCircle(x, y, r, { stroke: col, w: 2 });
