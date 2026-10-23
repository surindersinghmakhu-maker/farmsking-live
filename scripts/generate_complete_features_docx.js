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
  'FarmsKing_Complete_Features_Dossier_Punjabi_English.docx'
);

const PRIMARY_GREEN = '15803D';   // Forest Green
const SECONDARY_GREEN = '16A34A'; // Emerald Green
const ACCENT_GOLD = 'D97706';     // Amber/Gold
const DARK_SLATE = '0F172A';      // Deep text
const SUB_TEXT = '475569';        // Muted text
const BORDER_COLOR = 'CBD5E1';    // Light border

function createSectionHeading(titleEng, titlePun, subtitle) {
  const paragraphs = [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 360, after: 80 },
      children: [
        new TextRun({
          text: titleEng,
          bold: true,
          size: 26,
          color: PRIMARY_GREEN,
          font: 'Segoe UI',
        }),
        new TextRun({
          text: ` (${titlePun})`,
          bold: true,
          size: 24,
          color: SECONDARY_GREEN,
          font: 'Segoe UI',
        }),
      ],
    }),
  ];

  if (subtitle) {
    paragraphs.push(
      new Paragraph({
        spacing: { after: 160 },
        children: [
          new TextRun({
            text: subtitle,
            italics: true,
            color: SUB_TEXT,
            size: 19,
            font: 'Segoe UI',
          }),
        ],
      })
    );
  }

  return paragraphs;
}

function createBilingualFeatureItem(featEng, featPun, descEng, descPun) {
  return [
    new Paragraph({
      bullet: { level: 0 },
      spacing: { before: 80, after: 40 },
      children: [
        new TextRun({
          text: `🔹 ${featEng} / `,
          bold: true,
          color: DARK_SLATE,
          size: 20,
          font: 'Segoe UI',
        }),
        new TextRun({
          text: featPun,
          bold: true,
          color: PRIMARY_GREEN,
          size: 20,
          font: 'Segoe UI',
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 120 },
      indent: { left: 400 },
      children: [
        new TextRun({
          text: `[English]: `,
          bold: true,
          color: SUB_TEXT,
          size: 18,
          font: 'Segoe UI',
        }),
        new TextRun({
          text: descEng + '\n',
          color: DARK_SLATE,
          size: 18,
          font: 'Segoe UI',
        }),
        new TextRun({
          text: `[ਪੰਜਾਬੀ]: `,
          bold: true,
          color: SECONDARY_GREEN,
          size: 18,
          font: 'Segoe UI',
        }),
        new TextRun({
          text: descPun,
          color: DARK_SLATE,
          size: 18,
          font: 'Segoe UI',
        }),
      ],
    }),
  ];
}

// Data model containing all modules and features
const SECTIONS_DATA = [
  {
    titleEng: "1. Home Page & Public Website Features",
    titlePun: "ਮੁੱਖ ਵੈੱਬਸਾਈਟ (ਹੋਮ ਪੇਜ) ਦੇ ਸਾਰੇ ਫੀਚਰਜ਼",
    subtitle: "The public digital storefront, live tickers, and visitor experience",
    items: [
      {
        featEng: "Live APMC Mandi Ticker Bar",
        featPun: "ਲਾਈਵ ਮੰਡੀ ਭਾਅ ਟਿੱਕਰ ਪੱਟੀ",
        descEng: "Real-time scrolling ticker showing verified commodity prices for Wheat, Basmati Rice, Mustard, Potato, Cotton across major hubs (Khanna, Amritsar, Bathinda, Jalandhar) with price change indicators.",
        descPun: "ਲਾਈਵ ਸਕ੍ਰੌਲਿੰਗ ਪੱਟੀ ਜੋ ਪੰਜਾਬ ਅਤੇ ਭਾਰਤ ਦੀਆਂ ਮੁੱਖ ਮੰਡੀਆਂ (ਖੰਨਾ, ਅੰਮ੍ਰਿਤਸਰ, ਬਠਿੰਡਾ, ਜਲੰਧਰ) ਵਿੱਚ ਕਣਕ, ਬਾਸਮਤੀ, ਸਰ੍ਹੋਂ, ਆਲੂ ਅਤੇ ਨਰਮੇ ਦੇ ਤਾਜ਼ਾ ਰੇਟ ਅਤੇ ਵਾਧੇ-ਘਾਟੇ ਦਿਖਾਉਂਦੀ ਹੈ।"
      },
      {
        featEng: "4D Hero Banner & Smart Navigation",
        featPun: "ਮੁੱਖ ਬੈਨਰ ਅਤੇ ਨੈਵੀਗੇਸ਼ਨ ਬਾਰ",
        descEng: "Modern high-impact hero banner with animated slogans, direct download QR codes for iOS/Android apps, language switcher, and instant gateways to Agri-Store, Farming, Gardening, and Crop Doctors.",
        descPun: "ਸ਼ਾਨਦਾਰ 4D ਬੈਨਰ ਜਿਸ ਵਿੱਚ ਐਪ ਡਾਊਨਲੋਡ QR ਕੋਡ, ਸਿੱਧਾ ਐਗਰੀ-ਸਟੋਰ, ਖੇਤੀਬਾੜੀ, ਗਾਰਡਨਿੰਗ ਅਤੇ ਡਾਕਟਰ ਕਾਲ ਦੇ ਸ਼ਾਰਟਕੱਟ ਬਟਨ ਮੌਜੂਦ ਹਨ।"
      },
      {
        featEng: "Live Farmer Activity Telemetry Feed",
        featPun: "ਕਿਸਾਨਾਂ ਦੀ ਲਾਈਵ ਸਰਗਰਮੀ ਫੀਡ",
        descEng: "Dynamic feed showcasing real-time platform transactions, leaf scans, doctor consultations, and supplies delivered to villages in real time to build immense trust.",
        descPun: "ਲਾਈਵ ਫੀਡ ਜੋ ਦਿਖਾਉਂਦੀ ਹੈ ਕਿ ਇਸ ਵੇਲੇ ਕਿਹੜੇ ਪਿੰਡ ਦਾ ਕਿਸਾਨ ਬਿਮਾਰੀ ਸਕੈਨ ਕਰ ਰਿਹਾ ਹੈ, ਕਿਹੜਾ ਡਾਕਟਰ ਸਲਾਹ ਦੇ ਰਿਹਾ ਹੈ ਅਤੇ ਕਿੱਥੇ ਖਾਦ-ਬੀਜ ਦੀ ਡਿਲੀਵਰੀ ਹੋ ਰਹੀ ਹੈ।"
      },
      {
        featEng: "Instant AI Diagnostic Scanner Gateway",
        featPun: "ਸਿੱਧਾ AI ਬਿਮਾਰੀ ਸਕੈਨਰ ਗੇਟਵੇਅ",
        descEng: "Visitors can directly take or upload a crop leaf photo to test the AI scanner immediately without complex registration, generating viral organic onboarding.",
        descPun: "ਬਿਨਾਂ ਲੰਬੇ ਫਾਰਮ ਭਰੇ ਕੋਈ ਵੀ ਕਿਸਾਨ ਹੋਮ ਪੇਜ ਤੋਂ ਹੀ ਪੱਤੇ ਦੀ ਫੋਟੋ ਅਪਲੋਡ ਕਰਕੇ AI ਰਾਹੀਂ ਬਿਮਾਰੀ ਦੀ ਮੁਫ਼ਤ ਜਾਂਚ ਕਰ ਸਕਦਾ ਹੈ।"
      },
      {
        featEng: "Verified Customer & Farmer Testimonials",
        featPun: "ਕਿਸਾਨਾਂ ਅਤੇ ਗਾਹਕਾਂ ਦੇ ਤਸਦੀਕਸ਼ੁਦਾ ਤਜਰਬੇ",
        descEng: "Interactive carousel with reviews and quotes from successful wheat/paddy farmers and urban balcony gardeners detailing yield increases and cost savings.",
        descPun: "ਪ੍ਰਗਤੀਸ਼ੀਲ ਕਿਸਾਨਾਂ ਅਤੇ ਸ਼ਹਿਰੀ ਗਾਰਡਨਰਾਂ ਦੀਆਂ ਸਮੀਖਿਆਵਾਂ, ਜੋ ਦੱਸਦੀਆਂ ਹਨ ਕਿ ਕਿਵੇਂ ਉਹਨਾਂ ਨੇ ਦਵਾਈਆਂ ਦਾ ਖਰਚਾ ਘਟਾਇਆ ਅਤੇ ਝਾੜ ਵਧਾਇਆ।"
      }
    ]
  },
  {
    titleEng: "2. Farmer Login & Full Workspace Features",
    titlePun: "ਕਿਸਾਨ ਲੌਗਇਨ ਅਤੇ ਖੇਤ ਪ੍ਰਬੰਧਨ ਦੇ ਸਾਰੇ ਫੀਚਰਜ਼",
    subtitle: "The comprehensive digital toolkit for commercial agricultural landholders",
    items: [
      {
        featEng: "Farm & Plot Management ERP",
        featPun: "ਖੇਤ ਅਤੇ ਪਲਾਟ ਪ੍ਰਬੰਧਨ ਡਾਇਰੀ",
        descEng: "Add multiple farms, divide acreage into numbered plots (Kila/Acre/Bigha/Hectare), select soil types (Alluvial, Black, Sandy, Clay, Loamy), and tag tubewell/canal water sources with GPS coordinates.",
        descPun: "ਆਪਣੇ ਸਾਰੇ ਖੇਤ ਜੋੜੋ, ਕਿੱਲੇ/ਏਕੜ ਅਨੁਸਾਰ ਪਲਾਟ ਵੰਡੋ, ਮਿੱਟੀ ਦੀ ਕਿਸਮ ਅਤੇ ਟਿਊਬਵੈੱਲ/ਨਹਿਰੀ ਪਾਣੀ ਦਾ ਸਰੋਤ ਦਰਜ ਕਰੋ ਤਾਂ ਜੋ ਵਿਗਿਆਨਕ ਸਲਾਹ ਮਿਲ ਸਕੇ।"
      },
      {
        featEng: "Crop Lifecycle & Variety Tracker",
        featPun: "ਫ਼ਸਲ ਚੱਕਰ ਅਤੇ ਬੀਜ ਕਿਸਮ ਟਰੈਕਰ",
        descEng: "Register sown crops (Wheat, Paddy, Mustard, Cotton, Potato, Sugarcane) with sowing dates, expected harvest dates, seed varieties (e.g. PBW-826, PR-126), and track stages: Plantation, Vegetative, Flowering, Harvesting.",
        descPun: "ਫ਼ਸਲ ਦੀ ਬਿਜਾਈ ਦੀ ਮਿਤੀ, ਬੀਜ ਦੀ ਕਿਸਮ ਅਤੇ ਕਟਾਈ ਦੀ ਸੰਭਾਵਿਤ ਮਿਤੀ ਦਰਜ ਕਰੋ; ਸਿਸਟਮ ਹਰ ਪੜਾਅ (ਪੁੰਗਰਨਾ, ਫੁੱਲ ਪੈਣਾ, ਦਾਣਾ ਪੈਣਾ, ਪੱਕਣਾ) ਦਾ ਰਿਕਾਰਡ ਰੱਖਦਾ ਹੈ।"
      },
      {
        featEng: "AI Neural Leaf Disease Diagnostics",
        featPun: "AI ਪੱਤੇ ਦੀ ਬਿਮਾਰੀ ਸਕੈਨਰ",
        descEng: "Upload diseased plant photos; Google Gemini Vision AI detects diseases (e.g. Yellow Rust, Stem Borer, Blight) in under 2 seconds, specifying severity (Low/Critical) and recommended curative sprays.",
        descPun: "ਬਿਮਾਰ ਪੱਤੇ ਦੀ ਫੋਟੋ ਖਿੱਚੋ; AI ਸਿਸਟਮ 2 ਸਕਿੰਟਾਂ ਵਿੱਚ ਦੱਸੇਗਾ ਕਿ ਕਿਹੜੀ ਉੱਲੀ ਜਾਂ ਕੀੜਾ ਲੱਗਿਆ ਹੈ ਅਤੇ ਕਿੰਨੀ ਮਾਤਰਾ ਵਿੱਚ ਕਿਹੜੀ ਦਵਾਈ ਸਪਰੇਅ ਕਰਨੀ ਚਾਹੀਦੀ ਹੈ।"
      },
      {
        featEng: "Satellite Farm Radar (ISRO & Sentinel-2)",
        featPun: "ਸੈਟੇਲਾਈਟ ਰਾਡਾਰ (ਖੇਤ ਦੀ ਨਮੀ ਤੇ ਹਰਿਆਵਲ)",
        descEng: "View high-resolution satellite imagery over field plots showing Normalized Difference Vegetation Index (NDVI crop vigour) and soil moisture levels to detect drought or waterlogging early.",
        descPun: "ਸੈਟੇਲਾਈਟ ਨਕਸ਼ਿਆਂ ਰਾਹੀਂ ਆਪਣੇ ਖੇਤ ਦੀ ਹਰਿਆਵਲ (NDVI) ਅਤੇ ਮਿੱਟੀ ਵਿਚਲੀ ਨਮੀ ਚੈੱਕ ਕਰੋ, ਜਿਸ ਨਾਲ ਪਾਣੀ ਦੇਣ ਜਾਂ ਖਾਦ ਪਾਉਣ ਦਾ ਸਹੀ ਸਮਾਂ ਪਤਾ ਲੱਗਦਾ ਹੈ।"
      },
      {
        featEng: "20-Item Standard Spray & Dose Calculator",
        featPun: "20-ਆਈਟਮ ਸਪਰੇਅ ਅਤੇ ਖਾਦ ਡੋਜ਼ ਕੈਲਕੁਲੇਟਰ",
        descEng: "Precision calculator for DAP, Urea, Zinc, Potash, Fungicides, and Insecticides; computes exact tank dosage per acre, preventing over-spending and soil chemical burning.",
        descPun: "ਖਾਦ ਅਤੇ ਕੀਟਨਾਸ਼ਕਾਂ ਦਾ ਸਹੀ ਹਿਸਾਬ; ਇਹ ਪ੍ਰਤੀ ਏਕੜ ਅਤੇ ਸਪਰੇਅ ਵਾਲੀ ਢੋਲੀ/ਟੈਂਕੀ ਅਨੁਸਾਰ ਸਹੀ ਮਾਤਰਾ ਦੱਸਦਾ ਹੈ ਤਾਂ ਜੋ ਬੇਲੋੜੀ ਦਵਾਈ ਦੀ ਬਰਬਾਦੀ ਨਾ ਹੋਵੇ।"
      },
      {
        featEng: "Arhtiya Bahi-Khata (Commission Agent Ledger)",
        featPun: "ਆੜ੍ਹਤੀਆ ਬਹੀ-ਖਾਤਾ ਲੇਜਰ (ਹਿਸਾਬ-ਕਿਤਾਬ)",
        descEng: "Track seasonal advances taken from the commission agent, interest percentages, crop harvest sales credits, and calculate exact net balance payouts after mandi cuts.",
        descPun: "ਆੜ੍ਹਤੀਏ ਤੋਂ ਲਏ ਪੇਸ਼ਗੀ ਪੈਸੇ (Advance), ਵਿਆਜ ਦੀ ਦਰ, ਮੰਡੀ ਵਿੱਚ ਵਿਕੀ ਫ਼ਸਲ ਦਾ ਜਮ੍ਹਾਂ ਹਿਸਾਬ ਅਤੇ ਬਾਕੀ ਬਚਦੀ ਰਕਮ ਦਾ ਪੂਰਾ ਪੱਕਾ ਡਿਜੀਟਲ ਖਾਤਾ।"
      },
      {
        featEng: "Labour & Machinery Expense Manager",
        featPun: "ਮਜ਼ਦੂਰੀ ਅਤੇ ਟਰੈਕਟਰ/ਮਸ਼ੀਨਰੀ ਖਰਚਾ ਰਜਿਸਟਰ",
        descEng: "Log daily wages, contract labour (Chhanta/Transplanting/Harvesting), tractor hours, diesel consumption, and implement rentals to know the exact net profit per acre.",
        descPun: "ਦਿਹਾੜੀਦਾਰ ਮਜ਼ਦੂਰਾਂ ਦੀ ਹਾਜ਼ਰੀ, ਝੋਨਾ ਲਵਾਈ/ਕਟਾਈ ਦੇ ਠੇਕੇ, ਟਰੈਕਟਰ ਦੇ ਘੰਟੇ, ਡੀਜ਼ਲ ਅਤੇ ਸੰਦਾਂ ਦੇ ਕਿਰਾਏ ਦਾ ਹਿਸਾਬ ਰੱਖ ਕੇ ਫ਼ਸਲ ਦਾ ਅਸਲ ਮੁਨਾਫ਼ਾ ਜਾਣੋ।"
      },
      {
        featEng: "Farmer Digital Wallet & Cashbacks",
        featPun: "ਕਿਸਾਨ ਵਾਲਿਟ ਅਤੇ ਕੈਸ਼ਬੈਕ ਪਾਸਬੁੱਕ",
        descEng: "Earn instant reward points and cashbacks on purchases of certified seeds and bio-fertilizers; request direct bank withdrawals via UPI.",
        descPun: "ਬੀਜ ਅਤੇ ਖਾਦ ਖਰੀਦਣ ਤੇ ਮਿਲਣ ਵਾਲਾ ਕੈਸ਼ਬੈਕ ਵਾਲਿਟ ਵਿੱਚ ਜਮ੍ਹਾਂ ਹੁੰਦਾ ਹੈ, ਜਿਸਨੂੰ ਕਿਸੇ ਵੀ ਵੇਲੇ ਸਿੱਧਾ ਆਪਣੇ ਬੈਂਕ ਖਾਤੇ ਵਿੱਚ UPI ਰਾਹੀਂ ਕਢਵਾਇਆ ਜਾ ਸਕਦਾ ਹੈ।"
      },
      {
        featEng: "Voice AI Assistant & Multilingual Audio",
        featPun: "ਆਵਾਜ਼ੀ ਏਆਈ ਸਹਾਇਕ (ਬੋਲ ਕੇ ਸਵਾਲ ਪੁੱਛੋ)",
        descEng: "Speech-to-text interface allowing farmers to ask questions in Punjabi, Hindi, or English by voice and receive spoken advice on crop problems.",
        descPun: "ਕਿਸਾਨ ਬੋਲ ਕੇ ਆਪਣੀ ਭਾਸ਼ਾ ਵਿੱਚ ਫ਼ਸਲ ਦੀ ਸਮੱਸਿਆ ਦੱਸ ਸਕਦੇ ਹਨ ਅਤੇ ਸਿਸਟਮ ਬੋਲ ਕੇ ਹੀ ਦਵਾਈ ਅਤੇ ਹੱਲ ਦੱਸਦਾ ਹੈ।"
      }
    ]
  },
  {
    titleEng: "3. Crop Doctor (Advisor) Workspace Features",
    titlePun: "ਕ੍ਰੌਪ ਡਾਕਟਰ (ਐਗਰੋਨੋਮਿਸਟ) ਦੇ ਸਾਰੇ ਫੀਚਰਜ਼",
    subtitle: "Clinical telemedicine console for certified plant doctors and agronomists",
    items: [
      {
        featEng: "Triage & Diagnostic Patient Queue",
        featPun: "ਕਿਸਾਨ ਕੇਸਾਂ ਦੀ ਲਾਈਵ ਮਰੀਜ਼ ਲਿਸਟ (Triage Queue)",
        descEng: "Central queue listing incoming crop problem tickets, leaf scans, and consultation requests filtered by urgency (High Severity blights appear at the top).",
        descPun: "ਡਾਕਟਰ ਦੇ ਡੈਸ਼ਬੋਰਡ ਉੱਤੇ ਕਿਸਾਨਾਂ ਵੱਲੋਂ ਭੇਜੇ ਗਏ ਬਿਮਾਰੀਆਂ ਦੇ ਕੇਸ ਗੰਭੀਰਤਾ ਅਨੁਸਾਰ ਲਾਈਨ ਵਿੱਚ ਲੱਗਦੇ ਹਨ ਤਾਂ ਜੋ ਐਮਰਜੈਂਸੀ ਕੇਸ ਪਹਿਲਾਂ ਹੱਲ ਹੋ ਸਕਣ।"
      },
      {
        featEng: "Verified Digital Prescription Writer",
        featPun: "ਤਸਦੀਕਸ਼ੁਦਾ ਡਿਜੀਟਲ ਈ-ਪਰਚੀ ਲਿਖਣ ਸਿਸਟਮ",
        descEng: "Standardized medical prescription pad to select active chemical salts (e.g. Tebuconazole + Trifloxystrobin), tank dosage, application instructions, and safety precautions.",
        descPun: "ਡਾਕਟਰ ਕੰਪਿਊਟਰ ਜਾਂ ਮੋਬਾਈਲ ਤੋਂ ਕਿਸਾਨ ਲਈ ਅਧਿਕਾਰਤ ਈ-ਪਰਚੀ ਬਣਾਉਂਦਾ ਹੈ, ਜਿਸ ਵਿੱਚ ਦਵਾਈ ਦਾ ਸਹੀ ਫਾਰਮੂਲਾ ਅਤੇ ਸਪਰੇਅ ਕਰਨ ਦਾ ਤਰੀਕਾ ਲਿਖਿਆ ਹੁੰਦਾ ਹੈ।"
      },
      {
        featEng: "1-on-1 Agora Real-Time Video/Audio Consultations",
        featPun: "ਲਾਈਵ ਵੀਡੀਓ ਅਤੇ ਆਡੀਓ ਕਾਲ ਸਿਸਟਮ (Agora)",
        descEng: "HD sub-second video and voice calling console enabling doctors to inspect fields, leaves, and symptoms live with the farmer and speak directly.",
        descPun: "ਡਾਕਟਰ ਕਿਸਾਨ ਨਾਲ ਲਾਈਵ ਵੀਡੀਓ ਕਾਲ ਤੇ ਜੁੜ ਕੇ ਖੇਤ ਵਿੱਚ ਖੜ੍ਹੀ ਫ਼ਸਲ ਅਤੇ ਬਿਮਾਰ ਪੱਤਿਆਂ ਦੀ ਜਾਂਚ ਕਰ ਸਕਦਾ ਹੈ।"
      },
      {
        featEng: "Field Visit Scheduling & VIP Dispatch",
        featPun: "ਖੇਤ ਦੌਰਾ ਸ਼ਡਿਊਲਰ (VIP Farm Visits)",
        descEng: "Calendar to schedule and confirm on-site physical farm visits for VIP members, log GPS arrival, and submit field inspection reports.",
        descPun: "ਵੱਡੇ ਖੇਤਾਂ ਵਿੱਚ ਜਾ ਕੇ ਨਿਰੀਖਣ ਕਰਨ ਲਈ ਕੈਲੰਡਰ, ਜਿਸ ਵਿੱਚ ਕਿਸਾਨ ਦੀ ਲੋਕੇਸ਼ਨ ਅਤੇ ਫਾਰਮ ਵਿਜ਼ਿਟ ਦੀ ਤਰੀਕ ਤੈਅ ਹੁੰਦੀ ਹੈ।"
      },
      {
        featEng: "Doctor Earnings Wallet & 2% TDS Slips",
        featPun: "ਡਾਕਟਰ ਕਮਾਈ ਵਾਲਿਟ ਅਤੇ 2% TDS ਲੇਜਰ",
        descEng: "Tracks consultation fees earned per call/prescription, platform commission cuts, automated 2% TDS deductions, and instant withdrawal to verified bank accounts.",
        descPun: "ਹਰ ਇੱਕ ਕੰਸਲਟੇਸ਼ਨ ਦੀ ਫੀਸ ਦਾ ਲੇਖਾ-ਜੋਖਾ, ਸਰਕਾਰੀ ਨਿਯਮਾਂ ਅਨੁਸਾਰ 2% TDS ਕਟੌਤੀ ਦਾ ਰਿਕਾਰਡ ਅਤੇ ਬੈਂਕ ਖਾਤੇ ਵਿੱਚ ਪੈਸੇ ਕਢਵਾਉਣ ਦੀ ਸਹੂਲਤ।"
      }
    ]
  },
  {
    titleEng: "4. Urban Gardener Workspace Features",
    titlePun: "ਸ਼ਹਿਰੀ ਬਾਗਬਾਨੀ (ਗਾਰਡਨਰ) ਦੇ ਸਾਰੇ ਫੀਚਰਜ਼",
    subtitle: "Dedicated care tools for residential, balcony, and indoor plant enthusiasts",
    items: [
      {
        featEng: "Balcony & Terrace Planter Inventory",
        featPun: "ਬਾਲਕੋਨੀ ਅਤੇ ਛੱਤ ਦੇ ਗਮਲਿਆਂ ਦੀ ਲਿਸਟ",
        descEng: "Catalog household potted plants (Monstera, Ficus, Palms, Roses, Chillies, Herbs), record pot sizes, potting soil type, and location (Sunny/Shaded).",
        descPun: "ਘਰ ਦੇ ਸਾਰੇ ਗਮਲਿਆਂ ਅਤੇ ਪੌਦਿਆਂ ਦਾ ਰਿਕਾਰਡ; ਗਮਲੇ ਦਾ ਸਾਈਜ਼, ਧੁੱਪ/ਛਾਂ ਦੀ ਲੋੜ ਅਤੇ ਪੌਦੇ ਦੀ ਕਿਸਮ ਦਰਜ ਕਰਨ ਦੀ ਸਹੂਲਤ।"
      },
      {
        featEng: "Smart Watering & Fertilizer Reminders",
        featPun: "ਪਾਣੀ ਦੇਣ ਅਤੇ ਖਾਦ ਪਾਉਣ ਦੇ ਰਿਮਾਈਂਡਰ",
        descEng: "Custom reminder alerts for watering, soil loosening, bio-fertilizer sticks, and organic vermicompost top-dressing based on houseplant species.",
        descPun: "ਪੌਦੇ ਦੀ ਲੋੜ ਅਨੁਸਾਰ ਮੋਬਾਈਲ ਤੇ ਆਟੋਮੈਟਿਕ ਅਲਰਟ ਆਉਂਦੇ ਹਨ ਕਿ ਕਿਸ ਗਮਲੇ ਨੂੰ ਕਦੋਂ ਪਾਣੀ ਦੇਣਾ ਹੈ ਅਤੇ ਕਦੋਂ ਵਰਮੀਕੰਪੋਸਟ ਖਾਦ ਪਾਉਣੀ ਹੈ।"
      },
      {
        featEng: "Domestic Plant Disease Diagnoser",
        featPun: "ਘਰੇਲੂ ਪੌਦਿਆਂ ਦਾ ਬਿਮਾਰੀ ਸਕੈਨਰ",
        descEng: "Specialized diagnosis for domestic issues: yellowing indoor leaves, root rot from over-watering, white mealybugs, and spider mites with non-toxic organic cures.",
        descPun: "ਘਰੇਲੂ ਪੌਦਿਆਂ ਦੇ ਪੱਤੇ ਪੀਲੇ ਹੋਣ, ਕੀੜੇ ਲੱਗਣ ਜਾਂ ਜੜ੍ਹਾਂ ਗਲਣ ਦੀ ਸਮੱਸਿਆ ਦਾ ਆਰਗੈਨਿਕ ਅਤੇ ਘਰੇਲੂ ਇਲਾਜ ਦੱਸਣ ਵਾਲਾ ਸਕੈਨਰ।"
      },
      {
        featEng: "Curated Urban Garden Store",
        featPun: "ਸਪੈਸ਼ਲ ਸ਼ਹਿਰੀ ਬਾਗਬਾਨੀ ਸਟੋਰ",
        descEng: "1-click ordering for premium coco peat, vermicompost, sprayers, decorative ceramic pots, indoor plant seeds, and pruning shears.",
        descPun: "ਕੋਕੋਪੀਟ, ਗੰਡੋਆ ਖਾਦ, ਸਜਾਵਟੀ ਗਮਲੇ, ਸਪਰੇਅ ਪੰਪ ਅਤੇ ਬੀਜ ਸਿੱਧੇ ਘਰ ਦੇ ਦਰਵਾਜ਼ੇ ਤੇ ਮੰਗਵਾਉਣ ਦਾ ਬਾਜ਼ਾਰ।"
      }
    ]
  },
  {
    titleEng: "5. Technical Trainer Workspace Features",
    titlePun: "ਟੈਕਨੀਕਲ ਟ੍ਰੇਨਰ ਦੇ ਸਾਰੇ ਫੀਚਰਜ਼",
    subtitle: "Field education, skilling, and digital agriculture workshop console",
    items: [
      {
        featEng: "Trainer Command Dashboard",
        featPun: "ਟ੍ਰੇਨਰ ਕਮਾਂਡ ਡੈਸ਼ਬੋਰਡ",
        descEng: "Central console to schedule farmer skilling camps, track attendance of youth and women farmers, and log field training hours.",
        descPun: "ਪਿੰਡਾਂ ਵਿੱਚ ਲੱਗਣ ਵਾਲੇ ਖੇਤੀ ਸਿਖਲਾਈ ਕੈਂਪਾਂ ਦਾ ਸ਼ਡਿਊਲ, ਕਿਸਾਨਾਂ ਦੀ ਹਾਜ਼ਰੀ ਅਤੇ ਟ੍ਰੇਨਿੰਗ ਘੰਟਿਆਂ ਦਾ ਪੂਰਾ ਹਿਸਾਬ।"
      },
      {
        featEng: "Agronomy Course & Workshop Catalog",
        featPun: "ਐਗਰੋਨੋਮੀ ਕੋਰਸ ਅਤੇ ਵਰਕਸ਼ਾਪ ਲਿਸਟ",
        descEng: "Manage training modules on Precision Drip Irrigation, Natural Farming, Satellite Map Reading, and Safe Chemical Handling.",
        descPun: "ਡ੍ਰਿੱਪ ਸਿੰਚਾਈ, ਕੁਦਰਤੀ ਖੇਤੀ, ਸੈਟੇਲਾਈਟ ਨਕਸ਼ੇ ਪੜ੍ਹਨਾ ਅਤੇ ਦਵਾਈਆਂ ਦੀ ਸੁਰੱਖਿਅਤ ਵਰਤੋਂ ਦੇ ਕੋਰਸ ਚਲਾਉਣ ਦਾ ਸਿਸਟਮ।"
      },
      {
        featEng: "Student & Farmer Certification Generator",
        featPun: "ਕਿਸਾਨ ਸਰਟੀਫਿਕੇਟ ਜਨਰੇਟਰ",
        descEng: "Issues digital completion certificates for rural youth after passing practical agronomy and drone handling evaluations.",
        descPun: "ਟ੍ਰੇਨਿੰਗ ਪੂਰੀ ਕਰਨ ਵਾਲੇ ਨੌਜਵਾਨਾਂ ਅਤੇ ਕਿਸਾਨਾਂ ਲਈ ਡਿਜੀਟਲ ਸਰਟੀਫਿਕੇਟ ਜਾਰੀ ਕਰਨ ਦੀ ਸਹੂਲਤ।"
      }
    ]
  },
  {
    titleEng: "6. Seller (Merchant) Workspace Features",
    titlePun: "ਦੁਕਾਨਦਾਰ (ਵੈਂਡਰ / ਖਾਦ-ਬੀਜ ਡੀਲਰ) ਦੇ ਸਾਰੇ ਫੀਚਰਜ਼",
    subtitle: "Multi-vendor commerce, inventory, packaging, and logistics management system",
    items: [
      {
        featEng: "5-Step Statutory Seller Onboarding",
        featPun: "5-ਪੜਾਵੀ ਕਾਨੂੰਨੀ ਵੈਂਡਰ ਰਜਿਸਟ੍ਰੇਸ਼ਨ",
        descEng: "Self-serve wizard capturing Business Name, GSTIN, Pesticide/Fertilizer License, FSSAI, Bank Account with cancelled cheque, and signed vendor agreement.",
        descPun: "ਦੁਕਾਨ ਦਾ ਨਾਮ, ਜੀ.ਐਸ.ਟੀ. ਨੰਬਰ, ਕੀਟਨਾਸ਼ਕ ਲਾਇਸੰਸ, ਬੈਂਕ ਖਾਤਾ ਅਤੇ ਸਮਝੌਤਾ ਅਪਲੋਡ ਕਰਕੇ ਵੈਂਡਰ ਬਣਨ ਦਾ ਆਸਾਨ ਤਰੀਕਾ।"
      },
      {
        featEng: "Product Catalog & Multi-Variant Inventory",
        featPun: "ਪ੍ਰੋਡਕਟ ਲਿਸਟਿੰਗ ਅਤੇ ਵੇਰੀਐਂਟ ਸਟਾਕ",
        descEng: "Manage products with pack sizes (100ml, 500ml, 1L, 5kg, 50kg bag), MRP, discounted selling price, batch number, expiry date, dead weight (kg), and package dimensions.",
        descPun: "ਵੱਖ-ਵੱਖ ਪੈਕਿੰਗ (100ml, 1L, 50kg ਬੋਰੀ), MRP, ਛੋਟ ਵਾਲਾ ਰੇਟ, ਬੈਚ ਨੰਬਰ, ਐਕਸਪਾਇਰੀ ਅਤੇ ਪਾਰਸਲ ਦਾ ਵਜ਼ਨ ਦਰਜ ਕਰਕੇ ਸਟਾਕ ਸੰਭਾਲਣਾ।"
      },
      {
        featEng: "Live Order Packaging & Dispatch Queue",
        featPun: "ਲਾਈਵ ਆਰਡਰ ਪੈਕਿੰਗ ਅਤੇ ਡਿਸਪੈਚ ਲਾਈਨ",
        descEng: "Order state transitions: Placed ➔ Confirmed ➔ Packing ➔ Dispatched ➔ Delivered; generates automated packing slips for store warehouse staff.",
        descPun: "ਆਰਡਰ ਆਉਣ ਤੇ ਪੈਕਿੰਗ ਸਲਿੱਪ ਕੱਢਣਾ, ਆਰਡਰ ਨੂੰ 'ਪੈਕ ਕੀਤਾ' ਅਤੇ 'ਭੇਜਿਆ' ਮਾਰਕ ਕਰਨਾ।"
      },
      {
        featEng: "Shiprocket 1-Click Courier AWB Generation",
        featPun: "Shiprocket ਰਾਹੀਂ 1-ਕਲਿੱਕ ਪਾਰਸਲ ਲੇਬਲ (AWB)",
        descEng: "Automatically books courier pickups with leading express logistics providers, generates shipping labels with barcodes, and attaches tracking links.",
        descPun: "ਇੱਕ ਕਲਿੱਕ ਨਾਲ ਕੋਰੀਅਰ ਬੁੱਕ ਹੋ ਜਾਂਦਾ ਹੈ, ਬਾਰਕੋਡ ਵਾਲਾ ਪਾਰਸਲ ਲੇਬਲ ਨਿਕਲਦਾ ਹੈ ਅਤੇ ਕਿਸਾਨ ਨੂੰ ਟਰੈਕਿੰਗ ਨੰਬਰ ਮਿਲ ਜਾਂਦਾ ਹੈ।"
      },
      {
        featEng: "Automated Payouts & 1% GST TCS Compliance",
        featPun: "ਆਟੋਮੈਟਿਕ ਵਿਕਰੀ ਪੇਆਊਟਸ ਅਤੇ 1% GST TCS ਲੇਜਰ",
        descEng: "Weekly automated settlement of delivered orders after platform commission and mandatory 1% GST Tax Collected at Source (TCS) deduction.",
        descPun: "ਆਰਡਰ ਡਿਲੀਵਰ ਹੁੰਦੇ ਹੀ ਦੁਕਾਨਦਾਰ ਦੇ ਪੈਸੇ ਵਾਲਿਟ ਵਿੱਚ ਆਉਂਦੇ ਹਨ ਅਤੇ ਸਰਕਾਰੀ ਨਿਯਮਾਂ ਮੁਤਾਬਕ 1% GST TCS ਕੱਟ ਕੇ ਪੱਕੀ ਸਟੇਟਮੈਂਟ ਬਣਦੀ ਹੈ।"
      }
    ]
  },
  {
    titleEng: "7. Trader & Arhtiya Workspace Features",
    titlePun: "ਵਪਾਰੀ ਅਤੇ ਆੜ੍ਹਤੀਆ ਡੈਸ਼ਬੋਰਡ ਦੇ ਸਾਰੇ ਫੀਚਰਜ਼",
    subtitle: "Wholesale mandi procurement and financial clearing engine",
    items: [
      {
        featEng: "Live Mandi Bidding & Procurement Board",
        featPun: "ਲਾਈਵ ਮੰਡੀ ਬੋਲੀ ਅਤੇ ਖਰੀਦ ਬੋਰਡ",
        descEng: "Real-time rate boards for grain procurement, grain quality moisture ratings, and minimum support price (MSP) comparative trackers.",
        descPun: "ਮੰਡੀ ਵਿੱਚ ਫ਼ਸਲ ਦੀ ਬੋਲੀ ਲਗਾਉਣ, ਦਾਣੇ ਦੀ ਨਮੀ ਚੈੱਕ ਕਰਨ ਅਤੇ ਸਰਕਾਰੀ MSP ਰੇਟ ਨਾਲ ਮੁਕਾਬਲਾ ਕਰਨ ਦਾ ਲਾਈਵ ਬੋਰਡ।"
      },
      {
        featEng: "Bahi-Khata Multi-Party Ledger",
        featPun: "ਮਲਟੀ-ਪਾਰਟੀ ਬਹੀ-ਖਾਤਾ ਲੇਜਰ",
        descEng: "Maintains dual ledger balance sheets for multiple farmers and wholesale buyers; logs advances, grain arrivals, commission cuts, and final settlements.",
        descPun: "ਸੈਂਕੜੇ ਕਿਸਾਨਾਂ ਨਾਲ ਲੈਣ-ਦੇਣ, ਪੇਸ਼ਗੀ ਰਕਮ, ਮੰਡੀ ਫੀਸ, ਆੜ੍ਹਤ (ਕਮਿਸ਼ਨ) ਅਤੇ ਕਟੌਤੀਆਂ ਦਾ ਪੱਕਾ ਖਾਤਾ।"
      },
      {
        featEng: "Mandi Unit Conversion Engine",
        featPun: "ਮੰਡੀ ਯੂਨਿਟ ਕੈਲਕੁਲੇਟਰ",
        descEng: "Automatic instant conversions between Quintals, 50kg Bags, 35kg Bags, Mann, and Kilograms with automated rounding and net weight deduction for gunny bags.",
        descPun: "ਕੁਇੰਟਲ, 50 ਕਿਲੋ ਦੀ ਬੋਰੀ, ਮਣ ਅਤੇ ਕਿੱਲੋਗ੍ਰਾਮ ਦਾ ਆਟੋਮੈਟਿਕ ਹਿਸਾਬ ਅਤੇ ਬਾਰਦਾਨੇ (ਗੱਟੇ) ਦਾ ਵਜ਼ਨ ਕੱਟ ਕੇ ਅਸਲ ਵਜ਼ਨ ਕੱਢਣ ਦੀ ਸਹੂਲਤ।"
      }
    ]
  },
  {
    titleEng: "8. Supervisor & Operator Workspace Features",
    titlePun: "ਸੁਪਰਵਾਈਜ਼ਰ ਅਤੇ ਆਪਰੇਟਰ ਦੇ ਸਾਰੇ ਫੀਚਰਜ਼",
    subtitle: "Field execution and logistics hub fulfillment tools",
    items: [
      {
        featEng: "Assigned Farms Spray Execution Tracker",
        featPun: "ਖੇਤ ਸਪਰੇਅ ਨਿਗਰਾਨੀ ਸਿਸਟਮ",
        descEng: "Supervisors verify on-ground that recommended pesticides are sprayed with correct water ratios and safety gear on assigned client plots.",
        descPun: "ਸੁਪਰਵਾਈਜ਼ਰ ਖੇਤ ਵਿੱਚ ਖੜ੍ਹ ਕੇ ਦੇਖਦਾ ਹੈ ਕਿ ਸਿਫਾਰਸ਼ ਕੀਤੀ ਦਵਾਈ ਸਹੀ ਪਾਣੀ ਵਿੱਚ ਮਿਲਾ ਕੇ ਅਤੇ ਸੁਰੱਖਿਆ ਨਾਲ ਛਿੜਕੀ ਗਈ ਹੈ।"
      },
      {
        featEng: "Labour Attendance & Wage Register",
        featPun: "ਮਜ਼ਦੂਰ ਹਾਜ਼ਰੀ ਅਤੇ ਦਿਹਾੜੀ ਰਜਿਸਟਰ",
        descEng: "Daily check-in and check-out for farm labourers, overtime logging, and weekly wage slip generation.",
        descPun: "ਖੇਤ ਮਜ਼ਦੂਰਾਂ ਦੀ ਰੋਜ਼ਾਨਾ ਹਾਜ਼ਰੀ, ਓਵਰਟਾਈਮ ਅਤੇ ਦਿਹਾੜੀ ਦੀ ਪਰਚੀ ਬਣਾਉਣ ਦੀ ਸਹੂਲਤ।"
      },
      {
        featEng: "Warehouse Order Fulfillment Console",
        featPun: "ਵੇਅਰਹਾਊਸ ਆਰਡਰ ਪੈਕਿੰਗ ਕੰਸੋਲ",
        descEng: "Operators scan barcodes, verify product expiry dates, box items securely, and hand over parcels to courier pickup agents.",
        descPun: "ਆਪਰੇਟਰ ਬਾਰਕੋਡ ਸਕੈਨ ਕਰਕੇ ਦਵਾਈਆਂ ਦੀ ਐਕਸਪਾਇਰੀ ਚੈੱਕ ਕਰਦੇ ਹਨ, ਡੱਬੇ ਪੈਕ ਕਰਦੇ ਹਨ ਅਤੇ ਕੋਰੀਅਰ ਵਾਲੇ ਨੂੰ ਸੌਂਪਦੇ ਹਨ।"
      }
    ]
  },
  {
    titleEng: "9. E-Commerce Marketplace & Agri-Store Features",
    titlePun: "ਈ-ਕਾਮਰਸ ਸਟੋਰ ਅਤੇ ਖਰੀਦਦਾਰੀ ਬਾਜ਼ਾਰ ਦੇ ਸਾਰੇ ਫੀਚਰਜ਼",
    subtitle: "The comprehensive marketplace for seeds, crop nutrients, tools, and garden kits",
    items: [
      {
        featEng: "Intelligent Search & Salt-Based Filters",
        featPun: "ਸਮਾਰਟ ਖੋਜ ਅਤੇ ਦਵਾਈ ਫਾਰਮੂਲਾ ਫਿਲਟਰ",
        descEng: "Search products by brand name or technical chemical salt (e.g. Chlorantraniliprole, Azoxystrobin, Trichoderma, NPK 19-19-19).",
        descPun: "ਕਿਸਾਨ ਦਵਾਈ ਦੇ ਬ੍ਰਾਂਡ ਨਾਮ ਜਾਂ ਅਸਲ ਕੈਮੀਕਲ ਫਾਰਮੂਲੇ (ਲੂਣ/Salt) ਰਾਹੀਂ ਸਿੱਧੀ ਦਵਾਈ ਲੱਭ ਸਕਦੇ ਹਨ।"
      },
      {
        featEng: "Multi-Tier Cart & Instant UPI Checkout",
        featPun: "ਮਲਟੀ-ਆਈਟਮ ਕਾਰਟ ਅਤੇ ਤੇਜ਼ UPI ਪੇਮੈਂਟ",
        descEng: "Add items from multiple sellers; system automatically calculates combined shipping, applies discount coupons, and supports PhonePe/GooglePay/Cashfree UPI QR checkout.",
        descPun: "ਵੱਖ-ਵੱਖ ਦੁਕਾਨਾਂ ਤੋਂ ਸਾਮਾਨ ਇੱਕੋ ਕਾਰਟ ਵਿੱਚ ਪਾਓ; ਕੂਪਨ ਲਗਾਓ ਅਤੇ ਫੋਨ-ਪੇਅ ਜਾਂ ਗੂਗਲ-ਪੇਅ ਰਾਹੀਂ ਇੱਕ ਸਕਿੰਟ ਵਿੱਚ ਪੇਮੈਂਟ ਕਰੋ।"
      },
      {
        featEng: "Live Order Tracking (Doorstep Village Tracking)",
        featPun: "ਲਾਈਵ ਆਰਡਰ ਟਰੈਕਿੰਗ (ਪਿੰਡ ਤੱਕ ਪਹੁੰਚ)",
        descEng: "Track parcel movement from store dispatch to transit hubs, out-for-delivery alerts, and delivery confirmation OTP.",
        descPun: "ਦੁਕਾਨ ਤੋਂ ਲੈ ਕੇ ਪਿੰਡ ਦੇ ਘਰ ਤੱਕ ਪਾਰਸਲ ਦੀ ਲਾਈਵ ਲੋਕੇਸ਼ਨ ਦੇਖੋ ਅਤੇ ਡਿਲੀਵਰੀ ਵੇਲੇ OTP ਨਾਲ ਸੁਰੱਖਿਅਤ ਸਾਮਾਨ ਲਵੋ।"
      }
    ]
  },
  {
    titleEng: "10. Admin 4D Command Center & All Tools",
    titlePun: "ਮਾਸਟਰ ਐਡਮਿਨ 4D ਕਮਾਂਡ ਸੈਂਟਰ ਦੇ ਸਾਰੇ ਟੂਲਜ਼",
    subtitle: "The sovereign executive cockpit overseeing the entire platform",
    items: [
      {
        featEng: "Real-Time 4D Executive Telemetry Hub",
        featPun: "ਲਾਈਵ 4D ਐਗਜ਼ੈਕਟਿਵ ਟੈਲੀਮੈਟਰੀ ਡੈਸ਼ਬੋਰਡ",
        descEng: "Real-time business performance cards: Gross Merchandise Value (GMV), Active Orders, Live Doctor Video Consultations, System Health Radar (99.9% Uptime), and Server Load.",
        descPun: "ਪਲੇਟਫਾਰਮ ਦੀ ਕੁੱਲ ਵਿਕਰੀ, ਚੱਲ ਰਹੇ ਆਰਡਰ, ਲਾਈਵ ਡਾਕਟਰ ਕਾਲਾਂ ਅਤੇ ਸਰਵਰ ਦੀ ਸਿਹਤ ਦਿਖਾਉਣ ਵਾਲਾ ਮਾਸਟਰ ਡੈਸ਼ਬੋਰਡ।"
      },
      {
        featEng: "Universal User Directory & KYC Inspection",
        featPun: "ਯੂਜ਼ਰ ਡਾਇਰੈਕਟਰੀ ਅਤੇ KYC ਤਸਦੀਕ ਟੂਲ",
        descEng: "Single unified interface to search, inspect, verify, or block Farmers, Crop Doctors, Sellers, Traders, and Staff. One-click document verification for GSTIN and pesticide licenses.",
        descPun: "ਸਾਰੇ ਕਿਸਾਨਾਂ, ਡਾਕਟਰਾਂ, ਵੈਂਡਰਾਂ ਅਤੇ ਸਟਾਫ ਦੀ ਪੂਰੀ ਲਿਸਟ; ਦੁਕਾਨਾਂ ਦੇ ਲਾਇਸੰਸ ਅਤੇ ਬੈਂਕ ਖਾਤੇ ਚੈੱਕ ਕਰਕੇ ਅਪਰੂਵ ਜਾਂ ਬਲਾਕ ਕਰਨ ਦਾ ਸਿਸਟਮ।"
      },
      {
        featEng: "Payout Approvals & Treasury Management",
        featPun: "ਪੇਆਊਟ ਅਪਰੂਵਲ ਅਤੇ ਖਜ਼ਾਨਾ ਪ੍ਰਬੰਧਨ",
        descEng: "Review pending bank withdrawal requests from sellers and doctors, verify 2% TDS calculations, attach bank UTR payment proofs, and approve transactions with 1 click.",
        descPun: "ਦੁਕਾਨਦਾਰਾਂ ਅਤੇ ਡਾਕਟਰਾਂ ਵੱਲੋਂ ਪੈਸੇ ਕਢਵਾਉਣ ਦੀਆਂ ਬੇਨਤੀਆਂ ਦੀ ਜਾਂਚ ਕਰਨਾ, ਬੈਂਕ ਦਾ UTR ਨੰਬਰ ਪਾ ਕੇ ਪੇਮੈਂਟ ਪਾਸ ਕਰਨਾ।"
      },
      {
        featEng: "Marketing Coupons & Referral Rules Engine",
        featPun: "ਕੂਪਨ ਅਤੇ ਰੈਫਰਲ ਕਮਿਸ਼ਨ ਇੰਜਣ",
        descEng: "Create discount vouchers (Percentage or Fixed amount), partner referral invite codes, and set commission payouts for rural business partners.",
        descPun: "ਨਵੇਂ ਗਾਹਕਾਂ ਲਈ ਛੋਟ ਵਾਲੇ ਕੂਪਨ ਬਣਾਉਣਾ ਅਤੇ ਪਿੰਡ ਦੇ ਪਾਰਟਨਰਾਂ ਲਈ ਰੈਫਰਲ ਕਮਿਸ਼ਨ ਨਿਯਮ ਤੈਅ ਕਰਨਾ।"
      },
      {
        featEng: "Crop Master & Agronomy Knowledge Registry",
        featPun: "ਕ੍ਰੌਪ ਮਾਸਟਰ ਅਤੇ ਐਗਰੋਨੋਮੀ ਡਾਟਾਬੇਸ",
        descEng: "Add and update crop varieties, standard fertilizer schedules, disease symptom pictures, and climate advisory matrices across India.",
        descPun: "ਨਵੀਆਂ ਫ਼ਸਲਾਂ, ਬੀਜਾਂ ਦੀਆਂ ਕਿਸਮਾਂ, ਖਾਦਾਂ ਦੀਆਂ ਸਿਫ਼ਾਰਸ਼ਾਂ ਅਤੇ ਬਿਮਾਰੀਆਂ ਦੇ ਲੱਛਣਾਂ ਦਾ ਮਾਸਟਰ ਡਾਟਾਬੇਸ ਸੰਭਾਲਣਾ।"
      },
      {
        featEng: "C-Panel, Integrations & Cloud Webhooks",
        featPun: "ਸੀ-ਪੈਨਲ, ਇੰਟੀਗ੍ਰੇਸ਼ਨਜ਼ ਅਤੇ ਵੈੱਬਹੁੱਕ ਸਿਸਟਮ",
        descEng: "Manage external cloud connections: PhonePe/Cashfree payment keys, Agora RTC tokens, Shiprocket credentials, Meta/Baileys WhatsApp bot switches, and SMS gateways.",
        descPun: "ਸਾਰੇ ਪੇਮੈਂਟ ਗੇਟਵੇਅ, ਵੀਡੀਓ ਕਾਲਿੰਗ, ਸ਼ਿਪਰਾਕਟ ਕੋਰੀਅਰ ਅਤੇ ਵਟਸਐਪ ਬੌਟ ਦੀਆਂ ਕੁੰਜੀਆਂ (API Keys) ਕੰਟਰੋਲ ਕਰਨ ਵਾਲਾ ਸੀ-ਪੈਨਲ।"
      },
      {
        featEng: "Immutable Security Audit Log",
        featPun: "ਸੁਰੱਖਿਆ ਆਡਿਟ ਲੌਗ (ਕਿਸੇ ਵੀ ਬਦਲਾਅ ਦਾ ਪੱਕਾ ਰਿਕਾਰਡ)",
        descEng: "Cryptographically verified, tamper-evident log capturing every admin action, login timestamp, wallet adjustment, and permission change.",
        descPun: "ਕਿਸੇ ਵੀ ਐਡਮਿਨ ਜਾਂ ਸਟਾਫ ਵੱਲੋਂ ਕੀਤੇ ਗਏ ਹਰ ਕੰਮ, ਲੌਗਇਨ ਸਮੇਂ ਅਤੇ ਪੈਸਿਆਂ ਦੇ ਬਦਲਾਅ ਦਾ ਪੱਕਾ ਅਣਮਿਟ ਰਿਕਾਰਡ।"
      },
      {
        featEng: "Live User Impersonation Console",
        featPun: "ਲਾਈਵ ਯੂਜ਼ਰ ਇਮਪਰਸਨੇਸ਼ਨ (ਗਾਹਕ ਸਹਾਇਤਾ ਲਈ)",
        descEng: "Allows authorized Super Admins to view the platform exactly as a specific farmer or seller sees it, enabling instant resolution of customer complaints.",
        descPun: "ਗਾਹਕ ਦੀ ਸ਼ਿਕਾਇਤ ਹੱਲ ਕਰਨ ਲਈ ਸੁਪਰ ਐਡਮਿਨ ਕਿਸੇ ਵੀ ਕਿਸਾਨ ਜਾਂ ਦੁਕਾਨਦਾਰ ਦੇ ਖਾਤੇ ਵਿੱਚ ਜਾ ਕੇ ਉਸਦੀ ਸਕ੍ਰੀਨ ਦੇਖ ਸਕਦਾ ਹੈ।"
      }
    ]
  }
];

// Build document sections
const docChildren = [
  // TITLE BANNER
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 60 },
    children: [
      new TextRun({
        text: '👑 FARMSKING TECHNOLOGIES PRIVATE LIMITED',
        bold: true,
        size: 32,
        color: PRIMARY_GREEN,
        font: 'Segoe UI',
      }),
    ],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
    children: [
      new TextRun({
        text: 'COMPLETE SYSTEM FEATURES & ROLE MATRIX (BILINGUAL DOSSIER)',
        bold: true,
        size: 22,
        color: DARK_SLATE,
        font: 'Segoe UI',
      }),
    ],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: [
      new TextRun({
        text: 'ਫਾਰਮਸਕਿੰਗ ਸਿਸਟਮ ਦੇ ਸਾਰੇ ਫੀਚਰਜ਼, ਲੌਗਇਨ ਡੈਸ਼ਬੋਰਡ, ਟੈਬਸ ਅਤੇ ਮੌਡਿਊਲਜ਼ ਦਾ ਪੂਰਾ ਵੇਰਵਾ (ਪੰਜਾਬੀ ਅਤੇ ਅੰਗਰੇਜ਼ੀ)',
        bold: true,
        size: 20,
        color: SECONDARY_GREEN,
        font: 'Segoe UI',
      }),
    ],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 240 },
    children: [
      new TextRun({
        text: 'Exhaustive Directory: Home Page • Farmer • Gardener • Crop Doctor • Trainer • Seller • Trader • Admin 4D Command Center • E-Commerce',
        italics: true,
        size: 17,
        color: SUB_TEXT,
        font: 'Segoe UI',
      }),
    ],
  }),
  new Paragraph({
    spacing: { after: 200 },
    children: [
      new TextRun({
        text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        color: BORDER_COLOR,
        size: 18,
      }),
    ],
  }),
];

// Append all sections and feature items
SECTIONS_DATA.forEach((sec) => {
  docChildren.push(...createSectionHeading(sec.titleEng, sec.titlePun, sec.subtitle));
  sec.items.forEach((item) => {
    docChildren.push(...createBilingualFeatureItem(item.featEng, item.featPun, item.descEng, item.descPun));
  });
});

// Summary Footer
docChildren.push(
  new Paragraph({
    spacing: { before: 300, after: 100 },
    children: [
      new TextRun({
        text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        color: BORDER_COLOR,
        size: 18,
      }),
    ],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 60 },
    children: [
      new TextRun({
        text: 'FARMSKING TECHNOLOGIES PRIVATE LIMITED • All Rights Reserved • Master Software Architecture Dossier',
        bold: true,
        size: 16,
        color: PRIMARY_GREEN,
        font: 'Segoe UI',
      }),
    ],
  })
);

const doc = new Document({
  sections: [
    {
      properties: {
        page: {
          margin: {
            top: 1440,
            bottom: 1440,
            left: 1440,
            right: 1440,
          },
        },
      },
      children: docChildren,
    },
  ],
});

Packer.toBuffer(doc)
  .then((buffer) => {
    fs.writeFileSync(outputPath, buffer);
    console.log('SUCCESS: Bilingual Complete Features Dossier created at: ' + outputPath);
  })
  .catch((err) => {
    console.error('ERROR creating Features Dossier: ', err);
    process.exit(1);
  });
