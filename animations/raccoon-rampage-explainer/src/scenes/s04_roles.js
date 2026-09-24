// PLACEHOLDER - scene 4: Meet the roles. See STORYBOARD.md.
RR.scene({
  id: 's04_roles', order: 4, dur: 20,
  cues: [],
  draw(t) {
    RR.text('Meet the roles', RR.W / 2, RR.H / 2, { font: 'title', size: 90, col: RR.C.plum });
    RR.text('placeholder ' + t.toFixed(1) + ' s', RR.W / 2, RR.H / 2 + 90, { size: 44 });
  },
});
