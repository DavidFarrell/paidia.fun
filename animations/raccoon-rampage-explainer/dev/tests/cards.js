RR.scene({ id: 'test_cards', order: 1, dur: 2, draw(t) {
  const ids = ['protect','burgers','drones','wear','pets','behind','celeb','back:policy','spread0','spread1','spread2','back:spread','rules'];
  ids.forEach((id, i) => {
    const x = 120 + (i % 7) * 260, y = 190 + Math.floor(i / 7) * 330;
    RR.drawCard(id, x, y, { w: 225, lod: 'hi' });
  });
  RR.drawCard('corprelief', 1540, 870, { w: 330, lod: 'hi' });
  RR.drawCard('back:event', 1540, 1010, { w: 200 });
  ['de','fr','ar','hu','corp'].forEach((r, i) => RR.drawCube(1250 + i * 60, 850, 50, r));
  ['yellow','blue','black'].forEach((k, i) => RR.drawToken(1250 + i * 70, 930, 60, k));
  RR.drawDie(1270, 1020, 60, 'hunter', 'skull'); RR.drawDie(1340, 1020, 60, 'hunter', 'shield'); RR.drawDie(1410, 1020, 60, 'd6', 4);
  RR.drawMarker(1200, 1010, 70);
}});
