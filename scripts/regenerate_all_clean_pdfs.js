const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const chromePath = '"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"';

const govtDocs = path.join('d:\\FarmsKing', 'Govt', 'docs');
const desktopDir = path.join(process.env.USERPROFILE || 'C:\\Users\\hp', 'Desktop', 'FarmsKing Pvt Ltd');

// Master HTML Template for 100% Clean Legal PDF (NO BROWSER HEADERS/FOOTERS)
function getCleanLegalHtml(title, subtitle, content, isSinglePage = true) {
  const bodyFontSize = isSinglePage ? '11.5px' : '12.5px';
  const lineHeight = isSinglePage ? '1.32' : '1.45';
  const bannerPadding = isSinglePage ? '7px 10px' : '10px 12px';
  const bannerTitleSize = isSinglePage ? '15px' : '17px';
  const pageMargin = isSinglePage ? '10mm 15mm 10mm 15mm' : '15mm 15mm 15mm 15mm';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>FARMSKING TECHNOLOGIES PRIVATE LIMITED</title>
<style>
  @page { 
    size: legal portrait; 
    margin: ${pageMargin}; 
  }
  * { box-sizing: border-box; }
  body { 
    font-family: 'Segoe UI', Arial, sans-serif; 
    color: #212121; 
    line-height: ${lineHeight}; 
    font-size: ${bodyFontSize}; 
    margin: 0; 
    padding: 0; 
  }
  .meta-bar { 
    font-size: 9px; 
    color: #616161; 
    text-align: right; 
    border-bottom: 1px solid #BDBDBD; 
    padding-bottom: 3px; 
    margin-bottom: 8px; 
    text-transform: uppercase;
    font-weight: 600;
  }
  .header-banner { 
    border: 2px solid #1B5E20; 
    background: #E8F5E9; 
    padding: ${bannerPadding}; 
    text-align: center; 
    border-radius: 4px; 
    margin-bottom: 10px; 
  }
  .header-banner h1 { 
    margin: 0 0 3px 0; 
    color: #1B5E20; 
    font-size: ${bannerTitleSize}; 
    text-transform: uppercase; 
    letter-spacing: 0.5px; 
  }
  .header-banner p { 
    margin: 0; 
    color: #2E7D32; 
    font-style: italic; 
    font-size: 11px; 
  }
  p { margin: 0 0 7px 0; }
  .section-title {
    font-weight: bold;
    color: #0D47A1;
    margin-top: 12px;
    margin-bottom: 6px;
    font-size: 13px;
    text-transform: uppercase;
    border-bottom: 1px solid #BBDEFB;
    padding-bottom: 2px;
  }
  table { 
    width: 100%; 
    border-collapse: collapse; 
    margin: 8px 0; 
    font-size: 11.5px; 
  }
  th, td { 
    border: 1px solid #CFD8DC; 
    padding: 5px 8px; 
    text-align: left; 
  }
  th { 
    background: #ECEFF1; 
    color: #263238; 
    font-weight: 600; 
  }
  .highlight-box { 
    background: #F9FBE7; 
    border: 1px solid #DCE775; 
    border-left: 4px solid #827717; 
    padding: 7px 10px; 
    margin: 7px 0; 
    border-radius: 3px; 
    font-size: 11.5px;
    line-height: 1.35;
  }
  .signature-table { 
    width: 100%; 
    border-collapse: collapse; 
    border: none; 
    margin-top: 12px; 
  }
  .signature-table td { 
    border: none; 
    padding: 4px 6px; 
    vertical-align: top; 
  }
</style>
</head>
<body>
<div class="meta-bar">GOVERNMENT OF INDIA | MINISTRY OF CORPORATE AFFAIRS (MCA) | SPICe+ PART B STATUTORY ATTACHMENT</div>
<div class="header-banner">
  <h1>${title}</h1>
  <p>${subtitle}</p>
</div>
${content}
</body>
</html>`;
}

// Convert HTML to PDF strictly suppressing all Chrome headers and footers
function printCleanPdf(html, destPdfPath) {
  const tempHtml = path.join(__dirname, `_clean_temp_${Date.now()}_${Math.random().toString(36).substring(7)}.html`);
  fs.writeFileSync(tempHtml, html, 'utf8');
  try {
    // CRITICAL: --no-pdf-header-footer completely suppresses file paths, date, and URLs at the bottom/top of the PDF
    execSync(`${chromePath} --headless=new --disable-gpu --no-pdf-header-footer --print-to-pdf="${destPdfPath}" "${tempHtml}"`, { stdio: 'ignore' });
    console.log('Clean PDF generated without any path/footer:', path.basename(destPdfPath));
  } catch (e) {
    console.error('Error generating PDF:', e);
  }
  if (fs.existsSync(tempHtml)) fs.unlinkSync(tempHtml);
}

// 1. REGENERATE CLEAN 1-PAGE NOC (LEGAL SIZE, ZERO FILE PATH FOOTER)
const nocHtml = getCleanLegalHtml(
  'NO OBJECTION CERTIFICATE (NOC) FOR REGISTERED OFFICE',
  '(Pursuant to Rule 25 of the Companies (Incorporation) Rules, 2014 & Section 12 of the Companies Act, 2013)',
  `
  <p><strong>TO,</strong><br>
  The Registrar of Companies (ROC), Punjab & Chandigarh /<br>
  The Central Registration Centre (CRC), Ministry of Corporate Affairs, Government of India.</p>

  <p><strong>SUBJECT:</strong> <span style="color:#0D47A1; font-weight: bold;">NO OBJECTION CERTIFICATE FOR USING PREMISES AS REGISTERED OFFICE OF "FARMSKING TECHNOLOGIES PRIVATE LIMITED" (MCA SRN: AC6979718).</span></p>

  <p>Respected Sir / Madam,</p>

  <p>I, <strong>BAKHSHISH SINGH</strong> (Son of <strong>KASHMIR SINGH</strong>), residing at Village Amritpur, Tehsil Sultanpur Lodhi, District Kapurthala, Punjab - 144628, and carrying on business at Goindwal Sahib, District Tarn Taran, Punjab, do hereby solemnly affirm, declare, and state as under:</p>

  <p><strong>1. Lawful Possession & Absolute Authority:</strong> That I am the absolute and lawful owner / authorized occupant in vacant and legal possession of the commercial premises situated at:</p>

  <div class="highlight-box">
    <strong>M/s GURU NANAK COMPUTER ACADEMY</strong><br>
    NEAR CO-OPERATIVE BANK, GOINDWAL SAHIB,<br>
    TEHSIL: KHADOOR SAHIB, DISTRICT: TARN TARAN,<br>
    STATE: PUNJAB, INDIA — PIN CODE: 143422.
  </div>

  <p><strong>2. Grant of Unconditional No Objection:</strong> That I have <strong>NO OBJECTION</strong> whatsoever to the company named <strong>"FARMSKING TECHNOLOGIES PRIVATE LIMITED"</strong> (Approved by Central Registration Centre, MCA under SRN: <strong>AC6979718</strong>) using the aforesaid premises as its <strong>REGISTERED OFFICE</strong> for carrying on its corporate, digital farming, software development, precision agriculture telemetry, administrative, and statutory business operations under the Companies Act, 2013.</p>

  <p><strong>3. Display of Company Name Board:</strong> That I hereby authorize the company to paint, affix, and display its official name board, registered office sign, and Corporate Identity Number (CIN) outside and inside the said premises as required under Section 12(3) of the Companies Act, 2013.</p>

  <p><strong>4. Statutory Registrations & Bank Operations:</strong> That I grant my unconditional consent to the company using this registered office address for obtaining GSTIN, MSME Udyam, PAN, TAN, Startup India, and for operating Corporate Current Bank Accounts with scheduled commercial banks including <strong>ICICI Bank Limited, Makhu Branch</strong>.</p>

  <p><strong>5. Utility Bill Evidence:</strong> In accordance with Rule 25(2)(c) of the Companies (Incorporation) Rules, 2014, the latest utility bill in my name is attached: <strong>BSNL Telephone / Fiber Tax Invoice (Account No: 1024846990, Invoice No: NDCPB2621596357, Dated: 03-OCT-2026)</strong> issued by Bharat Sanchar Nigam Limited.</p>

  <p><strong>VERIFICATION:</strong><br>
  <em>I, the deponent above-named, do hereby verify that the contents of this No Objection Certificate are true and correct to the best of my knowledge and belief and nothing material has been concealed therein.</em></p>

  <table class="signature-table">
    <tr>
      <td style="width: 55%;">
        <strong>Date:</strong> 22 / 10 / 2026<br>
        <strong>Place:</strong> Goindwal Sahib, Tarn Taran (Punjab)<br><br>
        <strong>Attached Statutory Evidence:</strong><br>
        1. BSNL Fiber Tax Invoice (A/c: 1024846990, Dated: 03-OCT-2026)<br>
        2. PAN Card of Bakhshish Singh ('CNNPS4562F')<br>
        3. Passport / Address Proof of Bakhshish Singh ('N8727830')
      </td>
      <td style="width: 45%; text-align: right;">
        <strong>Signature of Lawful Owner / Occupant:</strong><br><br><br>
        ____________________________________________<br>
        <strong style="color: #1B5E20; font-size: 13px;">BAKHSHISH SINGH</strong><br>
        <em>Owner / Authorized Occupant</em><br>
        Mobile: +91 97796-50800<br>
        Email: bakhshishsingh@gmail.com
      </td>
    </tr>
  </table>
  `,
  true
);

// Save clean NOC PDF to Govt/docs and Desktop
const nocGovt = path.join(govtDocs, '01_Company_Registration_MCA', '03_Registered_Office_NOC_Bakhshish_Singh.pdf');
const nocBak = path.join(govtDocs, '02_Bakhshish_Singh_Director', '07_Registered_Office_NOC_Signed_Copy.pdf');
const nocDesk1 = path.join(desktopDir, '01_Company_and_Statutory_Documents', '02_Registered_Office_NOC_Bakhshish_Singh.pdf');
const nocDesk2 = path.join(desktopDir, '02_Registered_Office_NOC_Bakhshish_Singh.pdf');
const nocDeskBak = path.join(desktopDir, '02_Bakhshish_Singh_Director', '07_Registered_Office_NOC_Signed_Copy.pdf');

printCleanPdf(nocHtml, nocGovt);
if (fs.existsSync(path.dirname(nocBak))) fs.copyFileSync(nocGovt, nocBak);
if (fs.existsSync(path.dirname(nocDesk1))) fs.copyFileSync(nocGovt, nocDesk1);
if (fs.existsSync(desktopDir)) fs.copyFileSync(nocGovt, nocDesk2);
if (fs.existsSync(path.dirname(nocDeskBak))) fs.copyFileSync(nocGovt, nocDeskBak);

// 2. REGENERATE CLEAN DIR-2 FOR BAKHSHISH SINGH
function makeCleanDir2(name, fatherName, address, email, mobile, pan, dob, outPdfs) {
  const html = getCleanLegalHtml(
    'FORM DIR-2 — CONSENT TO ACT AS DIRECTOR',
    '(Pursuant to Section 152(5) of the Companies Act, 2013 & Rule 8 of Companies (Appointment & Qualification of Directors) Rules, 2014)',
    `
    <p><strong>TO,</strong><br>
    The Board of Directors / Promoters,<br>
    <strong>FARMSKING TECHNOLOGIES PRIVATE LIMITED</strong><br>
    (MCA Approved Name | SRN: AC6979718)<br>
    Registered Office: Near Co-operative Bank, Goindwal Sahib, Tehsil Khadoor Sahib, Tarn Taran, Punjab - 143422.</p>

    <p><strong>SUBJECT: CONSENT TO ACT AS DIRECTOR OF FARMSKING TECHNOLOGIES PRIVATE LIMITED</strong></p>

    <p>Respected Sirs / Board Members,</p>

    <p>I, <strong>${name}</strong>, resident of ${address}, hereby give my consent to act as Director of <strong>FARMSKING TECHNOLOGIES PRIVATE LIMITED</strong> pursuant to sub-section (5) of Section 152 of the Companies Act, 2013 and certify that I am not disqualified to become a Director under the Companies Act, 2013.</p>

    <table>
      <tr><th style="width:35%;">Particulars</th><th>Official Statutory Details</th></tr>
      <tr><td>1. Director Identification Number (DIN)</td><td><strong>Applied for in SPICe+ Part B (INC-32)</strong></td></tr>
      <tr><td>2. Full Legal Name</td><td><strong>${name}</strong></td></tr>
      <tr><td>3. Father's Name</td><td>${fatherName}</td></tr>
      <tr><td>4. Residential Address</td><td>${address}</td></tr>
      <tr><td>5. Email Address</td><td>${email}</td></tr>
      <tr><td>6. Mobile Number</td><td>${mobile}</td></tr>
      <tr><td>7. Permanent Account Number (PAN)</td><td><strong>${pan}</strong></td></tr>
      <tr><td>8. Occupation</td><td>Business / Agriculture / IT Extension</td></tr>
      <tr><td>9. Date of Birth</td><td>${dob}</td></tr>
      <tr><td>10. Nationality</td><td>Indian</td></tr>
    </table>

    <div class="highlight-box">
      <strong>STATUTORY DECLARATION:</strong><br>
      1. I declare that I have not been convicted of any offence in connection with the promotion, formation, or management of any company or LLP.<br>
      2. I have not been found guilty of any fraud or misfeasance or of any breach of duty to any company under this Act or any previous company law in the last five years.<br>
      3. I further declare that if chosen as Director, I will not contravene any provisions of the Act or the rules made thereunder.
    </div>

    <table class="signature-table">
      <tr>
        <td style="width: 55%;">
          <strong>Date:</strong> 22 / 10 / 2026<br>
          <strong>Place:</strong> Punjab, India<br><br>
          <strong>Enclosures:</strong><br>
          1. Self-attested PAN Card<br>
          2. Self-attested Identity & Address Proof
        </td>
        <td style="width: 45%; text-align: right;">
          <strong>Signature of Proposed Director:</strong><br><br><br>
          ________________________________________<br>
          <strong style="color:#1B5E20; font-size: 13px;">${name}</strong><br>
          <em>First Director (Promoter & Subscriber)</em>
        </td>
      </tr>
    </table>
    `,
    true
  );

  const primary = outPdfs[0];
  printCleanPdf(html, primary);
  for (let i = 1; i < outPdfs.length; i++) {
    if (fs.existsSync(path.dirname(outPdfs[i]))) {
      fs.copyFileSync(primary, outPdfs[i]);
    }
  }
}

makeCleanDir2(
  'BAKHSHISH SINGH',
  'KASHMIR SINGH',
  'Village Amritpur, Tehsil Sultanpur Lodhi, District Kapurthala, Punjab - 144628',
  'bakhshishsingh@gmail.com',
  '+91 97796-50800',
  'CNNPS4562F',
  '13/04/1987',
  [
    path.join(govtDocs, '02_Bakhshish_Singh_Director', '05_DIR_2_Consent_Director_Bakhshish_Singh.pdf'),
    path.join(desktopDir, '02_Bakhshish_Singh_Director', '05_DIR_2_Consent_Director_Bakhshish_Singh.pdf'),
    path.join(desktopDir, '03_DIR_2_Consent_Director_Bakhshish_Singh.pdf')
  ]
);

makeCleanDir2(
  'GAGANDEEP KAUR',
  'JASPAL SINGH',
  'Village Nangal, Post Office Makhu, Tehsil Zira, District Firozpur, Punjab - 142044',
  'gagandeepkpm@gmail.com',
  '+91 88724-91557',
  'JQOPK2470K',
  '01/01/1998',
  [
    path.join(govtDocs, '03_Gagandeep_Kaur_Director', '05_DIR_2_Consent_Director_Gagandeep_Kaur.pdf'),
    path.join(desktopDir, '03_Gagandeep_Kaur_Director', '05_DIR_2_Consent_Director_Gagandeep_Kaur.pdf'),
    path.join(desktopDir, '04_DIR_2_Consent_Director_Gagandeep_Kaur.pdf')
  ]
);

// 3. REGENERATE CLEAN INC-9 DECLARATION (1,00,000 SHARES @ RS 1)
const inc9Html = getCleanLegalHtml(
  'FORM INC-9 — STATUTORY DECLARATION BY FIRST DIRECTORS & SUBSCRIBERS',
  '(Pursuant to Section 7(1)(c) of the Companies Act, 2013 & Rule 15 of Companies (Incorporation) Rules, 2014)',
  `
  <p><strong>IN THE MATTER OF INCORPORATION OF "FARMSKING TECHNOLOGIES PRIVATE LIMITED"</strong><br>
  (MCA Approved Name | SRN: AC6979718 | Registered Office in the State of Punjab)</p>

  <p>We, the undersigned First Directors and Subscribers to the Memorandum of Association of <strong>FARMSKING TECHNOLOGIES PRIVATE LIMITED</strong>, do hereby solemnly declare, state, and affirm as follows:</p>

  <div class="highlight-box">
    <ol style="margin: 0; padding-left: 18px;">
      <li><strong>No Criminal Conviction:</strong> That we have not been convicted of any offence in connection with the promotion, formation, or management of any company or LLP under the Companies Act, 2013 or any previous company law.</li>
      <li><strong>No Fraud or Breach of Duty:</strong> That we have not been found guilty of any fraud or misfeasance or of any breach of duty to any company under the Companies Act, 2013 during the preceding five years.</li>
      <li><strong>Completeness and Truth of Documents:</strong> That all the documents and information submitted to the Registrar of Companies (ROC) / Central Registration Centre (CRC) in Form SPICe+ (INC-32), e-MoA (INC-33), and e-AoA (INC-34) for incorporation of the company are correct, true, complete, and substantially accurate to the best of our knowledge and belief.</li>
    </ol>
  </div>

  <table style="margin-top: 10px;">
    <tr>
      <th style="width: 8%;">Sr.</th>
      <th style="width: 28%;">Subscriber / Director Name</th>
      <th style="width: 24%;">Role in Company</th>
      <th style="width: 20%;">Equity Shares Subscribed</th>
      <th style="width: 20%;">Signature / DSC</th>
    </tr>
    <tr>
      <td>1</td>
      <td><strong>SURINDER SINGH</strong><br><small>PAN: BFAPS5771J</small></td>
      <td>Founder & Majority Shareholder</td>
      <td><strong>87,000 Shares (87.00%)</strong><br><small>₹ 87,000.00 @ ₹ 1.00 each</small></td>
      <td>________________________</td>
    </tr>
    <tr>
      <td>2</td>
      <td><strong>BAKHSHISH SINGH</strong><br><small>PAN: CNNPS4562F</small></td>
      <td>Executive Director & Shareholder</td>
      <td><strong>10,000 Shares (10.00%)</strong><br><small>₹ 10,000.00 @ ₹ 1.00 each</small></td>
      <td>________________________</td>
    </tr>
    <tr>
      <td>3</td>
      <td><strong>GAGANDEEP KAUR</strong><br><small>PAN: JQOPK2470K</small></td>
      <td>Executive Director & Shareholder</td>
      <td><strong>3,000 Shares (3.00%)</strong><br><small>₹ 3,000.00 @ ₹ 1.00 each</small></td>
      <td>________________________</td>
    </tr>
    <tr style="background: #E8F5E9;">
      <td colspan="3"><strong>TOTAL AUTHORIZED & SUBSCRIBED SHARE CAPITAL</strong></td>
      <td colspan="2"><strong>1,00,000 Equity Shares of ₹ 1.00 each = ₹ 1,00,000.00 (100.00%)</strong></td>
    </tr>
  </table>

  <p style="margin-top: 10px;"><strong>Date:</strong> 22 / 10 / 2026<br>
  <strong>Place:</strong> Goindwal Sahib, Tarn Taran, Punjab, India</p>
  `,
  true
);

const inc9Pdf1 = path.join(govtDocs, '01_Company_Registration_MCA', '04_INC_9_Declaration_All_Subscribers_Directors.pdf');
const inc9Pdf2 = path.join(desktopDir, '01_Company_and_Statutory_Documents', '05_INC_9_Declaration_All_Subscribers_Directors.pdf');
const inc9Pdf3 = path.join(desktopDir, '05_INC_9_Declaration_All_Subscribers_Directors.pdf');
printCleanPdf(inc9Html, inc9Pdf1);
if (fs.existsSync(path.dirname(inc9Pdf2))) fs.copyFileSync(inc9Pdf1, inc9Pdf2);
if (fs.existsSync(desktopDir)) fs.copyFileSync(inc9Pdf1, inc9Pdf3);

// 4. REGENERATE CLEAN CAPITAL SCHEDULE (1,00,000 SHARES @ RS 1)
const capHtml = getCleanLegalHtml(
  'CAPITAL STRUCTURE & SHARE SUBSCRIPTION SCHEDULE',
  'FARMSKING TECHNOLOGIES PRIVATE LIMITED (MCA SRN: AC6979718)',
  `
  <div class="section-title">1. AUTHORIZED SHARE CAPITAL STRUCTURE</div>
  <table>
    <tr><th>Class of Shares</th><th>Nominal / Face Value per Share</th><th>Total Number of Shares</th><th>Total Authorized Capital (INR)</th></tr>
    <tr><td><strong>Equity Shares with Voting Rights</strong></td><td><strong>INR 1.00 each</strong></td><td><strong>1,00,000 Shares</strong></td><td><strong>INR 1,00,000.00</strong></td></tr>
    <tr><td>Preference Shares</td><td>INR 1.00 each</td><td>NIL</td><td>INR 0.00</td></tr>
    <tr style="background:#E8F5E9;"><td><strong>TOTAL AUTHORIZED SHARE CAPITAL</strong></td><td>-</td><td><strong>1,00,000 Equity Shares</strong></td><td><strong>INR 1,00,000.00 (One Lakh Only)</strong></td></tr>
  </table>

  <div class="section-title">2. SUBSCRIBED & PAID-UP SHARE CAPITAL DISTRIBUTION</div>
  <table>
    <tr>
      <th>Folio</th>
      <th>Promoter / Subscriber Name</th>
      <th>Designation / Category</th>
      <th>PAN Number</th>
      <th>Shares Subscribed</th>
      <th>Total Amount (INR)</th>
      <th>Equity (%)</th>
    </tr>
    <tr>
      <td>01</td>
      <td><strong>SURINDER SINGH</strong></td>
      <td>Founder, First Subscriber & Majority Owner</td>
      <td><code>BFAPS5771J</code></td>
      <td><strong>87,000</strong></td>
      <td><strong>₹ 87,000.00</strong></td>
      <td><strong>87.00%</strong></td>
    </tr>
    <tr>
      <td>02</td>
      <td><strong>BAKHSHISH SINGH</strong></td>
      <td>First Director & Subscriber</td>
      <td><code>CNNPS4562F</code></td>
      <td><strong>10,000</strong></td>
      <td><strong>₹ 10,000.00</strong></td>
      <td><strong>10.00%</strong></td>
    </tr>
    <tr>
      <td>03</td>
      <td><strong>GAGANDEEP KAUR</strong></td>
      <td>First Director & Subscriber</td>
      <td><code>JQOPK2470K</code></td>
      <td><strong>3,000</strong></td>
      <td><strong>₹ 3,000.00</strong></td>
      <td><strong>3.00%</strong></td>
    </tr>
    <tr style="background:#E8F5E9; font-weight:bold;">
      <td colspan="4">TOTAL SUBSCRIBED & FULLY PAID-UP CAPITAL</td>
      <td>1,00,000</td>
      <td>₹ 1,00,000.00</td>
      <td>100.00%</td>
    </tr>
  </table>

  <div class="highlight-box">
    <strong>STATUTORY COMPLIANCE NOTE:</strong><br>
    The initial capital infusion of ₹ 1,00,000.00 shall be deposited directly by the subscribers into the Corporate Current Account of <strong>FARMSKING TECHNOLOGIES PRIVATE LIMITED</strong> with <strong>ICICI Bank Limited, Makhu Branch</strong> within 60 days of incorporation, followed by mandatory MCA Form INC-20A (Commencement of Business).
  </div>
  `,
  true
);

const capPdf = path.join(govtDocs, '01_Company_Registration_MCA', '06_Capital_Structure_and_Share_Subscription_Schedule.pdf');
printCleanPdf(capHtml, capPdf);

console.log('100% CLEAN PDFs GENERATED WITHOUT BROWSER FILE PATHS!');
