window.PROF = {};
const tm = (k, fn) => { const gl = drawingContext; const px = new Uint8Array(4); RR.flush(); gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px); const t0 = performance.now(); fn(); RR.flush(); gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px); PROF[k] = Math.round(performance.now() - t0); };
RR.scene({ id: 'prof2', order: 1, dur: 10, draw(t) {
  tm('bgcolour', () => background(241, 232, 218));
  tm('paperImg', () => image(RR.img.paper, 0, 0, RR.W, RR.H));
  tm('halfImg', () => image(RR.img.paper, 0, 0, RR.W / 2, RR.H));
  tm('rect', () => { fill(200); noStroke(); rect(0, 0, RR.W, RR.H); });
  tm('multiply', () => { push(); blendMode(MULTIPLY); image(RR.img.grain, 0, 0, RR.W, RR.H); blendMode(BLEND); pop(); });
}});
