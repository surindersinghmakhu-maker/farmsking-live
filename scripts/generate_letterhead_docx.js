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
  ImageRun,
} = require('docx');

const OUT_DIR = 'D:\\farmsking\\Govt\\docs\\16_Official_Corporate_Letterhead';
const DESKTOP_DIR = 'C:\\Users\\hp\\Desktop\\FarmsKing Pvt Ltd';
const logoPath = 'D:\\farmsking\\logo\\brand_logo.png';

let logoData = null;
if (fs.existsSync(logoPath)) {
  logoData = fs.readFileSync(logoPath);
}

const PRIMARY_GREEN = '042F2E';
const EMERALD = '0F766E';
const GOLD = 'B45309';
const DARK_SLATE = '0F172A';
const SUB_TEXT = '475569';
const BORDER_COLOR = 'CBD5E1';

function createNoBorder() {
  return {
    top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  };
}

// Build Header Table
const headerCells = [
  new TableCell({
    borders: createNoBorder(),
    width: { size: 60, type: WidthType.PERCENTAGE },
    verticalAlign: VerticalAlign.CENTER,
    children: [
      ...(logoData
        ? [
            new Paragraph({
              children: [
                new ImageRun({
                  data: logoData,
                  transformation: {
                    width: 220,
                    height: 63,
                  },
                }),
              ],
            }),
          ]
        : []),
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
        spacing: { before: 60 },
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
            text: 'CIN: U62013PB2026PTC070389',
            bold: true,
            size: 15,
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
            size: 14,
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
            size: 14,
            bold: true,
            color: EMERALD,
            font: 'Arial',
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({
            text: 'DPIIT Recognized AgriTech Enterprise',
            size: 13,
            color: GOLD,
            bold: true,
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

// Footer Table
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
                  size: 14,
                  color: PRIMARY_GREEN,
                }),
                new TextRun({
                  text: 'C/o BALDEV SINGH, VILLAGE BOOH, Kapurthala - 144601, Punjab, India',
                  size: 13,
                  color: SUB_TEXT,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Corporate Office: ',
                  bold: true,
                  size: 13,
                  color: PRIMARY_GREEN,
                }),
                new TextRun({
                  text: 'Near Grain Market, Makhu, District Ferozepur - 142044, Punjab',
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
                  text: 'Helpline: +91 95776-22000 | +91 98720-66901',
                  bold: true,
                  size: 14,
                  color: PRIMARY_GREEN,
                }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({
                  text: 'Email: contact@farmsking.in | Web: https://farmsking.in',
                  size: 13,
                  color: EMERALD,
                }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({
                  text: 'ISO 9001:2015 & ISO 27001:2022 Certified • ICAR Aligned',
                  size: 12,
                  color: GOLD,
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

const doc = new Document({
  sections: [
    {
      properties: {
        page: {
          size: {
            width: 11906, // A4 Width in twips
            height: 16838, // A4 Height in twips
          },
          margin: {
            top: 720,
            bottom: 720,
            left: 900,
            right: 900,
          },
        },
      },
      headers: {
        default: new Header({
          children: [headerTable],
        }),
      },
      footers: {
        default: new Footer({
          children: [footerTable],
        }),
      },
      children: [
        // Meta ref and date row
        new Paragraph({
          children: [
            new TextRun({
              text: 'Ref. No.: FKIPL/____________________',
              bold: true,
              size: 18,
              color: DARK_SLATE,
            }),
            new TextRun({
              text: '\t\t\t\t\t\t\t\t\tDate: ____________________',
              bold: true,
              size: 18,
              color: DARK_SLATE,
            }),
          ],
          spacing: { before: 200, after: 300 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'To,',
              bold: true,
              size: 20,
            }),
          ],
          spacing: { after: 100 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: '[Recipient Name / Authority]\n[Designation / Organization]\n[Address Line 1]\n[City, State, PIN]',
              size: 20,
              color: SUB_TEXT,
            }),
          ],
          spacing: { after: 300 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'SUBJECT: [ENTER DOCUMENT SUBJECT HERE IN BOLD]',
              bold: true,
              underline: true,
              size: 20,
              color: PRIMARY_GREEN,
            }),
          ],
          spacing: { after: 300 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Dear Sir / Madam,',
              bold: true,
              size: 20,
            }),
          ],
          spacing: { after: 200 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Type your official letter, resolution, agreement, or communication content here. This Microsoft Word letterhead is pre-configured with the exact corporate identity, official Brand Logo, legal registration numbers, CIN, PAN, TAN, MSME Udyam, and verified registered office details of FarmsKing Technologies Private Limited.',
              size: 20,
            }),
          ],
          spacing: { after: 250 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Sincerely,',
              size: 20,
            }),
          ],
          spacing: { before: 600, after: 100 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'For and on behalf of the Board of Directors\n',
              size: 18,
              color: SUB_TEXT,
            }),
            new TextRun({
              text: 'FARMSKING TECHNOLOGIES PRIVATE LIMITED',
              bold: true,
              size: 20,
              color: PRIMARY_GREEN,
            }),
          ],
          spacing: { after: 600 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: '___________________________________\n',
              bold: true,
              size: 20,
            }),
            new TextRun({
              text: 'Authorized Signatory / Director\n',
              bold: true,
              size: 18,
            }),
            new TextRun({
              text: 'DIN: 11342798 / 11342797',
              size: 16,
              color: SUB_TEXT,
            }),
          ],
        }),
      ],
    },
  ],
});

const outDocxPath = path.join(OUT_DIR, '01_FARMSKING_OFFICIAL_LETTERHEAD.docx');
const desktopDocxPath = path.join(DESKTOP_DIR, '01_FARMSKING_OFFICIAL_LETTERHEAD.docx');

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(outDocxPath, buffer);
  console.log('[OK] Word Document (.docx) Letterhead created with Brand Logo:', outDocxPath);

  if (fs.existsSync(DESKTOP_DIR)) {
    fs.copyFileSync(outDocxPath, desktopDocxPath);
    console.log('[OK] Word Letterhead synced to Desktop Folder:', desktopDocxPath);
  }
}).catch((err) => {
  console.error('[FAIL] Docx generation failed:', err.message);
});
