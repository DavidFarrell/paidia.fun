// Paints the p5.brush assets into assets/*.png.
// Usage: node tools/paint.mjs [name ...]   (no names = all assets)
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { startServer, CHROMIUM, ROOT } from './server.mjs';

const src = fs.readFileSync(path.join(ROOT, 'paint/assets.js'), 'utf8');
const all = [...src.matchAll(/^  (\w+): \{$/gm)].map((m) => m[1]);
const names = process.argv.slice(2).length ? process.argv.slice(2) : all;

const { server, port } = await startServer();
const browser = await chromium.launch(CHROMIUM);
let failed = 0;
for (const name of names) {
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.error(`[${name}] pageerror:`, e.message));
  page.on('console', (m) => { if (m.type() === 'error') console.error(`[${name}]`, m.text()); });
  const t0 = Date.now();
  await page.goto(`http://127.0.0.1:${port}/paint/paint.html?asset=${name}`, { waitUntil: 'commit', timeout: 120e3 });
  try {
    await page.waitForFunction(() => window.done || window.failed, null, { timeout: 20 * 60e3, polling: 250 });
    const err = await page.evaluate(() => window.failed);
    if (err) throw new Error(err);
    console.log(`painted ${name} in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  } catch (e) {
    failed++;
    console.error(`FAILED ${name}:`, e.message);
  }
  await page.close();
}
await browser.close();
server.close();
process.exit(failed ? 1 : 0);
