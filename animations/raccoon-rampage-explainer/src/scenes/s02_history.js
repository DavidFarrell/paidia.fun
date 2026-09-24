// Scene 2 (10-22 s): how it started. DRAFT
(() => {
  RR.scene({
    id: 's02_history', order: 2, dur: 12, music: 'history',
    cues: [],
    draw(t) {
      const B = RR.board;
      const ed = B.lonlat(9.05, 51.18);
      const cam = t < 6 ? RR.cam(ed[0] + 100, ed[1] - 20, 3.5) : RR.cam(1150, 860, 1.2);
      RR.withCam(cam, () => {
        B.drawStatic({ only: ['map'] });
      });
    },
  });
})();
