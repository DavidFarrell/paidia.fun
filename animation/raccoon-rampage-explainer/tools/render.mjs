// Renders the animation to MP4 with several headless Chromium workers.
// Each worker renders a contiguous chunk of frames and streams raw RGBA
// frames to its own ffmpeg (H.264) process; the chunks are then joined.
// Also writes out/cues.json (audio cues) and out/timeline.json.
//
// Usage: node tools/render.mjs [--workers 3] [--from 0] [--to N] [--crf 17] [--out out/video_silent.mp4]
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { startServer, CHROMIUM, ROOT } from './server.mjs';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const WORKERS = parseInt(arg('workers', '3'), 10);
const CRF = arg('crf', '17');
const OUT = path.resolve(ROOT, arg('out', 'out/video_silent.mp4'));
const outDir = path.join(ROOT, 'out');
fs.mkdirSync(outDir, { recursive: true });

const encoders = [];
function encoder(k) {
  const file = path.join(outDir, `chunk_${k}.mp4`);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', '1920x1080', '-r', '30', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', CRF, '-pix_fmt', 'yuv420p', '-threads', '1', file], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((res, rej) => ff.on('close', (c) => (c === 0 ? res(file) : rej(new Error('ffmpeg ' + c)))));
  return { ff, file, done };
}

const { server, port } = await startServer({
  '/frame/': async (url, body) => {
    const k = parseInt(url.pathname.split('/')[2], 10);
    const enc = encoders[k];
    if (!enc.ff.stdin.write(body)) await new Promise((r) => enc.ff.stdin.once('drain', r));
  },
});

// find the timeline length
const probe = await chromium.launch(CHROMIUM);
const pp = await probe.newPage();
await pp.goto(`http://127.0.0.1:${port}/src/index.html?render=1`);
await pp.waitForFunction(() => window.READY === true, null, { timeout: 120e3 });
const timeline = await pp.evaluate(() => window.getTimeline());
await probe.close();
const F0 = parseInt(arg('from', '0'), 10);
const F1 = Math.min(timeline.total, parseInt(arg('to', String(timeline.total)), 10));
const n = F1 - F0;
console.log(`rendering frames ${F0}..${F1 - 1} (${(n / 30).toFixed(1)}s) with ${WORKERS} workers`);

const t0 = Date.now();
let doneFrames = 0;
const allCues = new Map();
async function worker(k, a, b) {
  encoders[k] = encoder(k);
  const browser = await chromium.launch(CHROMIUM);
  const page = await browser.newPage({ viewport: { width: 1920, height: 1200 } });
  page.on('pageerror', (e) => console.error(`[w${k}] pageerror:`, e.message));
  await page.goto(`http://127.0.0.1:${port}/src/index.html?render=1`);
  await page.waitForFunction(() => window.READY === true, null, { timeout: 120e3 });
  for (let f = a; f < b; f++) {
    await page.evaluate(async ([f, k]) => {
      renderFrame(f);
      const d = MAIN.getImageData(0, 0, W, H).data;
      await fetch('/frame/' + k, { method: 'POST', body: d });
    }, [f, k]);
    doneFrames++;
    if (doneFrames % 60 === 0) {
      const el = (Date.now() - t0) / 1000;
      console.log(`${doneFrames}/${n} frames, ${el.toFixed(0)}s elapsed, ~${((n - doneFrames) * el / doneFrames).toFixed(0)}s left`);
    }
  }
  for (const c of await page.evaluate(() => window.getCues())) allCues.set(c.name + '@' + c.frame, c);
  await browser.close();
  encoders[k].ff.stdin.end();
  return encoders[k].done;
}

const per = Math.ceil(n / WORKERS);
const files = await Promise.all(Array.from({ length: WORKERS }, (_, k) => worker(k, F0 + k * per, Math.min(F1, F0 + (k + 1) * per))));
server.close();

const list = path.join(outDir, 'chunks.txt');
fs.writeFileSync(list, files.map((f) => `file '${f}'`).join('\n'));
await new Promise((res, rej) => spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', OUT], { stdio: 'inherit' })
  .on('close', (c) => (c === 0 ? res() : rej(new Error('concat failed')))));
for (const f of files) fs.unlinkSync(f);
fs.unlinkSync(list);
const cues = [...allCues.values()].sort((x, y) => x.t - y.t);
if (F0 === 0 && F1 === timeline.total) fs.writeFileSync(path.join(outDir, 'cues.json'), JSON.stringify(cues, null, 1));
fs.writeFileSync(path.join(outDir, 'timeline.json'), JSON.stringify(timeline, null, 1));
console.log(`wrote ${OUT} in ${((Date.now() - t0) / 1000).toFixed(0)}s; ${cues.length} audio cues`);
