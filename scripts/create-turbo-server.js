const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.apk': 'application/vnd.android.package-archive',
};

const COMPRESSIBLE_EXTS = new Set(['.js', '.css', '.html', '.json', '.svg', '.ttf', '.txt', '.xml']);

/**
 * Shared high-speed RAM-cached HTTP server with Gzip/ETag/304 & immutable static asset caching.
 * Reused by both Frontend (8081) and Admin (8082) portals.
 */
function createTurboStaticServer({ name, port, dir }) {
  const memoryCache = new Map();

  function getFileRecord(filePath) {
    try {
      const stat = fs.statSync(filePath);
      const cached = memoryCache.get(filePath);
      if (cached && cached.mtimeMs === stat.mtimeMs) {
        return cached;
      }

      const raw = fs.readFileSync(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const isCompressible = COMPRESSIBLE_EXTS.has(ext) && raw.length > 512;
      const gzipped = isCompressible ? zlib.gzipSync(raw, { level: 6 }) : null;
      const etag = `"${crypto.createHash('md5').update(raw).digest('hex')}"`;
      const isImmutable = ext !== '.html';

      const record = {
        raw,
        gzipped,
        mtimeMs: stat.mtimeMs,
        mtimeStr: stat.mtime.toUTCString(),
        etag,
        contentType: MIME[ext] || 'application/octet-stream',
        cacheControl: isImmutable
          ? 'public, max-age=31536000, immutable'
          : 'no-cache, must-revalidate',
      };

      memoryCache.set(filePath, record);
      return record;
    } catch {
      return null;
    }
  }

  function warmUpCache() {
    try {
      const indexPath = path.join(dir, 'index.html');
      if (fs.existsSync(indexPath)) getFileRecord(indexPath);

      for (const rel of ['_expo/static/js/web', 'fonts']) {
        const subDir = path.join(dir, rel);
        if (!fs.existsSync(subDir)) continue;
        for (const f of fs.readdirSync(subDir)) {
          if (f.endsWith('.js') || f.endsWith('.ttf') || f.endsWith('.css')) {
            getFileRecord(path.join(subDir, f));
          }
        }
      }
      console.log(`⚡ [${name}] Warm-up complete: ${memoryCache.size} critical assets pre-compressed & cached in RAM.`);
    } catch (err) {
      console.warn(`⚠️ [${name}] Warm-up notice:`, err.message);
    }
  }

  const server = http.createServer((req, res) => {
    const reqPath = (req.url || '/').split('?')[0];
    let filePath = path.join(dir, reqPath === '/' || reqPath === '' ? '/index.html' : reqPath);

    if (!filePath.startsWith(dir)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('Forbidden');
      return;
    }

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      const htmlTry = `${filePath}.html`;
      if (fs.existsSync(htmlTry)) {
        filePath = htmlTry;
      } else {
        filePath = path.join(dir, 'index.html');
      }
    }

    const record = getFileRecord(filePath);
    if (!record) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }

    const ifNoneMatch = req.headers['if-none-match'];
    const ifModifiedSince = req.headers['if-modified-since'];
    if ((ifNoneMatch && ifNoneMatch === record.etag) || (ifModifiedSince && ifModifiedSince === record.mtimeStr)) {
      res.writeHead(304, {
        ETag: record.etag,
        'Last-Modified': record.mtimeStr,
        'Cache-Control': record.cacheControl,
      });
      res.end();
      return;
    }

    const acceptEncoding = req.headers['accept-encoding'] || '';
    const canGzip = Boolean(record.gzipped && acceptEncoding.includes('gzip'));

    const headers = {
      'Content-Type': record.contentType,
      ETag: record.etag,
      'Last-Modified': record.mtimeStr,
      'Cache-Control': record.cacheControl,
    };

    if (canGzip) {
      headers['Content-Encoding'] = 'gzip';
      headers.Vary = 'Accept-Encoding';
      res.writeHead(200, headers);
      res.end(record.gzipped);
    } else {
      res.writeHead(200, headers);
      res.end(record.raw);
    }
  });

  server.listen(port, () => {
    console.log(`🚀 ${name} Turbo Server serving at http://localhost:${port}`);
    warmUpCache();
  });

  return server;
}

module.exports = { createTurboStaticServer };

