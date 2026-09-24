// Writes out/timeline.json (scene starts, lengths, moods and transitions)
// without rendering anything. Usage: node tools/timeline.mjs
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { startServer, CHROMIUM, ROOT } from './server.mjs';

const { server, port } = await startServer();
const browser = await chromium.launch(CHROMIUM);
const page = await browser.newPage();
await page.goto(`http://127.0.0.1:${port}/src/index.html?render=1`);
await page.waitForFunction(() => window.READY === true, null, { timeout: 120e3 });
const tl = await page.evaluate(() => window.getTimeline());
fs.mkdirSync(path.join(ROOT, 'out'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'out/timeline.json'), JSON.stringify(tl, null, 1));
console.log(`${tl.total} frames, ${tl.scenes.length} scenes`);
await browser.close();
server.close();
