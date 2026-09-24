window.PROF = {};
RR.scene({ id: 'edge2', order: 1, dur: 4, draw(t) {
  const gl = drawingContext; const px = new Uint8Array(4);
  const sync = () => { RR.flush(); gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px); };
  const orig = RR.ink, origL = RR.inkLine; const log = [];
  let n = 0;
  RR.ink = (pts, o) => { sync(); const t0 = performance.now(); orig(pts, o); sync(); const dt = performance.now() - t0; const st = p5.instance._renderer.states.uModelMatrix.mat4; const ys = pts.map(p => st[1]*p[0]+st[5]*p[1]+st[13]+540); log.push([n++, Math.round(dt), 'ink', o && o.fill, Math.round(Math.min(...ys)), Math.round(Math.max(...ys))]); };
  RR.inkLine = (pts, o) => { sync(); const t0 = performance.now(); origL(pts, o); sync(); const dt = performance.now() - t0; log.push([n++, Math.round(dt), 'line']); };
  RR.drawRaccoon(900, 1150, 1.3, {});
  RR.ink = orig; RR.inkLine = origL;
  PROF.slow = log.filter(r => r[1] > 40);
  PROF.total = log.reduce((a, r) => a + r[1], 0);
}});
