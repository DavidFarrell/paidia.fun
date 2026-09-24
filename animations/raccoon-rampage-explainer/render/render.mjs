// Headless renderer: drives index.html?render=1 in Chromium (SwiftShader WebGL) and
// writes numbered JPEG frames. Parallel workers each take a contiguous frame range.
//
//   node render/render.mjs --from 0 --to 180 --workers 3 --out out/frames      (seconds)
//   node render/render.mjs --at 12.5,30,81 --out review --png                  (stills)
//   node render/render.mjs --timeline out/timeline.json                         (export cues)
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, arr) => {
  if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
  return acc;
}, []));
const FPS = 24;
const out = path.resolve(ROOT, args.out || 'out/frames');
const png = !!args.png;
const quality = parseFloat(args.quality || '0.95');

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.otf': 'font/otf', '.ttf': 'font/ttf' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const PORT = server.address().port;

async function openPage() {
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-driver-bug-workarounds'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', (e) => console.error('[pageerror]', e.message));
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') { const t = m.text(); if (!t.includes('GL Driver')) console.error('[console]', t); } });
  await page.goto(`http://localhost:${PORT}/${args.page || 'index.html'}${(args.page || '').includes('?') ? '&' : '?'}render=1`);
  await page.waitForFunction(() => window.READY === true, null, { timeout: 120000 });
  return { browser, page };
}

async function renderList(frames, label) {
  if (!frames.length) return;
  const { browser, page } = await openPage();
  let n = 0; const t0 = Date.now();
  for (const f of frames) {
    const file = path.join(out, `frame_${String(f).padStart(5, '0')}.${png ? 'png' : 'jpg'}`);
    if (!args.force && fs.existsSync(file)) continue;
    await page.evaluate((f) => window.renderFrame(f), f);
    const data = await page.evaluate(([png, q]) => window.grabFrame(png ? 'image/png' : 'image/jpeg', q), [png, quality]);
    fs.writeFileSync(file, Buffer.from(data.split(',')[1], 'base64'));
    n++;
    if (n % 24 === 0 || n === 1) console.log(`[${label}] frame ${f} (${n}/${frames.length}) avg ${((Date.now() - t0) / n / 1000).toFixed(2)} s/frame`);
  }
  await browser.close();
}

try {
  if (args.timeline) {
    const { browser, page } = await openPage();
    const tl = await page.evaluate(() => window.getTimeline());
    fs.mkdirSync(path.dirname(path.resolve(ROOT, args.timeline)), { recursive: true });
    fs.writeFileSync(path.resolve(ROOT, args.timeline), JSON.stringify(tl, null, 1));
    console.log('timeline written', tl.duration, 's', tl.cues.length, 'cues');
    await browser.close();
  } else {
    fs.mkdirSync(out, { recursive: true });
    let frames;
    if (args.at) frames = String(args.at).split(',').map((s) => Math.round(parseFloat(s) * FPS));
    else {
      const a = Math.round(parseFloat(args.from || '0') * FPS);
      const b = Math.round(parseFloat(args.to || '180') * FPS);
      const step = parseInt(args.step || '1', 10);
      frames = []; for (let f = a; f < b; f += step) frames.push(f);
    }
    const W = Math.max(1, parseInt(args.workers || '1', 10));
    const chunk = Math.ceil(frames.length / W);
    const t0 = Date.now();
    await Promise.all(Array.from({ length: W }, (_, i) => renderList(frames.slice(i * chunk, (i + 1) * chunk), `w${i}`)));
    console.log(`done ${frames.length} frames in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  }
} finally {
  server.close();
}
