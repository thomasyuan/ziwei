// 极简静态服务器，用于验证 out/（GitHub Pages 等价环境）
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = 'out', PORT = 3996;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.txt': 'text/plain', '.xml': 'application/xml', '.json': 'application/json' };

createServer((req, res) => {
  const raw = decodeURIComponent(req.url.split('?')[0]);
  const path = raw.startsWith('/ziwei') ? raw.slice(6) || '/' : raw;
  const cands = [join(ROOT, path), join(ROOT, path + '.html'), join(ROOT, path, 'index.html')];
  const file = cands.find(f => existsSync(f) && f.endsWith('.html')) ?? cands.find(f => existsSync(f));
  if (!file) { res.writeHead(404).end('404'); return; }
  const ext = file.slice(file.lastIndexOf('.'));
  res.writeHead(200, { 'Content-Type': MIME[ext] ?? 'application/octet-stream' });
  res.end(readFileSync(file));
}).listen(PORT, () => console.log('static out/ on', PORT));
