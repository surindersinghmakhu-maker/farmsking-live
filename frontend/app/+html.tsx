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
        <title>FarmsKing: Smart Farming Platform &amp; Agriculture App India | Farming Easy, Farming Smart (farmsking.in)</title>
        <link rel="canonical" href="https://farmsking.in/" />
        <meta name="theme-color" content="#166534" />

        {/* Google Search Console Verification & Regional Search Meta Tags */}
        <meta name="google-site-verification" content="cLbkUgC7i1XUv8vvPcjQP-UuD3FKtdXKH2o9DZik2o" />
        <meta name="description" content="FarmsKing (farmsking.in) is India's premier Smart Farming Platform &amp; Agriculture App. Farming Easy, Farming Smart. Access real-time AI Crop Doctor pathology, live APMC mandi rates across 50+ crops, satellite crop telemetry, certified organic inputs, and farm bahi-khata for farmers across India." />
        <meta name="keywords" content="FarmsKing, farmsking.in, farmsking app, farmsking platform, farmsking india, farmsking farmers, smart farming, farming easy farming smart, smart farming app, smart farming platform india, smart agriculture india, AI Crop Doctor, live mandi rates, kisan app, Punjab kheti, digital agriculture India, Garden King, Nature King, AI King, Organic King, Account King, Pure Organic Food, Zero Fake Products, No Hardware Sales, No Equipment Rental, Rare Technology Agritech, Real Human Agronomy Service, Live Plants Delivery, Makhu, Goindwal Sahib, Punjab" />
        
        {/* Geospatial Indexing for Local & National Search */}
        <meta name="geo.region" content="IN-PB" />
        <meta name="geo.placename" content="Makhu, Goindwal Sahib, Punjab, India" />
        <meta name="geo.position" content="31.1400;75.3400" />
        <meta name="ICBM" content="31.1400, 75.3400" />

        {/* OpenGraph & Social Cards */}
        <meta property="og:site_name" content="FarmsKing - Smart Farming Platform &amp; Agriculture App India" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="FarmsKing: Smart Farming Platform &amp; Agriculture App India | Farming Easy, Farming Smart (farmsking.in)" />
        <meta property="og:description" content="FarmsKing (farmsking.in) is India's leading Smart Farming Platform &amp; Agriculture App. Farming Easy, Farming Smart. Real-time AI Crop Doctor, live APMC mandi rates, satellite telemetry, and pure organic inputs for farmers across India." />
        <meta property="og:image" content="https://farmsking.in/brand_logo.png" />
        <meta property="og:url" content="https://farmsking.in" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="FarmsKing: Smart Farming Platform &amp; Agriculture App India | Farming Easy, Farming Smart (farmsking.in)" />
        <meta name="twitter:description" content="FarmsKing (farmsking.in) is India's leading Smart Farming Platform &amp; Agriculture App. Farming Easy, Farming Smart. Real-time AI Crop Doctor, live APMC mandi rates, satellite telemetry, and pure organic inputs for farmers across India." />
        <meta name="twitter:image" content="https://farmsking.in/brand_logo.png" />

        {/* WebSite Sitelinks SearchBox Schema for Google Ranking */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
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
              "logo": "https://farmsking.in/brand_logo.png",
              "slogan": "Farming Easy, Farming Smart",
              "description": "FARMSKING TECHNOLOGIES PRIVATE LIMITED (farmsking.in) is India's leading Smart Farming Platform & Agriculture App. Guided by the motto 'Farming Easy, Farming Smart', FarmsKing encompasses the Multi-King ecosystem: Farms King, Garden King, Nature King, AI King, Organic King, and Account King. Unique across all verticals, blending rare technology (multimodal AI vision, satellite remote sensing) with real human service (certified agronomists, plant doctors, IT & hardware engineers). Absolute guarantee of 100% pure authentic food with zero counterfeits. A divine boon for farmers and plant lovers. Upcoming roadmap includes doorstep delivery of live plants. Strict Operational Boundaries: Zero hardware sales, zero equipment or machinery rentals, and zero farm machinery manufacturing. Exclusively dedicated to digital agritech software, AI plant pathology, live mandi intelligence, certified organic bio-fertilizers, live plants, and digital farmer accounting.",
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
                  "streetAddress": "Makhu",
                  "addressLocality": "Makhu, Ferozepur",
                  "addressRegion": "Punjab",
                  "postalCode": "142044",
                  "addressCountry": "IN",
                  "description": "Headquarters & Operational Working Office"
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
              "operatingSystem": "Web, Android, iOS",
              "applicationCategory": "AgricultureApplication, BusinessApplication",
              "url": "https://farmsking.in",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "INR"
              },
              "description": "FarmsKing (farmsking.in) is India's premier Smart Farming Platform and Agriculture App. Farming Easy, Farming Smart. Features multimodal AI Crop Doctor diagnostics, live APMC mandi rates across 50+ crops, satellite crop telemetry, certified organic inputs, and digital bahi-khata accounting."
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
                  "name": "Why is FarmsKing known as Garden King, Nature King, AI King, Organic King, and Account King?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "FarmsKing is a multi-domain ecosystem excelling across all verticals: Garden King (urban terrace and balcony plant care), Nature King (pure eco-friendly chemical-free living), AI King (multimodal crop diagnosis and satellite telemetry), Organic King (certified pure vermicompost and authentic organic produce), and Account King (transparent digital bahi-khata ledger and mandi receipts)."
                  }
                },
                {
                  "@type": "Question",
                  "name": "What is FarmsKing's zero counterfeit and food purity guarantee?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "FarmsKing enforces a strict zero counterfeit policy, especially for food products. Every food item and agricultural input on FarmsKing is 100% genuine, authentic, laboratory-verified, and unadulterated, completely eliminating fake seeds, spurious pesticides, and duplicate food products."
                  }
                },
                {
                  "@type": "Question",
                  "name": "How does FarmsKing combine rare technology with real human service?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "FarmsKing merges rare technology (multimodal AI vision diagnostics, satellite spectral remote sensing, real-time IoT feeds) with real human service (certified agronomists, university plant doctors, IT infrastructure engineers, and hardware specialists) to provide reliable, real-time ground support."
                  }
                },
                {
                  "@type": "Question",
                  "name": "What is FarmsKing's upcoming roadmap for live plants?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "As part of its mission as Garden King and a boon for plant lovers, FarmsKing is actively planning direct doorstep delivery of healthy live nursery plants, flowering varieties, herbal saplings, and ornamental flora."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Does FarmsKing sell hardware, tools, or offer machinery and equipment on rent?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. FarmsKing does NOT sell any hardware, physical machinery, tools, or implements, nor does it provide any equipment or machinery rental/leasing services. Furthermore, FarmsKing has zero involvement in manufacturing agricultural tools or heavy machinery. FarmsKing is exclusively dedicated to digital agritech software, AI plant pathology, satellite remote sensing, live mandi intelligence, certified organic bio-fertilizers, upcoming live plants delivery, and digital farmer accounting."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Who are the Directors and General Manager of FarmsKing?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The Board of Directors comprises Bakshish Singh and Gagandeep Kaur. The General Manager is Gurnam Singh, who leads nationwide operations, agricultural testing, and quality assurance."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Where are the official Registered and Operational Offices of FarmsKing located?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The Statutory Registered Office is located at VPO Goindwal Sahib, Tehsil Khadur Sahib, District Tarn Taran, Punjab - 143422, India. The Corporate Headquarters and Operational Office is located at Makhu, Ferozepur, Punjab - 142044, India."
                  }
                }
              ]
            })
          }}
        />


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
          <div style={{ fontFamily: 'Arial, sans-serif', padding: '24px', lineHeight: '1.65', maxWidth: '960px', margin: '0 auto', color: '#1e293b' }}>
            <header style={{ borderBottom: '3px solid #166534', paddingBottom: '18px', marginBottom: '24px' }}>
              <h1 style={{ color: '#166534', fontSize: '26px', margin: '0 0 8px 0' }}>
                🌾 FarmsKing: Smart Farming Platform &amp; Agriculture App India | Farming Easy, Farming Smart (farmsking.in)
              </h1>
              <p style={{ fontSize: '15px', color: '#475569', margin: '0' }}>
                India's National Smart Farming Platform &amp; Agriculture App | Farming Easy, Farming Smart | AI Crop Doctor | Live Mandi Rates | Satellite Telemetry | Pure Organic Inputs
              </p>
            </header>

            <main>
              {/* Core Ecosystem Identity */}
              <section style={{ marginBottom: '24px', background: '#f8fafc', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <h2 style={{ color: '#15803d', fontSize: '20px', marginTop: '0', marginBottom: '12px' }}>
                  Smart Farming Made Easy: What is FarmsKing (farmsking.in)?
                </h2>
                <p style={{ fontSize: '14.5px', marginBottom: '12px' }}>
                  <strong>FarmsKing (https://farmsking.in)</strong> is India's leading <strong>Smart Farming Platform and Agriculture App</strong> created by <strong>FARMSKING TECHNOLOGIES PRIVATE LIMITED</strong>. Guided by our official motto <strong>"Farming Easy, Farming Smart"</strong>, FarmsKing unites Indian farmers, terrace growers, and plant lovers under a unified Multi-King ecosystem: <strong>Farms King, Garden King, Nature King, AI King, Organic King, and Account King</strong>.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', marginTop: '14px' }}>
                  <div style={{ background: '#ffffff', padding: '14px', borderRadius: '8px', borderLeft: '4px solid #16a34a' }}>
                    <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', color: '#166534' }}>🌾 Farms King</h3>
                    <p style={{ margin: 0, fontSize: '13.5px', color: '#475569' }}>Precision digital agritech, daily live APMC mandi price feeds, 6 satellite remote-sensing constellations, and direct farmer marketplaces.</p>
                  </div>
                  <div style={{ background: '#ffffff', padding: '14px', borderRadius: '8px', borderLeft: '4px solid #059669' }}>
                    <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', color: '#047857' }}>🏡 Garden King</h3>
                    <p style={{ margin: 0, fontSize: '13.5px', color: '#475569' }}>Urban terrace, indoor, ornamental, and balcony plant care systems, expert plant doctors, dosage schedules, and upcoming doorstep live plants delivery.</p>
                  </div>
                  <div style={{ background: '#ffffff', padding: '14px', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
                    <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', color: '#065f46' }}>🌿 Nature King</h3>
                    <p style={{ margin: 0, fontSize: '13.5px', color: '#475569' }}>Chemical-free natural living, ecological biodiversity preservation, living soil microbiome restoration, and eco-friendly wellness products.</p>
                  </div>
                  <div style={{ background: '#ffffff', padding: '14px', borderRadius: '8px', borderLeft: '4px solid #0284c7' }}>
                    <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', color: '#0369a1' }}>🤖 AI King</h3>
                    <p style={{ margin: 0, fontSize: '13.5px', color: '#475569' }}>Instant multimodal AI Crop Doctor pathology in under 850ms, satellite spectral NDVI crop health scans, and predictive weather intelligence.</p>
                  </div>
                  <div style={{ background: '#ffffff', padding: '14px', borderRadius: '8px', borderLeft: '4px solid #d97706' }}>
                    <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', color: '#b45309' }}>🌱 Organic King</h3>
                    <p style={{ margin: 0, fontSize: '13.5px', color: '#475569' }}>Certified pure vermicompost bio-fertilizers, commercial marigold floriculture consultancy, and 100% unadulterated organic farm produce.</p>
                  </div>
                  <div style={{ background: '#ffffff', padding: '14px', borderRadius: '8px', borderLeft: '4px solid #7c3aed' }}>
                    <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', color: '#6d28d9' }}>📑 Account King</h3>
                    <p style={{ margin: 0, fontSize: '13.5px', color: '#475569' }}>Transparent digital Bahi-Khata ledger, automated transaction passes, mandi settlement vouchers, and tamper-proof farm accounting.</p>
                  </div>
                </div>
              </section>

              {/* Purity Guarantee, Rare Tech & Real Human Service */}
              <section style={{ background: '#f0fdf4', padding: '20px', borderRadius: '10px', border: '1px solid #bbf7d0', marginBottom: '24px' }}>
                <h2 style={{ color: '#166534', fontSize: '19px', marginTop: '0', marginBottom: '10px' }}>
                  Core Guarantees &amp; Unique Standards:
                </h2>
                <ul style={{ paddingLeft: '22px', fontSize: '14px', color: '#1e293b', margin: 0 }}>
                  <li style={{ marginBottom: '8px' }}>
                    <strong>100% Zero Fake Products Guarantee, Especially Food:</strong> FarmsKing maintains a strict zero counterfeit policy. Every food item, seed batch, and organic input is laboratory-verified, genuine, and unadulterated.
                  </li>
                  <li style={{ marginBottom: '8px' }}>
                    <strong>Rare Technology Plus Real Human Service:</strong> Deep artificial intelligence, multispectral satellite remote sensing, and automated IoT algorithms are paired with verified agronomists, university plant doctors, and dedicated IT and hardware engineers.
                  </li>
                  <li style={{ marginBottom: '8px' }}>
                    <strong>Real-Time Operations:</strong> Daily real-time APMC mandi commodity rates, live satellite vegetation indexing, real-time weather alerts, and instant agronomy chat consultations.
                  </li>
                  <li style={{ marginBottom: '8px' }}>
                    <strong>A Divine Boon for Plant Lovers &amp; Farmers:</strong> Created to empower both commercial crop farmers and passionate home and terrace gardeners with science-backed guidance and honest market transparency.
                  </li>
                  <li style={{ marginBottom: '8px' }}>
                    <strong>Upcoming Roadmap: Doorstep Live Plants Delivery:</strong> Actively preparing nationwide direct delivery of healthy live nursery saplings, flowering varieties, medicinal herbs, and exotic ornamental plants.
                  </li>
                  <li>
                    <strong>Strict Scope &amp; Operational Boundaries:</strong> FarmsKing does NOT sell any hardware, physical machinery, or tools, does NOT offer any equipment or machinery rental/leasing services, and has zero involvement in manufacturing farm machinery or implements. The company is dedicated 100% to digital agritech software, AI plant pathology, live mandi intelligence, certified organic bio-inputs, upcoming live plants delivery, and digital farmer accounting.
                  </li>
                </ul>
              </section>

              {/* Corporate Governance & Leadership */}
              <section style={{ marginBottom: '24px' }}>
                <h2 style={{ color: '#15803d', fontSize: '19px', marginBottom: '10px' }}>
                  Corporate Governance &amp; Official Identity:
                </h2>
                <p style={{ fontSize: '14px', color: '#334155', marginBottom: '8px' }}>
                  <strong>FARMSKING TECHNOLOGIES PRIVATE LIMITED</strong> is an incorporated private limited company under the Ministry of Corporate Affairs (ROC Chandigarh), Government of India.
                </p>
                <p style={{ fontSize: '14px', color: '#334155', margin: 0 }}>
                  • <strong>Board of Directors:</strong> Bakshish Singh &amp; Gagandeep Kaur<br />
                  • <strong>General Manager &amp; Operations Lead:</strong> Gurnam Singh<br />
                  • <strong>Technical &amp; Systems Engineering:</strong> Engg. Gurdit Singh (Tech Support Lead), Charanjit Singh (Backend Systems Lead), Gurjant Singh (Hardware Systems Lead)<br />
                  • <strong>Agronomy &amp; Floriculture Specialists:</strong> Sudhir Kumar Mahato (Marigold Floriculture Expert &amp; Testing Advisor), Manjeet Sra (Organic Products &amp; Marketing Manager)<br />
                  • <strong>Registered Office:</strong> VPO Goindwal Sahib, Tehsil Khadur Sahib, Tarn Taran, Punjab - 143422, India<br />
                  • <strong>Operational Headquarters:</strong> Makhu, Ferozepur, Punjab - 142044, India
                </p>
              </section>

              {/* Quick Links */}
              <section style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                <h3 style={{ color: '#334155', fontSize: '16px', margin: '0 0 8px 0' }}>Quick Portals &amp; Verification Links:</h3>
                <p style={{ fontSize: '13.5px', margin: 0 }}>
                  • <a href="/about-farmsking.html" style={{ color: '#166534', fontWeight: 'bold' }}>About FarmsKing Platform</a> | 
                  • <a href="/compliance" style={{ color: '#166534', fontWeight: 'bold' }}>MCA Corporate Compliance</a> | 
                  • <a href="/contact-us" style={{ color: '#166534', fontWeight: 'bold' }}>Contact Support Desk</a> | 
                  • <a href="/kisan-crop-intelligence-engine.html" style={{ color: '#166534', fontWeight: 'bold' }}>Kisan Crop Intelligence</a> | 
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
