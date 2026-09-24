// Scene 3: the semi-cooperative goal. Work together, but only one wins;
// and if the raccoon impact reaches the skull, everyone loses.

// A wide, gently arched Impact Tracker used outside the board.
// pos: -9 (best, left) .. 0 (neutral) .. 10 (skull, right)
function bigTracker(cx, cy, w, pos, f, o = {}) {
  const pts = [];
  for (let p = -9; p <= 10; p++) {
    const t = (p + 9) / 19;
    pts.push([cx - w / 2 + t * w, cy - Math.sin(t * Math.PI) * 60]);
  }
  const at = (p) => {
    const i = clamp(p + 9, 0, 19), a = Math.floor(i), b = Math.min(19, a + 1);
    return [lerp(pts[a][0], pts[b][0], i - a), lerp(pts[a][1], pts[b][1], i - a)];
  };
  // good end: a raccoon napping in leaves
  const [gx, gy] = at(-9);
  P.ellipse(gx - 70, gy, 58, 58, { fill: '#9cc98a', lw: 3, seed: 1200, texA: 0.45 });
  raccoon({ x: gx - 70, y: gy + 36, s: 0.3, eyes: 'closed', mouth: 'smile', arms: [0.2, 0.2], shadow: false, seed: 60, tilt: 0.25 });
  for (let p = -9; p <= 10; p++) {
    const [x, y] = at(p);
    const hot = o.flash && p === 10 ? o.flash : 0;
    if (p === 0) P.ellipse(x, y, 24, 24, { fill: PAL.plumDark, lw: 3, seed: 1201 });
    else if (p === 10) {
      const s = 1 + hot * 0.5;
      P.ellipse(x + 18, y, 46 * s, 46 * s, { fill: PAL.badDark, lw: 3, seed: 1202 });
      skullIcon(x + 18, y + 2, 28 * s, PAL.cardCream, 2.2);
    } else P.rrect(x - 17, y - 30, 34, 60, 9, { fill: trackCol(p), lw: 2.6, seed: 1210 + p, texA: 0.35 });
  }
  const [mx, my] = at(pos);
  const bad = pos > 3;
  raccoon({ x: mx, y: my - 22, s: 0.5, eyes: bad ? 'wide' : pos < 0 ? 'happy' : 'open', mouth: bad ? 'grin' : 'smile',
    arms: bad ? [2.4, 2.4] : [0.3, 0.3], tail: Math.sin(f * 0.2) * 0.3, seed: 70 });
  return at;
}

function trophy(x, y, s, f) {
  C.save();
  C.translate(x, y);
  C.scale(s, s);
  P.glow(0, -30, 150, '#ffe8a0', 0.45);
  P.shape([[-60, -120], [60, -120], [48, -40], [18, -10], [-18, -10], [-48, -40]], { fill: '#e7b84a', lw: 3.2, seed: 1250, smooth: 0.4, texA: 0.35 });
  for (const sx of [-1, 1]) P.line([[sx * 58, -110], [sx * 92, -100], [sx * 84, -60], [sx * 50, -50]], { w: 6, col: '#b58a2c', seed: 1251 + sx, taper: false });
  P.rrect(-12, -12, 24, 40, 4, { fill: '#d6a53a', lw: 2.6, seed: 1253 });
  P.rrect(-46, 26, 92, 26, 6, { fill: '#8f6a4a', lw: 2.6, seed: 1254 });
  starShape(0, -72, 22, '#fff1bf', 2, 1255);
  C.restore();
}

function goalTable() {
  P.shape([[-60, 880], [W + 60, 872], [W + 60, H + 60], [-60, H + 60]], { fill: '#8c6650', lw: 4, seed: 1260, smooth: 0.1, tex: 'mottle', texA: 0.55 });
  for (let k = 0; k < 5; k++) P.line([[-20, 930 + k * 34], [W + 20, 926 + k * 36]], { w: 2, col: '#6e4f3e', seed: 1261 + k });
  // the game board lying on the table
  P.shape([[620, 905], [1300, 905], [1380, 1010], [540, 1010]], { fill: PAL.plum, lw: 3, seed: 1270, smooth: 0.05, tex: 'mottle', texA: 0.5 });
  P.shape([[760, 920], [1160, 920], [1200, 985], [720, 985]], { fill: '#d9cbb0', lw: 2.4, seed: 1271, smooth: 0.05, texA: 0.4 });
}

const SEATS = { de: 330, fr: 770, ar: 1150, hu: 1590 };

scene({
  id: 'goal', bars: 7, mood: 'bouncy', trans: { type: 'iris', len: 30, x: 960, y: 560 },
  draw(f) {
    lavenderBG(f);
    P.glow(W / 2, 380, 900, '#f7d6dc', 0.3);

    // phase timings
    const cheer = seg(f, 70, 82) * (1 - seg(f, 148, 160));
    const sus = seg(f, 150, 166) * (1 - seg(f, 236, 250));
    const doom = seg(f, 332, 340);

    // big Impact Tracker drops in for the last part
    const trkIn = ez(f, 236, 262, E.outBack);
    const pos = kf(f, [[262, 0], [330, 10, E.inQ]]);
    const flash = seg(f, 330, 346) * (1 - seg(f, 380, 410));
    if (trkIn > 0) {
      C.save();
      C.translate(0, -(1 - trkIn) * 420);
      bigTracker(W / 2, 250, 1500, pos, f, { flash });
      C.restore();
      cue('whoosh', 238, 0.6);
      for (let p = 1; p <= 10; p++) {
        const fr = Math.round(262 + (68 * Math.sqrt(p / 10)));
        cue('step', fr, 0.4);
      }
      cue('boom', 331, 1);
    }
    if (flash > 0) {
      C.save();
      C.globalAlpha = flash * 0.25;
      C.fillStyle = PAL.bad;
      C.fillRect(0, 0, W, H);
      C.restore();
    }

    // trophy for the suspicious beat
    if (sus > 0) {
      trophy(W / 2, 330 + (1 - E.outBack(sus)) * -400, 1.2 * E.outBack(sus), f);
      sparkle(W / 2 + 60, 220, f, 172, 50);
      cue('sparkle', 170, 0.8);
    }

    // players
    ROLE_ORDER.forEach((r, i) => {
      const a = i * 9;
      const upT = ez(f, a, a + 22, E.outBack);
      if (upT <= 0) return;
      cue('pop', a + 8, 0.5);
      const x = SEATS[r];
      const wave = seg(f, 36 + i * 4, 50 + i * 4) * (1 - seg(f, 62, 72));
      const toward = x < W / 2 ? 1 : -1;
      let armL = [0.15 + wave * 0.3, 0.3], armR = [0.15 + wave * 2.4, 0.3 + wave * 0.6];
      let expr = 'happy', look = [0, 0], lean = 0;
      if (cheer > 0) {
        const bob = Math.sin(f * 0.35 + i) * 0.15;
        armL = [lerp(armL[0], 2.6 + bob, cheer), lerp(armL[1], 0.2, cheer)];
        armR = [lerp(armR[0], 2.6 - bob, cheer), lerp(armR[1], 0.2, cheer)];
        expr = 'grin';
      }
      if (sus > 0) {
        armL = [lerp(armL[0], 0.1, sus), lerp(armL[1], 2.1, sus)];
        armR = [lerp(armR[0], 0.1, sus), lerp(armR[1], 2.1, sus)];
        expr = f > 200 ? 'sly' : 'smug';
        const side = Math.sin(f * 0.06 + i * 2) > 0 ? 1 : -1;
        look = [side, f > 205 ? -0.5 : 0];
        lean = side * 0.05;
      }
      if (f > 250 && f < 332) { expr = 'shock'; look = [0, -1]; }
      if (doom > 0) {
        expr = 'sad';
        lean = (i % 2 ? 1 : -1) * 0.08 * doom;
        armL = [0.05, 0.1]; armR = [0.05, 0.1];
        look = [0, 1];
      }
      const slump = doom * 40;
      person({ role: r, x, y: 905 + (1 - upT) * 560 + slump + Math.sin(f * 0.1 + i) * 2, s: 1.25, expr, look, lean,
        armL, armR, holdL: sus > 0.5 ? 'card' : null, holdR: sus > 0.5 ? 'card' : null,
        blink: (f + i * 17) % 97 < 4 ? 1 : 0, talk: cheer > 0.5 ? 0.5 + 0.5 * Math.sin(f * 0.6) : 0, seed: 2 });
    });

    goalTable();
    // cheeky raccoons invade the table while the impact climbs
    for (let k = 0; k < 5; k++) {
      const a = 268 + k * 12;
      if (f < a) continue;
      const t = ez(f, a, a + 16, E.outBack);
      const x = 520 + k * 210;
      const party = f > 334;
      const hop = party ? Math.abs(Math.sin((f + k * 7) * 0.3)) * 50 : 0;
      raccoon({ x, y: 985 + (1 - t) * 200 - hop, s: 0.62, eyes: party ? 'happy' : 'sly', mouth: party ? 'open' : 'grin',
        arms: party ? [2.7, 2.5] : [0.4, 1.2], turn: (k - 2) * 0.25, seed: 30 + k, tail: Math.sin(f * 0.2 + k) * 0.5 });
      cue('chitter', a + 4, 0.4);
    }
    if (doom > 0) confetti(f, 334, W / 2, 700, 90, 1400, 3);

    caption(f, 76, 150, 'MANAGE THE RACCOONS TOGETHER...', { size: 58 });
    caption(f, 160, 240, '...BUT ONLY ONE OF YOU WINS', { size: 58 });
    caption(f, 300, 410, 'TOO MUCH RACCOON IMPACT? EVERYONE LOSES', { size: 54, y: 560 });
  },
});
