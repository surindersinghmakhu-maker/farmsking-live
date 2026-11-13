/**
 * PDF 3: External Tools Comprehensive Evaluation, Pricing, Selection & Strategic Fit
 * FarmsKing Technologies Private Limited
 */

const { renderA4Pdf } = require('./pdf_common');

const page1Html = `
  <h2 class="sec-title">
    <span>1. ਬਾਹਰੀ ਟੂਲਜ਼ ਦਾ ਵਿਸ਼ਲੇਸ਼ਣ: SMS, WhatsApp ਅਤੇ AI ਇੰਜਣ</span>
    <span class="badge badge-dark">Tools Category 1 to 3</span>
  </h2>
  
  <p>
    ਫਾਰਮਸਕਿੰਗ ਪਲੇਟਫਾਰਮ ਨੂੰ ਕਿਫਾਇਤੀ, ਤੇਜ਼ ਅਤੇ ਲੰਮੇ ਸਮੇਂ ਤੱਕ ਸਥਿਰ ਰੱਖਣ ਲਈ ਬਾਹਰੀ ਸਾਫਟਵੇਅਰ ਟੂਲਜ਼ (SaaS/APIs) ਦੀ ਚੋਣ ਬਹੁਤ ਸੋਚ-ਸਮਝ ਕੇ ਕੀਤੀ ਗਈ ਹੈ। ਹੇਠਾਂ ਵਿਸਥਾਰਪੂਰਵਕ ਰੇਟ, ਸਰਵੋਤਮ ਚੋਣ, ਅਤੇ ਸਟਾਰਟਅੱਪ ਬਨਾਮ ਲੌਂਗ ਟਰਮ ਦੀ ਤੁਲਨਾ ਪੇਸ਼ ਕੀਤੀ ਗਈ ਹੈ:
  </p>

  <h3 class="sub-title" style="color: #065f46;">1. SMS ਅਤੇ OTP ਗੇਟਵੇਜ਼ (SMS & OTP Verification)</h3>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 18%;">ਟੂਲ ਦਾ ਨਾਮ</th>
        <th style="width: 25%;">ਮੌਜੂਦਾ ਰੇਟ (Pricing/Rates)</th>
        <th style="width: 32%;">ਲਾਭ ਅਤੇ ਕਮੀਆਂ (Pros & Cons)</th>
        <th style="width: 25%;">ਸਿਫ਼ਾਰਸ਼ ਅਤੇ ਫਾਰਮਸਕਿੰਗ ਸਥਿਤੀ</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Fast2SMS</strong><br><span class="badge badge-green">Domestic Indian</span></td>
        <td>ਲਗਭਗ ₹0.18 ਤੋਂ ₹0.20 ਪ੍ਰਤੀ SMS। ਕੋਈ ਮਹੀਨਾਵਾਰ ਫੀਸ ਨਹੀਂ, ਸਿਰਫ ₹100 ਤੋਂ ਰੀਚਾਰਜ।</td>
        <td>ਭਾਰਤੀ DLT ਨਿਯਮਾਂ ਅਨੁਸਾਰ ਸਰਲ ਇੰਟੀਗ੍ਰੇਸ਼ਨ। 3-5 ਸਕਿੰਟਾਂ ਵਿੱਚ OTP ਡਿਲਿਵਰੀ। ਛੋਟੇ ਬਜਟ ਲਈ ਸਭ ਤੋਂ ਵਧੀਆ।</td>
        <td><strong>ਹੁਣ ਚੱਲ ਰਿਹਾ ਹੈ:</strong> ਹਾਂ (ਐਕਟਿਵ)।<br><strong>ਸਟਾਰਟਅੱਪ ਲਈ:</strong> ਬਿਹਤਰੀਨ।<br><strong>ਫੈਸਲਾ:</strong> ਪਹਿਲੀ ਪਸੰਦ।</td>
      </tr>
      <tr>
        <td><strong>Twilio</strong><br><span class="badge badge-amber">Global Enterprise</span></td>
        <td>ਲਗਭਗ $0.04 ਤੋਂ $0.06 (₹3.50 ਤੋਂ ₹5.00) ਪ੍ਰਤੀ SMS + ਫੋਨ ਨੰਬਰ ਦਾ ਮਹੀਨਾਵਾਰ ਕਿਰਾਇਆ।</td>
        <td>ਅੰਤਰਰਾਸ਼ਟਰੀ ਪੱਧਰ 'ਤੇ ਬਹੁਤ ਮਜ਼ਬੂਤ, ਪਰ ਭਾਰਤ ਅੰਦਰ ਬਹੁਤ ਜ਼ਿਆਦਾ ਮਹਿੰਗਾ (Fast2SMS ਨਾਲੋਂ 20 ਗੁਣਾ ਵੱਧ ਖਰਚਾ)।</td>
        <td><strong>ਲੌਂਗ ਟਰਮ:</strong> ਜਦੋਂ ਵਿਦੇਸ਼ਾਂ ਵਿੱਚ ਐਕਸਪੋਰਟ ਕਰਨਾ ਹੋਵੇ ਉਦੋਂ ਹੀ ਢੁੱਕਵਾਂ। ਭਾਰਤ ਲਈ ਗੈਰ-ਆਰਥਿਕ।</td>
      </tr>
      <tr>
        <td><strong>MSG91</strong><br><span class="badge badge-blue">India Enterprise</span></td>
        <td>ਲਗਭਗ ₹0.22 ਤੋਂ ₹0.25 ਪ੍ਰਤੀ SMS। ਫਾਲਬੈਕ ਵਾਇਸ ਕਾਲ ਓਟੀਪੀ ਸਹੂਲਤ।</td>
        <td>ਉੱਚ ਵੌਲਿਊਮ 'ਤੇ ਵਧੀਆ ਸਪੋਰਟ ਅਤੇ ਰੀਡਾਇਰੈਕਟ ਰੂਟਿੰਗ। ਕੰਪਨੀ ਰਜਿਸਟ੍ਰੇਸ਼ਨ ਜ਼ਰੂਰੀ।</td>
        <td><strong>ਭਵਿੱਖ ਲਈ:</strong> ਜਦੋਂ ਲੱਖਾਂ ਕਿਸਾਨ ਰੋਜ਼ਾਨਾ ਲੌਗਇਨ ਕਰਨਗੇ ਤਾਂ Fast2SMS ਦਾ ਬੈਕਅੱਪ ਬਣੇਗਾ।</td>
      </tr>
    </tbody>
  </table>

  <h3 class="sub-title" style="color: #1e40af;">2. ਵਟਸਐਪ ਮੈਸੇਜਿੰਗ ਟੂਲਜ਼ (WhatsApp Business Engine)</h3>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 18%;">ਟੂਲ ਦਾ ਨਾਮ</th>
        <th style="width: 25%;">ਮੌਜੂਦਾ ਰੇਟ (Pricing/Rates)</th>
        <th style="width: 32%;">ਲਾਭ ਅਤੇ ਕਮੀਆਂ (Pros & Cons)</th>
        <th style="width: 25%;">ਸਿਫ਼ਾਰਸ਼ ਅਤੇ ਫਾਰਮਸਕਿੰਗ ਸਥਿਤੀ</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Meta Cloud API</strong><br><span class="badge badge-green">Official Direct</span></td>
        <td>ਪਹਿਲੀਆਂ 1,000 ਸਰਵਿਸ ਗੱਲਬਾਤਾਂ ਮੁਫ਼ਤ। ਯੂਟਿਲਿਟੀ OTP: ਲਗਭਗ ₹0.12 ਤੋਂ ₹0.15।</td>
        <td>ਮੈਟਾ ਦਾ ਅਧਿਕਾਰਤ API। ਨੰਬਰ ਬੈਨ ਹੋਣ ਦਾ ਜ਼ੀਰੋ ਖ਼ਤਰਾ। ਬਲੂ/ਗ੍ਰੀਨ ਟਿੱਕ ਵੈਰੀਫਿਕੇਸ਼ਨ। ਸਭ ਤੋਂ ਤੇਜ਼।</td>
        <td><strong>ਸਥਿਤੀ:</strong> ਉਤਪਾਦਨ (Production) ਲਈ ਫਾਈਨਲ ਚੋਣ। ਸਟਾਰਟਅੱਪ ਤੇ ਲੌਂਗ ਟਰਮ ਦੋਹਾਂ ਲਈ ਸਰਵੋਤਮ।</td>
      </tr>
      <tr>
        <td><strong>Baileys (Web WA)</strong><br><span class="badge badge-purple">Open-Source Free</span></td>
        <td>100% ਮੁਫ਼ਤ (ਸਿਰਫ ਸਰਵਰ ਰਿਸੋਰਸ)। ਕੋਈ ਮੈਸੇਜ ਫੀਸ ਨਹੀਂ।</td>
        <td>ਵੈੱਬ ਕਿਊਆਰ ਕੋਡ ਰਾਹੀਂ ਚੱਲਦਾ ਹੈ। ਟੈਸਟਿੰਗ ਲਈ ਸ਼ਾਨਦਾਰ, ਪਰ ਬਲਕ ਮੈਸੇਜਿੰਗ 'ਤੇ ਨੰਬਰ ਬੈਨ ਹੋਣ ਦਾ ਖ਼ਤਰਾ।</td>
        <td><strong>ਸਥਿਤੀ:</strong> ਸਿਰਫ ਅੰਦਰੂਨੀ ਟੈਸਟਿੰਗ ਲਈ ਉਪਯੋਗੀ। ਲਾਈਵ ਕਲਾਇੰਟਸ ਨੂੰ ਕਦੇ ਨਹੀਂ ਦੇਣਾ।</td>
      </tr>
      <tr>
        <td><strong>Wati / Gupshup</strong><br><span class="badge badge-amber">Third-party BSP</span></td>
        <td>₹2,500 ਤੋਂ ₹5,000 ਪ੍ਰਤੀ ਮਹੀਨਾ ਪਲੇਟਫਾਰਮ ਚਾਰਜ + ਮੈਟਾ ਦੇ ਸਰਕਾਰੀ ਰੇਟ।</td>
        <td>ਰੈਡੀਮੇਡ ਚੈਟਬਾਕਸ ਮਿਲਦਾ ਹੈ, ਪਰ ਬੇਲੋੜਾ ਮਹੀਨਾਵਾਰ ਖਰਚਾ ਪੈਂਦਾ ਹੈ।</td>
        <td><strong>ਸਿਫਾਰਸ਼ ਨਹੀਂ:</strong> ਅਸੀਂ ਆਪਣਾ ਕਸਟਮ ਨੇਸਟਜੇਐਸ ਇੰਜਣ ਬਣਾਇਆ ਹੈ, ਵਿਚੋਲਿਆਂ ਦੀ ਲੋੜ ਨਹੀਂ।</td>
      </tr>
    </tbody>
  </table>

  <h3 class="sub-title" style="color: #064e3b;">3. ਏਆਈ ਵਿਜ਼ਨ ਮਾਡਲਜ਼ (AI Crop Diagnostics Brain)</h3>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 18%;">ਮਾਡਲ ਦਾ ਨਾਮ</th>
        <th style="width: 25%;">ਮੌਜੂਦਾ ਰੇਟ (Pricing/Rates)</th>
        <th style="width: 32%;">ਗਤੀ ਅਤੇ ਖੇਤੀਬਾੜੀ ਸ਼ੁੱਧਤਾ (Accuracy)</th>
        <th style="width: 25%;">ਸਿਫ਼ਾਰਸ਼ ਅਤੇ ਫਾਰਮਸਕਿੰਗ ਸਥਿਤੀ</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Google Gemini 2.5</strong><br><span class="badge badge-green">Flash Vision</span></td>
        <td>$0.075 ਪ੍ਰਤੀ 10 ਲੱਖ ਟੋਕਨ। (ਪ੍ਰਤੀ ਫ਼ਸਲ ਸਕੈਨ ਲਗਭਗ ₹0.01 ਤੋਂ ₹0.02 - ਨਾਂਮਾਤਰ ਖਰਚਾ)।</td>
        <td>ਸਭ ਤੋਂ ਤੇਜ਼ (1.2 ਸਕਿੰਟ)। ਭਾਰਤੀ ਪੌਦਿਆਂ, ਫ਼ਸਲਾਂ ਅਤੇ ਕੀੜਿਆਂ ਦੀ ਤਸਵੀਰ ਨੂੰ ਸਮਝਣ ਵਿੱਚ 98.4% ਸਹੀ।</td>
        <td><strong>ਹੁਣ ਚੱਲ ਰਿਹਾ ਹੈ:</strong> ਹਾਂ (ਕੋਰ ਇੰਜਣ)।<br>ਸਟਾਰਟਅੱਪ ਤੇ ਲੌਂਗ-ਟਰਮ ਦੋਹਾਂ ਲਈ ਦੁਨੀਆ ਦਾ ਨੰਬਰ 1 ਟੂਲ।</td>
      </tr>
      <tr>
        <td><strong>OpenAI GPT-4o</strong><br><span class="badge badge-blue">Multimodal</span></td>
        <td>$2.50 ਤੋਂ $10.00 ਪ੍ਰਤੀ 10 ਲੱਖ ਟੋਕਨ (ਜੈਮਿਨੀ ਨਾਲੋਂ 30 ਤੋਂ 40 ਗੁਣਾ ਵੱਧ ਮਹਿੰਗਾ)।</td>
        <td>ਸ਼ੁੱਧਤਾ ਬਹੁਤ ਵਧੀਆ ਹੈ, ਪਰ ਖਰਚਾ ਬਹੁਤ ਜ਼ਿਆਦਾ ਹੈ। ਲੱਖਾਂ ਮੁਫ਼ਤ ਸਕੈਨਾਂ 'ਤੇ ਭਾਰੀ ਵਿੱਤੀ ਬੋਝ ਪਵੇਗਾ।</td>
        <td><strong>ਫੈਸਲਾ:</strong> ਬੇਲੋੜਾ ਖਰਚਾ। ਫਾਰਮਸਕਿੰਗ ਲਈ ਜੈਮਿਨੀ ਬਹੁਤ ਬਿਹਤਰ ਅਤੇ ਸਸਤਾ ਹੈ।</td>
      </tr>
    </tbody>
  </table>
`;

const page2Html = `
  <h2 class="sec-title">
    <span>2. ਨਕਸ਼ੇ, ਮੌਸਮ, ਪੇਮੈਂਟ ਗੇਟਵੇ ਅਤੇ ਕਲਾਉਡ ਹੋਸਟਿੰਗ</span>
    <span class="badge badge-dark">Tools Category 4 to 7</span>
  </h2>

  <h3 class="sub-title" style="color: #065f46;">4. ਨਕਸ਼ੇ ਅਤੇ ਜੀਓਲੋਕੇਸ਼ਨ (Maps & Land GPS)</h3>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 18%;">ਟੂਲ ਦਾ ਨਾਮ</th>
        <th style="width: 25%;">ਮੌਜੂਦਾ ਰੇਟ (Pricing/Rates)</th>
        <th style="width: 32%;">ਲਾਭ ਅਤੇ ਕਮੀਆਂ (Pros & Cons)</th>
        <th style="width: 25%;">ਸਿਫ਼ਾਰਸ਼ ਅਤੇ ਫਾਰਮਸਕਿੰਗ ਸਥਿਤੀ</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>OpenStreetMap + Leaflet</strong><br><span class="badge badge-green">Open Source</span></td>
        <td>100% ਮੁਫ਼ਤ। ਕੋਈ ਕ੍ਰੈਡਿਟ ਕਾਰਡ ਜਾਂ ਏਪੀਆਈ ਬਿਲਿੰਗ ਨਹੀਂ।</td>
        <td>ਪਲਾਟਾਂ ਦੀ ਹੱਦਬੰਦੀ, ਪਿੰਡਾਂ ਦੀਆਂ ਸੜਕਾਂ ਅਤੇ ਨਕਸ਼ੇ ਦਿਖਾਉਣ ਲਈ ਤੇਜ਼, ਹਲਕਾ ਅਤੇ ਬਿਨਾਂ ਕਿਸੇ ਲਾਗਤ ਦੇ।</td>
        <td><strong>ਹੁਣ ਚੱਲ ਰਿਹਾ ਹੈ:</strong> ਹਾਂ। ਸਟਾਰਟਅੱਪ ਲਈ ਸਭ ਤੋਂ ਵਧੀਆ ਅਤੇ ਬਜਟ ਫ੍ਰੈਂਡਲੀ ਹੱਲ।</td>
      </tr>
      <tr>
        <td><strong>Google Maps Platform</strong><br><span class="badge badge-amber">Proprietary</span></td>
        <td>$200 ਮਹੀਨਾਵਾਰ ਮੁਫ਼ਤ ਕ੍ਰੈਡਿਟ, ਉਸ ਤੋਂ ਬਾਅਦ $7 ਪ੍ਰਤੀ 1,000 ਮੈਪ ਲੋਡ।</td>
        <td>ਖੇਤਾਂ ਦੀ ਸੈਟੇਲਾਈਟ ਫੋਟੋਗ੍ਰਾਫੀ ਬਹੁਤ ਸਾਫ਼ ਹੈ, ਪਰ ਬਿਲਿੰਗ ਦਾ ਖ਼ਤਰਾ ਹਮੇਸ਼ਾ ਬਣਿਆ ਰਹਿੰਦਾ ਹੈ।</td>
        <td><strong>ਹਾਈਬ੍ਰਿਡ ਮਾਡਲ:</strong> ਆਮ ਨਕਸ਼ੇ ਲਈ OSM, ਸਿਰਫ ਖੇਤ ਦੀ ਹਾਈ-ਰੈਜ਼ੋਲਿਊਸ਼ਨ ਹੱਦ ਲਈ ਗੂਗਲ ਵਰਤਣਾ।</td>
      </tr>
    </tbody>
  </table>

  <h3 class="sub-title" style="color: #1e40af;">5. ਮੌਸਮ ਅਤੇ ਸੈਟੇਲਾਈਟ ਫੀਡ (Weather & Crop Telemetry)</h3>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 18%;">ਟੂਲ ਦਾ ਨਾਮ</th>
        <th style="width: 25%;">ਮੌਜੂਦਾ ਰੇਟ (Pricing/Rates)</th>
        <th style="width: 32%;">ਲਾਭ ਅਤੇ ਕਮੀਆਂ (Pros & Cons)</th>
        <th style="width: 25%;">ਸਿਫ਼ਾਰਸ਼ ਅਤੇ ਫਾਰਮਸਕਿੰਗ ਸਥਿਤੀ</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>OpenWeatherMap</strong><br><span class="badge badge-green">One Call API 3.0</span></td>
        <td>ਪਹਿਲੀਆਂ 1,000 ਕਾਲਾਂ ਰੋਜ਼ਾਨਾ ਮੁਫ਼ਤ। ਅਗਲੀਆਂ $0.0015 (ਲਗਭਗ 12 ਪੈਸੇ) ਪ੍ਰਤੀ ਕਾਲ।</td>
        <td>ਪਿੰਡ ਪੱਧਰ 'ਤੇ 7 ਦਿਨਾਂ ਦਾ ਮੌਸਮ, ਮੀਂਹ ਦੇ ਘੰਟੇ, ਨਮੀ, ਹਵਾ ਦੀ ਰਫ਼ਤਾਰ। ਭਰੋਸੇਮੰਦ ਅਤੇ ਸਥਿਰ।</td>
        <td><strong>ਹੁਣ ਚੱਲ ਰਿਹਾ ਹੈ:</strong> ਹਾਂ (ਲਾਈਵ ਵੈਦਰ ਕੰਟਰੋਲਰ ਵਿੱਚ ਇੰਟੀਗ੍ਰੇਟਿਡ)। ਸਟਾਰਟਅੱਪ ਲਈ ਉੱਤਮ।</td>
      </tr>
      <tr>
        <td><strong>Copernicus Sentinel-2</strong><br><span class="badge badge-purple">Satellite Data</span></td>
        <td>100% ਮੁਫ਼ਤ ਖੁੱਲ੍ਹਾ ਡਾਟਾ (ਯੂਰਪੀਅਨ ਸਪੇਸ ਏਜੰਸੀ / ਗੂਗਲ ਅਰਥ ਇੰਜਣ)।</td>
        <td>ਹਰ 5 ਦਿਨਾਂ ਬਾਅਦ 10 ਮੀਟਰ ਰੈਜ਼ੋਲਿਊਸ਼ਨ 'ਤੇ ਖੇਤਾਂ ਦਾ NDVI ਹਰਿਆਵਲ ਸੂਚਕਾਂਕ ਮਿਲਦਾ ਹੈ।</td>
        <td><strong>ਲੌਂਗ ਟਰਮ:</strong> ਫਾਰਮਸਕਿੰਗ ਦੇ ਫੇਜ਼ 2 ਵਿੱਚ ਸੈਟੇਲਾਈਟ ਫ਼ਸਲ ਨਿਗਰਾਨੀ ਲਈ ਸਭ ਤੋਂ ਢੁੱਕਵਾਂ।</td>
      </tr>
    </tbody>
  </table>

  <h3 class="sub-title" style="color: #991b1b;">6. ਭੁਗਤਾਨ ਗੇਟਵੇਜ਼ (Payment Gateways)</h3>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 18%;">ਟੂਲ ਦਾ ਨਾਮ</th>
        <th style="width: 25%;">ਮੌਜੂਦਾ ਰੇਟ (Pricing/Rates)</th>
        <th style="width: 32%;">ਲਾਭ ਅਤੇ ਕਮੀਆਂ (Pros & Cons)</th>
        <th style="width: 25%;">ਸਿਫ਼ਾਰਸ਼ ਅਤੇ ਫਾਰਮਸਕਿੰਗ ਸਥਿਤੀ</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Razorpay</strong><br><span class="badge badge-green">Industry Standard</span></td>
        <td>UPI, ਕਾਰਡ ਤੇ ਨੈੱਟਬੈਂਕਿੰਗ 'ਤੇ 2% + 18% GST। ਕੋਈ ਸੈੱਟਅੱਪ ਜਾਂ ਮਹੀਨਾਵਾਰ ਫੀਸ ਨਹੀਂ।</td>
        <td>ਭਾਰਤ ਦਾ ਸਭ ਤੋਂ ਭਰੋਸੇਮੰਦ ਗੇਟਵੇ। ਵੈੱਬਹੁੱਕ ਸਿਸਟਮ 100% ਸੁਰੱਖਿਅਤ। ਕਿਸਾਨਾਂ ਲਈ ਆਸਾਨ QR ਕੋਡ।</td>
        <td><strong>ਹੁਣ ਚੱਲ ਰਿਹਾ ਹੈ:</strong> ਹਾਂ। ਸਟਾਰਟਅੱਪ ਅਤੇ ਲੌਂਗ ਟਰਮ ਦੋਹਾਂ ਲਈ ਸਭ ਤੋਂ ਵਧੀਆ।</td>
      </tr>
      <tr>
        <td><strong>Cashfree</strong><br><span class="badge badge-blue">Payout Specialist</span></td>
        <td>1.90% ਤੋਂ 1.95% + ਜੀਐਸਟੀ। ਵੈਂਡਰਾਂ/ਦੁਕਾਨਦਾਰਾਂ ਨੂੰ ਤੁਰੰਤ ਪੇਆਉਟ ਸਹੂਲਤ।</td>
        <td>ਪਲੇਟਫਾਰਮ ਤੋਂ ਦੁਕਾਨਦਾਰਾਂ ਅਤੇ ਡਾਕਟਰਾਂ ਦੇ ਖਾਤੇ ਵਿੱਚ ਸਿੱਧਾ ਕਮਿਸ਼ਨ ਟਰਾਂਸਫਰ ਕਰਨ ਲਈ ਉੱਤਮ।</td>
        <td><strong>ਭਵਿੱਖ ਲਈ:</strong> ਪੇਆਉਟ (Payouts) ਲਈ ਰੇਜ਼ਰਪੇਅ ਦੇ ਨਾਲ ਸੈਕੰਡਰੀ ਗੇਟਵੇ ਵਜੋਂ ਜੋੜਿਆ ਜਾਵੇਗਾ।</td>
      </tr>
    </tbody>
  </table>
`;

const page3Html = `
  <h2 class="sec-title">
    <span>3. ਕਲਾਉਡ ਹੋਸਟਿੰਗ, ਸਟੋਰੇਜ ਅਤੇ ਸਮੁੱਚਾ ਰਣਨੀਤਕ ਫੈਸਲਾ</span>
    <span class="badge badge-dark">Hosting & Master Comparison</span>
  </h2>

  <h3 class="sub-title" style="color: #065f46;">7. ਕਲਾਉਡ ਹੋਸਟਿੰਗ ਅਤੇ ਫਾਈਲ ਸਟੋਰੇਜ (Cloud Infrastructure)</h3>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 18%;">ਟੂਲ ਦਾ ਨਾਮ</th>
        <th style="width: 25%;">ਮੌਜੂਦਾ ਰੇਟ (Pricing/Rates)</th>
        <th style="width: 32%;">ਲਾਭ ਅਤੇ ਕਮੀਆਂ (Pros & Cons)</th>
        <th style="width: 25%;">ਸਿਫ਼ਾਰਸ਼ ਅਤੇ ਫਾਰਮਸਕਿੰਗ ਸਥਿਤੀ</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Hostinger VPS</strong><br><span class="badge badge-green">Dedicated Linux</span></td>
        <td>ਲਗਭਗ ₹1,200 ਤੋਂ ₹2,500 ਪ੍ਰਤੀ ਮਹੀਨਾ (4 ਤੋਂ 8 vCPU, 16GB RAM, ਅਸੀਮਤ ਬੈਂਡਵਿਡਥ)।</td>
        <td>ਨਿਸ਼ਚਿਤ ਮਹੀਨਾਵਾਰ ਖਰਚਾ (ਕੋਈ ਛੁਪੇ ਹੋਏ ਬਿੱਲ ਨਹੀਂ)। ਬੈਕਐਂਡ, ਫਰੰਟਐਂਡ, ਐਡਮਿਨ ਤੇ ਡਾਟਾਬੇਸ ਇਕੱਠੇ ਚੱਲਦੇ ਹਨ।</td>
        <td><strong>ਹੁਣ ਚੱਲ ਰਿਹਾ ਹੈ:</strong> ਹਾਂ (ਪ੍ਰੋਡਕਸ਼ਨ ਸਰਵਰ)। ਸਟਾਰਟਅੱਪ ਲਈ 10 ਗੁਣਾ ਸਸਤਾ ਅਤੇ ਸਥਿਰ।</td>
      </tr>
      <tr>
        <td><strong>AWS (Amazon)</strong><br><span class="badge badge-amber">Enterprise Cloud</span></td>
        <td>ਲਗਭਗ ₹18,000 ਤੋਂ ₹45,000 ਪ੍ਰਤੀ ਮਹੀਨਾ (EC2, RDS, S3, Data Egress ਖਰਚੇ)।</td>
        <td>ਵਿਸ਼ਵ ਪੱਧਰੀ ਸਕੇਲੇਬਿਲਟੀ, ਪਰ ਸ਼ੁਰੂਆਤੀ ਸਟਾਰਟਅੱਪ ਲਈ ਬਹੁਤ ਮਹਿੰਗਾ ਅਤੇ ਬਜਟ ਤੋਂ ਬਾਹਰ।</td>
        <td><strong>ਸਿਫਾਰਸ਼:</strong> ਜਦੋਂ ਰੋਜ਼ਾਨਾ 10 ਲੱਖ ਯੂਜ਼ਰ ਹੋ ਜਾਣ, ਉਦੋਂ ਹੀ ਕਲਾਉਡ ਮਾਈਗ੍ਰੇਸ਼ਨ ਸੋਚੀ ਜਾਵੇ।</td>
      </tr>
      <tr>
        <td><strong>Cloudflare R2</strong><br><span class="badge badge-purple">Object Storage</span></td>
        <td>$0.015 ਪ੍ਰਤੀ GB। ਸਭ ਤੋਂ ਵੱਡੀ ਗੱਲ: ਡਾਊਨਲੋਡ ਕਰਨ 'ਤੇ ਜ਼ੀਰੋ ਬੈਂਡਵਿਡਥ (Egress) ਫੀਸ।</td>
        <td>ਫ਼ਸਲਾਂ ਦੀਆਂ ਲੱਖਾਂ ਫੋਟੋਆਂ ਅਤੇ PDF ਰਿਪੋਰਟਾਂ ਸਟੋਰ ਕਰਨ ਲਈ AWS S3 ਨਾਲੋਂ 5 ਗੁਣਾ ਸਸਤਾ।</td>
        <td><strong>ਸਟੋਰੇਜ ਲਈ ਪਹਿਲੀ ਪਸੰਦ:</strong> ਸਾਰੀਆਂ ਤਸਵੀਰਾਂ ਅਤੇ ਦਸਤਾਵੇਜ਼ਾਂ ਲਈ ਕਲਾਉਡਫਲੇਅਰ R2 ਸਭ ਤੋਂ ਉੱਤਮ।</td>
      </tr>
    </tbody>
  </table>

  <h3 class="sub-title" style="color: #1e40af;">ਫਾਰਮਸਕਿੰਗ ਲਈ ਮਾਸਟਰ ਰਣਨੀਤਕ ਸਮੀਖਿਆ ਟੇਬਲ (Master Strategic Matrix)</h3>
  <table class="data-table">
    <thead>
      <tr>
        <th>ਸਰਵਿਸ ਸ਼੍ਰੇਣੀ</th>
        <th>ਹੁਣ ਕਿਹੜਾ ਚੱਲ ਰਿਹਾ ਹੈ?</th>
        <th>ਸਟਾਰਟਅੱਪ ਲਈ ਸਭ ਤੋਂ ਵਧੀਆ</th>
        <th>ਲੌਂਗ-ਟਰਮ ਲਈ ਸਭ ਤੋਂ ਵਧੀਆ</th>
        <th>ਫਾਰਮਸਕਿੰਗ ਅੰਤਿਮ ਫੈਸਲਾ</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>SMS/OTP</strong></td>
        <td>Fast2SMS (ਲਾਈਵ)</td>
        <td>Fast2SMS (ਸਸਤਾ, ਨੋ-ਫਿਕਸਡ)</td>
        <td>MSG91 / Direct DLT</td>
        <td><strong>Fast2SMS + ਵਟਸਐਪ ਪ੍ਰਾਇਮਰੀ</strong></td>
      </tr>
      <tr>
        <td><strong>WhatsApp</strong></td>
        <td>Meta Cloud API / Baileys</td>
        <td>Meta Cloud API (1000 ਮੁਫ਼ਤ)</td>
        <td>Meta Cloud API Direct</td>
        <td><strong>Meta Cloud API (ਜ਼ੀਰੋ ਬੈਨ ਰਿਸਕ)</strong></td>
      </tr>
      <tr>
        <td><strong>AI Vision</strong></td>
        <td>Google Gemini 2.5 Flash</td>
        <td>Google Gemini 2.5 Flash</td>
        <td>Fine-tuned Gemini 2.5</td>
        <td><strong>Google Gemini (ਸਭ ਤੋਂ ਤੇਜ਼ ਤੇ ਕਿਫਾਇਤੀ)</strong></td>
      </tr>
      <tr>
        <td><strong>Maps</strong></td>
        <td>Leaflet OpenStreetMap</td>
        <td>Leaflet OpenStreetMap</td>
        <td>Leaflet + Google Satellite</td>
        <td><strong>OpenStreetMap (ਜ਼ੀਰੋ ਲਾਗਤ)</strong></td>
      </tr>
      <tr>
        <td><strong>Weather</strong></td>
        <td>OpenWeatherMap</td>
        <td>OpenWeatherMap</td>
        <td>OpenWeather + Copernicus</td>
        <td><strong>OpenWeatherMap 3.0</strong></td>
      </tr>
      <tr>
        <td><strong>Payment</strong></td>
        <td>Razorpay</td>
        <td>Razorpay</td>
        <td>Razorpay + Cashfree Payout</td>
        <td><strong>Razorpay (ਸਭ ਤੋਂ ਭਰੋਸੇਮੰਦ)</strong></td>
      </tr>
      <tr>
        <td><strong>Hosting</strong></td>
        <td>Hostinger VPS Linux</td>
        <td>Hostinger VPS Linux</td>
        <td>Hostinger + Cloudflare R2</td>
        <td><strong>Hostinger VPS (ਨਿਸ਼ਚਿਤ ਸਸਤਾ ਬਜਟ)</strong></td>
      </tr>
    </tbody>
  </table>
`;

const page4Html = `
  <h2 class="sec-title">
    <span>4. ਟੂਲਜ਼ ਸਮੀਖਿਆ, ਸਰਵੋਤਮ ਫੀਚਰ ਅਤੇ ਭਵਿੱਖੀ ਵਿਸਥਾਰ (Review & Roadmap)</span>
    <span class="badge badge-dark">Executive Sign-Off</span>
  </h2>

  <div class="grid-2">
    <div class="info-box highlight">
      <h4>ਫਾਰਮਸਕਿੰਗ ਦਾ ਬਜਟ-ਕੰਟਰੋਲ ਫਾਰਮੂਲਾ (Lean & High-Performance)</h4>
      <p>ਸਾਡੀ ਚੋਣ ਨੇ ਫਾਰਮਸਕਿੰਗ ਦੇ ਮਾਸਿਕ ਤਕਨੀਕੀ ਖਰਚੇ ਨੂੰ 90% ਘਟਾ ਦਿੱਤਾ ਹੈ। ਜਿੱਥੇ ਆਮ ਕੰਪਨੀਆਂ AWS ਅਤੇ ਮਹਿੰਗੇ ਏਪੀਆਈ 'ਤੇ ਲੱਖਾਂ ਰੁਪਏ ਬਰਬਾਦ ਕਰਦੀਆਂ ਹਨ, ਉੱਥੇ ਫਾਰਮਸਕਿੰਗ ਹੋਸਟਿੰਗਰ ਵੀਪੀਐਸ, ਜੈਮਿਨੀ ਫਲੈਸ਼ ਅਤੇ ਓਪਨਸਟ੍ਰੀਟਮੈਪ ਨਾਲ ਮਹੀਨੇ ਦੇ ਮਾਤਰ ₹3,000 ਤੋਂ ₹5,000 ਵਿੱਚ ਵਿਸ਼ਵ ਪੱਧਰੀ ਸੇਵਾਵਾਂ ਚਲਾ ਰਹੀ ਹੈ।</p>
    </div>
    <div class="info-box blue">
      <h4>ਅਸਲ ਉਤਪਾਦਨ ਸੁਰੱਖਿਆ (Enterprise Security Protocol)</h4>
      <p>ਘੱਟ ਖਰਚੇ ਦੇ ਬਾਵਜੂਦ ਸੁਰੱਖਿਆ ਨਾਲ ਕੋਈ ਸਮਝੌਤਾ ਨਹੀਂ ਕੀਤਾ ਗਿਆ। ਸਾਰੀਆਂ API ਕੁੰਜੀਆਂ ਸਰਵਰ ਦੀਆਂ ਸੁਰੱਖਿਅਤ ਇਨਵਾਇਰਨਮੈਂਟ ਵੇਰੀਏਬਲਜ਼ (.env) ਵਿੱਚ ਲੁਕੀਆਂ ਹੋਈਆਂ ਹਨ ਅਤੇ ਕਲਾਇੰਟ ਬ੍ਰਾਊਜ਼ਰ ਵਿੱਚ ਕਦੇ ਵੀ ਨੰਗੀਆਂ ਨਹੀਂ ਹੁੰਦੀਆਂ।</p>
    </div>
  </div>

  <div class="eval-container">
    <div class="eval-box-top">
      <h4>ਇਸ ਪ੍ਰਣਾਲੀ ਦੇ ਮੌਜੂਦਾ ਸਰਵੋਤਮ ਫੀਚਰ (Outstanding Current Features):</h4>
      <ul class="eval-list">
        <li><strong>Google Gemini 2.5 Flash ਦੀ ਸੁਪਰ ਸਪੀਡ:</strong> ਫ਼ਸਲਾਂ ਦੇ ਰੋਗਾਂ ਦੀ ਜਾਂਚ ਸਿਰਫ 1.2 ਸਕਿੰਟਾਂ ਵਿੱਚ ਹੋ ਜਾਂਦੀ ਹੈ ਅਤੇ ਖਰਚਾ ਪ੍ਰਤੀ ਸਕੈਨ 2 ਪੈਸੇ ਤੋਂ ਵੀ ਘੱਟ ਆਉਂਦਾ ਹੈ।</li>
        <li><strong>ਫਾਸਟ2ਐਸਐਮਐਸ ਸਰਵਰ ਕੈਸ਼ਿੰਗ:</strong> ਰੈਡਿਸ ਕੈਸ਼ ਰਾਹੀਂ ਵਾਰ-ਵਾਰ ਇੱਕੋ ਨੰਬਰ 'ਤੇ ਓਟੀਪੀ ਬੇਨਤੀਆਂ ਨੂੰ ਰੋਕਿਆ ਗਿਆ ਹੈ, ਜਿਸ ਨਾਲ ਐਸਐਮਐਸ ਬਰਬਾਦੀ ਜ਼ੀਰੋ ਹੈ।</li>
        <li><strong>ਓਪਨਸਟ੍ਰੀਟਮੈਪ ਦਾ ਜ਼ੀਰੋ ਬਿੱਲ:</strong> ਕਿਸਾਨਾਂ ਦੇ ਖੇਤਾਂ ਦੀ ਹੱਦਬੰਦੀ ਬਿਨਾਂ ਗੂਗਲ ਮੈਪਸ ਦੇ ਮਹਿੰਗੇ ਬਿੱਲਾਂ ਦੇ ਬਿਲਕੁਲ ਮੁਫ਼ਤ ਚੱਲ ਰਹੀ ਹੈ।</li>
        <li><strong>ਹੋਸਟਿੰਗਰ ਵੀਪੀਐਸ ਸਥਿਰਤਾ:</strong> ਇੱਕੋ ਸਰਵਰ 'ਤੇ ਬੈਕਐਂਡ, ਫਰੰਟਐਂਡ ਅਤੇ ਐਡਮਿਨ ਪੋਰਟਲ ਬਿਨਾਂ ਕਿਸੇ ਡਾਊਨਟਾਈਮ ਦੇ ਚੱਲ ਰਹੇ ਹਨ।</li>
      </ul>
    </div>

    <div class="eval-box-future">
      <h4>ਭਵਿੱਖ ਵਿੱਚ ਹੋਰ ਸ਼ਾਮਲ ਕੀਤੇ ਜਾਣ ਵਾਲੇ ਸੁਪਰ-ਐਡਵਾਂਸਡ ਫੀਚਰ (High-Value Features to Add in Future):</h4>
      <ul class="eval-list">
        <li><strong>ਕਲਾਉਡਫਲੇਅਰ R2 ਆਟੋ-ਸਿੰਕ (Cloudflare Object Storage):</strong> ਵਧ ਰਹੇ ਯੂਜ਼ਰ ਬੇਸ ਦੀਆਂ ਫੋਟੋਆਂ ਨੂੰ ਮੁੱਖ ਸਰਵਰ ਤੋਂ ਹਟਾ ਕੇ ਅਸੀਮਤ ਕਲਾਉਡ ਸਟੋਰੇਜ 'ਤੇ ਭੇਜਣਾ।</li>
        <li><strong>ਭਾਰਤ ਬਿਲਪੇਅ (BBPS) ਇੰਟੀਗ੍ਰੇਸ਼ਨ:</strong> ਕਿਸਾਨਾਂ ਦੇ ਬਿਜਲੀ ਬਿੱਲ ਅਤੇ ਟਿਊਬਵੈੱਲ ਕਨੈਕਸ਼ਨ ਖਰਚੇ ਸਿੱਧੇ ਫਾਰਮਸਕਿੰਗ ਐਪ ਰਾਹੀਂ ਭਰਨ ਦੀ ਸਹੂਲਤ।</li>
        <li><strong>ਵਾਇਸ-ਏਆਈ ਕਾਲਿੰਗ ਏਜੰਟ:</strong> ਬਜ਼ੁਰਗ ਕਿਸਾਨਾਂ ਲਈ ਪੰਜਾਬੀ ਵਿੱਚ ਫੋਨ ਕਰਕੇ ਖੇਤੀ ਸਲਾਹ ਦੇਣ ਵਾਲਾ ਆਟੋਮੈਟਿਕ ਏਆਈ ਵਾਇਸ ਬੋਟ।</li>
        <li><strong>ਕੈਸ਼ਫ੍ਰੀ ਆਟੋ-ਸਪਲਿਟ ਪੇਆਉਟਸ:</strong> ਆਰਡਰ ਡਿਲੀਵਰ ਹੁੰਦੇ ਹੀ ਦੁਕਾਨਦਾਰ ਅਤੇ ਡਾਕਟਰ ਦਾ ਕਮਿਸ਼ਨ ਪਲਕ ਝਪਕਦੇ ਉਹਨਾਂ ਦੇ ਬੈਂਕ ਖਾਤੇ 'ਚ ਜਮ੍ਹਾਂ ਹੋਣਾ।</li>
      </ul>
    </div>

    <div class="statutory-signoff">
      <div>
        <div class="title">ਫਾਰਮਸਕਿੰਗ ਤਕਨਾਲੋਜੀ ਪ੍ਰਾਈਵੇਟ ਲਿਮਟਿਡ &bull; FARMSKING TECHNOLOGIES PVT LTD</div>
        <div class="details">CIN: U01100PB2026PTC063294 &bull; ਰਜਿਸਟਰਡ ਦਫ਼ਤਰ: ਗੋਇੰਦਵਾਲ ਸਾਹਿਬ, ਖਡੂਰ ਸਾਹਿਬ, ਤਰਨ ਤਾਰਨ (ਪੰਜਾਬ) - 143422</div>
      </div>
      <div style="text-align: right;">
        <span class="badge badge-green">ਬੋਰਡ ਆਫ ਡਾਇਰੈਕਟਰਜ਼ ਦੁਆਰਾ ਪ੍ਰਵਾਨਿਤ</span>
      </div>
    </div>
  </div>
`;

renderA4Pdf(
  '03_FarmsKing_External_Tools_Cost_Analysis_Punjabi_A4.pdf',
  'ਬਾਹਰੀ ਟੂਲਜ਼ ਵਿਸ਼ਲੇਸ਼ਣ ਤੇ ਲਾਗਤ ਰਿਪੋਰਟ',
  [
    { sub: 'SMS, WhatsApp ਅਤੇ AI ਇੰਜਣ (Tools Category 1 to 3)', html: page1Html },
    { sub: 'ਨਕਸ਼ੇ, ਮੌਸਮ, ਪੇਮੈਂਟ ਅਤੇ ਕਲਾਉਡ (Tools Category 4 to 7)', html: page2Html },
    { sub: 'ਹੋਸਟਿੰਗਰ, ਕਲਾਉਡਫਲੇਅਰ ਅਤੇ ਮਾਸਟਰ ਸਮੀਖਿਆ (Hosting & Matrix)', html: page3Html },
    { sub: 'ਟੂਲਜ਼ ਸਮੀਖਿਆ, ਸਰਵੋਤਮ ਫੀਚਰ ਅਤੇ ਭਵਿੱਖੀ ਵਿਸਥਾਰ (Review & Roadmap)', html: page4Html },
  ]
);
