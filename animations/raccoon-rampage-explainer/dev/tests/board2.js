RR.scene({ id: 'test_board2', order: 1, dur: 4, draw(t) {
  const cam = t < 1 ? RR.cam(2050, 900, 1.2) : RR.cam(600, 1300, 1.2);
  RR.withCam(cam, () => { RR.board.drawStatic({ lod: t < 2 ? 'hi' : 'lo' }); });
}});
