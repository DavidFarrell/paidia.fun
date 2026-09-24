RR.scene({ id: 'uic', order: 1, dur: 4, draw(t) {
  RR.board && RR.withCam(RR.cam(1200, 750, 0.66), () => RR.board.drawStatic());
  RR.banner('STEP 1: QUEUE PHASE', t, 0, 4, {});
  RR.caption('Enough votes? It passes!', t, 0, 4, {});
  RR.stamp('PASSED', 500, 500, t, 0.1, {});
  RR.stamp('FAILED', 1400, 500, t, 0.1, { kind: 'fail' });
  RR.badge(3, 960, 600, {});
}});
