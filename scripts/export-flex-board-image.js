const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const logoBuf = fs.readFileSync('C:/Users/hp/Desktop/Registed logo.png');
const logoB64 = 'data:image/png;base64,' + logoBuf.toString('base64');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>FARMSKING HIGH-RES FLEX BOARD</title>
  <style>
    @import url("https://fonts.googleapis.com/css2?family=Manrope:wght@600;700;800;900&family=Space+Grotesk:wght@700;800;900&display=swap");
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 3600px;
      height: 1800px;
      overflow: hidden;
      background: #ffffff;
      font-family: "Manrope", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }

    .flex-canvas {
      width: 3600px;
      height: 1800px;
      background: #ffffff;
      position: relative;
      display: flex;
      flex-direction: column;
      justifyContent: space-between;
      padding: 70px 100px 60px 100px;
      border: 40px solid #14532d;
      outline: 14px solid #d97706;
      outline-offset: -54px;
    }

    /* Top Corner Badge */
    .corner-badge {
      position: absolute;
      top: 0;
      right: 0;
      background: linear-gradient(135deg, #15803d, #14532d);
      color: #fef08a;
      padding: 16px 80px;
      font-size: 32px;
      font-weight: 800;
      letter-spacing: 2px;
      text-transform: uppercase;
      border-bottom-left-radius: 30px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.25);
    }

    /* Header Row: Logo & MCA Authority */
    .board-header {
      display: flex;
      align-items: center;
      justifyContent: space-between;
      border-bottom: 6px solid #e2e8f0;
      padding-bottom: 36px;
    }
    .logo-container img {
      height: 220px;
      width: auto;
      object-fit: contain;
    }
    .mca-badge {
      text-align: right;
    }
    .mca-badge .mca-title {
      font-size: 36px;
      font-weight: 900;
      color: #15803d;
      letter-spacing: 1.5px;
      text-transform: uppercase;
    }
    .mca-badge .mca-sub {
      font-size: 28px;
      font-weight: 700;
      color: #64748b;
      margin-top: 6px;
    }

    /* Main Company Legal Name */
    .board-body {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justifyContent: center;
      gap: 32px;
      padding: 20px 0;
    }
    .company-name {
      font-family: "Space Grotesk", "Manrope", sans-serif;
      font-size: 104px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: 2px;
      text-transform: uppercase;
      line-height: 1.15;
    }
    .address-box {
      background: #f8fafc;
      border: 5px dashed #94a3b8;
      padding: 26px 80px;
      border-radius: 24px;
      max-width: 95%;
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
      font-size: 46px;
      font-weight: 800;
      color: #1e293b;
      line-height: 1.35;
      letter-spacing: 1px;
    }

    /* Statutory Identifiers Strip: CIN, PAN, TAN */
    .statutory-strip {
      display: grid;
      grid-template-columns: 1.5fr 1.1fr 1.1fr;
      gap: 36px;
      width: 100%;
    }
    .stat-card {
      border: 5px solid #cbd5e1;
      border-radius: 22px;
      padding: 22px 30px;
      text-align: center;
    }
    .stat-card.cin {
      background: #eff6ff;
      border-color: #3b82f6;
    }
    .stat-card.pan {
      background: #f0fdf4;
      border-color: #10b981;
    }
    .stat-card.tan {
      background: #fffbeb;
      border-color: #f59e0b;
    }
    .stat-card .lbl {
      font-size: 26px;
      font-weight: 900;
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    .stat-card.cin .lbl { color: #1d4ed8; }
    .stat-card.pan .lbl { color: #047857; }
    .stat-card.tan .lbl { color: #b45309; }
    .stat-card .val {
      font-size: 44px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: 1.5px;
      margin-top: 6px;
      font-family: "Space Grotesk", monospace;
    }

    /* Footer Contacts & Statutory Citation */
    .board-footer {
      border-top: 6px solid #e2e8f0;
      padding-top: 30px;
      display: flex;
      align-items: center;
      justifyContent: space-between;
      font-size: 34px;
      font-weight: 800;
      color: #334155;
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
      color: #64748b;
      text-transform: uppercase;
      font-size: 26px;
      font-weight: 900;
    }
    .footer-item .f-val {
      color: #0f172a;
      font-weight: 900;
    }
    .footer-stat-cite {
      font-size: 24px;
      color: #94a3b8;
      font-weight: 700;
      text-align: right;
      letter-spacing: 0.8px;
    }
  </style>
</head>
<body>
  <div class="flex-canvas">
    <div class="corner-badge">Govt. Registered Office</div>

    <!-- HEADER: LOGO & STATUTORY COMPLIANCE -->
    <div class="board-header">
      <div class="logo-container">
        <img src="${logoB64}" alt="FarmsKing Logo" />
      </div>
      <div class="mca-badge">
        <div class="mca-title">Ministry of Corporate Affairs · Govt. of India</div>
        <div class="mca-sub">Incorporated under the Companies Act, 2013 (CRC Manesar)</div>
      </div>
    </div>

    <!-- BODY: COMPANY LEGAL NAME & REGISTERED ADDRESS -->
    <div class="board-body">
      <h1 class="company-name">FARMSKING TECHNOLOGIES PRIVATE LIMITED</h1>
      <div class="address-box">
        <div class="address-prefix">Registered Office Address</div>
        <div class="address-text">C/o BALDEV SINGH, VILLAGE BOOH, KAPURTHALA - 144601, PUNJAB, INDIA</div>
      </div>
    </div>

    <!-- STATUTORY CODES: CIN, PAN, TAN -->
    <div class="statutory-strip">
      <div class="stat-card cin">
        <div class="lbl">Corporate Identification No. (CIN)</div>
        <div class="val">U62013PB2026PTC070389</div>
      </div>
      <div class="stat-card pan">
        <div class="lbl">Company PAN</div>
        <div class="val">AAHCF3566C</div>
      </div>
      <div class="stat-card tan">
        <div class="lbl">Company TAN</div>
        <div class="val">AMRF11527F</div>
      </div>
    </div>

    <!-- FOOTER: CONTACTS, EMAIL & SECTION 12(3) COMPLIANCE -->
    <div class="board-footer">
      <div class="footer-left">
        <div class="footer-item">
          <span class="f-lbl">Contact:</span>
          <span class="f-val">+91 9779650800</span>
        </div>
        <div class="footer-item">
          <span class="f-lbl">eMail:</span>
          <span class="f-val">farmskingindia@gmail.com</span>
        </div>
        <div class="footer-item">
          <span class="f-lbl">Web:</span>
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

const tempHtmlPath = path.resolve(__dirname, '../Govt/docs/01_Company_Registration_MCA/flex_board_3600x1800_master.html');
fs.writeFileSync(tempHtmlPath, html, 'utf8');
console.log('Saved 3600x1800 Master HTML:', tempHtmlPath);

const chromeExe = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const desktopPng = 'C:\\Users\\hp\\Desktop\\FARMSKING_OFFICIAL_CORPORATE_FLEX_BOARD_HIGH_RES.png';
const govtDocsPng = 'D:\\farmsking\\Govt\\docs\\01_Company_Registration_MCA\\15_OFFICIAL_CORPORATE_FLEX_BOARD_HIGH_RES.png';
const desktopPdf = 'C:\\Users\\hp\\Desktop\\FARMSKING_OFFICIAL_CORPORATE_FLEX_BOARD_A4_PRINT.pdf';
const govtDocsPdf = 'D:\\farmsking\\Govt\\docs\\01_Company_Registration_MCA\\15_OFFICIAL_CORPORATE_FLEX_BOARD_A4_PRINT.pdf';

const fileUrl = 'file:///' + tempHtmlPath.replace(/\\/g, '/');

console.log('Rendering 3600x1800 Ultra-High-Res PNG via Headless Chrome...');
const pngArgs = [
  '--headless',
  '--disable-gpu',
  '--hide-scrollbars',
  '--window-size=3600,1800',
  `--screenshot=${desktopPng}`,
  fileUrl,
];

const resPng = spawnSync(chromeExe, pngArgs);
if (resPng.error) {
  console.error('PNG Render Error:', resPng.error);
} else {
  console.log('✅ Rendered PNG to Desktop:', desktopPng);
  fs.copyFileSync(desktopPng, govtDocsPng);
  console.log('✅ Copied PNG to Govt Docs:', govtDocsPng);
  const stat = fs.statSync(desktopPng);
  console.log('PNG Size:', (stat.size / 1024).toFixed(1), 'KB');
}

console.log('Rendering Print-Ready Vector PDF via Headless Chrome...');
const pdfArgs = [
  '--headless',
  '--disable-gpu',
  '--print-to-pdf-no-header',
  `--print-to-pdf=${desktopPdf}`,
  fileUrl,
];

const resPdf = spawnSync(chromeExe, pdfArgs);
if (resPdf.error) {
  console.error('PDF Render Error:', resPdf.error);
} else {
  console.log('✅ Rendered PDF to Desktop:', desktopPdf);
  fs.copyFileSync(desktopPdf, govtDocsPdf);
  console.log('✅ Copied PDF to Govt Docs:', govtDocsPdf);
  const statPdf = fs.statSync(desktopPdf);
  console.log('PDF Size:', (statPdf.size / 1024).toFixed(1), 'KB');
}
