// PLACEHOLDER - scene 10: Action cards. See STORYBOARD.md.
RR.scene({
  id: 's10_actions', order: 10, dur: 12,
  cues: [],
  draw(t) {
    RR.text('Action cards', RR.W / 2, RR.H / 2, { font: 'title', size: 90, col: RR.C.plum });
    RR.text('placeholder ' + t.toFixed(1) + ' s', RR.W / 2, RR.H / 2 + 90, { size: 44 });
  },
});
