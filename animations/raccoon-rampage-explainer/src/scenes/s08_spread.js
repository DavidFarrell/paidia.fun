// PLACEHOLDER - scene 8: Evaluation: fail, then spread. See STORYBOARD.md.
RR.scene({
  id: 's08_spread', order: 8, dur: 24,
  cues: [],
  draw(t) {
    RR.text('Evaluation: fail, then spread', RR.W / 2, RR.H / 2, { font: 'title', size: 90, col: RR.C.plum });
    RR.text('placeholder ' + t.toFixed(1) + ' s', RR.W / 2, RR.H / 2 + 90, { size: 44 });
  },
});
