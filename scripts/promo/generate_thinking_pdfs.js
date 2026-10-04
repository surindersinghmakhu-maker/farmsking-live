const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const docsDir = 'd:\\FarmsKing\\docs\\thinking';
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

const commonStyle = `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Noto+Sans+Gurmukhi:wght@400;600;700&family=Noto+Sans+Devanagari:wght@400;600;700&display=swap');
    body {
      font-family: 'Inter', 'Noto Sans Gurmukhi', 'Noto Sans Devanagari', sans-serif;
      margin: 40px;
      color: #1e293b;
      line-height: 1.6;
      background-color: #ffffff;
    }
    h1 {
      color: #15803d;
      border-bottom: 3px solid #22c55e;
      padding-bottom: 10px;
      font-size: 24px;
    }
    h2 {
      color: #0f766e;
      margin-top: 22px;
      font-size: 18px;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 4px;
    }
    .card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px 18px;
      margin-bottom: 14px;
      background: #fafafa;
    }
    .card-title {
      font-weight: bold;
      color: #166534;
      font-size: 15px;
      margin-bottom: 6px;
    }
    .quote {
      font-style: italic;
      color: #0369a1;
      background-color: #f0f9ff;
      border-left: 3px solid #0284c7;
      padding: 6px 12px;
      margin: 6px 0;
      font-size: 13.5px;
    }
    .impact {
      font-size: 13.5px;
      color: #334155;
    }
    .footer {
      margin-top: 40px;
      font-size: 11px;
      text-align: center;
      color: #64748b;
      border-top: 1px solid #e2e8f0;
      padding-top: 10px;
    }
  </style>
`;

// 1. PUNJABI HTML
const htmlPB = `
<!DOCTYPE html>
<html lang="pa">
<head>
  <meta charset="UTF-8">
  <title>FarmsKing — 360-ਡਿਗਰੀ ਸਟੇਕਹੋਲਡਰ ਦ੍ਰਿਸ਼ਟੀਕੋਣ ਅਤੇ ਪ੍ਰਭਾਵ ਦਸਤਾਵੇਜ਼</title>
  ${commonStyle}
</head>
<body>
  <h1>FarmsKing — 360-ਡਿਗਰੀ ਸਟੇਕਹੋਲਡਰ ਦ੍ਰਿਸ਼ਟੀਕੋਣ ਅਤੇ ਈਕੋਸਿਸਟਮ ਪ੍ਰਭਾਵ (Master Document)</h1>
  <p><strong>ਮਿਤੀ:</strong> 30 ਸਤੰਬਰ 2026 | <strong>ਪਲੇਟਫਾਰਮ:</strong> FarmsKing Agriculture & Gardening Ecosystem</p>

  <h2>1. ਕਿਸਾਨ (Farmers)</h2>
  <div class="card">
    <div class="card-title">🌾 ਕਿਸਾਨਾਂ ਦਾ ਦ੍ਰਿਸ਼ਟੀਕੋਣ (Farmer Perspective)</div>
    <div class="quote">"FarmsKing ਸਿਰਫ਼ ਇੱਕ ਐਪ ਨਹੀਂ, ਮੇਰੇ ਖੇਤ ਦਾ ਨਿੱਜੀ ਡਿਜੀਟਲ ਮੈਨੇਜਰ ਅਤੇ ਫ਼ਸਲ ਡਾਕਟਰ ਹੈ।"</div>
    <div class="impact"><strong>ਪ੍ਰਭਾਵ:</strong> ਲਾਈਵ ਮੰਡੀ ਭਾਅ, ਖੇਤੀ ਲੇਖਾ (J-Form), ਡਾਕਟਰ ਦੀ ਸਲਾਹ, 0% GST ਕੱਚੀ ਫ਼ਸਲ ਬਿਲਿੰਗ, ਅਤੇ ਘਰ ਬੈਠੇ 100% ਅਸਲੀ ਖਾਦ/ਦਵਾਈਆਂ। ਫ਼ਸਲ ਖਰਾਬੀ 'ਚ 80% ਕਮੀ।</div>
  </div>

  <h2>2. FarmsKing ਫਾਊਂਡਰਜ਼ ਅਤੇ ਮੈਨੇਜਮੈਂਟ (Founders & Executive Management)</h2>
  <div class="card">
    <div class="card-title">👑 ਫਾਊਂਡਰਜ਼ ਦਾ ਦ੍ਰਿਸ਼ਟੀਕੋਣ (Platform Vision)</div>
    <div class="quote">"ਭਾਰਤ ਦਾ ਸਭ ਤੋਂ ਵੱਡਾ, 100% ਕਾਨੂੰਨੀ ਅਤੇ 5 ਸਰੋਤਾਂ ਤੋਂ ਆਮਦਨ ਦੇਣ ਵਾਲਾ ਐਗਰੀ-ਟੈਕ ਈਕੋਸਿਸਟਮ।"</div>
    <div class="impact"><strong>ਪ੍ਰਭਾਵ:</strong> ਮੈਂਬਰਸ਼ਿਪ ਪਲਾਨ, ਈ-ਕੋਮਰਸ ਕਮੀਸ਼ਨ, ਡਾਕਟਰ ਕੰਸਲਟੇਸ਼ਨ, ਬ੍ਰਾਂਡ ਐਡਵਰਟਾਈਜ਼ਿੰਗ, ਅਤੇ ਫਿਨਟੈਕ ਟ੍ਰਾਂਸਫਰ। 100% FDI & GST Section 52 Compliant.</div>
  </div>

  <h2>3. ਸੇਲਰ ਅਤੇ ਦੁਕਾਨਦਾਰ (Sellers & Store Owners - Surinder Agro & 3P Stores)</h2>
  <div class="card">
    <div class="card-title">🏪 ਸੇਲਰਾਂ ਦਾ ਦ੍ਰਿਸ਼ਟੀਕੋਣ (Seller Perspective)</div>
    <div class="quote">"ਮੇਰੀ ਦੁਕਾਨ ਹੁਣ ਸਿਰਫ਼ ਪਿੰਡ ਤੱਕ ਸੀਮਤ ਨਹੀਂ, ਮੈਂ ਪੂਰੇ ਭਾਰਤ ਵਿੱਚ ਸਮਾਨ ਵੇਚ ਸਕਦਾ ਹਾਂ।"</div>
    <div class="impact"><strong>ਪ੍ਰਭਾਵ:</strong> 1% TCS ਆਪਣੇ ਆਪ ਸਰਕਾਰ ਕੋਲ ਜਮ੍ਹਾਂ ਹੋ ਕੇ GST ਖਾਤੇ 'ਚ ਵਾਪਸ ਮਿਲੇਗਾ। ਆਟੋਮੈਟਿਕ ਬਿਲਿੰਗ (FK-INV-...) ਨਾਲ ਹਿਸਾਬ-ਕਿਤਾਬ 100% ਸਾਫ਼। Official Store Tag ਨਾਲ ਗਾਹਕਾਂ ਦਾ ਭਰੋਸਾ।</div>
  </div>

  <h2>4. ਆਮ ਪਬਲਿਕ ਅਤੇ ਗਾਹਕ (General Public & Consumers)</h2>
  <div class="card">
    <div class="card-title">👥 ਗਾਹਕਾਂ ਦਾ ਦ੍ਰਿਸ਼ਟੀਕੋਣ (Public Perspective)</div>
    <div class="quote">"ਸਾਨੂੰ ਸਿੱਧਾ ਕਿਸਾਨਾਂ ਤੋਂ ਜ਼ਹਿਰ-ਮੁਕਤ, ਤਾਜ਼ੀ ਅਤੇ FSSAI ਮਾਨਤਾ ਪ੍ਰਾਪਤ ਫ਼ਸਲ ਮਿਲੇਗੀ।"</div>
    <div class="impact"><strong>ਪ੍ਰਭਾਵ:</strong> Farm-to-Table ਟ੍ਰੇਸੇਬਿਲਟੀ, ਬਿਨਾਂ ਵਿਚੋਲਿਆਂ ਤੋਂ ਤਾਜ਼ਾ ਸਮਾਨ ਅਤੇ ਸਹੀ ਕੀਮਤ।</div>
  </div>

  <h2>5. ਸਰਕਾਰ ਅਤੇ GST ਟੈਕਸ ਮਹਿਕਮਾ (Government & Tax Authorities)</h2>
  <div class="card">
    <div class="card-title">🏛️ ਸਰਕਾਰ ਦਾ ਦ੍ਰਿਸ਼ਟੀਕੋਣ (Government & GST View)</div>
    <div class="quote">"Digital India ਅਤੇ ਖੇਤੀਬਾੜੀ ਵਿੱਚ ਪਾਰਦਰਸ਼ੀ ਟੈਕਸ ਪ੍ਰਣਾਲੀ ਦਾ ਸਭ ਤੋਂ ਵਧੀਆ ਮੋਡਲ।"</div>
    <div class="impact"><strong>ਪ੍ਰਭਾਵ:</strong> Section 52 ECO ਨਿਯਮਾਂ ਦੀ ਪਾਲਣਾ, ਮਾਸਿਕ GSTR-8 ਰਿਟਰਨ, FSSAI ਅਤੇ CIBRC ਲਾਇਸੈਂਸ ਵੈਰੀਫਿਕੇਸ਼ਨ। ਨਕਲੀ ਦਵਾਈਆਂ ਦੀ ਵਿਕਰੀ ਬੰਦ।</div>
  </div>

  <h2>6. ਐਗਰੀ-ਕੈਮੀਕਲ ਅਤੇ ਬੀਜ ਕੰਪਨੀਆਂ (Syngenta, Bayer, IFFCO, UPL)</h2>
  <div class="card">
    <div class="card-title">🏭 ਕੰਪਨੀਆਂ ਦਾ ਦ੍ਰਿਸ਼ਟੀਕੋਣ (Agri Manufacturer View)</div>
    <div class="quote">"FarmsKing ਸਾਡੇ ਅਸਲੀ ਪ੍ਰੋਡਕਟ ਕਿਸਾਨਾਂ ਤੱਕ ਪਹੁੰਚਾਉਣ ਦਾ ਸਭ ਤੋਂ ਭਰੋਸੇਯੋਗ D2F ਚੈਨਲ ਹੈ।"</div>
    <div class="impact"><strong>ਪ੍ਰਭਾਵ:</strong> ਡਾਕਟਰਾਂ ਵੱਲੋਂ ਸਹੀ ਦਵਾਈਆਂ ਦਾ ਈ-ਪਰਚਾ, ਨਕਲੀ ਬ੍ਰਾਂਡਾਂ ਦਾ ਖਾਤਮਾ, ਅਤੇ ਰੀਅਲ-ਟਾਈਮ ਮੰਗ ਦਾ ਡਾਟਾ।</div>
  </div>

  <h2>7. ਵਿਰੋਧੀ ਲੋਕ ਅਤੇ ਰਵਾਇਤੀ ਵਿਚੋਲੇ (Opponents & Middlemen)</h2>
  <div class="card">
    <div class="card-title">⚔️ ਵਿਰੋਧੀਆਂ ਦਾ ਦ੍ਰਿਸ਼ਟੀਕੋਣ (Competitors & Traditional Arhtiyas)</div>
    <div class="quote">"ਇਹ ਸਾਡੇ 24-36% ਵਿਆਜ ਵਾਲੇ ਸਿਸਟਮ ਲਈ ਇੱਕ ਵੱਡੀ ਚੁਣੌਤੀ ਹੈ।"</div>
    <div class="impact"><strong>ਪ੍ਰਭਾਵ:</strong> ਸ਼ੋਸ਼ਣ ਕਰਨ ਵਾਲੇ ਵਿਚੋਲਿਆਂ ਨੂੰ ਝਟਕਾ। ਸਮਾਰਟ ਆੜ੍ਹਤੀਏ KingConnect ਨਾਲ ਜੁੜ ਕੇ ਡਿਜੀਟਲ ਹੋ ਜਾਣਗੇ।</div>
  </div>

  <h2>8. ਐਡਵਰਟਾਈਜ਼ਰ ਅਤੇ ਬ੍ਰਾਂਡ (Advertisers & Brands)</h2>
  <div class="card">
    <div class="card-title">🎯 ਐਡਵਰਟਾਈਜ਼ਰਾਂ ਦਾ ਦ੍ਰਿਸ਼ਟੀਕੋਣ (Advertiser View)</div>
    <div class="quote">"ਟਰੈਕਟਰ, ਸੋਲਰ ਪੰਪ ਅਤੇ ਇੰਸ਼ੋਰੈਂਸ ਕੰਪਨੀਆਂ ਲਈ ਟਾਰਗੇਟਡ ਕਿਸਾਨਾਂ ਤੱਕ ਪਹੁੰਚਣ ਦਾ ਸਭ ਤੋਂ ਵਧੀਆ ਮੰਚ।"</div>
    <div class="impact"><strong>ਪ੍ਰਭਾਵ:</strong> ਜ਼ਿਲ੍ਹੇ ਅਤੇ ਫ਼ਸਲ ਅਨੁਸਾਰ ਟਾਰਗੇਟਡ ਐਡਵਰਟਾਈਜ਼ਿੰਗ ਰਾਹੀਂ FarmsKing ਲਈ ਵਾਧੂ ਆਮਦਨ।</div>
  </div>

  <h2>9. CA, ਵਕੀਲ ਅਤੇ ਆਡਿਟਰ (Chartered Accountants & Legal Auditors)</h2>
  <div class="card">
    <div class="card-title">⚖️ CAs ਦਾ ਦ੍ਰਿਸ਼ਟੀਕੋਣ (Audit & Compliance View)</div>
    <div class="quote">"ਇਹ ਸਭ ਤੋਂ ਸਾਫ਼ ਅਤੇ Audit-Proof E-Commerce ਢਾਂਚਾ ਹੈ।"</div>
    <div class="impact"><strong>ਪ੍ਰਭਾਵ:</strong> ਕਮੀਸ਼ਨ ਆਮਦਨ, 3P ਸੇਲਰ ਟਰਨਓਵਰ, ਅਤੇ 1P Surinder Agro ਦੀ ਖਰੀਦ-ਵੇਚ ਤਿੰਨੋਂ ਅਲੱਗ। 0% ਟੈਕਸ ਆਡਿਟ ਐਰਰ।</div>
  </div>

  <h2>10. ਹੋਰ ਆਨਲਾਈਨ ਪਲੇਟਫਾਰਮ (Flipkart, Amazon, DeHaat, AgroStar)</h2>
  <div class="card">
    <div class="card-title">🌐 ਹੋਰ ਪਲੇਟਫਾਰਮਾਂ ਦਾ ਦ੍ਰਿਸ਼ਟੀਕੋਣ (Industry Competitor View)</div>
    <div class="quote">"FarmsKing ਨੇ P2P KingConnect, ਡਾਕਟਰ ਸਲਾਹ, ਮੰਡੀ ਭਾਅ ਅਤੇ ਈ-ਕੋਮਰਸ ਦਾ ਸੁਪਰ-ਐਪ ਬਣਾ ਲਿਆ ਹੈ।"</div>
    <div class="impact"><strong>ਪ੍ਰਭਾਵ:</strong> ਉੱਤਰ ਭਾਰਤ ਦੇ ਖੇਤੀਬਾੜੀ ਖੇਤਰ ਵਿੱਚ FarmsKing ਦੀ ਏਕਾਧਿਕਾਰ ਮਾਰਕੀਟ ਲੀਡਰਸ਼ਿਪ।</div>
  </div>

  <h2>11. ਟੈਕਨੀਕਲ ਟ੍ਰੇਨਰ (Technical Trainers - Verification Field Agents)</h2>
  <div class="card">
    <div class="card-title">🎓 ਟ੍ਰੇਨਰਾਂ ਦਾ ਦ੍ਰਿਸ਼ਟੀਕੋਣ (Field Trainer View)</div>
    <div class="quote">"ਕਿਸਾਨਾਂ ਨੂੰ ਐਪ ਸਿਖਾ ਕੇ ਰੋਜ਼ਾਨਾ ਪੱਕੀ ਆਮਦਨ ਅਤੇ ਪੈਸਿਵ ਕਮੀਸ਼ਨ ਕਮਾਉਣ ਦਾ ਸੁਨਹਿਰੀ ਮੌਕਾ।"</div>
    <div class="impact"><strong>ਪ੍ਰਭਾਵ:</strong> Baseline ਅਤੇ Upline ਟਰੇਨਰ ਲੈਵਲ ਨਾਲ ਆਟੋਮੈਟਿਕ ਵਾਲਿਟ ਪੇਆਉਟ।</div>
  </div>

  <h2>12. ਪ੍ਰੋਗਰਾਮਰ ਅਤੇ ਡਿਵੈਲਪਰ (Programmers & Software Developers)</h2>
  <div class="card">
    <div class="card-title">💻 ਡਿਵੈਲਪਰਾਂ ਦਾ ਦ੍ਰਿਸ਼ਟੀਕੋਣ (Engineering & Dev View)</div>
    <div class="quote">"ਇੱਕ ਮਜ਼ਬੂਤ NestJS + Expo + PostgreSQL ਆਰਕੀਟੈਕਚਰ ਜੋ ਲੱਖਾਂ ਯੂਜ਼ਰਾਂ ਦਾ ਲੋਡ ਚੁੱਕ ਸਕਦਾ ਹੈ।"</div>
    <div class="impact"><strong>ਪ੍ਰਭਾਵ:</strong> Clean DB schema, strict TypeScript types, 0 technical debt.</div>
  </div>

  <h2>13. ਇਨਵੈਸਟਰ ਅਤੇ ਡਾਇਰੈਕਟਰ (Investors & Board Directors)</h2>
  <div class="card">
    <div class="card-title">💼 ਇਨਵੈਸਟਰਾਂ ਦਾ ਦ੍ਰਿਸ਼ਟੀਕੋਣ (Investor & Equity View)</div>
    <div class="quote">"100% ਕਾਨੂੰਨੀ, ਉੱਚ-ਮਾਰਜਿਨ ਅਤੇ 5 ਆਮਦਨ ਸਰੋਤਾਂ ਵਾਲਾ ਸਕੇਲੇਬਲ ਬਿਜ਼ਨਸ।"</div>
    <div class="impact"><strong>ਪ੍ਰਭਾਵ:</strong> High LTV, low CAC, 100% FDI Compliant marketplace.</div>
  </div>

  <h2>14. ਸਰਵਿਸ ਪ੍ਰੋਵਾਈਡਰ (Cashfree, Shiprocket, PhonePe, WhatsApp API)</h2>
  <div class="card">
    <div class="card-title">🚚 ਸਰਵਿਸ ਪ੍ਰੋਵਾਈਡਰਾਂ ਦਾ ਦ੍ਰਿਸ਼ਟੀਕੋਣ (Service Integration View)</div>
    <div class="quote">"FarmsKing ਸਾਡਾ ਹਾਈ-ਵੋਲਿਊਮ ਐਂਟਰਪ੍ਰਾਈਜ਼ ਪਾਰਟਨਰ ਹੈ।"</div>
    <div class="impact"><strong>ਪ੍ਰਭਾਵ:</strong> Cashfree Auto-Split Payouts, Shiprocket Vendor Pickups, PhonePe PG, WhatsApp OTPs.</div>
  </div>

  <h2>15. ਗਾਰਡਨਰ ਅਤੇ ਗਾਰਡਨ ਐਡਵਾਈਜ਼ਰ (Gardeners & Rooftop Garden Advisors)</h2>
  <div class="card">
    <div class="card-title">🏡 ਗਾਰਡਨਰਾਂ ਦਾ ਦ੍ਰਿਸ਼ਟੀਕੋਣ (Urban Gardening View)</div>
    <div class="quote">"ਸ਼ਹਿਰੀ ਘਰਾਂ ਦੀਆਂ ਛੱਤਾਂ, ਕਿਚਨ ਗਾਰਡਨ ਅਤੇ ਪੌਦਿਆਂ ਲਈ ਵਿਸ਼ੇਸ਼ ਪਲੇਟਫਾਰਮ।"</div>
    <div class="impact"><strong>ਪ੍ਰਭਾਵ:</strong> ਹੋਮ ਗਾਰਡਨ ਵਿਜ਼ਿਟ, ਔਰਗੈਨਿਕ ਮਿੱਟੀ/ਪੌਦੇ ਵੇਚ ਕੇ ਨਵੀਂ ਸ਼ਹਿਰੀ ਆਮਦਨ।</div>
  </div>

  <h2>16. ਕੰਪਨੀ ਐਮਪਲਾਇਜ਼ (Admin Staff, Operators, Supervisors)</h2>
  <div class="card">
    <div class="card-title">👔 ਕਰਮਚਾਰੀਆਂ ਦਾ ਦ੍ਰਿਸ਼ਟੀਕੋਣ (Employee & Staff View)</div>
    <div class="quote">"ਰੋਲ-ਪਰਮਿਸ਼ਨ ਵਾਲਾ ਆਸਾਨ ਡੈਸ਼ਬੋਰਡ ਜਿੱਥੇ ਕੰਮ ਕਰਨਾ ਬਹੁਤ ਸਰਲ ਹੈ।"</div>
    <div class="impact"><strong>ਪ੍ਰਭਾਵ:</strong> 1-Click Order Packing/Dispatch, Farm Spray Schedules, Clean Audit Logs.</div>
  </div>

  <h2>17. ਫ਼ਸਲ ਡਾਕਟਰ (Crop Doctors - Senior & Junior Doctors)</h2>
  <div class="card">
    <div class="card-title">👨‍⚕️ ਡਾਕਟਰਾਂ ਦਾ ਦ੍ਰਿਸ਼ਟੀਕੋਣ (Crop Doctor View)</div>
    <div class="quote">"ਦੇਸ਼-ਵਿਆਪੀ ਡਿਜੀਟਲ ਕਲੀਨਿਕ ਜਿੱਥੇ ਘਰ ਬੈਠੇ ਇਲਾਜ ਕਰਕੇ ਵਧੀਆ ਆਮਦਨ ਮਿਲਦੀ ਹੈ।"</div>
    <div class="impact"><strong>ਪ੍ਰਭਾਵ:</strong> Pay-per-Consultation, e-Prescription, Satellite Crop NDVI Scan access.</div>
  </div>

  <h2>18. ਫ਼ਸਲ ਸਲਾਹਕਾਰ (Crop Advisors - Field Agronomists)</h2>
  <div class="card">
    <div class="card-title">👨‍🌾 ਐਡਵਾਈਜ਼ਰਾਂ ਦਾ ਦ੍ਰਿਸ਼ਟੀਕੋਣ (Crop Advisor View)</div>
    <div class="quote">"ਕਾਗਜ਼ੀ ਕੰਮ ਤੋਂ ਮੁਕਤੀ, ਆਟੋਮੈਟਿਕ ਸਪਰੇਅ ਸ਼ਡਿਊਲ ਅਤੇ ਵਾਲਿਟ ਕਮੀਸ਼ਨ।"</div>
    <div class="impact"><strong>ਪ੍ਰਭਾਵ:</strong> 100 ਖੇਤਾਂ ਦੀ ਡਿਜੀਟਲ ਦੇਖਰੇਖ, ਮੌਸਮ ਚੇਤਾਵਨੀ ਅਲਰਟ, ਮਾਸਿਕ ਵਾਲਿਟ ਪੇਆਉਟ।</div>
  </div>

  <div class="footer">
    FarmsKing Agriculture & Gardening Ecosystem — Master Vision & Stakeholder Impact Document | ਗੁਪਤ
  </div>
</body>
</html>
`;

// 2. HINDI HTML
const htmlHI = `
<!DOCTYPE html>
<html lang="hi">
<head>
  <meta charset="UTF-8">
  <title>FarmsKing — 360-डिग्री हितधारक दृष्टिकोण एवं प्रभाव दस्तावेज</title>
  ${commonStyle}
</head>
<body>
  <h1>FarmsKing — 360-डिग्री हितधारक दृष्टिकोण एवं इकोसिस्टम प्रभाव (Master Document)</h1>
  <p><strong>तिथि:</strong> 30 सितंबर 2026 | <strong>प्लेटफ़ॉर्म:</strong> FarmsKing Agriculture & Gardening Ecosystem</p>

  <h2>1. किसान (Farmers)</h2>
  <div class="card">
    <div class="card-title">🌾 किसानों का दृष्टिकोण (Farmer Perspective)</div>
    <div class="quote">"FarmsKing केवल एक ऐप नहीं, मेरे खेत का व्यक्तिगत डिजिटल मैनेजर और फसल डॉक्टर है।"</div>
    <div class="impact"><strong>प्रभाव:</strong> लाइव मंडी भाव, डिजिटल जे-फॉर्म लेखा, डॉक्टर परामर्श, 0% GST कच्ची फसल बिलिंग, तथा घर बैठे 100% असली खाद/दवाइयां। फसल खराबी में 80% कमी।</div>
  </div>

  <h2>2. FarmsKing संस्थापकों और प्रबंधन (Founders & Executive Management)</h2>
  <div class="card">
    <div class="card-title">👑 संस्थापकों का दृष्टिकोण (Platform Vision)</div>
    <div class="quote">"भारत का सबसे बड़ा, 100% कानूनी और 5 स्रोतों से आय देने वाला एग्री-टेक इकोसिस्टम।"</div>
    <div class="impact"><strong>प्रभाव:</strong> सदस्यता प्लान, ई-कॉमर्स कमिशन, डॉक्टर कंसल्टेशन, ब्रांड एडवरटाइजिंग, और फिनटेक ट्रांसफर। 100% FDI & GST Section 52 अनुपालन।</div>
  </div>

  <h2>3. सेलर और दुकानदार (Sellers & Store Owners - Surinder Agro & 3P Stores)</h2>
  <div class="card">
    <div class="card-title">🏪 सेलर का दृष्टिकोण (Seller Perspective)</div>
    <div class="quote">"मेरी दुकान अब केवल गांव तक सीमित नहीं, मैं पूरे भारत में सामान बेच सकता हूं।"</div>
    <div class="impact"><strong>प्रभाव:</strong> 1% TCS स्वतः सरकार के पास जमा होकर GST खाते में वापस। ऑटोमैटिक बिलिंग (FK-INV-...) से हिसाब-किताब 100% साफ। Official Store Tag से ग्राहकों का भरोसा।</div>
  </div>

  <h2>4. आम जनता और ग्राहक (General Public & Consumers)</h2>
  <div class="card">
    <div class="card-title">👥 ग्राहकों का दृष्टिकोण (Public Perspective)</div>
    <div class="quote">"हमें सीधे किसानों से जहर-मुक्त, ताजा और FSSAI मान्यता प्राप्त फसल मिलेगी।"</div>
    <div class="impact"><strong>प्रभाव:</strong> Farm-to-Table ट्रेसेबिलिटी, बिना बिचौलियों के ताजा सामान और उचित मूल्य।</div>
  </div>

  <h2>5. सरकार और GST टैक्स विभाग (Government & Tax Authorities)</h2>
  <div class="card">
    <div class="card-title">🏛️ सरकार का दृष्टिकोण (Government & GST View)</div>
    <div class="quote">"Digital India और कृषि में पारदर्शी टैक्स प्रणाली का सबसे उत्तम मॉडल।"</div>
    <div class="impact"><strong>प्रभाव:</strong> Section 52 ECO नियमों का अनुपालन, मासिक GSTR-8 रिटर्न, FSSAI और CIBRC लाइसेंस सत्यापन। नकली दवाओं की बिक्री बंद।</div>
  </div>

  <h2>6. एग्री-केमिकल और बीज कंपनियां (Syngenta, Bayer, IFFCO, UPL)</h2>
  <div class="card">
    <div class="card-title">🏭 कंपनियों का दृष्टिकोण (Agri Manufacturer View)</div>
    <div class="quote">"FarmsKing हमारे असली उत्पाद किसानों तक पहुंचाने का सबसे विश्वसनीय D2F चैनल है।"</div>
    <div class="impact"><strong>प्रभाव:</strong> डॉक्टरों द्वारा सही दवाओं का ई-पर्चा, नकली ब्रांडों का खात्मा, और रियल-टाइम मांग का डेटा।</div>
  </div>

  <h2>7. विरोधी लोग और पारंपरिक बिचौलिए (Opponents & Middlemen)</h2>
  <div class="card">
    <div class="card-title">⚔️ विरोधियों का दृष्टिकोण (Competitors & Traditional Arhtiyas)</div>
    <div class="quote">"यह हमारे 24-36% ब्याज वाले सिस्टम के लिए एक बड़ी चुनौती है।"</div>
    <div class="impact"><strong>प्रभाव:</strong> शोषण करने वाले बिचौलियों को झटका। स्मार्ट आढ़तिये KingConnect से जुड़कर डिजिटल हो जाएंगे।</div>
  </div>

  <h2>8. एडवरटाइजर और ब्रांड (Advertisers & Brands)</h2>
  <div class="card">
    <div class="card-title">🎯 एडवरटाइजर्स का दृष्टिकोण (Advertiser View)</div>
    <div class="quote">"ट्रैक्टर, सोलर पंप और इंश्योरेंस कंपनियों के लिए लक्षित किसानों तक पहुंचने का सबसे अच्छा मंच।"</div>
    <div class="impact"><strong>प्रभाव:</strong> जिले और फसल अनुसार विज्ञापनों से FarmsKing के लिए अतिरिक्त आय।</div>
  </div>

  <h2>9. CA, वकील और ऑडिटर (Chartered Accountants & Legal Auditors)</h2>
  <div class="card">
    <div class="card-title">⚖️ CAs का दृष्टिकोण (Audit & Compliance View)</div>
    <div class="quote">"यह सबसे साफ और Audit-Proof E-Commerce ढांचा है।"</div>
    <div class="impact"><strong>प्रभाव:</strong> कमिशन आय, 3P सेलर टर्नओवर, और 1P Surinder Agro की खरीद-बिक्री तीनों अलग। 0% टैक्स ऑडिट एरर।</div>
  </div>

  <h2>10. अन्य ऑनलाइन प्लेटफॉर्म (Flipkart, Amazon, DeHaat, AgroStar)</h2>
  <div class="card">
    <div class="card-title">🌐 अन्य प्लेटफॉर्म्स का दृष्टिकोण (Industry Competitor View)</div>
    <div class="quote">"FarmsKing ने P2P KingConnect, डॉक्टर सलाह, मंडी भाव और ई-कॉमर्स का सुपर-ऐप बना लिया है।"</div>
    <div class="impact"><strong>प्रभाव:</strong> उत्तर भारत के कृषि क्षेत्र में FarmsKing की एकाधिकार मार्केट लीडरशिप।</div>
  </div>

  <h2>11. टेक्निकल ट्रेनर (Technical Trainers - Verification Field Agents)</h2>
  <div class="card">
    <div class="card-title">🎓 ट्रेनर्स का दृष्टिकोण (Field Trainer View)</div>
    <div class="quote">"किसानों को ऐप सिखाकर रोजाना पक्की आय और पैसिव कमिशन कमाने का सुनहरा मौका।"</div>
    <div class="impact"><strong>प्रभाव:</strong> Baseline और Upline ट्रेनर लेवल से ऑटोमैटिक वॉलेट पेआउट।</div>
  </div>

  <h2>12. प्रोग्रामर और डेवलपर (Programmers & Software Developers)</h2>
  <div class="card">
    <div class="card-title">💻 डेवलपर्स का दृष्टिकोण (Engineering & Dev View)</div>
    <div class="quote">"एक मजबूत NestJS + Expo + PostgreSQL आर्किटेक्चर जो लाखों यूजर्स का लोड उठा सकता है।"</div>
    <div class="impact"><strong>प्रभाव:</strong> Clean DB schema, strict TypeScript types, 0 technical debt.</div>
  </div>

  <h2>13. इनवेस्टर और डायरेक्टर (Investors & Board Directors)</h2>
  <div class="card">
    <div class="card-title">💼 इनवेस्टर्स का दृष्टिकोण (Investor & Equity View)</div>
    <div class="quote">"100% कानूनी, उच्च-मार्जिन और 5 आय स्रोतों वाला स्केलेबल बिजनेस।"</div>
    <div class="impact"><strong>प्रभाव:</strong> High LTV, low CAC, 100% FDI Compliant marketplace.</div>
  </div>

  <h2>14. सर्विस प्रदाता (Cashfree, Shiprocket, PhonePe, WhatsApp API)</h2>
  <div class="card">
    <div class="card-title">🚚 सर्विस प्रदाताओं का दृष्टिकोण (Service Integration View)</div>
    <div class="quote">"FarmsKing हमारा हाई-वॉल्यूम एंटरप्राइज पार्टनर है।"</div>
    <div class="impact"><strong>प्रभाव:</strong> Cashfree Auto-Split Payouts, Shiprocket Vendor Pickups, PhonePe PG, WhatsApp OTPs.</div>
  </div>

  <h2>15. गार्डनर और गार्डन एडवाइजर (Gardeners & Rooftop Garden Advisors)</h2>
  <div class="card">
    <div class="card-title">🏡 गार्डनर्स का दृष्टिकोण (Urban Gardening View)</div>
    <div class="quote">"शहरी घरों की छतों, किचन गार्डन और पौधों के लिए विशेष प्लेटफॉर्म।"</div>
    <div class="impact"><strong>प्रभाव:</strong> होम गार्डन विजिट, ऑर्गेनिक मिट्टी/पौधे बेचकर नई शहरी आय।</div>
  </div>

  <h2>16. कंपनी कर्मचारी (Admin Staff, Operators, Supervisors)</h2>
  <div class="card">
    <div class="card-title">👔 कर्मचारियों का दृष्टिकोण (Employee & Staff View)</div>
    <div class="quote">"रोल-परमिशन वाला आसान डैशबोर्ड जहां काम करना बहुत सरल है।"</div>
    <div class="impact"><strong>प्रभाव:</strong> 1-Click Order Packing/Dispatch, Farm Spray Schedules, Clean Audit Logs.</div>
  </div>

  <h2>17. फसल डॉक्टर (Crop Doctors - Senior & Junior Doctors)</h2>
  <div class="card">
    <div class="card-title">👨‍⚕️ डॉक्टरों का दृष्टिकोण (Crop Doctor View)</div>
    <div class="quote">"देशव्यापी डिजिटल क्लिनिक जहां घर बैठे इलाज करके बढ़िया आय मिलती है।"</div>
    <div class="impact"><strong>प्रभाव:</strong> Pay-per-Consultation, e-Prescription, Satellite Crop NDVI Scan access.</div>
  </div>

  <h2>18. फसल सलाहकार (Crop Advisors - Field Agronomists)</h2>
  <div class="card">
    <div class="card-title">👨‍🌾 एडवाइजर्स का दृष्टिकोण (Crop Advisor View)</div>
    <div class="quote">"कागजी काम से मुक्ति, ऑटोमैटिक स्प्रे शेड्यूल और वॉलेट कमिशन।"</div>
    <div class="impact"><strong>प्रभाव:</strong> 100 खेतों की डिजिटल देखरेख, मौसम चेतावनी अलर्ट, मासिक वॉलेट पेआउट।</div>
  </div>

  <div class="footer">
    FarmsKing Agriculture & Gardening Ecosystem — Master Vision & Stakeholder Impact Document | गोपनीय
  </div>
</body>
</html>
`;

// 3. ENGLISH HTML
const htmlEN = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>FarmsKing — 360-Degree Stakeholder Vision & Impact Document</title>
  ${commonStyle}
</head>
<body>
  <h1>FarmsKing — 360-Degree Stakeholder Vision & Ecosystem Impact (Master Document)</h1>
  <p><strong>Document Date:</strong> September 30, 2026 | <strong>Platform:</strong> FarmsKing Agriculture & Gardening Ecosystem</p>

  <h2>1. Farmers</h2>
  <div class="card">
    <div class="card-title">🌾 Farmer Perspective</div>
    <div class="quote">"FarmsKing is not just an app; it is my personal Digital Farm Manager & Crop Doctor."</div>
    <div class="impact"><strong>Impact:</strong> Live Mandi rates, digital J-Form ledger, Crop Doctor consultation, 0% GST raw produce billing, and doorstep 100% genuine inputs. 80% reduction in crop failure.</div>
  </div>

  <h2>2. FarmsKing Founders & Executive Management</h2>
  <div class="card">
    <div class="card-title">👑 Founders & Management Vision</div>
    <div class="quote">"India's largest, 100% regulatory-compliant agri-tech ecosystem with 5 diversified revenue streams."</div>
    <div class="impact"><strong>Impact:</strong> Membership plans, e-commerce commissions, doctor consultation fees, brand advertising, and fintech float. 100% FDI & GST Section 52 compliant.</div>
  </div>

  <h2>3. Sellers & Store Owners (Surinder Agro & 3P Stores)</h2>
  <div class="card">
    <div class="card-title">🏪 Seller & Dealer Perspective</div>
    <div class="quote">"My shop is no longer restricted to my local village; I can sell pan-India on FarmsKing."</div>
    <div class="impact"><strong>Impact:</strong> 1% TCS automatically deposited into Govt GST Cash Ledger. Automated GST Rule 46 invoices (FK-INV-...). Official Store Tag builds buyer trust.</div>
  </div>

  <h2>4. General Public & Consumers</h2>
  <div class="card">
    <div class="card-title">👥 Public & Consumer Perspective</div>
    <div class="quote">"We get fresh, residue-free, FSSAI-certified farm produce directly from verified farmers."</div>
    <div class="impact"><strong>Impact:</strong> Farm-to-table traceability, middleman-free fresh produce at fair prices.</div>
  </div>

  <h2>5. Government & Tax Authorities</h2>
  <div class="card">
    <div class="card-title">🏛️ Government & GST Authority View</div>
    <div class="quote">"The ideal model of Digital India and transparent tax compliance in agriculture."</div>
    <div class="impact"><strong>Impact:</strong> Section 52 ECO compliance, monthly GSTR-8 filing, FSSAI & CIBRC license verification. Eliminates counterfeit agrochemicals.</div>
  </div>

  <h2>6. Agri-Chemical & Seed Manufacturers (Syngenta, Bayer, IFFCO, UPL)</h2>
  <div class="card">
    <div class="card-title">🏭 Agri Manufacturer View</div>
    <div class="quote">"FarmsKing is our most trusted Direct-to-Farmer (D2F) distribution channel."</div>
    <div class="impact"><strong>Impact:</strong> Doctors issue exact e-prescriptions, eliminating fake brands; manufacturers get real-time regional demand analytics.</div>
  </div>

  <h2>7. Opponents & Traditional Middlemen</h2>
  <div class="card">
    <div class="card-title">⚔️ Opponents & Traditional Arhtiyas View</div>
    <div class="quote">"This is a major disruption to our 24-36% interest advance system."</div>
    <div class="impact"><strong>Impact:</strong> Disrupts exploitative practices. Smart Arhtiyas join KingConnect to digitize their commissions and lending ledger.</div>
  </div>

  <h2>8. Advertisers & Brand Sponsors</h2>
  <div class="card">
    <div class="card-title">🎯 Advertiser & Sponsor View</div>
    <div class="quote">"The premium platform to reach targeted commercial farmers for tractors, solar pumps, and insurance."</div>
    <div class="impact"><strong>Impact:</strong> Hyper-targeted advertising by district and crop type yields high-margin ad revenue for FarmsKing.</div>
  </div>

  <h2>9. Chartered Accountants & Legal Auditors</h2>
  <div class="card">
    <div class="card-title">⚖️ CAs & Tax Compliance View</div>
    <div class="quote">"The cleanest, most audit-proof e-commerce architecture in agri-tech."</div>
    <div class="impact"><strong>Impact:</strong> Clear separation of platform commission vs 3P seller turnover vs 1P Surinder Agro trading. Zero audit errors.</div>
  </div>

  <h2>10. Industry Competitors (Flipkart, Amazon, DeHaat, AgroStar)</h2>
  <div class="card">
    <div class="card-title">🌐 Industry Competitor View</div>
    <div class="quote">"FarmsKing has built a unique Regional Super-App integrating P2P KingConnect, Doctor Consultation, Mandi Rates, and E-commerce."</div>
    <div class="impact"><strong>Impact:</strong> Monopoly market leadership in Punjab and North India agriculture.</div>
  </div>

  <h2>11. Technical Trainers (Verification Field Agents)</h2>
  <div class="card">
    <div class="card-title">🎓 Field Trainer View</div>
    <div class="quote">"A transparent daily earning stream by training farmers and verifying their accounts."</div>
    <div class="impact"><strong>Impact:</strong> Automated wallet payouts via Baseline and Upline trainer hierarchy.</div>
  </div>

  <h2>12. Programmers & Software Developers</h2>
  <div class="card">
    <div class="card-title">💻 Engineering & Dev View</div>
    <div class="quote">"A high-performance NestJS + Expo + PostgreSQL architecture built to scale to millions of users."</div>
    <div class="impact"><strong>Impact:</strong> Clean DB schemas, strict TypeScript types, 0 technical debt.</div>
  </div>

  <h2>13. Investors & Board Directors</h2>
  <div class="card">
    <div class="card-title">💼 Investor & Equity View</div>
    <div class="quote">"A 100% compliant, high-margin, scalable business with 5 diversified revenue streams."</div>
    <div class="impact"><strong>Impact:</strong> High LTV, low CAC, 100% FDI compliant marketplace.</div>
  </div>

  <h2>14. Service Providers (Cashfree, Shiprocket, PhonePe, WhatsApp API)</h2>
  <div class="card">
    <div class="card-title">🚚 Service Provider Integration View</div>
    <div class="quote">"FarmsKing is a high-volume enterprise partner."</div>
    <div class="impact"><strong>Impact:</strong> Cashfree Auto-Split Payouts, Shiprocket Vendor Pickups, PhonePe PG, WhatsApp OTPs.</div>
  </div>

  <h2>15. Gardeners & Rooftop Garden Advisors</h2>
  <div class="card">
    <div class="card-title">🏡 Urban Gardening View</div>
    <div class="quote">"A dedicated platform for urban home gardening, rooftop vegetable setups, and plant care."</div>
    <div class="impact"><strong>Impact:</strong> Home visit bookings, organic soil/plant sales, and plant doctor advice.</div>
  </div>

  <h2>16. Company Employees (Admin Staff, Operators, Supervisors)</h2>
  <div class="card">
    <div class="card-title">👔 Employee & Staff View</div>
    <div class="quote">"A frictionless, role-permission-driven dashboard where operations are automated."</div>
    <div class="impact"><strong>Impact:</strong> 1-Click order packing/dispatch, farm spray schedules, clean audit logs.</div>
  </div>

  <h2>17. Crop Doctors (Senior & Junior Doctors)</h2>
  <div class="card">
    <div class="card-title">👨‍⚕️ Crop Doctor View</div>
    <div class="quote">"A nationwide digital clinic where I can diagnose crops and earn a dignified professional income."</div>
    <div class="impact"><strong>Impact:</strong> Pay-per-consultation, e-prescriptions, satellite NDVI scan access.</div>
  </div>

  <h2>18. Crop Advisors (Field Agronomists)</h2>
  <div class="card">
    <div class="card-title">👨‍🌾 Crop Advisor View</div>
    <div class="quote">"Freedom from paperwork, automated spray schedules, and direct wallet commissions."</div>
    <div class="impact"><strong>Impact:</strong> Digital monitoring of 100+ farms, weather alerts, monthly wallet payouts.</div>
  </div>

  <div class="footer">
    FarmsKing Agriculture & Gardening Ecosystem — Master Vision & Stakeholder Impact Document | Confidential
  </div>
</body>
</html>
`;

// Save HTML files
fs.writeFileSync(path.join(docsDir, 'FarmsKing_Stakeholders_Vision_PB.html'), htmlPB, 'utf8');
fs.writeFileSync(path.join(docsDir, 'FarmsKing_Stakeholders_Vision_HI.html'), htmlHI, 'utf8');
fs.writeFileSync(path.join(docsDir, 'FarmsKing_Stakeholders_Vision_EN.html'), htmlEN, 'utf8');

console.log('Thinking HTML files created successfully.');

// Convert HTML to PDF via Edge Headless
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const convertToPdf = (htmlFile, pdfFile) => {
  const fullHtml = path.resolve(htmlFile);
  const fullPdf = path.resolve(pdfFile);
  const cmd = `"${edgePath}" --headless --disable-gpu --print-to-pdf="${fullPdf}" "file:///${fullHtml.replace(/\\/g, '/')}"`;
  console.log(`Converting ${path.basename(htmlFile)} to PDF...`);
  execSync(cmd);
};

convertToPdf(path.join(docsDir, 'FarmsKing_Stakeholders_Vision_PB.html'), path.join(docsDir, 'FarmsKing_Stakeholders_Vision_PB.pdf'));
convertToPdf(path.join(docsDir, 'FarmsKing_Stakeholders_Vision_HI.html'), path.join(docsDir, 'FarmsKing_Stakeholders_Vision_HI.pdf'));
convertToPdf(path.join(docsDir, 'FarmsKing_Stakeholders_Vision_EN.html'), path.join(docsDir, 'FarmsKing_Stakeholders_Vision_EN.pdf'));

console.log('All 3 Thinking PDFs generated successfully in d:\\FarmsKing\\docs\\thinking\\');
