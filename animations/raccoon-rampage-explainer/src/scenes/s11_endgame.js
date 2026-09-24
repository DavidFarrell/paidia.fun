// PLACEHOLDER - scene 11: End of the game. See STORYBOARD.md.
RR.scene({
  id: 's11_endgame', order: 11, dur: 16,
  cues: [],
  draw(t) {
    RR.text('End of the game', RR.W / 2, RR.H / 2, { font: 'title', size: 90, col: RR.C.plum });
    RR.text('placeholder ' + t.toFixed(1) + ' s', RR.W / 2, RR.H / 2 + 90, { size: 44 });
  },
});
