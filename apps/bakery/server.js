const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3003;
const DIST_DIR = path.join(__dirname, 'dist');
const API_PROXY_TARGET = process.env.API_PROXY_TARGET || 'http://api:4000';

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
};

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // 1. Health checks
  if (pathname === '/health' || pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  // 2. Proxy API requests for bakery
  if (pathname.startsWith('/api/v2')) {
    const targetUrl = new URL(req.url, API_PROXY_TARGET);

    const options = {
      method: req.method,
      headers: {
        ...req.headers,
        host: targetUrl.host,
      }
    };

    const proxyReq = http.request(targetUrl, options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      console.error('Proxy error forwarding to', targetUrl.toString(), err.message);
      res.writeHead(502, { 'Content-Type': 'text/plain' });
      res.end('Bad Gateway');
    });

    req.pipe(proxyReq);
    return;
  }

  // 3. Serve static files with SPA routing fallback
  let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(DIST_DIR, safePath);

  // Fallback to serving the file
  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isFile()) {
      serveFile(filePath, res);
    } else {
      // Fallback to index.html for SPA routing
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
  console.log(`Bakery production static server running on http://0.0.0.0:${PORT}`);
  console.log(`Serving static files from: ${DIST_DIR}`);
  console.log(`Proxying /api/v2 requests to: ${API_PROXY_TARGET}`);
});
