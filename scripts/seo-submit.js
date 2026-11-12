const https = require('https');

const INDEXNOW_KEY = '7c23f4c12cd8c5dcddf6d149b8339b9f';

const CANONICAL_URLS = [
  'https://farmsking.in/',
  'https://farmsking.in/ai-doctor',
  'https://farmsking.in/crop-disease-scanner',
  'https://farmsking.in/dose',
  'https://farmsking.in/shop',
  'https://farmsking.in/order-tracking',
  'https://farmsking.in/crop-intelligence',
  'https://farmsking.in/kisan-crop-intelligence-engine.html',
  'https://farmsking.in/kisan-doctor-advisory.html',
  'https://farmsking.in/punjab-kheti-advisory.html',
  'https://farmsking.in/reverse-sowing-engine.html',
  'https://farmsking.in/surinder-agro-farm.html',
  'https://farmsking.in/about-farmsking.html',
  'https://farmsking.in/seller-dashboard',
  'https://farmsking.in/seller-payouts',
  'https://farmsking.in/compliance',
  'https://farmsking.in/contact-us',
  'https://farmsking.in/terms',
  'https://farmsking.in/privacy-policy',
  'https://farmsking.in/refund-policy',
  'https://farmsking.in/shipping-policy',
  'https://farmsking.in/llms.txt',
  'https://farmsking.in/llms-full.txt',
  'https://farmsking.in/ai-knowledge.json',
  'https://farmsking.in/sitemap.xml',
];

function postJson(urlStr, data) {
  return new Promise((resolve, reject) => {
    try {
      const url = new URL(urlStr);
      const postBody = JSON.stringify(data);
      const req = https.request(
        {
          hostname: url.hostname,
          port: url.port || 443,
          path: url.pathname + url.search,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Content-Length': Buffer.byteLength(postBody),
            'User-Agent': 'FarmsKing-SEO-Bot/2.0 (+https://farmsking.in)',
          },
          timeout: 15000,
        },
        (res) => {
          let body = '';
          res.on('data', (chunk) => {
            body += chunk;
          });
          res.on('end', () => {
            resolve({
              statusCode: res.statusCode,
              statusMessage: res.statusMessage,
              body,
            });
          });
        },
      );

      req.on('error', (err) => resolve({ error: err.message }));
      req.on('timeout', () => {
        req.destroy();
        resolve({ error: 'Request timed out' });
      });

      req.write(postBody);
      req.end();
    } catch (e) {
      resolve({ error: e.message });
    }
  });
}

async function submitSeoData() {
  console.log('👑 FarmsKing Automated SEO & AI Search Engine Submission');
  console.log(`📡 Preparing IndexNow real-time submission for ${CANONICAL_URLS.length} canonical URLs...`);

  const payload = {
    host: 'farmsking.in',
    key: INDEXNOW_KEY,
    keyLocation: `https://farmsking.in/${INDEXNOW_KEY}.txt`,
    urlList: CANONICAL_URLS,
  };

  const results = {
    timestamp: new Date().toISOString(),
    urlsCount: CANONICAL_URLS.length,
    endpoints: {},
  };

  // Submit to IndexNow API (shared hub for Bing, Yandex, AI Copilot, Perplexity, etc.)
  console.log('🚀 Pinging api.indexnow.org...');
  const resIndexNow = await postJson('https://api.indexnow.org/indexnow', payload);
  results.endpoints['api.indexnow.org'] = resIndexNow;
  console.log(`   -> api.indexnow.org responded with HTTP ${resIndexNow.statusCode || resIndexNow.error}`);

  // Also submit directly to Bing IndexNow endpoint
  console.log('🚀 Pinging www.bing.com/indexnow...');
  const resBing = await postJson('https://www.bing.com/indexnow', payload);
  results.endpoints['www.bing.com'] = resBing;
  console.log(`   -> www.bing.com responded with HTTP ${resBing.statusCode || resBing.error}`);

  const success =
    (resIndexNow.statusCode === 200 || resIndexNow.statusCode === 202) ||
    (resBing.statusCode === 200 || resBing.statusCode === 202);

  console.log(`\n✅ SEO Submission Process Complete! (Accepted: ${success ? 'YES' : 'PENDING'})\n`);
  return { success, results };
}

if (require.main === module) {
  submitSeoData()
    .then((r) => {
      console.log('Final Result Summary:', JSON.stringify(r.results, null, 2));
      process.exit(0);
    })
    .catch((err) => {
      console.error('Submission failed:', err);
      process.exit(1);
    });
}

module.exports = { submitSeoData, CANONICAL_URLS, INDEXNOW_KEY };
