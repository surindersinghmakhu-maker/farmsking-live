const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CHROME_PATH = '"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"';
const DESKTOP_DIR = 'C:\\Users\\hp\\Desktop\\FarmsKing Pvt Ltd';
const OUT_DIR = 'D:\\farmsking\\Govt\\docs\\15_Company_Statutory_Registers_and_Record_Books';

const signDir = 'D:\\farmsking\\Govt\\docs\\00_Directors_Official_Signatures';
const gkSignBuf = fs.readFileSync(path.join(signDir, 'gagandeep_kaur_signature.png'));
const bsSignBuf = fs.readFileSync(path.join(signDir, 'bakhshish_singh_signature.png'));
const gkSignBase64 = `data:image/png;base64,${gkSignBuf.toString('base64')}`;
const bsSignBase64 = `data:image/png;base64,${bsSignBuf.toString('base64')}`;

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Minutes of the First Meeting of the Board of Directors - FarmsKing</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Cinzel:wght@700&display=swap');

    @page {
      size: A4 portrait;
      margin: 12mm 15mm;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      font-family: 'Manrope', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #0f172a;
      font-size: 9pt;
      line-height: 1.48;
    }

    .page {
      width: 100%;
      height: 271mm;
      max-height: 271mm;
      page-break-after: always;
      break-after: page;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
    }

    .page:last-child {
      page-break-after: avoid;
      break-after: avoid;
    }

    /* Corporate Header */
    .header {
      border-bottom: 2.5px solid #0f766e;
      padding-bottom: 7px;
      margin-bottom: 10px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .company-title {
      font-family: 'Cinzel', serif;
      font-size: 15pt;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin: 0 0 2px 0;
    }

    .company-motto {
      font-size: 8.2pt;
      font-weight: 700;
      color: #0f766e;
      letter-spacing: 1.2px;
      text-transform: uppercase;
      margin-bottom: 3px;
    }

    .company-meta {
      font-size: 7.5pt;
      color: #475569;
      line-height: 1.35;
    }

    .badge-box {
      background: #042f2e;
      color: #f59e0b;
      font-size: 7.8pt;
      font-weight: 800;
      padding: 4px 10px;
      border-radius: 4px;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      display: inline-block;
      margin-bottom: 3px;
      text-align: right;
    }

    .badge-sub {
      font-size: 7.2pt;
      color: #64748b;
      font-weight: 600;
      text-align: right;
    }

    /* Title banner */
    .title-banner {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-left: 4px solid #0f766e;
      padding: 7px 12px;
      margin-bottom: 10px;
    }

    .title-text {
      font-size: 10pt;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      margin: 0 0 2px 0;
    }

    .title-sub {
      font-size: 7.8pt;
      color: #475569;
      font-weight: 600;
      margin: 0;
    }

    .meeting-info {
      font-size: 8pt;
      color: #334155;
      background: #f1f5f9;
      padding: 6px 10px;
      border-radius: 4px;
      margin-bottom: 10px;
      line-height: 1.45;
    }

    .section-title {
      font-size: 9.2pt;
      font-weight: 800;
      color: #042f2e;
      text-transform: uppercase;
      margin: 8px 0 4px 0;
      letter-spacing: 0.3px;
    }

    .section-body {
      font-size: 8.8pt;
      color: #334155;
      margin-bottom: 6px;
      text-align: justify;
    }

    .resolution-quote {
      background: #fafafa;
      border-left: 3px solid #0f766e;
      padding: 6px 10px;
      margin: 5px 0 8px 0;
      font-size: 8.6pt;
      line-height: 1.42;
    }

    .resolution-quote strong {
      color: #042f2e;
    }

    /* Table */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.4pt;
      margin: 6px 0 10px 0;
    }

    th {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 5px 8px;
      text-align: left;
      font-weight: 700;
      color: #1e293b;
    }

    td {
      border: 1px solid #cbd5e1;
      padding: 5px 8px;
      color: #334155;
    }

    /* Sign Section */
    .sign-section {
      margin-top: 15px;
      padding-top: 10px;
      border-top: 1px dashed #cbd5e1;
      page-break-inside: avoid;
    }

    .sign-row {
      display: flex;
      justify-content: space-between;
      margin-top: 25px;
    }

    .sign-col {
      width: 45%;
    }

    .sign-line {
      border-top: 1px solid #0f172a;
      padding-top: 4px;
    }

    .sign-name {
      font-weight: 800;
      font-size: 9.2pt;
      color: #0f172a;
    }

    .sign-desig {
      font-size: 7.8pt;
      color: #475569;
      font-weight: 600;
    }

    /* Footer */
    .footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 4px;
      font-size: 7.2pt;
      color: #64748b;
      display: flex;
      justify-content: space-between;
      margin-top: auto;
    }
  </style>
</head>
<body>

  <!-- PAGE 1 -->
  <div class="page">
    <div>
      <!-- Header -->
      <div class="header">
        <div>
          <h1 class="company-title">FarmsKing Technologies Private Limited</h1>
          <div class="company-motto">Smart Farming &bull; CIN: U62013PB2026PTC070389</div>
          <div class="company-meta">
            Regd. Office: C/o BALDEV SINGH, VILLAGE BOOH, Kapurthala, Punjab - 144601, India<br>
            PAN: AAHCF3566C &bull; TAN: AMRF11527F &bull; Email: surindersinghmakhu@gmail.com
          </div>
        </div>
        <div>
          <div class="badge-box">Minutes Book</div>
          <div class="badge-sub">Meeting No. 1 / 2026</div>
        </div>
      </div>

      <!-- Banner -->
      <div class="title-banner">
        <div class="title-text">Minutes of the First Meeting of the Board of Directors</div>
        <div class="title-sub">[Pursuant to Section 118 of the Companies Act, 2013 and Secretarial Standard-1 (SS-1)]</div>
      </div>

      <div class="meeting-info">
        <strong>Date & Time:</strong> Saturday, 21st November 2026 at 11:00 AM IST<br>
        <strong>Venue:</strong> Corporate Office: Near Grain Market, Makhu, District Ferozepur, Punjab - 142044<br>
        <strong>Directors Present:</strong> 1. Mr. BAKHSHISH SINGH (Director, DIN: 11342797) &bull; 2. Ms. GAGANDEEP KAUR (Director, DIN: 11342798)<br>
        <strong>In Attendance (Special Invitee):</strong> Mr. GURNAM SINGH (General Manager designate)
      </div>

      <div class="section-title">1. Chairman of the Meeting</div>
      <div class="section-body">
        Mr. Bakhshish Singh was unanimously elected as the Chairman of the meeting and took the chair.
      </div>

      <div class="section-title">2. Quorum</div>
      <div class="section-body">
        The Chairman confirmed that both First Directors were present in person, constituting the statutory quorum under Section 174 of the Companies Act, 2013.
      </div>

      <div class="section-title">3. Certificate of Incorporation & MoA / AoA</div>
      <div class="section-body">
        The Chairman produced the Certificate of Incorporation (Form INC-11) issued by the Central Registration Centre (CRC / MCA) bearing CIN <strong>U62013PB2026PTC070389</strong> dated 18th November 2026, along with the approved e-MoA and e-AoA. The Board took formal note of the same.
      </div>

      <div class="section-title">4. Resolution No. 1: Opening of ICICI Bank Current Account & GM Appointment</div>
      <div class="resolution-quote">
        <strong>"RESOLVED THAT</strong> a Corporate Current Account under the <strong>ICICI Bank iStartup 2.0 Program</strong> be opened in the name and style of <strong>'FARMSKING TECHNOLOGIES PRIVATE LIMITED'</strong> with <strong>ICICI Bank Limited, Makhu Branch (District Ferozepur, Punjab - 142044)</strong>.<br><br>
        <strong>RESOLVED FURTHER THAT</strong> <strong>Mr. GURNAM SINGH</strong> (Son of Mr. SONA SINGH, Resident of Guru Har Sahai, District Ferozepur, Punjab), General Manager of the Company, be and is hereby designated as the <strong>SOLE AUTHORIZED SIGNATORY</strong> to operate, manage, and execute all banking transactions, sign cheques, operate Corporate Internet Banking (CIB), and execute RTGS/NEFT/IMPS instructions on behalf of the Company."
      </div>

      <div class="section-title">5. Resolution No. 2: GST & MSME Primary Authorized Signatory</div>
      <div class="resolution-quote">
        <strong>"RESOLVED THAT</strong> <strong>Mr. BAKHSHISH SINGH</strong> (Director, DIN: <strong>11342797</strong>, PAN: <strong>CNNPS4562F</strong>) be and is hereby designated as the <strong>PRIMARY AUTHORIZED SIGNATORY FOR GOODS AND SERVICES TAX (GST)</strong> and <strong>MSME UDYAM REGISTRATION</strong>, and is empowered to sign all applications, returns, and statutory representations on behalf of the Company."
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div>FARMSKING TECHNOLOGIES PRIVATE LIMITED &bull; Statutory Minutes Book (Section 118, Companies Act, 2013)</div>
      <div>Page 1 of 2</div>
    </div>
  </div>

  <!-- PAGE 2 -->
  <div class="page">
    <div>
      <!-- Header -->
      <div class="header">
        <div>
          <h1 class="company-title">FarmsKing Technologies Private Limited</h1>
          <div class="company-motto">Smart Farming &bull; CIN: U62013PB2026PTC070389</div>
        </div>
        <div>
          <div class="badge-box">Minutes Book</div>
          <div class="badge-sub">Meeting No. 1 / 2026</div>
        </div>
      </div>

      <div class="section-title">6. Resolution No. 3: Appointment of First Statutory Auditor (Form ADT-1)</div>
      <div class="resolution-quote">
        <strong>"RESOLVED THAT</strong> pursuant to the provisions of Section 139(6) and other applicable provisions, if any, of the Companies Act, 2013, <strong>[Name of Chartered Accountant Firm]</strong>, Chartered Accountants (Firm Registration No: ____________), be and are hereby appointed as the First Statutory Auditors of the Company to hold office from the date of incorporation until the conclusion of the First Annual General Meeting (AGM) of the Company at such remuneration as may be mutually agreed between the Board of Directors and the Auditors.<br><br>
        <strong>RESOLVED FURTHER THAT</strong> the Board be and is hereby authorized to file Form ADT-1 with the Registrar of Companies (ROC), Punjab and Chandigarh, within the prescribed statutory period."
      </div>

      <div class="section-title">7. Resolution No. 4: Issuance of Share Certificates (Form SH-1)</div>
      <div class="resolution-quote">
        <strong>"RESOLVED THAT</strong> Share Certificates in Form SH-1 be issued to the first subscribers to the Memorandum of Association under the signatures of the Directors of the Company as follows:
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 32%;">Subscriber Name</th>
            <th style="width: 18%;">No. of Shares</th>
            <th style="width: 28%;">Distinctive Numbers</th>
            <th style="width: 22%;">Certificate No.</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Mr. SURINDER SINGH</strong></td>
            <td>87,000 Equity</td>
            <td>00001 to 87000</td>
            <td>FKIPL/SH/001</td>
          </tr>
          <tr>
            <td><strong>Mr. BAKHSHISH SINGH</strong></td>
            <td>10,000 Equity</td>
            <td>87001 to 97000</td>
            <td>FKIPL/SH/002</td>
          </tr>
          <tr>
            <td><strong>Ms. GAGANDEEP KAUR</strong></td>
            <td>3,000 Equity</td>
            <td>97001 to 100000</td>
            <td>FKIPL/SH/003</td>
          </tr>
          <tr style="background: #f8fafc; font-weight: 700;">
            <td>Total Subscribed Capital</td>
            <td>1,00,000 Equity</td>
            <td>Distinctive: 1 to 100000</td>
            <td>Total: ₹1,00,000</td>
          </tr>
        </tbody>
      </table>

      <div class="section-title">8. Vote of Thanks</div>
      <div class="section-body">
        There being no other business to discuss, the meeting concluded at 12:30 PM with a hearty vote of thanks to the Chair.
      </div>

      <!-- Signatures -->
      <div class="sign-section">
        <div style="font-size: 8.5pt; font-weight: 700; color: #042f2e; margin-bottom: 8px;">
          Signed and Confirmed as a True Record of the Proceedings:
        </div>
        <div style="font-size: 8pt; color: #475569; margin-bottom: 12px;">
          Date of Signing: 21st November 2026 &bull; Place: Makhu, Ferozepur
        </div>

        <div class="sign-row">
          <div class="sign-col">
            <div style="height: 38px; display: flex; align-items: flex-end; margin-bottom: 2px;">
              <img src="${bsSignBase64}" style="height: 32px; width: auto; max-width: 130px; object-fit: contain;" alt="Bakhshish Singh Sign">
            </div>
            <div class="sign-line">
              <div class="sign-name">BAKHSHISH SINGH</div>
              <div class="sign-desig">Chairman of the Meeting & Director<br>DIN: 11342797</div>
            </div>
          </div>

          <div class="sign-col">
            <div style="height: 38px; display: flex; align-items: flex-end; margin-bottom: 2px;">
              <img src="${gkSignBase64}" style="height: 32px; width: auto; max-width: 140px; object-fit: contain;" alt="Gagandeep Kaur Sign">
            </div>
            <div class="sign-line">
              <div class="sign-name">GAGANDEEP KAUR</div>
              <div class="sign-desig">Director<br>DIN: 11342798</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div>FARMSKING TECHNOLOGIES PRIVATE LIMITED &bull; Statutory Minutes Book (Section 118, Companies Act, 2013)</div>
      <div>Page 2 of 2</div>
    </div>
  </div>

</body>
</html>`;

const htmlFilePath = path.join(OUT_DIR, '04_BOARD_MEETING_MINUTES_BOOK_MEETING_NO_1.html');
const pdfFilePath = path.join(OUT_DIR, '04_Board_Meeting_Minutes_Meeting_No_1.pdf');

fs.writeFileSync(htmlFilePath, htmlContent, 'utf8');
console.log('[OK] HTML Written:', htmlFilePath);

try {
  const cmd = `${CHROME_PATH} --headless=new --disable-gpu --no-pdf-header-footer --print-to-pdf="${pdfFilePath}" "${htmlFilePath}"`;
  execSync(cmd, { stdio: 'inherit' });
  console.log('[OK] PDF Generated successfully:', pdfFilePath);

  if (fs.existsSync(DESKTOP_DIR)) {
    const desktopPdfPath = path.join(DESKTOP_DIR, '04_Board_Meeting_Minutes_Meeting_No_1.pdf');
    fs.copyFileSync(pdfFilePath, desktopPdfPath);
    console.log('[OK] Synced to Desktop Folder:', desktopPdfPath);
  }
} catch (err) {
  console.error('[FAIL] Chrome PDF rendering failed:', err.message);
}
