/**
 * PDF 2: Platform Modules Architecture, Operational Guide & How to Use
 * FarmsKing Technologies Private Limited
 */

const { renderA4Pdf } = require('./pdf_common');

const page1Html = `
  <h2 class="sec-title">
    <span>1. ਪ੍ਰੋਜੈਕਟ ਦੇ ਮੂਲ ਸਿਸਟਮ ਮੌਡਿਊਲ (Core Platform Modules)</span>
    <span class="badge badge-dark">Modules 1 to 4</span>
  </h2>
  
  <p>
    ਫਾਰਮਸਕਿੰਗ ਪਲੇਟਫਾਰਮ 55 ਤੋਂ ਵੱਧ ਆਧੁਨਿਕ ਮਾਈਕ੍ਰੋ-ਮੌਡਿਊਲਾਂ 'ਤੇ ਆਧਾਰਿਤ ਹੈ ਜੋ ਨੇਸਟਜੇਐਸ (NestJS), ਪ੍ਰਿਜ਼ਮਾ ਓਆਰਐਮ (Prisma ORM), ਪੋਸਟਗਰੇਸਕਿਊਐਲ (PostgreSQL), ਅਤੇ ਰੀਐਕਟ ਨੇਟਿਵ ਵੈੱਬ (React Native Web) ਨਾਲ ਤਿਆਰ ਕੀਤੇ ਗਏ ਹਨ। ਹੇਠਾਂ ਪ੍ਰਮੁੱਖ ਮੌਡਿਊਲ, ਉਹਨਾਂ ਦੀ ਵਰਤੋਂ ਵਿਧੀ ਅਤੇ ਕਾਰਜ ਪ੍ਰਣਾਲੀ ਵਿਸਥਾਰ ਨਾਲ ਦਿੱਤੀ ਗਈ ਹੈ:
  </p>

  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 20%;">ਮੌਡਿਊਲ ਦਾ ਨਾਮ</th>
        <th style="width: 38%;">ਮੌਡਿਊਲ ਦਾ ਕੰਮ (Technical Function)</th>
        <th style="width: 42%;">ਕਿਵੇਂ ਵਰਤਣਾ ਹੈ? (Step-by-Step Usage Guide)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>1. Auth & Identity Security</strong><br><span class="badge badge-green">ਸੁਰੱਖਿਅਤ ਲੌਗਇਨ</span></td>
        <td>ਮੋਬਾਈਲ OTP ਵੈਰੀਫਿਕੇਸ਼ਨ, ਯੂਨੀਕ ਕਿੰਗ ਆਈਡੀ (King ID) ਨਿਰਮਾਣ, JWT ਟੋਕਨ ਪ੍ਰਬੰਧਨ, ਪਾਸਵਰਡ-ਲੈੱਸ ਲੌਗਇਨ, ਰੋਲ-ਬੇਸਡ ਐਕਸੈਸ ਕੰਟਰੋਲ (RBAC) ਅਤੇ ਐਡਮਿਨ ਸਟੈੱਪ-ਅੱਪ 2FA ਸੁਰੱਖਿਆ।</td>
        <td>1. ਐਪ ਖੋਲ੍ਹ ਕੇ ਆਪਣਾ 10-ਅੰਕੀ ਮੋਬਾਈਲ ਨੰਬਰ ਭਰੋ।<br>2. ਪ੍ਰਾਪਤ ਹੋਇਆ 6-ਅੰਕੀ ਸਰਵਰ OTP ਦਰਜ ਕਰੋ।<br>3. ਸਿਸਟਮ ਤੁਰੰਤ ਤੁਹਾਡਾ ਪੱਕਾ ਕਿੰਗ ਆਈਡੀ (ਜਿਵੇਂ FK-XXXXXX) ਜਾਰੀ ਕਰੇਗਾ।<br>4. ਆਪਣਾ ਰੋਲ ਚੁਣ ਕੇ ਸੁਰੱਖਿਅਤ ਡੈਸ਼ਬੋਰਡ ਵਿੱਚ ਦਾਖਲ ਹੋਵੋ।</td>
      </tr>
      <tr>
        <td><strong>2. Farm, Plot & Geo-Mapping</strong><br><span class="badge badge-green">ਖੇਤ ਤੇ ਪਲਾਟ ਪ੍ਰਬੰਧਨ</span></td>
        <td>ਖੇਤਾਂ ਦੀ ਹੱਦਬੰਦੀ (Boundary GPS coordinates), ਪਲਾਟਾਂ ਦਾ ਵੰਡ-ਵੰਡਾਇਆ, ਮਿੱਟੀ ਦੀ ਕਿਸਮ, ਸਿੰਚਾਈ ਸਾਧਨ (ਟਿਊਬਵੈੱਲ/ਨਹਿਰੀ), ਅਤੇ ਬੀਜੀ ਗਈ ਫ਼ਸਲ ਦੀ ਕਿਸਮ ਦਰਜ ਕਰਨਾ।</td>
        <td>1. 'My Farms' ਟੈਬ 'ਤੇ ਕਲਿੱਕ ਕਰੋ ਅਤੇ 'Add New Farm' ਦਬਾਓ।<br>2. ਖੇਤ ਦਾ ਨਾਮ, ਕੁੱਲ ਏਕੜ ਅਤੇ ਨਕਸ਼ੇ 'ਤੇ ਹੱਦਾਂ ਮਾਰਕ ਕਰੋ।<br>3. ਖੇਤ ਅਧੀਨ ਵੱਖ-ਵੱਖ ਪਲਾਟ (ਜਿਵੇਂ ਪਲਾਟ A: ਕਣਕ, ਪਲਾਟ B: ਸਰ੍ਹੋਂ) ਬਣਾਓ।<br>4. ਬਿਜਾਈ ਦੀ ਮਿਤੀ ਅਤੇ ਬੀਜ ਦਾ ਬ੍ਰਾਂਡ ਦਰਜ ਕਰਕੇ ਸੇਵ ਕਰੋ।</td>
      </tr>
      <tr>
        <td><strong>3. AI Crop Doctor & Vision</strong><br><span class="badge badge-green">ਏਆਈ ਫ਼ਸਲ ਡਾਕਟਰ</span></td>
        <td>ਗੂਗਲ ਜੈਮਿਨੀ ਵਿਜ਼ਨ ਏਆਈ ਅਤੇ ICAR ਪ੍ਰੋਟੋਕੋਲ ਰਾਹੀਂ ਫ਼ਸਲਾਂ ਦੇ ਪੱਤਿਆਂ, ਤਣਿਆਂ ਜਾਂ ਫਲਾਂ ਦੀ ਫੋਟੋ ਸਕੈਨ ਕਰਕੇ ਬਿਮਾਰੀਆਂ, ਉੱਲੀ, ਕੀੜਿਆਂ ਅਤੇ ਪੌਸ਼ਟਿਕ ਘਾਟਾਂ ਦੀ 98% ਸਹੀ ਜਾਂਚ ਕਰਨਾ।</td>
        <td>1. 'Crop Doctor' ਬਟਨ 'ਤੇ ਕਲਿੱਕ ਕਰੋ।<br>2. ਬਿਮਾਰ ਪੌਦੇ ਜਾਂ ਪੱਤੇ ਦੀ ਸਾਫ਼ ਫੋਟੋ ਕੈਮਰੇ ਨਾਲ ਖਿੱਚੋ ਜਾਂ ਗੈਲਰੀ 'ਚੋਂ ਚੁਣੋ।<br>3. ਫ਼ਸਲ ਦੀ ਕਿਸਮ ਚੁਣੋ ਅਤੇ 'Scan Disease' ਦਬਾਓ।<br>4. 3 ਸਕਿੰਟਾਂ ਵਿੱਚ ਰੋਗ ਦਾ ਨਾਮ, ਕਾਰਨ ਅਤੇ ਸਹੀ ਦਵਾਈ ਦੀ ਰਿਪੋਰਟ ਪ੍ਰਾਪਤ ਕਰੋ।</td>
      </tr>
      <tr>
        <td><strong>4. Live Mandi & Price Telemetry</strong><br><span class="badge badge-blue">ਲਾਈਵ ਮੰਡੀ ਭਾਅ</span></td>
        <td>ਪੰਜਾਬ, ਹਰਿਆਣਾ ਅਤੇ ਦੇਸ਼ ਭਰ ਦੀਆਂ 500+ ਸਰਕਾਰੀ ਅਨਾਜ ਮੰਡੀਆਂ ਦੇ ਰੋਜ਼ਾਨਾ ਘੱਟੋ-ਘੱਟ, ਵੱਧ ਤੋਂ ਵੱਧ ਅਤੇ ਔਸਤ ਭਾਅ (MSP ਅਤੇ ਨਿੱਜੀ ਰੇਟ) ਲਾਈਵ ਦਰਸਾਉਣਾ।</td>
        <td>1. 'Live Mandi' ਮੌਡਿਊਲ ਖੋਲ੍ਹੋ।<br>2. ਆਪਣਾ ਰਾਜ, ਜ਼ਿਲ੍ਹਾ ਜਾਂ ਮੰਡੀ (ਜਿਵੇਂ ਖਡੂਰ ਸਾਹਿਬ, ਖੰਨਾ, ਤਰਨ ਤਾਰਨ) ਚੁਣੋ।<br>3. ਫ਼ਸਲ (ਕਣਕ, ਝੋਨਾ, ਬਾਸਮਤੀ, ਕਪਾਹ) ਚੁਣ ਕੇ ਲਾਈਵ ਰੇਟ ਵੇਖੋ।<br>4. ਰੇਟ ਅਲਰਟ ਲਗਾਓ ਤਾਂ ਜੋ ਭਾਅ ਵਧਣ 'ਤੇ ਵਟਸਐਪ 'ਤੇ ਮੈਸੇਜ ਆਵੇ।</td>
      </tr>
    </tbody>
  </table>

  <div class="info-box highlight">
    <h4>ਮੌਡਿਊਲਾਂ ਦਾ ਆਪਸੀ ਤਾਲਮੇਲ (Real-time Cross-Module Integration)</h4>
    <p>ਸਾਰੇ ਮੌਡਿਊਲ ਇੱਕ-ਦੂਜੇ ਨਾਲ ਸਿੱਧੇ ਜੁੜੇ ਹੋਏ ਹਨ। ਜਦੋਂ ਏਆਈ ਫ਼ਸਲ ਡਾਕਟਰ ਕੋਈ ਬਿਮਾਰੀ ਲੱਭਦਾ ਹੈ, ਤਾਂ ਉਹ ਆਪਣੇ ਆਪ ਉਸ ਫ਼ਸਲ ਦੇ ਪਲਾਟ ਨਾਲ ਜੁੜ ਜਾਂਦਾ ਹੈ ਅਤੇ ਉਸ ਲਈ ਲੋੜੀਂਦੀ ਦਵਾਈ ਸਟੋਰ ਮੌਡਿਊਲ ਵਿੱਚੋਂ ਇੱਕ ਕਲਿੱਕ 'ਤੇ ਆਰਡਰ ਕੀਤੀ ਜਾ ਸਕਦੀ ਹੈ।</p>
  </div>
`;

const page2Html = `
  <h2 class="sec-title">
    <span>2. ਵਪਾਰਕ ਅਤੇ ਤਕਨੀਕੀ ਮੌਡਿਊਲ (Commercial & Agronomy Modules)</span>
    <span class="badge badge-dark">Modules 5 to 8</span>
  </h2>

  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 20%;">ਮੌਡਿਊਲ ਦਾ ਨਾਮ</th>
        <th style="width: 38%;">ਮੌਡਿਊਲ ਦਾ ਕੰਮ (Technical Function)</th>
        <th style="width: 42%;">ਕਿਵੇਂ ਵਰਤਣਾ ਹੈ? (Step-by-Step Usage Guide)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>5. Agri Store & E-Commerce</strong><br><span class="badge badge-green">ਖੇਤੀਬਾੜੀ ਸਟੋਰ</span></td>
        <td>ਪ੍ਰਮਾਣਿਤ ਖਾਦਾਂ, ਕੀਟਨਾਸ਼ਕਾਂ, ਉੱਚ ਗੁਣਵੱਤਾ ਵਾਲੇ ਬੀਜਾਂ ਅਤੇ ਸੰਦਾਂ ਦੀ ਔਨਲਾਈਨ ਵਿਕਰੀ, ਕਾਰਟ, ਕੂਪਨ ਡਿਸਕਾਊਂਟ, ਰੇਜ਼ਰਪੇਅ UPI ਭੁਗਤਾਨ, ਅਤੇ ਪੱਕਾ A4 ਜੀਐਸਟੀ ਬਿੱਲ ਜਨਰੇਸ਼ਨ।</td>
        <td>1. 'Store' ਮੌਡਿਊਲ ਵਿੱਚ ਉਤਪਾਦ ਬ੍ਰਾਊਜ਼ ਕਰੋ ਜਾਂ ਦਵਾਈ ਦਾ ਨਾਮ ਸਰਚ ਕਰੋ।<br>2. ਮਾਤਰਾ ਚੁਣ ਕੇ 'Add to Cart' ਦਬਾਓ।<br>3. ਆਪਣਾ ਡਿਲੀਵਰੀ ਪਤਾ ਚੁਣੋ ਅਤੇ UPI ਜਾਂ COD ਰਾਹੀਂ ਆਰਡਰ ਪੱਕਾ ਕਰੋ।<br>4. ਆਪਣੇ ਆਰਡਰ ਦਾ ਲਾਈਵ ਸਟੇਟਸ ਦੇਖੋ ਅਤੇ ਟੈਕਸ ਬਿੱਲ ਡਾਊਨਲੋਡ ਕਰੋ।</td>
      </tr>
      <tr>
        <td><strong>6. Weather & Satellite Telemetry</strong><br><span class="badge badge-blue">ਮੌਸਮ ਤੇ ਸੈਟੇਲਾਈਟ</span></td>
        <td>ਭਾਰਤੀ ਮੌਸਮ ਵਿਭਾਗ (IMD) ਅਤੇ ਓਪਨਵੈਦਰ API ਰਾਹੀਂ ਅਗਲੇ 7 ਦਿਨਾਂ ਦਾ ਮੌਸਮ, ਮੀਂਹ ਦੀ ਸੰਭਾਵਨਾ, ਤਾਪਮਾਨ, ਹਵਾ ਦੀ ਰਫ਼ਤਾਰ ਅਤੇ ਸੈਟੇਲਾਈਟ NDVI ਫ਼ਸਲ ਹਰਿਆਵਲ ਸੂਚਕਾਂਕ।</td>
        <td>1. ਹੋਮ ਸਕ੍ਰੀਨ 'ਤੇ 'Weather Forecast' ਵਿਜੇਟ ਦੇਖੋ।<br>2. ਸਪਰੇਅ ਕਰਨ ਤੋਂ ਪਹਿਲਾਂ 'Spray Suitability Index' ਚੈੱਕ ਕਰੋ ਤਾਂ ਜੋ ਮੀਂਹ 'ਚ ਦਵਾਈ ਖਰਾਬ ਨਾ ਹੋਵੇ।<br>3. ਸੈਟੇਲਾਈਟ ਵਿਊ ਵਿੱਚ ਜਾ ਕੇ ਖੇਤ ਦੇ ਕਮਜ਼ੋਰ ਹਿੱਸਿਆਂ ਦੀ ਹਰਿਆਵਲ ਚੈੱਕ ਕਰੋ।</td>
      </tr>
      <tr>
        <td><strong>7. Soil & Water Lab Testing</strong><br><span class="badge badge-purple">ਲੈਬ ਟੈਸਟਿੰਗ</span></td>
        <td>ਮਿੱਟੀ ਵਿੱਚ ਨਾਈਟ੍ਰੋਜਨ (N), ਫਾਸਫੋਰਸ (P), ਪੋਟਾਸ਼ੀਅਮ (K), ਜੈਵਿਕ ਕਾਰਬਨ (OC), pH ਅਤੇ ਪਾਣੀ ਦੇ ਟੀਡੀਐਸ (TDS)/ਲੂਣੇਪਣ ਦੀ ਜਾਂਚ ਲਈ ਲੈਬ ਸੈਂਪਲ ਬੁੱਕ ਕਰਨਾ ਅਤੇ ਰਿਪੋਰਟ ਦੇਣਾ।</td>
        <td>1. 'Soil Testing' ਟੈਬ 'ਤੇ ਕਲਿੱਕ ਕਰਕੇ 'Book Lab Test' ਚੁਣੋ।<br>2. ਫੀਲਡ ਏਜੰਟ ਤੁਹਾਡੇ ਖੇਤ ਵਿੱਚੋਂ ਮਿੱਟੀ ਦਾ ਸੈਂਪਲ ਲੈਣ ਆਵੇਗਾ।<br>3. ਲੈਬ ਟੈਸਟਿੰਗ ਤੋਂ ਬਾਅਦ ਡਿਜੀਟਲ ਸੋਇਲ ਹੈਲਥ ਕਾਰਡ ਐਪ ਵਿੱਚ ਪ੍ਰਾਪਤ ਹੋਵੇਗਾ।<br>4. ਰਿਪੋਰਟ ਦੇ ਆਧਾਰ 'ਤੇ ਖਾਦਾਂ ਦੀ ਸਹੀ ਮਾਤਰਾ ਜਾਣੋ।</td>
      </tr>
      <tr>
        <td><strong>8. Machinery & Drone Rental</strong><br><span class="badge badge-amber">ਮਸ਼ੀਨਰੀ ਤੇ ਡਰੋਨ</span></td>
        <td>ਕਿਸਾਨਾਂ ਨੂੰ ਮਹਿੰਗੀ ਖੇਤੀ ਮਸ਼ੀਨਰੀ (ਕੰਬਾਈਨ, ਸੁਪਰ ਸੀਡਰ, ਲੇਜ਼ਰ ਲੇਵਲਰ, ਬੇਲਰ) ਅਤੇ ਖੇਤਾਂ ਵਿੱਚ ਨੈਨੋ-ਯੂਰੀਆ/ਕੀਟਨਾਸ਼ਕ ਛਿੜਕਾਅ ਲਈ ਡਰੋਨ ਕਿਰਾਏ 'ਤੇ ਮੁਹੱਈਆ ਕਰਵਾਉਣਾ।</td>
        <td>1. 'Rentals' ਮੌਡਿਊਲ ਵਿੱਚ 'Book Drone Spray' ਜਾਂ 'Machinery' ਚੁਣੋ।<br>2. ਖੇਤ ਦਾ ਪਲਾਟ, ਏਕੜ ਅਤੇ ਪਸੰਦੀਦਾ ਮਿਤੀ/ਸਮਾਂ ਦਰਜ ਕਰੋ।<br>3. ਨੇੜਲੇ ਪ੍ਰਮਾਣਿਤ ਆਪਰੇਟਰ ਨਾਲ ਸੰਪਰਕ ਕਰੋ ਅਤੇ ਬੁਕਿੰਗ ਕਨਫਰਮ ਕਰੋ।<br>4. ਸੇਵਾ ਪੂਰੀ ਹੋਣ 'ਤੇ ਡਿਜੀਟਲ ਭੁਗਤਾਨ ਕਰੋ।</td>
      </tr>
    </tbody>
  </table>

  <div class="grid-2">
    <div class="info-box highlight">
      <h4>ਸਪਰੇਅ ਸੂਟੇਬਿਲਟੀ ਇੰਡੈਕਸ (Spray Suitability Index)</h4>
      <p>ਸਾਡਾ ਵੈਦਰ ਮੌਡਿਊਲ ਮੌਸਮ, ਹਵਾ ਦੀ ਦਿਸ਼ਾ ਅਤੇ ਨਮੀ ਨੂੰ ਮਿਲਾ ਕੇ ਕਿਸਾਨ ਨੂੰ ਸਾਫ਼ ਦੱਸਦਾ ਹੈ ਕਿ ਅਗਲੇ 4 ਘੰਟਿਆਂ ਵਿੱਚ ਸਪਰੇਅ ਕਰਨੀ ਲਾਭਦਾਇਕ ਹੈ ਜਾਂ ਨਹੀਂ। ਇਸ ਨਾਲ ਕਿਸਾਨਾਂ ਦਾ ਲੱਖਾਂ ਰੁਪਏ ਦਾ ਕੀਟਨਾਸ਼ਕ ਮੀਂਹ ਵਿੱਚ ਧੁਲਣ ਤੋਂ ਬਚ ਜਾਂਦਾ ਹੈ।</p>
    </div>
    <div class="info-box blue">
      <h4>ਡਿਜੀਟਲ ਸੋਇਲ ਹੈਲਥ ਕਾਰਡ (Smart Soil Card)</h4>
      <p>ਲੈਬ ਰਿਪੋਰਟ ਆਉਂਦੇ ਹੀ ਸਿਸਟਮ ਬੇਲੋੜੀ ਖਾਦ ਦੀ ਖਪਤ 'ਤੇ ਰੋਕ ਲਗਾਉਂਦਾ ਹੈ। ਜੇਕਰ ਮਿੱਟੀ ਵਿੱਚ ਪਹਿਲਾਂ ਹੀ ਫਾਸਫੋਰਸ ਵੱਧ ਹੈ, ਤਾਂ ਸਿਸਟਮ ਡੀਏਪੀ ਦੀ ਥਾਂ ਸਿਰਫ ਲੋੜੀਂਦੀ ਖਾਦ ਪਾਉਣ ਦੀ ਸਿਫਾਰਸ਼ ਕਰਦਾ ਹੈ, ਜਿਸ ਨਾਲ ਜ਼ਮੀਨ ਬੰਜਰ ਹੋਣ ਤੋਂ ਬਚਦੀ ਹੈ।</p>
    </div>
  </div>
`;

const page3Html = `
  <h2 class="sec-title">
    <span>3. ਸੰਚਾਲਨ, ਸੂਚਨਾਵਾਂ ਅਤੇ ਗਵਰਨੈਂਸ ਮੌਡਿਊਲ (Governance & Engine Modules)</span>
    <span class="badge badge-dark">Modules 9 to 12</span>
  </h2>

  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 20%;">ਮੌਡਿਊਲ ਦਾ ਨਾਮ</th>
        <th style="width: 38%;">ਮੌਡਿਊਲ ਦਾ ਕੰਮ (Technical Function)</th>
        <th style="width: 42%;">ਕਿਵੇਂ ਵਰਤਣਾ ਹੈ? (Step-by-Step Usage Guide)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>9. Agronomy Task & Spray Log</strong><br><span class="badge badge-green">ਸਪਰੇਅ ਤੇ ਲਾਗਤ ਡਾਇਰੀ</span></td>
        <td>ਬਿਜਾਈ ਤੋਂ ਲੈ ਕੇ ਵਾਢੀ ਤੱਕ ਦੇ ਹਰੇਕ ਕੰਮ ਦਾ ਸ਼ਡਿਊਲ, ਡੀਜ਼ਲ, ਬੀਜ, ਖਾਦਾਂ, ਮਜ਼ਦੂਰੀ ਦੇ ਖਰਚਿਆਂ ਦਾ ਰਿਕਾਰਡ, ਅਤੇ ਫ਼ਸਲ ਵੇਚਣ ਤੋਂ ਬਾਅਦ ਮੁਨਾਫ਼ੇ ਦਾ ਸਵੈ-ਚਾਲਿਤ ਹਿਸਾਬ।</td>
        <td>1. 'Farm Journal' ਵਿੱਚ ਜਾ ਕੇ 'Add Task' ਦਬਾਓ।<br>2. ਅੱਜ ਕੀਤੀ ਗਈ ਸਪਰੇਅ, ਪਾਈ ਗਈ ਖਾਦ ਜਾਂ ਮਜ਼ਦੂਰੀ ਦਾ ਖਰਚਾ ਭਰੋ।<br>3. ਫ਼ਸਲ ਪੱਕਣ 'ਤੇ 'Generate Crop Balance Sheet' ਕਲਿੱਕ ਕਰੋ।<br>4. ਪ੍ਰਤੀ ਏਕੜ ਹੋਏ ਕੁੱਲ ਖਰਚੇ ਅਤੇ ਸ਼ੁੱਧ ਮੁਨਾਫ਼ੇ ਦੀ A4 ਰਿਪੋਰਟ ਡਾਊਨਲੋਡ ਕਰੋ।</td>
      </tr>
      <tr>
        <td><strong>10. Multi-Channel WhatsApp Alert</strong><br><span class="badge badge-green">ਵਟਸਐਪ ਤੇ ਐਸਐਮਐਸ</span></td>
        <td>ਮੈਟਾ ਵਟਸਐਪ ਕਲਾਉਡ API ਅਤੇ Fast2SMS ਰਾਹੀਂ ਕਿਸਾਨਾਂ ਨੂੰ ਤੁਰੰਤ ਆਰਡਰ ਅਪਡੇਟ, ਮੌਸਮ ਚੇਤਾਵਨੀਆਂ, ਮੰਡੀ ਭਾਅ ਅਤੇ ਬਿਮਾਰੀ ਜਾਂਚ ਰਿਪੋਰਟਾਂ ਸਿੱਧੀਆਂ ਵਟਸਐਪ 'ਤੇ ਭੇਜਣਾ।</td>
        <td>1. ਯੂਜ਼ਰ ਨੂੰ ਕਿਸੇ ਵੱਖਰੀ ਸੈਟਿੰਗ ਦੀ ਲੋੜ ਨਹੀਂ, ਇਹ ਸਿਸਟਮ ਬੈਕਐਂਡ ਤੋਂ ਆਟੋਮੈਟਿਕ ਚੱਲਦਾ ਹੈ।<br>2. ਕੋਈ ਵੀ ਆਰਡਰ ਕਰਨ ਜਾਂ ਡਾਕਟਰ ਵੱਲੋਂ ਪਰਚੀ ਜਾਰੀ ਕਰਨ 'ਤੇ ਫਾਰਮਸਕਿੰਗ ਦੇ ਅਧਿਕਾਰਤ ਵਟਸਐਪ ਨੰਬਰ ਤੋਂ ਪੀਡੀਐਫ ਸਹਿਤ ਮੈਸੇਜ ਆਉਂਦਾ ਹੈ।</td>
      </tr>
      <tr>
        <td><strong>11. Unified Admin Governance</strong><br><span class="badge badge-dark">ਐਡਮਿਨ ਆਡਿਟ ਤੇ ਕੰਟਰੋਲ</span></td>
        <td>ਪੂਰੇ ਪਲੇਟਫਾਰਮ ਦੇ ਉਪਭੋਗਤਾਵਾਂ ਦੀ ਪੜਤਾਲ, ਦੁਕਾਨਦਾਰਾਂ ਦੇ ਲਾਇਸੈਂਸ ਵੈਰੀਫਿਕੇਸ਼ਨ, ਵਿੱਤੀ ਲੈਣ-ਦੇਣ ਦੀ ਨਿਗਰਾਨੀ, ਝਗੜਾ ਨਿਵਾਰਣ ਅਤੇ 2FA ਨਾਲ ਸਿਸਟਮ ਸੈਟਿੰਗਾਂ ਕੰਟਰੋਲ ਕਰਨਾ।</td>
        <td>1. ਐਡਮਿਨ ਪੋਰਟਲ (localhost:8082 ਜਾਂ ਲਾਈਵ ਲਿੰਕ) 'ਤੇ ਲੌਗਇਨ ਕਰੋ।<br>2. ਪਾਰਟਨਰ ਐਪਲੀਕੇਸ਼ਨਾਂ ਦੀ ਜਾਂਚ ਕਰਕੇ 'Approve' ਜਾਂ 'Reject' ਕਰੋ।<br>3. ਯੂਜ਼ਰ ਸੈਸ਼ਨ, ਸੇਲਜ਼ ਰਿਪੋਰਟਾਂ ਅਤੇ ਸਰਵਰ ਹੈਲਥ ਦੀ ਰੀਅਲ-ਟਾਈਮ ਨਿਗਰਾਨੀ ਕਰੋ।</td>
      </tr>
      <tr>
        <td><strong>12. Autonomous SEO & AI Indexing</strong><br><span class="badge badge-blue">ਸਰਚ ਇੰਜਣ ਤੇ ਏਆਈ</span></td>
        <td>ਗੂਗਲ, ਬਿੰਗ, ਅਤੇ ਆਧੁਨਿਕ ਏਆਈ ਸਰਚ ਇੰਜਣਾਂ (Perplexity, ChatGPT, Gemini) ਨੂੰ ਫਾਰਮਸਕਿੰਗ ਦੇ ਉਤਪਾਦਾਂ, ਮੰਡੀ ਭਾਅ ਅਤੇ ਖੇਤੀ ਗਿਆਨ ਨਾਲ ਆਟੋਮੈਟਿਕ ਅਪਡੇਟ ਰੱਖਣਾ।</td>
        <td>1. ਬੈਕਐਂਡ ਕ੍ਰੋਨ ਜੌਬ ਹਰ 6 ਘੰਟੇ ਬਾਅਦ ਸਾਈਟਮੈਪ ਅਤੇ llms-full.txt ਅਪਡੇਟ ਕਰਦੀ ਹੈ।<br>2. ਐਡਮਿਨ ਇੱਕ ਕਲਿੱਕ ਨਾਲ 'Trigger Instant SEO Submit' ਦਬਾ ਕੇ ਗੂਗਲ ਇੰਡੈਕਸਿੰਗ API ਨੂੰ ਤੁਰੰਤ ਡਾਟਾ ਭੇਜ ਸਕਦਾ ਹੈ।</td>
      </tr>
    </tbody>
  </table>

  <div class="grid-2">
    <div class="info-box highlight">
      <h4>ਡਿਜੀਟਲ ਕਿਸਾਨ ਬਹੀ-ਖਾਤਾ (Farm Balance Sheet)</h4>
      <p>ਕਿਸਾਨਾਂ ਨੂੰ ਕਾਪੀਆਂ 'ਤੇ ਹਿਸਾਬ ਰੱਖਣ ਦੀ ਲੋੜ ਨਹੀਂ ਪੈਂਦੀ। ਸਾਰੀਆਂ ਸਪਰੇਆਂ ਅਤੇ ਮਜ਼ਦੂਰੀ ਦੇ ਖਰਚੇ ਆਪਣੇ ਆਪ ਫ਼ਸਲ ਦੀ ਬੈਲੇਂਸ ਸ਼ੀਟ ਵਿੱਚ ਜੁੜ ਜਾਂਦੇ ਹਨ, ਜਿਸ ਨਾਲ ਕਿਸਾਨ ਨੂੰ ਪਤਾ ਲੱਗਦਾ ਹੈ ਕਿ ਉਸਨੂੰ ਕਣਕ ਜਾਂ ਝੋਨੇ ਵਿੱਚੋਂ ਪ੍ਰਤੀ ਕਿੱਲਾ ਕਿੰਨੀ ਬੱਚਤ ਹੋਈ ਹੈ।</p>
    </div>
    <div class="info-box amber">
      <h4>ਜ਼ੀਰੋ-ਫਾਲਸ ਨੋਟੀਫਿਕੇਸ਼ਨ ਪਾਲਿਸੀ (Anti-Spam WhatsApp)</h4>
      <p>ਅਸੀਂ ਬੇਲੋੜੇ ਪ੍ਰਮੋਸ਼ਨਲ ਮੈਸੇਜ ਨਹੀਂ ਭੇਜਦੇ। ਸਿਰਫ ਮਹੱਤਵਪੂਰਨ ਸੂਚਨਾਵਾਂ (ਜਿਵੇਂ ਕਿ ਝੱਖੜ/ਮੀਂਹ ਦਾ ਅਲਰਟ, ਡਾਕਟਰ ਦੀ ਪਰਚੀ, ਅਤੇ ਆਰਡਰ ਡਿਲਿਵਰੀ) ਹੀ ਭੇਜੀਆਂ ਜਾਂਦੀਆਂ ਹਨ ਤਾਂ ਜੋ ਕਿਸਾਨਾਂ ਦਾ ਭਰੋਸਾ ਕਾਇਮ ਰਹੇ।</p>
    </div>
  </div>
`;

const page4Html = `
  <h2 class="sec-title">
    <span>4. ਮੌਡਿਊਲ ਸਮੀਖਿਆ, ਸਰਵੋਤਮ ਫੀਚਰ ਅਤੇ ਭਵਿੱਖੀ ਵਿਸਥਾਰ (Review & Roadmap)</span>
    <span class="badge badge-dark">Executive Sign-Off</span>
  </h2>

  <div class="grid-2">
    <div class="info-box highlight">
      <h4>ਮਾਈਕ੍ਰੋ-ਸਰਵਿਸਿਸ ਆਰਕੀਟੈਕਚਰ ਦੀ ਮਜ਼ਬੂਤੀ</h4>
      <p>ਫਾਰਮਸਕਿੰਗ ਦਾ ਹਰੇਕ ਮੌਡਿਊਲ ਸੁਤੰਤਰ (Loosely Coupled) ਹੈ। ਜੇਕਰ ਮੌਸਮ API ਜਾਂ ਕੋਈ ਬਾਹਰੀ ਸਰਵਿਸ ਅਸਥਾਈ ਤੌਰ 'ਤੇ ਡਾਊਨ ਵੀ ਹੋਵੇ, ਤਾਂ ਵੀ ਏਆਈ ਫ਼ਸਲ ਡਾਕਟਰ, ਖੇਤੀ ਸਟੋਰ, ਅਤੇ ਖੇਤ ਮੈਨੇਜਮੈਂਟ ਬਿਨਾਂ ਕਿਸੇ ਰੁਕਾਵਟ ਦੇ 100% ਚੱਲਦੇ ਰਹਿੰਦੇ ਹਨ।</p>
    </div>
    <div class="info-box blue">
      <h4>ਡੇਟਾ ਇਕਸਾਰਤਾ ਅਤੇ ਬੈਕਅੱਪ ਸੁਰੱਖਿਆ</h4>
      <p>ਪ੍ਰਿਜ਼ਮਾ ਓਆਰਐਮ ਅਤੇ ਪੋਸਟਗਰੇਸਕਿਊਐਲ ਰਾਹੀਂ ਹਰੇਕ ਐਂਟਰੀ 'ਤੇ ਆਟੋਮੈਟਿਕ ਟ੍ਰਾਂਜੈਕਸ਼ਨ ਰੋਲਬੈਕ ਗਾਰੰਟੀ ਹੈ। ਇਸ ਤੋਂ ਇਲਾਵਾ ਰੋਜ਼ਾਨਾ ਆਟੋਮੈਟਿਕ ਐਨਕ੍ਰਿਪਟਡ ਬੈਕਅੱਪ ਲਿਆ ਜਾਂਦਾ ਹੈ ਤਾਂ ਜੋ ਕਿਸਾਨਾਂ ਦਾ ਕੀਮਤੀ ਖੇਤੀਬਾੜੀ ਰਿਕਾਰਡ ਹਮੇਸ਼ਾ ਸੁਰੱਖਿਅਤ ਰਹੇ।</p>
    </div>
  </div>

  <div class="eval-container">
    <div class="eval-box-top">
      <h4>ਇਸ ਪ੍ਰਣਾਲੀ ਦੇ ਮੌਜੂਦਾ ਸਰਵੋਤਮ ਫੀਚਰ (Outstanding Current Features):</h4>
      <ul class="eval-list">
        <li><strong>AI Vision + Human Doctor Loop:</strong> ਏਆਈ ਸਕਿੰਟਾਂ ਵਿੱਚ ਰੋਗ ਦੀ ਸ਼ਨਾਖਤ ਕਰਦੀ ਹੈ ਅਤੇ ਉਸ ਤੋਂ ਬਾਅਦ ਮਾਹਰ ਡਾਕਟਰ ਦੀ ਡਿਜੀਟਲ ਮੋਹਰ ਲੱਗਦੀ ਹੈ, ਜਿਸ ਨਾਲ ਕਿਸਾਨ ਨੂੰ ਗਲਤ ਦਵਾਈ ਪੈਣ ਦਾ ਖ਼ਤਰਾ ਜ਼ੀਰੋ ਹੋ ਜਾਂਦਾ ਹੈ।</li>
        <li><strong>ਸਪਰੇਅ ਅਨੁਕੂਲਤਾ ਅਲਰਟ:</strong> ਮੌਸਮ ਅਤੇ ਹਵਾ ਦੀ ਨਿਗਰਾਨੀ ਕਰਕੇ ਕਿਸਾਨ ਨੂੰ ਸਪਰੇਅ ਦਾ ਸਹੀ ਸਮਾਂ ਦੱਸਣਾ।</li>
        <li><strong>ਇੱਕ-ਕਲਿੱਕ ਪ੍ਰਿਸਕ੍ਰਿਪਸ਼ਨ ਆਰਡਰ:</strong> ਡਾਕਟਰ ਵੱਲੋਂ ਲਿਖੀ ਦਵਾਈ ਬਿਨਾਂ ਦੁਕਾਨਾਂ ਦੇ ਧੱਕੇ ਖਾਧੇ ਸਿੱਧੀ ਸਟੋਰ ਕਾਰਟ ਵਿੱਚ ਆ ਜਾਂਦੀ ਹੈ ਅਤੇ ਅਸਲੀ ਬਿੱਲ ਨਾਲ ਘਰ ਪਹੁੰਚਦੀ ਹੈ।</li>
        <li><strong>ਰੀਅਲ-ਟਾਈਮ ਮੰਡੀ ਰੇਟ ਟੈਲੀਮੈਟਰੀ:</strong> ਸਿੱਧੀਆਂ ਸਰਕਾਰੀ ਮੰਡੀਆਂ ਦੇ ਭਾਅ ਮਿਲਣ ਕਾਰਨ ਕਿਸਾਨ ਫ਼ਸਲ ਵੇਚਣ ਸਮੇਂ ਲੁੱਟ ਤੋਂ ਬਚਦਾ ਹੈ।</li>
      </ul>
    </div>

    <div class="eval-box-future">
      <h4>ਭਵਿੱਖ ਵਿੱਚ ਹੋਰ ਸ਼ਾਮਲ ਕੀਤੇ ਜਾਣ ਵਾਲੇ ਸੁਪਰ-ਐਡਵਾਂਸਡ ਫੀਚਰ (High-Value Features to Add in Future):</h4>
      <ul class="eval-list">
        <li><strong>ਆਈਓਟੀ ਸੋਇਲ ਸੈਂਸਰ ਇੰਟੀਗ੍ਰੇਸ਼ਨ (IoT Sensor Telemetry):</strong> ਖੇਤਾਂ ਵਿੱਚ ਲੱਗੇ ਨਮੀ ਅਤੇ ਤਾਪਮਾਨ ਸੈਂਸਰਾਂ ਦਾ ਸਿੱਧਾ ਐਪ ਨਾਲ ਲਿੰਕ, ਤਾਂ ਜੋ ਮੋਟਰ/ਟਿਊਬਵੈੱਲ ਆਪਣੇ ਆਪ ਚੱਲ ਸਕੇ।</li>
        <li><strong>ਡਰੋਨ ਫਲੀਟ ਆਟੋ-ਡਿਸਪੈਚ:</strong> ਕਿਸਾਨ ਵੱਲੋਂ ਬੁੱਕ ਕਰਦੇ ਹੀ ਨੇੜਲੇ ਡਰੋਨ ਪਾਇਲਟ ਨੂੰ ਆਟੋਮੈਟਿਕ ਜੀਪੀਐਸ ਰੂਟ ਅਤੇ ਸਪਰੇਅ ਮੈਪ ਭੇਜਣਾ।</li>
        <li><strong>ਸੈਟੇਲਾਈਟ ਯੀਲਡ ਪ੍ਰੀਡਿਕਟਰ (Satellite Yield Estimation):</strong> ਫ਼ਸਲ ਕੱਟਣ ਤੋਂ 20 ਦਿਨ ਪਹਿਲਾਂ ਸੈਟੇਲਾਈਟ ਰਾਹੀਂ ਝਾੜ (ਕੁਇੰਟਲ ਪ੍ਰਤੀ ਏਕੜ) ਦਾ ਸਹੀ ਅੰਦਾਜ਼ਾ ਲਗਾਉਣਾ।</li>
        <li><strong>ਬਲਾਕਚੈਨ ਜੇ-ਫਾਰਮ ਪ੍ਰਮਾਣੀਕਰਨ:</strong> ਕਿਸਾਨਾਂ ਦੇ ਜੇ-ਫਾਰਮ ਅਤੇ ਵਿਕਰੀ ਬਿੱਲਾਂ ਨੂੰ ਸਰਕਾਰੀ ਬੈਂਕਾਂ ਤੋਂ ਸਸਤਾ ਕਰਜ਼ਾ ਲੈਣ ਲਈ ਬਲਾਕਚੈਨ 'ਤੇ ਵੈਰੀਫਾਈ ਕਰਨਾ।</li>
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
  '02_FarmsKing_Platform_Modules_Usage_Guide_Punjabi_A4.pdf',
  'ਪਲੇਟਫਾਰਮ ਮੌਡਿਊਲ ਅਤੇ ਵਰਤੋਂ ਗਾਈਡ',
  [
    { sub: 'ਮੌਡਿਊਲ 1 ਤੋਂ 4: ਕੋਰ ਸਿਸਟਮ ਮੌਡਿਊਲ (Core Platform Modules)', html: page1Html },
    { sub: 'ਮੌਡਿਊਲ 5 ਤੋਂ 8: ਕਮਰਸ਼ੀਅਲ ਤੇ ਐਗਰੋਨੌਮੀ ਮੌਡਿਊਲ (Commercial Modules)', html: page2Html },
    { sub: 'ਮੌਡਿਊਲ 9 ਤੋਂ 12: ਗਵਰਨੈਂਸ ਤੇ ਐਸਈਓ ਇੰਜਣ (Governance & SEO Modules)', html: page3Html },
    { sub: 'ਮੌਡਿਊਲ ਸਮੀਖਿਆ, ਸਰਵੋਤਮ ਫੀਚਰ ਅਤੇ ਭਵਿੱਖੀ ਵਿਸਥਾਰ (Review & Roadmap)', html: page4Html },
  ]
);
