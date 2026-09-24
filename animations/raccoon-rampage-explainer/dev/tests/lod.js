RR.scene({ id: 'lod', order: 1, dur: 4, draw(t) {
  const z = t < 1 ? 0.79 : 0.81;
  RR.withCam(RR.cam(1200, 750, z), () => { RR.board.drawStatic(); });
  RR.drawCard('protect', 300, 400, { w: 220, lod: 'lo' });
  RR.drawCard('protect', 560, 400, { w: 220, lod: 'hi' });
}});
