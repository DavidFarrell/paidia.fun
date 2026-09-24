// PLACEHOLDER - scene 9: Step 2: main phase. See STORYBOARD.md.
RR.scene({
  id: 's09_main', order: 9, dur: 20,
  cues: [],
  draw(t) {
    RR.text('Step 2: main phase', RR.W / 2, RR.H / 2, { font: 'title', size: 90, col: RR.C.plum });
    RR.text('placeholder ' + t.toFixed(1) + ' s', RR.W / 2, RR.H / 2 + 90, { size: 44 });
  },
});
