// Per-function frame profiler: node dev/fprof.mjs <seconds> [page]
import { chromium } from 'playwright';
import http from 'http'; import fs from 'fs'; import path from 'path';
const ROOT = process.cwd();
const server = http.createServer((req, res) => { const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0])); if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200); fs.createReadStream(p).pipe(res); });
await new Promise((r) => server.listen(0, r));
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
await page.goto(`http://localhost:${server.address().port}/${process.argv[3] || 'index.html'}?render=1`);
await page.waitForFunction(() => window.READY === true);
const T = parseFloat(process.argv[2] || '5');
const res = await page.evaluate(async (T) => {
  const names = ['ink', 'inkLine', 'drawSprite', 'text', 'flat', 'flatEllipse', 'water', 'shadow', 'drawRaccoon', 'drawPerson', 'caption', 'banner', 'drawCard', 'sprite', 'blit', 'flush'];
  const acc = {}; let depth = 0;
  const gl = drawingContext; const px = new Uint8Array(4);
  const sync = () => gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
  for (const n of names) { const f = RR[n]; RR[n] = function (...a) { if (depth > 0) return f.apply(this, a); depth++; brush.flush(); sync(); const t0 = performance.now(); const r = f.apply(this, a); brush.flush(); sync(); acc[n] = (acc[n] || 0) + performance.now() - t0; acc[n + '#'] = (acc[n + '#'] || 0) + 1; depth--; return r; }; }
  const f0 = Math.round(T * 24);
  await window.renderFrame(f0);  // warm-up (sprite creation)
  for (const k in acc) delete acc[k];
  const t0 = performance.now(); await window.renderFrame(f0 + 1); const total = performance.now() - t0;
  const out = { total: Math.round(total) }; for (const k in acc) out[k] = Math.round(acc[k]); return out;
}, T);
console.log(JSON.stringify(res));
await browser.close(); server.close();
