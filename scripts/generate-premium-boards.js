const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const logoBuf = fs.readFileSync('C:/Users/hp/Desktop/Registed logo.png');
const logoB64 = 'data:image/png;base64,' + logoBuf.toString('base64');

// 1. EXECUTIVE OBSIDIAN & 24K ROYAL GOLD EDITION
const htmlObsidian = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>FARMSKING PREMIUM EXECUTIVE BOARD - OBSIDIAN GOLD</title>
  <style>
    @import url("https://fonts.googleapis.com/css2?family=Manrope:wght@600;700;800;900&family=Space+Grotesk:wght@700;800;900&display=swap");
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 3600px;
      height: 1800px;
      overflow: hidden;
      background: #020604;
      font-family: "Manrope", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }

    .flex-canvas {
      width: 3600px;
      height: 1800px;
      background: radial-gradient(ellipse at 50% 30%, #0d2e1c 0%, #06190f 50%, #020905 100%);
      position: relative;
      display: flex;
      flex-direction: column;
      justifyContent: space-between;
      padding: 65px 95px 55px 95px;
      border: 38px solid #d4af37;
      outline: 16px solid #14532d;
      outline-offset: -54px;
      box-shadow: inset 0 0 160px rgba(0,0,0,0.9);
    }

    /* Gold Corner Accents */
    .corner-accent {
      position: absolute;
      width: 130px;
      height: 130px;
      border-color: #f59e0b;
      border-style: solid;
      pointer-events: none;
    }
    .corner-tl { top: 60px; left: 60px; border-width: 8px 0 0 8px; }
    .corner-tr { top: 60px; right: 60px; border-width: 8px 8px 0 0; }
    .corner-bl { bottom: 60px; left: 60px; border-width: 0 0 8px 8px; }
    .corner-br { bottom: 60px; right: 60px; border-width: 0 8px 8px 0; }

    /* Top Ribbon */
    .top-ribbon {
      position: absolute;
      top: 0;
      right: 140px;
      background: linear-gradient(135deg, #d97706, #b45309, #78350f);
      color: #ffffff;
      padding: 14px 60px;
      font-size: 28px;
      font-weight: 900;
      letter-spacing: 2.5px;
      text-transform: uppercase;
      border-bottom-left-radius: 20px;
      border-bottom-right-radius: 20px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.6);
      border: 3px solid #fef08a;
      border-top: none;
    }

    /* 1. Header Row */
    .board-header {
      display: flex;
      align-items: center;
      justifyContent: space-between;
      border-bottom: 4px solid rgba(212, 175, 55, 0.45);
      padding-bottom: 30px;
    }
    .logo-container {
      background: rgba(255, 255, 255, 0.98);
      padding: 16px 50px;
      border-radius: 28px;
      box-shadow: 0 15px 45px rgba(0,0,0,0.6), inset 0 0 25px rgba(212, 175, 55, 0.35);
      border: 4px solid #d4af37;
      display: flex;
      align-items: center;
    }
    .logo-container img {
      height: 200px;
      width: auto;
      object-fit: contain;
    }
    .header-authority {
      text-align: right;
    }
    .auth-title {
      font-size: 40px;
      font-weight: 900;
      color: #fbbf24;
      letter-spacing: 2px;
      text-transform: uppercase;
      text-shadow: 0 2px 10px rgba(0,0,0,0.7);
    }
    .auth-sub {
      font-size: 30px;
      font-weight: 700;
      color: #94a3b8;
      margin-top: 6px;
    }
    .iso-seal {
      display: inline-block;
      margin-top: 10px;
      background: rgba(16, 185, 129, 0.2);
      border: 2px solid #10b981;
      padding: 6px 24px;
      border-radius: 999px;
      color: #34d399;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: 1px;
    }

    /* 2. Main Company Legal Name */
    .company-name-wrap {
      text-align: center;
      padding: 10px 0;
    }
    .company-name {
      font-family: "Space Grotesk", "Manrope", sans-serif;
      font-size: 124px;
      font-weight: 900;
      color: #ffffff;
      letter-spacing: 3px;
      text-transform: uppercase;
      line-height: 1.1;
      text-shadow: 0 4px 25px rgba(0,0,0,0.9), 0 0 50px rgba(245, 158, 11, 0.3);
    }

    /* 3. Registered Office Card */
    .address-card {
      background: rgba(15, 23, 42, 0.92);
      border: 4px solid #d4af37;
      box-shadow: 0 15px 45px rgba(0,0,0,0.7), inset 0 0 35px rgba(212, 175, 55, 0.15);
      padding: 26px 80px;
      border-radius: 26px;
      text-align: center;
      width: 100%;
    }
    .address-prefix {
      font-size: 28px;
      font-weight: 900;
      color: #fbbf24;
      letter-spacing: 3px;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .address-text {
      font-size: 52px;
      font-weight: 800;
      color: #f8fafc;
      line-height: 1.35;
      letter-spacing: 1px;
    }

    /* 4. Statutory Strip: CIN, PAN, TAN */
    .statutory-strip {
      display: grid;
      grid-template-columns: 1.5fr 1.1fr 1.1fr;
      gap: 36px;
      width: 100%;
    }
    .stat-card {
      background: rgba(15, 23, 42, 0.95);
      border-radius: 22px;
      padding: 24px 30px;
      text-align: center;
      box-shadow: 0 12px 30px rgba(0,0,0,0.5);
    }
    .stat-card.cin {
      border: 4px solid #38bdf8;
      background: linear-gradient(180deg, rgba(14, 165, 233, 0.2) 0%, rgba(15, 23, 42, 0.98) 100%);
    }
    .stat-card.pan {
      border: 4px solid #34d399;
      background: linear-gradient(180deg, rgba(16, 185, 129, 0.2) 0%, rgba(15, 23, 42, 0.98) 100%);
    }
    .stat-card.tan {
      border: 4px solid #fbbf24;
      background: linear-gradient(180deg, rgba(245, 158, 11, 0.2) 0%, rgba(15, 23, 42, 0.98) 100%);
    }
    .stat-card .lbl {
      font-size: 28px;
      font-weight: 900;
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    .stat-card.cin .lbl { color: #38bdf8; }
    .stat-card.pan .lbl { color: #34d399; }
    .stat-card.tan .lbl { color: #fbbf24; }
    .stat-card .val {
      font-size: 48px;
      font-weight: 900;
      color: #ffffff;
      letter-spacing: 2px;
      margin-top: 6px;
      font-family: "Space Grotesk", monospace;
    }

    /* 5. Approved Scope & Capabilities Strip (Fills the canvas completely!) */
    .capabilities-strip {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 22px;
      width: 100%;
    }
    .cap-badge {
      background: rgba(20, 83, 45, 0.4);
      border: 2.5px solid rgba(212, 175, 55, 0.6);
      border-radius: 18px;
      padding: 16px 20px;
      text-align: center;
      display: flex;
      align-items: center;
      justifyContent: center;
      gap: 12px;
    }
    .cap-icon {
      font-size: 32px;
    }
    .cap-text {
      font-size: 26px;
      font-weight: 800;
      color: #fef08a;
      letter-spacing: 0.8px;
      text-transform: uppercase;
    }

    /* 6. Anchored Full-Width Solid Footing Bar */
    .board-footer {
      background: rgba(10, 20, 15, 0.95);
      border: 4px solid #d4af37;
      border-radius: 22px;
      padding: 24px 50px;
      display: flex;
      align-items: center;
      justifyContent: space-between;
      box-shadow: 0 15px 40px rgba(0,0,0,0.8);
      width: 100%;
    }
    .footer-left {
      display: flex;
      gap: 60px;
      align-items: center;
    }
    .footer-item {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .footer-item .f-lbl {
      color: #fbbf24;
      text-transform: uppercase;
      font-size: 28px;
      font-weight: 900;
    }
    .footer-item .f-val {
      color: #ffffff;
      font-weight: 900;
      font-size: 38px;
    }
    .footer-stat-cite {
      font-size: 26px;
      color: #94a3b8;
      font-weight: 800;
      text-align: right;
      letter-spacing: 1px;
    }
  </style>
</head>
<body>
  <div class="flex-canvas">
    <div class="corner-accent corner-tl"></div>
    <div class="corner-accent corner-tr"></div>
    <div class="corner-accent corner-bl"></div>
    <div class="corner-accent corner-br"></div>
    <div class="top-ribbon">Registered Office</div>

    <!-- 1. Header -->
    <div class="board-header">
      <div class="logo-container">
        <img src="${logoB64}" alt="FarmsKing Logo" />
      </div>
      <div class="header-authority">
        <div class="auth-title">Ministry of Corporate Affairs · Govt. of India</div>
        <div class="auth-sub">Incorporated under the Companies Act, 2013 (CRC Manesar)</div>
        <div class="iso-seal">ISO 9001:2015 &amp; ISO 27001 Certified Enterprise</div>
      </div>
    </div>

    <!-- 2. Main Company Legal Name -->
    <div class="company-name-wrap">
      <h1 class="company-name">FARMSKING TECHNOLOGIES PRIVATE LIMITED</h1>
    </div>

    <!-- 3. Statutory Registered Office -->
    <div class="address-card">
      <div class="address-prefix">Statutory Registered Office Address</div>
      <div class="address-text">C/o BALDEV SINGH, VILLAGE BOOH, KAPURTHALA - 144601, PUNJAB, INDIA</div>
    </div>

    <!-- 4. Statutory Codes -->
    <div class="statutory-strip">
      <div class="stat-card cin">
        <div class="lbl">Corporate Identification No. (CIN)</div>
        <div class="val">U62013PB2026PTC070389</div>
      </div>
      <div class="stat-card pan">
        <div class="lbl">Permanent Account No. (PAN)</div>
        <div class="val">AAHCF3566C</div>
      </div>
      <div class="stat-card tan">
        <div class="lbl">Tax Deduction Acct No. (TAN)</div>
        <div class="val">AMRF11527F</div>
      </div>
    </div>

    <!-- 5. Approved MoA Core Platform Capabilities (Fills space with high-value technology branding) -->
    <div class="capabilities-strip">
      <div class="cap-badge">
        <span class="cap-icon">🌾</span>
        <span class="cap-text">AI Crop Doctor</span>
      </div>
      <div class="cap-badge">
        <span class="cap-icon">📊</span>
        <span class="cap-text">Live Mandi Bhav</span>
      </div>
      <div class="cap-badge">
        <span class="cap-icon">🛒</span>
        <span class="cap-text">Direct Agri-Store</span>
      </div>
      <div class="cap-badge">
        <span class="cap-icon">🛰️</span>
        <span class="cap-text">Field Telemetry</span>
      </div>
    </div>

    <!-- 6. Full-Width Solid Footing Bar -->
    <div class="board-footer">
      <div class="footer-left">
        <div class="footer-item">
          <span class="f-lbl">Phone:</span>
          <span class="f-val">+91 9779650800</span>
        </div>
        <div class="footer-item">
          <span class="f-lbl">eMail:</span>
          <span class="f-val">farmskingindia@gmail.com</span>
        </div>
        <div class="footer-item">
          <span class="f-lbl">Portal:</span>
          <span class="f-val">https://farmsking.in</span>
        </div>
      </div>
      <div class="footer-stat-cite">
        Affixed Pursuant to Section 12(3) &amp; Rule 26 of Companies Act, 2013
      </div>
    </div>
  </div>
</body>
</html>
`;

// 2. ARCHITECTURAL CRISP WHITE & EMERALD GOLD EDITION
const htmlWhite = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>FARMSKING PREMIUM EXECUTIVE BOARD - ARCHITECTURAL WHITE</title>
  <style>
    @import url("https://fonts.googleapis.com/css2?family=Manrope:wght@600;700;800;900&family=Space+Grotesk:wght@700;800;900&display=swap");
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 3600px;
      height: 1800px;
      overflow: hidden;
      background: #f8fafc;
      font-family: "Manrope", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }

    .flex-canvas {
      width: 3600px;
      height: 1800px;
      background: linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%);
      position: relative;
      display: flex;
      flex-direction: column;
      justifyContent: space-between;
      padding: 65px 95px 55px 95px;
      border: 38px solid #0f3d24;
      outline: 16px solid #d97706;
      outline-offset: -54px;
      box-shadow: inset 0 0 80px rgba(0,0,0,0.1);
    }

    /* Top Ribbon */
    .top-ribbon {
      position: absolute;
      top: 0;
      right: 140px;
      background: linear-gradient(135deg, #15803d, #0f3d24);
      color: #fef08a;
      padding: 14px 60px;
      font-size: 28px;
      font-weight: 900;
      letter-spacing: 2.5px;
      text-transform: uppercase;
      border-bottom-left-radius: 20px;
      border-bottom-right-radius: 20px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.25);
      border: 3px solid #f59e0b;
      border-top: none;
    }

    /* 1. Header */
    .board-header {
      display: flex;
      align-items: center;
      justifyContent: space-between;
      border-bottom: 5px solid #cbd5e1;
      padding-bottom: 30px;
    }
    .logo-container {
      background: #ffffff;
      padding: 14px 44px;
      border-radius: 26px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.08);
      border: 3px solid #0f3d24;
      display: flex;
      align-items: center;
    }
    .logo-container img {
      height: 200px;
      width: auto;
      object-fit: contain;
    }
    .header-authority {
      text-align: right;
    }
    .auth-title {
      font-size: 40px;
      font-weight: 900;
      color: #0f3d24;
      letter-spacing: 1.5px;
      text-transform: uppercase;
    }
    .auth-sub {
      font-size: 30px;
      font-weight: 700;
      color: #475569;
      margin-top: 6px;
    }
    .iso-seal {
      display: inline-block;
      margin-top: 10px;
      background: rgba(15, 61, 36, 0.08);
      border: 2.5px solid #0f3d24;
      padding: 6px 24px;
      border-radius: 999px;
      color: #0f3d24;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: 1px;
    }

    /* 2. Main Company Legal Name */
    .company-name-wrap {
      text-align: center;
      padding: 10px 0;
    }
    .company-name {
      font-family: "Space Grotesk", "Manrope", sans-serif;
      font-size: 126px;
      font-weight: 900;
      color: #09130d;
      letter-spacing: 2.5px;
      text-transform: uppercase;
      line-height: 1.1;
    }

    /* 3. Registered Office Card */
    .address-card {
      background: #ffffff;
      border: 4px solid #0f3d24;
      box-shadow: 0 15px 45px rgba(15, 61, 36, 0.1);
      padding: 26px 80px;
      border-radius: 26px;
      text-align: center;
      width: 100%;
    }
    .address-prefix {
      font-size: 28px;
      font-weight: 900;
      color: #d97706;
      letter-spacing: 3px;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .address-text {
      font-size: 52px;
      font-weight: 900;
      color: #0f172a;
      line-height: 1.35;
      letter-spacing: 1px;
    }

    /* 4. Statutory Strip */
    .statutory-strip {
      display: grid;
      grid-template-columns: 1.5fr 1.1fr 1.1fr;
      gap: 36px;
      width: 100%;
    }
    .stat-card {
      background: #ffffff;
      border-radius: 22px;
      padding: 24px 30px;
      text-align: center;
      box-shadow: 0 12px 30px rgba(0,0,0,0.06);
    }
    .stat-card.cin {
      border: 4px solid #0284c7;
      background: #f0f9ff;
    }
    .stat-card.pan {
      border: 4px solid #16a34a;
      background: #f0fdf4;
    }
    .stat-card.tan {
      border: 4px solid #d97706;
      background: #fffbeb;
    }
    .stat-card .lbl {
      font-size: 28px;
      font-weight: 900;
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    .stat-card.cin .lbl { color: #0369a1; }
    .stat-card.pan .lbl { color: #15803d; }
    .stat-card.tan .lbl { color: #b45309; }
    .stat-card .val {
      font-size: 48px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: 2px;
      margin-top: 6px;
      font-family: "Space Grotesk", monospace;
    }

    /* 5. Approved Scope & Capabilities Strip */
    .capabilities-strip {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 22px;
      width: 100%;
    }
    .cap-badge {
      background: #ffffff;
      border: 2.5px solid #0f3d24;
      border-radius: 18px;
      padding: 16px 20px;
      text-align: center;
      display: flex;
      align-items: center;
      justifyContent: center;
      gap: 12px;
      box-shadow: 0 8px 20px rgba(0,0,0,0.05);
    }
    .cap-icon {
      font-size: 32px;
    }
    .cap-text {
      font-size: 26px;
      font-weight: 900;
      color: #0f3d24;
      letter-spacing: 0.8px;
      text-transform: uppercase;
    }

    /* 6. Anchored Full-Width Solid Footing Bar */
    .board-footer {
      background: #0f3d24;
      border: 4px solid #d97706;
      border-radius: 22px;
      padding: 24px 50px;
      display: flex;
      align-items: center;
      justifyContent: space-between;
      box-shadow: 0 15px 40px rgba(15, 61, 36, 0.2);
      width: 100%;
    }
    .footer-left {
      display: flex;
      gap: 60px;
      align-items: center;
    }
    .footer-item {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .footer-item .f-lbl {
      color: #fef08a;
      text-transform: uppercase;
      font-size: 28px;
      font-weight: 900;
    }
    .footer-item .f-val {
      color: #ffffff;
      font-weight: 900;
      font-size: 38px;
    }
    .footer-stat-cite {
      font-size: 26px;
      color: #cbd5e1;
      font-weight: 800;
      text-align: right;
      letter-spacing: 1px;
    }
  </style>
</head>
<body>
  <div class="flex-canvas">
    <div class="top-ribbon">Registered Office</div>

    <!-- 1. Header -->
    <div class="board-header">
      <div class="logo-container">
        <img src="${logoB64}" alt="FarmsKing Logo" />
      </div>
      <div class="header-authority">
        <div class="auth-title">Ministry of Corporate Affairs · Govt. of India</div>
        <div class="auth-sub">Incorporated under the Companies Act, 2013 (CRC Manesar)</div>
        <div class="iso-seal">ISO 9001:2015 &amp; ISO 27001 Certified Enterprise</div>
      </div>
    </div>

    <!-- 2. Main Company Legal Name -->
    <div class="company-name-wrap">
      <h1 class="company-name">FARMSKING TECHNOLOGIES PRIVATE LIMITED</h1>
    </div>

    <!-- 3. Statutory Registered Office -->
    <div class="address-card">
      <div class="address-prefix">Statutory Registered Office Address</div>
      <div class="address-text">C/o BALDEV SINGH, VILLAGE BOOH, KAPURTHALA - 144601, PUNJAB, INDIA</div>
    </div>

    <!-- 4. Statutory Codes -->
    <div class="statutory-strip">
      <div class="stat-card cin">
        <div class="lbl">Corporate Identification No. (CIN)</div>
        <div class="val">U62013PB2026PTC070389</div>
      </div>
      <div class="stat-card pan">
        <div class="lbl">Permanent Account No. (PAN)</div>
        <div class="val">AAHCF3566C</div>
      </div>
      <div class="stat-card tan">
        <div class="lbl">Tax Deduction Acct No. (TAN)</div>
        <div class="val">AMRF11527F</div>
      </div>
    </div>

    <!-- 5. Approved MoA Core Platform Capabilities -->
    <div class="capabilities-strip">
      <div class="cap-badge">
        <span class="cap-icon">🌾</span>
        <span class="cap-text">AI Crop Doctor</span>
      </div>
      <div class="cap-badge">
        <span class="cap-icon">📊</span>
        <span class="cap-text">Live Mandi Bhav</span>
      </div>
      <div class="cap-badge">
        <span class="cap-icon">🛒</span>
        <span class="cap-text">Direct Agri-Store</span>
      </div>
      <div class="cap-badge">
        <span class="cap-icon">🛰️</span>
        <span class="cap-text">Field Telemetry</span>
      </div>
    </div>

    <!-- 6. Full-Width Solid Footing Bar -->
    <div class="board-footer">
      <div class="footer-left">
        <div class="footer-item">
          <span class="f-lbl">Phone:</span>
          <span class="f-val">+91 9779650800</span>
        </div>
        <div class="footer-item">
          <span class="f-lbl">eMail:</span>
          <span class="f-val">farmskingindia@gmail.com</span>
        </div>
        <div class="footer-item">
          <span class="f-lbl">Portal:</span>
          <span class="f-val">https://farmsking.in</span>
        </div>
      </div>
      <div class="footer-stat-cite">
        Affixed Pursuant to Section 12(3) &amp; Rule 26 of Companies Act, 2013
      </div>
    </div>
  </div>
</body>
</html>
`;

// Save HTML sources
const govtBase = 'D:/farmsking/Govt/docs/01_Company_Registration_MCA';
const htmlObsidianPath = path.join(govtBase, 'board_executive_obsidian_gold.html');
const htmlWhitePath = path.join(govtBase, 'board_architectural_white_gold.html');

fs.writeFileSync(htmlObsidianPath, htmlObsidian, 'utf8');
fs.writeFileSync(htmlWhitePath, htmlWhite, 'utf8');

// Copy to public folders for browser preview
fs.writeFileSync('D:/farmsking/admin/public/board_executive_obsidian_gold.html', htmlObsidian, 'utf8');
fs.writeFileSync('D:/farmsking/admin/public/board_architectural_white_gold.html', htmlWhite, 'utf8');

const chromeExe = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

// Render Obsidian Gold PNG & PDF
console.log('Rendering 3600x1800 Obsidian Gold Edition (Fully Balanced)...');
const pngObsidianDesktop = 'C:\\Users\\hp\\Desktop\\FARMSKING_PREMIUM_BOARD_OBSIDIAN_GOLD.png';
const pngObsidianGovt = path.join(govtBase, 'FARMSKING_PREMIUM_BOARD_OBSIDIAN_GOLD.png');
const pdfObsidianDesktop = 'C:\\Users\\hp\\Desktop\\FARMSKING_PREMIUM_BOARD_OBSIDIAN_GOLD.pdf';

spawnSync(chromeExe, [
  '--headless',
  '--disable-gpu',
  '--hide-scrollbars',
  '--window-size=3600,1800',
  `--screenshot=${pngObsidianDesktop}`,
  'file:///' + htmlObsidianPath.replace(/\\/g, '/'),
]);
fs.copyFileSync(pngObsidianDesktop, pngObsidianGovt);

spawnSync(chromeExe, [
  '--headless',
  '--disable-gpu',
  '--print-to-pdf-no-header',
  `--print-to-pdf=${pdfObsidianDesktop}`,
  'file:///' + htmlObsidianPath.replace(/\\/g, '/'),
]);

// Render Architectural White PNG & PDF
console.log('Rendering 3600x1800 Architectural White Edition (Fully Balanced)...');
const pngWhiteDesktop = 'C:\\Users\\hp\\Desktop\\FARMSKING_PREMIUM_BOARD_ARCHITECTURAL_WHITE.png';
const pngWhiteGovt = path.join(govtBase, 'FARMSKING_PREMIUM_BOARD_ARCHITECTURAL_WHITE.png');
const pdfWhiteDesktop = 'C:\\Users\\hp\\Desktop\\FARMSKING_PREMIUM_BOARD_ARCHITECTURAL_WHITE.pdf';

spawnSync(chromeExe, [
  '--headless',
  '--disable-gpu',
  '--hide-scrollbars',
  '--window-size=3600,1800',
  `--screenshot=${pngWhiteDesktop}`,
  'file:///' + htmlWhitePath.replace(/\\/g, '/'),
]);
fs.copyFileSync(pngWhiteDesktop, pngWhiteGovt);

spawnSync(chromeExe, [
  '--headless',
  '--disable-gpu',
  '--print-to-pdf-no-header',
  `--print-to-pdf=${pdfWhiteDesktop}`,
  'file:///' + htmlWhitePath.replace(/\\/g, '/'),
]);

console.log('SUCCESS! Both fully balanced editions rendered to Desktop!');
