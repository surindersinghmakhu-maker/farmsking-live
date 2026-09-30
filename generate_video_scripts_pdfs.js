const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const docsDir = 'd:\\FarmsKing\\docs\\video_scripts';
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

const commonStyle = `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Noto+Sans+Gurmukhi:wght@400;600;700&family=Noto+Sans+Devanagari:wght@400;600;700&display=swap');
    body {
      font-family: 'Inter', 'Noto Sans Gurmukhi', 'Noto Sans Devanagari', sans-serif;
      margin: 40px;
      color: #1e293b;
      line-height: 1.6;
      background-color: #ffffff;
    }
    h1 {
      color: #15803d;
      border-bottom: 3px solid #22c55e;
      padding-bottom: 10px;
      font-size: 24px;
    }
    h2 {
      color: #0f766e;
      margin-top: 22px;
      font-size: 18px;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 4px;
    }
    h3 {
      color: #166534;
      font-size: 15px;
      margin-top: 14px;
    }
    .box {
      background-color: #f0fdf4;
      border-left: 4px solid #22c55e;
      padding: 14px;
      margin: 14px 0;
      border-radius: 4px;
    }
    .script-card {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 14px 18px;
      margin-bottom: 16px;
      background: #fafafa;
    }
    .script-num {
      font-weight: bold;
      color: #0369a1;
      font-size: 14px;
    }
    .ai-prompt {
      background: #f1f5f9;
      border: 1px dashed #94a3b8;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 12.5px;
      color: #334155;
      margin: 6px 0;
    }
    .voiceover {
      font-style: italic;
      color: #1e293b;
      background-color: #fffbeb;
      border-left: 3px solid #f59e0b;
      padding: 8px 12px;
      margin: 6px 0;
      font-size: 13.5px;
    }
    .footer {
      margin-top: 40px;
      font-size: 11px;
      text-align: center;
      color: #64748b;
      border-top: 1px solid #e2e8f0;
      padding-top: 10px;
    }
  </style>
`;

// 1. PUNJABI HTML
const htmlPB = `
<!DOCTYPE html>
<html lang="pa">
<head>
  <meta charset="UTF-8">
  <title>FarmsKing — AI ਵੀਡੀਓ ਸਕ੍ਰਿਪਟ ਪ੍ਰੋਡਕਸ਼ਨ ਮਾਸਟਰ ਪਲੈਨ</title>
  ${commonStyle}
</head>
<body>
  <h1>FarmsKing — AI ਵੀਡੀਓ ਸਕ੍ਰਿਪਟ ਪ੍ਰੋਡਕਸ਼ਨ ਮਾਸਟਰ ਪਲੈਨ (800+ ਸਕ੍ਰਿਪਟਾਂ & ਟੀਚਾ)</h1>
  <p><strong>ਦਸਤਾਵੇਜ਼ ਮਿਤੀ:</strong> 30 ਸਤੰਬਰ 2026 | <strong>ਪਲੇਟਫਾਰਮ:</strong> FarmsKing AI Video Vault</p>

  <div class="box">
    <strong>AI ਵੀਡੀਓ ਪ੍ਰੋਡਕਸ਼ਨ ਗਾਈਡ:</strong>  
    • <strong>Voice AI:</strong> ElevenLabs (ਪੰਜਾਬੀ / ਹਿੰਦੀ ਦੇਸੀ ਜੋਸ਼ੀਲੀ ਆਵਾਜ਼)  
    • <strong>Avatar & Visuals:</strong> HeyGen / Midjourney + Runway Gen-3 / Sora  
    • <strong>ਸਬਟਾਈਟਲ:</strong> CapCut AI (ਪੰਜਾਬੀ ਪੈਲੇਟ ਬੋਲਡ ਟੈਕਸਟ)
  </div>

  <h2>1. ਕਿਸਾਨ ਅਤੇ ਖੇਤੀਬਾੜੀ ਵੀਡੀਓ ਸਕ੍ਰਿਪਟਾਂ (Category A - Farmers)</h2>

  <div class="script-card">
    <div class="script-num">ਵੀਡੀਓ 1: "ਪੀਲੇ ਪੱਤਿਆਂ ਦਾ ਇਲਾਜ" (15-ਸਕਿੰਟ ਵੀਡੀਓ Reel/Short)</div>
    <div class="ai-prompt"><strong>AI Visual Prompt (Runway/Sora):</strong> Cinematic closeup of a worried Indian farmer standing in a green wheat field with yellowing leaves, looking at his smartphone camera. High resolution 4k.</div>
    <div class="voiceover"><strong>Voiceover (Punjabi):</strong> "ਕੀ ਤੁਹਾਡੀ ਕਣਕ ਦੇ ਪੱਤੇ ਵੀ ਪੀਲੇ ਪੈ ਰਹੇ ਹਨ? ਦੁਕਾਨਾਂ 'ਤੇ ਗਲਤ ਸਪਰੇਅ ਲੈ ਕੇ ਪੈਸੇ ਖਰਾਬ ਨਾ ਕਰੋ! FarmsKing ਐਪ ਖੋਲ੍ਹੋ, 1 ਫੋਟੋ ਖਿੱਚੋ ਅਤੇ 2 ਮਿੰਟਾਂ 'ਚ ਫ਼ਸਲ ਡਾਕਟਰ ਤੋਂ ਸਹੀ ਇਲਾਜ ਪਾਓ!"</div>
  </div>

  <div class="script-card">
    <div class="script-num">ਵੀਡੀਓ 2: "ਰੋਜ਼ਾਨਾ ਲਾਈਵ ਮੰਡੀ ਭਾਅ" (Promo Video)</div>
    <div class="ai-prompt"><strong>AI Visual Prompt:</strong> Dynamic split-screen showing Ludhiana mandi grains loading into trucks and a Punjabi farmer looking at live mandi rate numbers updating on FarmsKing app.</div>
    <div class="voiceover"><strong>Voiceover (Punjabi):</strong> "ਮੰਡੀ ਜਾਣ ਤੋਂ ਪਹਿਲਾਂ ਰੇਟ ਜਾਣਨਾ ਹੁਣ ਹਰ ਕਿਸਾਨ ਦਾ ਹੱਕ ਹੈ! FarmsKing ਐਪ 'ਤੇ ਲੁਧਿਆਣਾ, ਬਠਿੰਡਾ, ਪਟਿਆਲਾ ਦੀਆਂ ਮੰਡੀਆਂ ਦੇ ਲਾਈਵ ਭਾਅ ਵੇਖੋ ਅਤੇ ਆਪਣੀ ਫ਼ਸਲ ਸਹੀ ਰੇਟ 'ਚ ਵੇਚੋ।"</div>
  </div>

  <div class="script-card">
    <div class="script-num">ਵੀਡੀਓ 3: "ਡਿਜੀਟਲ J-Form ਅਤੇ ਹਿਸਾਬ" (Tutorial Video)</div>
    <div class="ai-prompt"><strong>AI Visual Prompt:</strong> Friendly 3D animated farmer avatar tapping on screen showing digital J-Form receipt and automated crop expense calculation ledger.</div>
    <div class="voiceover"><strong>Voiceover (Punjabi):</strong> "ਕਾਗਜ਼ੀ ਡਾਇਰੀਆਂ ਗੁਆਚਣ ਦਾ ਡਰ ਖ਼ਤਮ! FarmsKing ਐਪ 'ਚ ਆਪਣੇ ਸਾਰੇ ਖਾਦ, ਬੀਜ, ਲੇਬਰ ਅਤੇ ਮੰਡੀ ਵੇਚ ਦੇ J-Form ਆਟੋਮੈਟਿਕ ਸੇਵ ਕਰੋ।"</div>
  </div>

  <h2>2. ਆੜ੍ਹਤੀਏ ਅਤੇ ਦੁਕਾਨਦਾਰ ਵੀਡੀਓ ਸਕ੍ਰਿਪਟਾਂ (Category B - Arhtiyas & Dealers)</h2>

  <div class="script-card">
    <div class="script-num">ਵੀਡੀਓ 4: "ਆੜ੍ਹਤੀਆਂ ਦਾ ਫਸਿਆ ਪੈਸਾ ਵਾਪਸ" (Arhtiya Mitr Promo)</div>
    <div class="ai-prompt"><strong>AI Visual Prompt:</strong> An Indian Arhtiya in traditional Punjabi attire sitting at his shop computer, smiling as KingConnect ledger automatically syncs customer payments.</div>
    <div class="voiceover"><strong>Voiceover (Punjabi):</strong> "ਅਡਵਾਂਸ ਅਤੇ ਕਮੀਸ਼ਨ ਦਾ ਫਸਿਆ ਪੈਸਾ ਹੁਣ ਸਮੇਂ ਸਿਰ ਵਾਪਸ ਆਵੇਗਾ! FarmsKing KingConnect ਨਾਲ ਆਪਣੀ ਆੜ੍ਹਤ ਦਾ ਪੂਰਾ ਹਿਸਾਬ-ਕਿਤਾਬ ਡਿਜੀਟਲ ਕਰੋ ਅਤੇ 0% ਰਿਸਕ ਨਾਲ ਵਪਾਰ ਵਧਾਓ।"</div>
  </div>

  <h2>3. ਫ਼ਸਲ ਡਾਕਟਰ ਅਤੇ ਐਡਵਾਈਜ਼ਰ ਸਕ੍ਰਿਪਟਾਂ (Category C - Doctors & Advisors)</h2>

  <div class="script-card">
    <div class="script-num">ਵੀਡੀਓ 5: "ਡਾਕਟਰ ਲਈ ਦੇਸ਼-ਵਿਆਪੀ ਡਿਜੀਟਲ ਕਲੀਨਿਕ" (Doctor Recruitment)</div>
    <div class="ai-prompt"><strong>AI Visual Prompt:</strong> Professional Agronomist/Plant Pathologist in a lab coat reviewing satellite crop NDVI scans on laptop and approving e-prescription for a farmer.</div>
    <div class="voiceover"><strong>Voiceover (Punjabi):</strong> "ਐਗਰੀਕਲਚਰ ਡਾਕਟਰੋ ਅਤੇ ਮਾਹਿਰੋ! FarmsKing ਡਿਜੀਟਲ ਕਲੀਨਿਕ ਨਾਲ ਜੁੜੋ, ਘਰ ਬੈਠੇ ਕਿਸਾਨਾਂ ਦਾ ਇਲਾਜ ਕਰੋ ਅਤੇ ਆਪਣੀ ਪੇਸ਼ੇਵਰ ਕਮਾਈ ਵਧਾਓ।"</div>
  </div>

  <h2>4. ਗਾਰਡਨਰ ਅਤੇ ਹੋਮ ਪੌਦੇ ਸਕ੍ਰਿਪਟਾਂ (Category D - Urban Gardeners)</h2>

  <div class="script-card">
    <div class="script-num">ਵੀਡੀਓ 6: "ਛੱਤ 'ਤੇ ਔਰਗੈਨਿਕ ਸਬਜ਼ੀਆਂ" (Kitchen Garden Promo)</div>
    <div class="ai-prompt"><strong>AI Visual Prompt:</strong> Beautiful lush green rooftop terrace garden in Chandigarh with fresh tomatoes and chili plants, woman harvesting organic vegetables.</div>
    <div class="voiceover"><strong>Voiceover (Punjabi):</strong> "ਆਪਣੀ ਛੱਤ 'ਤੇ ਉਗਾਓ 100% ਔਰਗੈਨਿਕ ਤਾਜ਼ੀਆਂ ਸਬਜ਼ੀਆਂ! FarmsKing Gardener Plan ਨਾਲ ਹੋਮ ਗਾਰਡਨਰ ਹਾਇਰ ਕਰੋ ਅਤੇ ਘਰ ਬੈਠੇ ਪੌਦਿਆਂ ਦੇ ਡਾਕਟਰ ਦੀ ਸਲਾਹ ਪਾਓ।"</div>
  </div>

  <h2>5. ਟ੍ਰੇਨਰ ਅਤੇ ਨੌਜਵਾਨ ਰੋਜ਼ਗਾਰ (Category E - Technical Trainers)</h2>

  <div class="script-card">
    <div class="script-num">ਵੀਡੀਓ 7: "ਪਿੰਡ 'ਚ ਰੋਜ਼ਾਨਾ ₹1000 ਕਮਾਓ" (Youth Employment Promo)</div>
    <div class="ai-prompt"><strong>AI Visual Prompt:</strong> Young energetic Punjabi youth in village helping a farmer download FarmsKing app, smartphone screen showing wallet bonus credit.</div>
    <div class="voiceover"><strong>Voiceover (Punjabi):</strong> "ਪਿੰਡ ਦੇ ਨੌਜਵਾਨੋ! FarmsKing ਡਿਜੀਟਲ ਕਿਸਾਨ ਮਿੱਤਰ ਬਣੋ, ਆਪਣੇ ਪਿੰਡ ਦੇ ਕਿਸਾਨਾਂ ਨੂੰ ਐਪ ਨਾਲ ਜੋੜੋ ਅਤੇ ਰੋਜ਼ਾਨਾ ₹1000 ਤੱਕ ਦਾ ਪੇਆਉਟ ਆਪਣੇ ਖਾਤੇ 'ਚ ਪਾਓ!"</div>
  </div>

  <h2>6. 500+ ਵਾਇਰਲ ਵੀਡੀਓ ਸ਼ੂਟ ਹੁੱਕਸ (Viral Short Hooks Library Summary)</h2>
  <div class="box">
    <strong>ਕਿਸਾਨਾਂ ਲਈ ਹੁੱਕਸ:</strong>  
    1. "ਜੇਕਰ ਤੁਹਾਡੀ ਕਣਕ ਵੀ ਪੀਲੀ ਪੈ ਰਹੀ ਹੈ, ਤਾਂ ਇਹ 1 ਗਲਤੀ ਕਦੇ ਨਾ ਕਰਨਾ!"  
    2. "ਮੰਡੀ 'ਚ ਫ਼ਸਲ ਵੇਚਣ ਤੋਂ 5 ਮਿੰਟ ਪਹਿਲਾਂ ਇਹ ਐਪ ਖੋਲ੍ਹੋ!"  
    3. "ਨਕਲੀ ਦਵਾਈ ਪਛਾਣਨ ਦਾ 1-ਕਲਿੱਕ ਸੀਕਰੇਟ!"  
    <br/>
    <strong>ਨੌਜਵਾਨਾਂ ਲਈ ਹੁੱਕਸ:</strong>  
    1. "ਬਿਨਾਂ ਕਿਸੇ ਇਨਵੈਸਟਮੈਂਟ ਦੇ ਪਿੰਡ 'ਚ ਹੀ ਆਪਣਾ ਵਪਾਰ ਸ਼ੁਰੂ ਕਰੋ!"  
    2. "ਫ਼ੋਨ ਨਾਲ ਕਿਸਾਨਾਂ ਦੀ ਮਦਦ ਕਰੋ ਅਤੇ ਰੋਜ਼ਾਨਾ ਵਾਲਿਟ ਪੇਆਉਟ ਲਵੋ!"
  </div>

  <div class="footer">
    FarmsKing AI Video Script Production Vault — 100 Core + 200 Advanced + 500 Short Hooks | ਗੁਪਤ
  </div>
</body>
</html>
`;

// 2. HINDI HTML
const htmlHI = `
<!DOCTYPE html>
<html lang="hi">
<head>
  <meta charset="UTF-8">
  <title>FarmsKing — AI वीडियो स्क्रिप्ट प्रोडक्शन मास्टर प्लान</title>
  ${commonStyle}
</head>
<body>
  <h1>FarmsKing — AI वीडियो स्क्रिप्ट प्रोडक्शन मास्टर प्लान (800+ स्क्रिप्ट्स एवं लक्ष्य)</h1>
  <p><strong>दस्तावेज़ तिथि:</strong> 30 सितंबर 2026 | <strong>प्लेटफ़ॉर्म:</strong> FarmsKing AI Video Vault</p>

  <div class="box">
    <strong>AI वीडियो प्रोडक्शन गाइड:</strong>  
    • <strong>Voice AI:</strong> ElevenLabs (हिंदी / पंजाबी उत्साही क्षेत्रीय आवाज)  
    • <strong>Avatar & Visuals:</strong> HeyGen / Midjourney + Runway Gen-3 / Sora  
    • <strong>सबटाइटल:</strong> CapCut AI (बोल्ड हिंदी कैप्शंस)
  </div>

  <h2>1. किसान एवं कृषि वीडियो स्क्रिप्ट्स (Category A - Farmers)</h2>

  <div class="script-card">
    <div class="script-num">वीडियो 1: "पीले पत्तों का इलाज" (15-सेकंड Reel/Short)</div>
    <div class="ai-prompt"><strong>AI Visual Prompt:</strong> Cinematic closeup of a worried Indian farmer standing in a green wheat field with yellowing leaves, looking at smartphone.</div>
    <div class="voiceover"><strong>Voiceover (Hindi):</strong> "क्या आपके गेहूं के पत्ते भी पीले पड़ रहे हैं? दुकानों पर गलत स्प्रे लेकर पैसे बर्बाद न करें! FarmsKing ऐप खोलें, 1 फोटो खींचें और 2 मिनट में फसल डॉक्टर से सही इलाज पाएं!"</div>
  </div>

  <div class="script-card">
    <div class="script-num">वीडियो 2: "रोजाना लाइव मंडी भाव" (Promo Video)</div>
    <div class="ai-prompt"><strong>AI Visual Prompt:</strong> Dynamic split-screen showing grain mandi loading and farmer looking at live mandi rate numbers updating on FarmsKing app.</div>
    <div class="voiceover"><strong>Voiceover (Hindi):</strong> "मंडी जाने से पहले सही रेट जानना अब हर किसान का हक है! FarmsKing ऐप पर अपनी नजदीकी मंडियों के लाइव भाव देखें और अपनी फसल सही दाम पर बेचें।"</div>
  </div>

  <h2>2. आढ़तिया एवं दुकानदार स्क्रिप्ट्स (Category B - Arhtiyas & Dealers)</h2>

  <div class="script-card">
    <div class="script-num">वीडियो 3: "आढ़तियों का फंसा पैसा वापस" (Arhtiya Mitr Promo)</div>
    <div class="ai-prompt"><strong>AI Visual Prompt:</strong> An Indian Arhtiya at his shop computer, smiling as KingConnect ledger automatically syncs customer payments.</div>
    <div class="voiceover"><strong>Voiceover (Hindi):</strong> "एडवांस और कमिशन का फंसा पैसा अब समय पर वापस आएगा! FarmsKing KingConnect से अपनी आढ़त का पूरा हिसाब डिजिटल करें और 0% रिस्क के साथ व्यापार बढ़ाएं।"</div>
  </div>

  <h2>3. फसल डॉक्टर एवं एडवाइजर स्क्रिप्ट्स (Category C - Doctors & Advisors)</h2>

  <div class="script-card">
    <div class="script-num">वीडियो 4: "डॉक्टरों के लिए डिजिटल क्लीनिक" (Doctor Recruitment)</div>
    <div class="ai-prompt"><strong>AI Visual Prompt:</strong> Professional Agronomist reviewing satellite crop NDVI scans on laptop and approving e-prescription.</div>
    <div class="voiceover"><strong>Voiceover (Hindi):</strong> "एग्रीकल्चर डॉक्टरों और विशेषज्ञों! FarmsKing डिजिटल क्लीनिक से जुड़ें, घर बैठे किसानों का इलाज करें और अपनी पेशेवर आय बढ़ाएं।"</div>
  </div>

  <h2>4. गार्डनर एवं होम प्लांट स्क्रिप्ट्स (Category D - Urban Gardeners)</h2>

  <div class="script-card">
    <div class="script-num">वीडियो 5: "छत पर ऑर्गेनिक सब्जियां" (Kitchen Garden Promo)</div>
    <div class="ai-prompt"><strong>AI Visual Prompt:</strong> Beautiful lush green rooftop terrace garden with fresh tomatoes and chili plants.</div>
    <div class="voiceover"><strong>Voiceover (Hindi):</strong> "अपनी छत पर उगाएं 100% ऑर्गेनिक ताजी सब्जियां! FarmsKing Gardener Plan से होम गार्डनर हायर करें और प्लांट डॉक्टर की सलाह पाएं।"</div>
  </div>

  <h2>5. 500+ वायरल वीडियो शॉर्ट हुक्स (Viral Short Hooks Library Summary)</h2>
  <div class="box">
    <strong>किसानों के लिए हुक्स:</strong>  
    1. "अगर आपके गेहूं के पत्ते भी पीले हो रहे हैं, तो यह 1 गलती कभी न करें!"  
    2. "मंडी में फसल बेचने से 5 मिनट पहले यह ऐप खोलें!"  
    3. "नकली दवा पहचानने का 1-क्लिक सीक्रेट!"
  </div>

  <div class="footer">
    FarmsKing AI Video Script Production Vault — 100 Core + 200 Advanced + 500 Short Hooks | गोपनीय
  </div>
</body>
</html>
`;

// 3. ENGLISH HTML
const htmlEN = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>FarmsKing — AI Video Script Production Master Plan</title>
  ${commonStyle}
</head>
<body>
  <h1>FarmsKing — AI Video Script Production Master Plan (800+ Scripts Vault)</h1>
  <p><strong>Document Date:</strong> September 30, 2026 | <strong>Platform:</strong> FarmsKing AI Video Production Vault</p>

  <div class="box">
    <strong>AI Video Production Tech Stack:</strong>  
    • <strong>Voice AI:</strong> ElevenLabs (Regional Punjabi/Hindi energetic voice models)  
    • <strong>Avatar & Visuals:</strong> HeyGen / Midjourney + Runway Gen-3 / Sora prompts  
    • <strong>Captions & Subtitles:</strong> CapCut AI (Bold yellow/green captions)
  </div>

  <h2>1. Farmers & Agriculture Scripts (Category A)</h2>

  <div class="script-card">
    <div class="script-num">Video 1: "Yellow Leaves Disease Diagnosis" (15-Sec Reel/Short)</div>
    <div class="ai-prompt"><strong>AI Visual Prompt:</strong> Cinematic closeup of a worried Indian farmer standing in a green wheat field with yellowing leaves, looking at smartphone.</div>
    <div class="voiceover"><strong>Voiceover:</strong> "Are your wheat crop leaves turning yellow too? Don't waste money buying wrong sprays! Open FarmsKing app, click 1 photo, and get instant diagnosis from a Crop Doctor in 2 minutes!"</div>
  </div>

  <div class="script-card">
    <div class="script-num">Video 2: "Daily Live Mandi Rates" (Promo Video)</div>
    <div class="ai-prompt"><strong>AI Visual Prompt:</strong> Dynamic split-screen showing grain mandi loading trucks and farmer looking at live mandi rate numbers updating on FarmsKing app.</div>
    <div class="voiceover"><strong>Voiceover:</strong> "Knowing real mandi prices before selling is every farmer's right! Check live mandi rates on FarmsKing app and sell your harvest at the highest market rate."</div>
  </div>

  <h2>2. Arhtiyas & Dealers Scripts (Category B)</h2>

  <div class="script-card">
    <div class="script-num">Video 3: "Zero Bad-Debt Arhtiya Mitr" (Merchant Promo)</div>
    <div class="ai-prompt"><strong>AI Visual Prompt:</strong> An Indian Arhtiya at his shop computer, smiling as KingConnect ledger automatically syncs customer payments.</div>
    <div class="voiceover"><strong>Voiceover:</strong> "Recover advance loans and commissions 3x faster with 0 bad debt! Digitize your commission ledger on FarmsKing KingConnect and scale your mandi business risk-free."</div>
  </div>

  <h2>3. Crop Doctors & Agronomists Scripts (Category C)</h2>

  <div class="script-card">
    <div class="script-num">Video 4: "Nationwide Digital Clinic for Doctors" (Doctor Recruitment)</div>
    <div class="ai-prompt"><strong>AI Visual Prompt:</strong> Professional Agronomist reviewing satellite crop NDVI scans on laptop and approving e-prescription.</div>
    <div class="voiceover"><strong>Voiceover:</strong> "Calling all Agriculture Doctors & Plant Pathologists! Join FarmsKing Digital Clinic, diagnose crops remotely, and grow your professional consultation revenue."</div>
  </div>

  <h2>4. Urban Gardeners Scripts (Category D)</h2>

  <div class="script-card">
    <div class="script-num">Video 5: "Rooftop Organic Kitchen Garden" (Urban Promo)</div>
    <div class="ai-prompt"><strong>AI Visual Prompt:</strong> Beautiful lush green rooftop terrace garden with fresh tomatoes and chili plants.</div>
    <div class="voiceover"><strong>Voiceover:</strong> "Grow 100% organic, chemical-free vegetables on your home terrace! Book a home gardener and consult plant doctors on FarmsKing Gardener Plan."</div>
  </div>

  <h2>5. 500+ Viral Short Hooks Library Summary</h2>
  <div class="box">
    <strong>Farmer Hooks:</strong>  
    1. "If your wheat leaves are turning yellow, NEVER make this 1 mistake!"  
    2. "Open this app 5 minutes before selling your crop in mandi!"  
    3. "1-click secret to detect fake pesticides!"
  </div>

  <div class="footer">
    FarmsKing AI Video Script Production Vault — 100 Core + 200 Advanced + 500 Short Hooks | Confidential
  </div>
</body>
</html>
`;

// Save HTML files
fs.writeFileSync(path.join(docsDir, 'FarmsKing_AI_Video_Scripts_PB.html'), htmlPB, 'utf8');
fs.writeFileSync(path.join(docsDir, 'FarmsKing_AI_Video_Scripts_HI.html'), htmlHI, 'utf8');
fs.writeFileSync(path.join(docsDir, 'FarmsKing_AI_Video_Scripts_EN.html'), htmlEN, 'utf8');

console.log('Video Script HTML files created successfully.');

// Convert HTML to PDF via Edge Headless
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const convertToPdf = (htmlFile, pdfFile) => {
  const fullHtml = path.resolve(htmlFile);
  const fullPdf = path.resolve(pdfFile);
  const cmd = `"${edgePath}" --headless --disable-gpu --print-to-pdf="${fullPdf}" "file:///${fullHtml.replace(/\\/g, '/')}"`;
  console.log(`Converting ${path.basename(htmlFile)} to PDF...`);
  execSync(cmd);
};

convertToPdf(path.join(docsDir, 'FarmsKing_AI_Video_Scripts_PB.html'), path.join(docsDir, 'FarmsKing_AI_Video_Scripts_PB.pdf'));
convertToPdf(path.join(docsDir, 'FarmsKing_AI_Video_Scripts_HI.html'), path.join(docsDir, 'FarmsKing_AI_Video_Scripts_HI.pdf'));
convertToPdf(path.join(docsDir, 'FarmsKing_AI_Video_Scripts_EN.html'), path.join(docsDir, 'FarmsKing_AI_Video_Scripts_EN.pdf'));

console.log('All 3 Video Script PDFs generated successfully in d:\\FarmsKing\\docs\\video_scripts\\');
