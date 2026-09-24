// Scene 9: Spread. Cards go to France, Germany and the rest of Europe; the
// number per pile depends on how far the raccoons have spread. Protection
// cancels a card; the rest are revealed and new raccoons appear.

// tokens after the evaluation example: 8 in Germany (two were mitigated)
function tokensAfterEval() {
  const list = [];
  for (let i = 2; i < 10; i++) list.push({ kind: 'de', i });
  for (let i = 0; i < 5; i++) list.push({ kind: 'fr', i });
  for (let i = 0; i < 5; i++) list.push({ kind: 'eu', i });
  return list;
}
const Q2S = shiftQueue(Q1b); // the queue after the failed card dropped off
const PROTECT_CUBE = [BOARD.protect[0] + 70, BOARD.protect[1] - 70];

scene({
  id: 'spread', bars: 8, mood: 'tense', trans: { type: 'iris', len: 26, x: 1290, y: 1010 },
  draw(f) {
    tableBG(f, '#4f3f55');
    const CX = kf(f, [[0, 1500], [290, 1500], [330, 1030, E.io], [380, 1030], [420, 1400, E.io]]);
    const CY = kf(f, [[0, 800], [290, 800], [330, 820, E.io]]);
    const Z = kf(f, [[0, 0.95], [290, 0.95], [330, 0.8, E.io], [380, 0.8], [420, 0.84, E.io]]);
    // piles: France, Germany, rest of Europe (placed in the sea next to each area)
    const piles = [
      { name: 'FRANCE', at: mapPt(250, 560), n: 0 },
      { name: 'GERMANY', at: mapPt(560, 250), n: 1, cancelled: true },
      { name: 'REST OF EUROPE', at: mapPt(1130, 930), n: 2 },
    ];
    const trk = kf(f, [[0, -2], [322, -2], [330, -1, E.outBack], [346, -1], [354, 0, E.outBack]]);
    const toks = tokensAfterEval();
    toks.push({ kind: 'eu', i: 5, a: 318 }, { kind: 'eu', i: 6, a: 342 });

    cam(CX, CY, Z, 0, () => {
      boardBase();
      mapSpaces(1);
      // green spaces pulse while we check how far the raccoons have spread
      if (f > 26 && f < 80) {
        for (const [x, y] of MAPDATA.spaces.green) {
          const [bx, by] = mapPt(x, y);
          ring(bx, by, 30, f, '#bfe79a');
        }
      }
      drawTokens(toks, f);
      trackerMarker(trk, f);
      drawQueue(Q2S, f);
      // spread rules: the green row = 1 card per pile
      if (f > 26 && f < 90) ring(BOARD.rules[0] - 47, BOARD.rules[1] - 13, 36, f, '#bfe79a');
      // reaching orange, then red, spaces means more cards per pile
      if (f > 392 && f < 432) {
        ring(BOARD.rules[0] - 47, BOARD.rules[1] + 32, 36, f, '#f2b47a');
        for (const [x, y] of MAPDATA.spaces.orange) ring(...mapPt(x, y), 30, f, '#f2b47a');
      }
      if (f >= 432) {
        ring(BOARD.rules[0] - 47, BOARD.rules[1] + 78, 36, f, '#ef7d6d');
        for (const [x, y] of MAPDATA.spaces.red) ring(...mapPt(x, y), 30, f, '#ef7d6d');
      }
      // the deck and the German player's protection cube
      card({ type: 'spreadBack', x: BOARD.deck[0], y: BOARD.deck[1], w: CARD_W, h: CARD_H, seed: 90, glow: f < 60 ? '#e2574c' : null });
      const cubeT = seg(f, 160, 188);
      if (cubeT <= 0) cube(...PROTECT_CUBE, 44, PAL.yellow, 1500);
      // deal the three piles
      piles.forEach((p, k) => {
        const a = 70 + k * 14;
        const t = ez(f, a, a + 20, E.io);
        if (t <= 0) return;
        cue('card', a, 0.6);
        let [x, y] = [lerp(BOARD.deck[0], p.at[0], t), lerp(BOARD.deck[1], p.at[1], t) - Math.sin(t * Math.PI) * 160];
        let flip = 1, rot = (1 - t) * 1.2 + (k - 1) * 0.05;
        if (p.cancelled) {
          const out = ez(f, 196, 226, E.inQ);
          if (out >= 1) return;
          x += out * 900; y -= out * 500; rot += out * 3;
        } else {
          const ra = k === 0 ? 244 : 270;
          flip = 1 - ez(f, ra, ra + 16, E.io);
          cue('flip', ra, 0.8);
        }
        card({ type: 'spread', n: p.n, x, y, w: 150, h: 210, flip, rot, seed: 95 + k });
        if (p.cancelled && f > 188 && f < 206) {
          P.glow(x, y, 180, PAL.yellow, 0.6);
          shieldIcon(x, y, 60 * E.outBack(seg(f, 188, 198)), PAL.yellow, 3);
        }
      });
      piles.forEach((p, k) => tag(p.at[0], p.at[1] + 145, p.name, f, 96 + k * 14, 470, { size: 38 }));
      // the protection cube flies to the German pile
      if (cubeT > 0 && cubeT < 1) {
        const [x, y] = arcPos(E.io(cubeT), ...PROTECT_CUBE, piles[1].at[0], piles[1].at[1], 300);
        cube(x, y, 44, PAL.yellow, 1500, cubeT * 6);
      }
      cue('whoosh', 162, 0.6);
      cue('shield', 189, 1);
      if (f > 250 && f < 310) zzz(piles[0].at[0] + 50, piles[0].at[1] - 60, f, PAL.cardCream);
    });
    for (const a of [318, 342]) cue('pop', a, 0.8);
    popText(...toScreen(...trackPos(-1), CX, CY, Z), '+1', f, 326, { col: '#f08a6a' });
    popText(...toScreen(...trackPos(0), CX, CY, Z), '+1', f, 350, { col: '#f08a6a' });
    if (f > 326 && f < 380) ring(...toScreen(...trackPos(trk), CX, CY, Z), 46, f, '#f08a6a');
    cue('step', 328, 0.7); cue('step', 352, 0.7);
    cue('sparkle', 394, 0.5); cue('sparkle', 434, 0.5);
    // the spread boss grins in the corner
    const bt = ez(f, 0, 20, E.outBack) * (1 - ez(f, 60, 76, E.inQ));
    if (bt > 0) raccoon({ x: W - 210, y: H + 40 - bt * 40, s: 1.6 * bt, suit: true, shades: true, mouth: 'grin', prop: 'sign', arms: [1.3, 1.3], seed: 77, shadow: false });
    turnHUD(1, f, 'fr', 1);
    caption(f, 20, 150, 'SPREAD CARDS GO TO THREE AREAS', { size: 56 });
    caption(f, 160, 236, 'PROTECTION CANCELS A CARD', { size: 58 });
    caption(f, 316, 400, 'NEW RACCOONS PUSH THE TRACKER TOWARDS RED', { size: 50 });
    caption(f, 404, 470, 'REACH ORANGE OR RED SPACES: MORE SPREAD CARDS', { size: 48 });
  },
});
