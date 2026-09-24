// Tiny static file server used by the paint and render scripts.
// GET serves files from the project root. POST /save/<path> writes the body to
// <project>/<path> (restricted to assets/ and out/). Extra POST routes can be
// supplied by the caller (used by render.mjs to receive raw frames).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.otf': 'font/otf', '.ttf': 'font/ttf', '.css': 'text/css', '.wav': 'audio/wav',
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export function startServer(routes = {}) {
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      if (req.method === 'POST') {
        const body = await readBody(req);
        for (const [prefix, handler] of Object.entries(routes)) {
          if (url.pathname.startsWith(prefix)) {
            await handler(url, body);
            res.writeHead(200).end('ok');
            return;
          }
        }
        if (url.pathname.startsWith('/save/')) {
          const rel = decodeURIComponent(url.pathname.slice('/save/'.length));
          if (!/^(assets|out)\//.test(rel) || rel.includes('..')) throw new Error('bad path ' + rel);
          const dest = path.join(ROOT, rel);
          fs.mkdirSync(path.dirname(dest), { recursive: true });
          fs.writeFileSync(dest, body);
          res.writeHead(200).end('saved');
          return;
        }
        res.writeHead(404).end();
        return;
      }
      let rel = decodeURIComponent(url.pathname);
      if (rel.endsWith('/')) rel += 'index.html';
      const file = path.join(ROOT, rel);
      if (!file.startsWith(ROOT) || !fs.existsSync(file)) {
        res.writeHead(404).end('not found');
        return;
      }
      res.writeHead(200, {
        'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream',
        'Cache-Control': 'no-store',
      });
      fs.createReadStream(file).pipe(res);
    } catch (err) {
      console.error(err);
      res.writeHead(500).end(String(err));
    }
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}

// Launch options for the preinstalled Chromium with software WebGL.
export const CHROMIUM = {
  executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium',
  // WebGL (for p5.brush) runs on SwiftShader; 2D canvases use CPU raster,
  // which reads back pixels far faster than emulated-GPU 2D canvases.
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist', '--disable-gpu-vsync', '--disable-accelerated-2d-canvas',
    '--autoplay-policy=no-user-gesture-required'],
};
