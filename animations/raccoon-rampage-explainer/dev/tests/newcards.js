RR.scene({ id: 'newcards', order: 1, dur: 2, draw(t) {
  ['bins', 'virus', 'crows', 'hobby', 'inaction', 'celeb', 'behind'].forEach((id, i) => RR.drawCard(id, 140 + i * 265, 330, { w: 240, lod: 'hi' }));
  ['corpself', 'bigfarm', 'burns'].forEach((id, i) => RR.drawCard(id, 330 + i * 620, 820, { w: 560, lod: 'hi' }));
}});
