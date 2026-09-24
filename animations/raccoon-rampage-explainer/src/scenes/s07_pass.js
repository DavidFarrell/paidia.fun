// PLACEHOLDER - scene 7: Evaluation: pass. See STORYBOARD.md.
RR.scene({
  id: 's07_pass', order: 7, dur: 16,
  cues: [],
  draw(t) {
    RR.text('Evaluation: pass', RR.W / 2, RR.H / 2, { font: 'title', size: 90, col: RR.C.plum });
    RR.text('placeholder ' + t.toFixed(1) + ' s', RR.W / 2, RR.H / 2 + 90, { size: 44 });
  },
});
