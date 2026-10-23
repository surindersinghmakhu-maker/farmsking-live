const fs = require('fs');
const path = require('path');
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
  VerticalAlign,
  Header,
  Footer,
  PageNumber,
} = require('docx');

const desktopPath = path.join(
  process.env.USERPROFILE || 'C:\\Users\\hp',
  'Desktop'
);
const outputPath = path.join(
  desktopPath,
  'FARMSKING_REGISTERED_OFFICE_NOC.docx'
);

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

const doc = new Document({
  sections: [
    {
      properties: {
        page: {
          margin: {
            top: 1000,
            bottom: 1000,
            left: 1200,
            right: 1200,
          },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({
                  text: 'FORM SPICe+ (INC-32) STATUTORY ATTACHMENT | RULE 25 COMPLIANT',
                  size: 16,
                  color: '757575',
                  font: 'Arial',
                }),
              ],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: 'FarmsKing Technologies Private Limited (Under Incorporation) | MCA SRN: AC6979718',
                  size: 16,
                  color: '757575',
                  font: 'Arial',
                }),
              ],
            }),
          ],
        }),
      },
      children: [
        // Title Banner Table
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  borders: borderBox,
                  shading: { fill: 'E8F5E9', type: ShadingType.CLEAR },
                  margins: { top: 180, bottom: 180, left: 240, right: 240 },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { after: 60 },
                      children: [
                        new TextRun({
                          text: 'NO OBJECTION CERTIFICATE (NOC) FOR REGISTERED OFFICE',
                          bold: true,
                          size: 26,
                          color: '1B5E20',
                          font: 'Arial',
                        }),
                      ],
                    }),
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({
                          text: '(Pursuant to Rule 25 of the Companies (Incorporation) Rules, 2014 & Section 12 of the Companies Act, 2013)',
                          size: 18,
                          italics: true,
                          color: '2E7D32',
                          font: 'Arial',
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),

        new Paragraph({ spacing: { before: 240 } }),

        // Addressed To
        new Paragraph({
          spacing: { after: 40 },
          children: [
            new TextRun({
              text: 'TO,',
              bold: true,
              size: 20,
              font: 'Arial',
            }),
          ],
        }),
        new Paragraph({
          spacing: { after: 30 },
          children: [
            new TextRun({
              text: 'The Registrar of Companies (ROC), Punjab & Chandigarh /',
              bold: true,
              size: 20,
              font: 'Arial',
            }),
          ],
        }),
        new Paragraph({
          spacing: { after: 30 },
          children: [
            new TextRun({
              text: 'The Central Registration Centre (CRC), Ministry of Corporate Affairs,',
              bold: true,
              size: 20,
              font: 'Arial',
            }),
          ],
        }),
        new Paragraph({
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: 'Government of India.',
              bold: true,
              size: 20,
              font: 'Arial',
            }),
          ],
        }),

        // Subject
        new Paragraph({
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: 'SUBJECT: ',
              bold: true,
              size: 20,
              font: 'Arial',
            }),
            new TextRun({
              text: 'NO OBJECTION CERTIFICATE FOR USING PREMISES AS REGISTERED OFFICE OF THE PROPOSED COMPANY "FARMSKING TECHNOLOGIES PRIVATE LIMITED" (MCA SRN: AC6979718).',
              bold: true,
              size: 20,
              color: '0D47A1',
              font: 'Arial',
            }),
          ],
        }),

        // Salutation & Body
        new Paragraph({
          spacing: { after: 140 },
          children: [
            new TextRun({
              text: 'Respected Sir / Madam,',
              bold: true,
              size: 20,
              font: 'Arial',
            }),
          ],
        }),

        new Paragraph({
          spacing: { after: 140 },
          alignment: AlignmentType.JUSTIFIED,
          children: [
            new TextRun({
              text: 'I, ',
              size: 20,
              font: 'Arial',
            }),
            new TextRun({
              text: 'BAKHSHISH SINGH',
              bold: true,
              size: 20,
              font: 'Arial',
            }),
            new TextRun({
              text: ', resident of Goindwal Sahib, Tehsil Khadoor Sahib, District Tarn Taran, Punjab, India, do hereby solemnly affirm, declare, and certify as under:',
              size: 20,
              font: 'Arial',
            }),
          ],
        }),

        // Point 1
        new Paragraph({
          spacing: { after: 140 },
          alignment: AlignmentType.JUSTIFIED,
          children: [
            new TextRun({
              text: '1. Absolute Possession & Lawful Authority: ',
              bold: true,
              size: 20,
              font: 'Arial',
            }),
            new TextRun({
              text: 'That I am the absolute owner and lawful occupant in possession of the commercial/office premises situated at:',
              size: 20,
              font: 'Arial',
            }),
          ],
        }),

        // Address Box
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 6, color: 'BDBDBD' },
                    bottom: { style: BorderStyle.SINGLE, size: 6, color: 'BDBDBD' },
                    left: { style: BorderStyle.SINGLE, size: 12, color: '1B5E20' },
                    right: { style: BorderStyle.SINGLE, size: 6, color: 'BDBDBD' },
                  },
                  shading: { fill: 'F9FBE7', type: ShadingType.CLEAR },
                  margins: { top: 120, bottom: 120, left: 180, right: 180 },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: 'M/s GURU NANAK COMPUTER ACADEMY',
                          bold: true,
                          size: 20,
                          font: 'Arial',
                        }),
                      ],
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: 'NEAR CO-OPERATIVE BANK, GOINDWAL SAHIB,',
                          size: 20,
                          font: 'Arial',
                        }),
                      ],
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: 'TEHSIL: KHADOOR SAHIB, DISTRICT: TARN TARAN,',
                          size: 20,
                          font: 'Arial',
                        }),
                      ],
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: 'STATE: PUNJAB, INDIA — PIN CODE: 143422.',
                          bold: true,
                          size: 20,
                          font: 'Arial',
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),

        new Paragraph({ spacing: { before: 140 } }),

        // Point 2
        new Paragraph({
          spacing: { after: 140 },
          alignment: AlignmentType.JUSTIFIED,
          children: [
            new TextRun({
              text: '2. Grant of Unconditional No Objection: ',
              bold: true,
              size: 20,
              font: 'Arial',
            }),
            new TextRun({
              text: 'That I have ',
              size: 20,
              font: 'Arial',
            }),
            new TextRun({
              text: 'NO OBJECTION',
              bold: true,
              size: 20,
              font: 'Arial',
            }),
            new TextRun({
              text: ' whatsoever if the proposed company named ',
              size: 20,
              font: 'Arial',
            }),
            new TextRun({
              text: '"FARMSKING TECHNOLOGIES PRIVATE LIMITED"',
              bold: true,
              size: 20,
              color: '1B5E20',
              font: 'Arial',
            }),
            new TextRun({
              text: ' (or "FARMSKING AGRI SOLUTIONS PRIVATE LIMITED" or such other name approved by the Central Registration Centre under SRN: ',
              size: 20,
              font: 'Arial',
            }),
            new TextRun({
              text: 'AC6979718',
              bold: true,
              size: 20,
              font: 'Arial',
            }),
            new TextRun({
              text: ') uses the aforesaid premises as its ',
              size: 20,
              font: 'Arial',
            }),
            new TextRun({
              text: 'REGISTERED OFFICE',
              bold: true,
              size: 20,
              font: 'Arial',
            }),
            new TextRun({
              text: ' for carrying on its corporate, administrative, software development, e-commerce, digital farming, and statutory business operations under the Companies Act, 2013.',
              size: 20,
              font: 'Arial',
            }),
          ],
        }),

        // Point 3
        new Paragraph({
          spacing: { after: 140 },
          alignment: AlignmentType.JUSTIFIED,
          children: [
            new TextRun({
              text: '3. Display of Name Board & Statutory Notices: ',
              bold: true,
              size: 20,
              font: 'Arial',
            }),
            new TextRun({
              text: 'That I hereby permit the company to paint, affix, and display its official name board, registered office banner, and Corporate Identity Number (CIN) outside and inside the said premises as required under Section 12(3) of the Companies Act, 2013.',
              size: 20,
              font: 'Arial',
            }),
          ],
        }),

        // Point 4
        new Paragraph({
          spacing: { after: 140 },
          alignment: AlignmentType.JUSTIFIED,
          children: [
            new TextRun({
              text: '4. Government Registrations & Banking: ',
              bold: true,
              size: 20,
              font: 'Arial',
            }),
            new TextRun({
              text: 'That I grant my full consent to the said company using this address for obtaining PAN, TAN, GSTIN, MSME (Udyam), Professional Tax, Startup India recognitions, and for opening Current Bank Accounts with scheduled commercial banks.',
              size: 20,
              font: 'Arial',
            }),
          ],
        }),

        // Point 5
        new Paragraph({
          spacing: { after: 200 },
          alignment: AlignmentType.JUSTIFIED,
          children: [
            new TextRun({
              text: '5. Utility Bill Evidence: ',
              bold: true,
              size: 20,
              font: 'Arial',
            }),
            new TextRun({
              text: 'In accordance with Rule 25(2)(c) of the Companies (Incorporation) Rules, 2014, the latest utility bill is attached herewith: ',
              size: 20,
              font: 'Arial',
            }),
            new TextRun({
              text: 'BSNL Telephone / Fiber Tax Invoice (Account No: 1024846990, Invoice No: NDCPB2621596357, Dated: 03-OCT-2026, Due Date: 19-OCT-2026) issued by Bharat Sanchar Nigam Limited, in the name of M/s Guru Nanak Computer Academy Bakhshish Singh at the aforesaid premises.',
              bold: true,
              size: 20,
              font: 'Arial',
            }),
          ],
        }),

        // Verification Block
        new Paragraph({
          spacing: { after: 240 },
          children: [
            new TextRun({
              text: 'VERIFICATION:',
              bold: true,
              size: 20,
              font: 'Arial',
            }),
          ],
        }),
        new Paragraph({
          spacing: { after: 300 },
          alignment: AlignmentType.JUSTIFIED,
          children: [
            new TextRun({
              text: 'I, the deponent above-named, do hereby verify that the contents of this No Objection Certificate are true and correct to the best of my knowledge and belief and nothing material has been concealed therein.',
              size: 20,
              italics: true,
              font: 'Arial',
            }),
          ],
        }),

        // Signature Table
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  borders: borderNone,
                  children: [
                    new Paragraph({
                      spacing: { after: 40 },
                      children: [
                        new TextRun({
                          text: 'Date: ____ / ____ / 2026',
                          bold: true,
                          size: 20,
                          font: 'Arial',
                        }),
                      ],
                    }),
                    new Paragraph({
                      spacing: { after: 40 },
                      children: [
                        new TextRun({
                          text: 'Place: Goindwal Sahib, Tarn Taran (Punjab)',
                          bold: true,
                          size: 20,
                          font: 'Arial',
                        }),
                      ],
                    }),
                    new Paragraph({
                      spacing: { before: 80 },
                      children: [
                        new TextRun({
                          text: 'Attachments:',
                          bold: true,
                          size: 18,
                          color: '424242',
                          font: 'Arial',
                        }),
                      ],
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: '1. BSNL Bill (03-OCT-2026)',
                          size: 18,
                          color: '616161',
                          font: 'Arial',
                        }),
                      ],
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: '2. PAN Card of Bakhshish Singh',
                          size: 18,
                          color: '616161',
                          font: 'Arial',
                        }),
                      ],
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: '3. Aadhaar Card of Bakhshish Singh',
                          size: 18,
                          color: '616161',
                          font: 'Arial',
                        }),
                      ],
                    }),
                  ],
                }),
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  borders: borderNone,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.RIGHT,
                      spacing: { after: 300 },
                      children: [
                        new TextRun({
                          text: 'Signature of Owner / Occupant:',
                          bold: true,
                          size: 20,
                          font: 'Arial',
                        }),
                      ],
                    }),
                    new Paragraph({
                      alignment: AlignmentType.RIGHT,
                      spacing: { after: 40 },
                      children: [
                        new TextRun({
                          text: '____________________________________',
                          bold: true,
                          size: 20,
                          font: 'Arial',
                        }),
                      ],
                    }),
                    new Paragraph({
                      alignment: AlignmentType.RIGHT,
                      spacing: { after: 40 },
                      children: [
                        new TextRun({
                          text: 'BAKHSHISH SINGH',
                          bold: true,
                          size: 22,
                          color: '1B5E20',
                          font: 'Arial',
                        }),
                      ],
                    }),
                    new Paragraph({
                      alignment: AlignmentType.RIGHT,
                      children: [
                        new TextRun({
                          text: 'Proprietor / Authorized Occupant',
                          size: 18,
                          italics: true,
                          font: 'Arial',
                        }),
                      ],
                    }),
                    new Paragraph({
                      alignment: AlignmentType.RIGHT,
                      children: [
                        new TextRun({
                          text: 'Mobile: 98720-66901 / 88724-91557',
                          size: 18,
                          font: 'Arial',
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

Packer.toBuffer(doc)
  .then((buffer) => {
    fs.writeFileSync(outputPath, buffer);
    console.log('SUCCESS: File created at ' + outputPath);
  })
  .catch((err) => {
    console.error('ERROR: ', err);
    process.exit(1);
  });
