RR.scene({ id: 'blit', order: 1, dur: 2, draw(t) {
  RR.drawCard('protect', 500, 500, { w: 380, lod: 'hi' });
  const s = RR.cardSprite('protect', 'hi');
  RR.drawSprite(s, 1100, 500, { w: 380, h: 530, slow: true });
  RR.drawSprite(RR.tokenSprite('black'), 1500, 300, { w: 200, h: 200 });
  RR.drawSprite(RR.tokenSprite('black'), 1720, 300, { w: 200, h: 200, slow: true });
  RR.drawSprite(RR.tokenSprite('yellow'), 1500, 600, { w: 200, h: 200, alpha: 0.5 });
  RR.drawSprite(RR.tokenSprite('yellow'), 1720, 600, { w: 200, h: 200, alpha: 0.5, slow: true });
  RR.text('fast', 500, 850, { size: 50 }); RR.text('slow (p5 image)', 1100, 850, { size: 50 });
}});
