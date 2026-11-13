/**
 * PDF 4: External Tools Account Setup, API Keys, Code IDs & Integration Dossier
 * FarmsKing Technologies Private Limited
 */

const { renderA4Pdf } = require('./pdf_common');

const page1Html = `
  <h2 class="sec-title">
    <span>1. ਬਾਹਰੀ ਟੂਲਜ਼ ਦੇ ਅਕਾਊਂਟ ਨਿਰਮਾਣ ਅਤੇ API ਕੁੰਜੀਆਂ ਦੀ ਗਾਈਡ</span>
    <span class="badge badge-dark">Setup Guide: Part 1</span>
  </h2>
  
  <p>
    ਇਹ ਦਸਤਾਵੇਜ਼ ਫਾਰਮਸਕਿੰਗ ਪਲੇਟਫਾਰਮ ਵਿੱਚ ਵਰਤੇ ਜਾਣ ਵਾਲੇ ਸਾਰੇ ਬਾਹਰੀ ਟੂਲਜ਼ (APIs/SDKs) ਦੇ ਅਕਾਊਂਟ ਬਣਾਉਣ ਤੋਂ ਲੈ ਕੇ ਉਹਨਾਂ ਦੀਆਂ ਗੁਪਤ API ਕੁੰਜੀਆਂ, ਕੋਡ ਆਈਡੀਜ਼ (IDs), ਅਤੇ ਸਰਵਰ ਕੌਂਫਿਗਰੇਸ਼ਨ ਦੀ ਸੰਪੂਰਨ ਤਕਨੀਕੀ ਜਾਣਕਾਰੀ ਪ੍ਰਦਾਨ ਕਰਦਾ ਹੈ:
  </p>

  <h3 class="sub-title" style="color: #065f46;">1. Meta WhatsApp Cloud API (ਅਧਿਕਾਰਤ ਵਟਸਐਪ ਬਿਜ਼ਨਸ)</h3>
  <div class="info-box highlight">
    <h4>ਅਕਾਊਂਟ ਬਣਾਉਣ ਦੀ ਵਿਧੀ (Account Creation Steps):</h4>
    <p>1. developers.facebook.com 'ਤੇ ਜਾ ਕੇ ਕੰਪਨੀ ਦੇ ਫੇਸਬੁੱਕ ਅਕਾਊਂਟ ਨਾਲ ਲੌਗਇਨ ਕਰੋ।<br>
    2. 'My Apps' ਵਿੱਚ ਜਾ ਕੇ 'Create App' ਕਲਿੱਕ ਕਰੋ ਅਤੇ 'Business' ਕਿਸਮ ਚੁਣੋ।<br>
    3. ਐਪ ਡੈਸ਼ਬੋਰਡ ਵਿੱਚ 'WhatsApp' ਪ੍ਰੋਡਕਟ ਸ਼ਾਮਲ ਕਰੋ।<br>
    4. Meta Business Manager ਵਿੱਚ ਕੰਪਨੀ ਦਾ ਪੈਨ ਕਾਰਡ ਅਤੇ ਸਰਕਾਰੀ ਰਜਿਸਟ੍ਰੇਸ਼ਨ (CIN) ਅਪਲੋਡ ਕਰਕੇ ਬਿਜ਼ਨਸ ਵੈਰੀਫਾਈ ਕਰੋ।</p>
  </div>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 25%;">ਕੋਡ ਵੇਰੀਏਬਲ / ID ਦਾ ਨਾਮ</th>
        <th style="width: 35%;">ਇਹ ਕਿੱਥੋਂ ਮਿਲੇਗਾ? (Source in Dashboard)</th>
        <th style="width: 40%;">ਸਿਸਟਮ ਵਿੱਚ ਕੰਮ (Role in Code)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>WABA ID</strong><br>(WhatsApp Business Account ID)</td>
        <td>Meta App Dashboard -> WhatsApp -> API Setup ਪੈਨਲ ਵਿੱਚ ਸਭ ਤੋਂ ਉੱਪਰ 15-16 ਅੰਕਾਂ ਦਾ ਨੰਬਰ।</td>
        <td>ਕੰਪਨੀ ਦੇ ਅਧਿਕਾਰਤ ਵਟਸਐਪ ਖਾਤੇ ਦੀ ਮੁੱਖ ਪਛਾਣ। ਸਾਰੇ ਮੈਸੇਜ ਇਸੇ ਖਾਤੇ ਨਾਲ ਜੁੜਦੇ ਹਨ।</td>
      </tr>
      <tr>
        <td><strong>Phone Number ID</strong></td>
        <td>API Setup ਪੈਨਲ ਵਿੱਚ 'Phone number ID' ਦੇ ਸਾਹਮਣੇ ਦਿਖਾਈ ਦਿੰਦਾ ਹੈ।</td>
        <td>ਸੁਨੇਹੇ ਭੇਜਣ ਵਾਲੇ ਖਾਸ ਮੋਬਾਈਲ ਨੰਬਰ ਦੀ ਆਈਡੀ। ਬੈਕਐਂਡ ਇਸੇ ਆਈਡੀ 'ਤੇ POST ਕਾਲ ਕਰਦਾ ਹੈ।</td>
      </tr>
      <tr>
        <td><strong>System User Access Token</strong><br>(Permanent Token)</td>
        <td>Business Settings -> Users -> System Users -> 'Generate Token' (whatsapp_business_messaging ਚੁਣੋ)।</td>
        <td>ਬੈਕਐਂਡ ਵਿੱਚ WHATSAPP_ACCESS_TOKEN ਵਜੋਂ ਸੇਵ ਹੁੰਦਾ ਹੈ। ਇਹ ਟੋਕਨ ਕਦੇ ਐਕਸਪਾਇਰ ਨਹੀਂ ਹੁੰਦਾ।</td>
      </tr>
      <tr>
        <td><strong>Webhook Verify Token</strong></td>
        <td>ਕੰਪਨੀ ਵੱਲੋਂ ਖੁਦ ਤੈਅ ਕੀਤਾ ਜਾਂਦਾ ਗੁਪਤ ਪਾਸਵਰਡ (ਜਿਵੇਂ FK_WA_SEC_2026)।</td>
        <td>ਜਦੋਂ ਕੋਈ ਯੂਜ਼ਰ ਵਟਸਐਪ 'ਤੇ ਜਵਾਬ ਦਿੰਦਾ ਹੈ ਤਾਂ ਮੈਟਾ ਇਸ ਟੋਕਨ ਨਾਲ ਬੈਕਐਂਡ ਨੂੰ ਵੈਰੀਫਾਈ ਕਰਦਾ ਹੈ।</td>
      </tr>
      <tr>
        <td><strong>Template Name</strong></td>
        <td>WhatsApp Manager -> Message Templates -> 'farmsking_otp_alert'</td>
        <td>ਸਰਕਾਰੀ ਮਨਜ਼ੂਰਸ਼ੁਦਾ ਟੈਮਪਲੇਟ ਜਿਸ ਰਾਹੀਂ ਕਿਸਾਨ ਨੂੰ ਓਟੀਪੀ ਅਤੇ ਬਿੱਲ ਜਾਂਦੇ ਹਨ।</td>
      </tr>
    </tbody>
  </table>

  <h3 class="sub-title" style="color: #1e40af;">2. Fast2SMS & Indian DLT Portal (ਭਾਰਤੀ SMS ਤੇ OTP)</h3>
  <div class="info-box blue">
    <h4>DLT ਅਤੇ Fast2SMS ਪ੍ਰਕਿਰਿਆ:</h4>
    <p>1. ਭਾਰਤ ਸਰਕਾਰ ਦੇ ਟੈਲੀਕਾਮ ਨਿਯਮਾਂ ਅਨੁਸਾਰ Smartping (ਵੋਡਾਫੋਨ/ਏਅਰਟੈੱਲ) ਜਾਂ Jio DLT ਪੋਰਟਲ 'ਤੇ ਕੰਪਨੀ ਰਜਿਸਟਰ ਕਰੋ।<br>
    2. 'Sender ID' (ਜਿਵੇਂ FRMSKG) ਅਤੇ SMS ਟੈਮਪਲੇਟ ਮਨਜ਼ੂਰ ਕਰਵਾਓ।<br>
    3. fast2sms.com 'ਤੇ ਜਾ ਕੇ DLT ਮੋਡ ਚਾਲੂ ਕਰੋ ਅਤੇ ਪ੍ਰਵਾਨਿਤ ਟੈਮਪਲੇਟ ਲਿੰਕ ਕਰੋ।</p>
  </div>
  <table class="data-table">
    <thead>
      <tr>
        <th>ਕੋਡ ਵੇਰੀਏਬਲ / ID</th>
        <th>ਪੋਰਟਲ ਵਿੱਚ ਸਥਾਨ</th>
        <th>ਵੇਰਵਾ ਅਤੇ ਉਦਾਹਰਣ</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>FAST2SMS_API_KEY</strong></td>
        <td>Fast2SMS Dashboard -> Dev API ਪੈਨਲ ਵਿੱਚ।</td>
        <td>ਗੁਪਤ ਕੁੰਜੀ ਜਿਸ ਨਾਲ ਬੈਕਐਂਡ ਸਰਵਰ SMS ਗੇਟਵੇਅ ਨੂੰ ਅਧਿਕਾਰਤ ਕਰਦਾ ਹੈ।</td>
      </tr>
      <tr>
        <td><strong>FAST2SMS_ENTITY_ID</strong></td>
        <td>ਸਰਕਾਰੀ DLT ਪੋਰਟਲ ਤੋਂ ਪ੍ਰਾਪਤ ਕੰਪਨੀ ਦਾ 19-ਅੰਕੀ ਨੰਬਰ।</td>
        <td>Principal Entity ID (ਜਿਵੇਂ 1701159847123456789)। ਟਰਾਈ (TRAI) ਦੁਆਰਾ ਲਾਜ਼ਮੀ।</td>
      </tr>
      <tr>
        <td><strong>FAST2SMS_SENDER_ID</strong></td>
        <td>DLT Header Approval ਸੈਕਸ਼ਨ ਵਿੱਚੋਂ।</td>
        <td>6 ਅੱਖਰਾਂ ਦਾ ਅਧਿਕਾਰਤ ਹੈੱਡਰ (ਜਿਵੇਂ FRMSKG), ਜੋ ਮੋਬਾਈਲ 'ਤੇ SMS ਆਉਣ ਸਮੇਂ ਦਿਸਦਾ ਹੈ।</td>
      </tr>
      <tr>
        <td><strong>FAST2SMS_DLT_TE_ID</strong></td>
        <td>DLT Template Approval ਸੈਕਸ਼ਨ ਵਿੱਚੋਂ।</td>
        <td>ਮਨਜ਼ੂਰਸ਼ੁਦਾ SMS ਟੈਮਪਲੇਟ ਦੀ ਆਈਡੀ (ਜਿਵੇਂ 1707161234567890123)।</td>
      </tr>
    </tbody>
  </table>
`;

const page2Html = `
  <h2 class="sec-title">
    <span>2. ਆਰਟੀਫੀਸ਼ੀਅਲ ਇੰਟੈਲੀਜੈਂਸ (AI) ਅਤੇ ਪੇਮੈਂਟ ਗੇਟਵੇਜ਼</span>
    <span class="badge badge-dark">Setup Guide: Part 2</span>
  </h2>

  <h3 class="sub-title" style="color: #065f46;">3. Google Gemini AI (ਫ਼ਸਲ ਰੋਗ ਜਾਂਚ ਬ੍ਰੇਨ)</h3>
  <div class="info-box highlight">
    <h4>ਗੂਗਲ ਜੈਮਿਨੀ ਏਪੀਆਈ ਬਣਾਉਣਾ (Google AI Studio):</h4>
    <p>1. aistudio.google.com 'ਤੇ ਜਾਓ ਅਤੇ ਆਪਣੇ ਗੂਗਲ ਕਾਰਪੋਰੇਟ ਖਾਤੇ ਨਾਲ ਸਾਈਨ-ਇਨ ਕਰੋ।<br>
    2. 'Get API Key' 'ਤੇ ਕਲਿੱਕ ਕਰਕੇ 'Create API key in new project' ਚੁਣੋ।<br>
    3. ਪ੍ਰੋਜੈਕਟ ਦਾ ਨਾਮ 'FarmsKing-Production-Vision' ਰੱਖੋ।</p>
  </div>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 25%;">ਕੋਡ ਵੇਰੀਏਬਲ / ID</th>
        <th style="width: 35%;">ਪੋਰਟਲ ਵਿੱਚ ਸਥਾਨ</th>
        <th style="width: 40%;">ਸਿਸਟਮ ਵਿੱਚ ਕੰਮ (Role in Code)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>GEMINI_API_KEY</strong></td>
        <td>Google AI Studio ਵਿੱਚ 'API Keys' ਪੈਨਲ ਤੋਂ ਕਾਪੀ ਕਰੋ (AIzaSy...).</td>
        <td>ਬੈਕਐਂਡ ਵਿੱਚ ਬਿਮਾਰ ਪੌਦੇ ਦੀ ਫੋਟੋ ਭੇਜ ਕੇ ਬਿਮਾਰੀ ਦਾ ਨਾਮ ਅਤੇ ਇਲਾਜ ਪ੍ਰਾਪਤ ਕਰਨ ਲਈ ਵਰਤਿਆ ਜਾਂਦਾ ਹੈ।</td>
      </tr>
      <tr>
        <td><strong>GEMINI_MODEL</strong></td>
        <td>ਕੋਡ ਕੌਂਫਿਗਰੇਸ਼ਨ ਵਿੱਚ ਨਿਰਧਾਰਤ ਨਾਮ।</td>
        <td>ਸਾਡੇ ਸਿਸਟਮ ਵਿੱਚ ਮਾਡਲ ਨਾਮ gemini-2.5-flash ਚੁਣਿਆ ਗਿਆ ਹੈ ਜੋ ਸਭ ਤੋਂ ਤੇਜ਼ ਅਤੇ ਕਿਫਾਇਤੀ ਹੈ।</td>
      </tr>
    </tbody>
  </table>

  <h3 class="sub-title" style="color: #1e40af;">4. Razorpay Payment Gateway (ਔਨਲਾਈਨ ਭੁਗਤਾਨ ਸਿਸਟਮ)</h3>
  <div class="info-box blue">
    <h4>ਰੇਜ਼ਰਪੇਅ ਮਰਚੈਂਟ ਅਕਾਊਂਟ ਸੈੱਟਅੱਪ:</h4>
    <p>1. dashboard.razorpay.com 'ਤੇ ਕੰਪਨੀ ਦਾ ਵਪਾਰਕ ਖਾਤਾ ਖੋਲ੍ਹੋ।<br>
    2. FARMSKING TECHNOLOGIES PRIVATE LIMITED ਦੇ KYC ਦਸਤਾਵੇਜ਼ (PAN, GSTIN, ਬੈਂਕ ਖਾਤਾ) ਅਪਲੋਡ ਕਰੋ।<br>
    3. ਮਨਜ਼ੂਰੀ ਤੋਂ ਬਾਅਦ Settings -> API Keys ਵਿੱਚ ਜਾ ਕੇ ਕੁੰਜੀਆਂ ਤਿਆਰ ਕਰੋ।</p>
  </div>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 25%;">ਕੋਡ ਵੇਰੀਏਬਲ / ID</th>
        <th style="width: 35%;">ਪੋਰਟਲ ਵਿੱਚ ਸਥਾਨ</th>
        <th style="width: 40%;">ਸਿਸਟਮ ਵਿੱਚ ਕੰਮ (Role in Code)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>RAZORPAY_KEY_ID</strong></td>
        <td>Settings -> API Keys ਪੈਨਲ ਵਿੱਚ। ਟੈਸਟ ਮੋਡ ਵਿੱਚ rzp_test_... ਅਤੇ ਲਾਈਵ ਵਿੱਚ rzp_live_...</td>
        <td>ਇਹ ਜਨਤਕ ਕੁੰਜੀ ਹੈ ਜੋ ਮੋਬਾਈਲ ਐਪ ਅਤੇ ਵੈੱਬ ਕਾਰਟ ਵਿੱਚ ਭੁਗਤਾਨ ਵਿੰਡੋ (Checkout Modal) ਖੋਲ੍ਹਦੀ ਹੈ।</td>
      </tr>
      <tr>
        <td><strong>RAZORPAY_KEY_SECRET</strong></td>
        <td>Key ID ਜਨਰੇਟ ਕਰਨ ਸਮੇਂ ਦਿਖਾਈ ਦੇਣ ਵਾਲੀ ਗੁਪਤ ਕੁੰਜੀ।</td>
        <td>ਬੈਕਐਂਡ ਸਰਵਰ 'ਤੇ ਸੁਰੱਖਿਅਤ ਰਹਿੰਦੀ ਹੈ। ਆਰਡਰ ਬਣਾਉਣ ਅਤੇ ਭੁਗਤਾਨ ਦੀ ਪੁਸ਼ਟੀ ਕਰਨ ਲਈ ਵਰਤੀ ਜਾਂਦੀ ਹੈ।</td>
      </tr>
      <tr>
        <td><strong>RAZORPAY_WEBHOOK_SECRET</strong></td>
        <td>Settings -> Webhooks -> 'Add New Webhook' ਵਿੱਚ ਆਪਣੀ ਮਰਜ਼ੀ ਦਾ ਪਾਸਵਰਡ ਭਰੋ।</td>
        <td>ਜਦੋਂ ਕਿਸਾਨ UPI ਰਾਹੀਂ ਪੈਸੇ ਭੇਜਦਾ ਹੈ ਤਾਂ ਰੇਜ਼ਰਪੇਅ ਦਾ ਸਰਵਰ ਇਸ ਕੁੰਜੀ ਰਾਹੀਂ ਸਾਡੇ ਬੈਕਐਂਡ ਨੂੰ ਸੂਚਿਤ ਕਰਦਾ ਹੈ।</td>
      </tr>
    </tbody>
  </table>

  <h3 class="sub-title" style="color: #064e3b;">5. OpenWeatherMap (ਮੌਸਮ ਭਵਿੱਖਬਾਣੀ ਏਪੀਆਈ)</h3>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 25%;">ਕੋਡ ਵੇਰੀਏਬਲ / ID</th>
        <th style="width: 35%;">ਪੋਰਟਲ ਵਿੱਚ ਸਥਾਨ</th>
        <th style="width: 40%;">ਸਿਸਟਮ ਵਿੱਚ ਕੰਮ (Role in Code)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>OPENWEATHER_API_KEY</strong></td>
        <td>home.openweathermap.org -> 'My API keys' ਪੈਨਲ ਵਿੱਚੋਂ 32-ਅੰਕੀ ਕੁੰਜੀ।</td>
        <td>ਕਿਸਾਨ ਦੇ ਖੇਤ ਦੇ ਲੈਟੀਚਿਊਡ (Lat) ਅਤੇ ਲੌਂਗੀਚਿਊਡ (Lon) ਭੇਜ ਕੇ ਮੀਂਹ ਅਤੇ ਹਵਾ ਦਾ ਲਾਈਵ ਡਾਟਾ ਲਿਆਉਣਾ।</td>
      </tr>
      <tr>
        <td><strong>API Endpoint</strong></td>
        <td>One Call API 3.0 ਦਾ ਅਧਿਕਾਰਤ ਯੂਆਰਐਲ।</td>
        <td>https://api.openweathermap.org/data/3.0/onecall</td>
      </tr>
    </tbody>
  </table>
`;

const page3Html = `
  <h2 class="sec-title">
    <span>3. ਕਲਾਉਡ ਸਟੋਰੇਜ, ਫਾਇਰਬੇਸ ਅਤੇ ਮਾਸਟਰ ਇਨਵਾਇਰਨਮੈਂਟ ਫਾਈਲ</span>
    <span class="badge badge-dark">Setup Guide: Part 3</span>
  </h2>

  <h3 class="sub-title" style="color: #065f46;">6. Cloudflare R2 Object Storage (ਅਸੀਮਤ ਫੋਟੋ ਸਟੋਰੇਜ)</h3>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 25%;">ਕੋਡ ਵੇਰੀਏਬਲ / ID</th>
        <th style="width: 35%;">ਕਲਾਉਡਫਲੇਅਰ ਡੈਸ਼ਬੋਰਡ ਵਿੱਚ ਸਥਾਨ</th>
        <th style="width: 40%;">ਸਿਸਟਮ ਵਿੱਚ ਕੰਮ (Role in Code)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>R2_ACCOUNT_ID</strong></td>
        <td>dash.cloudflare.com -> R2 ਓਵਰਵਿਊ ਪੇਜ 'ਤੇ ਸੱਜੇ ਹੱਥ 'Account ID'।</td>
        <td>ਫਾਰਮਸਕਿੰਗ ਦੇ ਕਲਾਉਡਫਲੇਅਰ ਅਕਾਊਂਟ ਦਾ ਮੁੱਖ ਲਿੰਕ।</td>
      </tr>
      <tr>
        <td><strong>R2_ACCESS_KEY_ID</strong></td>
        <td>R2 -> 'Manage R2 API Tokens' -> 'Create Token' ਤੋਂ ਪ੍ਰਾਪਤ ਆਈਡੀ।</td>
        <td>AWS S3-ਕੰਪੈਟੀਬਲ API ਰਾਹੀਂ ਸਰਵਰ ਨੂੰ ਫਾਈਲਾਂ ਅਪਲੋਡ ਕਰਨ ਦੀ ਇਜਾਜ਼ਤ ਦਿੰਦਾ ਹੈ।</td>
      </tr>
      <tr>
        <td><strong>R2_SECRET_ACCESS_KEY</strong></td>
        <td>ਟੋਕਨ ਬਣਾਉਣ ਵੇਲੇ ਸਕ੍ਰੀਨ 'ਤੇ ਦਿਸਣ ਵਾਲੀ ਗੁਪਤ ਕੁੰਜੀ।</td>
        <td>ਸਰਵਰ ਦੀ ਸੁਰੱਖਿਆ ਕੁੰਜੀ। ਇਸਨੂੰ ਕਦੇ ਵੀ ਪਬਲਿਕ ਨਹੀਂ ਕੀਤਾ ਜਾਂਦਾ।</td>
      </tr>
      <tr>
        <td><strong>R2_BUCKET_NAME</strong></td>
        <td>R2 ਡੈਸ਼ਬੋਰਡ ਵਿੱਚ ਬਣਾਈ ਗਈ ਬਾਲਟੀ ਦਾ ਨਾਮ (ਜਿਵੇਂ farmsking-prod-media)।</td>
        <td>ਫ਼ਸਲਾਂ ਦੀਆਂ ਫੋਟੋਆਂ, ਡਾਕਟਰਾਂ ਦੀਆਂ ਪਰਚੀਆਂ ਅਤੇ ਬਿੱਲਾਂ ਦੀਆਂ ਪੀਡੀਐਫ ਸਟੋਰ ਕਰਨ ਦੀ ਥਾਂ।</td>
      </tr>
      <tr>
        <td><strong>R2_PUBLIC_DOMAIN</strong></td>
        <td>Bucket Settings -> 'Custom Domains' (ਜਿਵੇਂ cdn.farmsking.in)।</td>
        <td>ਫੋਟੋਆਂ ਨੂੰ ਬਿਨਾਂ ਕਿਸੇ ਖਰਚੇ ਦੇ ਤੇਜ਼ ਰਫ਼ਤਾਰ ਨਾਲ ਯੂਜ਼ਰ ਦੇ ਮੋਬਾਈਲ 'ਤੇ ਦਿਖਾਉਣ ਲਈ ਲਿੰਕ।</td>
      </tr>
    </tbody>
  </table>

  <h3 class="sub-title" style="color: #1e40af;">7. Firebase Push Notifications (ਮੋਬਾਈਲ ਨੋਟੀਫਿਕੇਸ਼ਨ)</h3>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 25%;">ਕੋਡ ਵੇਰੀਏਬਲ / ID</th>
        <th style="width: 35%;">ਫਾਇਰਬੇਸ ਕੰਸੋਲ ਵਿੱਚ ਸਥਾਨ</th>
        <th style="width: 40%;">ਸਿਸਟਮ ਵਿੱਚ ਕੰਮ (Role in Code)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>google-services.json</strong></td>
        <td>console.firebase.google.com -> Project Settings -> General -> Android App.</td>
        <td>ਇਹ ਫਾਈਲ ਮੋਬਾਈਲ ਐਪ ਦੇ ਐਂਡਰਾਇਡ ਫੋਲਡਰ ਵਿੱਚ ਰੱਖੀ ਜਾਂਦੀ ਹੈ ਤਾਂ ਜੋ ਫੋਨ 'ਤੇ ਸੂਚਨਾਵਾਂ ਆ ਸਕਣ।</td>
      </tr>
      <tr>
        <td><strong>serviceAccountKey.json</strong></td>
        <td>Project Settings -> Service Accounts -> 'Generate new private key'।</td>
        <td>ਬੈਕਐਂਡ ਸਰਵਰ ਵਿੱਚ ਰੱਖੀ ਜਾਂਦੀ ਹੈ ਤਾਂ ਜੋ ਸਰਵਰ ਕਿਸਾਨ ਦੇ ਫੋਨ 'ਤੇ ਪੁਸ਼ ਨੋਟੀਫਿਕੇਸ਼ਨ ਭੇਜ ਸਕੇ।</td>
      </tr>
    </tbody>
  </table>

  <h3 class="sub-title" style="color: #991b1b;">ਮਾਸਟਰ ਸਰਵਰ ਕੌਂਫਿਗਰੇਸ਼ਨ ਟੈਮਪਲੇਟ (.env Master Template)</h3>
  <div class="info-box highlight" style="font-family: monospace; font-size: 7.5pt; line-height: 1.35; background: #0f172a; color: #38bdf8; border-color: #334155;">
    # ===== FARMSKING PRODUCTION ENVIRONMENT CONFIGURATION =====<br>
    PORT=3000<br>
    DATABASE_URL="postgresql://farmsking_user:PASSWORD@localhost:5432/farmsking_db?schema=public"<br>
    JWT_SECRET="FK_SECURE_JWT_TOKEN_SECRET_KEY_2026_PROD"<br>
    # --- External Tool APIs ---<br>
    GEMINI_API_KEY="AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXX"<br>
    FAST2SMS_API_KEY="XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"<br>
    WHATSAPP_ACCESS_TOKEN="EAAGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"<br>
    WHATSAPP_PHONE_NUMBER_ID="109876543210987"<br>
    WHATSAPP_BUSINESS_ACCOUNT_ID="987654321098765"<br>
    RAZORPAY_KEY_ID="rzp_live_XXXXXXXXXXXXXX"<br>
    RAZORPAY_KEY_SECRET="XXXXXXXXXXXXXXXXXXXXXXXX"<br>
    OPENWEATHER_API_KEY="XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"<br>
    R2_ACCOUNT_ID="XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"<br>
    R2_ACCESS_KEY_ID="XXXXXXXXXXXXXXXXXXXXXXXX"<br>
    R2_SECRET_ACCESS_KEY="XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
  </div>
`;

const page4Html = `
  <h2 class="sec-title">
    <span>4. ਕੁੰਜੀਆਂ ਦੀ ਸੁਰੱਖਿਆ, ਸਰਵੋਤਮ ਫੀਚਰ ਅਤੇ ਭਵਿੱਖੀ ਵਿਸਥਾਰ</span>
    <span class="badge badge-dark">Executive Sign-Off</span>
  </h2>

  <div class="grid-2">
    <div class="info-box highlight">
      <h4>ਆਈਐਸਓ 27001 ਕੁੰਜੀ ਸੁਰੱਖਿਆ ਪ੍ਰੋਟੋਕੋਲ (Key Security Standard)</h4>
      <p>ਕਿਸੇ ਵੀ ਬਾਹਰੀ API ਦੀ ਕੁੰਜੀ ਨੂੰ ਕਦੇ ਵੀ ਗਿੱਟ (Git) ਜਾਂ ਪਬਲਿਕ ਕੋਡ ਵਿੱਚ ਕਮਿਟ ਨਹੀਂ ਕੀਤਾ ਜਾਂਦਾ। ਸਾਰੀਆਂ ਕੁੰਜੀਆਂ ਸਰਵਰ ਦੀ ਗੁਪਤ ਫਾਈਲ (.env) ਵਿੱਚ ਬੰਦ ਰਹਿੰਦੀਆਂ ਹਨ। ਇਸ ਤੋਂ ਇਲਾਵਾ ਗੂਗਲ ਅਤੇ ਰੇਜ਼ਰਪੇਅ ਡੈਸ਼ਬੋਰਡ ਵਿੱਚ IP ਰਿਸਟ੍ਰਿਕਸ਼ਨ ਅਤੇ HTTP Referrer ਲੌਕ ਲਗਾਇਆ ਗਿਆ ਹੈ ਤਾਂ ਜੋ ਕੋਈ ਵੀ ਬਾਹਰੋਂ ਕੁੰਜੀ ਚੋਰੀ ਨਾ ਕਰ ਸਕੇ।</p>
    </div>
    <div class="info-box blue">
      <h4>ਆਟੋਮੈਟਿਕ ਫਾਲਬੈਕ ਸਿਸਟਮ (Graceful Fallback Resilience)</h4>
      <p>ਜੇਕਰ ਇੰਟਰਨੈੱਟ ਜਾਂ ਬੈਂਕ ਦੀ ਖਰਾਬੀ ਕਾਰਨ ਕੋਈ ਇੱਕ ਗੇਟਵੇਅ ਅਸਥਾਈ ਤੌਰ 'ਤੇ ਹੌਲੀ ਹੁੰਦਾ ਹੈ, ਤਾਂ ਸਾਡਾ ਬੈਕਐਂਡ ਸਿਸਟਮ ਕਰੈਸ਼ ਹੋਣ ਦੀ ਬਜਾਏ ਤੁਰੰਤ ਸੁਰੱਖਿਅਤ ਫਾਲਬੈਕ ਮੋਡ ਵਿੱਚ ਚਲਾ ਜਾਂਦਾ ਹੈ ਅਤੇ ਐਡਮਿਨ ਨੂੰ ਚੇਤਾਵਨੀ ਲੌਗ ਭੇਜ ਦਿੰਦਾ ਹੈ।</p>
    </div>
  </div>

  <div class="eval-container">
    <div class="eval-box-top">
      <h4>ਇਸ ਪ੍ਰਣਾਲੀ ਦੇ ਮੌਜੂਦਾ ਸਰਵੋਤਮ ਫੀਚਰ (Outstanding Current Features):</h4>
      <ul class="eval-list">
        <li><strong>ਸੰਪੂਰਨ ਏਕੀਕ੍ਰਿਤ .env ਆਰਕੀਟੈਕਚਰ:</strong> ਸਾਰੀਆਂ 8 ਕੰਪਨੀਆਂ ਦੇ APIs ਇੱਕੋ ਥਾਂ ਬਹੁਤ ਹੀ ਸੁਚੱਜੇ ਢੰਗ ਨਾਲ ਪ੍ਰਬੰਧਿਤ ਹਨ।</li>
        <li><strong>ਵੈੱਬਹੁੱਕ ਸਿਗਨੇਚਰ ਵੈਰੀਫਿਕੇਸ਼ਨ:</strong> ਰੇਜ਼ਰਪੇਅ ਅਤੇ ਮੈਟਾ ਵਟਸਐਪ ਦੇ ਹਰੇਕ ਮੈਸੇਜ ਦਾ ਕ੍ਰਿਪਟੋਗ੍ਰਾਫਿਕ HMAC SHA256 ਸਿਗਨੇਚਰ ਚੈੱਕ ਕੀਤਾ ਜਾਂਦਾ ਹੈ ਤਾਂ ਜੋ ਕੋਈ ਫਰਜ਼ੀ ਰਿਕਵੈਸਟ ਨਾ ਭੇਜ ਸਕੇ।</li>
        <li><strong>ਡਿਵੈਲਪਮੈਂਟ ਮੌਕ ਫਾਲਬੈਕ (Mock Dev Mode):</strong> ਇੰਟਰਨੈੱਟ ਤੋਂ ਬਿਨਾਂ ਜਾਂ ਲੋਕਲ ਲੈਪਟਾਪ ਟੈਸਟਿੰਗ ਸਮੇਂ ਸਿਸਟਮ ਆਟੋਮੈਟਿਕ ਮੌਕ ਓਟੀਪੀ ਮੋਡ ਚਲਾ ਲੈਂਦਾ ਹੈ, ਜਿਸ ਨਾਲ ਡਿਵੈਲਪਰ ਦਾ ਕੰਮ ਕਦੇ ਨਹੀਂ ਰੁਕਦਾ।</li>
        <li><strong>ਸਿਸਟਮ ਯੂਜ਼ਰ ਪਰਮਾਨੈਂਟ ਟੋਕਨ:</strong> ਮੈਟਾ ਵਟਸਐਪ ਦਾ ਟੋਕਨ ਕਦੇ ਐਕਸਪਾਇਰ ਨਹੀਂ ਹੁੰਦਾ, ਜਿਸ ਨਾਲ ਮੈਸੇਜਿੰਗ ਸੇਵਾ 24 ਘੰਟੇ ਬਿਨਾਂ ਰੁਕਾਵਟ ਚੱਲਦੀ ਰਹਿੰਦੀ ਹੈ।</li>
      </ul>
    </div>

    <div class="eval-box-future">
      <h4>ਭਵਿੱਖ ਵਿੱਚ ਹੋਰ ਸ਼ਾਮਲ ਕੀਤੇ ਜਾਣ ਵਾਲੇ ਸੁਪਰ-ਐਡਵਾਂਸਡ ਫੀਚਰ (High-Value Features to Add in Future):</h4>
      <ul class="eval-list">
        <li><strong>ਕਲਾਉਡ ਵਾਲਟ (HashiCorp Vault / AWS Secrets Manager):</strong> ਸਾਰੀਆਂ API ਕੁੰਜੀਆਂ ਨੂੰ ਹਰ 90 ਦਿਨਾਂ ਬਾਅਦ ਆਟੋਮੈਟਿਕ ਬਦਲਣ (Rotate) ਵਾਲਾ ਸੁਰੱਖਿਆ ਸਿਸਟਮ।</li>
        <li><strong>ਏਆਈ ਕੋਟਾ ਆਟੋ-ਸਕੇਲਿੰਗ:</strong> ਜੇਕਰ ਜੈਮਿਨੀ ਏਪੀਆਈ 'ਤੇ ਟ੍ਰੈਫਿਕ ਅਚਾਨਕ 10 ਗੁਣਾ ਵਧ ਜਾਵੇ ਤਾਂ ਬੈਕਅੱਪ ਕਲਾਉਡ ਏਆਈ ਮਾਡਲ 'ਤੇ ਆਟੋ-ਸਵਿੱਚ ਹੋਣਾ।</li>
        <li><strong>ਮਲਟੀ-ਐਸਐਮਐਸ ਲੋਡ ਬੈਲੇਂਸਰ:</strong> ਜੇਕਰ Fast2SMS ਸਰਵਰ ਹੌਲੀ ਹੋਵੇ ਤਾਂ ਤੁਰੰਤ ਦੂਜੇ ਐਸਐਮਐਸ ਗੇਟਵੇਅ ਰਾਹੀਂ ਓਟੀਪੀ ਰੂਟ ਕਰਨਾ।</li>
        <li><strong>ਬਿਲਿੰਗ ਥ੍ਰੈਸ਼ਹੋਲਡ ਅਲਰਟ:</strong> ਜੇਕਰ ਕਿਸੇ ਵੀ ਬਾਹਰੀ ਟੂਲ ਦਾ ਖਰਚਾ ਨਿਰਧਾਰਤ ਮਾਸਿਕ ਬਜਟ ਤੋਂ ਵਧਣ ਲੱਗੇ ਤਾਂ ਐਡਮਿਨ ਨੂੰ ਤੁਰੰਤ ਫੋਨ ਕਾਲ ਅਲਰਟ ਜਾਣਾ।</li>
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
  '04_FarmsKing_External_APIs_Credentials_Setup_Punjabi_A4.pdf',
  'ਬਾਹਰੀ ਟੂਲਜ਼ ਸੈੱਟਅੱਪ ਤੇ API ਕੁੰਜੀਆਂ ਦੀ ਗਾਈਡ',
  [
    { sub: 'WhatsApp & SMS ਅਕਾਊਂਟ ਤੇ IDs (Setup Guide: Part 1)', html: page1Html },
    { sub: 'AI, Razorpay ਤੇ ਮੌਸਮ APIs (Setup Guide: Part 2)', html: page2Html },
    { sub: 'ਕਲਾਉਡ ਸਟੋਰੇਜ ਤੇ .env ਟੈਮਪਲੇਟ (Setup Guide: Part 3)', html: page3Html },
    { sub: 'ਕੁੰਜੀ ਸੁਰੱਖਿਆ, ਸਰਵੋਤਮ ਫੀਚਰ ਅਤੇ ਭਵਿੱਖੀ ਵਿਸਥਾਰ (Security & Roadmap)', html: page4Html },
  ]
);

