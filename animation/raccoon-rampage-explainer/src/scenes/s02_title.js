// Scene 2: title card in the spirit of the box cover (bunting, bins and a
// raccoon party), with the title dropping in letter by letter.

function bunting(f, y0 = 34, sag = 56) {
  const cols = ['#d9a3b5', '#9d8fb3', '#a9bfa2', '#e2c07a', '#c79ab8'];
  const pts = [];
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    pts.push([-40 + t * (W + 80), y0 + Math.sin(t * Math.PI) * sag + Math.sin(f * 0.05 + t * 6) * 3]);
  }
  P.line(pts, { w: 3, col: PAL.plumMid, seed: 1100, taper: false });
  for (let i = 1; i < 20; i += 1) {
    const [x, y] = pts[i];
    const sway = Math.sin(f * 0.08 + i * 1.3) * 0.08;
    C.save();
    C.translate(x, y);
    C.rotate(sway);
    P.shape([[-34, 0], [34, 0], [0, 78]], { fill: cols[i % cols.length], lw: 2.4, seed: 1101 + i, smooth: 0.15, texA: 0.45 });
    C.restore();
  }
}

function bin(x, y, s, seed, lidAng = 0, lidLift = 0) {
  C.save();
  C.translate(x, y);
  C.scale(s, s);
  P.shadow(0, 4, 120, 18, 0.25);
  P.shape([[-86, -10], [-96, -230], [96, -230], [86, -10]], { fill: '#8f917c', lw: 3.2, seed, smooth: 0.08, texA: 0.5 });
  for (let k = -2; k <= 2; k++) P.line([[k * 32, -210], [k * 29, -26]], { w: 3, col: '#6c6e5c', seed: seed + 10 + k });
  P.rrect(-104, -244, 208, 26, 8, { fill: '#a2a48e', lw: 3, seed: seed + 20 });
  C.save();
  C.translate(-100, -244 - lidLift);
  C.rotate(-lidAng);
  P.shape([[0, 0], [8, -30], [192, -30], [200, 0]], { fill: '#b1b39c', lw: 3, seed: seed + 21, smooth: 0.3, texA: 0.45 });
  P.rrect(80, -46, 40, 16, 6, { fill: '#8f917c', lw: 2.6, seed: seed + 22 });
  C.restore();
  C.restore();
}

scene({
  id: 'title', bars: 4, mood: 'title', trans: { type: 'brush', len: 36 },
  draw(f) {
    lavenderBG(f);
    P.glow(W / 2, 260, 700, '#f4c5d3', 0.35);
    bunting(f);
    // floor
    P.shape([[-50, 860], [W + 50, 850], [W + 50, H + 50], [-50, H + 50]], { fill: '#a995b4', ink: false, seed: 1120, smooth: 0.2, texA: 0.45, edge: 0 });

    // title letters drop in
    const drop = (str, y, a, size) => {
      const w = T.width(str, size, true, 8);
      let x = W / 2 - w / 2;
      T.font(size, true);
      [...str].forEach((ch, i) => {
        const cw = C.measureText(ch).width + 8;
        const t = seg(f, a + i * 4, a + i * 4 + 16);
        if (t > 0) {
          const yy = y - (1 - E.outBounce(t)) * 500;
          C.save();
          C.translate(x + cw / 2, yy);
          C.rotate((hash(i + size) - 0.5) * 0.12 + Math.sin(f * 0.07 + i) * 0.015);
          T.draw(ch, 0, 0, { size, col: PAL.plumDark, align: 'center', shadow: PAL.cardCream });
          C.restore();
          cue('pop', a + i * 4 + 10, 0.35);
        }
        x += cw;
      });
    };
    const bt = ez(f, 10, 26, E.outBack);
    if (bt > 0) {
      C.save();
      C.translate(W / 2, 176);
      C.scale(bt, bt);
      T.draw('BIOINVADERS!', 0, 0, { size: 54, col: PAL.plumMid, spacing: 6 });
      C.restore();
    }
    drop('RACCOON', 350, 18, 190);
    drop('RAMPAGE', 525, 44, 190);

    // bins and the party
    const lidPop = ez(f, 60, 72, E.outBack);
    bin(300, 900, 1.05, 1130, 0.9 * lidPop, 20 * lidPop);
    bin(1640, 905, 1.0, 1160, 0.15, 0);
    bin(1250, 930, 0.8, 1190, 0, 0);
    // a raccoon pops out of the left bin
    const popT = ez(f, 66, 84, E.outBack);
    C.save();
    C.beginPath(); C.rect(0, 0, W, 900 - 250 * 1.05 + 4); C.clip();
    raccoon({ x: 300, y: 900 - 250 * 1.05 + 70 + (1 - popT) * 220, s: 0.9, eyes: 'wide', mouth: 'grin', arms: [2.5, 2.5], shadow: false, seed: 21, turn: 0.3 });
    C.restore();
    cue('boing', 68, 0.7);
    // raccoon lounging on the right bin, one munching a burger
    raccoon({ x: 1640, y: 905 - 250, s: 0.8, eyes: 'closed', mouth: 'smile', arms: [0.6, 0.4], seed: 22, tilt: 0.3, lean: -0.3, sit: true, shadow: false });
    zzz(1700, 560, f, PAL.plumMid);
    raccoon({ x: 1420, y: 1010, s: 0.95, prop: 'burger', arms: [1.2, 1.2], eyes: 'happy', mouth: f % 30 < 15 ? 'chomp' : 'smile', seed: 23, turn: -0.4 });
    raccoon({ x: 560, y: 1000, s: 0.9, eyes: 'sly', mouth: 'smirk', arms: [0.3, 1.6 + Math.sin(f * 0.25) * 0.4], seed: 24, turn: 0.5, tail: Math.sin(f * 0.1) * 0.4 });

    // the boss rises and adjusts his shades
    const bossT = ez(f, 90, 118, E.outBack);
    const adjust = seg(f, 124, 150);
    raccoon({ x: 960, y: 1180 - bossT * 170, s: 1.35, suit: true, shades: true, mouth: adjust > 0.5 ? 'smirk' : 'flat',
      arms: [0.3, adjust > 0 && adjust < 1 ? 2.75 : 0.35], seed: 25, shadow: false });
    cue('whoosh', 92, 0.7);
    if (adjust > 0.5) sparkle(960 + 34 * 1.35, 1180 - 170 - 150 * 1.35, f, 136, 40);
    cue('sparkle', 136, 0.8);
    caption(f, 150, 236, 'HOW TO PLAY', { size: 70, y: 668 });
  },
});
