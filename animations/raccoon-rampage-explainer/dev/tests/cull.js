window.PROF = {};
const tm = (k, fn) => { const gl = drawingContext; const px = new Uint8Array(4); RR.flush(); gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px); const t0 = performance.now(); fn(); RR.flush(); gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px); PROF[k] = Math.round(performance.now() - t0); };
RR.scene({ id: 'cull', order: 1, dur: 4, draw(t) {
  tm('onscreen', () => RR.drawRaccoon(400, 900, 1.3, {}));
  tm('feetBelow', () => RR.drawRaccoon(900, 1150, 1.3, {}));
  tm('mostlyOff', () => RR.drawRaccoon(1400, 1400, 1.3, {}));
  tm('allOff', () => RR.drawRaccoon(1400, 2000, 1.3, {}));
  RR.inkCircle(-200, 500, 50, { fill: '#f00' }); // should be culled
  RR.inkCircle(100, 100, 50, { fill: '#0a0' });  // visible
}});
