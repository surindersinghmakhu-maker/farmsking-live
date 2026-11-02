import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        {/* Primary Page Title & Canonical SEO Tags */}
        <title>FarmsKing - India's #1 Smart Farming & Crop Intelligence Platform | Smart Agriculture</title>
        <link rel="canonical" href="https://farmsking.in/" />
        <meta name="theme-color" content="#166534" />

        {/* App Favicon & Official FarmsKing Logo Icons - High-DPI Sharpness */}
        <link rel="icon" type="image/png" sizes="128x128" href="/favicon.png?v=5" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png?v=5" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon.png?v=5" />
        <link rel="shortcut icon" href="/favicon.ico?v=5" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=5" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon.png?v=5" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png?v=5" />

        {/* Google Search Console Verification & Regional Search Meta Tags */}
        <meta name="google-site-verification" content="cLbkUgC7i1XUv8vvpPcjQP-UuD3FKtdXKH2o9DZik2o" />
        <meta name="description" content="FarmsKing (farmsking.in / www.farmsking.in) is India's leading Smart Farming & Crop Advisory Platform. AI crop intelligence, disease diagnosis, APMC mandi rates, satellite telemetry & farmer accounting." />
        <meta name="keywords" content="FarmsKing, www.farmsking.in, farmsking.in, Smart Farming, Crop Advisory, Agriculture Doctor, Kisan App, Crop Disease Scan, Reverse Sowing Engine, Live Mandi Rates, Goindwal Sahib, Makhu, Punjab" />
        
        {/* OpenGraph & Social Cards */}
        <meta property="og:site_name" content="FarmsKing Smart Agriculture Platform" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="FarmsKing - Smart Farming & Crop Intelligence Platform" />
        <meta property="og:description" content="India's leading Smart Farming & Crop Advisory Platform. AI crop care, live mandi rates, satellite telemetry and organic farm inputs." />
        <meta property="og:image" content="https://farmsking.in/brand_logo.png" />
        <meta property="og:url" content="https://farmsking.in" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="FarmsKing - Smart Farming & Crop Intelligence Platform" />
        <meta name="twitter:description" content="India's leading Smart Farming & Crop Advisory Platform. AI crop care, live mandi rates, satellite telemetry and organic farm inputs." />
        <meta name="twitter:image" content="https://farmsking.in/brand_logo.png" />

        {/* WebSite Sitelinks SearchBox Schema for Google #1 Ranking */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "FarmsKing",
              "alternateName": ["FarmsKing Platform", "www.farmsking.in"],
              "url": "https://farmsking.in",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://farmsking.in/?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />

        {/* Google BreadcrumbList Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "FarmsKing Home", "item": "https://farmsking.in/" },
                { "@type": "ListItem", "position": 2, "name": "About FarmsKing", "item": "https://farmsking.in/about-farmsking.html" },
                { "@type": "ListItem", "position": 3, "name": "Surinder Agro Farm", "item": "https://farmsking.in/surinder-agro-farm.html" },
                { "@type": "ListItem", "position": 4, "name": "Punjab Kheti Advisory", "item": "https://farmsking.in/punjab-kheti-advisory.html" },
                { "@type": "ListItem", "position": 5, "name": "Kisan Crop Intelligence", "item": "https://farmsking.in/kisan-crop-intelligence-engine.html" }
              ]
            })
          }}
        />

        {/* Google Rich Snippets & FAQ Schema for Search Engine Indexing */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "FarmsKing",
              "operatingSystem": "ANDROID, IOS, WEB",
              "applicationCategory": "BusinessApplication",
              "ratingValue": "4.9",
              "ratingCount": "1250",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "INR"
              },
              "description": "FarmsKing Smart Farming, Crop Advisory, Agriculture Doctor Consultation & Crop Intelligence Platform operated by FARMSKING TECHNOLOGIES PRIVATE LIMITED.",
              "author": {
                "@type": "Organization",
                "name": "FARMSKING TECHNOLOGIES PRIVATE LIMITED",
                "url": "https://farmsking.in"
              }
            })
          }}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "What is FarmsKing Smart Farming Platform?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "FarmsKing is India's leading agricultural intelligence platform providing AI crop advisory, disease diagnosis, weather alerts, and expert doctor consultation for farmers."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Who operates FarmsKing and what is its corporate identity?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "FarmsKing is operated by FARMSKING TECHNOLOGIES PRIVATE LIMITED, an incorporated private limited company under the Ministry of Corporate Affairs, ROC Chandigarh. The mission is purely social and farmer-centric: solving real ground-level farming challenges, creating employment, supporting farmers, and promoting natural farming and organic produce without commercial profit motives."
                  }
                },
                {
                  "@type": "Question",
                  "name": "What are the core capabilities of FarmsKing?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "FarmsKing combines multimodal AI crop disease diagnosis, satellite field telemetry, daily APMC mandi rates across 50+ crops, certified organic inputs, and digital double-entry bahi-khata farm accounting."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Where is FarmsKing registered and headquartered?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The Statutory Registered Office is located at VPO Goindwal Sahib, Tehsil Khadur Sahib, District Tarn Taran, Punjab - 143422, India. The Corporate Headquarters and Operational Office is located at Makhu, Ferozepur, Punjab - 142044, India."
                  }
                },
                {
                  "@type": "Question",
                  "name": "What are the future launch and expansion plans for FarmsKing?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "FarmsKing is currently undergoing field validation and is planned for official launch in collaboration with Punjab Agricultural University (PAU), followed by a nationwide launch at the national level across India."
                  }
                },
                {
                  "@type": "Question",
                  "name": "How to claim FarmsKing Welcome Cash Bonus?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Register on FarmsKing using a valid referral code or link, open your Wallet screen, and click 'Claim Bonus' to receive instant wallet cashback."
                  }
                },
                {
                  "@type": "Question",
                  "name": "How to consult an Agriculture Doctor on FarmsKing?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Open FarmsKing app, navigate to Advisor Consultation, select your crop problem or upload a crop photo, and connect with certified Agriculture Experts."
                  }
                },
                {
                  "@type": "Question",
                  "name": "What is Reverse Sowing Engine?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "FarmsKing's Reverse Sowing Engine calculates festival demand dates (Diwali, Chhath, Baisakhi) to advise farmers on the exact sowing date for 3x market prices."
                  }
                }
              ]
            })
          }}
        />


        {/* 🌟 100% Reliable Production Web Fonts & Vector Icons CDN Fallbacks */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&family=Space+Mono&display=swap" rel="stylesheet" />
        <style dangerouslySetInnerHTML={{
          __html: `
            @font-face {
              font-family: 'Ionicons';
              src: url('https://cdnjs.cloudflare.com/ajax/libs/ionicons/5.5.2/fonts/ionicons.ttf') format('truetype');
            }
            @font-face {
              font-family: 'MaterialIcons';
              src: url('https://cdnjs.cloudflare.com/ajax/libs/material-design-icons/3.0.1/iconfont/MaterialIcons-Regular.ttf') format('truetype');
            }
            @font-face {
              font-family: 'MaterialCommunityIcons';
              src: url('https://cdnjs.cloudflare.com/ajax/libs/MaterialDesign-Webfont/7.2.96/fonts/materialdesignicons-webfont.ttf') format('truetype');
            }
            @font-face {
              font-family: 'FontAwesome';
              src: url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/fonts/fontawesome-webfont.ttf') format('truetype');
            }
            @font-face {
              font-family: 'Feather';
              src: url('https://cdnjs.cloudflare.com/ajax/libs/feather-icons/4.29.0/feather.ttf') format('truetype');
            }
            @font-face {
              font-family: 'AntDesign';
              src: url('https://cdn.jsdelivr.net/npm/react-native-vector-icons@10.0.0/Fonts/AntDesign.ttf') format('truetype');
            }
            @font-face {
              font-family: 'Entypo';
              src: url('https://cdn.jsdelivr.net/npm/react-native-vector-icons@10.0.0/Fonts/Entypo.ttf') format('truetype');
            }

            /* ─── Global Responsive Layout Reset ─────────────────────────────────
               Ensures the entire React Native Web app shell is always "fit to
               screen": no horizontal scroll, 100% viewport height used, and
               flex containers fill all available space automatically.
               ──────────────────────────────────────────────────────────────── */
            *, *::before, *::after {
              box-sizing: border-box;
            }

            /* Make html & body fill the full viewport */
            html, body {
              width: 100%;
              max-width: 100vw !important;
              height: 100%;
              margin: 0;
              padding: 0;
              overflow-x: hidden !important;
              overflow-y: hidden;
              position: relative;
            }

            /* Expo Web root mounts into #root — it must be a full-height flex column */
            #root {
              display: flex;
              flex-direction: column;
              width: 100%;
              max-width: 100vw !important;
              height: 100%;
              overflow-x: hidden !important;
              overflow-y: hidden;
              position: relative;
            }

            /* All top-level Expo RN View divs should stretch */
            #root > div {
              flex: 1;
              display: flex;
              flex-direction: column;
              min-height: 0;
              max-width: 100vw !important;
              overflow-x: hidden !important;
            }

            /* Scrollable areas inside pages should scroll, not the page itself */
            .r-overflow-scroll, [class*='scrollView'], [data-testid='scroll-view'] {
              overflow-y: auto !important;
              overflow-x: hidden !important;
              -webkit-overflow-scrolling: touch;
            }

            /* Prevent any stray element from causing horizontal page scroll */
            body > div, #root > div {
              max-width: 100vw !important;
              overflow-x: hidden !important;
            }

            /* Typography baseline */
            body, div, span, p, h1, h2, h3, h4, h5, h6, input, button, textarea {
              font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
            }

            /* Smooth scrolling everywhere */
            * {
              scroll-behavior: smooth;
            }

            /* Hide native scrollbar on webkit (keeps the UI clean on desktop) */
            ::-webkit-scrollbar {
              width: 5px;
              height: 5px;
            }
            ::-webkit-scrollbar-track {
              background: rgba(0, 0, 0, 0.1);
            }
            ::-webkit-scrollbar-thumb {
              background: rgba(0, 255, 135, 0.3);
              border-radius: 10px;
            }
            ::-webkit-scrollbar-thumb:hover {
              background: rgba(0, 255, 135, 0.55);
            }
          `
        }} />

        <ScrollViewStyleReset />
      </head>
      <body>
        <noscript>
          <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px', lineHeight: '1.6', maxWidth: '900px', margin: '0 auto', color: '#1e293b' }}>
            <header style={{ borderBottom: '2px solid #166534', paddingBottom: '15px', marginBottom: '20px' }}>
              <h1 style={{ color: '#166534', fontSize: '28px', margin: '0' }}>🌾 FarmsKing (ਫਾਰਮਸਕਿੰਗ) - India's #1 Agricultural Super App & Agri Marketplace</h1>
              <p style={{ fontSize: '16px', color: '#475569', margin: '5px 0 0 0' }}>
                Direct Farmer-to-Buyer Marketplace | Agri AI Doctor | Live Mandi Rates | Genuine Fertilizers & Seeds | Multi-Vendor Logistics
              </p>
            </header>

            <main>
              <section style={{ marginBottom: '25px' }}>
                <h2 style={{ color: '#15803d', fontSize: '22px' }}>FarmsKing ਕੀ ਹੈ ਅਤੇ ਕਿਵੇਂ ਕੰਮ ਕਰਦਾ ਹੈ? (What is FarmsKing & How It Works)</h2>
                <p style={{ fontSize: '15px' }}>
                  <strong>FarmsKing (farmsking.in)</strong> ਭਾਰਤ ਦਾ ਸਭ ਤੋਂ ਉੱਨਤ ਖੇਤੀਬਾੜੀ ਡਿਜੀਟਲ ਪਲੇਟਫਾਰਮ ਹੈ, ਜੋ ਕਿਸਾਨਾਂ ਨੂੰ ਸਿੱਧਾ ਮੰਡੀ ਦੇ ਖਰੀਦਦਾਰਾਂ, ਪ੍ਰਮਾਣਿਤ ਬੀਜ/ਖਾਦ ਸਟੋਰਾਂ, ਅਤੇ ਲਾਈਵ ਮੰਡੀ ਭਾਵਾਂ ਨਾਲ ਜੋੜਦਾ ਹੈ।
                </p>
                <p style={{ fontSize: '15px' }}>
                  FarmsKing is India's leading digital agricultural platform connecting farmers directly with mandi buyers, certified seed & fertilizer stores, live mandi prices, Agri AI doctor crop advice, and multi-vendor logistics.
                </p>
              </section>

              <section style={{ background: '#f0fdf4', padding: '20px', borderRadius: '8px', border: '1px solid #bbf7d0', marginBottom: '25px' }}>
                <h2 style={{ color: '#166534', fontSize: '20px', marginTop: '0' }}>⭐ Key Features & Services on FarmsKing (ਮੁੱਖ ਖੂਬੀਆਂ):</h2>
                <ul style={{ paddingLeft: '20px', fontSize: '15px' }}>
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

              <section style={{ marginBottom: '25px' }}>
                <h2 style={{ color: '#15803d', fontSize: '20px' }}>FarmsKing Corporate Governance &amp; Vision:</h2>
                <p style={{ fontSize: '15px' }}>
                  FarmsKing is operated by <strong>FARMSKING TECHNOLOGIES PRIVATE LIMITED</strong>, dedicated to empowering Indian farmers with digital crop diagnostics, real-time APMC mandi pricing, and genuine certified agricultural inputs.
                </p>
                <p style={{ fontSize: '15px' }}>
                  FarmsKing is developed with deep agricultural research to solve ground-level farming challenges, protect farmers from spurious inputs, and deliver complete digital ledger transparency.
                </p>
              </section>

              <section style={{ borderTop: '1px solid #e2e8f0', paddingTop: '15px' }}>
                <h3 style={{ color: '#334155', fontSize: '18px' }}>Quick Links & Official Pages:</h3>
                <p style={{ fontSize: '14px' }}>
                  • <a href="/about-farmsking.html" style={{ color: '#166534', fontWeight: 'bold' }}>About FarmsKing Platform</a> | 
                  • <a href="/punjab-kheti-advisory.html" style={{ color: '#166534', fontWeight: 'bold' }}>Punjab Kheti Advisory</a> | 
                  • <a href="/kisan-crop-intelligence-engine.html" style={{ color: '#166534', fontWeight: 'bold' }}>Kisan Crop Intelligence</a> | 
                  • <a href="/surinder-agro-farm.html" style={{ color: '#166534', fontWeight: 'bold' }}>Surinder Agro Farm R&D</a> | 
                  • <a href="/sitemap.xml" style={{ color: '#166534', fontWeight: 'bold' }}>XML Sitemap</a>
                </p>
              </section>
            </main>
          </div>
        </noscript>
        {children}
      </body>
    </html>
  );
}
