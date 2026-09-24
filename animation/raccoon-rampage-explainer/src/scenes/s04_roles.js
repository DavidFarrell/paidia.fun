// Scene 4: the four roles, one slide each: who they are, how many votes
// they get each turn, and what earns them points.

// map inset: panel (x, y, w, h) showing map point (cx, cy) at zoom z;
// fn draws extra things in map coordinates
function mapPanel(x, y, w, h, cx, cy, z, fn) {
  P.shadow(x + w / 2, y + h + 12, w * 0.5, 24, 0.3);
  C.save();
  const clip = P.rrect(x, y, w, h, 28, { fill: PAL.sea, ink: false, seed: 1300, tex: false, edge: 0 });
  C.clip(clip);
  C.translate(x + w / 2, y + h / 2);
  C.scale(z, z);
  C.translate(-cx, -cy);
  if (P.img.map) C.drawImage(P.img.map, 0, 0, 1800, 1200);
  fn && fn(z);
  C.restore();
  P.rrect(x, y, w, h, 28, { fill: false, lw: 4, seed: 1301 });
}

function tintCountryMap(iso, col, a) {
  const c = MAPDATA.countries.find((k) => k.iso === iso);
  C.save();
  C.globalAlpha *= a;
  for (const ring of c.rings) if (ring.length > 20) P.shape(ring, { fill: col, tex: 'mottle', texA: 0.45, texS: 1.4, ink: PAL.ink, lw: 3, seed: 1310, smooth: 0, wob: 0, edge: 0.35, edgeW: 14 });
  C.restore();
}

function roleTitle(role, f, a) {
  const R = ROLES[role];
  const t = ez(f, a, a + 14, E.outBack);
  if (t <= 0) return;
  C.save();
  C.translate(1310, 92);
  C.scale(t, t);
  const w = T.width(R.name.toUpperCase(), 60, true, 3) + 110;
  bannerShape(-w / 2, 0, w, 100, 1320 + ROLE_ORDER.indexOf(role), shade(R.col, -0.05));
  T.draw(R.name.toUpperCase(), 10, 4, { size: 60, col: PAL.plumDark, spacing: 3 });
  C.restore();
}

function votesRow(role, f, a, x, y) {
  const R = ROLES[role];
  const n = R.influence;
  const t = ez(f, a, a + 10, E.outBack);
  if (t <= 0) return;
  C.save();
  C.translate(x, y);
  C.globalAlpha *= clamp(t * 2);
  for (let k = 0; k < n; k++) {
    const d = seg(f, a + 6 + k * 6, a + 20 + k * 6);
    if (d > 0) cube(k * 62, -(1 - E.outBounce(d)) * 200, 54, R.col, 1330 + k);
    cue('clack', a + 14 + k * 6, 0.6);
  }
  T.draw(n === 1 ? '= 1 VOTE A TURN' : `= ${n} VOTES A TURN`, n * 62 + 10, 4, { size: 50, col: PAL.plumDark, align: 'left', spacing: 2 });
  C.restore();
}

// slides: [role, draw(lf)]
const ROLE_SLIDES = {
  de(lf) {
    const blink = lf % 70 < 4 ? 1 : 0;
    const tick = seg(lf, 60, 75) * (1 - seg(lf, 76, 90));
    const thumbs = seg(lf, 140, 150);
    person({ role: 'de', x: 420, y: 1130, s: 1.75, expr: thumbs > 0 ? 'grin' : 'happy', blink, holdR: 'clipboard', armR: [0.35, 1.5],
      armL: [0.2 + tick * 0.6 + thumbs * 1.6, 0.5 + tick * 1.2 + thumbs * 0.9], look: [0.6, 0], seed: 4 });
    // Germany crowded with raccoons; a fenced nest; two raccoons mitigated
    mapPanel(860, 250, 900, 480, 780, 470, 1.35, (z) => {
      tintCountryMap('DEU', PAL.yellow, 0.6);
      const nest = [840, 560];
      const fence = ez(lf, 70, 90, E.outBack);
      P.ellipse(nest[0], nest[1] + 8, 26, 11, { fill: '#9b7650', lw: 2, seed: 1340 });
      for (let i = 0; i < 3; i++) P.ellipse(nest[0] - 10 + i * 10, nest[1], 6, 7, { fill: '#e8eef0', lw: 1.5, seed: 1341 + i, texA: 0.2 });
      if (fence > 0) {
        C.save();
        C.translate(nest[0], nest[1] + 18);
        C.scale(1, fence);
        for (let i = -3; i <= 3; i++) P.line([[i * 13, 0], [i * 13, -40]], { w: 3, col: PAL.plumMid, seed: 1350 + i, taper: false });
        P.line([[-42, -12], [42, -12]], { w: 2.4, col: PAL.plumMid, seed: 1360, taper: false });
        P.line([[-42, -30], [42, -30]], { w: 2.4, col: PAL.plumMid, seed: 1361, taper: false });
        C.restore();
        cue('build', 72, 0.7);
      }
      const slots = MAPDATA.slots.DEU;
      slots.slice(0, 12).forEach(([sx, sy], i) => {
        let x = sx, y = sy;
        // one raccoon bumps into the fence
        if (i === 3) {
          const b = seg(lf, 92, 118);
          const d = Math.sin(b * Math.PI);
          x = lerp(sx, nest[0] - 44, d * 0.9); y = lerp(sy, nest[1] - 6, d * 0.9);
          if (b > 0.4 && b < 0.6) popText(nest[0] - 50, nest[1] - 50, 'BONK', lf, 100, { size: 30, dur: 20 });
          cue('bonk', 103, 0.6);
        }
        const gone = (i === 0 && lf > 128) || (i === 1 && lf > 140);
        if (gone) {
          const k = seg(lf, i === 0 ? 128 : 140, (i === 0 ? 128 : 140) + 24);
          if (k < 1) {
            const [ax, ay] = arcPos(E.io(k), sx, sy, sx + 200, sy + 420, 180);
            token(ax, ay, 34 / z * 1.5, 'de', i, { shadow: false, rot: k * 5 });
          }
          return;
        }
        token(x, y, 34 / z * 1.5, 'de', i, { shadow: false });
      });
      cue('pop', 128, 0.6);
      cue('pop', 140, 0.6);
    });
    playerBoard('de', 1310, 900, 0.8, { score: (lf > 152 ? 1 : 0) + (lf > 164 ? 1 : 0), scoreT: lf > 164 ? seg(lf, 164, 176) : seg(lf, 152, 164), pieces: ['token', 'token'], tokenKind: 'de' });
    cue('score', 153, 0.7);
    cue('score', 165, 0.7);
  },
  fr(lf) {
    const look = seg(lf, 60, 72) * (1 - seg(lf, 130, 140));
    person({ role: 'fr', x: 420, y: 1130, s: 1.75, expr: look > 0.5 ? 'sly' : 'happy', look: [look, 0],
      armL: [0.2 + look * 1.2, 0.3 + look * 2.2], armR: [0.2 + look * 1.2, 0.3 + look * 2.2], blink: lf % 80 < 4 ? 1 : 0, seed: 4 });
    mapPanel(860, 250, 900, 480, 560, 620, 1.3, (z) => {
      tintCountryMap('FRA', PAL.blue, 0.6);
      // a lookout circle sweeps across France
      if (look > 0) {
        const lx = lerp(430, 700, (Math.sin(lf * 0.06) + 1) / 2), ly = 560;
        C.save();
        C.globalAlpha *= 0.35 * look;
        C.fillStyle = PAL.cardCream;
        C.beginPath(); C.arc(lx, ly, 90, 0, TAU); C.fill();
        C.restore();
      }
      MAPDATA.slots.FRA.slice(0, 4).forEach(([sx, sy], i) => {
        const a = 96 + i * 12;
        if (lf > a) {
          const k = seg(lf, a, a + 24);
          if (k < 1) {
            const [ax, ay] = arcPos(E.io(k), sx, sy, sx + 300, sy + 450, 200);
            token(ax, ay, 34 / z * 1.5, 'fr', i, { shadow: false, rot: k * 5 });
          }
          cue('pop', a, 0.5);
          return;
        }
        token(sx, sy, 34 / z * 1.5, 'fr', i, { shadow: false });
      });
    });
    playerBoard('fr', 1310, 900, 0.8, { score: Math.min(4, Math.max(0, Math.floor((lf - 110) / 12) + 1)), scoreT: ((lf - 110) % 12) / 12, pieces: ['token', 'token', 'token', 'token'], tokenKind: 'fr' });
    for (let i = 0; i < 4; i++) cue('score', 111 + i * 12, 0.6);
  },
  ar(lf) {
    const cheer = seg(lf, 120, 132);
    person({ role: 'ar', x: 420, y: 1130, s: 1.75, expr: cheer > 0 ? 'grin' : 'happy', holdR: 'placard', armR: [2.5 + Math.sin(lf * 0.2) * 0.1, -0.4],
      armL: [0.2 + cheer * 2.4, 0.3], blink: lf % 90 < 4 ? 1 : 0, seed: 4 });
    // paw policies: one passes and scores a pink cube
    P.rrect(860, 250, 900, 480, 28, { fill: '#eadbe8', lw: 4, seed: 1370, tex: 'mottle', texA: 0.4 });
    const cards = [
      { title: 'No More Pets', cost: 5, owner: 'ar', art: 'pets', effect: { icon: 'shield', n: 2 }, score: 'paw' },
      { title: 'Raccoon Helpline', cost: 3, owner: 'ar', art: 'helpline', effect: { icon: 'mitigate', n: 1 }, score: 'paw' },
      { title: 'Protect Breeding Sites', cost: 5, owner: 'de', art: 'nest', effect: { icon: 'mitigate', n: 2 }, score: 'paw' },
    ];
    cards.forEach((c, i) => {
      const t = ez(lf, 30 + i * 8, 46 + i * 8, E.outBack);
      const x = 1070 + i * 240, y = 488 - (i === 1 ? 16 : 0);
      card({ ...c, type: 'policy', x, y: y + (1 - t) * 400, w: 196, h: 274, rot: (i - 1) * 0.08, seed: 20 + i,
        glow: lf > 70 && lf < 150 ? PAL.pink : null, stamp: i === 1 && lf > 100 ? 'pass' : null, stampT: seg(lf, 100, 112) });
      cue('card', 36 + i * 8, 0.5);
    });
    cue('stamp', 101, 0.9);
    // point at the paw stars
    if (lf > 60 && lf < 100) for (let i = 0; i < 3; i++) sparkle(1070 + i * 240 + 74, 596, lf, 64 + i * 8, 30);
    playerBoard('ar', 1310, 900, 0.8, { score: lf > 118 ? 1 : 0, scoreT: seg(lf, 118, 130) });
    cue('score', 119, 0.7);
  },
  hu(lf) {
    const roll = seg(lf, 60, 100);
    person({ role: 'hu', x: 420, y: 1130, s: 1.75, expr: lf > 104 ? 'grin' : 'smug', holdL: lf < 64 ? 'die' : null,
      armL: [0.3 + (lf < 64 ? seg(lf, 40, 60) * 1.8 : 0), 0.6], armR: [0.25, 0.4 + seg(lf, 110, 120) * 1.6], blink: lf % 75 < 4 ? 1 : 0, seed: 4 });
    mapPanel(860, 250, 900, 480, 900, 560, 1.1, (z) => {
      tintCountryMap('DEU', PAL.yellow, 0.35);
      const slots = MAPDATA.slots.DEU;
      slots.slice(0, 8).forEach(([sx, sy], i) => {
        if (i === 2 && lf > 104) {
          const k = seg(lf, 104, 130);
          if (k < 1) {
            const [ax, ay] = arcPos(E.io(k), sx, sy, sx + 350, sy + 520, 220);
            token(ax, ay, 36 / z * 1.4, 'de', i, { shadow: false, rot: k * 5 });
          }
          return;
        }
        token(sx, sy, 36 / z * 1.4, 'de', i, { shadow: false });
      });
    });
    card({ x: 1610, y: 470, w: 180, h: 252, rot: 0.06, type: 'policy', title: 'Raccoon Burgers', cost: 3, art: 'burger', effect: { icon: 'die', n: 2 }, score: 'hunt', seed: 30 });
    // the hunting die tumbles onto the table
    if (lf >= 64) {
      const [dx, dy] = arcPos(E.outQ(roll), 640, 700, 1180, 560, 260);
      const face = roll < 1 ? Math.floor(lf / 3) % 2 : 0;
      huntDie(dx, dy, 110, face, (1 - roll) * 9, 1380);
      cue('dice', 66, 0.9);
      if (roll >= 1) sparkle(1180, 560, lf, 101, 70);
    }
    playerBoard('hu', 1310, 900, 0.8, { score: lf > 130 ? 1 : 0, scoreT: seg(lf, 130, 142), pieces: ['token'], tokenKind: 'de' });
    cue('score', 131, 0.7);
  },
};

const ROLE_CAPTIONS = {
  de: 'LIMIT THE IMPACT IN GERMANY',
  fr: 'CONTAIN THE RACCOONS IN FRANCE',
  ar: 'PASS HUMANE POLICIES',
  hu: 'PASS HUNTING POLICIES',
};

scene({
  id: 'roles', bars: 12, mood: 'bouncy', trans: { type: 'brush', len: 36, stroke: 'stroke_c' },
  draw(f) {
    const SL = 180;
    const drawSlide = (k, lf) => {
      const role = ROLE_ORDER[k];
      const saved = SCENE_START;
      SCENE_START = saved + k * SL; // cues inside a slide use slide-local frames
      lavenderBG(f);
      P.glow(420, 700, 700, ROLES[role].col, 0.45);
      ROLE_SLIDES[role](lf);
      roleTitle(role, lf, 8);
      votesRow(role, lf, 40, 110, 200);
      const gt = ez(lf, 22, 36, E.outBack);
      if (gt > 0) {
        C.save();
        C.translate(1310, 190);
        C.scale(gt, gt);
        T.draw(ROLE_CAPTIONS[role], 0, 0, { size: 54, col: PAL.plumDark, spacing: 2 });
        C.restore();
      }
      SCENE_START = saved;
    };
    const k = Math.min(3, Math.floor(f / SL));
    const lf = f - k * SL;
    if (k > 0 && lf < 22) {
      const e = E.io(lf / 22);
      C.save();
      C.translate(-e * W, 0);
      drawSlide(k - 1, lf + SL);
      C.restore();
      C.save();
      C.translate((1 - e) * W, 0);
      drawSlide(k, lf);
      C.restore();
      cue('whoosh', k * SL + 1, 0.5);
    } else {
      drawSlide(k, lf);
    }
  },
});
