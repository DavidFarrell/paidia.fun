RR.scene({ id: 'test_icons', order: 1, dur: 2, draw(t) {
  const names = ['raccoonFace','paw','crosshair','skull','shield','mitigate','star','briefcase','fist','hunterDie','d6','crown','heart','tick','cross','arrow'];
  names.forEach((n, i) => {
    const x = 140 + (i % 8) * 230, y = 200 + Math.floor(i / 8) * 260;
    push(); translate(x, y); RR.ICONS[n](70, {}); pop();
    RR.text(n, x, y + 110, { size: 28 });
  });
  RR.icon('role', 200, 800, 120, { role: 'de' }); RR.icon('role', 400, 800, 120, { role: 'fr' });
  RR.icon('role', 600, 800, 120, { role: 'ar' }); RR.icon('role', 800, 800, 120, { role: 'hu' });
  RR.icon('scoreStar', 1000, 800, 120, { role: 'ar' }); RR.icon('scoreStar', 1200, 800, 120, { role: 'hu' });
  RR.text('RACCOON RAMPAGE 123 + !?', 1500, 820, { font: 'title', size: 60 });
  RR.text('Enough votes? It passes! 1.5 million', 1500, 900, { font: 'hand', size: 44 });
  RR.ink(RR.rrectPts(1300, 950, 400, 90, 20), { fill: RR.C.pink, alpha: 255 });
}});
