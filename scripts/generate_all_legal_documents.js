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

const chromePath = '"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"';
const govtDocs = path.join('d:\\FarmsKing', 'Govt', 'docs');
const desktopDir = path.join(process.env.USERPROFILE || 'C:\\Users\\hp', 'Desktop', 'FarmsKing Pvt Ltd');

if (!fs.existsSync(desktopDir)) {
  fs.mkdirSync(desktopDir, { recursive: true });
}

// Legal Page Settings in Twips for docx: 8.5" x 14"
const LEGAL_PAGE_DOCX = {
  size: {
    width: 12240,  // 8.5 * 1440
    height: 20160, // 14.0 * 1440
  },
  margin: {
    top: 1000,
    bottom: 1000,
    left: 1200,
    right: 1200,
  },
};

// HTML to PDF Helper for Legal Size
function htmlToPdfLegal(htmlContent, outputPdfPath) {
  const tempHtml = path.join(__dirname, `_temp_${Date.now()}_${Math.random().toString(36).substring(7)}.html`);
  fs.writeFileSync(tempHtml, htmlContent, 'utf-8');
  try {
    execSync(`${chromePath} --headless --disable-gpu --run-all-compositor-stages-before-draw --print-to-pdf="${outputPdfPath}" "${tempHtml}"`, { stdio: 'ignore' });
  } catch (err) {
    console.error('Error generating PDF:', err);
  }
  if (fs.existsSync(tempHtml)) {
    fs.unlinkSync(tempHtml);
  }
}

// Master HTML Template for Legal Size
function getLegalHtmlTemplate(title, subtitle, content, isSinglePage = false) {
  const bodyFontSize = isSinglePage ? '11.5px' : '12.5px';
  const lineHeight = isSinglePage ? '1.32' : '1.45';
  const bannerPadding = isSinglePage ? '7px 10px' : '10px 12px';
  const bannerTitleSize = isSinglePage ? '15px' : '17px';
  const pageMargin = isSinglePage ? '10mm 14mm 10mm 14mm' : '15mm 15mm 15mm 15mm';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
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
  .footer { 
    margin-top: 10px; 
    font-size: 9px; 
    color: #757575; 
    text-align: center; 
    border-top: 1px solid #E0E0E0; 
    padding-top: 4px; 
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
<div class="footer">FARMSKING TECHNOLOGIES PRIVATE LIMITED | MCA SRN: AC6979718 | REGISTERED WITH ROC PUNJAB & CHANDIGARH</div>
</body>
</html>`;
}

// ==========================================
// 1. GENERATE NOC (EXACTLY 1 SINGLE PAGE)
// ==========================================
console.log('Generating 1-Page Legal NOC...');
const nocHtml = getLegalHtmlTemplate(
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
  true // Single Page Flag
);

const nocPdfPath1 = path.join(govtDocs, '01_Company_Registration_MCA', '03_Registered_Office_NOC_Bakhshish_Singh.pdf');
const nocPdfPath2 = path.join(desktopDir, '02_Registered_Office_NOC_Bakhshish_Singh.pdf');
htmlToPdfLegal(nocHtml, nocPdfPath1);
if (fs.existsSync(desktopDir)) fs.copyFileSync(nocPdfPath1, nocPdfPath2);

// Word Doc for NOC on Legal Size
const borderNone = {
  top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
};
const borderBox = {
  top: { style: BorderStyle.SINGLE, size: 12, color: '1B5E20' },
  bottom: { style: BorderStyle.SINGLE, size: 12, color: '1B5E20' },
  left: { style: BorderStyle.SINGLE, size: 12, color: '1B5E20' },
  right: { style: BorderStyle.SINGLE, size: 12, color: '1B5E20' },
};

const nocDoc = new Document({
  sections: [{
    properties: { page: LEGAL_PAGE_DOCX },
    headers: {
      default: new Header({
        children: [
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: 'FORM SPICe+ (INC-32) STATUTORY ATTACHMENT | RULE 25 COMPLIANT', size: 16, color: '757575' })]
          })
        ]
      })
    },
    footers: {
      default: new Footer({
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'FarmsKing Technologies Private Limited | MCA SRN: AC6979718 | Legal Size Document', size: 16, color: '757575' })]
          })
        ]
      })
    },
    children: [
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                borders: borderBox,
                shading: { fill: 'E8F5E9', type: ShadingType.CLEAR },
                children: [
                  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'NO OBJECTION CERTIFICATE (NOC) FOR REGISTERED OFFICE', bold: true, size: 24, color: '1B5E20' })] }),
                  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '(Pursuant to Rule 25 of the Companies (Incorporation) Rules, 2014 & Section 12 of Companies Act, 2013)', italics: true, size: 18, color: '2E7D32' })] })
                ]
              })
            ]
          })
        ]
      }),
      new Paragraph({ spacing: { before: 140, after: 60 }, children: [new TextRun({ text: 'TO, The Registrar of Companies (ROC), Punjab & Chandigarh / CRC Manesar, MCA, India.', bold: true, size: 20 })] }),
      new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: 'SUBJECT: NO OBJECTION CERTIFICATE FOR REGISTERED OFFICE OF FARMSKING TECHNOLOGIES PRIVATE LIMITED (SRN: AC6979718)', bold: true, size: 20, color: '0D47A1' })] }),
      new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: 'I, BAKHSHISH SINGH, resident of Village Amritpur, Tehsil Sultanpur Lodhi, District Kapurthala, Punjab - 144628, do hereby solemnly declare and state as under:', size: 20 })] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: '1. Lawful Possession: That I am the lawful owner in possession of commercial premises situated at M/s Guru Nanak Computer Academy, Near Co-operative Bank, Goindwal Sahib, Tehsil Khadoor Sahib, District Tarn Taran, Punjab - 143422.', size: 20 })] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: '2. Grant of NOC: That I have NO OBJECTION to FARMSKING TECHNOLOGIES PRIVATE LIMITED using the aforesaid premises as its REGISTERED OFFICE.', size: 20, bold: true })] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: '3. Display of Name Board: I permit the company to display its name board and CIN outside the premises as per Section 12(3).', size: 20 })] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: '4. Banking & Registrations: I permit the use of this address for PAN, TAN, GSTIN, MSME, and ICICI Bank Makhu Branch account operations.', size: 20 })] }),
      new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: '5. Utility Bill: BSNL Fiber invoice (Account No: 1024846990, Dated: 03-OCT-2026) in my name is attached.', size: 20 })] }),
      new Paragraph({ spacing: { after: 140 }, children: [new TextRun({ text: 'VERIFICATION: Verified that the contents are true and correct to the best of my knowledge and belief.', italics: true, size: 18 })] }),
      new Paragraph({ spacing: { before: 180 }, alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'Signature: ___________________________\nBAKHSHISH SINGH (Owner / Authorized Occupant)\nDate: 22/10/2026 | Place: Goindwal Sahib, Tarn Taran', bold: true, size: 20 })] })
    ]
  }]
});
const nocDocxPath1 = path.join(govtDocs, '01_Company_Registration_MCA', '03_Registered_Office_NOC_Bakhshish_Singh.docx');
const nocDocxPath2 = path.join(desktopDir, '02_Registered_Office_NOC_Bakhshish_Singh.docx');
Packer.toBuffer(nocDoc).then(buf => {
  fs.writeFileSync(nocDocxPath1, buf);
  if (fs.existsSync(desktopDir)) fs.writeFileSync(nocDocxPath2, buf);
});

// ==========================================
// 2. GENERATE DIR-2 FOR BOTH DIRECTORS (1 PAGE LEGAL)
// ==========================================
function makeDir2Legal(name, fatherName, address, email, mobile, pan, dob, filenameBase, outFolderRel) {
  console.log(`Generating 1-Page Legal DIR-2 for ${name}...`);
  const html = getLegalHtmlTemplate(
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

  const pdfDest = path.join(govtDocs, outFolderRel, `${filenameBase}.pdf`);
  htmlToPdfLegal(html, pdfDest);

  const doc = new Document({
    sections: [{
      properties: { page: LEGAL_PAGE_DOCX },
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'FORM DIR-2 — CONSENT TO ACT AS DIRECTOR', bold: true, size: 24, color: '1B5E20' })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 180 }, children: [new TextRun({ text: '(Pursuant to Section 152(5) of the Companies Act, 2013 & Rule 8)', italics: true, size: 18 })] }),
        new Paragraph({ children: [new TextRun({ text: 'TO, The Board of Directors, FARMSKING TECHNOLOGIES PRIVATE LIMITED (SRN: AC6979718)', bold: true, size: 20 })] }),
        new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: 'I, ' + name + ', hereby give my consent to act as Director of FARMSKING TECHNOLOGIES PRIVATE LIMITED.', size: 20 })] }),
        new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: '1. Name: ' + name + ' | PAN: ' + pan, bold: true, size: 20 })] }),
        new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "2. Father's Name: " + fatherName, size: 20 })] }),
        new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: '3. Address: ' + address, size: 20 })] }),
        new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: '4. DOB: ' + dob + ' | Nationality: Indian', size: 20 })] }),
        new Paragraph({ spacing: { after: 140 }, children: [new TextRun({ text: 'DECLARATION: I certify that I am not disqualified to become a director under Companies Act 2013.', italics: true, size: 18 })] }),
        new Paragraph({ spacing: { before: 180 }, alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'Signature: ___________________________\n' + name + ' (Director)', bold: true, size: 20 })] })
      ]
    }]
  });
  const docxDest = path.join(govtDocs, outFolderRel, `${filenameBase}.docx`);
  Packer.toBuffer(doc).then(buf => fs.writeFileSync(docxDest, buf));
}

makeDir2Legal(
  'BAKHSHISH SINGH',
  'KASHMIR SINGH',
  'Village Amritpur, Tehsil Sultanpur Lodhi, District Kapurthala, Punjab - 144628',
  'bakhshishsingh@gmail.com',
  '+91 97796-50800',
  'CNNPS4562F',
  '13/04/1987',
  '05_DIR_2_Consent_Director_Bakhshish_Singh',
  '02_Bakhshish_Singh_Director'
);

makeDir2Legal(
  'GAGANDEEP KAUR',
  'JASPAL SINGH',
  'Village Nangal, Post Office Makhu, Tehsil Zira, District Firozpur, Punjab - 142044',
  'gagandeepkpm@gmail.com',
  '+91 88724-91557',
  'JQOPK2470K',
  '01/01/1998',
  '05_DIR_2_Consent_Director_Gagandeep_Kaur',
  '03_Gagandeep_Kaur_Director'
);

// ==========================================
// 3. GENERATE INC-9 DECLARATION (1 PAGE LEGAL)
// 100,000 SHARES @ RS 1 EACH = RS 1,00,000
// ==========================================
console.log('Generating 1-Page Legal INC-9 Declaration...');
const inc9Html = getLegalHtmlTemplate(
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

const inc9PdfPath = path.join(govtDocs, '01_Company_Registration_MCA', '04_INC_9_Declaration_All_Subscribers_Directors.pdf');
htmlToPdfLegal(inc9Html, inc9PdfPath);

const inc9Doc = new Document({
  sections: [{
    properties: { page: LEGAL_PAGE_DOCX },
    children: [
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'FORM INC-9 — STATUTORY DECLARATION', bold: true, size: 24, color: '1B5E20' })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 180 }, children: [new TextRun({ text: '(Pursuant to Section 7(1)(c) of the Companies Act, 2013)', italics: true, size: 18 })] }),
      new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: 'IN THE MATTER OF INCORPORATION OF FARMSKING TECHNOLOGIES PRIVATE LIMITED (SRN: AC6979718)', bold: true, size: 20 })] }),
      new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: 'We, the undersigned First Directors and Subscribers, declare that all documents submitted are true, complete and accurate to the best of our knowledge.', size: 20 })] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: '1. Surinder Singh — 87,000 Shares of ₹1 each (₹ 87,000) — 87.00%', bold: true, size: 20 })] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: '2. Bakhshish Singh — 10,000 Shares of ₹1 each (₹ 10,000) — 10.00%', bold: true, size: 20 })] }),
      new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: '3. Gagandeep Kaur — 3,000 Shares of ₹1 each (₹ 3,000) — 3.00%', bold: true, size: 20 })] }),
      new Paragraph({ spacing: { after: 140 }, children: [new TextRun({ text: 'TOTAL AUTHORIZED & SUBSCRIBED: 1,00,000 Shares of ₹ 1.00 each = ₹ 1,00,000.00', bold: true, size: 20, color: '1B5E20' })] }),
      new Paragraph({ spacing: { before: 180 }, alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'Signatures: (1) Surinder Singh  (2) Bakhshish Singh  (3) Gagandeep Kaur', size: 20, bold: true })] })
    ]
  }]
});
const inc9DocxPath = path.join(govtDocs, '01_Company_Registration_MCA', '04_INC_9_Declaration_All_Subscribers_Directors.docx');
Packer.toBuffer(inc9Doc).then(buf => fs.writeFileSync(inc9DocxPath, buf));

// ==========================================
// 4. GENERATE CAPITAL STRUCTURE & SHARE SUBSCRIPTION SCHEDULE
// ==========================================
console.log('Generating Legal Capital Structure Schedule (1,00,000 Shares @ Rs 1)...');
const capitalHtml = getLegalHtmlTemplate(
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

const capPdfPath = path.join(govtDocs, '01_Company_Registration_MCA', '06_Capital_Structure_and_Share_Subscription_Schedule.pdf');
htmlToPdfLegal(capitalHtml, capPdfPath);

console.log('ALL LEGAL DOCUMENTS SUCCESSFULLY GENERATED & SAVED IN GOVT/DOCS!');
