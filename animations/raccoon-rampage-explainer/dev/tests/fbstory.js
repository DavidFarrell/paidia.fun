RR.scene({ id: 'test_fbstory', order: 1, dur: 2, draw(t) {
  const spr = RR.board.sectionSprite('story', 'hi');
  RR.drawSprite(spr, 960, 160, { w: 1900, h: 1900 * 200 / 2320 });
  // show the raw scratch (last tile painted) underneath
  RR.flush(); push(); imageMode(CORNER); image(RR._scratchFb, 0, 360, 960, 540); pop();
  RR.flush(); noFill(); stroke(255, 0, 0); strokeWeight(2); rect(0, 360, 960, 540); noStroke();
}});
