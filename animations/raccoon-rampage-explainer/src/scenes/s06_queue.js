// PLACEHOLDER - scene 6: Step 1: queue phase. See STORYBOARD.md.
RR.scene({
  id: 's06_queue', order: 6, dur: 14,
  cues: [],
  draw(t) {
    RR.text('Step 1: queue phase', RR.W / 2, RR.H / 2, { font: 'title', size: 90, col: RR.C.plum });
    RR.text('placeholder ' + t.toFixed(1) + ' s', RR.W / 2, RR.H / 2 + 90, { size: 44 });
  },
});
