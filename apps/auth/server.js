import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 4444;
const DIST_DIR = path.join(__dirname, 'dist');

const getTargetApiUrl = () => {
  const envUrl = process.env.VITE_PUBLIC_API_URL || process.env.VITE_API_URL;
  if (
    typeof envUrl === 'string' &&
    envUrl.trim() !== '' &&
    !envUrl.includes('PLACEHOLDER') &&
    (envUrl.startsWith('http://') || envUrl.startsWith('https://'))
  ) {
    return envUrl.trim().replace(/\/+$/, '');
  }
  return 'http://localhost:3002';
};

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

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // 1. Health checks
  if (pathname === '/health' || pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  // 2. Proxy /api/auth/* to NestJS auth endpoints with Set-Cookie preservation
  if (pathname.startsWith('/api/auth')) {
    const targetApi = getTargetApiUrl();
    const targetUrl = new URL(`${targetApi}${pathname}${parsedUrl.search}`);

    const forwardHeaders = { ...req.headers };
    delete forwardHeaders.host;

    try {
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      const bodyBuffer = Buffer.concat(chunks);

      const fetchOptions = {
        method: req.method,
        headers: forwardHeaders,
        redirect: 'manual',
      };

      if (!['GET', 'HEAD'].includes(req.method)) {
        fetchOptions.body = bodyBuffer;
      }

      const upstreamResponse = await fetch(targetUrl.toString(), fetchOptions);

      const responseHeaders = {};
      upstreamResponse.headers.forEach((value, key) => {
        if (key.toLowerCase() === 'set-cookie') {
          if (!responseHeaders['set-cookie']) {
            responseHeaders['set-cookie'] = [];
          }
          if (Array.isArray(responseHeaders['set-cookie'])) {
            responseHeaders['set-cookie'].push(value);
          } else {
            responseHeaders['set-cookie'] = [responseHeaders['set-cookie'], value];
          }
        } else {
          responseHeaders[key] = value;
        }
      });

      res.writeHead(upstreamResponse.status, responseHeaders);
      const resArrayBuffer = await upstreamResponse.arrayBuffer();
      res.end(Buffer.from(resArrayBuffer));
      return;
    } catch (err) {
      console.error('Error proxying auth request:', err);
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: { message: 'Auth gateway proxy error: ' + err.message } }));
      return;
    }
  }

  // 3. Serve static assets & client route fallback
  let safePath = path.normalize(pathname).replace(/^(\.\.[/\\])+/, '');
  let filePath = path.join(DIST_DIR, safePath);

  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isFile()) {
      serveFile(filePath, res);
    } else {
      serveFile(path.join(DIST_DIR, 'index.html'), res);
    }
  });
});

function serveFile(filePath, res) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      console.error('Error reading file:', filePath, err.message);
      res.writeHead(500);
      res.end(`Server Error: ${err.code}`);
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Auth server running on http://0.0.0.0:${PORT}`);
  console.log(`Serving static files from: ${DIST_DIR}`);
});
