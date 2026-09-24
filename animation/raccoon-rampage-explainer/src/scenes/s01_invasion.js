// Scene 1: the invasion. 1934 release by a German lake, the 1945 fur-farm
// escape, then the landscape turns into a map as raccoons spread.

const NIGHT = {
  crateX: 700, groundY: 860, farmX: 2480,
  stars: Array.from({ length: 140 }, (_, i) => {
    const r = rng(900 + i);
    return [r() * W, r() * 560, 0.8 + r() * 2.2, r() * TAU];
  }),
};

function nightSky(f) {
  const g = C.createLinearGradient(0, 0, 0, 700);
  g.addColorStop(0, '#171b38');
  g.addColorStop(0.55, '#2d3060');
  g.addColorStop(1, '#5d4c82');
  C.fillStyle = g;
  C.fillRect(0, 0, W, H);
  P.texRect(0, 0, W, H, 'mottle', 0.35, 1.5, 0, 0);
  for (const [x, y, r, ph] of NIGHT.stars) {
    C.fillStyle = rgba('#fff4d8', 0.45 + 0.45 * Math.sin(f * 0.08 + ph));
    C.beginPath(); C.arc(x, y, r, 0, TAU); C.fill();
  }
  // moon
  P.glow(1480, 200, 260, '#f6e9c4', 0.35);
  P.ellipse(1480, 200, 66, 66, { fill: PAL.moon, lw: 2.5, ink: '#8d86a8', seed: 700, texA: 0.25, edge: 0.15, n: 26 });
  P.ellipse(1460, 184, 12, 10, { fill: '#e9dcb4', ink: false, seed: 701, tex: false, edge: 0 });
  P.ellipse(1500, 222, 16, 12, { fill: '#e9dcb4', ink: false, seed: 702, tex: false, edge: 0 });
  // drifting clouds
  for (let i = 0; i < 4; i++) {
    const x = ((i * 610 + f * (0.4 + i * 0.1)) % (W + 700)) - 350;
    const y = 150 + i * 90;
    C.save();
    C.globalAlpha = 0.45;
    P.shape(P.ellipsePts(x, y, 160 + i * 30, 26 + i * 4, 16), { fill: '#6e5f96', ink: false, seed: 710 + i, wob: 8, texA: 0.4 });
    C.restore();
  }
}

function pine(x, y, s, col, seed) {
  P.shape([[x - 6 * s, y], [x + 6 * s, y], [x + 5 * s, y - 30 * s], [x - 5 * s, y - 30 * s]], { fill: '#3a2c30', lw: 2.2, seed, smooth: 0 });
  for (let k = 0; k < 3; k++) {
    const yy = y - 20 * s - k * 42 * s, w = (70 - k * 16) * s;
    P.shape([[x - w, yy], [x, yy - 80 * s], [x + w, yy]], { fill: col, lw: 2.4, seed: seed + k + 1, smooth: 0.25, texA: 0.4 });
  }
}

function nightLand(f, camX) {
  // far ridges (slow parallax)
  C.save();
  C.translate(-camX * 0.25, 0);
  P.shape([[-200, 640], [100, 520], [420, 580], [760, 470], [1100, 560], [1400, 500], [1800, 580], [2200, 480], [2600, 560], [2900, 520], [2900, 700], [-200, 700]],
    { fill: '#2a2c55', ink: '#1a1a36', lw: 2.5, seed: 720, texA: 0.35 });
  C.restore();
  C.save();
  C.translate(-camX * 0.5, 0);
  P.shape([[-200, 660], [300, 600], [700, 640], [1200, 590], [1700, 650], [2300, 600], [2900, 640], [3400, 610], [3400, 720], [-200, 720]],
    { fill: '#26294a', ink: '#17172f', lw: 2.5, seed: 721, texA: 0.35 });
  for (let i = 0; i < 16; i++) pine(-100 + i * 230 + (i % 3) * 40, 668 + (i % 2) * 8, 0.45, '#223246', 730 + i * 5);
  C.restore();
  // lake with the moon's reflection
  C.save();
  C.translate(-camX * 0.7, 0);
  P.shape([[-300, 690], [3800, 690], [3800, 790], [-300, 790]], { fill: '#39457a', ink: false, seed: 740, smooth: 0, texA: 0.4, edge: 0 });
  C.restore();
  for (let k = 0; k < 9; k++) {
    const yy = 704 + k * 9;
    const w = 90 - k * 7 + Math.sin(f * 0.15 + k) * 14;
    C.fillStyle = rgba('#f6e9c4', 0.55 - k * 0.05);
    C.fillRect(1480 - w / 2 + Math.sin(f * 0.1 + k * 1.7) * 8, yy, w, 3);
  }
  // near shore (scaled up so the characters read well)
  C.save();
  nearXform(camX);
  P.shape([[-200, 790], [600, 772], [1400, 792], [2200, 776], [3000, 794], [3800, 780], [3800, 1100], [-200, 1100]],
    { fill: '#303a3f', ink: '#1a1f24', lw: 3, seed: 750, texA: 0.45 });
  for (let i = 0; i < 40; i++) {
    const gx = i * 97 + (i % 4) * 13, gy = 800 + (i % 5) * 40;
    P.line([[gx, gy], [gx - 6, gy - 22]], { w: 2.4, col: '#4f6250', seed: 760 + i });
    P.line([[gx + 6, gy], [gx + 10, gy - 18]], { w: 2.4, col: '#4f6250', seed: 800 + i });
  }
  pine(120, 900, 1.2, '#2b4152', 850);
  pine(1260, 880, 1.0, '#2b4152', 860);
  pine(1900, 890, 1.15, '#2b4152', 870);
  pine(3320, 900, 1.2, '#2b4152', 880);
  C.restore();
}

const NEAR = 1.45;
function nearXform(camX) {
  C.translate(0, NIGHT.groundY);
  C.scale(NEAR, NEAR);
  C.translate(-camX, -NIGHT.groundY);
}

function crate(x, y, f, lidT) {
  const shake = f < 62 ? Math.sin(f * 1.7) * (f > 25 ? (f > 40 ? 0.06 : 0.025) : 0) : 0;
  C.save();
  C.translate(x, y);
  C.rotate(shake);
  P.rrect(-90, -150, 180, 150, 6, { fill: '#9b7452', lw: 3, seed: 900, texA: 0.45 });
  for (let k = 1; k < 3; k++) P.line([[-86, -150 + k * 50], [86, -150 + k * 50]], { w: 2, seed: 901 + k, col: '#5e4332' });
  P.line([[-80, -140], [80, -10]], { w: 2.4, seed: 905, col: '#5e4332' });
  T.draw('1934', 0, -92, { size: 44, col: '#3b2a23', spacing: 3 });
  C.restore();
  // lid
  const [lx, ly] = arcPos(E.outQ(lidT), x, y - 156, x + 150, y - 12, 220);
  C.save();
  C.translate(lx, ly);
  C.rotate(lidT * 2.2);
  P.rrect(-100, -10, 200, 20, 4, { fill: '#a98260', lw: 3, seed: 906, texA: 0.4 });
  C.restore();
}

function furFarm(f, gateT) {
  const x0 = NIGHT.farmX, y = NIGHT.groundY;
  // shed
  P.shape([[x0 + 420, y - 10], [x0 + 420, y - 190], [x0 + 520, y - 270], [x0 + 620, y - 190], [x0 + 620, y - 10]], { fill: '#6a4b48', lw: 3, seed: 950, smooth: 0.05, texA: 0.45 });
  P.rrect(x0 + 495, y - 110, 50, 100, 4, { fill: '#3b2a2c', lw: 2.4, seed: 951 });
  // fence posts and mesh
  for (let k = 0; k < 7; k++) {
    const px = x0 + k * 110 - 60;
    if (k === 1) continue; // gate gap
    P.rrect(px - 8, y - 170, 16, 170, 3, { fill: '#7b5a44', lw: 2.4, seed: 952 + k });
  }
  C.save();
  C.strokeStyle = rgba('#b9b5c8', 0.55);
  C.lineWidth = 1.6;
  for (const [a, b] of [[x0 + 60, x0 + 610]]) {
    for (let xx = a; xx < b; xx += 22) {
      C.beginPath(); C.moveTo(xx, y - 160); C.lineTo(xx + 22, y - 10); C.stroke();
      C.beginPath(); C.moveTo(xx + 22, y - 160); C.lineTo(xx, y - 10); C.stroke();
    }
  }
  C.restore();
  // the gate swings open towards us
  const gx = x0 - 60;
  C.save();
  C.translate(gx, 0);
  C.scale(Math.cos(gateT * 1.9), 1);
  P.rrect(0, y - 160, 118, 150, 4, { fill: false, lw: 4, seed: 960, ink: '#7b5a44' });
  C.strokeStyle = rgba('#b9b5c8', 0.55);
  C.lineWidth = 1.6;
  for (let xx = 0; xx < 110; xx += 22) {
    C.beginPath(); C.moveTo(xx, y - 156); C.lineTo(xx + 22, y - 14); C.stroke();
    C.beginPath(); C.moveTo(xx + 22, y - 156); C.lineTo(xx, y - 14); C.stroke();
  }
  C.restore();
  // sign
  C.save();
  C.translate(x0 + 170, y - 200);
  C.rotate(0.04);
  P.rrect(-90, -30, 180, 60, 6, { fill: '#c9a57a', lw: 2.6, seed: 961, texA: 0.4 });
  T.draw('FUR FARM', 0, 2, { size: 34, col: '#3b2a23', spacing: 2 });
  C.restore();
}

// map helpers for the intro
function introMapView(cx, cy, zoom, fn) {
  const k = Math.max(W / 1800, H / 1200) * zoom;
  C.save();
  C.translate(W / 2, H / 2);
  C.scale(k, k);
  C.translate(-cx, -cy);
  if (P.img.map) C.drawImage(P.img.map, 0, 0, 1800, 1200);
  fn && fn(k);
  C.restore();
}

function pointsInCountry(iso, n, seed, minD) {
  const key = iso + n + seed;
  if (pointsInCountry.cache[key]) return pointsInCountry.cache[key];
  const c = MAPDATA.countries.find((k) => k.iso === iso);
  const ring = c.rings.reduce((a, b) => (b.length > a.length ? b : a));
  const bb = P.bbox(ring);
  const r = rng(seed);
  const inside = (x, y) => {
    let v = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i], [xj, yj] = ring[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) v = !v;
    }
    return v;
  };
  const pts = [];
  let tries = 0;
  while (pts.length < n && tries++ < 20000) {
    const x = bb.x + r() * bb.w, y = bb.y + r() * bb.h;
    if (!inside(x, y)) continue;
    if (pts.some((p) => Math.hypot(p[0] - x, p[1] - y) < minD)) continue;
    pts.push([x, y]);
  }
  return (pointsInCountry.cache[key] = pts);
}
pointsInCountry.cache = {};

scene({
  id: 'invasion', bars: 8, mood: 'sneaky',
  draw(f) {
    const N = NIGHT;
    // camera pans from the crate to the fur farm
    const camX = kf(f, [[0, 60], [150, 60], [262, 1880, E.io]]);
    const mapMix = ez(f, 282, 322, E.io);
    if (mapMix < 1) {
      // lift the camera upwards as we leave the landscape
      const lift = ez(f, 262, 322, E.inQ);
      C.save();
      C.translate(W / 2, H / 2);
      C.scale(1 + lift * 0.25, 1 + lift * 0.25);
      C.translate(-W / 2, -H / 2 + lift * 160);
      nightSky(f);
      nightLand(f, camX);
      C.save();
      nearXform(camX);
      // crate, lid and Rascal
      const lidT = ez(f, 62, 92, E.lin);
      crate(N.crateX, N.groundY, f, lidT);
      cue('pop', 62, 0.9);
      cue('boing', 66, 0.8);
      cue('boing', 132, 0.7);
      let rx = N.crateX, ry = N.groundY - 78, pose = {};
      if (f < 64) ry = N.groundY + 60;
      else if (f < 80) ry = lerp(N.groundY + 60, N.groundY - 78, E.outBack(seg(f, 64, 80)));
      if (f >= 130 && f < 150) {
        const t = seg(f, 130, 150);
        [rx, ry] = arcPos(t, N.crateX, N.groundY - 78, N.crateX + 150, N.groundY, 190);
        pose = { arms: [2.4, 2.4], squash: -0.12 };
      } else if (f >= 150) {
        const wx = kf(f, [[150, N.crateX + 150], [250, 2230, E.lin], [270, 2260, E.outQ]]);
        const wp = walkPose(f, 0.55, 0.7, 0);
        rx = wx; ry = N.groundY + (f < 262 ? wp.bob : 0);
        const hop = f >= 262 ? Math.abs(Math.sin((f - 262) * 0.22)) * 40 : 0;
        ry -= hop;
        pose = f < 262 ? { ...wp, lean: 0.12 } : { arms: [2.6, 2.6 + Math.sin(f * 0.5) * 0.3], legs: [0.2, -0.2], squash: hop > 30 ? -0.08 : 0.04 };
      }
      const look = f < 90 ? 0 : f < 105 ? -1 : f < 120 ? 1 : 0;
      const hidden = f < 64;
      if (!hidden) {
        C.save();
        if (f < 130) {
          // clip Rascal to the inside of the crate while he pops up
          C.beginPath();
          C.rect(N.crateX - 400, 0, 800, N.groundY - 150 + 2);
          C.clip();
        }
        raccoon({ x: rx, y: ry, s: 0.95, face: f >= 150 ? 1 : 1, turn: f < 130 ? look * 0.8 : 0.5, look: [look, 0],
          eyes: f < 88 ? 'wide' : f < 122 ? 'open' : 'sly', mouth: f < 88 ? 'o' : f < 122 ? 'flat' : 'grin',
          blink: f > 96 && f < 100 ? 1 : 0, shadow: f >= 150, seed: 1, ...pose });
        C.restore();
      }
      // 1945: the fur farm gate swings open and more raccoons tumble out
      const gateT = ez(f, 196, 214, E.outBack);
      cue('creak', 196, 0.8);
      furFarm(f, gateT);
      for (let k = 0; k < 3; k++) {
        const a = 208 + k * 10;
        if (f < a) continue;
        const t = seg(f, a, a + 50);
        const x = lerp(N.farmX - 20, 2410 - k * 50, E.outQ(t));
        const moving = t < 1;
        const wp = moving ? walkPose(f + k * 7, 0.6, 0.7, k) : { bob: -Math.abs(Math.sin((f + k * 9) * 0.22)) * 36, arms: [2.5, 2.5], legs: [0.2, -0.2] };
        raccoon({ x, y: N.groundY + 16 + k * 16 + wp.bob, s: 0.7 + k * 0.05, face: -1, turn: -0.4, eyes: 'happy', mouth: 'open', seed: 10 + k, ...wp });
        cue('chitter', a, 0.5);
      }
      C.restore();
      // night tint
      C.save();
      C.globalCompositeOperation = 'multiply';
      C.fillStyle = 'rgba(120,130,200,0.35)';
      C.fillRect(-200, -200, W + 400, H + 400);
      C.restore();
      C.restore();
      caption(f, 16, 128, 'GERMANY, 1934: RACCOONS RELEASED', { size: 56 });
      caption(f, 176, 262, '1945: MORE ESCAPE A FUR FARM', { size: 56 });
    }
    if (mapMix > 0) {
      const main = C;
      const tmp = mapMix < 1 ? buffer('wash') : null;
      if (tmp) { tmp.setTransform(1, 0, 0, 1, 0, 0); tmp.clearRect(0, 0, W, H); C = tmp; }
      C.save();
      const z = kf(f, [[282, 3.2], [330, 2.4, E.outQ], [440, 1.08, E.io]]);
      const cx = kf(f, [[282, 780], [440, 820, E.io]]);
      const cy = kf(f, [[282, 470], [440, 560, E.io]]);
      introMapView(cx, cy, z, (k) => {
        // the handful of founders grows into a huge population
        const de = pointsInCountry('DEU', 60, 3, 24);
        const grow = ez(f, 318, 400, E.inQ);
        const nDE = Math.floor(4 + grow * (de.length - 4));
        const ts = 30 / Math.sqrt(k) * 1.0;
        de.slice(0, nDE).forEach(([x, y], i) => {
          const a = i < 4 ? 300 : 318 + (i / de.length) * 82;
          const t = seg(f, a, a + 8);
          token(x, y - (1 - t) * 30, ts * E.outBack(t), 'de', i, { shadow: false });
        });
        const fr = pointsInCountry('FRA', 16, 5, 50);
        fr.forEach(([x, y], i) => {
          const a = 392 + i * 4;
          const t = seg(f, a, a + 8);
          if (t > 0) token(x, y - (1 - t) * 30, ts * E.outBack(t), 'fr', i, { shadow: false });
        });
        const eu = [[632, 402], [590, 482], [700, 668], [885, 628], [925, 526], [738, 228], [1037, 400], [792, 752], [440, 400]];
        eu.forEach(([x, y], i) => {
          const a = 412 + i * 5;
          const t = seg(f, a, a + 8);
          if (t > 0) token(x, y - (1 - t) * 30, ts * E.outBack(t), 'eu', i, { shadow: false });
        });
        for (let i = 0; i < 12; i++) cue('pop', 318 + i * 7, 0.35);
      });
      C.restore();
      if (tmp) {
        // a watercolour wash sweeping down from the sky
        const edge = lerp(-350, H + 350, mapMix);
        const g = tmp.createLinearGradient(0, edge - 300, 0, edge + 300);
        g.addColorStop(0, 'rgba(0,0,0,1)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        tmp.globalCompositeOperation = 'destination-in';
        tmp.fillStyle = g;
        tmp.fillRect(0, 0, W, H);
        tmp.globalCompositeOperation = 'source-over';
        C = main;
        C.drawImage(tmp.canvas, 0, 0);
      }
      caption(f, 352, 470, 'ABOUT 1.5 MILLION IN GERMANY TODAY', { size: 56, top: true });
    }
    // Rascal pops up close to camera, grinning
    if (f > 440) {
      const t = ez(f, 440, 466, E.outBack);
      raccoon({ x: 1540, y: H + 420 - t * 250, s: 3.2, turn: -0.5, look: [-1, 0], eyes: 'sly', mouth: 'grin', arms: [2.3, 0.3], seed: 1, shadow: false });
      cue('boing', 444, 0.8);
    }
  },
});
