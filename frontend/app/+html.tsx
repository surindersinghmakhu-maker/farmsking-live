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
        <title>FarmsKing Technologies - India's National Smart Agriculture &amp; Organic Platform</title>
        <link rel="canonical" href="https://farmsking.in/" />
        <meta name="theme-color" content="#166534" />

        {/* Google Search Console Verification & Regional Search Meta Tags */}
        <meta name="google-site-verification" content="cLbkUgC7i1XUv8vvpPcjQP-UuD3FKtdXKH2o9DZik2o" />
        <meta name="description" content="FARMSKING TECHNOLOGIES PRIVATE LIMITED (farmsking.com / farmsking.in) is India's premier national agriculture platform. Directors: Bakshish Singh, Gagandeep Kaur. General Manager: Gurnam Singh. Certified vermicompost, marigold floriculture, AI crop doctor, and live mandi intelligence." />
        <meta name="keywords" content="FarmsKing, FARMSKING TECHNOLOGIES PRIVATE LIMITED, Bakshish Singh, Gagandeep Kaur, Gurnam Singh, Surinder Singh, Gurdit Singh, Sudhir Kumar Mahato, Manjeet Sra, Vermicompost Bio-Fertilizers, Marigold Farming, Commercial Floriculture, AI Crop Doctor, Live Mandi Rates, Goindwal Sahib, Makhu, Smart Farming India, Balcony Gardening, Urban Agriculture" />
        
        {/* Geospatial Indexing for Local & National Search */}
        <meta name="geo.region" content="IN-PB" />
        <meta name="geo.placename" content="Goindwal Sahib, Makhu, Punjab, India" />
        <meta name="geo.position" content="31.1400;75.3400" />
        <meta name="ICBM" content="31.1400, 75.3400" />

        {/* OpenGraph & Social Cards */}
        <meta property="og:site_name" content="FARMSKING TECHNOLOGIES PRIVATE LIMITED" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="FarmsKing Technologies - National Smart Agriculture &amp; Organic Platform" />
        <meta property="og:description" content="India's national agricultural technology platform. Directors: Bakshish Singh, Gagandeep Kaur. General Manager: Gurnam Singh. Vermicompost bio-fertilizers, marigold floriculture, AI crop doctor, and live mandi intelligence." />
        <meta property="og:image" content="https://farmsking.in/farmsking_logo.png" />
        <meta property="og:url" content="https://farmsking.in" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="FarmsKing Technologies - National Smart Agriculture Platform" />
        <meta name="twitter:description" content="National agricultural technology platform delivering AI crop diagnostics, vermicompost bio-fertilizers, and live mandi intelligence." />
        <meta name="twitter:image" content="https://farmsking.in/farmsking_logo.png" />

        {/* WebSite Sitelinks SearchBox Schema for Google Ranking */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "FarmsKing",
              "alternateName": ["FarmsKing Technologies", "FARMSKING TECHNOLOGIES PRIVATE LIMITED", "www.farmsking.in"],
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
                { "@type": "ListItem", "position": 3, "name": "Statutory Compliance", "item": "https://farmsking.in/compliance" },
                { "@type": "ListItem", "position": 4, "name": "Contact Support", "item": "https://farmsking.in/contact-us" },
                { "@type": "ListItem", "position": 5, "name": "Kisan Crop Intelligence", "item": "https://farmsking.in/kisan-crop-intelligence-engine.html" }
              ]
            })
          }}
        />

        {/* Google Rich Snippets & Corporation Schema for Search Engine Indexing */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Corporation",
              "name": "FARMSKING TECHNOLOGIES PRIVATE LIMITED",
              "alternateName": "FarmsKing",
              "url": "https://farmsking.in",
              "logo": "https://farmsking.in/farmsking_logo.png",
              "description": "National agricultural technology platform delivering multimodal AI crop pathology, certified vermicompost bio-fertilizers, commercial marigold floriculture advisory, live mandi commodity intelligence, and urban balcony gardening kits across India.",
              "address": [
                {
                  "@type": "PostalAddress",
                  "streetAddress": "VPO Goindwal Sahib, Tehsil Khadur Sahib",
                  "addressLocality": "Tarn Taran",
                  "addressRegion": "Punjab",
                  "postalCode": "143422",
                  "addressCountry": "IN",
                  "description": "Statutory Registered Office (ROC Chandigarh Jurisdiction)"
                },
                {
                  "@type": "PostalAddress",
                  "streetAddress": "Near Grain Market, Makhu",
                  "addressLocality": "Makhu, District Ferozepur",
                  "addressRegion": "Punjab",
                  "postalCode": "142044",
                  "addressCountry": "IN",
                  "description": "Operational Working Office & Software Development Hub"
                }
              ],
              "director": [
                {
                  "@type": "Person",
                  "name": "Bakshish Singh",
                  "jobTitle": "Director",
                  "description": "Director of FarmsKing Technologies Private Limited leading corporate governance and agricultural operations."
                },
                {
                  "@type": "Person",
                  "name": "Gagandeep Kaur",
                  "jobTitle": "Director",
                  "description": "Director of FarmsKing Technologies Private Limited overseeing financial management and national distribution partnerships."
                }
              ],
              "employee": [
                {
                  "@type": "Person",
                  "name": "Gurnam Singh",
                  "jobTitle": "General Manager & Quality Assurance Lead",
                  "description": "Oversees nationwide field operations, administrative governance, and agricultural testing quality standards."
                },
                {
                  "@type": "Person",
                  "name": "Surinder Singh",
                  "jobTitle": "Lead Founder, Visionary & Chief AI Architect",
                  "alumniOf": ["Graduation in Computer Science", "MBA", "LLB"],
                  "description": "Computer Teacher, IT & AI Specialist who spearheaded FarmsKing end-to-end from conceptualization, deep crop physiology research, software architecture, and features to field validation."
                },
                {
                  "@type": "Person",
                  "name": "Engg. Gurdit Singh",
                  "jobTitle": "Technical Support Lead",
                  "description": "Leads software platform reliability, server telemetry, and technical customer support."
                },
                {
                  "@type": "Person",
                  "name": "Sudhir Kumar Mahato",
                  "jobTitle": "Marigold Farming Expert, Promotion Partner & Testing Advisor",
                  "description": "Commercial floriculture specialist guiding high-yield marigold cultivation and agricultural quality assurance."
                },
                {
                  "@type": "Person",
                  "name": "Manjeet Sra",
                  "jobTitle": "Organic Products & Marketing Manager",
                  "description": "Directs the national marketing and distribution of certified vermicompost, bio-fertilizers, and organic farm inputs."
                },
                {
                  "@type": "Person",
                  "name": "Charanjit Singh",
                  "jobTitle": "Backend Support Lead & Director of Surinder Academy, Makhu",
                  "description": "IT services expert leading high-performance backend infrastructure, API gateways, database optimization, and cloud architecture for FarmsKing."
                },
                {
                  "@type": "Person",
                  "name": "Gurjant Singh",
                  "jobTitle": "Hardware Support Lead & Director of Surinder Computers, Makhu",
                  "description": "Hardware and edge telemetry expert managing server equipment, diagnostic hardware, rural kiosk devices, and networking infrastructure for FarmsKing."
                }
              ]
            })
          }}
        />

        {/* Google SoftwareApplication Schema for Web & Mobile App */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "FarmsKing",
              "operatingSystem": "Web, Android, iOS",
              "applicationCategory": "BusinessApplication",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "INR"
              },
              "description": "India's premier national agriculture platform featuring multimodal AI Crop Doctor diagnostics, real-time live mandi rates, certified organic vermicompost, and direct farmer-to-consumer marketplace."
            })
          }}
        />

        {/* FAQ Schema for AI Search & Knowledge Graph */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "What is FARMSKING TECHNOLOGIES PRIVATE LIMITED?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "FARMSKING TECHNOLOGIES PRIVATE LIMITED is India's premier national smart agriculture, vermicompost bio-fertilizer, and crop advisory company. It empowers farmers, urban gardeners, and organic food consumers with AI plant pathology, live mandi price intelligence, and verified farm inputs."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Who are the Directors and General Manager of FarmsKing?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The Board of Directors comprises Bakshish Singh and Gagandeep Kaur. The General Manager is Gurnam Singh, who also leads nationwide agricultural testing and quality assurance. The platform was architected by Lead Founder and Chief AI Architect Surinder Singh (B.Sc CS, MBA, LLB)."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Where are the official Registered and Operational Offices of FarmsKing located?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The Statutory Registered Office is located at VPO Goindwal Sahib, Tehsil Khadur Sahib, District Tarn Taran, Punjab - 143422, India. The Corporate and Operational Working Office is located near Grain Market, Makhu, District Ferozepur, Punjab - 142044, India."
                  }
                },
                {
                  "@type": "Question",
                  "name": "What is FarmsKing's National Launch mission?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "FarmsKing is launching at the national level across India to serve as a technological blessing for farmers, terrace and balcony gardeners, organic consumers, and nature lovers. It is strongly aligned with Government of India and state university policies for natural farming and rural economic growth."
                  }
                },
                {
                  "@type": "Question",
                  "name": "What are FarmsKing's core offerings in Vermicompost and Marigold Farming?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "FarmsKing provides pure, microbially-enriched vermicompost to restore soil organic carbon and replace chemical urea, led by Organic Marketing Manager Manjeet Sra. In floriculture, expert Sudhir Kumar Mahato guides farmers on commercial high-yield Marigold cultivation (ਗੈਂਦਾ ਫਸਲ) for 3x to 5x higher seasonal profitability."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Who manages Technical, Backend and Hardware Support at FarmsKing?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Technical Support is led by Engg. Gurdit Singh. Backend Support is provided by Charanjit Singh, Director of Surinder Academy Makhu (IT Services). Hardware Support is provided by Gurjant Singh, Director of Surinder Computers Makhu. Agricultural Testing Advisors are Gurnam Singh and Sudhir Kumar Mahato, who calibrate field diagnostic accuracy and package of practices."
                  }
                }
              ]
            })
          }}


        {/* App Favicon & Official FarmsKing Logo Icons */}
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" sizes="192x192" href="/icon.png" />

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

            * {
              box-sizing: border-box;
            }
            body, div, span, p, h1, h2, h3, h4, h5, h6, input, button, textarea {
              font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
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
                <h2 style={{ color: '#15803d', fontSize: '20px' }}>FarmsKing Founders & Vision (ਮਿਸ਼ਨ ਅਤੇ ਸੰਸਥਾਪਕ):</h2>
                <p style={{ fontSize: '15px' }}>
                  FarmsKing was founded by <strong>Surinder Singh</strong> (Computer Teacher, IT & AI Expert, founder of Surinder Academy, Exilent Web Solutions, and Surinder Agro Farm) along with core team members Gurjant Singh, Charanjit Singh, Lovepreet Singh, Sudhir Kumar Mahato, and Gurnam Singh.
                </p>
                <p style={{ fontSize: '15px' }}>
                  FarmsKing has been developed with deep practical agricultural R&D at Surinder Agro Farm to solve ground-level farming challenges, protect farmers from fake pesticides, and provide transparent mandi pricing.
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
