const CIRC = (x, y) => RR.inkCircle(x, y, 74, { fill: '#e0556f', stroke: RR.C.gold, w: 1 });
const EXP2 = [
  ['local', () => { CIRC(290, 105); CIRC(900, 105); }],
  ['offset1290', () => { push(); translate(-40, -1290); CIRC(330, 1395); CIRC(940, 1395); pop(); }],
  ['offset600', () => { push(); translate(-40, -600); CIRC(330, 705); CIRC(940, 705); pop(); }],
  ['offset1290 wide', () => { push(); translate(-40, -1290); CIRC(330, 1395); CIRC(2000, 1395); pop(); }],
];
RR.scene({ id: 'test_fbexp2', order: 1, dur: 2, draw(t) {
  EXP2.forEach(([name, fn], i) => {
    const spr = RR.sprite('exp2' + i, 2320, 200, fn, { res: 1.5 });
    const y = 100 + i * 240;
    RR.drawSprite(spr, 960, y, { w: 1800, h: 1800 * 200 / 2320 });
    RR.text(name, 960, y + 110, { size: 30 });
  });
}});
