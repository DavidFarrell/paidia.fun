// The four players. Drawn from the waist up (origin at the waist, centre);
// head centre about 205 px above the origin at scale 1.
//
// o: role ('de' | 'fr' | 'ar' | 'hu'), x, y, s, lean, tilt, look [x, y],
//    expr ('happy' | 'grin' | 'smug' | 'sly' | 'sad' | 'shock' | 'cross' | 'neutral'),
//    talk (0..1 mouth open), blink, armL / armR: [shoulder, elbow] angles
//    (0 = hanging down; positive swings the arm outwards and up),
//    holdL / holdR: prop in that hand, bounce, seed, alpha
const ROLES = {
  de: { name: 'German Environmental Agency', short: 'Germany', col: PAL.yellow, deep: PAL.yellowDeep, skin: PAL.skin1, hair: '#6b4a36', influence: 3 },
  fr: { name: 'French Environmental Agency', short: 'France', col: PAL.blue, deep: PAL.blueDeep, skin: PAL.skin2, hair: '#2f2430', influence: 3 },
  ar: { name: 'Animal Rights Activist', short: 'Animal Rights', col: PAL.pink, deep: PAL.pinkDeep, skin: PAL.skin4, hair: '#241a1f', influence: 1 },
  hu: { name: 'Hunting Lobbyist', short: 'Hunter', col: PAL.green, deep: PAL.greenDeep, skin: '#eab795', hair: '#b8612f', influence: 1 },
};
const ROLE_ORDER = ['de', 'fr', 'ar', 'hu'];

function capsule(ax, ay, bx, by, w0, w1, o) {
  const dx = bx - ax, dy = by - ay, m = Math.hypot(dx, dy) || 1;
  const nx = -dy / m, ny = dx / m;
  const pts = [];
  const a0 = Math.atan2(dy, dx);
  for (let k = 0; k <= 4; k++) {
    const a = a0 + Math.PI / 2 + (k / 4) * Math.PI;
    pts.push([ax + Math.cos(a) * w0, ay + Math.sin(a) * w0]);
  }
  for (let k = 0; k <= 4; k++) {
    const a = a0 - Math.PI / 2 + (k / 4) * Math.PI;
    pts.push([bx + Math.cos(a) * w1, by + Math.sin(a) * w1]);
  }
  return P.shape(pts, { smooth: 0.45, ...o });
}

function person(opts) {
  const o = { x: 0, y: 0, s: 1, lean: 0, tilt: 0, look: [0, 0], expr: 'happy', talk: 0, blink: 0,
    armL: [0.15, 0.2], armR: [0.15, 0.2], seed: 1, bounce: 0, ...opts };
  if (o.alpha !== undefined && o.alpha <= 0) return;
  const R = ROLES[o.role];
  const sd = o.seed * 53 + ROLE_ORDER.indexOf(o.role) * 7;
  const lw = 3.4 / Math.sqrt(Math.max(0.2, o.s));
  C.save();
  if (o.alpha !== undefined) C.globalAlpha *= o.alpha;
  C.translate(o.x, o.y + o.bounce);
  C.scale(o.s, o.s);
  C.rotate(o.lean);

  // hood behind the head (activist)
  if (o.role === 'ar') P.shape([[-62, -118], [-70, -170], [0, -196], [70, -170], [62, -118]], { fill: R.deep, lw, seed: sd + 1, smooth: 0.5, texA: 0.4 });

  // arms behind the torso are drawn later in front; torso first
  const torso = [[-78, 0], [-74, -70], [-62, -112], [-30, -124], [30, -124], [62, -112], [74, -70], [78, 0]];
  P.shape(torso, { fill: R.col, lw, seed: sd + 2, smooth: 0.45, texA: 0.45 });
  personClothes(o, R, sd, lw);

  // neck and head
  C.save();
  C.translate(0, -122);
  C.rotate(o.tilt);
  C.translate(0, 122);
  P.shape([[-16, -118], [16, -118], [14, -140], [-14, -140]], { fill: shade(R.skin, -0.12), ink: false, seed: sd + 3, smooth: 0.2, texA: 0.25, edge: 0 });
  personHead(o, R, sd, lw);
  C.restore();

  // arms (in front)
  for (const side of [-1, 1]) personArm(o, R, side, sd, lw);
  C.restore();
}

function personClothes(o, R, sd, lw) {
  if (o.role === 'de') {
    // blazer lapels, shirt and a little flag pin
    P.shape([[-24, -122], [24, -122], [8, -60], [-8, -60]], { fill: PAL.white, lw: lw * 0.8, seed: sd + 10, texA: 0.2, edge: 0.1 });
    P.shape([[-6, -116], [6, -116], [7, -76], [0, -66], [-7, -76]], { fill: PAL.plumMid, lw: lw * 0.7, seed: sd + 11, texA: 0.3 });
    P.line([[-26, -122], [-12, -86], [-8, -58]], { w: lw * 0.8, seed: sd + 12 });
    P.line([[26, -122], [12, -86], [8, -58]], { w: lw * 0.8, seed: sd + 13 });
    flagIcon('de', 40, -84, 26, lw * 0.6);
  } else if (o.role === 'fr') {
    // scarf and binoculars
    P.shape([[-36, -128], [36, -128], [30, -104], [-30, -104]], { fill: PAL.white, lw: lw * 0.8, seed: sd + 14, smooth: 0.4, texA: 0.25 });
    P.shape([[8, -108], [26, -108], [30, -58], [14, -56]], { fill: PAL.white, lw: lw * 0.8, seed: sd + 15, smooth: 0.3, texA: 0.25 });
    P.line([[-30, -110], [-18, -80], [0, -66]], { w: lw * 0.6, seed: sd + 16 });
    P.line([[30, -110], [22, -80], [0, -66]], { w: lw * 0.6, seed: sd + 17 });
    binoculars(0, -58, 0.8, sd, lw);
    flagIcon('fr', -46, -84, 24, lw * 0.6);
  } else if (o.role === 'ar') {
    // hoodie strings, pocket and a paw pin
    P.line([[-14, -118], [-16, -80]], { w: lw * 0.7, seed: sd + 18 });
    P.line([[14, -118], [16, -80]], { w: lw * 0.7, seed: sd + 19 });
    P.shape([[-44, -34], [44, -34], [36, -4], [-36, -4]], { fill: shade(R.col, -0.08), lw: lw * 0.7, seed: sd + 20, smooth: 0.3, texA: 0.3 });
    pawIcon(44, -86, 13, PAL.white, lw * 0.5);
  } else if (o.role === 'hu') {
    // waxed jacket collar, pockets and a crosshair badge
    P.shape([[-30, -124], [0, -104], [30, -124], [36, -112], [0, -92], [-36, -112]], { fill: R.deep, lw: lw * 0.8, seed: sd + 21, smooth: 0.3, texA: 0.35 });
    P.rrect(-58, -60, 38, 30, 6, { fill: shade(R.col, -0.1), lw: lw * 0.7, seed: sd + 22 });
    P.rrect(20, -60, 38, 30, 6, { fill: shade(R.col, -0.1), lw: lw * 0.7, seed: sd + 23 });
    for (let k = 0; k < 3; k++) P.ellipse(0, -80 + k * 26, 3.5, 3.5, { fill: PAL.plumDark, ink: false, tex: false, edge: 0, seed: sd + 24 + k });
    crosshairIcon(-40, -96, 14, PAL.white, lw * 0.5);
  }
}

function personHead(o, R, sd, lw) {
  const hx = o.look[0] * 4, hy = -205;
  const skin = R.skin;
  // hair behind the head
  if (o.role === 'ar') {
    P.ellipse(0, hy - 58, 62, 50, { fill: R.hair, lw, seed: sd + 30, texA: 0.35 });
    for (let k = 0; k < 7; k++) {
      const a = Math.PI + (k / 6) * Math.PI;
      P.ellipse(Math.cos(a) * 58, hy - 58 + Math.sin(a) * 44, 18, 16, { fill: R.hair, ink: false, seed: sd + 31 + k, texA: 0.3, edge: 0 });
    }
  } else if (o.role === 'fr') {
    P.shape([[-66, hy - 10], [-64, hy - 58], [0, hy - 80], [64, hy - 58], [66, hy - 10], [60, hy + 34], [-60, hy + 34]], { fill: R.hair, lw, seed: sd + 32, smooth: 0.5, texA: 0.35 });
  }
  // ears
  for (const side of [-1, 1]) P.ellipse(side * 58, hy + 6, 12, 16, { fill: skin, lw, seed: sd + 33 + side, texA: 0.25 });
  // face
  P.shape(P.ellipsePts(0, hy, 58, 64, 22), { fill: skin, lw, seed: sd + 35, texA: 0.3, edge: 0.18 });
  // cheeks
  for (const side of [-1, 1]) P.glow(side * 32 + hx * 0.5, hy + 22, 16, '#e0707a', 0.35);
  // hair on top
  if (o.role === 'de') {
    P.shape([[-58, hy - 4], [-56, hy - 48], [-20, hy - 70], [30, hy - 66], [58, hy - 40], [60, hy - 6], [44, hy - 30], [10, hy - 40], [-30, hy - 34]], { fill: R.hair, lw, seed: sd + 36, smooth: 0.45, texA: 0.35 });
  } else if (o.role === 'fr') {
    P.shape([[-60, hy - 2], [-50, hy - 50], [0, hy - 68], [50, hy - 50], [60, hy - 2], [40, hy - 38], [8, hy - 46], [-6, hy - 30], [-34, hy - 40]], { fill: R.hair, lw, seed: sd + 37, smooth: 0.45, texA: 0.35 });
  } else if (o.role === 'ar') {
    P.shape([[-58, hy - 8], [-50, hy - 50], [0, hy - 66], [50, hy - 50], [58, hy - 8], [30, hy - 36], [-30, hy - 36]], { fill: R.hair, lw, seed: sd + 38, smooth: 0.45, texA: 0.35 });
  } else if (o.role === 'hu') {
    // beard, then the hat
    P.shape([[-56, hy + 4], [-50, hy + 44], [-24, hy + 68], [0, hy + 72], [24, hy + 68], [50, hy + 44], [56, hy + 4], [40, hy + 30], [14, hy + 38], [-14, hy + 38], [-40, hy + 30]],
      { fill: R.hair, lw, seed: sd + 39, smooth: 0.45, texA: 0.4 });
  }
  // face features
  const ex = hx, ey = hy + 2;
  for (const side of [-1, 1]) personEye(o, ex + side * 22, ey, side, sd, lw);
  personBrows(o, ex, ey, sd, lw);
  P.line([[ex - 2, ey + 14], [ex + 4, ey + 22], [ex - 3, ey + 25]], { w: lw * 0.7, seed: sd + 40 });
  personMouth(o, ex, ey + 40, sd, lw, R);
  if (o.role === 'de') {
    for (const side of [-1, 1]) P.ellipse(ex + side * 22, ey, 17, 15, { fill: false, ink: PAL.ink, lw: lw * 0.8, seed: sd + 41 + side });
    P.line([[ex - 5, ey - 1], [ex + 5, ey - 1]], { w: lw * 0.7, seed: sd + 43 });
  }
  if (o.role === 'hu') {
    // tweed hat with a feather
    P.shape([[-80, hy - 34], [80, hy - 34], [70, hy - 46], [-70, hy - 46]], { fill: '#7c5a44', lw, seed: sd + 44, smooth: 0.4, texA: 0.4 });
    P.shape([[-50, hy - 44], [-44, hy - 90], [0, hy - 100], [44, hy - 90], [50, hy - 44]], { fill: '#8d6a50', lw, seed: sd + 45, smooth: 0.5, texA: 0.45 });
    P.shape([[-50, hy - 50], [50, hy - 50], [49, hy - 62], [-49, hy - 62]], { fill: PAL.greenDeep, ink: false, seed: sd + 46, smooth: 0.2, texA: 0.3, edge: 0 });
    P.shape([[30, hy - 58], [62, hy - 118], [70, hy - 112], [40, hy - 56]], { fill: '#d4a24a', lw: lw * 0.8, seed: sd + 47, smooth: 0.5, texA: 0.3 });
    P.line([[36, hy - 58], [64, hy - 112]], { w: lw * 0.5, seed: sd + 48 });
  }
}

function personEye(o, x, y, side, sd, lw) {
  const blink = clamp(o.blink);
  const expr = o.expr;
  if (expr === 'grin' || (expr === 'happy' && blink > 0.5)) {
    P.line([[x - 8, y + 3], [x, y - 5], [x + 8, y + 3]], { w: lw * 1.1, seed: sd + 50 + side, col: PAL.black });
    return;
  }
  if (blink > 0.85 || expr === 'sad' && blink > 0.5) {
    P.line([[x - 8, y], [x, y + 3], [x + 8, y]], { w: lw, seed: sd + 52 + side, col: PAL.black });
    return;
  }
  const big = expr === 'shock' ? 1.35 : 1;
  const lx = o.look[0] * 3.5 + (expr === 'sly' ? 3 * (o.look[0] >= 0 ? 1 : -1) : 0), ly = o.look[1] * 3;
  C.save();
  if (expr === 'shock') {
    C.fillStyle = PAL.white;
    C.beginPath(); C.ellipse(x, y, 11, 12, 0, 0, TAU); C.fill();
    C.strokeStyle = PAL.ink; C.lineWidth = lw * 0.6; C.stroke();
  }
  C.fillStyle = PAL.black;
  C.beginPath();
  C.ellipse(x + lx, y + ly, 6 * big, 7.5 * big * (1 - blink), 0, 0, TAU);
  C.fill();
  C.fillStyle = PAL.white;
  C.beginPath();
  C.arc(x + lx + 2, y + ly - 3, 2.2, 0, TAU);
  C.fill();
  C.restore();
  if (expr === 'sly') P.line([[x - 10, y - 5], [x + 10, y - 3]], { w: lw * 0.9, seed: sd + 54 + side, col: PAL.black });
}

function personBrows(o, x, y, sd, lw) {
  const e = o.expr;
  const d = { happy: [0, -2], grin: [0, -4], smug: [-3, 2], sly: [-4, 3], sad: [5, -4], shock: [-4, -10], cross: [-7, 4], neutral: [0, 0] }[e] || [0, 0];
  for (const side of [-1, 1]) {
    const bx = x + side * 22, by = y - 20;
    // d[0] tilts the brow: positive raises the inner end
    P.line([[bx - 11 * side, by + d[1] - d[0] * (side > 0 ? 1 : 1)], [bx + 11 * side, by + d[1] + d[0]]], { w: lw * 1.2, seed: sd + 56 + side, col: PAL.plumDark });
  }
}

function personMouth(o, x, y, sd, lw, R) {
  const e = o.expr;
  const open = clamp(o.talk + (e === 'shock' ? 0.8 : 0) + (e === 'grin' ? 0.5 : 0));
  if (open > 0.15) {
    const h = 6 + open * 16, w = e === 'grin' ? 24 : 14 + open * 4;
    P.shape([[x - w, y - 4], [x + w, y - 4], [x + w * 0.6, y + h], [x - w * 0.6, y + h]], { fill: '#6b2d3a', lw: lw * 0.8, seed: sd + 60, smooth: 0.7, texA: 0.1, edge: 0 });
    if (e === 'grin') { C.fillStyle = PAL.white; C.fillRect(x - w * 0.7, y - 4, w * 1.4, 5); }
    return;
  }
  if (e === 'sad') P.line([[x - 12, y + 6], [x, y], [x + 12, y + 6]], { w: lw, seed: sd + 61, col: PAL.plumDark });
  else if (e === 'cross') P.line([[x - 12, y + 3], [x + 12, y + 1]], { w: lw, seed: sd + 62, col: PAL.plumDark });
  else if (e === 'smug' || e === 'sly') P.line([[x - 12, y + 2], [x + 2, y + 5], [x + 14, y - 4]], { w: lw, seed: sd + 63, col: PAL.plumDark });
  else if (e === 'neutral') P.line([[x - 10, y + 2], [x + 10, y + 2]], { w: lw, seed: sd + 64, col: PAL.plumDark });
  else P.line([[x - 15, y - 2], [x, y + 8], [x + 15, y - 2]], { w: lw, seed: sd + 65, col: PAL.plumDark });
}

function personArm(o, R, side, sd, lw) {
  const [sh, el] = side < 0 ? o.armL : o.armR;
  const x0 = side * 64, y0 = -104;
  // shoulder angle: 0 = straight down; rotate outwards with side
  const a1 = Math.PI / 2 - side * sh;
  const x1 = x0 + Math.cos(a1) * 62, y1 = y0 + Math.sin(a1) * 62;
  const a2 = a1 - side * el;
  const x2 = x1 + Math.cos(a2) * 56, y2 = y1 + Math.sin(a2) * 56;
  capsule(x0, y0, x1, y1, 17, 15, { fill: R.col, lw, seed: sd + 70 + side, texA: 0.4 });
  capsule(x1, y1, x2, y2, 15, 13, { fill: R.col, lw, seed: sd + 72 + side, texA: 0.4 });
  // hand
  const hold = side < 0 ? o.holdL : o.holdR;
  C.save();
  C.translate(x2 + Math.cos(a2) * 12, y2 + Math.sin(a2) * 12);
  C.rotate(a2 - Math.PI / 2);
  if (hold) personProp(hold, side, sd, lw, R);
  P.shape([[-13, -8], [13, -8], [15, 10], [4, 20], [-10, 16], [-15, 4]], { fill: R.skin, lw, seed: sd + 74 + side, smooth: 0.55, texA: 0.25 });
  P.shape([[side * 10, -4], [side * 22, 2], [side * 18, 10], [side * 8, 6]], { fill: R.skin, lw: lw * 0.8, seed: sd + 76 + side, smooth: 0.5, texA: 0.2 });
  C.restore();
}

function personProp(kind, side, sd, lw, R) {
  C.save();
  if (kind === 'clipboard') {
    C.rotate(Math.PI / 2 + side * 0.2);
    P.rrect(-40, -54, 80, 104, 6, { fill: '#b98a5e', lw, seed: sd + 80 });
    P.rrect(-32, -42, 64, 86, 3, { fill: PAL.white, lw: lw * 0.6, seed: sd + 81, texA: 0.15 });
    for (let k = 0; k < 4; k++) P.line([[-24, -26 + k * 16], [18 - (k % 2) * 12, -26 + k * 16]], { w: lw * 0.5, seed: sd + 82 + k, col: PAL.mauve });
    P.rrect(-14, -58, 28, 12, 3, { fill: PAL.grey, lw: lw * 0.6, seed: sd + 86 });
  } else if (kind === 'placard') {
    C.rotate(Math.PI / 2 + side * 0.1);
    P.shape([[-4, 20], [4, 20], [4, -150], [-4, -150]], { fill: '#b98a5e', lw: lw * 0.8, seed: sd + 87, smooth: 0 });
    P.rrect(-66, -230, 132, 96, 8, { fill: PAL.white, lw, seed: sd + 88, texA: 0.25 });
    heartIcon(-24, -182, 22, PAL.pink, lw * 0.7);
    pawIcon(26, -182, 22, PAL.plum, lw * 0.6);
  } else if (kind === 'cube') {
    cube(0, 18, 34, R.col, sd + 89);
  } else if (kind === 'card') {
    C.rotate(Math.PI / 2 + side * 0.15);
    card({ x: 0, y: -20, w: 70, h: 98, type: 'back', seed: sd + 90 });
  } else if (kind === 'die') {
    huntDie(0, 16, 40, 1, 0, sd + 91);
  }
  C.restore();
}

function binoculars(x, y, s, sd, lw) {
  C.save();
  C.translate(x, y);
  C.scale(s, s);
  for (const side of [-1, 1]) {
    P.rrect(side * 20 - 13, -20, 26, 40, 9, { fill: PAL.plumDark, lw, seed: sd + 92 + side });
    P.ellipse(side * 20, 22, 11, 5, { fill: '#7a8fb8', lw: lw * 0.7, seed: sd + 94 + side, texA: 0.2 });
  }
  P.rrect(-8, -10, 16, 16, 4, { fill: PAL.plumMid, lw: lw * 0.8, seed: sd + 96 });
  C.restore();
}
