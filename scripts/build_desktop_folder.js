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
  ShadingType,
  Header,
  Footer,
} = require('docx');

const desktopDir = path.join(process.env.USERPROFILE || 'C:\\Users\\hp', 'Desktop');
const targetFolder = path.join(desktopDir, 'FarmsKing Pvt Ltd');
const downloadsDir = path.join(process.env.USERPROFILE || 'C:\\Users\\hp', 'Downloads');

if (!fs.existsSync(targetFolder)) {
  fs.mkdirSync(targetFolder, { recursive: true });
}

// Helper to convert HTML to PDF via Headless Chrome
function htmlToPdf(htmlContent, outputPdfPath) {
  const tempHtmlPath = path.join(targetFolder, '_temp_print.html');
  fs.writeFileSync(tempHtmlPath, htmlContent, 'utf-8');
  try {
    execSync(`chrome.exe --headless --disable-gpu --run-all-compositor-stages-before-draw --print-to-pdf="${outputPdfPath}" "${tempHtmlPath}"`, { stdio: 'ignore' });
  } catch (e) {
    try {
      execSync(`powershell -Command "Start-Process -FilePath 'chrome.exe' -ArgumentList '--headless', '--disable-gpu', '--print-to-pdf=\\"${outputPdfPath}\\"', '\\"${tempHtmlPath}\\"' -Wait"`, { stdio: 'ignore' });
    } catch (err) {
      console.error('Error generating PDF:', err);
    }
  }
  if (fs.existsSync(tempHtmlPath)) {
    fs.unlinkSync(tempHtmlPath);
  }
}

// 1. Copy Downloads Files
const copyMap = [
  { src: 'AC6979718.pdf', dest: '01_SPICe_Part_A_Submitted_Form.pdf' },
  { src: 'custbill.php.pdf', dest: '02_Registered_Office_BSNL_Bill_OCT_2026.pdf' },
  { src: 'Gagandeep kaur UID.pdf', dest: '09_Gagandeep_Kaur_Aadhaar.pdf' },
  { src: 'PantaSign_ApplicationForm.pdf', dest: '10_PantaSign_DSC_Application_Form.pdf' },
  { src: 'bakshish pan.jpeg', dest: '11_Bakhshish_Singh_PAN.jpeg' },
  { src: 'bakshish passport.jpeg', dest: '12_Bakhshish_Singh_Passport.jpeg' },
  { src: 'bakshish  photo.jpeg', dest: '13_Bakhshish_Singh_Photo.jpeg' },
  { src: 'gagandeep kaur bank statement.pdf', dest: '14_Gagandeep_Kaur_Bank_Statement.pdf' },
  { src: 'Gagandeep kaur pan.jpeg', dest: '15_Gagandeep_Kaur_PAN.jpeg' },
  { src: 'Gagandeep kaur photo.jpeg', dest: '16_Gagandeep_Kaur_Photo.jpeg' }
];

copyMap.forEach(({ src, dest }) => {
  const srcPath = path.join(downloadsDir, src);
  const destPath = path.join(targetFolder, dest);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied: ${src} -> ${dest}`);
  }
});

// Also copy existing NOC docx
const existingNoc = path.join(desktopDir, 'FARMSKING_REGISTERED_OFFICE_NOC.docx');
const destNoc = path.join(targetFolder, '02_Registered_Office_NOC_Bakhshish_Singh.docx');
if (fs.existsSync(existingNoc)) {
  fs.copyFileSync(existingNoc, destNoc);
}

// HTML generator helper for clean executive PDFs
function getHtmlTemplate(title, subtitle, content) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page { size: A4; margin: 20mm 15mm 20mm 15mm; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #212121; line-height: 1.5; font-size: 13px; margin: 0; padding: 0; }
  .header-banner { border: 2px solid #1B5E20; background: #E8F5E9; padding: 12px; text-align: center; border-radius: 4px; margin-bottom: 20px; }
  .header-banner h1 { margin: 0 0 5px 0; color: #1B5E20; font-size: 18px; text-transform: uppercase; letter-spacing: 0.5px; }
  .header-banner p { margin: 0; color: #2E7D32; font-style: italic; font-size: 12px; }
  .meta-bar { font-size: 10px; color: #757575; text-align: right; border-bottom: 1px solid #E0E0E0; padding-bottom: 5px; margin-bottom: 15px; }
  .section-title { font-weight: bold; color: #0D47A1; margin-top: 15px; margin-bottom: 5px; font-size: 14px; text-transform: uppercase; border-bottom: 1px solid #BBDEFB; padding-bottom: 3px; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 12px; }
  th, td { border: 1px solid #E0E0E0; padding: 6px 10px; text-align: left; }
  th { background: #F5F5F5; color: #333; font-weight: 600; }
  .highlight-box { background: #F9FBE7; border: 1px solid #DCE775; border-left: 4px solid #827717; padding: 10px; margin: 12px 0; border-radius: 3px; }
  .footer { margin-top: 30px; font-size: 10px; color: #757575; text-align: center; border-top: 1px solid #E0E0E0; padding-top: 8px; }
  .signature-table { width: 100%; border: none; margin-top: 30px; }
  .signature-table td { border: none; padding: 10px; vertical-align: top; }
</style>
</head>
<body>
<div class="meta-bar">MINISTRY OF CORPORATE AFFAIRS (MCA) COMPLIANCE DOSSIER | SRN: AC6979718</div>
<div class="header-banner">
  <h1>${title}</h1>
  <p>${subtitle}</p>
</div>
${content}
<div class="footer">FarmsKing Technologies Private Limited (Under Incorporation) | MCA V3 SPICe+ Dossier</div>
</body>
</html>`;
}

// Generate PDF for NOC
const nocHtml = getHtmlTemplate(
  'NO OBJECTION CERTIFICATE (NOC) FOR REGISTERED OFFICE',
  '(Pursuant to Rule 25 of the Companies (Incorporation) Rules, 2014 & Section 12 of the Companies Act, 2013)',
  `
  <p><strong>TO,</strong><br>
  The Registrar of Companies (ROC), Punjab & Chandigarh /<br>
  The Central Registration Centre (CRC), Ministry of Corporate Affairs, Government of India.</p>

  <p><strong>SUBJECT:</strong> <span style="color:#0D47A1;">NO OBJECTION CERTIFICATE FOR USING PREMISES AS REGISTERED OFFICE OF "FARMSKING TECHNOLOGIES PRIVATE LIMITED" (MCA SRN: AC6979718).</span></p>

  <p>Respected Sir / Madam,</p>

  <p>I, <strong>BAKHSHISH SINGH</strong>, resident of Goindwal Sahib, Tehsil Khadoor Sahib, District Tarn Taran, Punjab, India, do hereby solemnly affirm, declare, and certify as under:</p>

  <p><strong>1. Absolute Possession & Lawful Authority:</strong> That I am the lawful owner / authorized occupant in possession of the commercial premises situated at:</p>
  
  <div class="highlight-box">
    <strong>M/s GURU NANAK COMPUTER ACADEMY</strong><br>
    NEAR CO-OPERATIVE BANK, GOINDWAL SAHIB,<br>
    TEHSIL: KHADOOR SAHIB, DISTRICT: TARN TARAN,<br>
    STATE: PUNJAB, INDIA — PIN CODE: 143422.
  </div>

  <p><strong>2. Grant of Unconditional No Objection:</strong> That I have <strong>NO OBJECTION</strong> whatsoever if the proposed company named <strong>"FARMSKING TECHNOLOGIES PRIVATE LIMITED"</strong> (or "FARMSKING AGRI SOLUTIONS PRIVATE LIMITED" or such other name approved by the Central Registration Centre under SRN: <strong>AC6979718</strong>) uses the aforesaid premises as its <strong>REGISTERED OFFICE</strong> for carrying on its corporate, administrative, software development, e-commerce, digital farming, and statutory business operations under the Companies Act, 2013.</p>

  <p><strong>3. Display of Name Board & Statutory Notices:</strong> That I hereby permit the company to paint, affix, and display its official name board, registered office banner, and Corporate Identity Number (CIN) outside and inside the said premises as required under Section 12(3) of the Companies Act, 2013.</p>

  <p><strong>4. Government Registrations & Banking:</strong> That I grant my full consent to the said company using this address for obtaining PAN, TAN, GSTIN, MSME (Udyam), Professional Tax, Startup India recognitions, and for opening Current Bank Accounts with scheduled commercial banks.</p>

  <p><strong>5. Utility Bill Evidence:</strong> In accordance with Rule 25(2)(c) of the Companies (Incorporation) Rules, 2014, the latest utility bill is attached herewith: <strong>BSNL Telephone / Fiber Tax Invoice (Account No: 1024846990, Invoice No: NDCPB2621596357, Dated: 03-OCT-2026)</strong> issued by Bharat Sanchar Nigam Limited, in the name of M/s Guru Nanak Computer Academy Bakhshish Singh at the aforesaid premises.</p>

  <p><strong>VERIFICATION:</strong><br>
  <em>I, the deponent above-named, do hereby verify that the contents of this No Objection Certificate are true and correct to the best of my knowledge and belief and nothing material has been concealed therein.</em></p>

  <table class="signature-table">
    <tr>
      <td style="width: 50%;">
        <strong>Date:</strong> 20 / 10 / 2026<br>
        <strong>Place:</strong> Goindwal Sahib, Tarn Taran (Punjab)<br><br>
        <strong>Attachments:</strong><br>
        1. BSNL Bill (Dated: 03-OCT-2026)<br>
        2. PAN Card of Bakhshish Singh<br>
        3. Aadhaar Card of Bakhshish Singh
      </td>
      <td style="width: 50%; text-align: right;">
        <strong>Signature of Owner / Occupant:</strong><br><br><br>
        ____________________________________<br>
        <strong style="color: #1B5E20; font-size: 14px;">BAKHSHISH SINGH</strong><br>
        <em>Proprietor / Authorized Occupant</em><br>
        Mobile: +91 97796-50800
      </td>
    </tr>
  </table>
  `
);
htmlToPdf(nocHtml, path.join(targetFolder, '02_Registered_Office_NOC_Bakhshish_Singh.pdf'));
console.log('Generated NOC PDF');

// 2. DIR-2 for Bakhshish Singh (Docx & PDF)
function makeDir2Doc(name, fatherName, address, email, mobile, pan, dob, filenameBase) {
  const dir2Html = getHtmlTemplate(
    'FORM DIR-2 — CONSENT TO ACT AS DIRECTOR',
    '(Pursuant to Section 152(5) of the Companies Act, 2013 & Rule 8 of Companies (Appointment & Qualification of Directors) Rules, 2014)',
    `
    <p><strong>TO,</strong><br>
    The Board of Directors / Promoters,<br>
    <strong>FARMSKING TECHNOLOGIES PRIVATE LIMITED</strong><br>
    (Under Incorporation | MCA SRN: AC6979718)<br>
    Registered Office: Near Co-operative Bank, Goindwal Sahib, Tehsil Khadoor Sahib, Tarn Taran, Punjab - 143422.</p>

    <p><strong>SUBJECT: CONSENT TO ACT AS DIRECTOR OF FARMSKING TECHNOLOGIES PRIVATE LIMITED</strong></p>

    <p>Respected Sirs / Board Members,</p>

    <p>I, <strong>${name}</strong>, resident of ${address}, hereby give my consent to act as Director of <strong>FARMSKING TECHNOLOGIES PRIVATE LIMITED</strong> pursuant to sub-section (5) of Section 152 of the Companies Act, 2013 and certify that I am not disqualified to become a Director under the Companies Act, 2013.</p>

    <table>
      <tr><th style="width:30%;">Particulars</th><th>Details</th></tr>
      <tr><td>1. Director Identification Number (DIN)</td><td>Applied for in SPICe+ Part B</td></tr>
      <tr><td>2. Full Name</td><td><strong>${name}</strong></td></tr>
      <tr><td>3. Father's Name</td><td>${fatherName}</td></tr>
      <tr><td>4. Residential Address</td><td>${address}</td></tr>
      <tr><td>5. Email Address</td><td>${email}</td></tr>
      <tr><td>6. Mobile Number</td><td>${mobile}</td></tr>
      <tr><td>7. PAN Card Number</td><td><strong>${pan}</strong></td></tr>
      <tr><td>8. Occupation</td><td>Business / Agriculture / IT Extension</td></tr>
      <tr><td>9. Date of Birth</td><td>${dob}</td></tr>
      <tr><td>10. Nationality</td><td>Indian</td></tr>
    </table>

    <div class="highlight-box">
      <strong>DECLARATION:</strong><br>
      1. I declare that I have not been convicted of any offence in connection with the promotion, formation, or management of any company or LLP.<br>
      2. I have not been found guilty of any fraud or misfeasance or of any breach of duty to any company under this Act or any previous company law in the last five years.<br>
      3. I further declare that if chosen as Director, I will not contravene any provisions of the Act or the rules made thereunder.
    </div>

    <table class="signature-table">
      <tr>
        <td style="width: 50%;">
          <strong>Date:</strong> 20 / 10 / 2026<br>
          <strong>Place:</strong> Punjab, India
        </td>
        <td style="width: 50%; text-align: right;">
          <strong>Signature:</strong><br><br><br>
          ____________________________________<br>
          <strong style="color:#1B5E20;">${name}</strong><br>
          <em>Director (Promoter & Subscriber)</em>
        </td>
      </tr>
    </table>
    `
  );
  htmlToPdf(dir2Html, path.join(targetFolder, `${filenameBase}.pdf`));

  // Word doc
  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: 'FORM DIR-2 — CONSENT TO ACT AS DIRECTOR', bold: true, size: 24, color: '1B5E20' })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [new TextRun({ text: '(Pursuant to Section 152(5) of the Companies Act, 2013 & Rule 8)', italics: true, size: 18 })]
        }),
        new Paragraph({ children: [new TextRun({ text: 'TO, The Board of Directors / Promoters, FARMSKING TECHNOLOGIES PRIVATE LIMITED', bold: true, size: 20 })] }),
        new Paragraph({ spacing: { after: 140 }, children: [new TextRun({ text: 'Registered Office: Near Co-operative Bank, Goindwal Sahib, Tarn Taran, Punjab - 143422', size: 18 })] }),
        new Paragraph({ spacing: { after: 140 }, children: [new TextRun({ text: 'I, ' + name + ', hereby give my consent to act as Director of FARMSKING TECHNOLOGIES PRIVATE LIMITED pursuant to sub-section (5) of Section 152 of the Companies Act, 2013 and certify that I am not disqualified to become a Director under the Companies Act, 2013.', size: 20 })] }),
        new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: '1. Name: ' + name, size: 20 })] }),
        new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: "2. Father's Name: " + fatherName, size: 20 })] }),
        new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: '3. Address: ' + address, size: 20 })] }),
        new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: '4. PAN: ' + pan, size: 20, bold: true })] }),
        new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: '5. Date of Birth: ' + dob, size: 20 })] }),
        new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: '6. Mobile: ' + mobile + ' | Email: ' + email, size: 20 })] }),
        new Paragraph({ spacing: { after: 200, before: 140 }, children: [new TextRun({ text: 'DECLARATION: I declare that I have not been convicted of any offence in connection with the promotion, formation or management of any company or LLP.', italics: true, size: 18 })] }),
        new Paragraph({ spacing: { before: 200 }, alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'Signature: __________________________\n' + name, bold: true, size: 20 })] })
      ]
    }]
  });
  Packer.toBuffer(doc).then(buf => fs.writeFileSync(path.join(targetFolder, `${filenameBase}.docx`), buf));
}

makeDir2Doc(
  'BAKHSHISH SINGH',
  'KASHMIR SINGH',
  'Village Amritpur, Tehsil Sultanpur Lodhi, District Kapurthala, Punjab - 144628',
  'bakhshishsingh@gmail.com',
  '9779650800',
  'CNNPS4562F',
  '13/04/1987',
  '03_DIR_2_Consent_Director_Bakhshish_Singh'
);

makeDir2Doc(
  'GAGANDEEP KAUR',
  'JASPAL SINGH',
  'Village Nangal, Post Office Makhu, Tehsil Zira, District Firozpur, Punjab - 142044',
  'gagandeepkpm@gmail.com',
  '8872491557',
  'JQOPK2470K',
  '01/01/1998',
  '04_DIR_2_Consent_Director_Gagandeep_Kaur'
);

// 3. Form INC-9 Declaration for All 3 Members
const inc9Html = getHtmlTemplate(
  'FORM INC-9 — STATUTORY DECLARATION BY FIRST DIRECTORS & SUBSCRIBERS',
  '(Pursuant to Section 7(1)(c) of the Companies Act, 2013 & Rule 15 of Companies (Incorporation) Rules, 2014)',
  `
  <p><strong>IN THE MATTER OF INCORPORATION OF "FARMSKING TECHNOLOGIES PRIVATE LIMITED"</strong><br>
  (MCA SRN: AC6979718 | Registered Office in the State of Punjab)</p>

  <p>We, the undersigned First Directors and Subscribers to the Memorandum of Association of <strong>FARMSKING TECHNOLOGIES PRIVATE LIMITED</strong>, do hereby solemnly declare, state, and affirm as follows:</p>

  <div class="highlight-box">
    <ol>
      <li><strong>No Criminal Conviction:</strong> That we have not been convicted of any offence in connection with the promotion, formation, or management of any company or LLP under the Companies Act, 2013 or any previous company law.</li>
      <li><strong>No Fraud or Breach of Duty:</strong> That we have not been found guilty of any fraud or misfeasance or of any breach of duty to any company under the Companies Act, 2013 or any previous company law during the preceding five years.</li>
      <li><strong>Completeness and Truth of Documents:</strong> That all the documents and information submitted to the Registrar of Companies (ROC) / Central Registration Centre (CRC) in Form SPICe+ (INC-32), e-MoA (INC-33), and e-AoA (INC-34) for incorporation of the company are correct, true, complete, and substantially accurate to the best of our knowledge and belief.</li>
    </ol>
  </div>

  <table>
    <tr>
      <th>Sr. No.</th>
      <th>Subscriber / Director Name</th>
      <th>Role in Company</th>
      <th>Shares Subscribed</th>
      <th>Equity (%)</th>
      <th>Signature / DSC</th>
    </tr>
    <tr>
      <td>1</td>
      <td><strong>SURINDER SINGH</strong></td>
      <td>Primary Promoter & Majority Shareholder</td>
      <td><strong>87,000</strong></td>
      <td><strong>87.00%</strong></td>
      <td>______________________</td>
    </tr>
    <tr>
      <td>2</td>
      <td><strong>BAKHSHISH SINGH</strong></td>
      <td>Executive Director & Shareholder</td>
      <td><strong>10,000</strong></td>
      <td><strong>10.00%</strong></td>
      <td>______________________</td>
    </tr>
    <tr>
      <td>3</td>
      <td><strong>GAGANDEEP KAUR</strong></td>
      <td>Executive Director & Shareholder</td>
      <td><strong>3,000</strong></td>
      <td><strong>3.00%</strong></td>
      <td>______________________</td>
    </tr>
    <tr>
      <td colspan="3"><strong>TOTAL AUTHORIZED & PAID-UP CAPITAL</strong></td>
      <td><strong>1,00,000</strong></td>
      <td><strong>100.00%</strong></td>
      <td><strong>(₹ 1,00,000 @ ₹1 each)</strong></td>
    </tr>
  </table>

  <p><strong>Date:</strong> 20 / 10 / 2026<br>
  <strong>Place:</strong> Goindwal Sahib, Punjab, India</p>
  `
);
htmlToPdf(inc9Html, path.join(targetFolder, '05_INC_9_Declaration_All_Subscribers_Directors.pdf'));

const inc9Doc = new Document({
  sections: [{
    children: [
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'FORM INC-9 — STATUTORY DECLARATION', bold: true, size: 24, color: '1B5E20' })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: '(Pursuant to Section 7(1)(c) of the Companies Act, 2013)', italics: true, size: 18 })] }),
      new Paragraph({ spacing: { after: 140 }, children: [new TextRun({ text: 'IN THE MATTER OF INCORPORATION OF FARMSKING TECHNOLOGIES PRIVATE LIMITED (SRN: AC6979718)', bold: true, size: 20 })] }),
      new Paragraph({ spacing: { after: 140 }, children: [new TextRun({ text: 'We, the undersigned First Directors and Subscribers to the Memorandum of Association, declare that we have not been convicted of any offence in connection with the promotion, formation or management of any company, and have not been found guilty of any fraud or misfeasance during the last 5 years.', size: 20 })] }),
      new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: '1. Surinder Singh — 87,000 Shares (87%) — Majority Shareholder', bold: true, size: 20 })] }),
      new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: '2. Bakhshish Singh — 10,000 Shares (10%) — Executive Director', bold: true, size: 20 })] }),
      new Paragraph({ spacing: { after: 140 }, children: [new TextRun({ text: '3. Gagandeep Kaur — 3,000 Shares (3%) — Executive Director', bold: true, size: 20 })] }),
      new Paragraph({ spacing: { before: 200 }, children: [new TextRun({ text: 'Total: 1,00,000 Shares of ₹1 each (Total ₹1,00,000)', bold: true, size: 20, color: '1B5E20' })] }),
      new Paragraph({ spacing: { before: 200 }, alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'Signatures: (1) Surinder Singh  (2) Bakhshish Singh  (3) Gagandeep Kaur', size: 18 })] })
    ]
  }]
});
Packer.toBuffer(inc9Doc).then(buf => fs.writeFileSync(path.join(targetFolder, '05_INC_9_Declaration_All_Subscribers_Directors.docx'), buf));

// 4. e-MoA Main Objects (Clause III A & B)
const moaHtml = getHtmlTemplate(
  'MEMORANDUM OF ASSOCIATION (e-MoA INC-33) — CLAUSE III OBJECTS',
  'FARMSKING TECHNOLOGIES PRIVATE LIMITED (Under Incorporation | MCA SRN: AC6979718)',
  `
  <div class="section-title">III. (A) THE OBJECTS TO BE PURSUED BY THE COMPANY ON ITS INCORPORATION ARE:</div>

  <p><strong>1. Digital Farming, Precision Agriculture & Agri-Tech SaaS Ecosystem:</strong><br>
  To design, develop, build, host, operate, own, maintain, license, and commercialize comprehensive digital agriculture, precision farming, and horticulture technology platforms, web portals, cloud computing software, and mobile applications under the brand name 'FarmsKing' or such other brand names, equipped with artificial intelligence (AI), machine learning (ML), computer vision, internet of things (IoT), satellite remote sensing, Normalized Difference Vegetation Index (NDVI) field telemetry, drone-based aerial crop scouting, automated smart irrigation scheduling, weather forecasting intelligence, farm ledger accounting, and precision agronomy systems for farmers, growers, horticulturists, terrace and home gardeners across India and internationally.</p>

  <p><strong>2. Promotion of Digital Farming, Agricultural Education & Skill Development:</strong><br>
  To actively promote, propagate, and advance modern digital farming techniques, precision agriculture, sustainable agricultural methodologies, and farm automation by establishing, conducting, and managing digital farmer training centers, agricultural literacy camps, rural skill development bootcamps, workshops, seminars, webinars, certification programs, audio-visual educational content, multi-lingual agricultural academies, mobile demonstration vans, and e-learning platforms; to train farmers, rural youth, women agriculturists, and farm workers in digital farm record keeping, smartphone-based farm management, soil fertility conservation, climate-smart agriculture, integrated pest management (IPM), micro-irrigation, and post-harvest management, thereby bridging the rural digital divide and enhancing agrarian productivity.</p>

  <p><strong>3. Lok Bhalai, Farmer Welfare & Rural Community Empowerment:</strong><br>
  To conceptualize, organize, implement, support, and administer public welfare, social upliftment, and community benefit programs ('Lok Bhalai') aimed at the holistic welfare, economic stability, and social security of small, marginal, and progressive farmers, tenant farmers, and rural farming communities; to set up farmer distress helplines, suicide prevention advisory desks, fair-price awareness campaigns, debt-management financial education, soil and groundwater conservation drives, organic and natural farming adoption drives; to facilitate capacity building, technical empowerment, and collective bargaining for Farmer Producer Organizations (FPOs), Self-Help Groups (SHGs), and primary agricultural cooperatives; to promote fair, transparent market practices preventing agrarian exploitation by middlemen; and to undertake corporate social responsibility (CSR), rural livelihood enhancements, and environmental stewardship projects for national agrarian prosperity.</p>

  <p><strong>4. Agri & Horticulture E-Commerce Marketplace & Direct Market Linkages:</strong><br>
  To establish, operate, manage, and facilitate an omnichannel electronic marketplace, e-commerce platform, direct-to-consumer (D2C), business-to-business (B2B), and business-to-consumer (B2C) digital supply chain network for buying, selling, marketing, importing, exporting, distributing, warehousing, delivering, and facilitating transaction of agricultural inputs, certified hybrid and indigenous seeds, organic fertilizers, bio-nutrients, bio-pesticides, micronutrients, drip and sprinkler irrigation machinery, farm implements, pruning tools, nursery plants, indoor/outdoor plants, potting media, terrace garden accessories, and post-harvest agricultural commodities; and to facilitate direct farm-to-fork and farm-to-market channels providing remunerative prices directly to farmers.</p>

  <p><strong>5. Tele-Advisory, Crop Doctor & Horticulture Expert Consultation Network:</strong><br>
  To establish, maintain, and operate interactive digital consultation platforms, tele-agronomy clinics, and digital diagnostic centers connecting registered farmers, kitchen gardeners, and orchard owners with qualified agricultural scientists, certified agronomists, horticulturists, plant pathologists, entomologists, and garden advisors; to provide automated and expert-verified diagnosis of crop and plant diseases, nutrient deficiencies, pest infestations, and physiological disorders; and to prescribe scientifically recommended organic, biological, and chemical remedial measures via Punjabi, Hindi, English, and regional language voice and chat interfaces.</p>

  <p><strong>6. Real-Time Mandi Price Intelligence, Crop Analytics & Financial Record Management:</strong><br>
  To collect, aggregate, process, verify, analyze, and disseminate real-time daily agricultural and horticultural market rates, mandi arrivals, Minimum Support Prices (MSP), future price trends, and demand-supply analytics from government mandis, APMCs, and private markets across India; to provide automated crop economics calculators, commission and interest computation engines for commission agents (arhtiyas), digital receipts, input cost vs. yield profitability tracking, and digital financial management tools enabling farming families to maintain accountable, profitable, and bankable farm balance sheets.</p>

  <div class="section-title">III. (B) MATTERS WHICH ARE NECESSARY FOR FURTHERANCE OF THE OBJECTS (ANCILLARY OBJECTS):</div>
  <p>1. To apply for, obtain, and protect intellectual property including patents, trademarks, copyrights for FarmsKing algorithms and AI systems.<br>
  2. To collaborate with State Agricultural Universities (PAU Ludhiana, ICAR), NABARD, KVKs, and Government bodies for farmer training.<br>
  3. To acquire and operate cloud infrastructure, satellite telemetry APIs, and payment gateways.<br>
  4. To open and operate banking accounts, obtain working capital credit, and conduct financial operations for the company.</p>
  `
);
htmlToPdf(moaHtml, path.join(targetFolder, '06_e_MoA_Clause_III_Main_Objects.pdf'));

const moaDoc = new Document({
  sections: [{
    children: [
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'MEMORANDUM OF ASSOCIATION (e-MoA INC-33)', bold: true, size: 24, color: '1B5E20' })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: 'FARMSKING TECHNOLOGIES PRIVATE LIMITED (MCA SRN: AC6979718)', bold: true, size: 20 })] }),
      new Paragraph({ spacing: { after: 140 }, children: [new TextRun({ text: 'CLAUSE III(A): MAIN OBJECTS TO BE PURSUED UPON INCORPORATION:', bold: true, size: 20, color: '0D47A1' })] }),
      new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: '1. Digital Farming, Precision Agriculture & SaaS Platform (AI, Satellite NDVI, Crop Doctor)', size: 18, bold: true })] }),
      new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: '2. Promotion of Sustainable Farming, Farmer Education & Youth Skilling Bootcamps', size: 18, bold: true })] }),
      new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: '3. Lok Bhalai, Small Farmer Welfare, Distress Helplines & Water/Soil Conservation', size: 18, bold: true })] }),
      new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: '4. Agri & Horticulture Multi-Seller E-Commerce Marketplace (Seeds, Bio-Nutrients, Tools, Plants)', size: 18, bold: true })] }),
      new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: '5. Tele-Advisory, Agronomist Tele-Consultations & Plant Pathology Clinics', size: 18, bold: true })] }),
      new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: '6. Real-Time Mandi Price Analytics, MSP Intelligence & Digital Farm Ledgers', size: 18, bold: true })] }),
      new Paragraph({ spacing: { before: 140, after: 120 }, children: [new TextRun({ text: 'CLAUSE III(B): ANCILLARY & INCIDENTAL OBJECTS (Research, IP Patents, Banking & University MoUs)', bold: true, size: 18, color: '0D47A1' })] })
    ]
  }]
});
Packer.toBuffer(moaDoc).then(buf => fs.writeFileSync(path.join(targetFolder, '06_e_MoA_Clause_III_Main_Objects.docx'), buf));

// 5. Finalized Shareholding Charter & Motive Summary
const motiveHtml = getHtmlTemplate(
  'FARMSKING TECHNOLOGIES PRIVATE LIMITED — LEGAL & SHAREHOLDING CHARTER',
  'Incorporation Summary & Statutory Allocation (MCA SRN: AC6979718)',
  `
  <table>
    <tr><th colspan="2" style="background:#E8F5E9; color:#1B5E20; font-size:14px;">1. CORPORATE & REGISTRATION SUMMARY</th></tr>
    <tr><td style="width:35%;"><strong>Proposed Name 1</strong></td><td><strong>FARMSKING TECHNOLOGIES PRIVATE LIMITED</strong> (Approved Preference)</td></tr>
    <tr><td><strong>Proposed Name 2</strong></td><td>FARMSKING AGROTECH PRIVATE LIMITED (Secondary Preference)</td></tr>
    <tr><td><strong>Service Request Number (SRN)</strong></td><td><strong>AC6979718</strong> (Filing Date: 20-OCT-2026)</td></tr>
    <tr><td><strong>Class / Category</strong></td><td>Private Company Limited by Shares (Non-government Company)</td></tr>
    <tr><td><strong>Primary Industrial Codes (NIC)</strong></td><td><strong>62013</strong> (Software/Web Platform) & <strong>01619</strong> (Agricultural Support Services)</td></tr>
    <tr><td><strong>Registered Office</strong></td><td>Near Co-operative Bank, Goindwal Sahib, Tehsil Khadoor Sahib, Tarn Taran, Punjab - 143422</td></tr>
    <tr><td><strong>Utility Service Proof</strong></td><td>BSNL Telephone/Fiber Tax Invoice (NDCPB2621596357, Dated 03-OCT-2026)</td></tr>
    <tr><td><strong>Designated Corporate Bank</strong></td><td>ICICI Bank / HDFC Bank Current Account via AGILE-PRO-S</td></tr>
  </table>

  <table>
    <tr><th colspan="5" style="background:#E8F5E9; color:#1B5E20; font-size:14px;">2. FINALIZED CAPITAL & SHAREHOLDING ROSTER</th></tr>
    <tr>
      <th>Member Name</th>
      <th>Role in Company</th>
      <th>Shares Allocated</th>
      <th>Face Value</th>
      <th>Equity (%) & Control</th>
    </tr>
    <tr>
      <td><strong>SURINDER SINGH</strong></td>
      <td>Primary Promoter & Majority Owner</td>
      <td><strong>87,000</strong></td>
      <td>₹ 1 each</td>
      <td><strong>87.00% (Supreme Veto Control > 75%)</strong></td>
    </tr>
    <tr>
      <td><strong>BAKHSHISH SINGH</strong></td>
      <td>Executive Director 1</td>
      <td><strong>10,000</strong></td>
      <td>₹ 1 each</td>
      <td><strong>10.00% (Working Director)</strong></td>
    </tr>
    <tr>
      <td><strong>GAGANDEEP KAUR</strong></td>
      <td>Executive Director 2</td>
      <td><strong>3,000</strong></td>
      <td>₹ 1 each</td>
      <td><strong>3.00% (Working Director)</strong></td>
    </tr>
    <tr>
      <td colspan="2"><strong>TOTAL CAPITAL</strong></td>
      <td><strong>1,00,000 Shares</strong></td>
      <td><strong>₹ 1 each</strong></td>
      <td><strong>₹ 1,00,000 (100.00%)</strong></td>
    </tr>
  </table>

  <div class="highlight-box">
    <strong>KEY LEGAL ADVANTAGES OF THIS ROSTER:</strong><br>
    • <strong>Supreme Protection for Surinder Singh:</strong> Holding 87.00% equity grants absolute statutory control (>75% special resolution supermajority) over the company's constitution, banking operations, and investment decisions.<br>
    • <strong>MCA Statutory Compliance:</strong> Strictly satisfies the mandatory legal minimum requirement of 2 Working Directors (Bakhshish Singh & Gagandeep Kaur) and 2 Shareholders.
  </div>
  `
);
htmlToPdf(motiveHtml, path.join(targetFolder, '07_Company_Registration_Motive_and_Shareholding_Summary.pdf'));

const motiveDoc = new Document({
  sections: [{
    children: [
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'FARMSKING TECHNOLOGIES PRIVATE LIMITED', bold: true, size: 24, color: '1B5E20' })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: 'FINALIZED CAPITAL & SHAREHOLDING CHARTER (MCA SRN: AC6979718)', bold: true, size: 20 })] }),
      new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: 'Total Authorized & Paid-Up Capital: ₹ 1,00,000 (1,00,000 Equity Shares of ₹1 each)', bold: true, size: 20, color: '0D47A1' })] }),
      new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: '1. Surinder Singh: 87,000 Shares (87.00%) — Supreme Controlling Owner (>75% Veto Control)', bold: true, size: 20 })] }),
      new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: '2. Bakshish Singh: 10,000 Shares (10.00%) — Executive Director (DIN & DSC Holder)', bold: true, size: 20 })] }),
      new Paragraph({ spacing: { after: 140 }, children: [new TextRun({ text: '3. Gagandeep Kaur: 3,000 Shares (3.00%) — Executive Director (DIN & DSC Holder)', bold: true, size: 20 })] }),
      new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: 'Registered Office: Near Co-operative Bank, Goindwal Sahib, Tehsil Khadoor Sahib, Tarn Taran, Punjab - 143422', size: 18 })] }),
      new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: 'Utility Bill: BSNL Fiber/Telephone Invoice dated 03-OCT-2026', size: 18 })] })
    ]
  }]
});
Packer.toBuffer(motiveDoc).then(buf => fs.writeFileSync(path.join(targetFolder, '07_Company_Registration_Motive_and_Shareholding_Summary.docx'), buf));

// Copy promoter details if available
const promoterDocxSrc = path.join('d:\\FarmsKing', 'farmsking_tinne_person_details.docx');
const promoterDocxDest = path.join(targetFolder, '08_All_Three_Promoters_Details.docx');
if (fs.existsSync(promoterDocxSrc)) {
  fs.copyFileSync(promoterDocxSrc, promoterDocxDest);
}

// 6. Organize into Person-Specific and Company Folders
const coDir = path.join(targetFolder, '01_Company_and_Statutory_Documents');
const bakDir = path.join(targetFolder, '02_Bakhshish_Singh_Director');
const gagDir = path.join(targetFolder, '03_Gagandeep_Kaur_Director');
const surDir = path.join(targetFolder, '04_Surinder_Singh_Founder');

[coDir, bakDir, gagDir, surDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Company documents mapping
const coDocs = [
  '01_SPICe_Part_A_Submitted_Form.pdf',
  '02_Registered_Office_BSNL_Bill_OCT_2026.pdf',
  '02_Registered_Office_NOC_Bakhshish_Singh.pdf',
  '02_Registered_Office_NOC_Bakhshish_Singh.docx',
  '05_INC_9_Declaration_All_Subscribers_Directors.pdf',
  '05_INC_9_Declaration_All_Subscribers_Directors.docx',
  '06_e_MoA_Clause_III_Main_Objects.pdf',
  '06_e_MoA_Clause_III_Main_Objects.docx',
  '07_Company_Registration_Motive_and_Shareholding_Summary.pdf',
  '07_Company_Registration_Motive_and_Shareholding_Summary.docx',
  '08_All_Three_Promoters_Details.docx'
];
coDocs.forEach(f => {
  const src = path.join(targetFolder, f);
  if (fs.existsSync(src)) fs.copyFileSync(src, path.join(coDir, f));
});
if (fs.existsSync('d:\\FarmsKing\\FARMSKING_INDIA_PVT_LTD_CA_DOSSIER.md')) {
  fs.copyFileSync('d:\\FarmsKing\\FARMSKING_INDIA_PVT_LTD_CA_DOSSIER.md', path.join(coDir, 'FARMSKING_INDIA_PVT_LTD_CA_DOSSIER.md'));
}
if (fs.existsSync('d:\\FarmsKing\\COMPANY_REGISTRATION_MOTIVE.md')) {
  fs.copyFileSync('d:\\FarmsKing\\COMPANY_REGISTRATION_MOTIVE.md', path.join(coDir, 'COMPANY_REGISTRATION_MOTIVE.md'));
}

// Bakhshish Singh mapping
const bakMap = [
  { src: '11_Bakhshish_Singh_PAN.jpeg', dest: '01_Bakhshish_Singh_PAN_Card.jpeg' },
  { src: '12_Bakhshish_Singh_Passport.jpeg', dest: '02_Bakhshish_Singh_Passport_Address_Proof.jpeg' },
  { src: '13_Bakhshish_Singh_Photo.jpeg', dest: '03_Bakhshish_Singh_KYC_Photo.jpeg' },
  { src: '03_DIR_2_Consent_Director_Bakhshish_Singh.pdf', dest: '05_DIR_2_Consent_Director_Bakhshish_Singh.pdf' },
  { src: '03_DIR_2_Consent_Director_Bakhshish_Singh.docx', dest: '05_DIR_2_Consent_Director_Bakhshish_Singh.docx' },
  { src: '10_PantaSign_DSC_Application_Form.pdf', dest: '06_PantaSign_DSC_Application_Form.pdf' },
  { src: '02_Registered_Office_NOC_Bakhshish_Singh.pdf', dest: '07_Registered_Office_NOC_Signed_Copy.pdf' }
];
bakMap.forEach(({ src, dest }) => {
  const s = path.join(targetFolder, src);
  if (fs.existsSync(s)) fs.copyFileSync(s, path.join(bakDir, dest));
});
const bakUidFront = path.join(downloadsDir, 'bakshish uid front.jpeg');
const bakUidBack = path.join(downloadsDir, 'bakshish uid back.jpeg');
if (fs.existsSync(bakUidFront)) {
  fs.copyFileSync(bakUidFront, path.join(bakDir, '04_Bakhshish_Singh_Aadhaar_Front.jpeg'));
}
if (fs.existsSync(bakUidBack)) {
  fs.copyFileSync(bakUidBack, path.join(bakDir, '04_Bakhshish_Singh_Aadhaar_Back.jpeg'));
}
const bakUidPdf = path.join(targetFolder, '04_Bakhshish_Singh_Aadhaar_Both_Sides_MCA_Ready.pdf');
if (fs.existsSync(bakUidPdf)) {
  fs.copyFileSync(bakUidPdf, path.join(bakDir, '04_Bakhshish_Singh_Aadhaar_Both_Sides_MCA_Ready.pdf'));
}

// Gagandeep Kaur mapping
const gagMap = [
  { src: '15_Gagandeep_Kaur_PAN.jpeg', dest: '01_Gagandeep_Kaur_PAN_Card.jpeg' },
  { src: '09_Gagandeep_Kaur_Aadhaar.pdf', dest: '02_Gagandeep_Kaur_Aadhaar_Both_Sides.pdf' },
  { src: '14_Gagandeep_Kaur_Bank_Statement.pdf', dest: '03_Gagandeep_Kaur_Bank_Statement_SBI.pdf' },
  { src: '16_Gagandeep_Kaur_Photo.jpeg', dest: '04_Gagandeep_Kaur_KYC_Photo.jpeg' },
  { src: '04_DIR_2_Consent_Director_Gagandeep_Kaur.pdf', dest: '05_DIR_2_Consent_Director_Gagandeep_Kaur.pdf' },
  { src: '04_DIR_2_Consent_Director_Gagandeep_Kaur.docx', dest: '05_DIR_2_Consent_Director_Gagandeep_Kaur.docx' }
];
gagMap.forEach(({ src, dest }) => {
  const s = path.join(targetFolder, src);
  if (fs.existsSync(s)) fs.copyFileSync(s, path.join(gagDir, dest));
});

// Master JSON persistence (isolated in Govt)
const masterJson = path.join('d:\\FarmsKing', 'Govt', 'statutory_promoters_master_data.json');
if (fs.existsSync(masterJson)) {
  fs.copyFileSync(masterJson, path.join(coDir, 'STATUTORY_PROMOTERS_MASTER_DATA.json'));
}

console.log('ALL FILES, RESIGNATION LETTERS & PERSON FOLDERS BUILT SUCCESSFULLY IN: ' + targetFolder);
