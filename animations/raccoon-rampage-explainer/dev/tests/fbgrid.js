const SIZES = [[570, 870, 1.5], [2320, 200, 1.5], [470, 900, 0.7], [400, 300, 1], [2320, 390, 1.5]];
RR.scene({ id: 'test_fbgrid', order: 1, dur: 2, draw(t) {
  SIZES.forEach(([w, h, res], si) => {
    const spr = RR.sprite('grid' + si, w, h, () => {
      RR.water(RR.rrectPts(0, 0, w, h, 10), '#cccccc', { layers: 2, alpha: 120 });
      const n = 8;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        const x = (i + 0.5) * w / n, y = (j + 0.5) * h / n;
        RR.inkCircle(x, y, Math.min(w, h) / n * 0.35, { fill: j % 2 ? '#e0556f' : '#4f7fbd', w: 0.8 });
        if ((i + j) % 3 === 0) RR.text('x', x, y, { size: 12 });
      }
    }, { res });
    const scale = Math.min(360 / w, 500 / h);
    const x = 30 + [0, 400, 800, 1200, 1500][si] + w * scale / 2, y = 300 + (si === 1 || si === 4 ? (si === 1 ? 300 : 500) : 0);
    RR.drawSprite(spr, x, y, { w: w * scale, h: h * scale });
  });
}});
