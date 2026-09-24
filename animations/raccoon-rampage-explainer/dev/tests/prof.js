window.PROF = {};
const tm = (k, fn) => { const gl = drawingContext; const px = new Uint8Array(4); RR.flush(); gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px); const t0 = performance.now(); fn(); RR.flush(); gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px); PROF[k] = Math.round(performance.now() - t0); };
RR.scene({ id: 'prof', order: 1, dur: 10, draw(t) {
  tm('text1', () => RR.text('RACCOON', 500, 300, { font: 'title', size: 200 }));
  tm('text14', () => { for (let i = 0; i < 14; i++) RR.text('R', 100 + i * 60, 500, { font: 'title', size: 200 }); });
  tm('textOutline', () => RR.text('R', 900, 700, { font: 'title', size: 200, outline: RR.C.ink, outlineW: 7, shadow: true }));
  tm('raccoon', () => RR.drawRaccoon(1400, 900, 1.7, RR.raccoonIdle(t, { hold: 'burger', armF: 1.7 })));
  tm('person', () => RR.drawPerson('de', 1700, 1000, 1.2, RR.personIdle(t, 0, { prop: 'clipboard', armR: 0.9 })));
  tm('ink10', () => { for (let i = 0; i < 10; i++) RR.inkCircle(100 + i * 50, 900, 20, { fill: '#e0556f' }); });
  tm('flat10', () => { for (let i = 0; i < 10; i++) RR.flatEllipse(100 + i * 50, 1000, 20, 20, '#4f7fbd'); });
  tm('sprite10', () => { for (let i = 0; i < 10; i++) RR.drawCube(100 + i * 50, 800, 40, 'de'); });
  tm('grain', () => { push(); blendMode(MULTIPLY); image(RR.img.grain, 0, 0, RR.W, RR.H); blendMode(BLEND); pop(); });
}});
