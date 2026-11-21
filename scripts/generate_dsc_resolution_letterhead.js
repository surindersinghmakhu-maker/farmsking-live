const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  VerticalAlign,
  Header,
  Footer,
  ImageRun,
} = require('docx');

const CHROME_PATH = '"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"';
const DESKTOP_DIR = 'C:\\Users\\hp\\Desktop\\FarmsKing Pvt Ltd';
const OUT_DIR = 'D:\\farmsking\\Govt\\docs\\16_Official_Corporate_Letterhead';

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

// Official Brand Logo (1600x461)
const logoPath = 'D:\\farmsking\\logo\\brand_logo.png';
const logoBuf = fs.readFileSync(logoPath);
const logoBase64 = `data:image/png;base64,${logoBuf.toString('base64')}`;

// Real Extracted Signatures
const signDir = 'D:\\farmsking\\Govt\\docs\\00_Directors_Official_Signatures';
const gkSignPath = path.join(signDir, 'gagandeep_kaur_signature.png');
const bsSignPath = path.join(signDir, 'bakhshish_singh_signature.png');

const gkSignBuf = fs.readFileSync(gkSignPath);
const bsSignBuf = fs.readFileSync(bsSignPath);

const gkSignBase64 = `data:image/png;base64,${gkSignBuf.toString('base64')}`;
const bsSignBase64 = `data:image/png;base64,${bsSignBuf.toString('base64')}`;

// 1. GENERATE HTML & PDF ON OFFICIAL LETTERHEAD WITH REAL SIGNATURES
const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Board Resolution - Organization DSC - Ms. Gagandeep Kaur - FarmsKing</title>
  <style>
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
      padding: 10mm 15mm 10mm 15mm;
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
      opacity: 0.05;
      pointer-events: none;
      z-index: 0;
      background-image: url('${logoBase64}');
      background-repeat: no-repeat;
      background-position: center;
      background-size: contain;
    }

    .top-accent-bar {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4mm;
      background: linear-gradient(90deg, #022c22 0%, #064e3b 45%, #d97706 75%, #b45309 100%);
    }

    .bottom-accent-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 3.5mm;
      background: linear-gradient(90deg, #b45309 0%, #d97706 30%, #064e3b 60%, #022c22 100%);
    }

    /* Header */
    .header {
      position: relative;
      z-index: 10;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 4.5mm;
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
      max-height: 18.5mm;
      object-fit: contain;
      display: block;
    }

    .company-reg-sub {
      font-size: 7.2pt;
      font-weight: 700;
      color: #0f766e;
      margin-top: 3px;
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

    /* Meta bar */
    .meta-bar {
      position: relative;
      z-index: 10;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 2.5mm 0;
      border-bottom: 1px dashed #cbd5e1;
      font-size: 8.5pt;
      font-weight: 600;
      color: #475569;
    }

    /* Document Body */
    .content-area {
      position: relative;
      z-index: 10;
      flex: 1;
      padding: 4mm 0;
      font-size: 8.8pt;
      line-height: 1.48;
      color: #1e293b;
    }

    .resolution-banner {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-left: 4px solid #0f766e;
      padding: 6px 10px;
      margin-bottom: 7px;
    }

    .res-title {
      font-size: 9.2pt;
      font-weight: 800;
      color: #042f2e;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      margin: 0 0 2px 0;
    }

    .res-sub {
      font-size: 7.5pt;
      color: #475569;
      font-weight: 600;
      margin: 0;
    }

    .meeting-meta-box {
      background: #f1f5f9;
      padding: 5px 9px;
      border-radius: 4px;
      font-size: 7.8pt;
      color: #334155;
      margin-bottom: 8px;
      line-height: 1.4;
    }

    .res-quote {
      background: #fafafa;
      border-left: 3px solid #0f766e;
      padding: 5px 9px;
      margin: 5px 0;
      font-size: 8.4pt;
      line-height: 1.42;
      text-align: justify;
    }

    .res-quote strong {
      color: #042f2e;
    }

    /* Specimen table */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.2pt;
      margin: 7px 0;
    }

    th {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 4px 8px;
      text-align: left;
      font-weight: 700;
      color: #1e293b;
    }

    td {
      border: 1px solid #cbd5e1;
      padding: 4px 8px;
      color: #334155;
    }

    .specimen-sign-box {
      height: 34px;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      padding-left: 4px;
    }

    .real-sign-img {
      height: 32px;
      width: auto;
      object-fit: contain;
      filter: contrast(1.15);
    }

    /* Sign section */
    .sign-section {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px dashed #cbd5e1;
      page-break-inside: avoid;
    }

    .sign-row {
      display: flex;
      justify-content: space-between;
      margin-top: 6px;
    }

    .sign-col {
      width: 44%;
    }

    .sign-img-wrap {
      height: 34px;
      display: flex;
      align-items: flex-end;
      padding-left: 2px;
    }

    .sign-line {
      border-top: 1px solid #0f172a;
      padding-top: 3px;
    }

    .sign-name {
      font-weight: 800;
      font-size: 9pt;
      color: #0f172a;
    }

    .sign-desig {
      font-size: 7.6pt;
      color: #475569;
      font-weight: 600;
    }

    /* Footer */
    .footer {
      position: relative;
      z-index: 10;
      border-top: 1.5px solid #0f766e;
      padding-top: 3.5mm;
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
      gap: 2px;
      text-align: right;
    }

    .badge-chip {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 1.5px 5px;
      border-radius: 3px;
      font-size: 6.8pt;
      font-weight: 700;
      color: #0f766e;
      letter-spacing: 0.3px;
    }

    .footer-statutory-strip {
      margin-top: 2.5mm;
      padding-top: 2mm;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 6.8pt;
      color: #64748b;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="letterhead-container">
    <div class="top-accent-bar"></div>
    <div class="watermark"></div>

    <div>
      <!-- Header -->
      <header class="header">
        <div class="header-left">
          <img src="${logoBase64}" class="brand-logo-img" alt="FarmsKing Brand Logo" />
          <div class="company-reg-sub">FARMSKING TECHNOLOGIES PRIVATE LIMITED &bull; INCORPORATED UNDER COMPANIES ACT, 2013</div>
        </div>

        <div class="header-right">
          <div class="statutory-pill">Board Resolution</div>
          <div class="statutory-line"><strong>CIN:</strong> U62013PB2026PTC070389</div>
          <div class="statutory-line"><strong>PAN:</strong> AAHCF3566C &bull; <strong>TAN:</strong> AMRF11527F</div>
          <div class="statutory-line"><strong>MSME Udyam:</strong> UDYAM-PB-11-0056001</div>
          <div class="statutory-line"><strong>DPIIT Recognized</strong> AgriTech Startup</div>
        </div>
      </header>

      <!-- Meta Bar -->
      <div class="meta-bar">
        <div>
          <span>Ref. No.:</span>
          <strong style="color: #042f2e; font-family: monospace;">FKIPL/CORP/2026/BR-DSC-01</strong>
        </div>
        <div>
          <span>Date:</span>
          <strong style="color: #042f2e; font-family: monospace;">21st November 2026</strong>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <main class="content-area">
      <div class="resolution-banner">
        <div class="res-title">Certified True Copy of the Board Resolution Passed by the Board of Directors</div>
        <div class="res-sub">Passed at the Meeting of the Board of Directors of FarmsKing Technologies Private Limited held on Saturday, 21st November 2026</div>
      </div>

      <div class="meeting-meta-box">
        <strong>Venue of Meeting:</strong> Registered Office: C/o BALDEV SINGH, VILLAGE BOOH, Kapurthala, Punjab - 144601, India<br>
        <strong>Directors Present:</strong> 1. Mr. BAKHSHISH SINGH (Director & Chairman, DIN: 11342797) &nbsp;&bull;&nbsp; 2. Ms. GAGANDEEP KAUR (Director, DIN: 11342798)
      </div>

      <p style="font-weight: 800; color: #042f2e; text-transform: uppercase; font-size: 8.6pt; margin: 0 0 5px 0;">
        SUBJECT: AUTHORIZATION TO APPLY FOR AND OBTAIN CLASS-3 ORGANIZATION DIGITAL SIGNATURE CERTIFICATE (DSC) IN THE NAME OF MS. GAGANDEEP KAUR (DIRECTOR) ON BEHALF OF THE COMPANY.
      </p>

      <div class="res-quote">
        <strong>"RESOLVED THAT</strong> the consent of the Board of Directors of the Company be and is hereby accorded to apply for and obtain a <strong>Class-3 Organization / Corporate Digital Signature Certificate (Combo: Signing & Encryption)</strong> in the name of <strong>Ms. GAGANDEEP KAUR</strong> (Director, DIN: <strong>11342798</strong>, PAN: <strong>JQOPK2470K</strong>) on behalf of the Company, <strong>FARMSKING TECHNOLOGIES PRIVATE LIMITED</strong> (PAN: <strong>AAHCF3566C</strong>, CIN: <strong>U62013PB2026PTC070389</strong>), from any licensed Certifying Authority (such as eMudhra, Capricorn, VSign, PantaSign, Sify, or any other CCA-accredited Certifying Authority)."
      </div>

      <div class="res-quote">
        <strong>"RESOLVED FURTHER THAT</strong> <strong>Ms. GAGANDEEP KAUR</strong>, Director of the Company, be and is hereby designated as the <strong>PRINCIPAL AUTHORIZED SIGNATORY</strong> of the Company for the <strong>National Single Window System (NSWS)</strong> portal, <strong>Startup India (DPIIT Recognition)</strong>, Ministry of Corporate Affairs (MCA), Goods and Services Tax (GST), Income Tax Department, and all other regulatory and statutory e-governance authorities."
      </div>

      <div class="res-quote">
        <strong>"RESOLVED FURTHER THAT</strong> <strong>Ms. GAGANDEEP KAUR</strong> be and is hereby authorized to digitally sign, authenticate, execute, verify, submit, and upload all statutory forms, investor profiles, pitch decks, declarations, undertakings, and documents required on the National Single Window System (NSWS) and Startup India portals on behalf of the Company."
      </div>

      <div class="res-quote">
        <strong>"RESOLVED FURTHER THAT</strong> <strong>Mr. BAKHSHISH SINGH</strong> (Director & Chairman, DIN: <strong>11342797</strong>) be and is hereby authorized to sign this resolution as a Certified True Copy, furnish attested copies to the Certifying Authority, Chartered Accountant, or government departments, and do all such acts, deeds, and things as may be necessary to give full effect to these resolutions."
      </div>

      <!-- Specimen Signature Table with Real Original Signature -->
      <table>
        <thead>
          <tr>
            <th style="width: 30%;">Name of Authorized Signatory</th>
            <th style="width: 18%;">Designation</th>
            <th style="width: 18%;">DIN & PAN</th>
            <th style="width: 34%;">Specimen Signature</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Ms. GAGANDEEP KAUR</strong></td>
            <td>Director</td>
            <td>DIN: 11342798<br>PAN: JQOPK2470K</td>
            <td>
              <div class="specimen-sign-box">
                <img src="${gkSignBase64}" class="real-sign-img" style="height: 30px;" alt="Original Specimen Signature - Gagandeep Kaur" />
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Signatures with Real Original Signatures for Both Directors -->
      <div class="sign-section">
        <div style="font-size: 8.2pt; font-weight: 800; color: #042f2e;">
          // CERTIFIED TRUE COPY // &nbsp;&bull;&nbsp; For and on behalf of the Board of Directors of
          <span style="color: #0f766e;">FARMSKING TECHNOLOGIES PRIVATE LIMITED</span>
        </div>

        <div class="sign-row">
          <div class="sign-col">
            <div class="sign-img-wrap">
              <img src="${bsSignBase64}" class="real-sign-img" style="height: 32px;" alt="Signature - Bakhshish Singh" />
            </div>
            <div class="sign-line">
              <div class="sign-name">BAKHSHISH SINGH</div>
              <div class="sign-desig">Director & Chairman<br>DIN: 11342797</div>
            </div>
          </div>

          <div class="sign-col">
            <div class="sign-img-wrap">
              <img src="${gkSignBase64}" class="real-sign-img" style="height: 32px;" alt="Signature - Gagandeep Kaur" />
            </div>
            <div class="sign-line">
              <div class="sign-name">GAGANDEEP KAUR</div>
              <div class="sign-desig">Director & Authorized Signatory<br>DIN: 11342798</div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
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

const outHtmlPath = path.join(OUT_DIR, '05_BOARD_RESOLUTION_ORGANIZATION_DSC_GAGANDEEP_KAUR.html');
const outPdfPath = path.join(OUT_DIR, '05_BOARD_RESOLUTION_ORGANIZATION_DSC_GAGANDEEP_KAUR.pdf');

fs.writeFileSync(outHtmlPath, htmlContent, 'utf8');
console.log('[OK] Resolution HTML Written with Real Signatures:', outHtmlPath);

try {
  const cmd = `${CHROME_PATH} --headless=new --disable-gpu --no-pdf-header-footer --print-to-pdf="${outPdfPath}" "${outHtmlPath}"`;
  execSync(cmd, { stdio: 'inherit' });
  console.log('[OK] Signed Resolution PDF Generated successfully with Real Signatures:', outPdfPath);

  if (fs.existsSync(DESKTOP_DIR)) {
    fs.copyFileSync(outPdfPath, path.join(DESKTOP_DIR, '05_BOARD_RESOLUTION_ORGANIZATION_DSC_GAGANDEEP_KAUR.pdf'));
    fs.copyFileSync(outHtmlPath, path.join(DESKTOP_DIR, '05_BOARD_RESOLUTION_ORGANIZATION_DSC_GAGANDEEP_KAUR.html'));
    console.log('[OK] Signed Resolution PDF & HTML synced to Desktop Folder:', DESKTOP_DIR);
  }
} catch (err) {
  console.error('[FAIL] Chrome PDF rendering failed:', err.message);
}

// 2. GENERATE WORD (.docx) VERSION WITH REAL SIGNATURE IMAGES
const PRIMARY_GREEN = '042F2E';
const EMERALD = '0F766E';
const GOLD = 'B45309';
const DARK_SLATE = '0F172A';
const SUB_TEXT = '475569';

function createNoBorder() {
  return {
    top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  };
}

const headerCells = [
  new TableCell({
    borders: createNoBorder(),
    width: { size: 60, type: WidthType.PERCENTAGE },
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({
        children: [
          new ImageRun({
            data: logoBuf,
            transformation: {
              width: 200,
              height: 58,
            },
          }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: 'FARMSKING TECHNOLOGIES PRIVATE LIMITED',
            bold: true,
            size: 15,
            color: PRIMARY_GREEN,
            font: 'Georgia',
          }),
        ],
        spacing: { before: 40 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: 'SMART FARMING ',
            bold: true,
            size: 13,
            color: GOLD,
            font: 'Arial',
          }),
          new TextRun({
            text: '• Inc. under Companies Act, 2013',
            size: 13,
            color: SUB_TEXT,
            font: 'Arial',
          }),
        ],
      }),
    ],
  }),
  new TableCell({
    borders: createNoBorder(),
    width: { size: 40, type: WidthType.PERCENTAGE },
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({
            text: 'BOARD RESOLUTION',
            bold: true,
            size: 16,
            color: GOLD,
            font: 'Arial',
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({
            text: 'CIN: U62013PB2026PTC070389',
            bold: true,
            size: 14,
            color: DARK_SLATE,
            font: 'Arial',
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({
            text: 'PAN: AAHCF3566C | TAN: AMRF11527F',
            size: 13,
            color: SUB_TEXT,
            font: 'Arial',
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({
            text: 'MSME Udyam: UDYAM-PB-11-0056001',
            size: 13,
            bold: true,
            color: EMERALD,
            font: 'Arial',
          }),
        ],
      }),
    ],
  }),
];

const headerTable = new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  borders: {
    top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    bottom: { style: BorderStyle.SINGLE, size: 16, color: EMERALD },
  },
  rows: [
    new TableRow({
      children: headerCells,
    }),
  ],
});

const footerTable = new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  borders: {
    top: { style: BorderStyle.SINGLE, size: 12, color: EMERALD },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  },
  rows: [
    new TableRow({
      children: [
        new TableCell({
          borders: createNoBorder(),
          width: { size: 55, type: WidthType.PERCENTAGE },
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Regd. Office: ',
                  bold: true,
                  size: 13,
                  color: PRIMARY_GREEN,
                }),
                new TextRun({
                  text: 'C/o BALDEV SINGH, VILLAGE BOOH, Kapurthala - 144601, Punjab',
                  size: 13,
                  color: SUB_TEXT,
                }),
              ],
            }),
          ],
        }),
        new TableCell({
          borders: createNoBorder(),
          width: { size: 45, type: WidthType.PERCENTAGE },
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({
                  text: 'Helpline: +91 95776-22000 | Email: contact@farmsking.in',
                  size: 13,
                  color: PRIMARY_GREEN,
                  bold: true,
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  ],
});

const wordDoc = new Document({
  sections: [
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 }, // A4
          margin: { top: 720, bottom: 720, left: 900, right: 900 },
        },
      },
      headers: { default: new Header({ children: [headerTable] }) },
      footers: { default: new Footer({ children: [footerTable] }) },
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: 'Ref. No.: FKIPL/CORP/2026/BR-DSC-01',
              bold: true,
              size: 17,
              color: DARK_SLATE,
            }),
            new TextRun({
              text: '\t\t\t\t\t\t\t\tDate: 21st November 2026',
              bold: true,
              size: 17,
              color: DARK_SLATE,
            }),
          ],
          spacing: { before: 150, after: 200 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'CERTIFIED TRUE COPY OF THE RESOLUTION PASSED AT THE MEETING OF THE BOARD OF DIRECTORS OF FARMSKING TECHNOLOGIES PRIVATE LIMITED HELD ON SATURDAY, 21ST NOVEMBER 2026 AT 11:00 AM IST AT THE REGISTERED OFFICE OF THE COMPANY.',
              bold: true,
              size: 18,
              color: PRIMARY_GREEN,
            }),
          ],
          spacing: { after: 150 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'SUBJECT: AUTHORIZATION TO APPLY FOR AND OBTAIN CLASS-3 ORGANIZATION DIGITAL SIGNATURE CERTIFICATE (DSC) IN THE NAME OF MS. GAGANDEEP KAUR (DIRECTOR) ON BEHALF OF THE COMPANY.',
              bold: true,
              underline: true,
              size: 18,
              color: PRIMARY_GREEN,
            }),
          ],
          spacing: { after: 200 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: '"RESOLVED THAT the consent of the Board of Directors of the Company be and is hereby accorded to apply for and obtain a Class-3 Organization / Corporate Digital Signature Certificate (Combo: Signing & Encryption) in the name of Ms. GAGANDEEP KAUR (Director, DIN: 11342798, PAN: JQOPK2470K) on behalf of the Company, FARMSKING TECHNOLOGIES PRIVATE LIMITED (PAN: AAHCF3566C, CIN: U62013PB2026PTC070389), from any licensed Certifying Authority (such as eMudhra, Capricorn, VSign, PantaSign, Sify, or any other CCA-accredited Certifying Authority).',
              size: 18,
            }),
          ],
          spacing: { after: 150 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'RESOLVED FURTHER THAT Ms. GAGANDEEP KAUR, Director of the Company, be and is hereby designated as the PRINCIPAL AUTHORIZED SIGNATORY of the Company for the National Single Window System (NSWS) portal, Startup India (DPIIT Recognition), Ministry of Corporate Affairs (MCA), Goods and Services Tax (GST), Income Tax Department, and all other regulatory and statutory e-governance authorities.',
              size: 18,
            }),
          ],
          spacing: { after: 150 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'RESOLVED FURTHER THAT Ms. GAGANDEEP KAUR be and is hereby authorized to digitally sign, authenticate, execute, verify, submit, and upload all statutory forms, investor profiles, pitch decks, declarations, undertakings, and documents required on the National Single Window System (NSWS) and Startup India portals on behalf of the Company.',
              size: 18,
            }),
          ],
          spacing: { after: 150 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'RESOLVED FURTHER THAT Mr. BAKHSHISH SINGH (Director & Chairman, DIN: 11342797) be and is hereby authorized to sign this resolution as a Certified True Copy, furnish attested copies to the Certifying Authority, Chartered Accountant, or government departments, and do all such acts, deeds, and things as may be necessary to give full effect to these resolutions."',
              size: 18,
            }),
          ],
          spacing: { after: 250 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'SPECIMEN SIGNATURE OF AUTHORIZED SIGNATORY:\n',
              bold: true,
              size: 17,
              color: PRIMARY_GREEN,
            }),
            new TextRun({
              text: 'Name: Ms. GAGANDEEP KAUR (Director, DIN: 11342798)\nSpecimen: ',
              size: 17,
            }),
            new ImageRun({
              data: gkSignBuf,
              transformation: {
                width: 130,
                height: 33,
              },
            }),
          ],
          spacing: { after: 250 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: '// CERTIFIED TRUE COPY //\n',
              bold: true,
              size: 18,
              color: PRIMARY_GREEN,
            }),
            new TextRun({
              text: 'For and on behalf of the Board of Directors\n',
              size: 17,
              color: SUB_TEXT,
            }),
            new TextRun({
              text: 'FARMSKING TECHNOLOGIES PRIVATE LIMITED',
              bold: true,
              size: 19,
              color: PRIMARY_GREEN,
            }),
          ],
          spacing: { before: 150, after: 200 },
        }),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: createNoBorder(),
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  borders: createNoBorder(),
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({
                      children: [
                        new ImageRun({
                          data: bsSignBuf,
                          transformation: { width: 70, height: 35 },
                        }),
                      ],
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: '_____________________________________\n',
                          size: 18,
                        }),
                        new TextRun({
                          text: 'BAKHSHISH SINGH\n',
                          bold: true,
                          size: 18,
                        }),
                        new TextRun({
                          text: 'Director & Chairman\nDIN: 11342797',
                          size: 16,
                          color: SUB_TEXT,
                        }),
                      ],
                    }),
                  ],
                }),
                new TableCell({
                  borders: createNoBorder(),
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({
                      children: [
                        new ImageRun({
                          data: gkSignBuf,
                          transformation: { width: 130, height: 33 },
                        }),
                      ],
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: '_____________________________________\n',
                          size: 18,
                        }),
                        new TextRun({
                          text: 'GAGANDEEP KAUR\n',
                          bold: true,
                          size: 18,
                        }),
                        new TextRun({
                          text: 'Director & Authorized Signatory\nDIN: 11342798',
                          size: 16,
                          color: SUB_TEXT,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    },
  ],
});

const outDocxPath = path.join(OUT_DIR, '05_BOARD_RESOLUTION_ORGANIZATION_DSC_GAGANDEEP_KAUR.docx');
Packer.toBuffer(wordDoc).then((buffer) => {
  fs.writeFileSync(outDocxPath, buffer);
  console.log('[OK] Word Resolution (.docx) created with Real Signatures:', outDocxPath);

  if (fs.existsSync(DESKTOP_DIR)) {
    fs.copyFileSync(outDocxPath, path.join(DESKTOP_DIR, '05_BOARD_RESOLUTION_ORGANIZATION_DSC_GAGANDEEP_KAUR.docx'));
    console.log('[OK] Word Resolution (.docx) synced to Desktop Folder:', DESKTOP_DIR);
  }
}).catch((err) => {
  console.error('[FAIL] Docx generation failed:', err.message);
});
