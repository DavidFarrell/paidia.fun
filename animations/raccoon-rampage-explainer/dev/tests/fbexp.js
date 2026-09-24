const R1 = () => RR.ink(RR.rrectPts(100, 100, 400, 150, 16), { fill: '#e0556f', stroke: RR.C.gold, w: 2 });
const R2 = () => RR.ink(RR.rrectPts(100, 350, 400, 150, 16), { fill: '#4f7fbd', stroke: RR.C.gold, w: 2 });
const BG = { layers: 2, alpha: 120 };
const EXP = [
  ['water edge0', (w, h) => { RR.water(RR.rrectPts(0, 0, w, h, 10), '#cccccc', { ...BG, edge: 0 }); R1(); R2(); }],
  ['water edge', (w, h) => { RR.water(RR.rrectPts(0, 0, w, h, 10), '#cccccc', { ...BG }); R1(); R2(); }],
  ['native stroke', (w, h) => { RR.flush(); noFill(); stroke(0); strokeWeight(3); rect(20, 20, 560, 560); noStroke(); R1(); R2(); }],
  ['R1 text R2', (w, h) => { RR.flat(RR.rrectPts(0, 0, w, h, 10), '#cccccc'); R1(); RR.text('hi', 300, 320, { size: 40 }); R2(); }],
  ['water R1 text R2', (w, h) => { RR.water(RR.rrectPts(0, 0, w, h, 10), '#cccccc', { ...BG, edge: 0 }); R1(); RR.text('hi', 300, 320, { size: 40 }); R2(); }],
  ['nstroke R1 txt R2', (w, h) => { RR.flush(); noFill(); stroke(0); strokeWeight(3); rect(20, 20, 560, 560); noStroke(); R1(); RR.text('hi', 300, 320, { size: 40 }); R2(); }],
  ['stroke-only R1', (w, h) => { RR.flat(RR.rrectPts(0, 0, w, h, 10), '#cccccc'); RR.ink(RR.rrectPts(100, 100, 400, 150, 16), { stroke: RR.C.gold, w: 2 }); RR.text('hi', 300, 320, { size: 40 }); R2(); }],
];
RR.scene({ id: 'test_fbexp', order: 1, dur: 2, draw(t) {
  EXP.forEach(([name, fn], i) => {
    const spr = RR.sprite('exp' + i, 600, 600, fn, { res: 1 });
    const x = 170 + (i % 5) * 360, y = 220 + Math.floor(i / 5) * 460;
    RR.drawSprite(spr, x, y, { w: 320, h: 320 });
    RR.text(name, x, y + 200, { size: 30 });
  });
}});
