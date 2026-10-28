import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { outputRoot } from './build.mjs';

const port = Number(process.env.PORT || 4176);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.woff': 'font/woff', '.woff2': 'font/woff2' };

http.createServer(async (request, response) => {
  try {
    if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405).end(); return; }
    let pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (pathname === '/TrendHunter') { response.writeHead(302, { Location: '/TrendHunter/' }).end(); return; }
    if (pathname.startsWith('/TrendHunter/')) pathname = pathname.slice('/TrendHunter'.length);
    let target = path.resolve(outputRoot, '.' + pathname);
    if (target !== outputRoot && !target.startsWith(outputRoot + path.sep)) { response.writeHead(403).end(); return; }
    if ((await stat(target)).isDirectory()) target = path.join(target, 'index.html');
    const content = await readFile(target);
    response.writeHead(200, { 'Content-Type': types[path.extname(target)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    response.end(request.method === 'HEAD' ? undefined : content);
  } catch { response.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found'); }
}).listen(port, '127.0.0.1', () => console.log(`TrendHunter: http://127.0.0.1:${port}/TrendHunter/`));
