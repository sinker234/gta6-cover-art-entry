// Local preview server for Neon Coast Cover Studio (Node 22, stdlib only).
// Run `node serve.ts` (optionally `--port 8090`) and open the printed address.
// It streams files out of app/ with a small MIME table, answers 404 for
// anything missing, and refuses paths that try to escape the app folder.

import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = resolve(fileURLToPath(new URL('./app', import.meta.url)));
const argv = process.argv.slice(2);
const portFlag = argv.indexOf('--port');
const wanted = portFlag === -1 ? 8080 : Number(argv[portFlag + 1]);
const listenPort = Number.isInteger(wanted) && wanted > 0 && wanted < 65536 ? wanted : 8080;

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.bin': 'application/octet-stream',
  '.wasm': 'application/wasm',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.txt': 'text/plain; charset=utf-8',
};

const server = createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  let pathname: string;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    res.writeHead(400).end('bad request');
    return;
  }
  if (pathname.endsWith('/')) pathname += 'index.html';
  const target = resolve(join(appRoot, normalize(pathname)));
  if (target !== appRoot && !target.startsWith(appRoot + sep)) {
    res.writeHead(403).end('forbidden');
    return;
  }
  let length: number;
  try {
    const info = statSync(target);
    if (!info.isFile()) throw new Error('directory');
    length = info.size;
  } catch {
    res.writeHead(404).end('not found');
    return;
  }
  res.writeHead(200, {
    'content-type': CONTENT_TYPES[extname(target).toLowerCase()] ?? 'application/octet-stream',
    'content-length': length,
    'cache-control': 'no-store',
  });
  createReadStream(target).pipe(res);
});

server.listen(listenPort, '127.0.0.1', () => {
  console.log(`Neon Coast Cover Studio at http://localhost:${listenPort}`);
});
