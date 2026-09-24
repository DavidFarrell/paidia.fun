RR.scene({ id: 'newcards2', order: 1, dur: 2, draw(t) {
  ['anim', 'steril', 'land', 'helpline'].forEach((id, i) => RR.drawCard(id, 300 + i * 440, 520, { w: 380, lod: 'hi' }));
}});
