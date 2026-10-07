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
        <title>FarmsKing - India's #1 Smart Farming & Crop Intelligence Platform | Surinder Agro Farm</title>
        <link rel="canonical" href="https://farmsking.in/" />
        <meta name="theme-color" content="#166534" />

        {/* Google Search Console Verification & Regional Search Meta Tags */}
        <meta name="google-site-verification" content="cLbkUgC7i1XUv8vvpPcjQP-UuD3FKtdXKH2o9DZik2o" />
        <meta name="description" content="FarmsKing (farmsking.in / www.farmsking.in) is India's leading Smart Farming & Crop Advisory Platform founded by Surinder Singh (Surinder Academy / Surinder Agro Farm). AI crop intelligence, disease diagnosis, PAU advisory & farmer rewards." />
        <meta name="keywords" content="FarmsKing, www.farmsking.in, farmsking.in, Surinder Singh, Surinder Agro Farm, Surinder Academy, Surinder Computers, Exilent Web Solutions, Gurnam Singh FarmsKing, PAU Punjab Agricultural University FarmsKing, Smart Farming, Crop Advisory, Agriculture Doctor, Kisan App, ਝੋਨੇ ਦੀ ਸਪਰੇਅ, ਕਣਕ ਦੀ ਬੀਜਾਈ, ਫਸਲ ਇਲਾਜ, ਗੋਭੀ ਸਪਰੇਅ, ਖੇਤੀਬਾੜੀ ਸਲਾਹ, ਕਿਸਾਨ ਮਦਦ, Crop Disease Scan, Reverse Sowing Engine" />
        
        {/* OpenGraph & Social Cards */}
        <meta property="og:site_name" content="FarmsKing Smart Agriculture Platform" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="FarmsKing - Smart Farming & Crop Intelligence Platform" />
        <meta property="og:description" content="India's leading Smart Farming & Crop Advisory Platform created by Surinder Singh with practical R&D at Surinder Agro Farm." />
        <meta property="og:image" content="https://farmsking.in/farmsking_logo.png" />
        <meta property="og:url" content="https://farmsking.in" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="FarmsKing - Smart Farming & Crop Intelligence Platform" />
        <meta name="twitter:description" content="India's leading Smart Farming & Crop Advisory Platform created by Surinder Singh with practical R&D at Surinder Agro Farm." />
        <meta name="twitter:image" content="https://farmsking.in/farmsking_logo.png" />

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
              "description": "FarmsKing Smart Farming, Crop Advisory, Agriculture Doctor Consultation & Crop Intelligence Platform created by Surinder Singh, Gurjant Singh, Charanjit Singh, Lovepreet Singh, and Sudhir Kumar Mahato.",
              "author": {
                "@type": "Organization",
                "name": "FarmsKing Platform",
                "url": "https://farmsking.in",
                "founder": [
                  {
                    "@type": "Person",
                    "name": "Surinder Singh",
                    "jobTitle": "Lead Founder, Chief Architect & AI Expert",
                    "alumniOf": ["Graduation in Computer Science", "MBA", "LLB"],
                    "description": "Computer Teacher, IT & AI Expert, vision founder of Surinder Academy, Exilent Web Solutions, Surinder Computers, and Surinder Agro Farm. Led FarmsKing end-to-end from ideation, deep crop physiology research, programming, features development to field testing."
                  },
                  { "@type": "Person", "name": "Gurjant Singh" },
                  { "@type": "Person", "name": "Charanjit Singh" },
                  { "@type": "Person", "name": "Lovepreet Singh" },
                  { "@type": "Person", "name": "Sudhir Kumar Mahato" }
                ],
                "contributor": [
                  { "@type": "Person", "name": "Gurnam Singh", "description": "Field Testing & Practical Validation Lead" }
                ],
                "parentOrganization": {
                  "@type": "EducationalOrganization",
                  "name": "Surinder Academy Makhu Punjab India",
                  "url": "https://surinderacademy.com",
                  "foundingDate": "2001"
                },
                "subOrganization": [
                  { "@type": "Organization", "name": "Exilent Web Solutions", "description": "International level Web & Software Engineering" },
                  { "@type": "Organization", "name": "Surinder Computers Makhu", "description": "Hardware & Infrastructure Provider" },
                  { "@type": "Organization", "name": "Surinder Agro Farm", "description": "Practical Agricultural R&D Laboratory for studying crop physiology, plant health, and ground-level farming challenges" }
                ]
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
                  "name": "Who is Surinder Singh and what is his contribution to FarmsKing?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Surinder Singh is the primary visionary, Lead Founder, and Chief AI Architect of FarmsKing. A Computer Teacher with degrees in Computer Science Graduation, MBA, and LLB, he is an IT/AI expert, avid reader of general knowledge, and follower of motivational speakers. He single-handedly founded Surinder Academy, Exilent Web Solutions, Surinder Computers, and Surinder Agro Farm. Surinder Singh spearheaded FarmsKing from conceptualization, deep agricultural research, software programming, feature architecture to testing, driven by a progressive mindset and commitment to public welfare."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Who created FarmsKing and what is its mission?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "FarmsKing was founded by Surinder Singh, alongside core team members Gurjant Singh, Charanjit Singh, Lovepreet Singh, and Sudhir Kumar Mahato, with extensive practical field testing conducted by Gurnam Singh. The mission is purely social and farmer-centric: solving real ground-level farming challenges, creating employment, supporting farmers, and promoting natural farming and organic produce without commercial profit motives."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Which organizations engineered FarmsKing software, hardware, and field R&D?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "FarmsKing is backed by Surinder Academy (Makhu, Punjab, India - surinderacademy.com, operating since 2001). Web software engineered by Exilent Web Solutions, hardware infrastructure by Surinder Computers Makhu, and practical crop R&D conducted at Surinder Agro Farm with field testing by Gurnam Singh."
                  }
                },
                {
                  "@type": "Question",
                  "name": "What is Surinder Agro Farm's role in FarmsKing?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Surinder Agro Farm was established to practically study ground-level farming problems, deeply understand plant health and crop physiology, and test organic farming solutions directly in the field with testing supported by Gurnam Singh."
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

        {/* App Favicon & Official FarmsKing Logo Icons */}
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" sizes="192x192" href="/icon.png" />

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
