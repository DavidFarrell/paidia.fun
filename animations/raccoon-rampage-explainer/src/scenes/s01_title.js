// Scene 1 (0-10 s): a dustbin rattles, the Raccoon bursts out with a stolen burger,
// the title paints on, then it scampers off right and the camera whip-pans after it.

(() => {
  const BIN = { x: 1440, rim: 650, base: 960 };
  const TX = 700; // title centre x

  const binBack = () => RR.sprite('s01:binBack', 380, 120, () => {
    RR.ink(RR.ellipsePts(190, 60, 170, 42, 28), { fill: '#4a5058', w: 1.2 });
    RR.ink(RR.ellipsePts(190, 64, 150, 30, 28), { fill: '#2a2d33', stroke: false });
  }, { res: 1.5 });
  const binFront = () => RR.sprite('s01:binFront', 380, 360, () => {
    const body = [[20, 30], [360, 30], [336, 340], [44, 340]];
    RR.water(body, '#7f8a93', { layers: 12, alpha: 45, spread: 0.01, edge: 0.5 });
    for (let i = 0; i < 6; i++) RR.inkLine([[70 + i * 48, 50], [78 + i * 45, 325]], { col: '#5d676f', w: 0.8, brush: 'pencil' });
    RR.ink(body, { stroke: RR.C.ink, w: 1.3, curve: 0.08 });
    RR.ink(RR.ellipsePts(190, 30, 172, 26, 28), { fill: '#9aa5ad', w: 1.2 });
    RR.ink(RR.ellipsePts(190, 30, 150, 16, 28), { fill: '#2a2d33', stroke: false });
    RR.inkLine([[110, 150], [135, 175], [150, 150]], { col: '#5d676f', w: 0.8 }); // dent
    RR.ink(RR.rrectPts(160, 120, 60, 22, 8), { fill: '#6c757d', w: 0.8 });   // handle
  }, { res: 1.5 });
  const lid = () => RR.sprite('s01:lid', 400, 140, () => {
    RR.ink(RR.ellipsePts(200, 90, 184, 36, 28), { fill: '#9aa5ad', w: 1.2 });
    RR.ink([[40, 90], [80, 50], [200, 36], [320, 50], [360, 90]], { fill: '#b4bec5', w: 1.1, curve: 0.5 });
    RR.ink(RR.rrectPts(170, 12, 60, 30, 10), { fill: '#6c757d', w: 1 });
  }, { res: 1.5 });
  const backdrop = () => RR.sprite('s01:backdrop', 1920, 1080, () => {
    RR.water(RR.ellipsePts(960, 560, 860, 420, 30), '#e3d0e0', { layers: 14, alpha: 26, spread: 0.05, edge: 0.3 });
    RR.water(RR.ellipsePts(1100, 990, 820, 80, 30), '#d7c6b2', { layers: 10, alpha: 40, spread: 0.04 });
    // bunting across the top, like the box art
    const cols = [RR.C.pink, RR.C.gold, RR.C.teal, RR.C.lilac, RR.C.orange];
    const rope = (x) => 70 + 0.00012 * (x - 960) * (x - 960) * -1 + 60;
    RR.inkLine(Array.from({ length: 13 }, (_, i) => [i * 160, rope(i * 160)]), { col: RR.C.inkSoft, w: 0.8, curve: 0.6 });
    for (let i = 0; i < 12; i++) {
      const x = 80 + i * 160, y = rope(x);
      RR.ink([[x - 40, y], [x + 40, y + 2], [x, y + 70]], { fill: cols[i % cols.length], w: 0.8, curve: 0.1 });
    }
    // litter
    RR.ink([[1700, 965], [1750, 940], [1790, 965], [1760, 980]], { fill: '#f0cf5a', w: 0.9, curve: 0.5 }); // banana skin
    RR.ink(RR.rrectPts(1090, 935, 70, 44, 10), { fill: '#d9574a', w: 0.9 }); // can
    RR.inkEllipse(1170, 957, 8, 22, { fill: '#b8c2c9', w: 0.8 });
  }, { res: 0.6 });

  const TITLE1 = 'RACCOON', TITLE2 = 'RAMPAGE';
  const titleLetters = (t, word, y, start) => {
    const size = 200;
    const adv = [...word].map((ch) => RR.textWidth(ch, { font: 'title', size }) + 4);
    let x = TX - adv.reduce((a, b) => a + b, 0) / 2;
    [...word].forEach((ch, i) => {
      const cw = adv[i];
      const tt = start + i * 0.07;
      const k = RR.seg(t, tt, tt + 0.35);
      if (k > 0) {
        const s = RR.E.outBack(k);
        const rot = RR.hrange(i + y, -0.08, 0.08) * (1 - k) + RR.hrange(i * 3 + y, -0.03, 0.03);
        const bob = Math.sin(t * 2.4 + i * 0.8) * 3 * k;
        push();
        translate(x + cw / 2, y + bob - size * 0.3);
        rotate(rot);
        scale(s);
        RR.text(ch, -cw / 2, size * 0.3, { font: 'title', size, col: '#d9a6c6', outline: RR.C.plumDark, outlineW: 7, align: 'left', shadow: true });
        pop();
      }
      x += cw;
    });
  };

  RR.scene({
    id: 's01_title', order: 1, dur: 10, music: 'intro',
    cues: [[0.7, 'rattle'], [1.3, 'rattle'], [2.0, 'pop'], [2.05, 'boing'], [2.6, 'clang', 0.6], [3.1, 'chitter'], [3.6, 'brush'], [4.2, 'brush'], [6.0, 'paper'], [7.6, 'bite'], [8.2, 'boing'], [8.9, 'whoosh']],
    draw(t) {
      // camera: gentle drift, then whip-pan right at the end
      const pan = RR.E.inCubic(RR.seg(t, 8.6, 10)) * 2600;
      const cam = RR.drift(RR.cam(RR.W / 2 + pan, RR.H / 2, 1), t, 1);
      const shake = RR.shake(t, 2.0, 0.5, 10);
      cam.x += shake[0]; cam.y += shake[1];
      RR.withCam(cam, () => {
        RR.drawSprite(backdrop(), 960, 540, { w: 1920, h: 1080 });
        RR.shadow(BIN.x, BIN.base + 6, 210, 26, 50);

        // the whole bin wobbles on its base while something rummages inside
        const wob = t < 2.05 ? 0.035 * Math.sin(t * 26) * RR.env(t, 0.45, 2.0, 0.15, 0.05) : 0;
        push();
        translate(BIN.x, BIN.base); rotate(wob); translate(-BIN.x, -BIN.base);
        // lid: rattles, then flies off spinning
        const rattle = t < 2 ? Math.abs(Math.sin(t * 22)) * RR.env(t, 0.5, 1.9, 0.1, 0.1) * 14 : 0;
        const lidRot = t < 2 ? Math.sin(t * 29) * 0.06 * RR.env(t, 0.5, 1.9, 0.1, 0.1) : 0;
        let lidPos = [BIN.x, BIN.rim - 16 - rattle], lidA = lidRot;
        if (t >= 2) {
          const u = (t - 2) / 1.1;
          lidPos = [BIN.x - 700 * u, BIN.rim - 16 - 900 * u + 900 * u * u];
          lidA = -u * 6;
        }

        RR.drawSprite(binBack(), BIN.x, BIN.rim, { w: 380, h: 120 });

        // raccoon: pops up at 2.0, idles, bites at 7.6, hops out at 8.1, runs off
        if (t >= 1.95) {
          const up = RR.E.outBack(RR.seg(t, 1.95, 2.35));
          let x = BIN.x, y = BIN.rim + 330 - up * 250;
          let pose = RR.raccoonIdle(t, { hold: 'burger', armF: 1.7, armB: 0.3, mouth: 'grin', brow: 'sly' });
          pose.squash = t < 2.5 ? -0.2 * Math.sin(RR.seg(t, 1.95, 2.5) * Math.PI) : pose.squash;
          if (t < 3.3) { pose.look = [Math.sin(t * 6) > 0 ? 1 : -1, 0]; pose.mouth = 'o'; pose.brow = 'up'; }
          if (t >= 3.3 && t < 5.2) { pose.look = [-1, -0.4]; pose.headTilt = -0.12; pose.mouth = 'o'; pose.brow = 'up'; }
          if (t >= 5.2 && t < 7.4) { pose.look = [-0.1, 0.1]; }
          if (t >= 7.4 && t < 8.0) { pose.armF = 2.3; pose.mouth = t % 0.25 < 0.12 ? 'grin' : 'open'; pose.eyes = 'happy'; }
          if (t >= 8.0) {
            const u = RR.seg(t, 8.0, 8.55);
            const p = RR.hop([BIN.x, BIN.rim + 80], [BIN.x + 300, BIN.base], u, 260);
            x = p[0]; y = p[1];
            pose = { ...pose, squash: u < 1 ? -0.15 : 0, lean: 0.25, mouth: 'grin', brow: 'neutral', armB: 2.4, tailUp: 1 };
            if (t >= 8.55) {
              x = BIN.x + 300 + (t - 8.55) * 1500;
              pose = { ...pose, run: t * 16, stride: 1, lean: 0.3, squash: 0, tail: t * 6 };
              RR.shadow(x, BIN.base + 4, 60, 12, 40);
            }
          }
          RR.drawRaccoon(x, y, 1.7, pose);
        }
        // front of the bin hides the raccoon's lower half while it is inside
        RR.drawSprite(binFront(), BIN.x, BIN.rim + 150, { w: 380, h: 360 });
        // lid sits on top of the rim (drawn last so it covers the opening)
        if (t < 3.2) RR.drawSprite(lid(), lidPos[0], lidPos[1], { w: 400, h: 140, rot: lidA });
        pop();
        // rattle marks either side of the lid
        for (const [a, b] of [[0.55, 0.95], [1.2, 1.7]]) {
          const e = RR.env(t, a, b, 0.05, 0.1);
          if (e > 0) for (const side of [-1, 1]) for (let i = 0; i < 3; i++) {
            const x0 = BIN.x + side * (205 + i * 4), y0 = BIN.rim - 40 + i * 26;
            RR.inkLine([[x0, y0], [x0 + side * 34 * e, y0 - 8 + i * 4]], { col: RR.C.inkSoft, w: 1.4 });
          }
        }
        // crumbs flying during the bite
        if (t > 7.5 && t < 8.1) for (let i = 0; i < 5; i++) {
          const u = RR.seg(t, 7.5 + i * 0.08, 7.9 + i * 0.08);
          if (u > 0 && u < 1) RR.flatEllipse(BIN.x + 120 + i * 18 + u * 60, BIN.rim - 60 + u * u * 160, 4, 3, '#e2ae66');
        }
      });

      // Title and subtitle (screen space; they slide with the whip-pan)
      push();
      translate(-pan * 1.1, 0);
      RR.text('BIOINVADERS!', TX, 300, { font: 'bold', size: 44, col: RR.C.plum, alpha: RR.seg(t, 3.4, 3.9) });
      titleLetters(t, TITLE1, 480, 3.5);
      titleLetters(t, TITLE2, 660, 4.1);
      pop();
      if (pan < 400) RR.caption('How to play', t, 6.0, 8.8, { x: TX, y: 790, size: 64, rot: -0.02 });

      // whip-pan speed streaks
      const whip = RR.env(t, 8.9, 10, 0.3, 0.05);
      if (whip > 0) {
        RR.flush();
        for (let i = 0; i < 26; i++) {
          const y = RR.hr(i) * RR.H, len = RR.hrange(i + 5, 300, 900);
          const x = RR.W + len - (((t - 8.9) * 6000 + RR.hr(i + 9) * 2400) % (RR.W + len * 2));
          RR.flat(RR.rrectPts(x - len, y, len, RR.hrange(i + 2, 3, 9), 3), RR.C.plumMid, 120 * whip);
        }
      }
    },
  });
})();
