const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Set targetDir to admin project directory
const targetDir = __dirname;
const currentDir = path.resolve(__dirname, '..');

// Auto version bump for admin is isolated to admin directory if needed


console.log(`🚀 Starting Expo Web build in resolved directory: ${targetDir}`);

process.env.CI = '1';
process.env.NODE_OPTIONS = '--max-old-space-size=4096';
process.env.EXPO_ROUTER_DISABLE_RN_NAVIGATION_CHECK = '1';

try {
  const shouldInstall = process.argv.includes('--install') || !fs.existsSync(path.join(targetDir, 'node_modules'));
  if (shouldInstall) {
    console.log('📦 Running npm install...');
    execSync('npm install --legacy-peer-deps', { cwd: targetDir, stdio: 'inherit' });
  } else {
    console.log('✅ Admin node_modules already exists. Skipping npm install');
  }

  console.log('⚡ Running Expo Export...');
  execSync('node ./node_modules/expo/bin/cli export -p web', { cwd: targetDir, env: { ...process.env, EXPO_ROUTER_DISABLE_RN_NAVIGATION_CHECK: '1', CI: '1' }, stdio: 'inherit' });

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

  // ─── Vector Icons & Fonts Guarantee ───
  console.log('🎨 Processing and deploying vector icon web fonts...');
  const fontsSourceDir = path.join(targetDir, 'node_modules', '@expo', 'vector-icons', 'build', 'vendor', 'react-native-vector-icons', 'Fonts');
  const distFontsDir = path.join(distDir, 'fonts');
  const distAssetsFontsDir = path.join(distDir, 'assets', 'fonts');
  const distExpoFontsDir = path.join(distDir, 'assets', 'node_modules', '@expo', 'vector-icons', 'build', 'vendor', 'react-native-vector-icons', 'Fonts');

  [distFontsDir, distAssetsFontsDir, distExpoFontsDir].forEach(d => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  });

  if (fs.existsSync(fontsSourceDir)) {
    const fontFiles = fs.readdirSync(fontsSourceDir).filter(f => f.endsWith('.ttf'));
    fontFiles.forEach(file => {
      const srcFile = path.join(fontsSourceDir, file);
      fs.copyFileSync(srcFile, path.join(distFontsDir, file));
      fs.copyFileSync(srcFile, path.join(distAssetsFontsDir, file));
      fs.copyFileSync(srcFile, path.join(distExpoFontsDir, file));
    });
    console.log(`✅ Copied ${fontFiles.length} vector icon fonts to dist/fonts, dist/assets/fonts, and Expo vendor path.`);
  }

  if (fs.existsSync(distExpoFontsDir)) {
    const files = fs.readdirSync(distExpoFontsDir);
    files.forEach(f => {
      const match = f.match(/^([a-zA-Z0-9_\-]+)\.[a-f0-9]{32}\.ttf$/i);
      if (match) {
        const baseName = `${match[1]}.ttf`;
        fs.copyFileSync(path.join(distExpoFontsDir, f), path.join(distFontsDir, baseName));
        fs.copyFileSync(path.join(distExpoFontsDir, f), path.join(distAssetsFontsDir, baseName));
      }
    });
  }

  const distIndexPath = path.join(distDir, 'index.html');
  if (fs.existsSync(distIndexPath)) {
    let indexHtml = fs.readFileSync(distIndexPath, 'utf8');

    const vectorIconStyles = `
    <!-- 100% Reliable Production Vector Icon Fonts -->
    <link rel="preload" href="/fonts/Ionicons.ttf" as="font" type="font/ttf" crossorigin="anonymous" />
    <link rel="preload" href="/fonts/MaterialCommunityIcons.ttf" as="font" type="font/ttf" crossorigin="anonymous" />
    <link rel="preload" href="/fonts/MaterialIcons.ttf" as="font" type="font/ttf" crossorigin="anonymous" />
    <style id="farmsking-vector-icons">
      @font-face {
        font-family: 'Ionicons';
        src: url('/fonts/Ionicons.ttf') format('truetype'),
             url('/assets/fonts/Ionicons.ttf') format('truetype'),
             url('https://cdnjs.cloudflare.com/ajax/libs/ionicons/5.5.2/fonts/ionicons.ttf') format('truetype');
        font-display: swap;
      }
      @font-face {
        font-family: 'MaterialCommunityIcons';
        src: url('/fonts/MaterialCommunityIcons.ttf') format('truetype'),
             url('/assets/fonts/MaterialCommunityIcons.ttf') format('truetype'),
             url('https://cdnjs.cloudflare.com/ajax/libs/MaterialDesign-Webfont/7.2.96/fonts/materialdesignicons-webfont.ttf') format('truetype');
        font-display: swap;
      }
      @font-face {
        font-family: 'MaterialIcons';
        src: url('/fonts/MaterialIcons.ttf') format('truetype'),
             url('/assets/fonts/MaterialIcons.ttf') format('truetype'),
             url('https://cdnjs.cloudflare.com/ajax/libs/material-design-icons/3.0.1/iconfont/MaterialIcons-Regular.ttf') format('truetype');
        font-display: swap;
      }
      @font-face {
        font-family: 'FontAwesome';
        src: url('/fonts/FontAwesome.ttf') format('truetype'),
             url('/assets/fonts/FontAwesome.ttf') format('truetype'),
             url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/fonts/fontawesome-webfont.ttf') format('truetype');
        font-display: swap;
      }
      @font-face {
        font-family: 'FontAwesome5_Regular';
        src: url('/fonts/FontAwesome5_Regular.ttf') format('truetype'),
             url('/assets/fonts/FontAwesome5_Regular.ttf') format('truetype');
        font-display: swap;
      }
      @font-face {
        font-family: 'FontAwesome5_Solid';
        src: url('/fonts/FontAwesome5_Solid.ttf') format('truetype'),
             url('/assets/fonts/FontAwesome5_Solid.ttf') format('truetype');
        font-display: swap;
      }
      @font-face {
        font-family: 'FontAwesome5_Brands';
        src: url('/fonts/FontAwesome5_Brands.ttf') format('truetype'),
             url('/assets/fonts/FontAwesome5_Brands.ttf') format('truetype');
        font-display: swap;
      }
      @font-face {
        font-family: 'FontAwesome6_Regular';
        src: url('/fonts/FontAwesome6_Regular.ttf') format('truetype'),
             url('/assets/fonts/FontAwesome6_Regular.ttf') format('truetype');
        font-display: swap;
      }
      @font-face {
        font-family: 'FontAwesome6_Solid';
        src: url('/fonts/FontAwesome6_Solid.ttf') format('truetype'),
             url('/assets/fonts/FontAwesome6_Solid.ttf') format('truetype');
        font-display: swap;
      }
      @font-face {
        font-family: 'FontAwesome6_Brands';
        src: url('/fonts/FontAwesome6_Brands.ttf') format('truetype'),
             url('/assets/fonts/FontAwesome6_Brands.ttf') format('truetype');
        font-display: swap;
      }
      @font-face {
        font-family: 'Feather';
        src: url('/fonts/Feather.ttf') format('truetype'),
             url('/assets/fonts/Feather.ttf') format('truetype'),
             url('https://cdnjs.cloudflare.com/ajax/libs/feather-icons/4.29.0/feather.ttf') format('truetype');
        font-display: swap;
      }
      @font-face {
        font-family: 'Entypo';
        src: url('/fonts/Entypo.ttf') format('truetype'),
             url('/assets/fonts/Entypo.ttf') format('truetype'),
             url('https://cdn.jsdelivr.net/npm/react-native-vector-icons@10.0.0/Fonts/Entypo.ttf') format('truetype');
        font-display: swap;
      }
      @font-face {
        font-family: 'AntDesign';
        src: url('/fonts/AntDesign.ttf') format('truetype'),
             url('/assets/fonts/AntDesign.ttf') format('truetype'),
             url('https://cdn.jsdelivr.net/npm/react-native-vector-icons@10.0.0/Fonts/AntDesign.ttf') format('truetype');
        font-display: swap;
      }
      @font-face {
        font-family: 'Octicons';
        src: url('/fonts/Octicons.ttf') format('truetype'),
             url('/assets/fonts/Octicons.ttf') format('truetype');
        font-display: swap;
      }
      @font-face {
        font-family: 'SimpleLineIcons';
        src: url('/fonts/SimpleLineIcons.ttf') format('truetype'),
             url('/assets/fonts/SimpleLineIcons.ttf') format('truetype');
        font-display: swap;
      }
      @font-face {
        font-family: 'EvilIcons';
        src: url('/fonts/EvilIcons.ttf') format('truetype'),
             url('/assets/fonts/EvilIcons.ttf') format('truetype');
        font-display: swap;
      }
      @font-face {
        font-family: 'Fontisto';
        src: url('/fonts/Fontisto.ttf') format('truetype'),
             url('/assets/fonts/Fontisto.ttf') format('truetype');
        font-display: swap;
      }
      @font-face {
        font-family: 'Foundation';
        src: url('/fonts/Foundation.ttf') format('truetype'),
             url('/assets/fonts/Foundation.ttf') format('truetype');
        font-display: swap;
      }
      @font-face {
        font-family: 'Zocial';
        src: url('/fonts/Zocial.ttf') format('truetype'),
             url('/assets/fonts/Zocial.ttf') format('truetype');
        font-display: swap;
      }
    </style>
    `;

    const metaCacheHeaders = `
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
    <meta http-equiv="Pragma" content="no-cache" />
    <meta http-equiv="Expires" content="0" />
    <title>FarmsKing - Admin Staff</title>
    <meta name="description" content="India's national agritech platform. AI Crop Doctor diagnostics, live mandi rates, certified organic vermicompost &amp; floriculture. Regd: Goindwal Sahib, HQ: Makhu." />
    <meta name="keywords" content="FarmsKing, FarmsKing Technologies, AI Crop Doctor, Live Mandi Rates, Organic Vermicompost, Bio-Fertilizers, Marigold Farming, Commercial Floriculture, Home Gardening, Balcony Gardening, Sustainable Farming, Nature Lovers, Goindwal Sahib, Makhu, Punjab, National Agri Marketplace, Agtech India" />
    <meta property="og:title" content="FarmsKing - AI Crop Doctor, Live Mandi &amp; Organic Platform" />
    <meta property="og:description" content="India's national agritech platform. AI Crop Doctor diagnostics, live mandi rates, certified organic vermicompost &amp; floriculture. Regd: Goindwal Sahib, HQ: Makhu." />
    <meta property="og:image" content="https://farmsking.in/brand_logo.png" />
    <meta property="og:url" content="https://farmsking.in" />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="FarmsKing - AI Crop Doctor, Live Mandi &amp; Organic Platform" />
    <meta name="twitter:description" content="India's national agritech platform. AI Crop Doctor diagnostics, live mandi rates, certified organic vermicompost &amp; floriculture. Regd: Goindwal Sahib, HQ: Makhu." />
    <meta name="twitter:image" content="https://farmsking.in/brand_logo.png" />

    <!-- 🌟 Global Official K Brand Favicons & Icons -->
    <link rel="icon" type="image/png" sizes="128x128" href="/favicon.png?v=7" />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png?v=7" />
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon.png?v=7" />
    <link rel="shortcut icon" href="/favicon.ico?v=7" />
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=7" />
    <link rel="icon" type="image/png" sizes="192x192" href="/icon.png?v=7" />
    <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png?v=7" />

    <!-- Google & AI Search Engine Structured Data (JSON-LD) -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Corporation",
      "name": "FARMSKING TECHNOLOGIES PRIVATE LIMITED",
      "alternateName": ["FarmsKing", "FarmsKing Technologies"],
      "url": "https://farmsking.in",
      "logo": "https://farmsking.in/brand_logo.png",
      "description": "National agricultural technology platform delivering multimodal AI crop pathology, certified vermicompost bio-fertilizers, commercial marigold floriculture advisory, live mandi commodity intelligence, and urban balcony gardening kits across India.",
      "address": [
        {
          "@type": "PostalAddress",
          "streetAddress": "VPO Goindwal Sahib, Tehsil Khadur Sahib",
          "addressLocality": "Goindwal Sahib, District Tarn Taran",
          "addressRegion": "Punjab",
          "postalCode": "143422",
          "addressCountry": "IN"
        },
        {
          "@type": "PostalAddress",
          "streetAddress": "Makhu",
          "addressLocality": "Makhu, Ferozepur",
          "addressRegion": "Punjab",
          "postalCode": "142044",
          "addressCountry": "IN"
        }
      ]
    }
    </script>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "FarmsKing",
      "operatingSystem": "Web, Android, iOS",
      "applicationCategory": "BusinessApplication",
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "INR" },
      "description": "India's premier national agriculture platform featuring multimodal AI Crop Doctor diagnostics, real-time live mandi rates, certified organic vermicompost, and direct farmer-to-consumer marketplace."
    }
    </script>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "How is FarmsKing governed and administered?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "FarmsKing is operated by FARMSKING TECHNOLOGIES PRIVATE LIMITED, governed under the Companies Act, 2013 by its Board of Directors and executive management team."
          }
        }
      ]
    }
    </script>
    ${vectorIconStyles}
    `;

    indexHtml = indexHtml.replace(/<title>[\s\S]*?<\/title>/gi, '');
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
            <h2 style="color: #15803d; font-size: 20px;">FarmsKing Corporate Governance &amp; Administration:</h2>
            <p style="font-size: 15px;">
              FarmsKing is operated by <strong>FARMSKING TECHNOLOGIES PRIVATE LIMITED</strong>, dedicated to empowering Indian farmers with digital crop diagnostics, real-time APMC mandi pricing, and genuine certified agricultural inputs.
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
              FarmsKing was founded in Makhu by <strong>Surinder Singh</strong> (Computer Teacher, IT & AI Expert, founder of Surinder Academy Makhu, Exilent Web Solutions, and Surinder Agro Farm) with registered entity directors <strong>Bakshish Singh</strong> and <strong>Gagandeep Kaur</strong>, and practical field validation supported by Gurnam Singh.
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

    const adminSplashHtml = `
    <div id="farmsking-admin-splash" style="position: fixed; inset: 0; background: #022c22; display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 999999; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <img src="/favicon.png?v=7" alt="FarmsKing" style="width: 72px; height: 72px; border-radius: 18px; filter: drop-shadow(0 4px 20px rgba(16, 185, 129, 0.45)); margin-bottom: 16px;" />
      <div style="color: #fef08a; font-size: 16px; font-weight: 700; letter-spacing: 0.3px; margin-bottom: 10px;">Smart Farming</div>
      <div style="background: rgba(255, 255, 255, 0.12); padding: 6px 16px; border-radius: 999px; border: 1px solid rgba(255, 255, 255, 0.25); color: #d1fae5; font-size: 12.5px; font-weight: 600;">
        🌾 India’s Intelligent Agriculture Platform
      </div>
    </div>
    `;

    indexHtml = indexHtml.replace('<div id="root"></div>', `<div id="root">${adminSplashHtml}</div>`);

    fs.writeFileSync(distIndexPath, indexHtml, 'utf8');

    // Create static you.html, sk.html, my.html and route subdirectories for direct URL access online
    const publicYouHtml = fs.existsSync(path.join(publicDir, 'you.html'))
      ? fs.readFileSync(path.join(publicDir, 'you.html'), 'utf8')
      : indexHtml;

    const youHtmlPath = path.join(distDir, 'you.html');
    const youSubDir = path.join(distDir, 'you');
    fs.writeFileSync(youHtmlPath, publicYouHtml, 'utf8');
    if (!fs.existsSync(youSubDir)) fs.mkdirSync(youSubDir, { recursive: true });
    fs.writeFileSync(path.join(youSubDir, 'index.html'), publicYouHtml, 'utf8');

    // SK Route Static HTML & Directory
    const skHtmlPath = path.join(distDir, 'sk.html');
    const skSubDir = path.join(distDir, 'sk');
    fs.writeFileSync(skHtmlPath, indexHtml, 'utf8');
    if (!fs.existsSync(skSubDir)) fs.mkdirSync(skSubDir, { recursive: true });
    fs.writeFileSync(path.join(skSubDir, 'index.html'), indexHtml, 'utf8');

    // DOSE Route Static HTML & Directory
    const doseHtmlPath = path.join(distDir, 'dose.html');
    const doseSubDir = path.join(distDir, 'dose');
    fs.writeFileSync(doseHtmlPath, indexHtml, 'utf8');
    if (!fs.existsSync(doseSubDir)) fs.mkdirSync(doseSubDir, { recursive: true });
    fs.writeFileSync(path.join(doseSubDir, 'index.html'), indexHtml, 'utf8');

    // MY Route Static HTML & Directory
    const myHtmlPath = path.join(distDir, 'my.html');
    const mySubDir = path.join(distDir, 'my');
    fs.writeFileSync(myHtmlPath, indexHtml, 'utf8');
    if (!fs.existsSync(mySubDir)) fs.mkdirSync(mySubDir, { recursive: true });
    fs.writeFileSync(path.join(mySubDir, 'index.html'), indexHtml, 'utf8');

    console.log('✅ Preserved and deployed static you.html, sk.html, dose.html, my.html and route subdirectories');
  }

  console.log('✅ Expo Web build completed successfully!');
} catch (err) {
  console.error('❌ Build failed:', err.message);
  process.exit(1);
}
