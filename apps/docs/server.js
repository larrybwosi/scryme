import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3005;
const CLIENT_DIR = path.join(__dirname, 'dist/client');
const SERVER_ENTRY_PATH = path.join(__dirname, 'dist/server/server.js');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
};

let serverEntryPromise = null;

const getServerEntry = () => {
  if (!serverEntryPromise) {
    serverEntryPromise = import(SERVER_ENTRY_PATH).then((m) => m.default);
  }
  return serverEntryPromise;
};

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // 1. Health checks
  if (pathname === '/health' || pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  // 2. Serve static client assets if they exist
  const safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  const clientFilePath = path.join(CLIENT_DIR, safePath);

  if (fs.existsSync(clientFilePath) && fs.statSync(clientFilePath).isFile()) {
    const ext = path.extname(clientFilePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(clientFilePath).pipe(res);
    return;
  }

  // 3. Delegate to TanStack React Start SSR entry
  try {
    const serverEntry = await getServerEntry();
    const request = new Request(parsedUrl.toString(), {
      method: req.method,
      headers: req.headers,
    });

    const response = await serverEntry.fetch(request);

    res.statusCode = response.status;
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    if (response.body) {
      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
    }
    res.end();
  } catch (err) {
    console.error('Error handling SSR request in docs server:', err);
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Internal Server Error');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Docs app server running on http://0.0.0.0:${PORT}`);
  console.log(`Serving static assets from: ${CLIENT_DIR}`);
});
