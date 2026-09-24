// Renders selected frames to out/frames/<frame>.png for inspection, plus an
// optional contact sheet.
// Usage: node tools/preview.mjs 0 120 240 ...     (frame numbers)
//        node tools/preview.mjs --scene roles 6   (6 evenly spaced frames of a scene)
//        node tools/preview.mjs --every 90        (every 90th frame)
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { startServer, CHROMIUM, ROOT } from './server.mjs';

const args = process.argv.slice(2);
const { server, port } = await startServer();
const browser = await chromium.launch(CHROMIUM);
const page = await browser.newPage({ viewport: { width: 1920, height: 1200 } });
page.on('pageerror', (e) => console.error('pageerror:', e.message));
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.error('console:', m.text()); });
await page.goto(`http://127.0.0.1:${port}/src/index.html?render=1`);
await page.waitForFunction(() => window.READY === true, null, { timeout: 120e3 });
const tl = await page.evaluate(() => window.getTimeline());

let frames = [];
if (args[0] === '--scene') {
  const s = tl.scenes.find((x) => x.id === args[1]);
  if (!s) throw new Error('no scene ' + args[1] + '; have ' + tl.scenes.map((x) => x.id).join(', '));
  const n = parseInt(args[2] || '6', 10);
  for (let i = 0; i < n; i++) frames.push(s.start + Math.round((i / Math.max(1, n - 1)) * (s.len - 1)));
} else if (args[0] === '--every') {
  const k = parseInt(args[1], 10);
  for (let f = 0; f < tl.total; f += k) frames.push(f);
} else {
  frames = args.map(Number);
}

const outDir = path.join(ROOT, 'out/frames');
fs.mkdirSync(outDir, { recursive: true });
const t0 = Date.now();
for (const f of frames) {
  const b64 = await page.evaluate((f) => {
    renderFrame(f);
    return document.querySelector('#stage canvas').toDataURL('image/jpeg', 0.92).split(',')[1];
  }, f);
  fs.writeFileSync(path.join(outDir, `${String(f).padStart(5, '0')}.jpg`), Buffer.from(b64, 'base64'));
}
console.log(`rendered ${frames.length} frames in ${((Date.now() - t0) / 1000).toFixed(1)}s (total timeline ${tl.total} frames = ${(tl.total / 30).toFixed(1)}s)`);
console.log(frames.join(' '));
await browser.close();
server.close();
