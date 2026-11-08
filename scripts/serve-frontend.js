const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = parseInt(process.env.PORT || '8081', 10);
const DIR = path.resolve(__dirname, '../frontend/dist');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
  let filePath = path.join(DIR, reqPath);

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    const htmlTry = filePath + '.html';
    if (fs.existsSync(htmlTry)) {
      filePath = htmlTry;
    } else {
      filePath = path.join(DIR, 'index.html');
    }
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME[ext] || 'application/octet-stream';

  fs.stat(filePath, (err, stat) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    const mtime = stat.mtime.toUTCString();
    const ifModifiedSince = req.headers['if-modified-since'];
    if (ifModifiedSince && ifModifiedSince === mtime) {
      res.writeHead(304, { 'Last-Modified': mtime });
      res.end();
      return;
    }

    const isStatic = ext !== '.html';
    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500);
        res.end('Error loading ' + reqPath);
      } else {
        res.writeHead(200, {
          'Content-Type': contentType,
          'Last-Modified': mtime,
          'Cache-Control': isStatic ? 'public, max-age=86400' : 'no-cache, must-revalidate',
        });
        res.end(content);
      }
    });
  });
});

server.listen(PORT, () => {
  console.log(`Frontend serving at http://localhost:${PORT}`);
});
