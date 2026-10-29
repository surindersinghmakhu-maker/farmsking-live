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
process.env.NODE_OPTIONS = '--max-old-space-size=2560';
process.env.EXPO_ROUTER_DISABLE_RN_NAVIGATION_CHECK = '1';

try {
  const shouldInstall = process.argv.includes('--install') || !fs.existsSync(path.join(targetDir, 'node_modules'));
  if (shouldInstall) {
    console.log('📦 Running npm install...');
    execSync('npm install --legacy-peer-deps', { cwd: targetDir, stdio: 'inherit' });
  } else {
    console.log('✅ Frontend node_modules already exists. Skipping npm install (use --install to re-install)');
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
      /* Suppress reCAPTCHA v3 floating badge */
      .grecaptcha-badge {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }
    </style>
    `;

    const metaCacheHeaders = `
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
    <meta http-equiv="Pragma" content="no-cache" />
    <meta http-equiv="Expires" content="0" />
    <title>FarmsKing: Smart Farming Platform &amp; Agriculture App India | Farming Easy, Farming Smart (farmsking.in)</title>
    <meta name="description" content="FarmsKing (farmsking.in) is India's premier Smart Farming Platform &amp; Agriculture App. Farming Easy, Farming Smart. Access real-time AI Crop Doctor pathology, live APMC mandi rates across 50+ crops, satellite crop telemetry, certified organic inputs, and farm bahi-khata for farmers across India." />
    <meta name="keywords" content="FarmsKing, farmsking.in, farmsking app, farmsking platform, farmsking india, farmsking farmers, smart farming, farming easy farming smart, smart farming app, smart farming platform india, smart agriculture india, AI Crop Doctor, live mandi rates, kisan app, Punjab kheti, digital agriculture India, Garden King, Nature King, AI King, Organic King, Account King, Pure Organic Food, Zero Fake Products, No Hardware Sales, No Equipment Rental, Rare Technology Agritech, Real Human Agronomy Service, Live Plants Delivery, Makhu, Goindwal Sahib, Punjab" />
    <meta property="og:site_name" content="FarmsKing - Smart Farming Platform &amp; Agriculture App India" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="FarmsKing: Smart Farming Platform &amp; Agriculture App India | Farming Easy, Farming Smart (farmsking.in)" />
    <meta property="og:description" content="FarmsKing (farmsking.in) is India's leading Smart Farming Platform &amp; Agriculture App. Farming Easy, Farming Smart. Real-time AI Crop Doctor, live APMC mandi rates, satellite telemetry, and pure organic inputs for farmers across India." />
    <meta property="og:image" content="https://farmsking.in/farmsking_logo.png" />
    <meta property="og:url" content="https://farmsking.in" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="FarmsKing: Smart Farming Platform &amp; Agriculture App India | Farming Easy, Farming Smart (farmsking.in)" />
    <meta name="twitter:description" content="FarmsKing (farmsking.in) is India's leading Smart Farming Platform &amp; Agriculture App. Farming Easy, Farming Smart. Real-time AI Crop Doctor, live APMC mandi rates, satellite telemetry, and pure organic inputs for farmers across India." />
    <meta name="twitter:image" content="https://farmsking.in/farmsking_logo.png" />

    <!-- Google WebSite Schema for Site Name & Brand Authority -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "FarmsKing",
      "alternateName": [
        "farmsking.in",
        "FarmsKing App",
        "FarmsKing Platform",
        "FarmsKing India",
        "FarmsKing Farmers",
        "Smart Farming",
        "Farming Easy Farming Smart",
        "Smart Farming India",
        "Smart Farming Platform",
        "FarmsKing Technologies",
        "FARMSKING TECHNOLOGIES PRIVATE LIMITED",
        "www.farmsking.in"
      ],
      "url": "https://farmsking.in",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://farmsking.in/?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    }
    </script>

    <!-- Google Corporation Schema -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Corporation",
      "name": "FARMSKING TECHNOLOGIES PRIVATE LIMITED",
      "alternateName": [
        "FarmsKing",
        "farmsking.in",
        "FarmsKing App",
        "FarmsKing Platform",
        "FarmsKing India",
        "FarmsKing Farmers",
        "Smart Farming",
        "Farming Easy Farming Smart",
        "Garden King",
        "Nature King",
        "AI King",
        "Organic King",
        "Account King",
        "FarmsKing Technologies"
      ],
      "url": "https://farmsking.in",
      "logo": "https://farmsking.in/farmsking_logo.png",
      "slogan": "Farming Easy, Farming Smart",
      "description": "FARMSKING TECHNOLOGIES PRIVATE LIMITED (farmsking.in) is India's leading Smart Farming Platform & Agriculture App. Guided by the motto 'Farming Easy, Farming Smart', FarmsKing encompasses the Multi-King ecosystem: Farms King, Garden King, Nature King, AI King, Organic King, and Account King. Unique across all verticals, blending rare technology (multimodal AI vision, satellite remote sensing) with real human service (certified agronomists, plant doctors, IT & hardware engineers). Absolute guarantee of 100% pure authentic food with zero counterfeits. A divine boon for farmers and plant lovers. Upcoming roadmap includes doorstep delivery of live plants. Strict Operational Boundaries: Zero hardware sales, zero equipment or machinery rentals, and zero farm machinery manufacturing. Exclusively dedicated to digital agritech software, AI plant pathology, live mandi intelligence, certified organic bio-fertilizers, live plants, and digital farmer accounting.",
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
      ],
      "director": [
        { "@type": "Person", "name": "Bakshish Singh", "jobTitle": "Director" },
        { "@type": "Person", "name": "Gagandeep Kaur", "jobTitle": "Director" }
      ],
      "employee": [
        { "@type": "Person", "name": "Gurnam Singh", "jobTitle": "General Manager & Quality Assurance Lead" },
        { "@type": "Person", "name": "Engg. Gurdit Singh", "jobTitle": "Technical Support Lead" },
        {
          "@type": "Person",
          "name": "Charanjit Singh",
          "jobTitle": "Backend Support Lead",
          "description": "IT systems expert leading high-performance backend infrastructure, API gateways, database optimization, and cloud architecture for FarmsKing."
        },
        {
          "@type": "Person",
          "name": "Gurjant Singh",
          "jobTitle": "Hardware Support Lead",
          "description": "Hardware and edge telemetry expert managing server equipment, diagnostic hardware, rural kiosk devices, and networking infrastructure for FarmsKing."
        },
        { "@type": "Person", "name": "Sudhir Kumar Mahato", "jobTitle": "Marigold Farming Expert, Promotion Partner & Testing Advisor" },
        { "@type": "Person", "name": "Manjeet Sra", "jobTitle": "Organic Products & Marketing Manager" }
      ]
    }
    </script>

    <!-- Google SoftwareApplication Schema for Web & Mobile App -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "FarmsKing App - Smart Farming Platform",
      "alternateName": [
        "FarmsKing",
        "farmsking.in",
        "FarmsKing App",
        "FarmsKing Platform",
        "FarmsKing India",
        "FarmsKing Farmers",
        "Smart Farming App",
        "Smart Farming Platform",
        "Farming Easy Farming Smart"
      ],
      "operatingSystem": "Android, iOS, Web",
      "applicationCategory": "AgricultureApplication, BusinessApplication",
      "url": "https://farmsking.in",
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "INR" },
      "description": "FarmsKing (farmsking.in) is India's premier Smart Farming Platform and Agriculture App. Farming Easy, Farming Smart. Features multimodal AI Crop Doctor diagnostics, live APMC mandi rates across 50+ crops, satellite crop telemetry, certified organic inputs, and digital bahi-khata accounting."
    }
    </script>

    <!-- Google FAQPage Schema for AI Search & Knowledge Graph -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is FarmsKing (farmsking.in)?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "FarmsKing (https://farmsking.in) is India's leading Smart Farming Platform and Agriculture App developed by FARMSKING TECHNOLOGIES PRIVATE LIMITED. Guided by the official motto 'Farming Easy, Farming Smart', FarmsKing delivers instant AI Crop Doctor diagnostics (<820ms), live APMC wholesale mandi rates across 50+ crops, 6-constellation satellite remote sensing, certified organic bio-fertilizers, and transparent digital bahi-khata accounting for farmers and growers across India."
          }
        },
        {
          "@type": "Question",
          "name": "What is FarmsKing App and how does it help Indian farmers with Smart Farming?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "FarmsKing App is a comprehensive Smart Farming Application accessible on Android, iOS, and Web. It provides Indian farmers with instant leaf disease detection, live mandi commodity arrivals, satellite vegetation telemetry (NDVI/EVI), weather risk alerts, and direct access to genuine organic fertilizers with zero counterfeits."
          }
        },
        {
          "@type": "Question",
          "name": "What is the meaning and philosophy of 'Farming Easy, Farming Smart'?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "'Farming Easy, Farming Smart' is the official motto and operating philosophy of FarmsKing. It means taking state-of-the-art agricultural science, artificial intelligence, and satellite technology, and making them effortlessly simple, accessible, and profitable for every farmer across India."
          }
        },
        {
          "@type": "Question",
          "name": "How does FarmsKing Platform serve farmers and plant lovers across India?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "FarmsKing Platform serves farmers across Punjab, Haryana, Rajasthan, Uttar Pradesh, Madhya Pradesh, Maharashtra, and nationwide with transparent market prices, free AI agronomy consultations, verified pure inputs, and reliable human support from agricultural scientists and engineers."
          }
        },
        {
          "@type": "Question",
          "name": "Who manages Technical, Backend and Hardware Support at FarmsKing?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Technical Support is led by Engg. Gurdit Singh. Backend Support is led by Charanjit Singh (Cloud Infrastructure). Hardware Support is led by Gurjant Singh (Telemetry & Systems). Operational Testing Advisors are Gurnam Singh and Sudhir Kumar Mahato."
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
      <div style="font-family: Arial, sans-serif; padding: 25px; line-height: 1.6; max-width: 960px; margin: 0 auto; color: #1e293b;">
        <header style="border-bottom: 3px solid #166534; padding-bottom: 16px; margin-bottom: 22px;">
          <h1 style="color: #166534; font-size: 26px; margin: 0 0 8px 0;">🌾 FarmsKing: Smart Farming Platform &amp; Agriculture App India | Farming Easy, Farming Smart (farmsking.in)</h1>
          <p style="font-size: 15px; color: #475569; margin: 0;">
            India's National Smart Farming Platform &amp; Agriculture App | Farming Easy, Farming Smart | AI Crop Doctor | Live Mandi Rates | Satellite Telemetry | Pure Organic Inputs
          </p>
        </header>

        <main>
          <section style="margin-bottom: 24px; background: #f8fafc; padding: 20px; border-radius: 10px; border: 1px solid #e2e8f0;">
            <h2 style="color: #15803d; font-size: 20px; margin-top: 0; margin-bottom: 10px;">Smart Farming Made Easy: What is FarmsKing (farmsking.in)?</h2>
            <p style="font-size: 14.5px; margin-bottom: 10px;">
              <strong>FarmsKing (https://farmsking.in)</strong> is India's leading <strong>Smart Farming Platform and Agriculture App</strong> created by <strong>FARMSKING TECHNOLOGIES PRIVATE LIMITED</strong>. Guided by the motto <strong>"Farming Easy, Farming Smart"</strong>, FarmsKing empowers Indian farmers and plant lovers with multimodal AI Crop Doctor pathology, live APMC wholesale mandi rates across 50+ crops, 6-constellation satellite remote sensing, certified organic bio-fertilizers, and transparent digital bahi-khata accounting.
            </p>
            <p style="font-size: 14.5px; margin: 0;">
              Headquartered in Makhu (Punjab) with its statutory registered office in Goindwal Sahib (Tarn Taran), FarmsKing operates nationwide across Punjab, Haryana, Rajasthan, Uttar Pradesh, Madhya Pradesh, Maharashtra, and all Indian states.
            </p>
          </section>

          <section style="background: #f0fdf4; padding: 20px; border-radius: 10px; border: 1px solid #bbf7d0; margin-bottom: 24px;">
            <h2 style="color: #166534; font-size: 20px; margin-top: 0; margin-bottom: 10px;">⭐ Core Smart Farming Services on FarmsKing App &amp; Platform:</h2>
            <ul style="padding-left: 20px; font-size: 14.5px; margin: 0;">
              <li style="margin-bottom: 8px;"><strong>🌾 Farms King (Live Mandi Intelligence):</strong> Daily arrival rates across 50+ crops and major APMC markets (Khanna, Ludhiana, Bathinda, Moga, Rajpura, Sirsa, Makhu) with historical trend intelligence.</li>
              <li style="margin-bottom: 8px;"><strong>🤖 AI King (AI Crop Doctor):</strong> Instant leaf pathology scan in under 820ms using multimodal vision AI, delivering university-calibrated disease detection and organic treatment schedules.</li>
              <li style="margin-bottom: 8px;"><strong>🛰️ Satellite Crop Telemetry:</strong> 6-constellation satellite monitoring (Sentinel-2, Copernicus, ISRO Bhuvan) providing NDVI vegetation health, moisture levels, and weather risk alerts.</li>
              <li style="margin-bottom: 8px;"><strong>🌱 Organic King (Pure Bio-Fertilizers):</strong> Laboratory-verified microbial vermicompost, marigold floriculture consultancy (3x-5x profit blueprint), and authentic organic farm inputs with 100% zero counterfeit guarantee.</li>
              <li style="margin-bottom: 8px;"><strong>🏡 Garden King (Urban Gardening):</strong> Specialized plant care system for home terrace and balcony growers with precision dosage schedules, plant doctors, and upcoming doorstep live plants delivery.</li>
              <li style="margin-bottom: 8px;"><strong>📑 Account King (Digital Bahi-Khata):</strong> Transparent digital ledger for farmers, automated transaction vouchers, mandi settlements, and tamper-proof farm accounting.</li>
              <li><strong>🎯 Farming Easy, Farming Smart:</strong> Making modern agricultural technology intuitive, accessible, and highly profitable for every Indian farmer.</li>
            </ul>
          </section>

          <section style="margin-bottom: 24px;">
            <h2 style="color: #15803d; font-size: 19px; margin-bottom: 10px;">Corporate Governance &amp; Official Identity:</h2>
            <p style="font-size: 14px; color: #334155; margin-bottom: 6px;">
              <strong>FARMSKING TECHNOLOGIES PRIVATE LIMITED</strong> (CIN / Regd: Ministry of Corporate Affairs, ROC Chandigarh, India)
            </p>
            <p style="font-size: 14px; color: #334155; margin: 0;">
              • <strong>Directors:</strong> Bakshish Singh &amp; Gagandeep Kaur<br />
              • <strong>General Manager &amp; Operations Lead:</strong> Gurnam Singh<br />
              • <strong>Engineering &amp; Support:</strong> Engg. Gurdit Singh (Tech Support Lead), Charanjit Singh (Backend Systems Lead), Gurjant Singh (Hardware Systems Lead)<br />
              • <strong>Agronomy Specialists:</strong> Sudhir Kumar Mahato (Marigold Floriculture &amp; Testing Advisor), Manjeet Sra (Organic Products &amp; Marketing Manager)<br />
              • <strong>Registered Office:</strong> VPO Goindwal Sahib, Tehsil Khadur Sahib, Tarn Taran, Punjab - 143422, India<br />
              • <strong>Operational Headquarters:</strong> Makhu, Ferozepur, Punjab - 142044, India
            </p>
          </section>

          <section style="border-top: 1px solid #e2e8f0; padding-top: 16px;">
            <h3 style="color: #334155; font-size: 16px; margin: 0 0 8px 0;">Official Portals &amp; Verification Links:</h3>
            <p style="font-size: 13.5px; margin: 0;">
              • <a href="/about-farmsking.html" style="color: #166534; font-weight: bold;">About FarmsKing Platform</a> | 
              • <a href="/compliance" style="color: #166534; font-weight: bold;">MCA Corporate Compliance</a> | 
              • <a href="/contact-us" style="color: #166534; font-weight: bold;">Contact Support Desk</a> | 
              • <a href="/kisan-crop-intelligence-engine.html" style="color: #166534; font-weight: bold;">Kisan Crop Intelligence</a> | 
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

    // ADMIN Route Static HTML & Directory
    const adminHtmlPath = path.join(distDir, 'admin.html');
    const adminSubDir = path.join(distDir, 'admin');
    fs.writeFileSync(adminHtmlPath, indexHtml, 'utf8');
    if (!fs.existsSync(adminSubDir)) fs.mkdirSync(adminSubDir, { recursive: true });
    fs.writeFileSync(path.join(adminSubDir, 'index.html'), indexHtml, 'utf8');

    console.log('✅ Preserved and deployed static you.html, sk.html, dose.html, my.html, admin.html and route subdirectories');
  }

  console.log('✅ Expo Web build completed successfully!');
} catch (err) {
  console.error('❌ Build failed:', err.message);
  process.exit(1);
}
