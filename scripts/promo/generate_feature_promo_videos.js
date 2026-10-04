const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const videosDir = 'd:\\FarmsKing\\videos';
if (!fs.existsSync(videosDir)) {
  fs.mkdirSync(videosDir, { recursive: true });
}

const featuresPB = [
  "ਲਾਈਵ ਮੰਡੀ ਭਾਅ (Live Mandi Rates)",
  "ਫ਼ਸਲ ਡਾਕਟਰ ਲਾਈਵ ਵੀਡੀਓ ਕਾਲ & e-Prescription",
  "ਸੈਟੇਲਾਈਟ NDVI ਫ਼ਸਲ ਸਿਹਤ ਸਕੈਨਿੰਗ",
  "0% ਨਕਲੀ ਦਵਾਈ QR ਸਕੈਨਰ ਗਰੰਟੀ",
  "KingConnect ਡਿਜੀਟਲ ਆੜ੍ਹਤ ਬਹੀ-ਖਾਤਾ & J-Form",
  "ਰੂਫ਼ਟਾਪ ਔਰਗੈਨਿਕ ਕਿਚਨ ਗਾਰਡਨ & ਹੋਮ ਮਾਲੀ ਪਲਾਨ",
  "WhatsApp ਰੈਫਰਲ & ₹100 ਵਾਲਿਟ ਬੋਨਸ",
  "Voice AI ਆਵਾਜ਼ ਨਾਲ ਪੰਜਾਬੀ ਖੋਜ",
  "ਆਟੋ-ਸਪਲਿਟ ਪਾਰਸਲ ਡਿਲੀਵਰੀ & FK-INV ਟੈਕਸ ਬਿਲ",
  "Official Verified Store Tag (✔ Surinder Agro)"
];

const featuresHI = [
  "लाइव मंडी भाव (Live Mandi Rates)",
  "फसल डॉक्टर लाइव वीडियो कॉल & e-Prescription",
  "सैटेलाइट NDVI फसल स्वास्थ्य स्कैनिंग",
  "0% नकली दवा QR स्कैनर गारंटी",
  "KingConnect डिजिटल आढ़त बही-खाता & J-Form",
  "रूफटॉप ऑर्गेनिक किचन गार्डन & होम माली प्लान",
  "WhatsApp रेफरल & ₹100 वॉलेट बोनस",
  "Voice AI आवाज से हिंदी खोज",
  "ऑटो-स्प्लिट पार्सल डिलीवरी & FK-INV टैक्स बिल",
  "Official Verified Store Tag (✔ Surinder Agro)"
];

const characters = [
  "Model Girl (ਮਾਡਲ ਕੁੜੀ)",
  "Model Guy (ਮਾਡਲ ਮੁੰਡਾ)",
  "Farmer Woman (ਕਿਸਾਨ ਔਰਤ)",
  "Farmer Man (ਕਿਸਾਨ ਮਰਦ)",
  "Technical Trainer (ਟ੍ਰੇਨਰ)",
  "Crop Advisor (ਸਲਾਹਕਾਰ)",
  "Seller Store Owner (ਸੇਲਰ)"
];

let promoListPB = [];
let promoListHI = [];
let automationJSON = [];

let counter = 1;
for (let f = 0; f < 10; f++) {
  for (let c = 0; c < 10; c++) {
    const id = counter++;
    const charName = characters[c % characters.length];
    
    // Punjabi 100 Videos
    promoListPB.push({
      id,
      feature: featuresPB[f],
      character: charName,
      aiPrompt: `Cinematic 4k prompt: ${charName} explaining ${featuresPB[f]} on FarmsKing mobile app, photorealistic background, warm studio lighting.`,
      voiceover: `ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ ਜੀ! ਮੈਂ FarmsKing ਤੋਂ ${charName}। ਕੀ ਤੁਸੀਂ ਜਾਣਦੇ ਹੋ FarmsKing ਦਾ ${featuresPB[f]} ਫੀਚਰ ਤੁਹਾਡੇ ਖੇਤ ਅਤੇ ਵਪਾਰ ਦਾ ਮੁਨਾਫ਼ਾ 2 ਗੁਣਾ ਵਧਾ ਸਕਦਾ ਹੈ? FarmsKing ਐਪ ਹੁਣੇ ਡਾਊਨਲੋਡ ਕਰੋ!`
    });

    // Hindi 100 Videos
    promoListHI.push({
      id,
      feature: featuresHI[f],
      character: charName,
      aiPrompt: `Cinematic 4k prompt: ${charName} explaining ${featuresHI[f]} on FarmsKing mobile app, photorealistic background, warm studio lighting.`,
      voiceover: `नमस्ते! मैं FarmsKing से ${charName}। क्या आप जानते हैं FarmsKing का ${featuresHI[f]} फीचर आपकी खेती और व्यापार का मुनाफा 2 गुना बढ़ा सकता है? FarmsKing ऐप अभी डाउनलोड करें!`
    });

    automationJSON.push({
      id,
      featureIndex: f + 1,
      character: charName,
      prompt: `Cinematic 4k prompt: ${charName} demonstrating ${featuresPB[f]} on smartphone screen.`,
      voiceoverPB: promoListPB[promoListPB.length - 1].voiceover,
      voiceoverHI: promoListHI[promoListHI.length - 1].voiceover
    });
  }
}

// Save JSON file
fs.writeFileSync(path.join(videosDir, 'FarmsKing_100_Feature_Promo_Automation.json'), JSON.stringify(automationJSON, null, 2), 'utf8');

const commonStyle = `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Noto+Sans+Gurmukhi:wght@400;600;700&family=Noto+Sans+Devanagari:wght@400;600;700&display=swap');
    body { font-family: 'Inter', 'Noto Sans Gurmukhi', 'Noto Sans Devanagari', sans-serif; margin: 30px; color: #1e293b; line-height: 1.5; }
    h1 { color: #15803d; border-bottom: 3px solid #22c55e; padding-bottom: 8px; font-size: 22px; }
    .card { border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px 14px; margin-bottom: 10px; background: #fafafa; }
    .badge { font-weight: bold; color: #0369a1; font-size: 13px; }
    .ai-prompt { background: #f1f5f9; border: 1px dashed #94a3b8; padding: 4px 8px; border-radius: 4px; font-size: 11.5px; color: #334155; margin: 4px 0; }
    .voiceover { font-style: italic; color: #1e293b; background-color: #fffbeb; border-left: 3px solid #f59e0b; padding: 6px 10px; margin: 4px 0; font-size: 12.5px; }
  </style>
`;

// Build Punjabi HTML
const htmlPB = `
<!DOCTYPE html>
<html lang="pa">
<head><meta charset="utf-8"/><title>FarmsKing 100 Feature Promo Videos PB</title>${commonStyle}</head>
<body>
  <h1>FarmsKing — 100 ਫੀਚਰ ਪ੍ਰਮੋਸ਼ਨਲ ਵੀਡੀਓ ਸਕ੍ਰਿਪਟਾਂ (ਪੰਜਾਬੀ Master Collection)</h1>
  <p>ਕੈਰੈਕਟਰਜ਼: ਮਾਡਲ ਕੁੜੀਆਂ, ਮਾਡਲ ਮੁੰਡੇ, ਕਿਸਾਨ ਔਰਤਾਂ, ਕਿਸਾਨ ਮਰਦ, ਟ੍ਰੇਨਰ, ਸਲਾਹਕਾਰ, ਸੇਲਰ।</p>
  ${promoListPB.map(s => `
    <div class="card">
      <div class="badge">ਵੀਡੀਓ ${s.id}: ${s.feature} (${s.character})</div>
      <div class="ai-prompt"><strong>AI Prompt:</strong> ${s.aiPrompt}</div>
      <div class="voiceover"><strong>Voiceover (Punjabi):</strong> "${s.voiceover}"</div>
    </div>
  `).join('')}
</body>
</html>
`;

// Build Hindi HTML
const htmlHI = `
<!DOCTYPE html>
<html lang="hi">
<head><meta charset="utf-8"/><title>FarmsKing 100 Feature Promo Videos HI</title>${commonStyle}</head>
<body>
  <h1>FarmsKing — 100 फीचर प्रमोशनल वीडियो स्क्रिप्ट्स (हिंदी Master Collection)</h1>
  <p>कैरेक्टर: मॉडल लड़कियां, मॉडल लड़के, किसान महिलाएं, किसान पुरुष, ट्रेनर, सलाहकार, सेलर।</p>
  ${promoListHI.map(s => `
    <div class="card">
      <div class="badge">वीडियो ${s.id}: ${s.feature} (${s.character})</div>
      <div class="ai-prompt"><strong>AI Prompt:</strong> ${s.aiPrompt}</div>
      <div class="voiceover"><strong>Voiceover (Hindi):</strong> "${s.voiceover}"</div>
    </div>
  `).join('')}
</body>
</html>
`;

fs.writeFileSync(path.join(videosDir, 'FarmsKing_100_Feature_Videos_PB.html'), htmlPB, 'utf8');
fs.writeFileSync(path.join(videosDir, 'FarmsKing_100_Feature_Videos_HI.html'), htmlHI, 'utf8');

console.log('100 Feature Promo Video HTMLs created.');

// Convert HTML to PDF via Edge Headless
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const convertToPdf = (htmlFile, pdfFile) => {
  const fullHtml = path.resolve(htmlFile);
  const fullPdf = path.resolve(pdfFile);
  const cmd = `"${edgePath}" --headless --disable-gpu --print-to-pdf="${fullPdf}" "file:///${fullHtml.replace(/\\/g, '/')}"`;
  console.log(`Converting ${path.basename(htmlFile)} to PDF...`);
  execSync(cmd);
};

convertToPdf(path.join(videosDir, 'FarmsKing_100_Feature_Videos_PB.html'), path.join(videosDir, 'FarmsKing_100_Feature_Videos_PB.pdf'));
convertToPdf(path.join(videosDir, 'FarmsKing_100_Feature_Videos_HI.html'), path.join(videosDir, 'FarmsKing_100_Feature_Videos_HI.pdf'));

console.log('Both 100-Feature Promo PDFs generated successfully in d:\\FarmsKing\\videos\\');
