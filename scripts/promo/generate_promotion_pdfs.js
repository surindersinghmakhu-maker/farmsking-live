const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const docsDir = 'd:\\FarmsKing\\docs\\thinking';
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
    .box {
      background-color: #f0fdf4;
      border-left: 4px solid #22c55e;
      padding: 14px;
      margin: 14px 0;
      border-radius: 4px;
    }
    .card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px 18px;
      margin-bottom: 14px;
      background: #fafafa;
    }
    .card-title {
      font-weight: bold;
      color: #166534;
      font-size: 15px;
      margin-bottom: 6px;
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
  <title>FarmsKing — ਪ੍ਰਮੋਸ਼ਨ, ਭਰੋਸਾ ਅਤੇ ਵਾਇਰਲ ਗ੍ਰੋਥ ਸਟ੍ਰੈਟਜੀ</title>
  ${commonStyle}
</head>
<body>
  <h1>FarmsKing — ਪ੍ਰਮੋਸ਼ਨ, ਸਟੇਕਹੋਲਡਰ ਭਰੋਸਾ ਅਤੇ ਡਿਜੀਟਲ ਵਾਇਰਲ ਗ੍ਰੋਥ ਸਟ੍ਰੈਟਜੀ</h1>
  <p><strong>ਦਸਤਾਵੇਜ਼ ਮਿਤੀ:</strong> 30 ਸਤੰਬਰ 2026 | <strong>ਪਲੇਟਫਾਰਮ:</strong> FarmsKing Agriculture & Gardening Ecosystem</p>

  <div class="box">
    <strong>ਮੁੱਖ ਮਕਸਦ:</strong> ਸਾਰੇ ਸਟੇਕਹੋਲਡਰਾਂ (ਕਿਸਾਨ, ਆੜ੍ਹਤੀਏ, ਡਾਕਟਰ, ਸਰਕਾਰ) ਵਿੱਚ FarmsKing ਲਈ 100% ਪੋਜ਼ੀਟਿਵ ਭਰੋਸਾ ਬਣਾਉਣਾ ਅਤੇ ਐਪ ਨੂੰ ਪੂਰੇ ਭਾਰਤ 'ਚ ਵਾਇਰਲ ਕਰਨਾ।
  </div>

  <h2>ਹਿੱਸਾ 1: ਸਾਰੇ ਸਟੇਕਹੋਲਡਰਾਂ ਵਿੱਚ 100% ਭਰੋਸਾ ਬਣਾਉਣ ਦੇ ਉਪਾਅ</h2>
  
  <div class="card">
    <div class="card-title">1. ਕਿਸਾਨਾਂ ਲਈ 100% ਅਸਲੀ ਸਪਰੇਅ & ਬੀਜ ਗਰੰਟੀ (Authenticity Guarantee)</div>
    <p>ਹਰੇਕ ਉਤਪਾਦ 'ਤੇ ਸਕੈਨਰ QR ਕੋਡ ਹੋਵੇਗਾ। ਨਕਲੀ ਨਿਕਲਣ 'ਤੇ 10 ਗੁਣਾ ਹਰਜਾਨਾ ਦਿੱਤਾ ਜਾਵੇਗਾ। ਕਿਸਾਨਾਂ ਦੀਆਂ 15-ਸਕਿੰਟਾਂ ਦੀਆਂ ਸਫ਼ਲਤਾ ਵੀਡੀਓਜ਼ (Kisan Success Stories) ਐਪ ਵਿੱਚ ਪ੍ਰਮੁੱਖਤਾ ਨਾਲ ਦਿਖਾਈਆਂ ਜਾਣਗੀਆਂ।</p>
  </div>

  <div class="card">
    <div class="card-title">2. ਆੜ੍ਹਤੀਆਂ ਅਤੇ ਦੁਕਾਨਦਾਰਾਂ ਲਈ "ਆੜ੍ਹਤੀਆ ਡਿਜੀਟਲ ਮਿੱਤਰ" (Arhtiya Digital Partner)</div>
    <p>ਆੜ੍ਹਤੀਆਂ ਨੂੰ ਸਮਝਾਉਣਾ ਕਿ FarmsKing ਉਹਨਾਂ ਦੇ ਵਪਾਰ ਨੂੰ ਖ਼ਤਮ ਨਹੀਂ ਕਰਦਾ, ਸਗੋਂ KingConnect ਰਾਹੀਂ ਉਹਨਾਂ ਦੇ ਵਿਆਜ, ਅਡਵਾਂਸ ਅਤੇ ਕਮੀਸ਼ਨ ਦਾ ਲੇਖਾ-ਜੋਖਾ ਡਿਜੀਟਲ ਕਰਕੇ ਉਹਨਾਂ ਦਾ ਫਸਿਆ ਪੈਸਾ 3 ਗੁਣਾ ਤੇਜ਼ੀ ਨਾਲ ਵਾਪਸ ਦਿਵਾਉਂਦਾ ਹੈ।</p>
  </div>

  <div class="card">
    <div class="card-title">3. ਡਾਕਟਰਾਂ ਅਤੇ ਐਡਵਾਈਜ਼ਰਾਂ ਲਈ "Doctor of the Month" ਸਨਮਾਨ</div>
    <p>ਸਭ ਤੋਂ ਵਧੀਆ ਇਲਾਜ ਕਰਨ ਵਾਲੇ ਡਾਕਟਰਾਂ ਨੂੰ ਐਪ ਦੇ ਮੁੱਖ ਬੈਨਰ 'ਚ "Verified Star Doctor" ਵਜੋਂ ਹਾਈਲਾਈਟ ਕਰਨਾ ਅਤੇ ਵਾਧੂ ਬੋਨਸ ਦੇਣਾ।</p>
  </div>

  <div class="card">
    <div class="card-title">4. ਸਰਕਾਰ ਅਤੇ ਖੇਤੀਬਾੜੀ ਮਹਿਕਮੇ ਲਈ "ਨਕਲੀ ਦਵਾਈ ਮੁਕਤ ਪੰਜਾਬ" ਪ੍ਰਣ</div>
    <p>ਸਰਕਾਰੀ ਅਧਿਕਾਰੀਆਂ ਨਾਲ ਮਿਲ ਕੇ FarmsKing ਵੱਲੋਂ 100% ਪ੍ਰਮਾਣਿਤ ਖੇਤੀ ਸੰਦ/ਦਵਾਈਆਂ ਮੁਹੱਈਆ ਕਰਵਾਉਣ ਦੇ ਪੱਤਰ ਜਾਰੀ ਕਰਨਾ ਅਤੇ 100% GST Section 52 ਨਿਯਮਾਂ ਦੀ ਪਾਲਣਾ।</p>
  </div>

  <h2>ਹਿੱਸਾ 2: ਪਬਲਿਕ ਵਿੱਚ FarmsKing ਨੂੰ ਵਾਇਰਲ ਕਰਨ ਦੇ 7 ਡਿਜੀਟਲ ਤਰੀਕੇ</h2>

  <div class="card">
    <div class="card-title">🚀 1. WhatsApp ਵਾਇਰਲ ਰੈਫਰਲ ਲੂਪ (WhatsApp Referral Loop)</div>
    <p>ਐਪ ਬਟਨ: <strong>"3 ਕਿਸਾਨ ਦੋਸਤਾਂ ਨੂੰ WhatsApp 'ਤੇ ਜੋੜੋ ➡️ ₹100 ਵਾਲਿਟ ਕ੍ਰੈਡਿਟ + 1 ਮਹੀਨਾ ਮੁਫ਼ਤ ਡਾਕਟਰ ਸਲਾਹ ਲਵੋ!"</strong> 1-ਕਲਿੱਕ ਨਾਲ ਪੰਜਾਬੀ ਵਟਸਐਪ ਗਰੁੱਪਾਂ 'ਚ ਸੁਨੇਹਾ ਸ਼ੇਅਰ ਹੁੰਦਾ ਹੈ।</p>
  </div>

  <div class="card">
    <div class="card-title">🚀 2. ਰੋਜ਼ਾਨਾ ਸਵੇਰੇ 8 ਵਜੇ "ਲਾਈਵ ਮੰਡੀ ਭਾਅ" ਗ੍ਰਾਫਿਕਸ (Daily Mandi Bulletin)</div>
    <p>ਹਰ ਰੋਜ਼ ਸਵੇਰੇ FarmsKing ਆਟੋਮੈਟਿਕ ਪੰਜਾਬ ਦੀਆਂ ਮੁੱਖ ਮੰਡੀਆਂ ਦੇ ਰੇਟ ਦਾ ਸੁੰਦਰ ਪੰਜਾਬੀ ਗ੍ਰਾਫਿਕ ਬਣਾ ਕੇ ਕਿਸਾਨਾਂ ਦੇ ਵਟਸਐਪ 'ਤੇ ਭੇਜੇਗਾ, ਜੋ ਵਟਸਐਪ ਸਟੇਟਸਾਂ 'ਚ ਵਾਇਰਲ ਹੋਵੇਗਾ।</p>
  </div>

  <div class="card">
    <div class="card-title">🚀 3. "1 ਫੋਟੋ ਨਾਲ ਬੀਮਾਰੀ ਇਲਾਜ" Social Media Reels (Instagram/YouTube)</div>
    <p>15-ਸਕਿੰਟਾਂ ਦੀਆਂ ਦਿਲਚਸਪ ਵੀਡੀਓਜ਼: <em>"ਕਣਕ ਦੇ ਪੀਲੇ ਪੱਤਿਆਂ ਦੀ 1 ਫੋਟੋ ਖਿੱਚੀ ➡️ 2 ਮਿੰਟਾਂ 'ਚ ਡਾਕਟਰ ਨੇ ਦੱਸੀ ਸਹੀ ਸਪਰੇਅ ➡️ ₹50,000 ਦਾ ਨੁਕਸਾਨ ਬਚਿਆ!"</em></p>
  </div>

  <div class="card">
    <div class="card-title">🚀 4. ਗ੍ਰਾਮ ਪੰਚਾਇਤ ਅਤੇ "ਡਿਜੀਟਲ ਕਿਸਾਨ ਮਿੱਤਰ" ਪ੍ਰੋਗਰਾਮ</div>
    <p>ਹਰੇਕ ਪਿੰਡ ਵਿੱਚ 1 ਚਲਾਕ ਨੌਜਵਾਨ ਨੂੰ FarmsKing ਦਾ ਡਿਜੀਟਲ ਕਿਸਾਨ ਮਿੱਤਰ (Technical Trainer) ਬਣਾਇਆ ਜਾਵੇਗਾ ਜੋ ਬਜ਼ੁਰਗ ਕਿਸਾਨਾਂ ਨੂੰ ਐਪ ਚਲਾਉਣੀ ਸਿਖਾਵੇਗਾ ਅਤੇ ਹਰ ਰਜਿਸਟ੍ਰੇਸ਼ਨ 'ਤੇ ਕਮੀਸ਼ਨ ਕਮਾਵੇਗਾ।</p>
  </div>

  <div class="card">
    <div class="card-title">🚀 5. "ਖੇਤੀ ਹਾਜ਼ਰੀ" ਇਨਾਮ ਸਿਸਟਮ (Daily Streak Coins)</div>
    <p>ਜੋ ਕਿਸਾਨ ਰੋਜ਼ਾਨਾ ਐਪ ਖੋਲ੍ਹ ਕੇ ਮੌਸਮ ਚੈੱਕ ਕਰੇਗਾ, ਉਸਨੂੰ ਰੋਜ਼ਾਨਾ 5 "FarmsKing Coins" ਮਿਲਣਗੇ। ਇਹਨਾਂ ਕੋਇਨਾਂ ਨਾਲ ਕਿਸਾਨ ਖਾਦ/ਦਵਾਈਆਂ 'ਚ ਛੋਟ (Discount) ਲੈ ਸਕੇਗਾ।</p>
  </div>

  <div class="card">
    <div class="card-title">🚀 6. SEO ਗੂਗਲ ਪੰਜਾਬੀ ਖੋਜ ਦਾਬਾ (#1 Ranking on Google)</div>
    <p>ਗੂਗਲ 'ਤੇ ਜਦੋਂ ਵੀ ਕੋਈ ਲੱਭੇਗਾ: <em>"ਪੰਜਾਬ ਮੰਡੀ ਭਾਅ ਅੱਜ ਦਾ"</em>, <em>"ਕਣਕ ਦੀ ਬੀਮਾਰੀ ਦਾ ਇਲਾਜ"</em>, <em>"ਝੋਨੇ ਦੀ ਸਪਰੇਅ"</em>, ਤਾਂ FarmsKing #1 'ਤੇ ਆਵੇਗੀ।</p>
  </div>

  <div class="card">
    <div class="card-title">🚀 7. Voice AI (ਆਵਾਜ਼ ਨਾਲ ਪੰਜਾਬੀ ਖੋਜ)</div>
    <p>ਬਜ਼ੁਰਗ ਕਿਸਾਨਾਂ ਲਈ ਮਾਈਕ ਦਾ ਬਟਨ: <em>"ਮੇਰੇ ਖੇਤ 'ਚ ਸੁੰਡੀ ਪੈ ਗਈ, ਕੀ ਪਾਵਾਂ?"</em> — ਐਪ ਤੁਰੰਤ ਬੋਲ ਕੇ ਪੰਜਾਬੀ 'ਚ ਜਵਾਬ ਦੇਵੇਗੀ। ਇਹ ਫੀਚਰ ਸਭ ਤੋਂ ਵੱਧ ਵਾਇਰਲ ਹੋਵੇਗਾ।</p>
  </div>

  <div class="footer">
    FarmsKing Agriculture Ecosystem — Promotion & Growth Strategy Document | ਗੁਪਤ
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
  <title>FarmsKing — प्रमोशन, विश्वास एवं वायरल ग्रोथ रणनीति</title>
  ${commonStyle}
</head>
<body>
  <h1>FarmsKing — प्रमोशन, हितधारक विश्वास एवं डिजिटल वायरल ग्रोथ रणनीति</h1>
  <p><strong>दस्तावेज़ तिथि:</strong> 30 सितंबर 2026 | <strong>प्लेटफ़ॉर्म:</strong> FarmsKing Agriculture & Gardening Ecosystem</p>

  <div class="box">
    <strong>मुख्य उद्देश्य:</strong> सभी हितधारकों (किसान, आढ़तिए, डॉक्टर, सरकार) में FarmsKing के प्रति 100% सकारात्मक विश्वास बनाना और ऐप को पूरे भारत में वायरल करना।
  </div>

  <h2>भाग 1: सभी हितधारकों में 100% विश्वास बनाने के उपाय</h2>
  
  <div class="card">
    <div class="card-title">1. किसानों के लिए 100% असली स्प्रे व बीज गारंटी (Authenticity Guarantee)</div>
    <p>प्रत्येक उत्पाद पर स्कैनर QR कोड होगा। नकली निकलने पर 10 गुना हर्जाना। किसानों की 15-सेकंड की सफलता वीडियो (Kisan Success Stories) ऐप में प्रमुखता से दिखाई जाएंगी।</p>
  </div>

  <div class="card">
    <div class="card-title">2. आढ़तियों और दुकानदारों के लिए "आढ़तिया डिजिटल मित्र" (Arhtiya Digital Partner)</div>
    <p>आढ़तियों को समझाना कि FarmsKing उनके व्यापार को खत्म नहीं करता, बल्कि KingConnect द्वारा उनके ब्याज, एडवांस और कमिशन का हिसाब डिजिटल करके उनका फंसा पैसा 3 गुना तेजी से वापस दिलाता है।</p>
  </div>

  <div class="card">
    <div class="card-title">3. डॉक्टरों और एडवाइजर्स के लिए "Doctor of the Month" सम्मान</div>
    <p>सबसे अच्छा इलाज करने वाले डॉक्टरों को ऐप के मुख्य बैनर में "Verified Star Doctor" के रूप में हाईलाइट करना व अतिरिक्त बोनस देना।</p>
  </div>

  <div class="card">
    <div class="card-title">4. सरकार और कृषि विभाग के लिए "नकली दवा मुक्त भारत" प्रण</div>
    <p>सरकारी अधिकारियों के साथ मिलकर FarmsKing द्वारा 100% प्रमाणित कृषि उपकरण/दवाएं उपलब्ध कराने का संकल्प और 100% GST Section 52 नियमों का पालन।</p>
  </div>

  <h2>भाग 2: जनता में FarmsKing को वायरल करने के 7 डिजिटल तरीके</h2>

  <div class="card">
    <div class="card-title">🚀 1. WhatsApp वायरल रेफरल लूप (WhatsApp Referral Loop)</div>
    <p>ऐप बटन: <strong>"3 किसान दोस्तों को WhatsApp पर जोड़ें ➡️ ₹100 वॉलेट क्रेडिट + 1 महीना मुफ्त डॉक्टर सलाह पाएं!"</strong> 1-क्लिक से व्हाट्सएप ग्रुपों में संदेश शेयर होता है।</p>
  </div>

  <div class="card">
    <div class="card-title">🚀 2. रोजाना सुबह 8 बजे "लाइव मंडी भाव" ग्राफिक्स (Daily Mandi Bulletin)</div>
    <p>हर सुबह FarmsKing ऑटोमैटिक मुख्य मंडियों के भाव का सुंदर हिंदी/पंजाबी ग्राफिक बनाकर किसानों के व्हाट्सएप पर भेजेगा, जो स्टेटस में वायरल होगा।</p>
  </div>

  <div class="card">
    <div class="card-title">🚀 3. "1 फोटो से बीमारी इलाज" Social Media Reels (Instagram/YouTube)</div>
    <p>15-सेकंड की रोचक वीडियो: <em>"गेहूं के पीले पत्तों की 1 फोटो खींची ➡️ 2 मिनट में डॉक्टर ने बताई सही स्प्रे ➡️ ₹50,000 का नुकसान बचा!"</em></p>
  </div>

  <div class="card">
    <div class="card-title">🚀 4. ग्राम पंचायत एवं "डिजिटल किसान मित्र" प्रोग्राम</div>
    <p>प्रत्येक गांव में 1 समझदार युवा को FarmsKing का डिजिटल किसान मित्र (Technical Trainer) बनाया जाएगा जो बुजुर्ग किसानों को ऐप चलाना सिखाएगा और हर रजिस्ट्रेशन पर कमिशन कमाएगा।</p>
  </div>

  <div class="card">
    <div class="card-title">🚀 5. "खेती हाजिरी" इनाम सिस्टम (Daily Streak Coins)</div>
    <p>जो किसान रोजाना ऐप खोलकर मौसम चेक करेगा, उसे रोजाना 5 "FarmsKing Coins" मिलेंगे। इन कॉइन्स से किसान खाद/दवाओं में छूट प्राप्त कर सकेगा।</p>
  </div>

  <div class="card">
    <div class="card-title">🚀 6. SEO गूगल खोज दबदबा (#1 Ranking on Google)</div>
    <p>गूगल पर जब भी कोई खोजेगा: <em>"पंजाब मंडी भाव आज का"</em>, <em>"गेहूं की बीमारी का इलाज"</em>, <em>"धान का स्प्रे"</em>, तो FarmsKing #1 पर आएगी।</p>
  </div>

  <div class="card">
    <div class="card-title">🚀 7. Voice AI (आवाज से हिंदी/पंजाबी खोज)</div>
    <p>बुजुर्ग किसानों के लिए माइक बटन: <em>"मेरे खेत में सुंडी लग गई है, क्या डालूं?"</em> — ऐप तुरंत बोलकर जवाब देगी। यह फीचर सबसे अधिक वायरल होगा।</p>
  </div>

  <div class="footer">
    FarmsKing Agriculture Ecosystem — Promotion & Growth Strategy Document | गोपनीय
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
  <title>FarmsKing — Promotion, Trust Engineering & Viral Growth Strategy</title>
  ${commonStyle}
</head>
<body>
  <h1>FarmsKing — Promotion, Stakeholder Trust & Digital Viral Growth Strategy</h1>
  <p><strong>Document Date:</strong> September 30, 2026 | <strong>Platform:</strong> FarmsKing Agriculture & Gardening Ecosystem</p>

  <div class="box">
    <strong>Core Objective:</strong> Build 100% positive trust and goodwill across all stakeholder groups (Farmers, Arhtiyas, Doctors, Government) and execute a zero-CAC viral growth strategy pan-India.
  </div>

  <h2>Part 1: Stakeholder Trust Engineering & Reputation Management</h2>
  
  <div class="card">
    <div class="card-title">1. 100% Genuine Agrochemical & Seed Guarantee for Farmers</div>
    <p>Every bottle/bag sold features a unique anti-counterfeit QR code scanner. If proven fake, 10x penalty compensation is guaranteed. 15-second real farmer success story videos featured on the app home screen.</p>
  </div>

  <div class="card">
    <div class="card-title">2. "Arhtiya Digital Partner" Campaign for Middlemen & Dealers</div>
    <p>Positioning FarmsKing not as a threat to Arhtiyas, but as an enabler via KingConnect P2P ledger, helping traditional dealers digitize advances, interest calculations, and collect bad debts 3x faster.</p>
  </div>

  <div class="card">
    <div class="card-title">3. "Doctor of the Month" Recognition & Rewards</div>
    <p>Highlighting top-performing Crop Doctors on the app banner with "Verified Star Doctor" badges and monthly performance bonuses.</p>
  </div>

  <div class="card">
    <div class="card-title">4. "Counterfeit-Free India" Pledge for Government & Agri Authorities</div>
    <p>Partnering with district agricultural officers to guarantee 100% verified inputs, full 100% GST Section 52 ECO compliance, and monthly GSTR-8 returns.</p>
  </div>

  <h2>Part 2: 7 Digital & Web Viral Growth Strategies</h2>

  <div class="card">
    <div class="card-title">🚀 1. WhatsApp Viral Referral Loop</div>
    <p>App CTA: <strong>"Invite 3 Farmer Friends on WhatsApp ➡️ Get ₹100 Wallet Credit + 1 Month Free Crop Doctor Support!"</strong> 1-click sharing of pre-filled regional text and personal referral codes.</p>
  </div>

  <div class="card">
    <div class="card-title">🚀 2. Daily 8 AM "Live Mandi Rate" WhatsApp Bulletin</div>
    <p>Automated daily morning Punjabi/Hindi graphics showing live mandi rates across major Punjab & Haryana mandis. High daily organic sharing on WhatsApp groups.</p>
  </div>

  <div class="card">
    <div class="card-title">🚀 3. "1 Photo Crop Diagnosis" Social Media Reels (Instagram/YouTube)</div>
    <p>15-second high-impact shorts: <em>"Took 1 photo of yellow wheat leaves ➡️ Doctor diagnosed fungus in 2 minutes ➡️ Saved ₹50,000 crop loss!"</em></p>
  </div>

  <div class="card">
    <div class="card-title">🚀 4. Gram Panchayat "Digital Kisan Mitr" Field Program</div>
    <p>Appointing 1 tech-savvy youth per village as a Technical Trainer to onboard elder farmers and earn recurring registration & renewal commissions.</p>
  </div>

  <div class="card">
    <div class="card-title">🚀 5. Gamified "Daily Streak Coins" (Agri Attendance)</div>
    <p>Farmers opening the app daily to check weather or log activities earn 5 "FarmsKing Coins" daily, redeemable for discounts on seeds and fertilizers.</p>
  </div>

  <div class="card">
    <div class="card-title">🚀 6. Regional SEO Dominance (#1 Ranking on Google)</div>
    <p>Dominating regional searches on Google for terms like <em>"Punjab Mandi Rate Today"</em>, <em>"Wheat Disease Diagnosis"</em>, <em>"Paddy Spray Schedule"</em>.</p>
  </div>

  <div class="card">
    <div class="card-title">🚀 7. Voice-First Punjabi AI Search</div>
    <p>Voice-activated Punjabi mic button for senior farmers: <em>"My crop has pest infestation, what should I spray?"</em> — Instant spoken Punjabi response with 1-click doctor booking.</p>
  </div>

  <div class="footer">
    FarmsKing Agriculture Ecosystem — Promotion & Growth Strategy Document | Confidential
  </div>
</body>
</html>
`;

// Save HTML files
fs.writeFileSync(path.join(docsDir, 'FarmsKing_Promotion_Growth_Strategy_PB.html'), htmlPB, 'utf8');
fs.writeFileSync(path.join(docsDir, 'FarmsKing_Promotion_Growth_Strategy_HI.html'), htmlHI, 'utf8');
fs.writeFileSync(path.join(docsDir, 'FarmsKing_Promotion_Growth_Strategy_EN.html'), htmlEN, 'utf8');

console.log('Promotion HTML files created successfully.');

// Convert HTML to PDF via Edge Headless
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const convertToPdf = (htmlFile, pdfFile) => {
  const fullHtml = path.resolve(htmlFile);
  const fullPdf = path.resolve(pdfFile);
  const cmd = `"${edgePath}" --headless --disable-gpu --print-to-pdf="${fullPdf}" "file:///${fullHtml.replace(/\\/g, '/')}"`;
  console.log(`Converting ${path.basename(htmlFile)} to PDF...`);
  execSync(cmd);
};

convertToPdf(path.join(docsDir, 'FarmsKing_Promotion_Growth_Strategy_PB.html'), path.join(docsDir, 'FarmsKing_Promotion_Growth_Strategy_PB.pdf'));
convertToPdf(path.join(docsDir, 'FarmsKing_Promotion_Growth_Strategy_HI.html'), path.join(docsDir, 'FarmsKing_Promotion_Growth_Strategy_HI.pdf'));
convertToPdf(path.join(docsDir, 'FarmsKing_Promotion_Growth_Strategy_EN.html'), path.join(docsDir, 'FarmsKing_Promotion_Growth_Strategy_EN.pdf'));

console.log('All 3 Promotion PDFs generated successfully in d:\\FarmsKing\\docs\\thinking\\');
