RR.scene({ id: 'prims', order: 1, dur: 2, draw(t) {
  RR.text('text hand', 200, 100, { size: 50 });
  RR.text('TITLE', 600, 100, { font: 'title', size: 80 });
  RR.flatEllipse(200, 250, 60, 40, '#e0556f');
  RR.flat([[400, 200], [520, 220], [470, 320]], '#4f7fbd');
  RR.ink(RR.ellipsePts(700, 260, 70, 50), { fill: '#6fb3a8' });
  RR.water(RR.ellipsePts(950, 260, 80, 60), '#e9b52f', { layers: 10, alpha: 40 });
  RR.drawCube(1200, 260, 90, 'fr');
  RR.drawToken(1400, 260, 90, 'yellow');
  RR.icon('paw', 1600, 260, 100);
  RR.drawCard('protect', 300, 600, { w: 200 });
  RR.drawCard('back:policy', 600, 600, { w: 200, flip: 0 });
  RR.shadow(900, 700, 100, 30, 80);
  RR.drawRaccoon(1200, 800, 1.2, {});
  RR.drawPerson('fr', 1600, 900, 1.2, {});
  RR.caption('A caption strip', t, 0, 2, { y: 1000 });
  RR.withCam(RR.cam(960, 540, 1.3), () => { RR.text('in camera', 960, 480, { size: 40, col: '#c00' }); RR.flatEllipse(900, 440, 20, 20, '#0a0'); });
}});
