const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Walk up parent directories to locate frontend package.json
let currentDir = __dirname;
let targetDir = currentDir;

while (currentDir !== path.parse(currentDir).root) {
  if (fs.existsSync(path.join(currentDir, 'frontend', 'package.json'))) {
    targetDir = path.join(currentDir, 'frontend');
    break;
  }
  if (fs.existsSync(path.join(currentDir, 'package.json')) && (fs.existsSync(path.join(currentDir, 'app')) || fs.existsSync(path.join(currentDir, 'src')))) {
    targetDir = currentDir;
    break;
  }
  currentDir = path.dirname(currentDir);
}

// Trigger automatic version bump
try {
  const bumpScriptPath = path.join(currentDir, 'scripts', 'bump-version.js');
  if (fs.existsSync(bumpScriptPath)) {
    const { runVersionBump } = require(bumpScriptPath);
    runVersionBump();
  }
} catch (bumpErr) {
  console.warn('⚠️ Auto version bump skipped:', bumpErr.message);
}

console.log(`🚀 Starting Expo Web build in resolved directory: ${targetDir}`);

process.env.CI = '1';
process.env.NODE_OPTIONS = '--max-old-space-size=4096';
process.env.EXPO_ROUTER_DISABLE_RN_NAVIGATION_CHECK = '1';

try {
  console.log('📦 Running npm install...');
  execSync('npm install --legacy-peer-deps', { cwd: targetDir, stdio: 'inherit' });

  console.log('⚡ Running Expo Export...');
  execSync('npx expo export -p web', { cwd: targetDir, env: { ...process.env, EXPO_ROUTER_DISABLE_RN_NAVIGATION_CHECK: '1', CI: '1' }, stdio: 'inherit' });

  const publicDir = path.join(targetDir, 'public');
  const distDir = path.join(targetDir, 'dist');
  if (fs.existsSync(publicDir) && fs.existsSync(distDir)) {
    console.log('📂 Copying static assets from public to dist...');
    try {
      fs.cpSync(publicDir, distDir, { recursive: true, force: true, dereference: true, errorOnExist: false });
    } catch (cpErr) {
      console.warn('⚠️ Warning: Some static assets skipped due to locked file handles:', cpErr.message);
    }
  }

  const distIndexPath = path.join(distDir, 'index.html');
  if (fs.existsSync(distIndexPath)) {
    let indexHtml = fs.readFileSync(distIndexPath, 'utf8');

    const metaCacheHeaders = `
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
    <meta http-equiv="Pragma" content="no-cache" />
    <meta http-equiv="Expires" content="0" />
    <title>FarmsKing - Direct Farmer Marketplace for All India | Makhu, Punjab (ਮੱਖੂ)</title>
    <meta name="description" content="FarmsKing (farmsking.in) is operated from Makhu town (Ferozepur, Punjab). Farmers from ALL INDIA can list and sell their authentic handmade, organic, and direct farm products, access live mandi rates, Agri AI doctor advice, and genuine seeds & fertilizers." />
    <meta name="keywords" content="FarmsKing, Makhu, Makhu Punjab, farmsking.in, www.farmsking.in, all india farmers marketplace, list farmer products India, handmade farmer products, organic jaggery gud, natural seeds, ਖੇਤੀਬਾੜੀ, kheti app, agriculture app India, mandi rates today, punjab mandi bhav, crop doctor ai, buy genuine seeds fertilizers, farmer marketplace, kheti mitra, Surinder Agro Farm" />
    <meta property="og:title" content="FarmsKing - Direct Farmer Marketplace for All India | Makhu, Punjab" />
    <meta property="og:description" content="Operated from Makhu (Punjab). Farmers across All India can list their products directly. Buy authentic handmade farmer products, get live mandi rates, direct crop sales, and Agri AI advisory on FarmsKing." />
    <meta property="og:image" content="https://farmsking.in/farmsking_logo.png" />
    <meta property="og:url" content="https://farmsking.in" />
    <meta property="og:type" content="website" />
    `;

    indexHtml = indexHtml.replace('<head>', `<head>${metaCacheHeaders}`);

    const richNoscript = `
    <noscript>
      <div style="font-family: Arial, sans-serif; padding: 25px; line-height: 1.6; max-width: 900px; margin: 0 auto; color: #1e293b;">
        <header style="border-bottom: 2px solid #166534; padding-bottom: 15px; margin-bottom: 20px;">
          <h1 style="color: #166534; font-size: 28px; margin: 0;">🌾 FarmsKing (ਫਾਰਮਸਕਿੰਗ) - Direct Farmer Marketplace for All India | Makhu, Punjab</h1>
          <p style="font-size: 16px; color: #475569; margin: 5px 0 0 0;">
            Headquartered in Makhu (Punjab) | Farmers Across All India Can List Products | Handmade Farmer Products | Agri AI Doctor | Live Mandi Rates
          </p>
        </header>

        <main>
          <section style="margin-bottom: 25px;">
            <h2 style="color: #15803d; font-size: 22px;">FarmsKing ਕੀ ਹੈ ਅਤੇ ਕਿਵੇਂ ਕੰਮ ਕਰਦਾ ਹੈ? (What is FarmsKing & How It Works)</h2>
            <p style="font-size: 15px;">
              <strong>FarmsKing (farmsking.in)</strong> ਪੰਜਾਬ ਦੇ ਇਤਿਹਾਸਕ ਕਸਬੇ <strong>ਮੱਖੂ (Makhu, District Ferozepur, Punjab)</strong> ਤੋਂ ਚਲਾਇਆ ਜਾ ਰਿਹਾ ਭਾਰਤ ਦਾ ਪ੍ਰਮੁੱਖ ਖੇਤੀਬਾੜੀ ਡਿਜੀਟਲ ਪਲੇਟਫਾਰਮ ਹੈ।
            </p>
            <p style="font-size: 15px;">
              <strong>🇮🇳 ਪੂਰੇ ਭਾਰਤ ਦੇ ਕਿਸਾਨਾਂ ਲਈ (All India Farmers Welcome):</strong> ਪੂਰੇ ਭਾਰਤ (ਪੰਜਾਬ, ਹਰਿਆਣਾ, ਰਾਜਸਥਾਨ, ਯੂ.ਪੀ., ਐਮ.ਪੀ., ਮਹਾਰਾਸ਼ਟਰ ਆਦਿ) ਦੇ ਕਿਸਾਨ ਆਪਣੀ ਫ਼ਸਲ, ਬੀਜ, ਆਰਗੈਨਿਕ ਉਤਪਾਦ ਅਤੇ ਹੱਥੀਂ ਬਣੇ ਸਾਮਾਨ FarmsKing 'ਤੇ ਸਿੱਧਾ ਲਿਸਟ (List) ਕਰਕੇ ਵੇਚ ਸਕਦੇ ਹਨ।
            </p>
            <p style="font-size: 15px;">
              FarmsKing is operated from Makhu town (Ferozepur district, Punjab, India). Farmers from ALL INDIA can freely register, list, and sell their authentic handmade, organic, and farm-fresh artisanal products directly to consumers nationwide without middleman commissions.
            </p>
          </section>

          <section style="background: #f0fdf4; padding: 20px; border-radius: 8px; border: 1px solid #bbf7d0; margin-bottom: 25px;">
            <h2 style="color: #166534; font-size: 20px; margin-top: 0;">⭐ Key Features & Services on FarmsKing (ਮੁੱਖ ਖੂਬੀਆਂ):</h2>
            <ul style="padding-left: 20px; font-size: 15px;">
              <li><strong>🇮🇳 All India Farmer Product Listing (ਪੂਰੇ ਭਾਰਤ ਦੇ ਕਿਸਾਨਾਂ ਲਈ ਖੁੱਲ੍ਹਾ):</strong> Farmers from any state in India can list their crops, natural seeds, handmade goods, and organic produce directly for sale.</li>
              <li><strong>🌾 Authentic Handmade Farmer Products (ਕਿਸਾਨਾਂ ਦੇ ਹੱਥੀਂ ਬਣੇ ਉਤਪਾਦ):</strong> Direct marketplace for farmer-made organic products, traditional jaggery (gud), natural seeds, pure ghee, and artisanal farm produce.</li>
              <li><strong>📊 Live Mandi Rates & Crop Records (ਲਾਈਵ ਮੰਡੀ ਭਾਵ ਅਤੇ ਫ਼ਸਲ ਰਿਕਾਰਡ):</strong> Real-time daily crop prices across Khanna, Ludhiana, Bathinda, Moga, Rajpura, Sirsa, Makhu, and major North Indian mandis with historical crop records.</li>
              <li><strong>🤖 Crop Doctors & Expert Advisory (ਖੇਤੀਬਾੜੀ ਡਾਕਟਰ ਅਤੇ ਸਲਾਹਕਾਰ):</strong> Certified agriculture experts providing field guidance, disease diagnosis, spray selection, and plant health management.</li>
              <li><strong>🌱 Gardener System & Plant Care Dose (ਗਾਰਡਨਰ ਸਿਸਟਮ - ਜਲਦੀ ਹੀ ਲਾਗੂ):</strong> Special upcoming system for home & urban gardeners featuring customized plant care dose advice, plant doctors, and gardening advisors right on FarmsKing!</li>
              <li><strong>📍 Headquartered in Makhu, Punjab (ਮੱਖੂ ਪੰਜਾਬ ਤੋਂ ਸੰਚਾਲਿਤ):</strong> Rooted in Makhu town, serving farmers across Punjab and India with transparent pricing.</li>
              <li><strong>🛒 Genuine Kisan Products Store (ਕਿਸਾਨਾਂ ਲਈ ਅਸਲੀ ਉਤਪਾਦ):</strong> Order genuine pesticides, herbicides, NPK fertilizers, and seeds with 24-hour fast delivery and door-step verification.</li>
              <li><strong>💳 FarmsKing Wallet & Auto Payouts:</strong> Secure wallet with instant UPI withdrawals, referral bonuses, and transparent payment receipts.</li>
              <li><strong>📅 Reverse Sowing Engine & Weather Advisory:</strong> Calculate exact sowing dates for festival demand spikes (Diwali, Chhath, Baisakhi) to get 3x crop profits.</li>
            </ul>
          </section>

          <section style="margin-bottom: 25px;">
            <h2 style="color: #15803d; font-size: 20px;">FarmsKing Founders & Vision (ਮਿਸ਼ਨ ਅਤੇ ਸੰਸਥਾਪਕ):</h2>
            <p style="font-size: 15px;">
              FarmsKing was founded in Makhu by <strong>Surinder Singh</strong> (Computer Teacher, IT & AI Expert, founder of Surinder Academy Makhu, Exilent Web Solutions, and Surinder Agro Farm) along with core team members Gurjant Singh, Charanjit Singh, Lovepreet Singh, Sudhir Kumar Mahato, and Gurnam Singh.
            </p>
            <p style="font-size: 15px;">
              FarmsKing has been developed with deep practical agricultural R&D at Surinder Agro Farm in Makhu to solve ground-level farming challenges, promote handmade organic farming goods, protect farmers from fake pesticides, and provide transparent mandi pricing.
            </p>
          </section>

          <section style="border-top: 1px solid #e2e8f0; paddingTop: 15px;">
            <h3 style="color: #334155; font-size: 18px;">Quick Links & Official Pages:</h3>
            <p style="font-size: 14px;">
              • <a href="/about-farmsking.html" style="color: #166534; font-weight: bold;">About FarmsKing Platform</a> | 
              • <a href="/punjab-kheti-advisory.html" style="color: #166534; font-weight: bold;">Punjab Kheti Advisory</a> | 
              • <a href="/kisan-crop-intelligence-engine.html" style="color: #166534; font-weight: bold;">Kisan Crop Intelligence</a> | 
              • <a href="/surinder-agro-farm.html" style="color: #166534; font-weight: bold;">Surinder Agro Farm R&D (Makhu)</a> | 
              • <a href="/sitemap.xml" style="color: #166534; font-weight: bold;">XML Sitemap</a>
            </p>
          </section>
        </main>
      </div>
    </noscript>
    `;

    if (indexHtml.includes('<noscript>')) {
      indexHtml = indexHtml.replace(/<noscript>[\s\S]*?<\/noscript>/, richNoscript);
    } else {
      indexHtml = indexHtml.replace('<body>', `<body>${richNoscript}`);
    }

    fs.writeFileSync(distIndexPath, indexHtml, 'utf8');

    // Ensure static my.html and route subdirectories use standalone static HTML content
    const publicMyHtml = fs.existsSync(path.join(publicDir, 'my.html'))
      ? fs.readFileSync(path.join(publicDir, 'my.html'), 'utf8')
      : indexHtml;

    const myHtmlPath = path.join(distDir, 'my.html');
    fs.writeFileSync(myHtmlPath, publicMyHtml, 'utf8');

    const mySubDir = path.join(distDir, 'my');
    if (!fs.existsSync(mySubDir)) fs.mkdirSync(mySubDir, { recursive: true });
    fs.writeFileSync(path.join(mySubDir, 'index.html'), publicMyHtml, 'utf8');
    console.log('✅ Preserved and deployed static my.html and route subdirectories');
  }

  console.log('✅ Expo Web build completed successfully!');
} catch (err) {
  console.error('❌ Build failed:', err.message);
  process.exit(1);
}
