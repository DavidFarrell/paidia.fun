// The four players: rounded "bean" people drawn live so they can act.
//
// RR.drawPerson(role, x, y, s, pose) - role: 'de' | 'fr' | 'ar' | 'hu'.
// (x, y) = ground point between the feet; s = scale (1 = about 250 px tall).
// pose fields (all optional):
//   turn     -1..1 shifts the face to look left/right; lean (radians); squash (-0.3..0.3); hop (px lift)
//   look     [dx, dy] pupils; blink 0..1; eyes 'open' | 'closed' | 'happy' | 'wide'
//   mouth    'smile' | 'grin' | 'open' | 'o' | 'flat' | 'frown' | 'talk' (use talk with `talkT` time)
//   brow     'neutral' | 'up' | 'angry' | 'sly' | 'worried'
//   armL, armR  raise angle: 0 hangs down, PI/2 sideways out, PI straight up; negative swings across the body
//   prop     'clipboard' | 'placard' | 'binoculars' | 'net' | 'card' | 'cube' | 'trophy' | 'dice' | null
//   propHand 'R' (default) | 'L'; propRot extra rotation of the prop; blush 0..1

RR.PEOPLE = {
  de: { jacket: '#e9b52f', jacketDark: '#b98914', trousers: '#5c5a4a', skin: '#f1c7a5', hair: '#8a5a32', hat: 'ranger', prop: 'clipboard' },
  fr: { jacket: '#4f7fbd', jacketDark: '#35598d', trousers: '#3d3a48', skin: '#e9b894', hair: '#3b2b25', hat: 'beret', prop: 'clipboard' },
  ar: { jacket: '#e28aac', jacketDark: '#b35c80', trousers: '#4b4458', skin: '#c98f68', hair: '#2f2320', hat: 'hood', prop: 'placard' },
  hu: { jacket: '#5f9d4d', jacketDark: '#3f6d33', trousers: '#5b4a3a', skin: '#8d5c3f', hair: '#1f1a18', hat: 'feather', prop: 'binoculars' },
};

RR.drawPerson = (role, x, y, s = 1, p = {}) => {
  const D = RR.PEOPLE[role];
  const C = RR.C;
  const sq = p.squash ?? 0;
  push();
  translate(x, y - (p.hop ?? 0));
  if (p.lean) rotate(p.lean);
  scale(s * (1 + sq * 0.5), s * (1 - sq * 0.5));
  const turn = p.turn ?? 0;

  // legs and shoes
  for (const sx of [-1, 1]) {
    const lx = sx * 20 + (p.walk !== undefined ? Math.sin(p.walk + (sx > 0 ? Math.PI : 0)) * 10 : 0);
    const ly = p.walk !== undefined ? -Math.max(0, Math.cos(p.walk + (sx > 0 ? Math.PI : 0))) * 8 : 0;
    RR.ink([[sx * 20 - 12, -58], [lx - 11, ly - 10], [lx + 11, ly - 10], [sx * 20 + 12, -58]], { fill: D.trousers, w: 1, curve: 0.3 });
    RR.ink(RR.ellipsePts(lx + sx * 4, ly - 7, 17, 9, 14), { fill: C.plumDark, w: 0.9 });
  }

  // body (bean) with jacket details
  const body = [[-50, -56], [-56, -100], [-50, -140], [-30, -165], [0, -170], [30, -165], [50, -140], [56, -100], [50, -56], [30, -46], [0, -44], [-30, -46]];
  RR.ink(body, { fill: D.jacket, w: 1.2, curve: 0.5 });
  RR.ink([[-50, -60], [50, -60], [48, -52], [30, -46], [0, -44], [-30, -46], [-48, -52]], { fill: D.jacketDark, stroke: false, curve: 0.4 });
  RR.inkLine([[0, -162], [0, -64]], { col: D.jacketDark, w: 0.9 });
  RR.inkLine([[-14, -166], [0, -140], [14, -166]], { col: D.jacketDark, w: 0.9, curve: 0.2 });
  if (role === 'de' || role === 'fr') { push(); translate(-26, -128); RR.ICONS.flag(7, { country: role }); pop(); }
  if (role === 'ar') { push(); translate(-24, -128); RR.ICONS.heart(9, { col: '#fbe3ea' }); pop(); }
  if (role === 'hu') { RR.inkLine([[-40, -150], [-20, -120], [0, -118], [20, -120], [40, -150]], { col: C.ink, w: 0.7, curve: 0.5 }); }

  // arms (behind hands) - shoulder at (+-46, -140)
  const arm = (side) => {
    let a = side < 0 ? p.armL ?? 0.12 : p.armR ?? 0.12;
    const sx = side * 44, sy = -142;
    let len = 62;
    let dx = side * Math.sin(a), dy = Math.cos(a);
    // Explicit hand target (local coords) overrides the angle: the arm stretches to reach it.
    const tgt = side < 0 ? p.handL : p.handR;
    if (tgt) { const L = Math.hypot(tgt[0] - sx, tgt[1] - sy) || 1; dx = (tgt[0] - sx) / L; dy = (tgt[1] - sy) / L; len = L; }
    const ex = sx + dx * len, ey = sy + dy * len;
    const nx = -dy, ny = dx;
    RR.ink([[sx + nx * 13, sy + ny * 13], [ex + nx * 9, ey + ny * 9], [ex - nx * 9, ey - ny * 9], [sx - nx * 13, sy - ny * 13]], { fill: D.jacket, w: 1, curve: 0.45 });
    return [ex, ey, a];
  };
  if (p.prop === 'binoculars' && !p.handL) { p = { ...p, handL: [-26 + turn * 10, -196], handR: [26 + turn * 10, -196] }; }
  const hL = arm(-1), hR = arm(1);

  // head
  push();
  translate(0, -214);
  rotate(p.headTilt ?? 0);
  const fx = turn * 10;
  if (D.hat === 'hood') RR.ink(RR.ellipsePts(0, 4, 56, 56, 22), { fill: D.jacketDark, w: 1.1, curve: 0.5 });
  if (D.hat !== 'hood') RR.ink(RR.ellipsePts(0, -14, 48, 38, 20), { fill: D.hair, w: 1, curve: 0.5 });
  RR.ink(RR.ellipsePts(0, 0, 44, 46, 22), { fill: D.skin, w: 1.2, curve: 0.5 });
  // ears
  if (D.hat !== 'hood') for (const sx of [-1, 1]) RR.inkEllipse(sx * 44, 4, 7, 10, { fill: D.skin, w: 0.9 });
  // hair fringe / hats
  if (D.hat === 'ranger') {
    RR.ink([[-38, -20], [-20, -34], [10, -36], [36, -22], [30, -14], [0, -20], [-30, -12]], { fill: D.hair, stroke: false, curve: 0.5 });
    RR.ink([[-70, -24], [70, -24], [60, -16], [-60, -16]], { fill: '#a88a5b', w: 1, curve: 0.3 });
    RR.ink([[-36, -24], [-32, -58], [0, -66], [32, -58], [36, -24]], { fill: '#bfa06a', w: 1, curve: 0.35 });
    RR.ink([[-35, -32], [35, -32], [35, -24], [-35, -24]], { fill: C.de, stroke: false, curve: 0.1 });
  } else if (D.hat === 'beret') {
    RR.ink([[-40, -18], [-26, -34], [0, -38], [28, -32], [40, -16], [20, -24], [-10, -22]], { fill: D.hair, stroke: false, curve: 0.5 });
    RR.ink(RR.ellipsePts(8, -34, 46, 18, 18, 0.18), { fill: '#2f3f66', w: 1, curve: 0.5 });
    RR.inkLine([[10, -52], [14, -60]], { col: '#2f3f66', w: 1.6 });
  } else if (D.hat === 'hood') {
    RR.ink([[-40, -16], [-28, -36], [0, -42], [28, -36], [40, -16], [16, -26], [-12, -24]], { fill: D.hair, stroke: false, curve: 0.5 });
    RR.ink([[-50, 30], [-56, 0], [-44, -40], [0, -60], [44, -40], [56, 0], [50, 30], [40, 10], [38, -24], [0, -46], [-38, -24], [-40, 10]], { fill: D.jacket, w: 1.1, curve: 0.45 });
  } else if (D.hat === 'feather') {
    RR.ink([[-40, -14], [-30, -32], [0, -36], [30, -32], [40, -14], [16, -22], [-14, -22]], { fill: D.hair, stroke: false, curve: 0.5 });
    RR.ink([[-58, -26], [58, -26], [50, -18], [-50, -18]], { fill: '#3e5e32', w: 1, curve: 0.3 });
    RR.ink([[-34, -26], [-28, -56], [0, -64], [28, -56], [34, -26]], { fill: '#4f7a3f', w: 1, curve: 0.4 });
    RR.ink([[-33, -34], [33, -34], [33, -27], [-33, -27]], { fill: '#8b5a3a', stroke: false, curve: 0.1 });
    RR.ink([[24, -36], [48, -86], [56, -84], [36, -34]], { fill: '#c95b4a', w: 0.8, curve: 0.5 });
  }
  // face
  const look = p.look || [0, 0];
  const blink = RR.clamp(p.blink ?? 0);
  const eyes = p.eyes || 'open';
  for (const sx of [-1, 1]) {
    const ex = fx + sx * 16, ey = 2;
    if (eyes === 'closed' || blink > 0.85) RR.inkLine([[ex - 7, ey], [ex, ey + 3], [ex + 7, ey]], { w: 1, curve: 0.6 });
    else if (eyes === 'happy') RR.inkLine([[ex - 7, ey + 3], [ex, ey - 4], [ex + 7, ey + 3]], { w: 1.1, curve: 0.6 });
    else {
      const big = eyes === 'wide' ? 1.35 : 1;
      if (eyes === 'wide') RR.flatEllipse(ex, ey, 8, 8, '#ffffff');
      RR.flatEllipse(ex + look[0] * 3, ey + look[1] * 3, 4.6 * big, 5.4 * big * (1 - blink), C.ink);
      RR.flatEllipse(ex + look[0] * 3 + 1.6, ey + look[1] * 3 - 2, 1.4, 1.4, '#ffffff');
    }
  }
  const brow = p.brow || 'neutral';
  const ba = { neutral: 0, up: -0.3, angry: 0.5, sly: 0.35, worried: -0.5 }[brow];
  for (const sx of [-1, 1]) {
    const bx = fx + sx * 16, by = -12 - (brow === 'up' ? 5 : 0);
    const a = brow === 'sly' && sx < 0 ? -0.2 : ba;
    RR.inkLine([[bx - 8, by - a * 6 * -sx], [bx + 8, by + a * 6 * -sx]], { w: 1.1 });
  }
  if ((p.blush ?? 0.5) > 0) {
    RR.flatEllipse(fx - 28, 16, 8, 5, '#e58f95', 90 * (p.blush ?? 0.5));
    RR.flatEllipse(fx + 28, 16, 8, 5, '#e58f95', 90 * (p.blush ?? 0.5));
  }
  let m = p.mouth || 'smile';
  if (m === 'talk') m = Math.sin((p.talkT ?? 0) * 18) > 0 ? 'open' : 'smile';
  const my = 22;
  if (m === 'smile') RR.inkLine([[fx - 10, my], [fx, my + 6], [fx + 10, my]], { w: 1, curve: 0.6 });
  else if (m === 'flat') RR.inkLine([[fx - 8, my + 3], [fx + 8, my + 3]], { w: 1 });
  else if (m === 'frown') RR.inkLine([[fx - 10, my + 6], [fx, my + 1], [fx + 10, my + 6]], { w: 1, curve: 0.6 });
  else if (m === 'o') RR.inkEllipse(fx, my + 3, 5, 6, { fill: '#7a3440', w: 0.8 });
  else {
    const big = m === 'grin' ? 1.2 : 1;
    RR.ink([[fx - 12 * big, my - 2], [fx + 12 * big, my - 2], [fx + 7 * big, my + 10 * big], [fx - 7 * big, my + 10 * big]], { fill: '#7a3440', w: 0.9, curve: 0.5 });
    if (m === 'grin') RR.ink([[fx - 11 * big, my - 1.5], [fx + 11 * big, my - 1.5], [fx + 9, my + 2], [fx - 9, my + 2]], { fill: '#fbf7ef', stroke: false, curve: 0.2 });
  }
  if (p.prop === 'binoculars') {
    for (const sx of [-1, 1]) RR.ink(RR.rrectPts(fx + sx * 16 - 11, -8, 22, 26, 6), { fill: '#3a3530', w: 1 });
    RR.ink(RR.rrectPts(fx - 5, -2, 10, 10, 2), { fill: '#3a3530', stroke: false });
    for (const sx of [-1, 1]) RR.inkEllipse(fx + sx * 16, 18, 8, 3, { fill: '#9fc3d6', stroke: false });
  }
  pop();

  // hands and props
  const hand = ([hx, hy]) => RR.inkCircle(hx, hy, 11, { fill: D.skin, w: 1 });
  const ph = p.propHand === 'L' ? hL : hR;
  const other = p.propHand === 'L' ? hR : hL;
  hand(other);
  const prop = p.prop;
  if (prop && prop !== 'binoculars') {
    push();
    translate(ph[0], ph[1]);
    rotate((p.propRot ?? 0) + (p.propHand === 'L' ? 0.1 : -0.1));
    if (prop === 'clipboard') {
      RR.ink(RR.rrectPts(-26, -58, 52, 70, 4), { fill: '#a97c50', w: 1, curve: 0.1 });
      RR.ink(RR.rrectPts(-21, -50, 42, 58, 2), { fill: '#fbf6ea', stroke: false, curve: 0.05 });
      for (let i = 0; i < 4; i++) RR.inkLine([[-15, -38 + i * 11], [15, -38 + i * 11]], { w: 0.5, brush: 'pencil' });
      RR.ink(RR.rrectPts(-10, -62, 20, 9, 2), { fill: '#9aa0a6', w: 0.8 });
    } else if (prop === 'placard') {
      RR.ink(RR.rrectPts(-4, -120, 8, 130, 2), { fill: '#b58b64', w: 0.9, curve: 0.05 });
      RR.ink(RR.rrectPts(-50, -190, 100, 74, 6), { fill: '#fbf1f4', w: 1.1, curve: 0.1 });
      push(); translate(0, -152); RR.ICONS.paw(24, { col: C.arDark }); pop();
    } else if (prop === 'net') {
      RR.inkLine([[0, 10], [0, -130]], { col: '#8a6a4a', w: 2.2 });
      RR.inkEllipse(0, -160, 34, 30, { stroke: '#8a6a4a', w: 1.3 });
      for (let i = -2; i <= 2; i++) RR.inkLine([[i * 13, -186], [i * 13 * 0.8, -134]], { col: '#8a7f73', w: 0.4, brush: 'pencil' });
    } else if (prop === 'card') {
      RR.drawCard(p.cardId || 'back:policy', 0, -44, { w: 66, flip: p.cardFlip ?? 0, lod: 'lo', rot: 0.1 });
    } else if (prop === 'cube') {
      RR.drawCube(0, -18, 34, p.cubeRole || role, { shadow: false });
    } else if (prop === 'trophy') {
      RR.ink([[-30, -80], [30, -80], [22, -46], [8, -34], [8, -16], [20, -6], [-20, -6], [-8, -16], [-8, -34], [-22, -46]], { fill: C.gold, stroke: C.goldDark, w: 1.1, curve: 0.3 });
      RR.inkLine([[-28, -72], [-42, -68], [-38, -52], [-24, -52]], { col: C.goldDark, w: 1.3, curve: 0.6 });
      RR.inkLine([[28, -72], [42, -68], [38, -52], [24, -52]], { col: C.goldDark, w: 1.3, curve: 0.6 });
    } else if (prop === 'dice') {
      RR.drawDie(0, -20, 40, 'hunter', 'skull', { shadow: false });
    }
    pop();
  }
  hand(ph);
  pop();
};

// Idle helper: breathing, blinking, a little sway. seed varies per character.
RR.personIdle = (t, seed = 0, extra = {}) => ({
  squash: 0.02 * Math.sin(t * 3.1 + seed),
  blink: RR.blinkAt(t, 3.4 + seed * 0.3, seed),
  headTilt: 0.04 * Math.sin(t * 1.1 + seed),
  ...extra,
});
