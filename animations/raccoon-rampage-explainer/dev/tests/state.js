RR.scene({ id: 'state', order: 1, dur: 4, draw(t) {
  const st = RR.board.clone(RR.board.SETUP);
  st.story[0] = 'corprelief';
  st.queue[1].votes = ['corp']; st.queue[3].votes = ['corp', 'hu'];
  RR.withCam(t < 1 ? RR.cam(1200, 750, 0.66) : RR.cam(1500, 300, 1.4), () => RR.board.drawState(st));
}});
