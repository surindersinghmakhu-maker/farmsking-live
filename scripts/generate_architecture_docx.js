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
  HeadingLevel,
  AlignmentType,
  ShadingType,
  VerticalAlign,
} = require('docx');

const desktopPath = path.join(
  process.env.USERPROFILE || 'C:\\Users\\hp',
  'Desktop'
);
const outputPath = path.join(
  desktopPath,
  'FarmsKing_Master_Architecture_Dossier.docx'
);

const PRIMARY_GREEN = '15803D';
const SECONDARY_GREEN = '16A34A';
const DARK_SLATE = '0F172A';
const SUB_TEXT = '475569';
const BORDER_COLOR = 'CBD5E1';
const BG_LIGHT_GREEN = 'F0FDF4';
const BG_HEADER_GREEN = 'DCFCE7';
const BG_ALT_ROW = 'F8FAFC';
const BG_WHITE = 'FFFFFF';

function createCell(
  text,
  options = {}
) {
  const {
    isHeader = false,
    bold = false,
    widthPercent = 25,
    bg = isHeader ? BG_HEADER_GREEN : BG_WHITE,
    align = AlignmentType.LEFT,
    color = isHeader ? PRIMARY_GREEN : DARK_SLATE,
    fontSize = isHeader ? 20 : 18,
  } = options;

  return new TableCell({
    width: { size: widthPercent, type: WidthType.PERCENTAGE },
    verticalAlign: VerticalAlign.CENTER,
    shading: {
      type: ShadingType.CLEAR,
      fill: bg,
    },
    margins: {
      top: 140,
      bottom: 140,
      left: 180,
      right: 180,
    },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
      left: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
      right: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
    },
    children: [
      new Paragraph({
        alignment: align,
        children: [
          new TextRun({
            text,
            bold: isHeader || bold,
            color,
            size: fontSize,
            font: 'Calibri',
          }),
        ],
      }),
    ],
  });
}

function createSectionHeading(title, subtitle) {
  const paragraphs = [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 360, after: 120 },
      children: [
        new TextRun({
          text: title,
          bold: true,
          size: 28,
          color: PRIMARY_GREEN,
          font: 'Calibri',
        }),
      ],
    }),
  ];

  if (subtitle) {
    paragraphs.push(
      new Paragraph({
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: subtitle,
            italics: true,
            color: SUB_TEXT,
            size: 19,
            font: 'Calibri',
          }),
        ],
      })
    );
  }

  return paragraphs;
}

function createSubHeading(title) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 100 },
    children: [
      new TextRun({
        text: title,
        bold: true,
        size: 22,
        color: SECONDARY_GREEN,
        font: 'Calibri',
      }),
    ],
  });
}

function createBullet(title, description) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 100 },
    children: [
      new TextRun({
        text: title + ': ',
        bold: true,
        color: DARK_SLATE,
        size: 20,
        font: 'Calibri',
      }),
      new TextRun({
        text: description,
        color: DARK_SLATE,
        size: 20,
        font: 'Calibri',
      }),
    ],
  });
}

function createParagraph(text, options = {}) {
  const { bold = false, color = DARK_SLATE, size = 20, spacing = { after: 140 } } = options;
  return new Paragraph({
    spacing,
    children: [
      new TextRun({
        text,
        bold,
        color,
        size,
        font: 'Calibri',
      }),
    ],
  });
}

const doc = new Document({
  sections: [
    {
      properties: {
        page: {
          margin: {
            top: 1440, // 1 inch
            bottom: 1440,
            left: 1440,
            right: 1440,
          },
        },
      },
      children: [
        // ==========================================
        // TITLE BANNER
        // ==========================================
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
          children: [
            new TextRun({
              text: '👑 FARMSKING TECHNOLOGIES PRIVATE LIMITED',
              bold: true,
              size: 32,
              color: PRIMARY_GREEN,
              font: 'Calibri',
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
          children: [
            new TextRun({
              text: 'MASTER ENTERPRISE SYSTEM ARCHITECTURE DOSSIER',
              bold: true,
              size: 24,
              color: DARK_SLATE,
              font: 'Calibri',
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
          children: [
            new TextRun({
              text: 'Technical Topology • RBAC Role Matrix • Cross-Module Pipelines • Built vs Pending Status • Strategic Roadmap',
              italics: true,
              size: 18,
              color: SUB_TEXT,
              font: 'Calibri',
            }),
          ],
        }),

        // Executive Divider
        new Paragraph({
          spacing: { after: 240 },
          children: [
            new TextRun({
              text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
              color: BORDER_COLOR,
              size: 18,
            }),
          ],
        }),

        // ==========================================
        // 1. EXECUTIVE OVERVIEW
        // ==========================================
        ...createSectionHeading('1. Executive Overview & System Topology', 'High-level cloud-native architecture connecting agriculture and urban green spaces'),
        createParagraph(
          'FarmsKing India is a high-speed, enterprise-grade Agritech & Garden-care platform designed to digitize both large commercial agriculture (farmers growing wheat, paddy, cotton, vegetables) and urban residential plant care (balconies, kitchen gardens, terrace potted plants). The platform coordinates certified agronomists (Crop Doctors), multi-vendor fertilizer/seed distributors, commission agents (Arhtiyas), and executive platform administrators.'
        ),
        createBullet('Client Layer (React Native / Expo Web)', 'Dual web & mobile portals: Frontend Customer App (Port 8081) and Admin 4D Command Center (Port 8082). Fully responsive for desktop, tablet, and mobile views (<768px).'),
        createBullet('Core Backend (NestJS v11)', '59 modular micro-services running on Port 3000 at /api/v1 with Swagger API docs, JWT authentication (7-day validity), Helmet security headers, rate throttling, and WebSocket gateways for live support chat.'),
        createBullet('Database & Cache (Prisma ORM + PostgreSQL + Redis)', 'PostgreSQL hosted on Neon Cloud with 19 modular schema files, strict relational integrity, foreign keys, and Redis caching for high-speed socket states.'),
        createBullet('External Integrations', 'Google Gemini Vision AI (leaf disease diagnosis), ISRO & Sentinel-2 Satellite (NDVI soil/vegetation radar), Agora RTC (video/audio doctor calls), PhonePe & Cashfree (UPI payments), Shiprocket (village parcel tracking), and Meta/Baileys WhatsApp bot.'),

        // ==========================================
        // 2. LOGIN-WISE / ROLE-WISE FEATURE MATRIX
        // ==========================================
        ...createSectionHeading('2. Role-Based Access Control (RBAC) Feature Matrix', 'Complete breakdown of what each user sees, accesses, and operates across FarmsKing'),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                createCell('User Role', { isHeader: true, widthPercent: 18 }),
                createCell('Target Audience', { isHeader: true, widthPercent: 22 }),
                createCell('Core Operational Features', { isHeader: true, widthPercent: 35 }),
                createCell('Financial & Transactional Rights', { isHeader: true, widthPercent: 25 }),
              ],
            }),
            new TableRow({
              children: [
                createCell('FARMER (ਕਿਸਾਨ)', { bold: true, widthPercent: 18 }),
                createCell('Commercial rural landholders', { widthPercent: 22 }),
                createCell('Farm acreage, plot mapping, soil & tubewell tagging, AI leaf scanner, satellite NDVI radar, spray schedules, labour & machinery logs, APMC Mandi commodity rates, Voice AI.', { widthPercent: 35 }),
                createCell('Purchases VIP advisory plans & agri-supplies; maintains Arhtiya Bahi-Khata ledger; receives cashback into Farmer Wallet; UPI QR checkout.', { widthPercent: 25 }),
              ],
            }),
            new TableRow({
              children: [
                createCell('GARDENER (ਗਾਰਡਨਰ)', { bold: true, widthPercent: 18, bg: BG_ALT_ROW }),
                createCell('Urban apartment/house plant growers', { widthPercent: 22, bg: BG_ALT_ROW }),
                createCell('Home balcony/terrace pots tracking, domestic plant health scanner, watering & bio-fertilizer schedule reminders, urban gardening supplies store.', { widthPercent: 35, bg: BG_ALT_ROW }),
                createCell('Purchases Gardener VIP passes; domestic order checkout via UPI/Cards.', { widthPercent: 25, bg: BG_ALT_ROW }),
              ],
            }),
            new TableRow({
              children: [
                createCell('ADVISOR (ਕ੍ਰੌਪ ਡਾਕਟਰ)', { bold: true, widthPercent: 18 }),
                createCell('Certified agronomists & crop doctors', { widthPercent: 22 }),
                createCell('Assigned farmer triage queue, verified digital prescription writer (chemical & bio salts), 1-on-1 Agora video/voice calls, field visit calendar, disease review.', { widthPercent: 35 }),
                createCell('Receives consultation fees into Doctor Wallet; requests bank/UPI withdrawals (subject to 2% TDS and admin verification).', { widthPercent: 25 }),
              ],
            }),
            new TableRow({
              children: [
                createCell('SELLER (ਦੁਕਾਨਦਾਰ)', { bold: true, widthPercent: 18, bg: BG_ALT_ROW }),
                createCell('Licensed seed, fertilizer & pesticide merchants', { widthPercent: 22, bg: BG_ALT_ROW }),
                createCell('Store product listings, inventory stock & expiry tracking, packaging queue, 1-click Shiprocket courier label (AWB) generation, store buyer ratings.', { widthPercent: 35, bg: BG_ALT_ROW }),
                createCell('Automated seller payout settlements; 1% GST TCS tax compliance ledger; real-time balance withdrawals.', { widthPercent: 25, bg: BG_ALT_ROW }),
              ],
            }),
            new TableRow({
              children: [
                createCell('TRADER (ਆੜ੍ਹਤੀਆ / ਵਪਾਰੀ)', { bold: true, widthPercent: 18 }),
                createCell('Grain merchants & commission brokers', { widthPercent: 22 }),
                createCell('Live mandi rate boards, bulk procurement inquiries, crop quality inspection, bag calculations (Quintal, 50kg bag, Mann).', { widthPercent: 35 }),
                createCell('Bahi-Khata multi-party ledger; trade advance payments, commission fees, and settlement payouts.', { widthPercent: 25 }),
              ],
            }),
            new TableRow({
              children: [
                createCell('ADMIN / SUPER_ADMIN', { bold: true, widthPercent: 18, bg: BG_ALT_ROW }),
                createCell('FarmsKing HQ executive management', { widthPercent: 22, bg: BG_ALT_ROW }),
                createCell('Full 4D Command Center oversight, merchant & doctor KYC verification, UPI/NEFT payout approvals, coupon rules, system configuration, audit logs, user impersonation.', { widthPercent: 35, bg: BG_ALT_ROW }),
                createCell('Master platform treasury wallet, commission margins, bonus disbursements, global revenue balance sheet.', { widthPercent: 25, bg: BG_ALT_ROW }),
              ],
            }),
          ],
        }),

        // ==========================================
        // 3. CROSS-MODULE INTERCONNECTIONS
        // ==========================================
        ...createSectionHeading('3. Cross-Module Data Pipelines & Interconnections', 'How different modules seamlessly communicate and exchange data'),
        createParagraph(
          'In FarmsKing, isolated silos do not exist. Every operational event triggers cross-module data flow to ensure automated commerce, expert healthcare, and immediate financial accounting.'
        ),
        createSubHeading('Pipeline A: AI Disease Diagnosis ➔ Doctor Telemedicine ➔ 1-Click Supply Order ➔ Settlement'),
        createBullet('Step 1: AI Instant Detection', 'Farmer uploads a photo of a diseased leaf. Gemini Vision AI identifies the pathogen (e.g. Yellow Rust in Wheat) with 90%+ confidence and suggests Azoxystrobin fungicide.'),
        createBullet('Step 2: Crop Doctor Verification', 'For severe cases, the ticket escalates to an assigned Crop Doctor via Agora video call. The doctor issues an official digital prescription with exact tank dosage.'),
        createBullet('Step 3: 1-Click Store Cart Conversion', 'The prescribed medicine is automatically attached to the farmer cart. The farmer pays via PhonePe/Cashfree UPI QR.'),
        createBullet('Step 4: Rural Delivery & Settlement', 'The order routes to the nearest verified Seller. Shiprocket assigns a courier for village doorstep delivery. Upon delivery confirmation, the platform automatically credits the Seller wallet and transfers the doctor advisory commission.'),

        createSubHeading('Pipeline B: Satellite Radar ➔ Soil Moisture ➔ Spray Schedules ➔ Automated WhatsApp Alert'),
        createBullet('Step 1: Plot Polygon Geo-Fencing', 'Farmer draws acreage plot boundaries. Sentinel-2 and ISRO APIs fetch weekly Normalized Difference Vegetation Index (NDVI) and moisture readings.'),
        createBullet('Step 2: Weather Risk Trigger', 'If excessive rainfall or frost is predicted by the weather module, the spray schedule automatically shifts status to SKIPPED or POSTPONED.'),
        createBullet('Step 3: Proactive WhatsApp Advisory', 'The Baileys/Meta WhatsApp bot sends an immediate advisory alert in simple English to the farmer, saving thousands of rupees in washed-off pesticides.'),

        createSubHeading('Pipeline C: Crop Harvest ➔ Arhtiya Bahi-Khata ➔ Bank Payout Settlement'),
        createBullet('Step 1: Yield Logging', 'Farmer logs harvest weight in quintals after cutting paddy/wheat.'),
        createBullet('Step 2: Arhtiya Ledger Balancing', 'When sold at the mandi, the transaction automatically offsets prior seasonal cash advances taken by the farmer, factoring in market fees and commission.'),
        createBullet('Step 3: Net Proceeds Payout', 'The surplus amount is credited to the farmer wallet and can be withdrawn directly to their bank account via UPI.'),

        // ==========================================
        // 4. MODULE-BY-MODULE BREAKDOWN
        // ==========================================
        ...createSectionHeading('4. Module-by-Module Technical Breakdown', 'Detailed architectural breakdown of the 8 core operational subsystems'),
        createBullet('Module 1: Agricultural ERP & Farm Operations', 'Tracks farms, plots, soil profiles (alluvial, black, clay, sandy), tubewell/canal water sources, crop stages (Plantation, Vegetative, Flowering, Harvesting), 20-item standard spray dose templates, and labour wage accounting.'),
        createBullet('Module 2: AI Plant Diagnostics & Satellite Radar', 'Combines Gemini Vision AI leaf pest scanning with ISRO/Sentinel-2 remote sensing to detect crop stress, nitrogen deficiency, and soil dry spells before physical symptoms become catastrophic.'),
        createBullet('Module 3: Telemedicine & Crop Doctor Network', 'Certified agronomist directory, shift schedules, sub-second Agora audio/video call token generation, triage patient queue, and digital prescription generator.'),
        createBullet('Module 4: Multi-Vendor Marketplace & Agri-Store', 'Multi-merchant product catalog, batch inventory, chemical salt categorization, flash discounts, cart/checkout, and order state machine (Placed ➔ Confirmed ➔ Packing ➔ Dispatched ➔ Delivered).'),
        createBullet('Module 5: Logistics & Rural Fulfillment', 'Automated Shiprocket courier allocation, village pincode serviceability check, AWB generation, live parcel tracking, and Return-to-Origin (RTO) management.'),
        createBullet('Module 6: Financial Treasury, Escrow & Arhtiya Khata', 'Double-entry ledger, Cashfree/PhonePe UPI checkout, withdrawal requests with 2% TDS deductions, 1% GST TCS merchant filing reports, and traditional Arhtiya Bahi-Khata.'),
        createBullet('Module 7: Omnichannel Communications', 'Firebase Cloud Messaging (FCM) push notifications, automated WhatsApp broadcasts for weather/mandi rates via Baileys engine, and transactional Gmail SMTP emails.'),
        createBullet('Module 8: Admin 4D Command Center & Security Governance', 'Unified navigation bar, real-time KPI telemetry, KYC approvals, Excel report export, user impersonation, maintenance mode switches, and security audit logs.'),

        // ==========================================
        // 5. CURRENT IMPLEMENTATION STATUS
        // ==========================================
        ...createSectionHeading('5. Current Implementation Status: Built vs. Crucial Pending Work', 'Honest, evidence-based technical assessment of completed and pending milestones'),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                createCell('Component', { isHeader: true, widthPercent: 20 }),
                createCell('Current Built State (ਕੀ ਹੋ ਚੁੱਕਾ ਹੈ)', { isHeader: true, widthPercent: 40 }),
                createCell('Crucial Next Steps (ਹੋਰ ਕੀ ਕਰਨਾ ਬਾਕੀ ਹੈ)', { isHeader: true, widthPercent: 40 }),
              ],
            }),
            new TableRow({
              children: [
                createCell('Backend Core API', { bold: true, widthPercent: 20 }),
                createCell('59 NestJS modules built with Swagger documentation, JWT Auth, and Neon Cloud PostgreSQL Prisma schema.', { widthPercent: 40 }),
                createCell('Deploy Redis caching for peak morning mandi rate queries and WebSocket chat connections.', { widthPercent: 40 }),
              ],
            }),
            new TableRow({
              children: [
                createCell('Payment Gateways', { bold: true, widthPercent: 20, bg: BG_ALT_ROW }),
                createCell('PhonePe and Cashfree payment controllers, webhooks, and UPI checkout handlers are fully coded.', { widthPercent: 40, bg: BG_ALT_ROW }),
                createCell('Switch backend/.env credentials from SANDBOX to live production merchant IDs and verify webhook secrets.', { widthPercent: 40, bg: BG_ALT_ROW }),
              ],
            }),
            new TableRow({
              children: [
                createCell('Admin 4D Hub', { bold: true, widthPercent: 20 }),
                createCell('Dark/Light themes, KPI cards, Excel exports, user directory, and crop disease tools operational.', { widthPercent: 40 }),
                createCell('Consolidate redundant navigation pillars: merge FINANCE & NEW_FINANCE, and consolidate FARMERS & Farm & Garden into clean master hubs.', { widthPercent: 40 }),
              ],
            }),
            new TableRow({
              children: [
                createCell('Logistics & Couriers', { bold: true, widthPercent: 20, bg: BG_ALT_ROW }),
                createCell('Shiprocket API integration service written with AWB tracking and status updates.', { widthPercent: 40, bg: BG_ALT_ROW }),
                createCell('Verify live production webhook callback URL so that DELIVERED status automatically triggers seller escrow payout.', { widthPercent: 40, bg: BG_ALT_ROW }),
              ],
            }),
            new TableRow({
              children: [
                createCell('Offline Field Sync', { bold: true, widthPercent: 20 }),
                createCell('Online mobile and web apps operational with live state.', { widthPercent: 40 }),
                createCell('Implement SQLite / AsyncStorage local caching for spray templates, emergency doctor contacts, and field logs when internet drops.', { widthPercent: 40 }),
              ],
            }),
          ],
        }),

        // ==========================================
        // 6. STRATEGIC RECOMMENDATIONS
        // ==========================================
        ...createSectionHeading('6. Strategic Advisory & Architectural Recommendations', 'High-impact guidelines to maximize scalability, user adoption, and profitability'),
        createBullet('1. Preserve the Unified "Farm & Garden" Brand', 'Do not isolate the platform to farming alone. Urban terrace/balcony gardening represents high-margin retail orders (pots, organic spray, seeds) that complement rural wholesale volumes.'),
        createBullet('2. Lead with a WhatsApp-First Experience', 'Indian farmers prefer WhatsApp over downloading heavy applications. Expanding the Baileys/Meta WhatsApp bot to deliver instant mandi rates and AI leaf diagnostic results with a simple photo upload will accelerate viral adoption.'),
        createBullet('3. Village Franchise Business Partners', 'Appoint local village franchise operators using the BUSINESS_PARTNER role. These partners act as local collection points, solving last-mile rural logistics and offering on-ground assistance.'),
        createBullet('4. Strict Zero-Duplicate Admin Policy', 'Maintain clean administrative separation: all account directories belong exclusively in Users, all crop/agronomy tools in Farm & Garden, and all monetary ledgers in Finance.'),
      ],
    },
  ],
});

Packer.toBuffer(doc)
  .then((buffer) => {
    fs.writeFileSync(outputPath, buffer);
    console.log('SUCCESS: Word document created successfully at: ' + outputPath);
  })
  .catch((err) => {
    console.error('ERROR generating Word document: ', err);
    process.exit(1);
  });
