RR.scene({ id: 'test_raccoon', order: 1, dur: 4, draw(t) {
  const poses = [
    { mouth: 'smile' },
    { mouth: 'grin', brow: 'sly', look: [1, 0], hold: 'burger', armF: 1.9 },
    { mouth: 'cackle', eyes: 'happy', armF: 2.6, armB: 2.4, tailUp: 1 },
    { mouth: 'o', eyes: 'wide', brow: 'up', face: -1 },
    { run: t * 9, mouth: 'open', lean: 0.2 },
    { mouth: 'frown', brow: 'worried', squash: 0.2, hold: 'trophy', armF: 2.2 },
  ];
  poses.forEach((p, i) => {
    const x = 200 + (i % 3) * 600, y = 470 + Math.floor(i / 3) * 480;
    RR.shadow(x, y, 70, 14);
    RR.drawRaccoon(x, y, 1.6, { ...RR.raccoonIdle(t), ...p });
  });
}});
