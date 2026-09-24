// PLACEHOLDER - scene 3: The board and the goal. See STORYBOARD.md.
RR.scene({
  id: 's03_board', order: 3, dur: 14,
  cues: [],
  draw(t) {
    RR.text('The board and the goal', RR.W / 2, RR.H / 2, { font: 'title', size: 90, col: RR.C.plum });
    RR.text('placeholder ' + t.toFixed(1) + ' s', RR.W / 2, RR.H / 2 + 90, { size: 44 });
  },
});
