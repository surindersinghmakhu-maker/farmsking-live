const fs = require('fs');
const path = require('path');

const logoBuf = fs.readFileSync('C:/Users/hp/Desktop/Registed logo.png');
const logoB64 = 'data:image/png;base64,' + logoBuf.toString('base64');

// Copy logo directly next to the html file in Govt docs
const govtDocsDir = 'D:/farmsking/Govt/docs/01_Company_Registration_MCA';
if (!fs.existsSync(govtDocsDir)) fs.mkdirSync(govtDocsDir, { recursive: true });
fs.writeFileSync(path.join(govtDocsDir, 'farmsking_logo.png'), logoBuf);

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>FARMSKING TECHNOLOGIES PRIVATE LIMITED - Statutory Office Flex Board</title>
  <style>
    @import url("https://fonts.googleapis.com/css2?family=Manrope:wght@500;700;800;900&family=Space+Grotesk:wght@600;700;800&display=swap");
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #090e17;
      color: #0f172a;
      font-family: "Manrope", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      padding: 30px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100vh;
    }
    .controls {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justifyContent: center;
      gap: 12px;
      margin-bottom: 24px;
      background: #1e293b;
      padding: 12px 24px;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    }
    .btn {
      background: #10b981;
      color: #ffffff;
      border: none;
      padding: 10px 22px;
      font-size: 14px;
      font-weight: 800;
      border-radius: 8px;
      cursor: pointer;
      transition: 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .btn:hover { background: #059669; }
    .btn-secondary { background: #0284c7; }
    .btn-secondary:hover { background: #0369a1; }
    .spec-tag {
      color: #94a3b8;
      font-size: 12.5px;
      display: flex;
      align-items: center;
      font-weight: 600;
    }

    /* ================= MASTER FLEX BOARD (2:1 Ratio - e.g. 4ft x 2ft / 5ft x 2.5ft / 6ft x 3ft) ================= */
    .flex-canvas {
      width: 100%;
      max-width: 1160px;
      aspect-ratio: 2 / 1;
      background: #ffffff;
      border-radius: 6px;
      box-shadow: 0 25px 60px rgba(0,0,0,0.6);
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justifyContent: space-between;
      padding: 24px 38px 20px 38px;
      border: 14px solid #14532d;
      outline: 5px solid #d97706;
    }

    /* Top Corner Badge */
    .corner-badge {
      position: absolute;
      top: 0;
      right: 0;
      background: linear-gradient(135deg, #15803d, #14532d);
      color: #fef08a;
      padding: 6px 28px;
      font-size: 11.5px;
      font-weight: 800;
      letter-spacing: 1px;
      text-transform: uppercase;
      border-bottom-left-radius: 12px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.18);
    }

    /* Header Row: Logo & MCA Authority */
    .board-header {
      display: flex;
      align-items: center;
      justifyContent: space-between;
      border-bottom: 2.5px solid #e2e8f0;
      padding-bottom: 12px;
    }
    .logo-container img {
      height: 74px;
      width: auto;
      object-fit: contain;
    }
    .mca-badge {
      text-align: right;
    }
    .mca-badge .mca-title {
      font-size: 12px;
      font-weight: 800;
      color: #15803d;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .mca-badge .mca-sub {
      font-size: 10.5px;
      font-weight: 600;
      color: #64748b;
      margin-top: 2px;
    }

    /* Main Company Legal Name */
    .board-body {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justifyContent: center;
      gap: 12px;
      padding: 6px 0;
    }
    .company-name {
      font-family: "Space Grotesk", "Manrope", sans-serif;
      font-size: 35px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      line-height: 1.15;
    }
    .address-box {
      background: #f8fafc;
      border: 2px dashed #94a3b8;
      padding: 10px 24px;
      border-radius: 8px;
      max-width: 95%;
    }
    .address-prefix {
      font-size: 11px;
      font-weight: 800;
      color: #d97706;
      letter-spacing: 1.2px;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .address-text {
      font-size: 16px;
      font-weight: 800;
      color: #1e293b;
      line-height: 1.35;
      letter-spacing: 0.3px;
    }

    /* Statutory Identifiers Strip: CIN, PAN, TAN */
    .statutory-strip {
      display: grid;
      grid-template-columns: 1.6fr 1.1fr 1.1fr;
      gap: 14px;
      width: 100%;
      margin-top: 4px;
    }
    .stat-card {
      border: 2px solid #cbd5e1;
      border-radius: 8px;
      padding: 9px 14px;
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
      font-size: 10.5px;
      font-weight: 800;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      color: #64748b;
    }
    .stat-card.cin .lbl { color: #1d4ed8; }
    .stat-card.pan .lbl { color: #047857; }
    .stat-card.tan .lbl { color: #b45309; }
    .stat-card .val {
      font-size: 14.5px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: 0.6px;
      margin-top: 2px;
      font-family: "Space Grotesk", monospace;
    }

    /* Footer Contacts & Statutory Citation */
    .board-footer {
      border-top: 2.5px solid #e2e8f0;
      padding-top: 10px;
      display: flex;
      align-items: center;
      justifyContent: space-between;
      font-size: 12.5px;
      font-weight: 700;
      color: #334155;
    }
    .footer-left {
      display: flex;
      gap: 22px;
      align-items: center;
    }
    .footer-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .footer-item .f-lbl {
      color: #64748b;
      text-transform: uppercase;
      font-size: 10.5px;
      font-weight: 800;
    }
    .footer-item .f-val {
      color: #0f172a;
      font-weight: 800;
    }
    .footer-stat-cite {
      font-size: 10px;
      color: #94a3b8;
      font-weight: 700;
      text-align: right;
      letter-spacing: 0.4px;
    }

    /* Print Rules for Standard A4 & High-Res Flex Plotters */
    @media print {
      body {
        background: #ffffff;
        padding: 0;
      }
      .controls { display: none; }
      .flex-canvas {
        box-shadow: none;
        max-width: 100%;
        width: 100%;
        border-width: 8px;
      }
      @page {
        size: A4 landscape;
        margin: 10mm;
      }
    }
  </style>
</head>
<body>
  <div class="controls">
    <button class="btn" onclick="window.print()">
      🖨️ Print Flex Board (A4 / Flex Banner)
    </button>
    <button class="btn btn-secondary" onclick="navigator.clipboard.writeText('FARMSKING TECHNOLOGIES PRIVATE LIMITED | CIN: U62013PB2026PTC070389 | PAN: AAHCF3566C | C/o BALDEV SINGH, VILLAGE BOOH, KAPURTHALA - 144601 | Contact: 9779650800 | farmskingindia@gmail.com'); alert('Drafting details copied to clipboard!');">
      📋 Copy CA Drafting Text
    </button>
    <span class="spec-tag">Standard 2:1 Flex Board Ratio (e.g. 4ft × 2ft / 5ft × 2.5ft / 6ft × 3ft) · Section 12(3) Compliant</span>
  </div>

  <!-- MASTER FLEX BOARD CANVAS -->
  <div class="flex-canvas" id="flexBoardCanvas">
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

const outPath = 'D:/farmsking/Govt/docs/01_Company_Registration_MCA/15_OFFICIAL_CORPORATE_FLEX_BOARD_REGISTERED_OFFICE.html';
fs.writeFileSync(outPath, html, 'utf8');
console.log('Flex Board HTML created at:', outPath, fs.statSync(outPath).size, 'bytes');

fs.writeFileSync('D:/farmsking/admin/public/corporate-flex-board.html', html, 'utf8');
fs.writeFileSync('D:/farmsking/frontend/public/corporate-flex-board.html', html, 'utf8');
console.log('Flex Board copied to public web folders for instant previewing!');
