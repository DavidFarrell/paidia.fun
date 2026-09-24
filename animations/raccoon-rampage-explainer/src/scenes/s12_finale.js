// PLACEHOLDER - scene 12: Finale. See STORYBOARD.md.
RR.scene({
  id: 's12_finale', order: 12, dur: 12,
  cues: [],
  draw(t) {
    RR.text('Finale', RR.W / 2, RR.H / 2, { font: 'title', size: 90, col: RR.C.plum });
    RR.text('placeholder ' + t.toFixed(1) + ' s', RR.W / 2, RR.H / 2 + 90, { size: 44 });
  },
});
