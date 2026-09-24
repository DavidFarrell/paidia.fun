RR.scene({ id: 'test_board', order: 1, dur: 4, draw(t) {
  const cam = RR.cam(1200, 750, 0.66);
  RR.withCam(cam, () => {
    RR.board.drawStatic();
    RR.board.drawTokens({ de: 10, fr: 5, roe: 5 });
    RR.board.drawQueue([
      { id: 'protect', k: 1 }, { id: 'burgers', k: 2 }, { id: 'pets', k: 3 }, { id: 'wear', k: 4 },
      { id: 'drones', k: 5 }, { id: 'back:policy', k: 6 }, { id: 'back:policy', k: 7 }, { id: 'back:policy', k: 8 },
    ]);
    RR.board.cubesOnCard(...RR.board.slot(1), ['de', 'de', 'de', 'fr', 'ar']);
    RR.board.drawTracker(0);
    RR.drawCard('corprelief', ...RR.board.story(0), { w: 300 });
    for (let i = 1; i < 5; i++) RR.drawCard('back:event', ...RR.board.story(i), { w: 300 });
    RR.drawCard('back:spread', ...RR.board.DECK, { w: 190 });
    RR.drawCard('rules', ...RR.board.RULES, { w: 170 });
    RR.drawCube(RR.board.PROT[0] - 30, RR.board.PROT[1] + 10, 40, 'de');
  });
}});
