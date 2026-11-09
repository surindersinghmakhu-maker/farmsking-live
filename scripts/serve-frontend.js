const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');

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

// In-memory memory cache for ultra-fast (sub-2ms) responses
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
    const isCompressible = ['.js', '.css', '.html', '.json', '.svg'].includes(ext);
    const gzipped = isCompressible && raw.length > 512 ? zlib.gzipSync(raw, { level: 6 }) : null;
    const etag = `"${crypto.createHash('md5').update(raw).digest('hex')}"`;
    const isStatic = ext !== '.html';

    const record = {
      raw,
      gzipped,
      mtimeMs: stat.mtimeMs,
      mtimeStr: stat.mtime.toUTCString(),
      etag,
      contentType: MIME[ext] || 'application/octet-stream',
      isStatic,
    };

    memoryCache.set(filePath, record);
    return record;
  } catch {
    return null;
  }
}

// Preload & warm up critical assets (index.html and main JS bundle) into memory
function warmUpCache() {
  try {
    const indexPath = path.join(DIR, 'index.html');
    if (fs.existsSync(indexPath)) getFileRecord(indexPath);

    const webJsDir = path.join(DIR, '_expo/static/js/web');
    if (fs.existsSync(webJsDir)) {
      const files = fs.readdirSync(webJsDir);
      for (const f of files) {
        if (f.endsWith('.js')) {
          getFileRecord(path.join(webJsDir, f));
        }
      }
    }
    console.log(`⚡ Warm-up complete: ${memoryCache.size} files loaded directly into RAM memory cache.`);
  } catch (err) {
    console.warn('⚠️ Warm-up notice:', err.message);
  }
}

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

  const record = getFileRecord(filePath);
  if (!record) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
    return;
  }

  // 1. Check ETag & If-None-Match (304 Not Modified)
  const ifNoneMatch = req.headers['if-none-match'];
  if (ifNoneMatch && ifNoneMatch === record.etag) {
    res.writeHead(304, {
      'ETag': record.etag,
      'Last-Modified': record.mtimeStr,
      'Cache-Control': record.isStatic
        ? 'public, max-age=31536000, immutable'
        : 'no-cache, must-revalidate',
    });
    res.end();
    return;
  }

  // 2. Check If-Modified-Since
  const ifModifiedSince = req.headers['if-modified-since'];
  if (ifModifiedSince && ifModifiedSince === record.mtimeStr) {
    res.writeHead(304, {
      'ETag': record.etag,
      'Last-Modified': record.mtimeStr,
      'Cache-Control': record.isStatic
        ? 'public, max-age=31536000, immutable'
        : 'no-cache, must-revalidate',
    });
    res.end();
    return;
  }

  // 3. Serve response (with gzip if accepted)
  const acceptEncoding = req.headers['accept-encoding'] || '';
  const canGzip = record.gzipped && acceptEncoding.includes('gzip');

  const headers = {
    'Content-Type': record.contentType,
    'ETag': record.etag,
    'Last-Modified': record.mtimeStr,
    'Cache-Control': record.isStatic
      ? 'public, max-age=31536000, immutable'
      : 'no-cache, must-revalidate',
  };

  if (canGzip) {
    headers['Content-Encoding'] = 'gzip';
    headers['Vary'] = 'Accept-Encoding';
    res.writeHead(200, headers);
    res.end(record.gzipped);
  } else {
    res.writeHead(200, headers);
    res.end(record.raw);
  }
});

server.listen(PORT, () => {
  console.log(`🚀 High-Performance Turbo Frontend serving at http://localhost:${PORT}`);
  warmUpCache();
});
