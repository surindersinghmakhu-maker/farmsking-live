const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const videosDir = 'd:\\FarmsKing\\videos';
if (!fs.existsSync(videosDir)) {
  fs.mkdirSync(videosDir, { recursive: true });
}

const characters = [
  { role: 'Model Girl / Modern Host', count: 10, avatar: 'Glamorous young modern Indian female host in smart casuals standing in an apple orchard holding a sleek smartphone.' },
  { role: 'Desi Kissan (ਦੇਸੀ ਕਿਸਾਨ)', count: 15, avatar: 'Traditional Punjabi farmer in yellow turban and white kurta pajama standing in lush green wheat field with proud smile.' },
  { role: 'Desi Woman / Farmer Woman (ਕਿਸਾਨ ਔਰਤ)', count: 10, avatar: 'Warm rural Punjabi woman in colorful traditional suit holding fresh harvested vegetables in farm terrace.' },
  { role: 'Shopkeeper / Agri Dealer (ਦੁਕਾਨਦਾਰ)', count: 10, avatar: 'Agri shop owner standing in front of his fertilizer store with FarmsKing Verified Store banner.' },
  { role: 'Crop Advisor / Agronomist (ਸਲਾਹਕਾਰ)', count: 10, avatar: 'Smart young Agronomist holding digital tablet with satellite NDVI crop health scan overlay.' },
  { role: 'Technical Trainer / Youth (ਟ੍ਰੇਨਰ)', count: 10, avatar: 'Energetic village youth wearing FarmsKing cap helping senior farmer signup with KingID.' },
  { role: 'FarmsKing Owner / Founder (ਫਾਊਂਡਰ)', count: 10, avatar: 'Visionary tech founder in formal blazer standing in front of digital farm data dashboard map.' },
  { role: 'Arhti / Mandi Trader (ਆੜ੍ਹਤੀਆ)', count: 10, avatar: 'Respectable mandi trader sitting at his wooden desk with computer displaying KingConnect ledger.' },
  { role: 'Seller / Merchant (ਸੇਲਰ)', count: 15, avatar: 'Store owner packing genuine seed bags with FarmsKing QR code scanner and GST Tax Invoice.' }
];

let scriptListPB = [];
let scriptListHI = [];
let scriptListEN = [];
let scriptListJSON = [];

let counter = 1;
for (const char of characters) {
  for (let i = 1; i <= char.count; i++) {
    const id = counter++;
    
    // Generate Punjabi Script
    const pbScript = {
      id,
      character: char.role,
      title: `${char.role} — ਵੀਡੀਓ ${id}`,
      aiPrompt: `${char.avatar} 4k cinematic lighting, ultra detailed, photorealistic photostudio lighting.`,
      voiceover: `ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ ਜੀ! ਮੈਂ FarmsKing ਪਲੇਟਫਾਰਮ ਤੋਂ ${char.role}। ਸਾਡੀ ਐਪ ਨਾਲ ਜੁੜ ਕੇ ਖੇਤੀਬਾੜੀ, ਮੰਡੀ ਭਾਅ ਅਤੇ ਫ਼ਸਲ ਡਾਕਟਰ ਦੀ ਸਹੀ ਸਲਾਹ ਪਾਓ! ਐਪ ਹੁਣੇ ਡਾਊਨਲੋਡ ਕਰੋ।`,
    };

    // Generate Hindi Script
    const hiScript = {
      id,
      character: char.role,
      title: `${char.role} — वीडियो ${id}`,
      aiPrompt: `${char.avatar} 4k cinematic lighting, ultra detailed, photorealistic photostudio lighting.`,
      voiceover: `नमस्ते! मैं FarmsKing प्लेटफॉर्म से ${char.role}। हमारी ऐप से जुड़कर कृषि, मंडी भाव और फसल डॉक्टर की सही सलाह पाएं! ऐप अभी डाउनलोड करें।`,
    };

    // Generate English Script
    const enScript = {
      id,
      character: char.role,
      title: `${char.role} — Video ${id}`,
      aiPrompt: `${char.avatar} 4k cinematic lighting, ultra detailed, photorealistic photostudio lighting.`,
      voiceover: `Hello everyone! I am ${char.role} on FarmsKing Platform. Join our app for smart crop care, live mandi prices, and crop doctor consultations! Download now.`,
    };

    scriptListPB.push(pbScript);
    scriptListHI.push(hiScript);
    scriptListEN.push(enScript);
    scriptListJSON.push({ id, role: char.role, prompt: pbScript.aiPrompt, voiceoverPB: pbScript.voiceover, voiceoverHI: hiScript.voiceover, voiceoverEN: enScript.voiceover });
  }
}

// Save JSON file for AI Video Pipelines
fs.writeFileSync(path.join(videosDir, 'FarmsKing_100_Character_Scripts.json'), JSON.stringify(scriptListJSON, null, 2), 'utf8');

const commonStyle = `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Noto+Sans+Gurmukhi:wght@400;600;700&family=Noto+Sans+Devanagari:wght@400;600;700&display=swap');
    body { font-family: 'Inter', 'Noto Sans Gurmukhi', 'Noto Sans Devanagari', sans-serif; margin: 30px; color: #1e293b; line-height: 1.5; }
    h1 { color: #15803d; border-bottom: 3px solid #22c55e; padding-bottom: 8px; font-size: 22px; }
    .card { border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px 14px; margin-bottom: 10px; background: #fafafa; }
    .char-badge { font-weight: bold; color: #0369a1; font-size: 13px; }
    .ai-prompt { background: #f1f5f9; border: 1px dashed #94a3b8; padding: 4px 8px; border-radius: 4px; font-size: 11.5px; color: #334155; margin: 4px 0; }
    .voiceover { font-style: italic; color: #1e293b; background-color: #fffbeb; border-left: 3px solid #f59e0b; padding: 6px 10px; margin: 4px 0; font-size: 12.5px; }
  </style>
`;

// Build HTMLs
const buildHtml = (title, lang, scriptList) => `
<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="utf-8"/><title>${title}</title>${commonStyle}</head>
<body>
  <h1>FarmsKing — 100 AI Character Video Scripts Master Collection</h1>
  <p>Character Breakdown: Model Girl (10), Desi Kissan (15), Farmer Woman (10), Shopkeeper (10), Advisor (10), Trainer (10), Owner (10), Arhti (10), Seller (15).</p>
  ${scriptList.map(s => `
    <div class="card">
      <div class="char-badge">Video ${s.id}: ${s.character}</div>
      <div class="ai-prompt"><strong>AI Prompt:</strong> ${s.aiPrompt}</div>
      <div class="voiceover"><strong>Voiceover:</strong> "${s.voiceover}"</div>
    </div>
  `).join('')}
</body>
</html>
`;

fs.writeFileSync(path.join(videosDir, 'FarmsKing_100_Character_Scripts_PB.html'), buildHtml('FarmsKing 100 Character Video Scripts PB', 'pa', scriptListPB), 'utf8');
fs.writeFileSync(path.join(videosDir, 'FarmsKing_100_Character_Scripts_HI.html'), buildHtml('FarmsKing 100 Character Video Scripts HI', 'hi', scriptListHI), 'utf8');
fs.writeFileSync(path.join(videosDir, 'FarmsKing_100_Character_Scripts_EN.html'), buildHtml('FarmsKing 100 Character Video Scripts EN', 'en', scriptListEN), 'utf8');

console.log('100 Character Video HTML & JSON files created.');

// Convert HTML to PDF via Edge Headless
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const convertToPdf = (htmlFile, pdfFile) => {
  const fullHtml = path.resolve(htmlFile);
  const fullPdf = path.resolve(pdfFile);
  const cmd = `"${edgePath}" --headless --disable-gpu --print-to-pdf="${fullPdf}" "file:///${fullHtml.replace(/\\/g, '/')}"`;
  console.log(`Converting ${path.basename(htmlFile)} to PDF...`);
  execSync(cmd);
};

convertToPdf(path.join(videosDir, 'FarmsKing_100_Character_Scripts_PB.html'), path.join(videosDir, 'FarmsKing_100_Character_Scripts_PB.pdf'));
convertToPdf(path.join(videosDir, 'FarmsKing_100_Character_Scripts_HI.html'), path.join(videosDir, 'FarmsKing_100_Character_Scripts_HI.pdf'));
convertToPdf(path.join(videosDir, 'FarmsKing_100_Character_Scripts_EN.html'), path.join(videosDir, 'FarmsKing_100_Character_Scripts_EN.pdf'));

console.log('All 3 100-Character Video PDFs generated successfully in d:\\FarmsKing\\videos\\');
