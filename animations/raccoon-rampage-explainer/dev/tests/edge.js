window.PROF = {};
const tm = (k, fn) => { const gl = drawingContext; const px = new Uint8Array(4); RR.flush(); gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px); const t0 = performance.now(); fn(); RR.flush(); gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px); PROF[k] = Math.round(performance.now() - t0); };
const E = (y) => RR.ellipsePts(500, y, 60, 40, 20);
RR.scene({ id: 'edge', order: 1, dur: 4, draw(t) {
  tm('washIn', () => RR.ink(E(900), { fill: '#e0556f', stroke: false }));
  tm('washEdge', () => RR.ink(E(1080), { fill: '#e0556f', stroke: false }));
  tm('strokeIn', () => RR.ink(E(900), { stroke: RR.C.ink }));
  tm('strokeEdge', () => RR.ink(E(1080), { stroke: RR.C.ink }));
  tm('lineEdge', () => RR.inkLine([[700, 1050], [800, 1110]], {}));
  tm('washTop', () => RR.ink(E(0), { fill: '#e0556f', stroke: false }));
  tm('washLeft', () => { push(); translate(-500, 0); RR.ink(E(500), { fill: '#e0556f', stroke: false }); pop(); });
}});
