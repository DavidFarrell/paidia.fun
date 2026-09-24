RR.scene({ id: 'flurry', order: 1, dur: 4, draw(t) {
  const st = t < 0.45 ? RR.board.STATES.S5 : RR.board.STATES.MID;
  RR.withCam(RR.cam(1200, 750, 0.66), () => RR.board.drawState(st));
  RR.flurry(t, 0, 0.9);
  if (t > 2) RR.wipe(RR.seg(t, 2, 3), { dir: 1 });
}});
