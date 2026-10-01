const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const reportsDir = 'd:\\FarmsKing\\reports';
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// Current Date & Time String
const now = new Date();
const dateStr = now.toISOString().split('T')[0]; // 2026-10-01
const hours = String(now.getHours()).padStart(2, '0');
const minutes = String(now.getMinutes()).padStart(2, '0');
const seconds = String(now.getSeconds()).padStart(2, '0');
const timeStampStr = `${dateStr}_${hours}-${minutes}-${seconds}`;
const formattedDateFormatted = now.toLocaleDateString('en-IN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
});

const commonStyle = `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Noto+Sans+Gurmukhi:wght@400;600;700;800&display=swap');
    body {
      font-family: 'Inter', 'Noto Sans Gurmukhi', sans-serif;
      margin: 35px;
      color: #0f172a;
      line-height: 1.6;
      background-color: #ffffff;
    }
    .header-box {
      background: linear-gradient(135deg, #064e3b 0%, #047857 100%);
      color: #ffffff;
      padding: 24px;
      border-radius: 12px;
      margin-bottom: 25px;
    }
    .header-box h1 {
      margin: 0 0 6px 0;
      color: #facc15;
      font-size: 26px;
      font-weight: 800;
    }
    .header-box p {
      margin: 0;
      color: #e2e8f0;
      font-size: 14px;
    }
    .meta-bar {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 10px 16px;
      border-radius: 8px;
      margin-bottom: 20px;
      font-size: 13px;
      font-weight: 600;
      color: #475569;
    }
    h2 {
      color: #047857;
      margin-top: 25px;
      font-size: 19px;
      border-bottom: 2px solid #10b981;
      padding-bottom: 6px;
    }
    h3 {
      color: #1e293b;
      font-size: 15px;
      margin-top: 16px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 10px 12px;
      text-align: left;
      font-size: 13px;
    }
    th {
      background-color: #065f46;
      color: #ffffff;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 12px;
    }
    tr:nth-child(even) {
      background-color: #f8fafc;
    }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
    }
    .badge-free { background: #d1fae5; color: #065f46; }
    .badge-kisan { background: #e0f2fe; color: #0369a1; }
    .badge-boss { background: #fef3c7; color: #92400e; }
    .badge-king { background: #f3e8ff; color: #6b21a8; }
    .card-box {
      border: 1.5px solid #e2e8f0;
      border-radius: 10px;
      padding: 16px;
      margin-bottom: 14px;
      background: #fafafa;
    }
    .card-title {
      font-size: 16px;
      font-weight: 800;
      margin-bottom: 6px;
    }
    .notice-box {
      background-color: #f0fdf4;
      border-left: 4px solid #10b981;
      padding: 14px 18px;
      margin: 18px 0;
      border-radius: 6px;
      font-size: 13.5px;
    }
    .footer {
      margin-top: 40px;
      font-size: 11px;
      text-align: center;
      color: #64748b;
      border-top: 1px solid #e2e8f0;
      padding-top: 12px;
    }
  </style>
`;

// 1. PUNJABI REPORT HTML
const htmlPB = `
<!DOCTYPE html>
<html lang="pa">
<head>
  <meta charset="UTF-8">
  <title>FarmsKing — ਫਾਰਮਰ ਕਾਰਡ ਅਤੇ ਪਲੇਅ ਸਟੋਰ ਨੀਤੀ ਰਿਪੋਰਟ</title>
  ${commonStyle}
</head>
<body>
  <div class="header-box">
    <h1>👑 ਫਾਰਮਜ਼ਕਿੰਗ (FarmsKing) — ਫਾਰਮਰ ਕਾਰਡ ਮਾਡਲ ਅਤੇ ਪਾਲਿਸੀ ਰਿਪੋਰਟ</h1>
    <p>Official Farmer Cards Architecture, Feature Gate Rules & Google Play Store Compliance Report</p>
  </div>

  <div class="meta-bar">
    📅 <strong>ਰਿਪੋਰਟ ਮਿਤੀ ਤੇ ਸਮਾਂ:</strong> ${formattedDateFormatted} | 📍 <strong>ਫਾਈਲ ਟਾਈਮਸਟੈਂਪ:</strong> ${timeStampStr}
  </div>

  <div class="notice-box">
    <strong>🎯 ਮੁੱਖ ਉਦੇਸ਼:</strong> ਕਿਸਾਨ ਨੂੰ VIP ਸਨਮਾਨ ਦੇਣਾ, ਖੇਤੀ ਹਿਸਾਬ-ਕਿਤਾਬ ਵਿੱਚ ਪੂਰੀ ਪਾਰਦਰਸ਼ਤਾ ਪ੍ਰਦਾਨ ਕਰਨਾ, ਅਤੇ Google Play Store ਦੀ 30% ਸਬਸਕ੍ਰਿਪਸ਼ਨ ਫੀਸ ਤੋਂ ਬਚ ਕੇ Cashfree Direct UPI (0% Fee) ਰਾਹੀਂ 100% ਲੀਗਲ ਪਲੇਟਫਾਰਮ ਚਲਾਉਣਾ।
  </div>

  <h2>1. ਆਫਿਸ਼ੀਅਲ 4-ਟਾਇਰ ਫਾਰਮਰ ਕਾਰਡ ਢਾਂਚਾ (Official 4-Tier Farmer Card Matrix)</h2>
  <table>
    <thead>
      <tr>
        <th>ਕਾਰਡ/ਪਲਾਨ ਦਾ ਨਾਮ</th>
        <th>ਕੀਮਤ (Price)</th>
        <th>ਕਿਸਾਨ ਲਈ ਰੁਤਬਾ ਤੇ ਫੀਚਰ (Farmer Value)</th>
        <th>ਪੇਮੈਂਟ ਅਤੇ ਪਾਲਿਸੀ ਸਥਿਤੀ</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="badge badge-free">🟢 Free Pass</span></td>
        <td><strong>₹0 (ਮੁਫ਼ਤ)</strong></td>
        <td>ਮੁਫ਼ਤ ਐਂਟਰੀ, ਪੰਜਾਬ ਲਾਈਵ ਮੰਡੀ ਰੇਟ, ਬੁਨਿਆਦੀ ਮੌਸਮ ਜਾਣਕਾਰੀ, ਮੈਕਸੀਮਮ 1 ਐਕਟਿਵ ਫਸਲ, 180-ਦਿਨ ਆਟੋ-ਡਿਊਰੇਸ਼ਨ ਲਿਮਟ।</td>
        <td>ਮੁਫ਼ਤ (Free Entry)</td>
      </tr>
      <tr>
        <td><span class="badge badge-kisan">📝 Kisan Card</span></td>
        <td><strong>Tier 1 Paid</strong></td>
        <td>ਨੈਸ਼ਨਲ/ਦੂਜੇ ਰਾਜਾਂ ਦੇ ਮੰਡੀ ਰੇਟ, max 3 ਐਕਟਿਵ ਫਸਲਾਂ, ਆੜ੍ਹਤੀਆ ਵਿਆਜ ਤੇ ਖਰਚਾ ਖਾਤਾ, PDF ਰਿਪੋਰਟ & WhatsApp ਸ਼ੇਅਰ <strong>100% UNLOCKED</strong>, 15 ਸੇਲ ਬਿਲ ਸਟੋਰੇਜ।</td>
        <td>Direct Cashfree UPI (0% Google Fee)</td>
      </tr>
      <tr>
        <td><span class="badge badge-boss">👷 Boss Card</span></td>
        <td><strong>Tier 2 Paid</strong></td>
        <td>ਅਨਲਿਮਟਿਡ ਐਕਟਿਵ ਫਸਲਾਂ, ਫੋਟੋ ਅਪਲੋਡ (ਬੀਮਾਰੀ ਫੋਟੋਆਂ ਤੇ ਬਿਲ ਸਕੈਨ) <strong>UNLOCKED</strong>, ਲੇਬਰ ਮੈਨੇਜਮੈਂਟ ਤੇ Labour Login (Up to 10 ਵਰਕਰ) <strong>UNLOCKED</strong>, 1 ਸੈਟੇਲਾਈਟ ਜਾਂਚ/ਮਹੀਨਾ।</td>
        <td>Direct Cashfree UPI (0% Google Fee)</td>
      </tr>
      <tr>
        <td><span class="badge badge-king">👑 King Card</span></td>
        <td><strong>Tier 3 Paid</strong></td>
        <td>ਸੁਪਰ ਫਾਰਮਰ ਅਸਟੇਟ: ਅਨਲਿਮਟਿਡ ਫਸਲਾਂ, ਅਨਲਿਮਟਿਡ ਲੇਬਰ ਮੈਨੇਜਮੈਂਟ, <strong>5 ਟੀਮ ਮੈਂਬਰ/ਸੁਪਰਵਾਈਜ਼ਰ ਐਕਸੈਸ UNLOCKED</strong>, ਅਨਲਿਮਟਿਡ ਸੈਟੇਲਾਈਟ ਜਾਂਚ ਤੇ ਡਾਕਟਰ ਡਾਇਰੈਕਟ ਕਾਲ।</td>
        <td>Direct Cashfree UPI (0% Google Fee)</td>
      </tr>
    </tbody>
  </table>

  <h2>2. ਸਮਾਰਟ ਫੀਚਰ ਅਨਲੌਕ ਨਿਯਮ (Smart Feature Gate Rules & Monetization Psychology)</h2>
  <div class="card-box">
    <div class="card-title">🔒 1. PDF Download & WhatsApp Share Gate</div>
    <p>Free Pass ਉੱਤੇ ਖਾਤਾ ਤੇ ਬਿਲ ਸਕ੍ਰੀਨ 'ਤੇ ਦਿਸਣਗੇ, ਪਰ PDF ਡਾਊਨਲੋਡ ਅਤੇ WhatsApp ਸ਼ੇਅਰ ਬਟਨ 'ਤੇ ਕਲਿੱਕ ਕਰਨ 'ਤੇ <strong>Kisan Card</strong> ਅਨਲੌਕ ਕਰਨ ਲਈ ਕਹੇਗਾ।</p>
  </div>
  <div class="card-box">
    <div class="card-title">🔒 2. Other States Mandi Rates Gate</div>
    <p>Free Pass ਉੱਤੇ ਸਥਾਨਕ ਪੰਜਾਬ ਮੰਡੀ ਰੇਟ ਮੁਫ਼ਤ ਹਨ, ਪਰ ਕਿਸੇ ਫਸਲ 'ਤੇ ਕਲਿੱਕ ਕਰਕੇ ਦੂਜੇ ਰਾਜਾਂ (ਹਰਿਆਣਾ, ਰਾਜਸਥਾਨ, MP, ਦਿੱਲੀ) ਦੇ ਮੰਡੀ ਰੇਟ ਵੇਖਣ ਲਈ <strong>Kisan Card</strong> ਦੀ ਮੰਗ ਕਰੇਗਾ।</p>
  </div>
  <div class="card-box">
    <div class="card-title">🔒 3. Photo Upload Gate</div>
    <p>Kisan Card ਉੱਤੇ ਫੋਟੋ ਅਪਲੋਡ ਬਟਨ ਦਿਸੇਗਾ, ਪਰ ਬੀਮਾਰੀ ਫੋਟੋਆਂ ਜਾਂ ਬਿਲ ਸਕੈਨ ਅਪਲੋਡ ਕਰਨ ਲਈ <strong>Boss Card</strong> ਅਪਗ੍ਰੇਡ ਕਰਨ ਲਈ ਕਹੇਗਾ।</p>
  </div>
  <div class="card-box">
    <div class="card-title">🔒 4. Labour Management & Labour Login Gate</div>
    <p>ਮਜ਼ਦੂਰਾਂ ਦੀ ਹਾਜ਼ਰੀ, ਅਡਵਾਂਸ ਰਸੀਦ ਅਤੇ ਵਰਕਰਾਂ ਲਈ Labour Login ਸਿਰਫ਼ <strong>Boss Card</strong> ਅਤੇ <strong>King Card</strong> ਵਿੱਚ ਹੀ ਉਪਲਬਧ ਹੋਵੇਗਾ।</p>
  </div>
  <div class="card-box">
    <div class="card-title">🔒 5. Team Members & Supervisor Delegation Gate</div>
    <p>ਆਪਣੇ ਹੇਠਾਂ 5 ਸੁਪਰਵਾਈਜ਼ਰ/ਟੀਮ ਮੈਂਬਰ ਜੋੜਨ ਅਤੇ ਆਪ੍ਰੇਟਰ ਰਾਈਟਸ ਦੇਣ ਦੀ ਸੁਵਿਧਾ ਸਿਰਫ਼ <strong>King Card</strong> ਵਿੱਚ ਹੀ ਮਿਲੇਗੀ।</p>
  </div>
  <div class="card-box">
    <div class="card-title">⏱️ 6. 180-Day Crop Duration Auto-Lock Engine</div>
    <p>Free Pass ਵਿੱਚ ਕਿਸੇ ਵੀ ਮੌਸਮੀ ਫਸਲ ਦੀ ਲਿਮਟ 180 ਦਿਨ (ਬਾਗਾਂ ਲਈ 365 ਦਿਨ) ਹੋਵੇਗੀ। 180 ਦਿਨਾਂ ਬਾਅਦ ਫਸਲ ਆਟੋ-ਲੌਕ ਹੋਵੇਗੀ, ਅਤੇ Paid Card ਲੈਂਦੇ ਹੀ ਕਿਸਾਨ ਦਾ ਪੂਰਾ ਹਿਸਾਬ ਅਨਲੌਕ ਹੋ ਜਾਵੇਗਾ।</p>
  </div>

  <h2>3. ਗੂਗਲ ਪਲੇਅ ਸਟੋਰ ਨੀਤੀ ਸੁਰੱਖਿਆ (Google Play Store Compliance)</h2>
  <ul>
    <li><strong>Direct Cashfree UPI Exemption:</strong> ਇਹ ਕਾਰਡ ਖੇਤੀਬਾੜੀ ਹਿਸਾਬ-ਕਿਤਾਬ (Agricultural Business Ledger Cards) ਵਜੋਂ ਰਜਿਸਟਰਡ ਹਨ, ਜਿਸ 'ਤੇ 0% Google Fee ਲੱਗਦੀ ਹੈ।</li>
    <li><strong>Auto-Dynamic Privacy Policy Engine:</strong> <code>https://farmsking.in/privacy-policy</code> ਲਿੰਕ ਤਿਆਰ ਹੈ ਜੋ ਸਿਸਟਮ ਮੋਡਿਊਲਾਂ ਨਾਲ ਲਾਈਵ ਅਪਡੇਟ ਹੁੰਦਾ ਹੈ।</li>
    <li><strong>Web Account Deletion Portal:</strong> <code>https://farmsking.in/account-deletion</code> ਵੈੱਬ ਪੋਰਟਲ ਅਤੇ ਇਨ-ਐਪ ਅਕਾਊਂਟ ਡਿਲੀਟ ਫੀਚਰ ਸ਼ਾਮਲ ਹੈ।</li>
  </ul>

  <div class="footer">
    FarmsKing Agriculture Marketplace System Report • Timestamp: ${timeStampStr} • Confidential
  </div>
</body>
</html>
`;

// 2. ENGLISH REPORT HTML
const htmlEN = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>FarmsKing — Farmer Cards & Play Store Policy Report</title>
  ${commonStyle}
</head>
<body>
  <div class="header-box">
    <h1>👑 FarmsKing — Farmer Cards Architecture & Policy Report</h1>
    <p>Official Farmer Cards Architecture, Feature Gate Rules & Google Play Store Compliance Report</p>
  </div>

  <div class="meta-bar">
    📅 <strong>Report Date & Time:</strong> ${formattedDateFormatted} | 📍 <strong>File Timestamp:</strong> ${timeStampStr}
  </div>

  <div class="notice-box">
    <strong>🎯 Primary Objective:</strong> Deliver VIP respect & financial transparency to farmers while ensuring 100% Google Play Store compliance with 0% Google In-App Billing fee via Direct Cashfree UPI.
  </div>

  <h2>1. Official 4-Tier Farmer Card Architecture Matrix</h2>
  <table>
    <thead>
      <tr>
        <th>Card/Plan Name</th>
        <th>Price Tier</th>
        <th>Farmer Status & Features</th>
        <th>Payment & Compliance Status</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="badge badge-free">🟢 Free Pass</span></td>
        <td><strong>₹0 (Free)</strong></td>
        <td>Free entry, local Punjab Mandi rates, basic weather, max 1 active crop, 180-day auto-duration limit.</td>
        <td>Free Access</td>
      </tr>
      <tr>
        <td><span class="badge badge-kisan">📝 Kisan Card</span></td>
        <td><strong>Tier 1 Paid</strong></td>
        <td>National/Other states Mandi rates, max 3 active crops, Aarthi interest & expense ledger, PDF Report & WhatsApp Share <strong>100% UNLOCKED</strong>, 15 sale bills storage.</td>
        <td>Direct Cashfree UPI (0% Google Fee)</td>
      </tr>
      <tr>
        <td><span class="badge badge-boss">👷 Boss Card</span></td>
        <td><strong>Tier 2 Paid</strong></td>
        <td>Unlimited active crops, Photo Upload (disease photos & bill scans) <strong>UNLOCKED</strong>, Labour Management & Labour Login (Up to 10 workers) <strong>UNLOCKED</strong>, 1 satellite scan/month.</td>
        <td>Direct Cashfree UPI (0% Google Fee)</td>
      </tr>
      <tr>
        <td><span class="badge badge-king">👑 King Card</span></td>
        <td><strong>Tier 3 Paid</strong></td>
        <td>Super Farmer Estate: Unlimited crops, unlimited labour management, <strong>5 Team Members/Supervisors Access UNLOCKED</strong>, unlimited satellite scans & direct doctor calls.</td>
        <td>Direct Cashfree UPI (0% Google Fee)</td>
      </tr>
    </tbody>
  </table>

  <h2>2. Smart Feature Gate Rules & Monetization Psychology</h2>
  <div class="card-box">
    <div class="card-title">🔒 1. PDF Download & WhatsApp Share Gate</div>
    <p>On Free Pass, accounts data is viewable on screen, but PDF Download & WhatsApp Share buttons prompt the user to unlock <strong>Kisan Card</strong>.</p>
  </div>
  <div class="card-box">
    <div class="card-title">🔒 2. Other States Mandi Rates Gate</div>
    <p>Local Punjab Mandi rates are free, but clicking on a crop to view national rates (Haryana, Rajasthan, MP, Delhi) prompts for <strong>Kisan Card</strong>.</p>
  </div>
  <div class="card-box">
    <div class="card-title">🔒 3. Photo Upload Gate</div>
    <p>On Kisan Card, photo upload button is visible, but uploading crop disease photos or bill scans prompts to upgrade to <strong>Boss Card</strong>.</p>
  </div>
  <div class="card-box">
    <div class="card-title">🔒 4. Labour Management & Labour Login Gate</div>
    <p>Labour attendance, advance receipts, and Labour Login worker access are exclusive to <strong>Boss Card</strong> and <strong>King Card</strong>.</p>
  </div>
  <div class="card-box">
    <div class="card-title">🔒 5. Team Members & Supervisor Delegation Gate</div>
    <p>Adding 5 team members/supervisors to delegate data entry is exclusive to <strong>King Card</strong>.</p>
  </div>
  <div class="card-box">
    <div class="card-title">⏱️ 6. 180-Day Crop Duration Auto-Lock Engine</div>
    <p>Free Pass crops auto-lock after 180 days (365 days for orchards). Purchasing a Paid Card instantly unlocks all 6 months of logged data.</p>
  </div>

  <h2>3. Google Play Store Compliance & Security</h2>
  <ul>
    <li><strong>Direct Cashfree UPI Exemption:</strong> Cards are classified as Commercial Agricultural Business Utility Cards (0% Google fee).</li>
    <li><strong>Auto-Dynamic Privacy Policy Engine:</strong> Live policy hosted at <code>https://farmsking.in/privacy-policy</code>.</li>
    <li><strong>Web Account Deletion Portal:</strong> Live account deletion portal at <code>https://farmsking.in/account-deletion</code>.</li>
  </ul>

  <div class="footer">
    FarmsKing Agriculture Marketplace System Report • Timestamp: ${timeStampStr} • Confidential
  </div>
</body>
</html>
`;

// Paths
const pbHtmlPath = path.join(reportsDir, `FarmsKing_Farmer_Cards_Report_PB_${timeStampStr}.html`);
const enHtmlPath = path.join(reportsDir, `FarmsKing_Farmer_Cards_Report_EN_${timeStampStr}.html`);
const pbPdfPath = path.join(reportsDir, `FarmsKing_Farmer_Cards_Report_PB_${timeStampStr}.pdf`);
const enPdfPath = path.join(reportsDir, `FarmsKing_Farmer_Cards_Report_EN_${timeStampStr}.pdf`);

// Save HTML files
fs.writeFileSync(pbHtmlPath, htmlPB, 'utf8');
fs.writeFileSync(enHtmlPath, htmlEN, 'utf8');

console.log('HTML report files written successfully.');

// Convert to PDF via Headless Edge
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const convertToPdf = (htmlFile, pdfFile) => {
  const fullHtml = path.resolve(htmlFile);
  const fullPdf = path.resolve(pdfFile);
  const cmd = `"${edgePath}" --headless --disable-gpu --print-to-pdf="${fullPdf}" "file:///${fullHtml.replace(/\\/g, '/')}"`;
  console.log(`Converting ${path.basename(htmlFile)} to PDF...`);
  execSync(cmd);
};

try {
  convertToPdf(pbHtmlPath, pbPdfPath);
  convertToPdf(enHtmlPath, enPdfPath);
  console.log('PDF reports generated successfully in d:\\FarmsKing\\reports\\');
} catch (e) {
  console.error('Edge PDF conversion notice:', e.message);
}
