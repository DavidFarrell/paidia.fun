// p5.js sketch: loads the painted assets and fonts, then exposes the render
// API used by tools/render.mjs and a small preview player.
const ASSET_NAMES = ['paper', 'mottle', 'mottle_fine', 'stroke_a', 'stroke_b', 'stroke_c', 'map', 'lavender'];
let MAPDATA = null;

async function setup() {
  pixelDensity(1);
  const cnv = createCanvas(W, H);
  cnv.parent(document.getElementById('stage'));
  MAIN = drawingContext;
  noLoop();
  await document.fonts.load(`64px Monthoers`);
  await document.fonts.load(`64px Joodles`);
  const loaded = await Promise.all(ASSET_NAMES.map((n) => loadImage(`../assets/${n}.png`).catch(() => null)));
  ASSET_NAMES.forEach((n, i) => { if (loaded[i]) IMAGES[n] = loaded[i].canvas || loaded[i].elt; });
  MAPDATA = await (await fetch('../data/europe.json')).json();
  P.init(IMAGES);
  buildTimeline();
  READY = true;
  window.READY = true;
  const q = new URLSearchParams(location.search);
  if (!q.has('render')) Preview.start(parseInt(q.get('f') || '0', 10));
}

function draw() {}

// API used by tools/render.mjs
window.renderAndGrab = function (F) {
  renderFrame(F);
  return MAIN.getImageData(0, 0, W, H).data;
};
window.getCues = () => [...CUES.values()].sort((a, b) => a.t - b.t);
window.getTimeline = () => ({ total: TOTAL, fps: FPS, scenes: SCENES.map((s) => ({ id: s.id, start: s.start, len: s.len, bars: s.bars, mood: s.mood })) });

// ---- simple preview player ----
const Preview = {
  f: 0, playing: false, last: 0,
  start(f) {
    this.f = f;
    const ui = document.getElementById('ui');
    if (!ui) return;
    ui.style.display = 'flex';
    const slider = document.getElementById('scrub');
    slider.max = TOTAL - 1;
    slider.oninput = () => { this.f = +slider.value; this.show(); };
    document.getElementById('play').onclick = () => this.toggle();
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') { this.toggle(); e.preventDefault(); }
      if (e.code === 'ArrowRight') { this.f = Math.min(TOTAL - 1, this.f + (e.shiftKey ? 30 : 1)); this.show(); }
      if (e.code === 'ArrowLeft') { this.f = Math.max(0, this.f - (e.shiftKey ? 30 : 1)); this.show(); }
    });
    this.show();
  },
  toggle() {
    this.playing = !this.playing;
    this.last = performance.now();
    if (this.playing) requestAnimationFrame(() => this.tick());
  },
  tick() {
    if (!this.playing) return;
    const now = performance.now();
    if (now - this.last >= 1000 / FPS) {
      this.last = now;
      this.f = (this.f + 1) % TOTAL;
      this.show();
    }
    requestAnimationFrame(() => this.tick());
  },
  show() {
    renderFrame(this.f);
    document.getElementById('scrub').value = this.f;
    const s = SCENES.find((x) => this.f >= x.start && this.f < x.start + x.len);
    document.getElementById('info').textContent =
      `frame ${this.f} / ${TOTAL}  ·  ${(this.f / FPS).toFixed(2)}s  ·  ${s ? s.id : ''} (${s ? this.f - s.start : 0})`;
  },
};
