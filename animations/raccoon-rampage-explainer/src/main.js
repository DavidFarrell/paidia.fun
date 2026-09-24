// p5 entry point. Headless rendering calls window.renderFrame(n); opening index.html
// in a browser gives a slow real-time preview with a scrubber (see index.html).

const params = new URLSearchParams(location.search);
RR.PREVIEW = !params.has('render');
RR.frame = 0;
RR.boilIndex = 0;
RR.frameSeed = 1;

async function setup() {
  createCanvas(RR.W, RR.H, WEBGL);
  pixelDensity(1);
  RR.fonts.title = await loadFont((RR.BASE || '') + 'assets/fonts/Monthoers.otf');
  RR.fonts.hand = await loadFont((RR.BASE || '') + 'assets/fonts/PatrickHand-Regular.ttf');
  RR.fonts.bold = await loadFont((RR.BASE || '') + 'assets/fonts/Kalam-Bold.ttf');
  RR.img.paper = await loadImage((RR.BASE || '') + 'assets/paper.jpg');
  RR.img.grain = await loadImage((RR.BASE || '') + 'assets/grain.png');
  RR.initBrushes();
  for (const f of RR.INITS) f();
  noLoop();
  window.READY = true;
  if (RR.PREVIEW && window.previewReady) window.previewReady();
}

function draw() {
  const f = RR.frame;
  RR.T = f / RR.FPS;
  RR.boilIndex = Math.floor(f / RR.BOIL);
  RR.frameSeed = RR.boilIndex * 7919 + 17;
  RR._spriteCalls = 0;
  randomSeed(RR.frameSeed);
  noiseSeed(3);
  clear();
  push();
  translate(-RR.W / 2, -RR.H / 2);
  RR.blit(RR.img.paper, 0, 0, RR.W, RR.H);
  RR.drawScene(RR.T);
  RR.flush();
  // Paper tooth and vignette over everything.
  push();
  blendMode(MULTIPLY);
  RR.blit(RR.img.grain, 0, 0, RR.W, RR.H);
  blendMode(BLEND);
  pop();
  if (RR.PREVIEW && RR.showHud) {
    RR.text(`${RR.T.toFixed(2)}s  f${f}  ${RR.curScene ? RR.curScene.id : ''}`, 20, 40, { font: 'hand', size: 30, align: 'left', col: '#c00' });
  }
  pop();
}

// Render frame n and wait for the GPU to finish.
window.renderFrame = async (n) => {
  RR.frame = n;
  await redraw();
  const gl = drawingContext;
  const px = new Uint8Array(4);
  gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
  return true;
};
window.grabFrame = (type = 'image/jpeg', q = 0.95) => document.getElementById('defaultCanvas0').toDataURL(type, q);
window.getTimeline = () => RR.exportTimeline();
