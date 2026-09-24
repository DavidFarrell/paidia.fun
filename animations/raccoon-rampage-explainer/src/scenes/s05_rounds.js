// PLACEHOLDER - scene 5: Rounds and storyline. See STORYBOARD.md.
RR.scene({
  id: 's05_rounds', order: 5, dur: 10,
  cues: [],
  draw(t) {
    RR.text('Rounds and storyline', RR.W / 2, RR.H / 2, { font: 'title', size: 90, col: RR.C.plum });
    RR.text('placeholder ' + t.toFixed(1) + ' s', RR.W / 2, RR.H / 2 + 90, { size: 44 });
  },
});
