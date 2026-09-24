// PLACEHOLDER - scene 2: How it started. See STORYBOARD.md.
RR.scene({
  id: 's02_history', order: 2, dur: 12,
  cues: [],
  draw(t) {
    RR.text('How it started', RR.W / 2, RR.H / 2, { font: 'title', size: 90, col: RR.C.plum });
    RR.text('placeholder ' + t.toFixed(1) + ' s', RR.W / 2, RR.H / 2 + 90, { size: 44 });
  },
});
