const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

// 1. Read the genuine 32-bit RGBA master logo
const trueLogoPath = 'C:/Users/hp/Desktop/Registed logo - Copy.png';
const logoBuf = fs.readFileSync(trueLogoPath);
const logoB64 = 'data:image/png;base64,' + logoBuf.toString('base64');

// Also ensure Desktop 'Registed logo.png' is this exact true file
fs.writeFileSync('C:/Users/hp/Desktop/Registed logo.png', logoBuf);

// 2. TEMPLATE GENERATOR
function getBoardHtml(theme) {
  const isWhite = theme === 'white';

  const bgCanvas = isWhite
    ? 'linear-gradient(180deg, #ffffff 0%, #f8fafc 60%, #f1f5f9 100%)'
    : 'radial-gradient(ellipse at 50% 30%, #0d2e1c 0%, #06190f 50%, #020905 100%)';

  const borderColor = isWhite ? '#0f3d24' : '#d4af37';
  const outlineColor = isWhite ? '#d97706' : '#14532d';

  const titleColor = isWhite ? '#09130d' : '#ffffff';
  const textShadow = isWhite
    ? 'none'
    : '0 4px 25px rgba(0,0,0,0.9), 0 0 50px rgba(245, 158, 11, 0.3)';

  const cardBg = isWhite ? '#ffffff' : 'rgba(15, 23, 42, 0.94)';
  const cardBorder = isWhite ? '3.5px solid #0f3d24' : '3.5px solid #d4af37';
  const cardShadow = isWhite
    ? '0 12px 35px rgba(15, 61, 36, 0.08)'
    : '0 15px 45px rgba(0,0,0,0.7), inset 0 0 35px rgba(212, 175, 55, 0.12)';

  const addrPrefixColor = isWhite ? '#d97706' : '#fbbf24';
  const addrTextColor = isWhite ? '#0f172a' : '#f8fafc';

  const authTitleColor = isWhite ? '#0f3d24' : '#fbbf24';
  const authSubColor = isWhite ? '#475569' : '#94a3b8';
  const isoBg = isWhite ? 'rgba(15, 61, 36, 0.08)' : 'rgba(16, 185, 129, 0.2)';
  const isoBorder = isWhite ? '#0f3d24' : '#10b981';
  const isoText = isWhite ? '#0f3d24' : '#34d399';

  const cinBg = isWhite ? '#f0f9ff' : 'linear-gradient(180deg, rgba(14, 165, 233, 0.2) 0%, rgba(15, 23, 42, 0.98) 100%)';
  const panBg = isWhite ? '#f0fdf4' : 'linear-gradient(180deg, rgba(16, 185, 129, 0.2) 0%, rgba(15, 23, 42, 0.98) 100%)';
  const tanBg = isWhite ? '#fffbeb' : 'linear-gradient(180deg, rgba(245, 158, 11, 0.2) 0%, rgba(15, 23, 42, 0.98) 100%)';

  const cinBorder = isWhite ? '#0284c7' : '#38bdf8';
  const panBorder = isWhite ? '#16a34a' : '#34d399';
  const tanBorder = isWhite ? '#d97706' : '#fbbf24';

  const cinLbl = isWhite ? '#0369a1' : '#38bdf8';
  const panLbl = isWhite ? '#15803d' : '#34d399';
  const tanLbl = isWhite ? '#b45309' : '#fbbf24';
  const valColor = isWhite ? '#0f172a' : '#ffffff';

  const capBg = isWhite ? '#ffffff' : 'rgba(20, 83, 45, 0.4)';
  const capBorder = isWhite ? '2.5px solid #0f3d24' : '2.5px solid rgba(212, 175, 55, 0.6)';
  const capTextColor = isWhite ? '#0f3d24' : '#fef08a';

  const footerBg = isWhite ? '#0f3d24' : 'rgba(10, 20, 15, 0.98)';
  const footerBorder = isWhite ? '4px solid #d97706' : '4px solid #d4af37';
  const footerCiteColor = isWhite ? '#cbd5e1' : '#94a3b8';

  const ribbonBg = isWhite
    ? 'linear-gradient(135deg, #15803d, #0f3d24)'
    : 'linear-gradient(135deg, #d97706, #b45309, #78350f)';
  const ribbonText = isWhite ? '#fef08a' : '#ffffff';
  const ribbonBorder = isWhite ? '#f59e0b' : '#fef08a';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>FARMSKING PREMIUM EXECUTIVE BOARD</title>
  <style>
    @import url("https://fonts.googleapis.com/css2?family=Manrope:wght@600;700;800;900&family=Space+Grotesk:wght@700;800;900&display=swap");
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    html, body {
      width: 3600px;
      height: 1800px;
      overflow: hidden;
      background: ${isWhite ? '#ffffff' : '#020604'};
      font-family: "Manrope", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }

    /* Fixed 3600x1800 Canvas with strict full-height distribution */
    .flex-canvas {
      width: 3600px;
      height: 1800px;
      background: ${bgCanvas};
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 60px 90px 50px 90px;
      border: 38px solid ${borderColor};
      outline: 16px solid ${outlineColor};
      outline-offset: -54px;
      box-shadow: inset 0 0 120px rgba(0,0,0, ${isWhite ? '0.08' : '0.9'});
    }

    /* Top Decorative Ribbon */
    .top-ribbon {
      position: absolute;
      top: 0;
      right: 140px;
      background: ${ribbonBg};
      color: ${ribbonText};
      padding: 14px 64px;
      font-size: 28px;
      font-weight: 900;
      letter-spacing: 2.5px;
      text-transform: uppercase;
      border-bottom-left-radius: 20px;
      border-bottom-right-radius: 20px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      border: 3.5px solid ${ribbonBorder};
      border-top: none;
      z-index: 10;
    }

    /* 1. HEADER ROW (Logo & Ministry Authority) */
    .board-header {
      display: flex;
      align-items: center;
      justifyContent: space-between;
      border-bottom: 5px solid ${isWhite ? '#cbd5e1' : 'rgba(212, 175, 55, 0.45)'};
      padding-bottom: 24px;
      flex-shrink: 0;
    }
    .logo-container {
      background: #ffffff;
      padding: 14px 44px;
      border-radius: 24px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.08);
      border: 3.5px solid ${isWhite ? '#0f3d24' : '#d4af37'};
      display: flex;
      align-items: center;
    }
    .logo-container img {
      height: 190px;
      width: auto;
      object-fit: contain;
      display: block;
    }
    .header-authority {
      text-align: right;
    }
    .auth-title {
      font-size: 40px;
      font-weight: 900;
      color: ${authTitleColor};
      letter-spacing: 1.8px;
      text-transform: uppercase;
    }
    .auth-sub {
      font-size: 30px;
      font-weight: 700;
      color: ${authSubColor};
      margin-top: 6px;
    }
    .iso-seal {
      display: inline-block;
      margin-top: 10px;
      background: ${isoBg};
      border: 2.5px solid ${isoBorder};
      padding: 6px 26px;
      border-radius: 999px;
      color: ${isoText};
      font-size: 24px;
      font-weight: 800;
      letter-spacing: 1px;
    }

    /* 2. MAIN COMPANY LEGAL NAME */
    .company-name-wrap {
      text-align: center;
      padding: 12px 0;
      flex-shrink: 0;
    }
    .company-name {
      font-family: "Space Grotesk", "Manrope", sans-serif;
      font-size: 130px;
      font-weight: 900;
      color: ${titleColor};
      letter-spacing: 3px;
      text-transform: uppercase;
      line-height: 1.1;
      text-shadow: ${textShadow};
    }

    /* 3. STATUTORY REGISTERED OFFICE ADDRESS CARD */
    .address-card {
      background: ${cardBg};
      border: ${cardBorder};
      box-shadow: ${cardShadow};
      padding: 24px 80px;
      border-radius: 24px;
      text-align: center;
      width: 100%;
      flex-shrink: 0;
    }
    .address-prefix {
      font-size: 28px;
      font-weight: 900;
      color: ${addrPrefixColor};
      letter-spacing: 3px;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .address-text {
      font-size: 54px;
      font-weight: 900;
      color: ${addrTextColor};
      line-height: 1.35;
      letter-spacing: 1.2px;
    }

    /* 4. STATUTORY STRIP (CIN, PAN, TAN) */
    .statutory-strip {
      display: grid;
      grid-template-columns: 1.5fr 1.1fr 1.1fr;
      gap: 36px;
      width: 100%;
      flex-shrink: 0;
    }
    .stat-card {
      border-radius: 22px;
      padding: 22px 30px;
      text-align: center;
      box-shadow: 0 12px 30px rgba(0,0,0,0.08);
    }
    .stat-card.cin {
      border: 4px solid ${cinBorder};
      background: ${cinBg};
    }
    .stat-card.pan {
      border: 4px solid ${panBorder};
      background: ${panBg};
    }
    .stat-card.tan {
      border: 4px solid ${tanBorder};
      background: ${tanBg};
    }
    .stat-card .lbl {
      font-size: 28px;
      font-weight: 900;
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    .stat-card.cin .lbl { color: ${cinLbl}; }
    .stat-card.pan .lbl { color: ${panLbl}; }
    .stat-card.tan .lbl { color: ${tanLbl}; }
    .stat-card .val {
      font-size: 48px;
      font-weight: 900;
      color: ${valColor};
      letter-spacing: 2px;
      margin-top: 6px;
      font-family: "Space Grotesk", monospace;
    }

    /* 5. APPROVED MOA CORE CAPABILITIES STRIP */
    .capabilities-strip {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 24px;
      width: 100%;
      flex-shrink: 0;
    }
    .cap-badge {
      background: ${capBg};
      border: ${capBorder};
      border-radius: 20px;
      padding: 16px 20px;
      text-align: center;
      display: flex;
      align-items: center;
      justifyContent: center;
      gap: 14px;
      box-shadow: 0 8px 25px rgba(0,0,0,0.06);
    }
    .cap-icon {
      font-size: 34px;
    }
    .cap-text {
      font-size: 28px;
      font-weight: 900;
      color: ${capTextColor};
      letter-spacing: 1px;
      text-transform: uppercase;
    }

    /* 6. ANCHORED FULL-WIDTH FOOTING BAR */
    .board-footer {
      background: ${footerBg};
      border: ${footerBorder};
      border-radius: 22px;
      padding: 24px 50px;
      display: flex;
      align-items: center;
      justifyContent: space-between;
      box-shadow: 0 15px 45px rgba(0,0,0,0.3);
      width: 100%;
      flex-shrink: 0;
      margin-top: auto; /* Guarantees footer is pinned to the absolute bottom! */
    }
    .footer-left {
      display: flex;
      gap: 55px;
      align-items: center;
      flex: 1;
    }
    .footer-item {
      display: flex;
      align-items: center;
      gap: 12px;
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
      letter-spacing: 0.8px;
    }
    .footer-stat-cite {
      font-size: 24px;
      color: ${footerCiteColor};
      font-weight: 800;
      text-align: right;
      letter-spacing: 1px;
      white-space: nowrap;
      margin-left: 30px;
      padding-left: 30px;
      border-left: 2px solid rgba(255, 255, 255, 0.25);
    }
  </style>
</head>
<body>
  <div class="flex-canvas">
    <div class="top-ribbon">Registered Office</div>

    <!-- 1. Header: Logo & MCA Authority -->
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

    <!-- 3. Statutory Registered Office Address -->
    <div class="address-card">
      <div class="address-prefix">Statutory Registered Office Address</div>
      <div class="address-text">C/o BALDEV SINGH, VILLAGE BOOH, KAPURTHALA - 144601, PUNJAB, INDIA</div>
    </div>

    <!-- 4. Statutory Codes: CIN, PAN, TAN -->
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
}

// 3. Save Master HTML files
const govtBase = 'D:/farmsking/Govt/docs/01_Company_Registration_MCA';
const htmlWhite = getBoardHtml('white');
const htmlObsidian = getBoardHtml('obsidian');

const htmlWhitePath = path.join(govtBase, 'board_architectural_white_gold.html');
const htmlObsidianPath = path.join(govtBase, 'board_executive_obsidian_gold.html');

fs.writeFileSync(htmlWhitePath, htmlWhite, 'utf8');
fs.writeFileSync(htmlObsidianPath, htmlObsidian, 'utf8');

// Copy to admin public for web preview
fs.writeFileSync('D:/farmsking/admin/public/board_architectural_white_gold.html', htmlWhite, 'utf8');
fs.writeFileSync('D:/farmsking/admin/public/board_executive_obsidian_gold.html', htmlObsidian, 'utf8');

// Also update the general master flex board file
fs.writeFileSync('D:/farmsking/Govt/docs/01_Company_Registration_MCA/flex_board_3600x1800_master.html', htmlWhite, 'utf8');

const chromeExe = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

console.log('Rendering Perfect 3600x1800 Architectural White PNG & PDF...');
const pngWhiteDesktop = 'C:\\Users\\hp\\Desktop\\FARMSKING_PREMIUM_BOARD_ARCHITECTURAL_WHITE.png';
const pngWhiteGovt = path.join(govtBase, 'FARMSKING_PREMIUM_BOARD_ARCHITECTURAL_WHITE.png');
const pdfWhiteDesktop = 'C:\\Users\\hp\\Desktop\\FARMSKING_PREMIUM_BOARD_ARCHITECTURAL_WHITE.pdf';
const pdfWhiteGovt = path.join(govtBase, 'FARMSKING_PREMIUM_BOARD_ARCHITECTURAL_WHITE.pdf');

// Also update the file that user had opened previously
const pngOfficialDesktop = 'C:\\Users\\hp\\Desktop\\FARMSKING_OFFICIAL_CORPORATE_FLEX_BOARD_HIGH_RES.png';
const pngOfficialGovt = path.join(govtBase, '15_OFFICIAL_CORPORATE_FLEX_BOARD_HIGH_RES.png');

spawnSync(chromeExe, [
  '--headless',
  '--disable-gpu',
  '--hide-scrollbars',
  '--window-size=3600,1800',
  `--screenshot=${pngWhiteDesktop}`,
  'file:///' + htmlWhitePath.replace(/\\/g, '/'),
]);
fs.copyFileSync(pngWhiteDesktop, pngWhiteGovt);
fs.copyFileSync(pngWhiteDesktop, pngOfficialDesktop);
fs.copyFileSync(pngWhiteDesktop, pngOfficialGovt);

spawnSync(chromeExe, [
  '--headless',
  '--disable-gpu',
  '--print-to-pdf-no-header',
  `--print-to-pdf=${pdfWhiteDesktop}`,
  'file:///' + htmlWhitePath.replace(/\\/g, '/'),
]);
fs.copyFileSync(pdfWhiteDesktop, pdfWhiteGovt);

console.log('Rendering Perfect 3600x1800 Obsidian Gold PNG & PDF...');
const pngObsidianDesktop = 'C:\\Users\\hp\\Desktop\\FARMSKING_PREMIUM_BOARD_OBSIDIAN_GOLD.png';
const pngObsidianGovt = path.join(govtBase, 'FARMSKING_PREMIUM_BOARD_OBSIDIAN_GOLD.png');
const pdfObsidianDesktop = 'C:\\Users\\hp\\Desktop\\FARMSKING_PREMIUM_BOARD_OBSIDIAN_GOLD.pdf';
const pdfObsidianGovt = path.join(govtBase, 'FARMSKING_PREMIUM_BOARD_OBSIDIAN_GOLD.pdf');

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
fs.copyFileSync(pdfObsidianDesktop, pdfObsidianGovt);

console.log('RENDER COMPLETE! Running quality checks...');
