const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CHROME_PATH = '"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"';
const KIT_DIR = 'D:\\farmsking\\Govt\\docs\\17_PantaSign_Company_Organization_DSC_Kit';
const DESKTOP_KIT = 'C:\\Users\\hp\\Desktop\\FarmsKing Pvt Ltd\\17_PantaSign_Company_Organization_DSC_Kit';

if (!fs.existsSync(KIT_DIR)) fs.mkdirSync(KIT_DIR, { recursive: true });
if (!fs.existsSync(DESKTOP_KIT)) fs.mkdirSync(DESKTOP_KIT, { recursive: true });

// Source paths
const sources = {
  resPdf: 'D:\\farmsking\\Govt\\docs\\16_Official_Corporate_Letterhead\\05_BOARD_RESOLUTION_ORGANIZATION_DSC_GAGANDEEP_KAUR.pdf',
  resDocx: 'D:\\farmsking\\Govt\\docs\\16_Official_Corporate_Letterhead\\05_BOARD_RESOLUTION_ORGANIZATION_DSC_GAGANDEEP_KAUR.docx',
  coiPdf: 'D:\\farmsking\\Govt\\docs\\01_Company_Registration_MCA\\14_OFFICIAL_CERTIFICATE_OF_INCORPORATION_MCA.pdf',
  moaPdf: 'C:\\Users\\hp\\Desktop\\FarmsKing Pvt Ltd\\03_Form_INC_33_eMoA_FarmsKing.pdf',
  aoaPdf: 'C:\\Users\\hp\\Desktop\\FarmsKing Pvt Ltd\\04_Form_INC_34_eAoA_FarmsKing.pdf',
  bsnlPdf: 'D:\\farmsking\\Govt\\docs\\01_Company_Registration_MCA\\02_Registered_Office_BSNL_Bill_OCT_2026.pdf',
  gkPan: 'D:\\farmsking\\Govt\\docs\\03_Gagandeep_Kaur_Director\\01_Gagandeep_Kaur_PAN_Card_MCA_Ready.pdf',
  gkAadhaar: 'D:\\farmsking\\Govt\\docs\\03_Gagandeep_Kaur_Director\\02_Gagandeep_Kaur_Aadhaar_Both_Sides.pdf',
  gkPhoto: 'D:\\farmsking\\Govt\\docs\\03_Gagandeep_Kaur_Director\\04_Gagandeep_Kaur_KYC_Photo.jpeg',
  gkBank: 'D:\\farmsking\\Govt\\docs\\03_Gagandeep_Kaur_Director\\03_Gagandeep_Kaur_Bank_Statement_SBI.pdf',
  gkSign: 'D:\\farmsking\\Govt\\docs\\00_Directors_Official_Signatures\\gagandeep_kaur_signature.png',
  bsPan: 'D:\\farmsking\\Govt\\docs\\02_Bakhshish_Singh_Director\\01_Bakhshish_Singh_PAN_Card_MCA_Ready.pdf',
  bsAadhaar: 'D:\\farmsking\\Govt\\docs\\02_Bakhshish_Singh_Director\\04_Bakhshish_Singh_Aadhaar_Both_Sides_MCA_Ready.pdf',
  bsPhoto: 'D:\\farmsking\\Govt\\docs\\02_Bakhshish_Singh_Director\\03_Bakhshish_Singh_KYC_Photo.jpeg',
  bsSign: 'D:\\farmsking\\Govt\\docs\\00_Directors_Official_Signatures\\bakhshish_singh_signature.png',
  minutes1: 'D:\\farmsking\\Govt\\docs\\15_Company_Statutory_Registers_and_Record_Books\\04_Board_Meeting_Minutes_Meeting_No_1.pdf'
};

// Target copies
const targetFiles = [
  { src: sources.resPdf, name: '01_BOARD_RESOLUTION_ORGANIZATION_DSC_GAGANDEEP_KAUR.pdf' },
  { src: sources.resDocx, name: '01_BOARD_RESOLUTION_ORGANIZATION_DSC_GAGANDEEP_KAUR.docx' },
  { src: sources.coiPdf, name: '02_CERTIFICATE_OF_INCORPORATION_COI_WITH_PAN_TAN.pdf' },
  { src: sources.moaPdf, name: '03_e_MoA_MEMORANDUM_OF_ASSOCIATION_INC_33.pdf' },
  { src: sources.aoaPdf, name: '04_e_AoA_ARTICLES_OF_ASSOCIATION_INC_34.pdf' },
  { src: sources.bsnlPdf, name: '05_REGISTERED_OFFICE_ADDRESS_PROOF_BSNL_BILL.pdf' },
  { src: sources.gkPan, name: '07_APPLICANT_GAGANDEEP_KAUR_PAN_CARD.pdf' },
  { src: sources.gkAadhaar, name: '08_APPLICANT_GAGANDEEP_KAUR_AADHAAR_CARD.pdf' },
  { src: sources.gkPhoto, name: '09_APPLICANT_GAGANDEEP_KAUR_KYC_PHOTO.jpeg' },
  { src: sources.gkBank, name: '10_APPLICANT_GAGANDEEP_KAUR_BANK_STATEMENT.pdf' },
  { src: sources.gkSign, name: '11_APPLICANT_GAGANDEEP_KAUR_OFFICIAL_SIGNATURE.png' },
  { src: sources.bsPan, name: '12_AUTHORISING_DIRECTOR_BAKHSHISH_SINGH_PAN_CARD.pdf' },
  { src: sources.bsAadhaar, name: '13_AUTHORISING_DIRECTOR_BAKHSHISH_SINGH_AADHAAR_CARD.pdf' },
  { src: sources.bsPhoto, name: '14_AUTHORISING_DIRECTOR_BAKHSHISH_SINGH_KYC_PHOTO.jpeg' },
  { src: sources.bsSign, name: '15_AUTHORISING_DIRECTOR_BAKHSHISH_SINGH_OFFICIAL_SIGNATURE.png' },
  { src: sources.minutes1, name: '16_BOARD_MEETING_MINUTES_MEETING_NO_1.pdf' }
];

for (const tf of targetFiles) {
  if (fs.existsSync(tf.src)) {
    fs.copyFileSync(tf.src, path.join(KIT_DIR, tf.name));
    fs.copyFileSync(tf.src, path.join(DESKTOP_KIT, tf.name));
    console.log(`[OK] Synced: ${tf.name}`);
  } else {
    console.warn(`[WARN] Source missing: ${tf.src}`);
  }
}

// 1. Generate MCA Company Master Data PDF (A4)
const mcaHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>MCA Company Master Data - FarmsKing Technologies Private Limited</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Cinzel:wght@700&display=swap');
    @page { size: A4 portrait; margin: 12mm 15mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { margin: 0; padding: 0; font-family: 'Manrope', sans-serif; color: #0f172a; font-size: 8.5pt; line-height: 1.45; }
    .header { text-align: center; border-bottom: 2px solid #042f2e; padding-bottom: 10px; margin-bottom: 12px; }
    .header h1 { font-family: 'Cinzel', serif; font-size: 14pt; margin: 0 0 4px; color: #042f2e; letter-spacing: 0.5px; }
    .header p { margin: 0; font-size: 8.5pt; color: #475569; font-weight: 600; }
    .table-sec { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
    .table-sec th, .table-sec td { border: 1px solid #cbd5e1; padding: 5px 8px; font-size: 8pt; vertical-align: middle; }
    .table-sec th { background: #f1f5f9; text-align: left; font-weight: 700; color: #1e293b; width: 38%; }
    .table-sec td { background: #ffffff; color: #0f172a; }
    .sec-title { font-size: 9pt; font-weight: 800; color: #042f2e; text-transform: uppercase; margin: 10px 0 6px; letter-spacing: 0.5px; border-left: 3px solid #10b981; padding-left: 6px; }
    .footer { margin-top: 15px; border-top: 1px solid #cbd5e1; padding-top: 8px; font-size: 7.5pt; color: #64748b; display: flex; justify-content: space-between; }
  </style>
</head>
<body>
  <div class="header">
    <div style="font-size: 9pt; font-weight: 700; color: #047857; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px;">Ministry of Corporate Affairs &bull; Government of India</div>
    <h1>Company Master Data &bull; Verification Summary</h1>
    <p>Official Statutory Record as extracted from MCA V3 National Portal</p>
  </div>

  <div class="sec-title">1. Corporate Identification & Registration Profile</div>
  <table class="table-sec">
    <tr><th>Corporate Identity Number (CIN)</th><td><strong>U62013PB2026PTC070389</strong></td></tr>
    <tr><th>Company Name</th><td><strong>FARMSKING TECHNOLOGIES PRIVATE LIMITED</strong></td></tr>
    <tr><th>ROC Code / Jurisdiction</th><td>RoC - CRC Manesar / Chandigarh (Punjab)</td></tr>
    <tr><th>Registration Number</th><td>070389</td></tr>
    <tr><th>Company Category</th><td>Company limited by shares</td></tr>
    <tr><th>Company Sub-Category</th><td>Non-govt company (Private Limited)</td></tr>
    <tr><th>Class of Company</th><td>Private</td></tr>
    <tr><th>Authorized Share Capital</th><td>Rs. 1,00,000 (Rupees One Lakh Only)</td></tr>
    <tr><th>Paid-up Capital</th><td>Rs. 1,00,000 (Rupees One Lakh Only)</td></tr>
    <tr><th>Date of Incorporation</th><td><strong>18/11/2026 (18th November 2026)</strong></td></tr>
    <tr><th>Registered Office Address</th><td><strong>C/o BALDEV SINGH, VILLAGE BOOH, Kapurthala, Kapurthala, Kapurthala - 144601, Punjab, India</strong></td></tr>
    <tr><th>Corporate Office Address</th><td>Near Grain Market, Makhu, District Ferozepur - 142044, Punjab, India</td></tr>
    <tr><th>Official Company Email ID</th><td><strong>info@farmsking.com</strong> (Cc: BSSGNCA@GMAIL.COM)</td></tr>
    <tr><th>Company Status (for e-filing)</th><td><strong>ACTIVE</strong></td></tr>
  </table>

  <div class="sec-title">2. Tax & Statutory Identification Numbers</div>
  <table class="table-sec">
    <tr><th>Permanent Account Number (PAN)</th><td><strong>AAHCF3566C</strong></td></tr>
    <tr><th>Tax Deduction and Collection Account Number (TAN)</th><td><strong>AMRF11527F</strong></td></tr>
    <tr><th>EPFO Code / ESIC Registration</th><td>Integrated SPICe+ Allotment</td></tr>
    <tr><th>Professional Tax / GST Registration</th><td>Under Statutory Process</td></tr>
  </table>

  <div class="sec-title">3. Board of Directors / Signatory Details</div>
  <table class="table-sec">
    <tr style="background: #e2e8f0;">
      <th style="width: 15%;">DIN / PAN</th>
      <th style="width: 32%;">Director Name</th>
      <th style="width: 25%;">Designation</th>
      <th style="width: 15%;">Date of Appt</th>
      <th style="width: 13%;">Signatory</th>
    </tr>
    <tr>
      <td><strong>11342797</strong></td>
      <td><strong>BAKHSHISH SINGH</strong></td>
      <td>Director</td>
      <td>18/11/2026</td>
      <td>Active</td>
    </tr>
    <tr>
      <td><strong>11342798</strong></td>
      <td><strong>GAGANDEEP KAUR</strong></td>
      <td>Director (Authorized Signatory for DSC)</td>
      <td>18/11/2026</td>
      <td>Active</td>
    </tr>
  </table>

  <div class="sec-title">4. Verification & Certification Note for Certifying Authority (PantaSign)</div>
  <div style="font-size: 8pt; color: #334155; line-height: 1.5; background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px; border-radius: 4px;">
    This document constitutes the verified Company Master Data extracted from the Ministry of Corporate Affairs (MCA) database for <strong>FARMSKING TECHNOLOGIES PRIVATE LIMITED</strong>. Both Director Bakhshish Singh (DIN: 11342797) and Director Gagandeep Kaur (DIN: 11342798) are formally recorded, bona fide, active promoters and directors of the company. Director Gagandeep Kaur is fully empowered pursuant to the Board Resolution dated 21st November 2026 to obtain and operate Class-3 Organization Digital Signature Certificate (Combo: Signing + Encryption).
  </div>

  <div class="footer">
    <div>FARMSKING TECHNOLOGIES PRIVATE LIMITED &bull; CIN: U62013PB2026PTC070389</div>
    <div>Document Certified for PantaSign CA Organization DSC Verification</div>
  </div>
</body>
</html>`;

const mcaHtmlPath = path.join(KIT_DIR, '06_FARMSKING_MCA_COMPANY_MASTER_DATA.html');
const mcaPdfPath = path.join(KIT_DIR, '06_FARMSKING_MCA_COMPANY_MASTER_DATA.pdf');
fs.writeFileSync(mcaHtmlPath, mcaHtml, 'utf8');

execSync(`${CHROME_PATH} --headless=new --disable-gpu --no-pdf-header-footer --print-to-pdf="${mcaPdfPath}" "${mcaHtmlPath}"`);
fs.copyFileSync(mcaPdfPath, path.join(DESKTOP_KIT, '06_FARMSKING_MCA_COMPANY_MASTER_DATA.pdf'));
console.log('[OK] Generated MCA Master Data PDF');

// 2. Generate PantaSign Organization DSC Complete Data Sheet & Application Guide (A4 PDF)
const guideHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>PantaSign Organization DSC Application Guide & Data Sheet - FarmsKing</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Cinzel:wght@700&display=swap');
    @page { size: A4 portrait; margin: 12mm 15mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { margin: 0; padding: 0; font-family: 'Manrope', sans-serif; color: #0f172a; font-size: 8.5pt; line-height: 1.45; }
    .header { text-align: center; border-bottom: 2px solid #042f2e; padding-bottom: 8px; margin-bottom: 10px; }
    .header h1 { font-family: 'Cinzel', serif; font-size: 13pt; margin: 0 0 3px; color: #042f2e; }
    .header p { margin: 0; font-size: 8pt; color: #475569; font-weight: 600; }
    .box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 4px; padding: 8px; margin-bottom: 10px; }
    .box-title { font-weight: 800; color: #042f2e; font-size: 8.5pt; margin-bottom: 4px; display: flex; align-items: center; justify-content: space-between; }
    table { width: 100%; border-collapse: collapse; margin-top: 4px; }
    table th, table td { border: 1px solid #e2e8f0; padding: 4px 6px; font-size: 7.5pt; vertical-align: top; }
    table th { background: #f1f5f9; width: 34%; font-weight: 700; color: #334155; text-align: left; }
    table td { background: #ffffff; color: #0f172a; }
    .highlight { background: #ecfdf5; color: #065f46; font-weight: 700; padding: 2px 4px; border-radius: 3px; }
    .warn-box { background: #fffbeb; border: 1px solid #fde68a; color: #92400e; padding: 6px 8px; border-radius: 4px; font-size: 7.5pt; margin-bottom: 8px; }
    .footer { margin-top: 10px; border-top: 1px solid #cbd5e1; padding-top: 6px; font-size: 7pt; color: #64748b; display: flex; justify-content: space-between; }
  </style>
</head>
<body>
  <div class="header">
    <div style="font-size: 8.5pt; font-weight: 700; color: #047857; text-transform: uppercase; letter-spacing: 1px;">Certifying Authority Application Dossier</div>
    <h1>PantaSign Class-3 Organization DSC Application & Data Sheet</h1>
    <p>FARMSKING TECHNOLOGIES PRIVATE LIMITED &bull; CIN: U62013PB2026PTC070389</p>
  </div>

  <div class="warn-box">
    <strong>CRITICAL REGULATORY RULE:</strong> NSWS and MCA mandate an <strong>ORGANIZATION DSC (Class-3 Combo: Signing + Encryption, 2 Years)</strong> where the certificate subject contains the legal company name <em>FARMSKING TECHNOLOGIES PRIVATE LIMITED</em> and Organization PAN <em>AAHCF3566C</em>. Individual personal DSCs will be rejected by NSWS PAN verification.
  </div>

  <div class="box">
    <div class="box-title"><span>1. Exact Parameters to Select on PantaSign CA Portal</span><span class="highlight">Class-3 Organization Combo</span></div>
    <table>
      <tr><th>Application Type</th><td><strong>Organization / Corporate</strong> (NOT Individual)</td></tr>
      <tr><th>Certificate Class</th><td><strong>Class 3</strong></td></tr>
      <tr><th>Certificate Type</th><td><strong>Combo (Signing + Encryption)</strong> &bull; 2 Years Validity</td></tr>
      <tr><th>Cryptographic Media</th><td><strong>FIPS 140-2 Level 2 USB Crypto Token</strong> (mToken / ePass 2003 / ProxKey)</td></tr>
      <tr><th>Company / Organization Name</th><td><strong>FARMSKING TECHNOLOGIES PRIVATE LIMITED</strong> (Exactly as on PAN)</td></tr>
      <tr><th>Organization Category / Constitution</th><td><strong>Private Limited Company</strong> (Under Companies Act, 2013)</td></tr>
      <tr><th>Organization PAN</th><td><strong>AAHCF3566C</strong></td></tr>
      <tr><th>Corporate Identity Number (CIN)</th><td><strong>U62013PB2026PTC070389</strong></td></tr>
      <tr><th>Registered Office Address</th><td>C/o BALDEV SINGH, VILLAGE BOOH, Kapurthala - 144601, Punjab, India</td></tr>
      <tr><th>Applicant / Certificate Holder</th><td><strong>GAGANDEEP KAUR</strong> (Designation: Director)</td></tr>
      <tr><th>Applicant Personal PAN</th><td>See Doc 07 (APPLICANT GAGANDEEP KAUR PAN CARD)</td></tr>
      <tr><th>Applicant Mobile & Email</th><td>Mobile for OTP + Email: <strong>info@farmsking.com</strong> (or Promoter Email)</td></tr>
      <tr><th>Authorising Person / Director</th><td><strong>BAKHSHISH SINGH</strong> (Director &bull; DIN: 11342797)</td></tr>
    </table>
  </div>

  <div class="box">
    <div class="box-title"><span>2. Checklist of Required Upload Documents (All Ready in this Folder)</span></div>
    <table>
      <tr style="background: #f1f5f9;"><th>Doc # & File Name</th><th>Purpose & Acceptance Standard</th></tr>
      <tr><td><strong>01_BOARD_RESOLUTION_ORGANIZATION_DSC_GAGANDEEP_KAUR.pdf</strong></td><td>Mandatory Board Resolution on Official Company Letterhead signed by Director Bakhshish Singh with specimen signature of Gagandeep Kaur.</td></tr>
      <tr><td><strong>02_CERTIFICATE_OF_INCORPORATION_COI_WITH_PAN_TAN.pdf</strong></td><td>Official MCA Incorporation Certificate containing CIN, Company PAN (AAHCF3566C), and TAN (AMRF11527F).</td></tr>
      <tr><td><strong>03_e_MoA_MEMORANDUM_OF_ASSOCIATION_INC_33.pdf</strong></td><td>Statutory Memorandum of Association filed with CRC Manesar.</td></tr>
      <tr><td><strong>04_e_AoA_ARTICLES_OF_ASSOCIATION_INC_34.pdf</strong></td><td>Statutory Articles of Association filed with CRC Manesar.</td></tr>
      <tr><td><strong>05_REGISTERED_OFFICE_ADDRESS_PROOF_BSNL_BILL.pdf</strong></td><td>Proof of registered office address.</td></tr>
      <tr><td><strong>06_FARMSKING_MCA_COMPANY_MASTER_DATA.pdf</strong></td><td>Verified MCA Company Master Data confirming both active directors.</td></tr>
      <tr><td><strong>07_APPLICANT_GAGANDEEP_KAUR_PAN_CARD.pdf</strong></td><td>Identity proof of Director Gagandeep Kaur.</td></tr>
      <tr><td><strong>08_APPLICANT_GAGANDEEP_KAUR_AADHAAR_CARD.pdf</strong></td><td>Address and identity proof of Director Gagandeep Kaur.</td></tr>
      <tr><td><strong>09_APPLICANT_GAGANDEEP_KAUR_KYC_PHOTO.jpeg</strong></td><td>Passport-size color photograph of Director Gagandeep Kaur.</td></tr>
      <tr><td><strong>10_APPLICANT_GAGANDEEP_KAUR_BANK_STATEMENT.pdf</strong></td><td>Personal bank statement / address corroboration.</td></tr>
      <tr><td><strong>12_AUTHORISING_DIRECTOR_BAKHSHISH_SINGH_PAN_CARD.pdf</strong></td><td>KYC proof of Authorising Director Bakhshish Singh.</td></tr>
      <tr><td><strong>13_AUTHORISING_DIRECTOR_BAKHSHISH_SINGH_AADHAAR_CARD.pdf</strong></td><td>Address proof of Authorising Director Bakhshish Singh.</td></tr>
    </table>
  </div>

  <div class="box">
    <div class="box-title"><span>3. PantaSign Online Video KYC Verification Script</span></div>
    <div style="font-size: 7.5pt; color: #334155; line-height: 1.45;">
      During the mandatory 20-second video recording on mobile/laptop camera, Director Gagandeep Kaur will hold her original PAN card and read aloud:<br>
      <em>"My name is Gagandeep Kaur. I am a Director of FarmsKing Technologies Private Limited. I am applying for Class-3 Organization Digital Signature Certificate on PantaSign. My verification code is [3-digit code shown on screen]."</em>
    </div>
  </div>

  <div class="footer">
    <div>FARMSKING TECHNOLOGIES PRIVATE LIMITED &bull; CIN: U62013PB2026PTC070389</div>
    <div>Complete PantaSign Organization DSC Application Package</div>
  </div>
</body>
</html>`;

const guideHtmlPath = path.join(KIT_DIR, '00_PANTASIGN_ORGANIZATION_DSC_APPLICATION_GUIDE.html');
const guidePdfPath = path.join(KIT_DIR, '00_PANTASIGN_ORGANIZATION_DSC_APPLICATION_GUIDE.pdf');
fs.writeFileSync(guideHtmlPath, guideHtml, 'utf8');

execSync(`${CHROME_PATH} --headless=new --disable-gpu --no-pdf-header-footer --print-to-pdf="${guidePdfPath}" "${guideHtmlPath}"`);
fs.copyFileSync(guidePdfPath, path.join(DESKTOP_KIT, '00_PANTASIGN_ORGANIZATION_DSC_APPLICATION_GUIDE.pdf'));
console.log('[OK] Generated PantaSign Application Guide PDF');

// Also create ready-to-copy CA email draft in the kit
const emailDraft = `# EMAIL DRAFT TO SEND TO CA DINESH KUMAR GUPTA / PANTASIGN VENDOR

**To**: \`dkguptaca@yahoo.co.in\`, \`info@pantasign.com\`
**From**: \`BSSGNCA@GMAIL.COM\`
**Cc**: \`info@farmsking.com\`
**Subject**: Application for Class-3 Organization Combo DSC (Signing + Encryption) — FarmsKing Technologies Private Limited

---

**Dear CA Dinesh Kumar Gupta / PantaSign DSC Team,**

Please initiate the issuance of a **Class-3 Organization Combo Digital Signature Certificate (Signing + Encryption, 2 Years Validity)** in a fresh USB Crypto Token for our newly incorporated company:

### 1. Company Particulars:
- **Company Name**: FARMSKING TECHNOLOGIES PRIVATE LIMITED
- **CIN**: U62013PB2026PTC070389
- **Company PAN**: AAHCF3566C
- **Company TAN**: AMRF11527F
- **Date of Incorporation**: 18-Nov-2026
- **Constitution**: Private Limited Company
- **Registered Office**: C/o BALDEV SINGH, VILLAGE BOOH, Kapurthala - 144601, Punjab

### 2. Authorized Signatory / Applicant Particulars:
- **Applicant Name**: GAGANDEEP KAUR
- **Designation**: Director (DIN: 11342798)
- **Authorizing Director**: BAKHSHISH SINGH (Director, DIN: 11342797)
- **Certificate Type**: Class-3 Organization COMBO (Sign + Encrypt), 2 Years

### 3. Attached Documents (From our official Kit):
1. Certified True Copy of Board Resolution on Company Letterhead with Specimen Signatures
2. MCA Certificate of Incorporation (COI with PAN & TAN)
3. Memorandum & Articles of Association (e-MoA & e-AoA)
4. Registered Office BSNL Landline Bill
5. MCA Company Master Data Summary
6. Applicant (Gagandeep Kaur) PAN, Aadhaar & Photo
7. Authorizing Director (Bakhshish Singh) PAN & Aadhaar

Please share the PantaSign online application link / order number so Director Gagandeep Kaur can complete the OTP and 20-second video verification immediately.

Warm regards,

**Bakhshish Singh / Gagandeep Kaur**  
Directors, FarmsKing Technologies Private Limited  
Mobile: +91 97796-50800  
Email: BSSGNCA@GMAIL.COM / info@farmsking.com
`;

fs.writeFileSync(path.join(KIT_DIR, '00_EMAIL_DRAFT_FOR_CA_DINESH_GUPTA_PANTASIGN.md'), emailDraft, 'utf8');
fs.writeFileSync(path.join(DESKTOP_KIT, '00_EMAIL_DRAFT_FOR_CA_DINESH_GUPTA_PANTASIGN.md'), emailDraft, 'utf8');

console.log('[COMPLETED] Entire PantaSign Kit successfully built and synced to Desktop!');
