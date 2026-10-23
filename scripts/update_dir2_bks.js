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
} = require('docx');

const targetFolder = 'C:\\Users\\hp\\Desktop\\FarmsKing Pvt Ltd';

// Re-generate DIR-2 for Bakhshish Singh with exact verified details
const name = 'BAKHSHISH SINGH';
const fatherName = 'KASHMIR SINGH';
const address = 'Village Amritpur, Tehsil Sultanpur Lodhi, District Kapurthala, Punjab, India - 144628';
const email = 'bakhshishsingh@gmail.com';
const mobile = '9872066901';
const pan = 'CNNPS4562F';
const dob = '13/04/1987';
const aadhaar = '2374 1230 4003';
const passport = 'N8727830';
const filenameBase = '03_DIR_2_Consent_Director_Bakhshish_Singh';

const dir2Html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page { size: A4; margin: 20mm 15mm 20mm 15mm; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #212121; line-height: 1.5; font-size: 13px; margin: 0; padding: 0; }
  .header-banner { border: 2px solid #1B5E20; background: #E8F5E9; padding: 12px; text-align: center; border-radius: 4px; margin-bottom: 20px; }
  .header-banner h1 { margin: 0 0 5px 0; color: #1B5E20; font-size: 18px; text-transform: uppercase; }
  .header-banner p { margin: 0; color: #2E7D32; font-style: italic; font-size: 12px; }
  .meta-bar { font-size: 10px; color: #757575; text-align: right; border-bottom: 1px solid #E0E0E0; padding-bottom: 5px; margin-bottom: 15px; }
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
  <h1>FORM DIR-2 — CONSENT TO ACT AS DIRECTOR</h1>
  <p>(Pursuant to Section 152(5) of the Companies Act, 2013 & Rule 8 of Companies (Appointment & Qualification of Directors) Rules, 2014)</p>
</div>

<p><strong>TO,</strong><br>
The Board of Directors / Promoters,<br>
<strong>FARMSKING TECHNOLOGIES PRIVATE LIMITED</strong><br>
(Under Incorporation | MCA SRN: AC6979718)<br>
Registered Office: Near Co-operative Bank, Goindwal Sahib, Tehsil Khadoor Sahib, Tarn Taran, Punjab - 143422.</p>

<p><strong>SUBJECT: CONSENT TO ACT AS DIRECTOR OF FARMSKING TECHNOLOGIES PRIVATE LIMITED</strong></p>

<p>Respected Sirs / Board Members,</p>

<p>I, <strong>${name}</strong>, resident of ${address}, hereby give my consent to act as Director of <strong>FARMSKING TECHNOLOGIES PRIVATE LIMITED</strong> pursuant to sub-section (5) of Section 152 of the Companies Act, 2013 and certify that I am not disqualified to become a Director under the Companies Act, 2013.</p>

<table>
  <tr><th style="width:35%;">Particulars</th><th>Verified Statutory Details</th></tr>
  <tr><td>1. Director Identification Number (DIN)</td><td>Applied for in SPICe+ Part B</td></tr>
  <tr><td>2. Full Name</td><td><strong>${name}</strong></td></tr>
  <tr><td>3. Father's Name</td><td><strong>${fatherName}</strong></td></tr>
  <tr><td>4. Residential Address</td><td>${address}</td></tr>
  <tr><td>5. Date of Birth</td><td><strong>${dob}</strong></td></tr>
  <tr><td>6. PAN Card Number</td><td><strong>${pan}</strong></td></tr>
  <tr><td>7. Aadhaar Number</td><td><strong>${aadhaar}</strong></td></tr>
  <tr><td>8. Passport Number</td><td><strong>${passport}</strong></td></tr>
  <tr><td>9. Mobile Number</td><td>${mobile}</td></tr>
  <tr><td>10. Email ID</td><td>${email}</td></tr>
  <tr><td>11. Occupation</td><td>Business / Agriculture / IT Extension</td></tr>
  <tr><td>12. Nationality</td><td>Indian</td></tr>
</table>

<div class="highlight-box">
  <strong>STATUTORY DECLARATION:</strong><br>
  1. I declare that I have not been convicted of any offence in connection with the promotion, formation, or management of any company or LLP.<br>
  2. I have not been found guilty of any fraud or misfeasance or of any breach of duty to any company under this Act or any previous company law in the last five years.<br>
  3. I further declare that if chosen as Director, I will not contravene any provisions of the Act or the rules made thereunder.
</div>

<table class="signature-table">
  <tr>
    <td style="width: 50%;">
      <strong>Date:</strong> 20 / 10 / 2026<br>
      <strong>Place:</strong> Kapurthala / Tarn Taran (Punjab)<br><br>
      <strong>Enclosed Identity Documents:</strong><br>
      1. Self-Attested PAN Card (${pan})<br>
      2. Self-Attested Aadhaar Card (${aadhaar})<br>
      3. Self-Attested Passport (${passport})<br>
      4. Bank Account Statement / Passbook Copy
    </td>
    <td style="width: 50%; text-align: right;">
      <strong>Signature:</strong><br><br><br>
      ____________________________________<br>
      <strong style="color:#1B5E20; font-size: 14px;">${name}</strong><br>
      <em>Executive Director (Promoter & Subscriber)</em><br>
      Mobile: ${mobile}
    </td>
  </tr>
</table>

<div class="footer">FarmsKing Technologies Private Limited (Under Incorporation) | MCA V3 SPICe+ Dossier</div>
</body>
</html>`;

const tempHtml = path.join(targetFolder, '_temp_dir2_bks.html');
fs.writeFileSync(tempHtml, dir2Html, 'utf-8');
try {
  execSync(`chrome.exe --headless --disable-gpu --run-all-compositor-stages-before-draw --print-to-pdf="${path.join(targetFolder, `${filenameBase}.pdf`)}" "${tempHtml}"`, { stdio: 'ignore' });
} catch (e) {
  console.error(e);
}
if (fs.existsSync(tempHtml)) fs.unlinkSync(tempHtml);

// DOCX
const doc = new Document({
  sections: [{
    children: [
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'FORM DIR-2 — CONSENT TO ACT AS DIRECTOR', bold: true, size: 24, color: '1B5E20' })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: '(Pursuant to Section 152(5) of the Companies Act, 2013 & Rule 8)', italics: true, size: 18 })] }),
      new Paragraph({ children: [new TextRun({ text: 'TO, The Board of Directors / Promoters, FARMSKING TECHNOLOGIES PRIVATE LIMITED', bold: true, size: 20 })] }),
      new Paragraph({ spacing: { after: 140 }, children: [new TextRun({ text: 'Registered Office: Near Co-operative Bank, Goindwal Sahib, Tarn Taran, Punjab - 143422', size: 18 })] }),
      new Paragraph({ spacing: { after: 140 }, children: [new TextRun({ text: 'I, ' + name + ', S/o ' + fatherName + ', resident of ' + address + ', hereby give my consent to act as Director of FARMSKING TECHNOLOGIES PRIVATE LIMITED pursuant to sub-section (5) of Section 152 of the Companies Act, 2013 and certify that I am not disqualified to become a Director under the Companies Act, 2013.', size: 20 })] }),
      new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: '1. Full Name: ' + name, bold: true, size: 20 })] }),
      new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: "2. Father's Name: " + fatherName, bold: true, size: 20 })] }),
      new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: '3. Residential Address: ' + address, size: 20 })] }),
      new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: '4. PAN Card Number: ' + pan, bold: true, size: 20 })] }),
      new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: '5. Date of Birth: ' + dob, bold: true, size: 20 })] }),
      new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: '6. Aadhaar Number: ' + aadhaar, size: 20 })] }),
      new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: '7. Passport Number: ' + passport, size: 20 })] }),
      new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: '8. Mobile: ' + mobile + ' | Email: ' + email, size: 20 })] }),
      new Paragraph({ spacing: { after: 200, before: 140 }, children: [new TextRun({ text: 'DECLARATION: I declare that I have not been convicted of any offence in connection with the promotion, formation or management of any company or LLP, and not found guilty of fraud in the last five years.', italics: true, size: 18 })] }),
      new Paragraph({ spacing: { before: 200 }, alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'Signature: __________________________\n' + name + '\nExecutive Director', bold: true, size: 20 })] })
    ]
  }]
});
Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(path.join(targetFolder, `${filenameBase}.docx`), buf);
  console.log('UPDATED DIR-2 FOR BAKHSHISH SINGH');
});
