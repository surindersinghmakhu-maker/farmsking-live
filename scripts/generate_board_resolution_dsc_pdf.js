const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CHROME_PATH = '"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"';
const DESKTOP_DIR = 'C:\\Users\\hp\\Desktop\\FarmsKing Pvt Ltd';
const OUT_DIR = 'D:\\farmsking\\Govt\\docs\\08_Startup_India_DPIIT_Registration_Kit';

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Board Resolution - Class-3 Organization DSC - FarmsKing</title>
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
      font-size: 9.8pt;
      line-height: 1.5;
    }

    .page {
      width: 100%;
      min-height: 268mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    /* Corporate Header */
    .header {
      border-bottom: 2.5px solid #0f766e;
      padding-bottom: 8px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .company-title {
      font-family: 'Cinzel', serif, 'Times New Roman';
      font-size: 15.5pt;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin: 0 0 3px 0;
    }

    .company-motto {
      font-size: 8.5pt;
      font-weight: 700;
      color: #0f766e;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      margin-bottom: 4px;
    }

    .company-meta {
      font-size: 7.8pt;
      color: #475569;
      line-height: 1.35;
    }

    .doc-badge {
      text-align: right;
    }

    .badge-box {
      background: #042f2e;
      color: #f59e0b;
      font-size: 8pt;
      font-weight: 800;
      padding: 4px 10px;
      border-radius: 4px;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      display: inline-block;
      margin-bottom: 4px;
    }

    .badge-sub {
      font-size: 7.5pt;
      color: #64748b;
      font-weight: 600;
    }

    /* Document Heading */
    .title-banner {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-left: 4px solid #0f766e;
      padding: 8px 12px;
      margin-bottom: 12px;
    }

    .title-text {
      font-size: 9.8pt;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      margin: 0 0 2px 0;
    }

    .title-sub {
      font-size: 8pt;
      color: #475569;
      font-weight: 600;
      margin: 0;
    }

    .meeting-info {
      font-size: 8.2pt;
      color: #334155;
      background: #f1f5f9;
      padding: 6px 10px;
      border-radius: 4px;
      margin-bottom: 10px;
      line-height: 1.4;
    }

    /* Content styling */
    .resolution-box {
      margin-bottom: 12px;
    }

    .resolution-box p {
      margin: 0 0 8px 0;
      text-align: justify;
    }

    .res-quote {
      background: #fafafa;
      border-left: 3px solid #0f766e;
      padding: 8px 12px;
      margin: 8px 0;
      font-size: 9.3pt;
      line-height: 1.5;
    }

    .res-quote strong {
      color: #042f2e;
    }

    /* Specimen Signature Table */
    .table-container {
      margin: 12px 0;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.8pt;
    }

    th {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 6px 10px;
      text-align: left;
      font-weight: 700;
      color: #1e293b;
    }

    td {
      border: 1px solid #cbd5e1;
      padding: 6px 10px;
      color: #334155;
    }

    /* Signature Section */
    .sign-section {
      margin-top: 14px;
      padding-top: 10px;
      border-top: 1px dashed #cbd5e1;
      page-break-inside: avoid;
    }

    .cert-heading {
      font-size: 8.8pt;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 12px;
      letter-spacing: 0.5px;
    }

    .sign-row {
      display: flex;
      justify-content: space-between;
      margin-top: 30px;
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
      font-size: 9.5pt;
      color: #0f172a;
    }

    .sign-desig {
      font-size: 8pt;
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
      margin-top: 8px;
    }
  </style>
</head>
<body>
  <div class="page">
    <div>
      <!-- Header -->
      <div class="header">
        <div>
          <h1 class="company-title">FarmsKing Technologies Private Limited</h1>
          <div class="company-motto">Smart Farming &bull; CIN: U62013PB2026PTC070389</div>
          <div class="company-meta">
            Regd. Office: C/o BALDEV SINGH, VILLAGE BOOH, Kapurthala, Punjab - 144601, India<br>
            PAN: AAHCF3566C &bull; TAN: AMRF11527F &bull; Email: surindersinghmakhu@gmail.com / contact@farmsking.in
          </div>
        </div>
        <div class="doc-badge">
          <div class="badge-box">Board Resolution</div>
          <div class="badge-sub">Ref: FK/BR/2026/DSC-01</div>
        </div>
      </div>

      <!-- Title Banner -->
      <div class="title-banner">
        <div class="title-text">Certified True Copy of the Resolution Passed by the Board of Directors</div>
        <div class="title-sub">Passed at the Meeting of the Board of Directors held on Saturday, 21st November 2026 at 11:00 AM IST</div>
      </div>

      <div class="meeting-info">
        <strong>Venue:</strong> Registered Office: C/o BALDEV SINGH, VILLAGE BOOH, Kapurthala, Punjab - 144601, India<br>
        <strong>Directors Present:</strong> 1. Mr. BAKHSHISH SINGH (Director & Chairman, DIN: 11342797) &nbsp;&bull;&nbsp; 2. Ms. GAGANDEEP KAUR (Director, DIN: 11342798)
      </div>

      <!-- Resolution Content -->
      <div class="resolution-box">
        <p style="font-weight: 700; color: #042f2e; text-transform: uppercase; font-size: 9pt; margin-bottom: 6px;">
          Subject: Authorization for Obtaining Class-3 Organization Digital Signature Certificate (DSC) and Appointment of Ms. Gagandeep Kaur as Authorized Signatory for NSWS, Startup India (DPIIT) & Regulatory Portals.
        </p>

        <div class="res-quote">
          <strong>"RESOLVED THAT</strong> the consent of the Board of Directors of the Company be and is hereby accorded to apply for and obtain a <strong>Class-3 Organization / Corporate Digital Signature Certificate (Combo: Signing & Encryption)</strong> in the name of <strong>Ms. GAGANDEEP KAUR</strong> (Director, DIN: <strong>11342798</strong>, PAN: <strong>JQOPK2470K</strong>) on behalf of the Company, <strong>FARMSKING TECHNOLOGIES PRIVATE LIMITED</strong> (PAN: <strong>AAHCF3566C</strong>, CIN: <strong>U62013PB2026PTC070389</strong>), from any licensed Certifying Authority (such as eMudhra, Capricorn, VSign, PantaSign, or any other CCA-accredited Certifying Authority)."
        </div>

        <div class="res-quote">
          <strong>"RESOLVED FURTHER THAT</strong> <strong>Ms. GAGANDEEP KAUR</strong>, Director of the Company, be and is hereby designated as the <strong>PRINCIPAL AUTHORIZED SIGNATORY</strong> of the Company for the <strong>National Single Window System (NSWS)</strong> portal, <strong>Startup India (DPIIT) Recognition</strong>, Ministry of Commerce & Industry portals, and all associated statutory e-governance platforms."
        </div>

        <div class="res-quote">
          <strong>"RESOLVED FURTHER THAT</strong> <strong>Ms. GAGANDEEP KAUR</strong> be and is hereby authorized to digitally sign, authenticate, execute, verify, submit, and upload all electronic applications, investor profiles, declarations, pitch decks, undertakings, and representations on the National Single Window System (NSWS) and Startup India portals on behalf of the Company."
        </div>

        <div class="res-quote">
          <strong>"RESOLVED FURTHER THAT</strong> <strong>Mr. BAKHSHISH SINGH</strong> (Director, DIN: <strong>11342797</strong>) be and is hereby authorized to sign this resolution as a Certified True Copy, furnish attested copies to the Certifying Authority, Chartered Accountant, or government departments, and do all such acts, deeds, and things as may be necessary to give full effect to these resolutions."
        </div>
      </div>

      <!-- Specimen Signature Table -->
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th style="width: 32%;">Name of Authorized Signatory</th>
              <th style="width: 18%;">Designation</th>
              <th style="width: 18%;">DIN</th>
              <th style="width: 32%;">Specimen Signature</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Ms. GAGANDEEP KAUR</strong><br><span style="font-size: 7.5pt; color: #64748b;">PAN: JQOPK2470K</span></td>
              <td>Director</td>
              <td>11342798</td>
              <td style="height: 38px; vertical-align: bottom;"><span style="color: #94a3b8; font-size: 7.5pt;">Sign here:</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Signatures -->
    <div class="sign-section">
      <div class="cert-heading">
        // CERTIFIED TRUE COPY // &nbsp;&bull;&nbsp; For and on behalf of the Board of Directors of<br>
        <span style="font-size: 10.5pt; color: #042f2e;">FARMSKING TECHNOLOGIES PRIVATE LIMITED</span>
      </div>

      <div class="sign-row">
        <div class="sign-col">
          <div class="sign-line">
            <div class="sign-name">BAKHSHISH SINGH</div>
            <div class="sign-desig">Director & Chairman<br>DIN: 11342797</div>
          </div>
        </div>

        <div class="sign-col">
          <div class="sign-line">
            <div class="sign-name">GAGANDEEP KAUR</div>
            <div class="sign-desig">Director & Authorized Signatory<br>DIN: 11342798</div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <div>FARMSKING TECHNOLOGIES PRIVATE LIMITED &bull; Statutory Secretarial Record under Section 118, Companies Act, 2013</div>
        <div>Date: 21st November 2026 &bull; Place: Kapurthala, Punjab &bull; Page 1 of 1</div>
      </div>
    </div>
  </div>
</body>
</html>`;

const htmlFilePath = path.join(OUT_DIR, '03_Board_Resolution_Organization_DSC_Gagandeep_Kaur.html');
const pdfFilePath = path.join(OUT_DIR, '03_Board_Resolution_Organization_DSC_Gagandeep_Kaur.pdf');

fs.writeFileSync(htmlFilePath, htmlContent, 'utf8');
console.log('[OK] HTML Written:', htmlFilePath);

try {
  const cmd = `${CHROME_PATH} --headless=new --disable-gpu --no-pdf-header-footer --print-to-pdf="${pdfFilePath}" "${htmlFilePath}"`;
  execSync(cmd, { stdio: 'inherit' });
  console.log('[OK] PDF Generated successfully:', pdfFilePath);

  if (fs.existsSync(DESKTOP_DIR)) {
    const desktopPdfPath = path.join(DESKTOP_DIR, '03_Board_Resolution_Organization_DSC_Gagandeep_Kaur.pdf');
    fs.copyFileSync(pdfFilePath, desktopPdfPath);
    console.log('[OK] Synced to Desktop Folder:', desktopPdfPath);
  }
} catch (err) {
  console.error('[FAIL] Chrome PDF rendering failed:', err.message);
}
