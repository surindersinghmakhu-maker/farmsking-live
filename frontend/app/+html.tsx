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

        {/* Google Search Console Verification & Regional Search Meta Tags */}
        <meta name="google-site-verification" content="cLbkUgC7i1XUv8vvpPcjQP-UuD3FKtdXKH2o9DZik2o" />
        <meta name="description" content="FarmsKing (farmsking.in / www.farmsking.in) is India's leading Smart Farming & Crop Advisory Platform founded by Surinder Singh (Surinder Academy / Surinder Agro Farm). AI crop intelligence, disease diagnosis, PAU advisory & farmer rewards." />
        <meta name="keywords" content="FarmsKing, www.farmsking.in, farmsking.in, Surinder Singh, Surinder Agro Farm, Surinder Academy, Surinder Computers, Exilent Web Solutions, Gurnam Singh FarmsKing, PAU Punjab Agricultural University FarmsKing, Smart Farming, Crop Advisory, Agriculture Doctor, Kisan App, ਝੋਨੇ ਦੀ ਸਪਰੇਅ, ਕਣਕ ਦੀ ਬੀਜਾਈ, ਫਸਲ ਇਲਾਜ, ਗੋਭੀ ਸਪਰੇਅ, ਖੇਤੀਬਾੜੀ ਸਲਾਹ, ਕਿਸਾਨ ਮਦਦ, Crop Disease Scan, Reverse Sowing Engine" />
        <meta property="og:title" content="FarmsKing - Smart Farming & Crop Intelligence Platform" />
        <meta property="og:description" content="India's leading Smart Farming & Crop Advisory Platform created by Surinder Singh with practical R&D at Surinder Agro Farm." />
        <meta property="og:image" content="https://farmsking.in/farmsking_logo.png" />
        <meta property="og:url" content="https://farmsking.in" />

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
      <body>{children}</body>
    </html>
  );
}
