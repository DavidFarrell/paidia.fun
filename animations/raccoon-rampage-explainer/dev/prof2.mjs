import { chromium } from 'playwright';
import http from 'http'; import fs from 'fs'; import path from 'path';
const ROOT = process.cwd();
const server = http.createServer((req, res) => { const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0])); if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200); fs.createReadStream(p).pipe(res); });
await new Promise((r) => server.listen(0, r));
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=gl-egl', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
await page.goto(`http://localhost:${server.address().port}/dev/test.html?test=${process.argv[2] || 'prof'}&render=1`);
await page.waitForFunction(() => window.READY === true);
for (let f = 0; f < 4; f++) { const t0 = Date.now(); await page.evaluate((f) => window.renderFrame(f * 2), f); console.log('frame', f, Date.now() - t0, 'ms', JSON.stringify(await page.evaluate(() => window.PROF))); }
await browser.close(); server.close();
