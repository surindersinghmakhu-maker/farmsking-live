const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CHROME_PATH = '"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"';
const DESKTOP_DIR = 'C:\\Users\\hp\\Desktop\\FarmsKing Pvt Ltd';
const OUT_DIR = 'D:\\farmsking\\Govt\\docs\\16_Official_Corporate_Letterhead';

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

// Official Brand Logo (1600x461)
const logoPath = 'D:\\farmsking\\logo\\brand_logo.png';
if (!fs.existsSync(logoPath)) {
  throw new Error('Official brand_logo.png not found at ' + logoPath);
}

const logoBuf = fs.readFileSync(logoPath);
const logoBase64 = `data:image/png;base64,${logoBuf.toString('base64')}`;

const COMMON_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800;900&family=Manrope:wght@400;500;600;700;800&display=swap');

  @page {
    size: A4 portrait;
    margin: 0;
  }

  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  html, body {
    margin: 0;
    padding: 0;
    width: 210mm;
    height: 297mm;
    background: #ffffff;
    font-family: 'Manrope', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: #0f172a;
    -webkit-font-smoothing: antialiased;
  }

  .letterhead-container {
    width: 210mm;
    height: 297mm;
    position: relative;
    padding: 11mm 15mm 11mm 15mm;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background: #ffffff;
    overflow: hidden;
  }

  /* Executive Brand Watermark in Center */
  .watermark {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 150mm;
    height: 48mm;
    opacity: 0.055;
    pointer-events: none;
    z-index: 0;
    background-image: url('${logoBase64}');
    background-repeat: no-repeat;
    background-position: center;
    background-size: contain;
  }

  /* Top Perimeter Accent Line */
  .top-accent-bar {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4mm;
    background: linear-gradient(90deg, #022c22 0%, #064e3b 45%, #d97706 75%, #b45309 100%);
  }

  /* Bottom Perimeter Accent Line */
  .bottom-accent-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3.5mm;
    background: linear-gradient(90deg, #b45309 0%, #d97706 30%, #064e3b 60%, #022c22 100%);
  }

  /* Header Section */
  .header {
    position: relative;
    z-index: 10;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 5mm;
    border-bottom: 2px solid #0f766e;
    margin-top: 1.5mm;
  }

  .header-left {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .brand-logo-img {
    width: 62mm;
    height: auto;
    max-height: 19mm;
    object-fit: contain;
    display: block;
  }

  .company-reg-sub {
    font-size: 7.2pt;
    font-weight: 700;
    color: #0f766e;
    margin-top: 3.5px;
    letter-spacing: 0.4px;
    text-transform: uppercase;
  }

  .header-right {
    text-align: right;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
  }

  .statutory-pill {
    background: #042f2e;
    color: #f59e0b;
    font-size: 7.2pt;
    font-weight: 800;
    padding: 3px 9px;
    border-radius: 3px;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    margin-bottom: 3px;
    display: inline-block;
  }

  .statutory-line {
    font-size: 7.4pt;
    color: #334155;
    font-weight: 600;
    line-height: 1.35;
  }

  .statutory-line strong {
    color: #042f2e;
    font-weight: 700;
  }

  /* Reference & Date Bar */
  .meta-bar {
    position: relative;
    z-index: 10;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 3mm 0;
    border-bottom: 1px dashed #cbd5e1;
    font-size: 8.8pt;
    font-weight: 600;
    color: #475569;
  }

  .meta-ref {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .meta-date {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  /* Main Document Canvas */
  .content-area {
    position: relative;
    z-index: 10;
    flex: 1;
    padding: 7mm 0;
    font-size: 9.8pt;
    line-height: 1.6;
    color: #1e293b;
  }

  /* Footer Section */
  .footer {
    position: relative;
    z-index: 10;
    border-top: 1.5px solid #0f766e;
    padding-top: 4mm;
    margin-bottom: 1.5mm;
  }

  .footer-grid {
    display: grid;
    grid-template-columns: 1.7fr 1.3fr 1fr;
    gap: 10px;
    align-items: center;
  }

  .footer-col {
    font-size: 7.2pt;
    color: #475569;
    line-height: 1.4;
  }

  .footer-col strong {
    color: #042f2e;
    font-weight: 700;
  }

  .footer-contact-link {
    color: #0f766e;
    text-decoration: none;
    font-weight: 700;
  }

  .footer-cert-badges {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 3px;
    text-align: right;
  }

  .badge-chip {
    background: #f1f5f9;
    border: 1px solid #cbd5e1;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 6.8pt;
    font-weight: 700;
    color: #0f766e;
    letter-spacing: 0.3px;
  }

  .footer-statutory-strip {
    margin-top: 3mm;
    padding-top: 2mm;
    border-top: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 6.8pt;
    color: #64748b;
    font-weight: 500;
  }
`;

// 1. BLANK LETTERHEAD HTML
const blankHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>FARMSKING TECHNOLOGIES PRIVATE LIMITED - Official Letterhead</title>
  <style>
    ${COMMON_CSS}
  </style>
</head>
<body>
  <div class="letterhead-container">
    <div class="top-accent-bar"></div>
    <div class="watermark"></div>

    <div>
      <!-- Corporate Header with Official Brand Logo -->
      <header class="header">
        <div class="header-left">
          <img src="${logoBase64}" class="brand-logo-img" alt="FarmsKing Official Brand Logo" />
          <div class="company-reg-sub">FARMSKING TECHNOLOGIES PRIVATE LIMITED &bull; INCORPORATED UNDER COMPANIES ACT, 2013</div>
        </div>

        <div class="header-right">
          <div class="statutory-pill">Statutory Entity Profile</div>
          <div class="statutory-line"><strong>CIN:</strong> U62013PB2026PTC070389</div>
          <div class="statutory-line"><strong>PAN:</strong> AAHCF3566C &bull; <strong>TAN:</strong> AMRF11527F</div>
          <div class="statutory-line"><strong>MSME Udyam:</strong> UDYAM-PB-11-0056001</div>
          <div class="statutory-line"><strong>DPIIT Recognized</strong> AgriTech Startup</div>
        </div>
      </header>

      <!-- Reference & Date Line -->
      <div class="meta-bar">
        <div class="meta-ref">
          <span>Ref. No.:</span>
          <span style="border-bottom: 1px solid #94a3b8; display: inline-block; min-width: 55mm; color: #0f172a; font-family: monospace;">&nbsp;</span>
        </div>
        <div class="meta-date">
          <span>Date:</span>
          <span style="border-bottom: 1px solid #94a3b8; display: inline-block; min-width: 35mm; color: #0f172a; font-family: monospace;">&nbsp;</span>
        </div>
      </div>
    </div>

    <!-- Blank Body Writing Canvas -->
    <main class="content-area">
      <!-- Leave blank for typing or physical printout -->
    </main>

    <!-- Executive Corporate Footer -->
    <footer class="footer">
      <div class="footer-grid">
        <div class="footer-col">
          <strong>Registered Office:</strong><br>
          C/o BALDEV SINGH, VILLAGE BOOH, Kapurthala,<br>
          Kapurthala - 144601, Punjab, India<br>
          <span style="color: #64748b; font-size: 6.8pt;">Corporate Office: Near Grain Market, Makhu, Ferozepur - 142044</span>
        </div>

        <div class="footer-col">
          <strong>Digital Links & Contact:</strong><br>
          Helpline: <strong>+91 95776-22000</strong> &bull; +91 98720-66901<br>
          Email: <span class="footer-contact-link">contact@farmsking.in</span><br>
          Web: <span class="footer-contact-link">https://farmsking.in</span>
        </div>

        <div class="footer-cert-badges">
          <div class="badge-chip">ISO 9001:2015 QUALITY CERTIFIED</div>
          <div class="badge-chip">ISO 27001:2022 DATA SECURITY</div>
          <div class="badge-chip">ICAR ALIGNED AGRONOMY PROTOCOL</div>
        </div>
      </div>

      <div class="footer-statutory-strip">
        <div>&bull; Smart Farming &bull; AI Crop Doctor &bull; APMC Live Mandi &bull; Digital Bahi-Khata</div>
        <div>Statutory Document &bull; Confirmed & Authorized by FarmsKing Technologies Private Limited</div>
      </div>
    </footer>

    <div class="bottom-accent-bar"></div>
  </div>
</body>
</html>`;

// 2. SAMPLE EXECUTIVE LETTER
const sampleHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Sample Official Letter - FarmsKing Technologies</title>
  <style>
    ${COMMON_CSS}
  </style>
</head>
<body>
  <div class="letterhead-container">
    <div class="top-accent-bar"></div>
    <div class="watermark"></div>

    <div>
      <!-- Corporate Header with Official Brand Logo -->
      <header class="header">
        <div class="header-left">
          <img src="${logoBase64}" class="brand-logo-img" alt="FarmsKing Official Brand Logo" />
          <div class="company-reg-sub">FARMSKING TECHNOLOGIES PRIVATE LIMITED &bull; INCORPORATED UNDER COMPANIES ACT, 2013</div>
        </div>

        <div class="header-right">
          <div class="statutory-pill">Statutory Entity Profile</div>
          <div class="statutory-line"><strong>CIN:</strong> U62013PB2026PTC070389</div>
          <div class="statutory-line"><strong>PAN:</strong> AAHCF3566C &bull; <strong>TAN:</strong> AMRF11527F</div>
          <div class="statutory-line"><strong>MSME Udyam:</strong> UDYAM-PB-11-0056001</div>
          <div class="statutory-line"><strong>DPIIT Recognized</strong> AgriTech Startup</div>
        </div>
      </header>

      <!-- Reference & Date Line -->
      <div class="meta-bar">
        <div class="meta-ref">
          <span>Ref. No.:</span>
          <span style="color: #042f2e; font-family: monospace; font-weight: 700;">FKIPL/CORP/2026/AUTH-08</span>
        </div>
        <div class="meta-date">
          <span>Date:</span>
          <span style="color: #042f2e; font-family: monospace; font-weight: 700;">21st November 2026</span>
        </div>
      </div>
    </div>

    <!-- Official Content Area -->
    <main class="content-area">
      <div style="margin-bottom: 5mm;">
        <strong>To,</strong><br>
        <strong>The Competent Authority / Portal Administrator,</strong><br>
        National Single Window System (NSWS) / Startup India (DPIIT),<br>
        Department for Promotion of Industry and Internal Trade,<br>
        Ministry of Commerce and Industry, Government of India.
      </div>

      <div style="margin-bottom: 4mm; font-weight: 800; color: #042f2e; text-decoration: underline;">
        SUBJECT: OFFICIAL INSTITUTIONAL PROFILE AND STATUTORY ACCREDITATION OF FARMSKING TECHNOLOGIES PRIVATE LIMITED.
      </div>

      <p style="margin-bottom: 3.5mm; text-align: justify;">
        Dear Sir / Madam,
      </p>

      <p style="margin-bottom: 3.5mm; text-align: justify;">
        We hereby formally introduce <strong>FARMSKING TECHNOLOGIES PRIVATE LIMITED</strong> (CIN: <strong>U62013PB2026PTC070389</strong>), an Indian Agri-Tech enterprise incorporated under the Companies Act, 2013 on <strong>18th November 2026</strong> and registered under MSME Udyam (<strong>UDYAM-PB-11-0056001</strong>). Guided by our corporate mission <em>"Smart Farming"</em>, the company operates a unified digital agriculture operating system tailored for North Indian agricultural ecosystems.
      </p>

      <p style="margin-bottom: 3.5mm; text-align: justify;">
        The platform delivers instant <strong>AI Crop Doctor</strong> plant pathology diagnosis, professional agronomist consultation frameworks, live APMC commodity pricing telemetry across regional mandis, and an integrated digital farm accounting ledger (Bahi-Khata) for cultivation cost auditing.
      </p>

      <p style="margin-bottom: 5mm; text-align: justify;">
        This communication confirms that <strong>Ms. GAGANDEEP KAUR</strong> (Director, DIN: <strong>11342798</strong>) is the duly authorized representative and signatory empowered to execute, authenticate, and submit all filings, statutory applications, and representations on the National Single Window System and related government portals on behalf of the company.
      </p>

      <div style="margin-top: 8mm; display: flex; justify-content: space-between; align-items: flex-end;">
        <div>
          <div style="font-size: 8.5pt; color: #475569; margin-bottom: 2mm;">For and on behalf of the Board of Directors</div>
          <div style="font-size: 10pt; font-weight: 800; color: #042f2e;">FARMSKING TECHNOLOGIES PRIVATE LIMITED</div>
          <div style="height: 18mm; display: flex; align-items: flex-end;">
            <div style="border-bottom: 1px solid #0f172a; width: 60mm; padding-bottom: 1mm; font-size: 8.5pt; font-weight: 700;">
              Authorized Signatory / Director
            </div>
          </div>
          <div style="font-size: 8pt; color: #475569; margin-top: 1mm;">
            Name: <strong>GAGANDEEP KAUR</strong> &bull; DIN: 11342798
          </div>
        </div>

        <div style="text-align: center; border: 1.5px dashed #94a3b8; padding: 4mm 8mm; border-radius: 4px; background: #fafafa;">
          <div style="font-size: 7.5pt; color: #64748b; font-weight: 700; text-transform: uppercase;">Affix Official</div>
          <div style="font-size: 9pt; font-weight: 800; color: #0f766e;">COMPANY SEAL</div>
          <div style="font-size: 7pt; color: #94a3b8;">Round Embossed</div>
        </div>
      </div>
    </main>

    <!-- Executive Corporate Footer -->
    <footer class="footer">
      <div class="footer-grid">
        <div class="footer-col">
          <strong>Registered Office:</strong><br>
          C/o BALDEV SINGH, VILLAGE BOOH, Kapurthala,<br>
          Kapurthala - 144601, Punjab, India<br>
          <span style="color: #64748b; font-size: 6.8pt;">Corporate Office: Near Grain Market, Makhu, Ferozepur - 142044</span>
        </div>

        <div class="footer-col">
          <strong>Digital Links & Contact:</strong><br>
          Helpline: <strong>+91 95776-22000</strong> &bull; +91 98720-66901<br>
          Email: <span class="footer-contact-link">contact@farmsking.in</span><br>
          Web: <span class="footer-contact-link">https://farmsking.in</span>
        </div>

        <div class="footer-cert-badges">
          <div class="badge-chip">ISO 9001:2015 QUALITY CERTIFIED</div>
          <div class="badge-chip">ISO 27001:2022 DATA SECURITY</div>
          <div class="badge-chip">ICAR ALIGNED AGRONOMY PROTOCOL</div>
        </div>
      </div>

      <div class="footer-statutory-strip">
        <div>&bull; Smart Farming &bull; AI Crop Doctor &bull; APMC Live Mandi &bull; Digital Bahi-Khata</div>
        <div>Statutory Document &bull; Confirmed & Authorized by FarmsKing Technologies Private Limited</div>
      </div>
    </footer>

    <div class="bottom-accent-bar"></div>
  </div>
</body>
</html>`;

const blankHtmlPath = path.join(OUT_DIR, '01_FARMSKING_OFFICIAL_LETTERHEAD_BLANK.html');
const blankPdfPath = path.join(OUT_DIR, '01_FARMSKING_OFFICIAL_LETTERHEAD_BLANK.pdf');
const sampleHtmlPath = path.join(OUT_DIR, '02_FARMSKING_OFFICIAL_LETTERHEAD_SAMPLE.html');
const samplePdfPath = path.join(OUT_DIR, '02_FARMSKING_OFFICIAL_LETTERHEAD_SAMPLE.pdf');

fs.writeFileSync(blankHtmlPath, blankHtml, 'utf8');
fs.writeFileSync(sampleHtmlPath, sampleHtml, 'utf8');
console.log('[OK] HTML files created successfully with official Brand Logo.');

try {
  // Render Blank Letterhead
  const cmd1 = `${CHROME_PATH} --headless=new --disable-gpu --no-pdf-header-footer --print-to-pdf="${blankPdfPath}" "${blankHtmlPath}"`;
  execSync(cmd1, { stdio: 'inherit' });
  console.log('[OK] Blank Letterhead PDF Generated:', blankPdfPath);

  // Render Sample Letterhead
  const cmd2 = `${CHROME_PATH} --headless=new --disable-gpu --no-pdf-header-footer --print-to-pdf="${samplePdfPath}" "${sampleHtmlPath}"`;
  execSync(cmd2, { stdio: 'inherit' });
  console.log('[OK] Sample Letterhead PDF Generated:', samplePdfPath);

  // Sync to Desktop Folder
  if (fs.existsSync(DESKTOP_DIR)) {
    fs.copyFileSync(blankPdfPath, path.join(DESKTOP_DIR, '01_FARMSKING_OFFICIAL_LETTERHEAD_BLANK.pdf'));
    fs.copyFileSync(blankHtmlPath, path.join(DESKTOP_DIR, '01_FARMSKING_OFFICIAL_LETTERHEAD_BLANK.html'));
    fs.copyFileSync(samplePdfPath, path.join(DESKTOP_DIR, '02_FARMSKING_OFFICIAL_LETTERHEAD_SAMPLE.pdf'));
    fs.copyFileSync(sampleHtmlPath, path.join(DESKTOP_DIR, '02_FARMSKING_OFFICIAL_LETTERHEAD_SAMPLE.html'));
    console.log('[OK] Synced all updated letterhead files to Desktop Folder:', DESKTOP_DIR);
  }
} catch (err) {
  console.error('[FAIL] PDF rendering failed:', err.message);
}
