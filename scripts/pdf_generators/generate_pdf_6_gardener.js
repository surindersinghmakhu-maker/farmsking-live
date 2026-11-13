/**
 * PDF 6: Gardener & Garden Advisor Complete Project & Urban Farming Blueprint
 * FarmsKing Technologies Private Limited
 */

const { renderA4Pdf } = require('./pdf_common');

const page1Html = `
  <h2 class="sec-title">
    <span>1. ਗਾਰਡਨਰ (Gardener) ਲਈ ਘਰੇਲੂ ਬਾਗਬਾਨੀ ਦਾ ਪੂਰਾ ਪ੍ਰੋਜੈਕਟ</span>
    <span class="badge badge-dark">Urban & Kitchen Gardening</span>
  </h2>
  
  <p>
    ਫਾਰਮਸਕਿੰਗ ਪਲੇਟਫਾਰਮ ਸਿਰਫ ਵੱਡੇ ਖੇਤਾਂ ਤੱਕ ਹੀ ਸੀਮਿਤ ਨਹੀਂ ਹੈ, ਸਗੋਂ ਸ਼ਹਿਰਾਂ ਅਤੇ ਕਸਬਿਆਂ ਵਿੱਚ ਰਹਿਣ ਵਾਲੇ ਪਰਿਵਾਰਾਂ ਲਈ ਘਰ ਦੀ ਛੱਤ (Terrace), ਬਾਲਕਨੀ, ਅਤੇ ਵਿਹੜੇ ਵਿੱਚ ਰਸਾਇਣ-ਮੁਕਤ ਤਾਜ਼ੀਆਂ ਸਬਜ਼ੀਆਂ ਅਤੇ ਫੁੱਲ ਉਗਾਉਣ ਲਈ ਇੱਕ ਵਿਸ਼ੇਸ਼ 'ਗਾਰਡਨਰ ਈਕੋਸਿਸਟਮ' ਪ੍ਰਦਾਨ ਕਰਦਾ ਹੈ। ਹੇਠਾਂ ਇਸਦੀ ਵਰਤੋਂ ਵਿਧੀ ਦਿੱਤੀ ਗਈ ਹੈ:
  </p>

  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 18%;">ਪੜਾਅ (Stage)</th>
        <th style="width: 32%;">ਗਾਰਡਨਰ ਦੀ ਕਾਰਵਾਈ (User Action)</th>
        <th style="width: 25%;">ਪਲੇਟਫਾਰਮ ਦੀ ਸਹੂਲਤ (Features)</th>
        <th style="width: 25%;">ਪ੍ਰਾਪਤ ਹੋਣ ਵਾਲਾ ਲਾਭ (Direct Benefit)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>1. ਗਾਰਡਨ ਪ੍ਰੋਫਾਈਲ ਬਣਾਉਣਾ</strong></td>
        <td>ਮੋਬਾਈਲ OTP ਨਾਲ ਲੌਗਇਨ ਕਰਕੇ 'Gardener' ਰੋਲ ਚੁਣਨਾ, ਗਮਲਿਆਂ ਦੀ ਗਿਣਤੀ (ਜਿਵੇਂ 20-50 ਗਮਲੇ), ਜਗ੍ਹਾ (Terrace/Balcony), ਅਤੇ ਧੁੱਪ ਦੇ ਘੰਟੇ ਭਰਨੇ।</td>
        <td>ਡਿਜੀਟਲ ਗਾਰਡਨ ਡੈਸ਼ਬੋਰਡ, ਗਮਲਾ-ਵਾਰ ਪੌਦਿਆਂ ਦੀ ਸੂਚੀ (Vegetable, Flower, Medicinal Herbs)।</td>
        <td>ਪੌਦਿਆਂ ਦੀ ਸਮਰੱਥਾ ਅਨੁਸਾਰ ਵਿਗਿਆਨਕ ਯੋਜਨਾਬੰਦੀ। ਗਲਤ ਥਾਂ 'ਤੇ ਪੌਦਾ ਰੱਖਣ ਕਾਰਨ ਸੁੱਕਣ ਤੋਂ ਬਚਾਅ।</td>
      </tr>
      <tr>
        <td><strong>2. ਮੌਸਮੀ ਬਿਜਾਈ ਕੈਲੰਡਰ</strong></td>
        <td>ਸਰਦੀਆਂ ਜਾਂ ਗਰਮੀਆਂ ਦੀਆਂ ਸਬਜ਼ੀਆਂ (ਟਮਾਟਰ, ਧਨੀਆ, ਪਾਲਕ, ਮਿਰਚਾਂ, ਬੈਂਗਣ) ਉਗਾਉਣ ਲਈ ਸੀਜ਼ਨਲ ਕੈਲੰਡਰ ਵੇਖਣਾ।</td>
        <td>ਸਵੈ-ਚਾਲਿਤ ਬਿਜਾਈ ਸ਼ਡਿਊਲਰ: ਬੀਜ ਪੁੰਗਰਨ, ਪਨੀਰੀ ਤਬਦੀਲ ਕਰਨ ਅਤੇ ਗੋਡੀ ਦੇ ਆਟੋ ਅਲਰਟ।</td>
        <td>ਸਹੀ ਮਹੀਨੇ ਵਿੱਚ ਸਹੀ ਸਬਜ਼ੀ ਦੀ ਬਿਜਾਈ, ਜਿਸ ਨਾਲ ਘਰ ਵਿੱਚ ਹੀ 12 ਮਹੀਨੇ ਤਾਜ਼ੀ ਸਬਜ਼ੀ ਮਿਲਦੀ ਹੈ।</td>
      </tr>
      <tr>
        <td><strong>3. ਏਆਈ ਪਲਾਂਟ ਡਾਕਟਰ</strong></td>
        <td>ਪੌਦਿਆਂ ਦੇ ਪੱਤੇ ਪੀਲੇ ਪੈਣ, ਕਾਲੇ ਧੱਬੇ, ਜਾਂ ਮਿਲੀਬੱਗ (ਸਫ਼ੈਦ ਕੀੜਾ) ਲੱਗਣ 'ਤੇ ਮੋਬਾਈਲ ਨਾਲ ਫੋਟੋ ਸਕੈਨ ਕਰਨੀ।</td>
        <td>ਏਆਈ ਵਿਜ਼ਨ ਸਕੈਨਰ: 1.2 ਸਕਿੰਟਾਂ ਵਿੱਚ ਰੋਗ ਦੀ ਸ਼ਨਾਖਤ ਅਤੇ ਘਰੇਲੂ ਜੈਵਿਕ ਇਲਾਜ ਦੀ ਰਿਪੋਰਟ।</td>
        <td>ਜ਼ਹਿਰੀਲੇ ਕੀਟਨਾਸ਼ਕਾਂ ਤੋਂ ਬਚਾਅ। ਘਰ ਵਿੱਚ ਹੀ ਨੀਮ ਦੇ ਤੇਲ ਜਾਂ ਲੱਸੀ/ਰਾਖ ਨਾਲ ਆਰਗੈਨਿਕ ਇਲਾਜ।</td>
      </tr>
      <tr>
        <td><strong>4. ਆਰਗੈਨਿਕ ਗਾਰਡਨ ਸਟੋਰ</strong></td>
        <td>ਚੰਗੀ ਕੁਆਲਿਟੀ ਦਾ ਕੋਕੋਪੀਟ, ਵਰਮੀਕੰਪੋਸਟ (ਗੰਡੋਇਆਂ ਦੀ ਖਾਦ), ਦੇਸੀ ਬੀਜ, ਗਮਲੇ, ਅਤੇ ਸਪਰੇਅ ਪੰਪ ਆਰਡਰ ਕਰਨਾ।</td>
        <td>ਡਿਲੀਵਰੀ ਟੂ ਹੋਮ: ਸ਼ੁੱਧ ਜੈਵਿਕ ਸਮੱਗਰੀ ਪੱਕੇ ਬਿੱਲ ਨਾਲ ਸਿੱਧੀ ਘਰ ਪਹੁੰਚਦੀ ਹੈ।</td>
        <td>ਬਾਜ਼ਾਰ ਵਿੱਚੋਂ ਨਕਲੀ ਜਾਂ ਬੇਕਾਰ ਮਿੱਟੀ/ਖਾਦ ਲਿਆਉਣ ਦੀ ਪਰੇਸ਼ਾਨੀ ਖਤਮ।</td>
      </tr>
      <tr>
        <td><strong>5. ਪ੍ਰੋਫੈਸ਼ਨਲ ਮਾਲੀ ਬੁਕਿੰਗ</strong></td>
        <td>ਜੇਕਰ ਪੌਦਿਆਂ ਦੀ ਛੰਗਾਈ (Pruning) ਜਾਂ ਰੀ-ਪੌਟਿੰਗ (ਗਮਲਾ ਬਦਲਣਾ) ਖੁਦ ਨਾ ਹੋ ਸਕੇ ਤਾਂ 'Book Mali' ਬਟਨ ਦਬਾਉਣਾ।</td>
        <td>ਨੇੜਲੇ ਵੈਰੀਫਾਈਡ ਮਾਲੀ ਦੀ ਘਰੇਲੂ ਵਿਜ਼ਿਟ, ਪਾਰਦਰਸ਼ੀ ਫਿਕਸ ਰੇਟ, ਸੁਰੱਖਿਅਤ ਸਰਵਿਸ।</td>
        <td>ਪੇਸ਼ੇਵਰ ਦੇਖਭਾਲ ਨਾਲ ਛੱਤ 'ਤੇ ਬਣਿਆ ਬਗੀਚਾ ਹਮੇਸ਼ਾ ਹਰਿਆ-ਭਰਿਆ ਅਤੇ ਸੁੰਦਰ ਰਹਿੰਦਾ ਹੈ।</td>
      </tr>
    </tbody>
  </table>

  <div class="grid-2">
    <div class="info-box highlight">
      <h4>ਜ਼ਹਿਰ-ਮੁਕਤ ਘਰੇਲੂ ਰਸੋਈ (100% Organic Kitchen)</h4>
      <p>ਬਾਜ਼ਾਰ ਵਿੱਚ ਵਿਕਣ ਵਾਲੀਆਂ ਸਬਜ਼ੀਆਂ 'ਤੇ ਕੈਂਸਰ ਪੈਦਾ ਕਰਨ ਵਾਲੇ ਜ਼ਹਿਰੀਲੇ ਕੀਟਨਾਸ਼ਕਾਂ ਦਾ ਬੇਹਿਸਾਬ ਛਿੜਕਾਅ ਹੁੰਦਾ ਹੈ। ਫਾਰਮਸਕਿੰਗ ਗਾਰਡਨਰ ਮੌਡਿਊਲ ਰਾਹੀਂ ਹਰੇਕ ਸ਼ਹਿਰੀ ਪਰਿਵਾਰ ਆਪਣੇ ਘਰ ਦੀ ਛੱਤ 'ਤੇ ਹੀ 100% ਸ਼ੁੱਧ ਆਰਗੈਨਿਕ ਸਬਜ਼ੀਆਂ ਉਗਾ ਕੇ ਆਪਣੇ ਪਰਿਵਾਰ ਦੀ ਸਿਹਤ ਸੁਰੱਖਿਅਤ ਕਰ ਸਕਦਾ ਹੈ।</p>
    </div>
    <div class="info-box blue">
      <h4>ਪੌਦੇ ਪਾਣੀ ਤੇ ਗੋਡੀ ਰੀਮਾਈਂਡਰ (Smart Plant Care)</h4>
      <p>ਕੰਮਕਾਜੀ ਰੁਝੇਵਿਆਂ ਕਾਰਨ ਲੋਕ ਅਕਸਰ ਪੌਦਿਆਂ ਨੂੰ ਪਾਣੀ ਦੇਣਾ ਭੁੱਲ ਜਾਂਦੇ ਹਨ। ਸਾਡਾ ਸਿਸਟਮ ਤਾਪਮਾਨ ਅਨੁਸਾਰ ਮੋਬਾਈਲ 'ਤੇ ਯਾਦ-ਪੱਤਰ ਭੇਜਦਾ ਹੈ ਕਿ ਅੱਜ ਕਿਹੜੇ ਪੌਦੇ ਨੂੰ ਕਿੰਨਾ ਪਾਣੀ ਚਾਹੀਦਾ ਹੈ, ਜਿਸ ਨਾਲ ਪੌਦੇ ਸੁੱਕਣ ਤੋਂ ਬਚ ਜਾਂਦੇ ਹਨ।</p>
    </div>
  </div>
`;

const page2Html = `
  <h2 class="sec-title">
    <span>2. ਬਾਗਬਾਨੀ ਸਲਾਹਕਾਰ (Garden Advisor) ਦਾ ਕਾਰਜ ਪ੍ਰਵਾਹ</span>
    <span class="badge badge-dark">Horticulture Advisor & Landscape Expert</span>
  </h2>

  <h3 class="sub-title" style="color: #065f46;">ਗਾਰਡਨ ਅਡਵਾਈਜ਼ਰ ਕਿਵੇਂ ਸੇਵਾਵਾਂ ਦਿੰਦਾ ਹੈ?</h3>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 20%;">ਪੜਾਅ (Step)</th>
        <th style="width: 40%;">ਸਲਾਹਕਾਰ ਦਾ ਕੰਮ (Advisor Responsibility)</th>
        <th style="width: 40%;">ਪਲੇਟਫਾਰਮ ਟੂਲਜ਼ ਅਤੇ ਆਮਦਨ ਮਾਡਲ</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>1. ਰਜਿਸਟ੍ਰੇਸ਼ਨ ਤੇ ਸਰਟੀਫਿਕੇਸ਼ਨ</strong></td>
        <td>ਬਾਗਬਾਨੀ (Horticulture/Floriculture) ਡਿਪਲੋਮਾ, ਬੌਟਨੀ ਡਿਗਰੀ ਜਾਂ ਨਰਸਰੀ ਸੰਚਾਲਨ ਦਾ ਤਜਰਬਾ ਅਪਲੋਡ ਕਰਨਾ।</td>
        <td>ਐਡਮਿਨ ਵੱਲੋਂ ਤਸਦੀਕ ਤੋਂ ਬਾਅਦ 'Verified Garden Expert' ਦਾ ਅਧਿਕਾਰਤ ਬੈਜ ਜਾਰੀ ਹੁੰਦਾ ਹੈ।</td>
      </tr>
      <tr>
        <td><strong>2. ਸ਼ਹਿਰੀ ਪਲਾਂਟ ਓਪੀਡੀ</strong></td>
        <td>ਸ਼ਹਿਰੀ ਗਾਰਡਨਰਾਂ ਵੱਲੋਂ ਭੇਜੀਆਂ ਗਈਆਂ ਪੌਦਿਆਂ ਦੀਆਂ ਬਿਮਾਰੀਆਂ ਦੀਆਂ ਫੋਟੋਆਂ ਵੇਖ ਕੇ ਔਨਲਾਈਨ ਹੱਲ ਦੱਸਣਾ।</td>
        <td>ਇਨ-ਐਪ ਚੈਟ ਅਤੇ ਵੀਡੀਓ ਕਾਲ ਰਾਹੀਂ ਗਮਲੇ ਦੀ ਮਿੱਟੀ, ਰੌਸ਼ਨੀ ਅਤੇ ਪੋਸ਼ਣ ਬਾਰੇ ਮਾਹਰ ਰਾਇ ਦੇਣੀ।</td>
      </tr>
      <tr>
        <td><strong>3. ਲੈਂਡਸਕੇਪਿੰਗ ਤੇ ਛੱਤ ਬਗੀਚੀ ਡਿਜ਼ਾਈਨ</strong></td>
        <td>ਨਵੀਆਂ ਕੋਠੀਆਂ, ਵਿਲਾ ਅਤੇ ਸੁਸਾਇਟੀਆਂ ਦੀਆਂ ਛੱਤਾਂ 'ਤੇ ਟੈਰੇਸ ਗਾਰਡਨ, ਵਰਟੀਕਲ ਗਾਰਡਨ ਅਤੇ ਲਾਅਨ ਡਿਜ਼ਾਈਨ ਕਰਨਾ।</td>
        <td>ਡਿਜੀਟਲ ਪ੍ਰੋਜੈਕਟ ਐਸਟੀਮੇਟ ਟੂਲ: ਪੌਦਿਆਂ, ਤੁਪਕਾ ਸਿੰਚਾਈ, ਅਤੇ ਗਮਲਿਆਂ ਦੀ ਲਾਗਤ ਦਾ ਪੱਕਾ ਹਿਸਾਬ।</td>
      </tr>
      <tr>
        <td><strong>4. ਨਰਸਰੀ ਉਤਪਾਦਾਂ ਦੀ ਵਿਕਰੀ</strong></td>
        <td>ਆਪਣੀ ਨਰਸਰੀ ਦੇ ਵਿਸ਼ੇਸ਼ ਇਨਡੋਰ ਪੌਦੇ, ਬੋਨਸਾਈ, ਫੁੱਲਦਾਰ ਬੂਟੇ ਅਤੇ ਜੈਵਿਕ ਖਾਦਾਂ ਸਟੋਰ 'ਤੇ ਲਿਸਟ ਕਰਨਾ।</td>
        <td>ਸਟੋਰ ਸੈਲਰ ਪੈਨਲ ਰਾਹੀਂ ਆਰਡਰ ਪ੍ਰਾਪਤ ਕਰਨਾ, ਪੈਕ ਕਰਨਾ ਅਤੇ ਸ਼ਹਿਰ ਅੰਦਰ ਲੋਕਲ ਡਿਸਪੈਚ ਕਰਨਾ।</td>
      </tr>
      <tr>
        <td><strong>5. ਸਰਵਿਸ ਫੀਸ ਤੇ ਕਮਿਸ਼ਨ ਪੇਆਉਟ</strong></td>
        <td>ਵੀਡੀਓ ਕੰਸਲਟੇਸ਼ਨ ਅਤੇ ਹੋਮ ਵਿਜ਼ਿਟ ਚਾਰਜਿਜ਼ ਸਿੱਧੇ ਵਾਲਿਟ ਵਿੱਚ ਆਉਂਦੇ ਹਨ।</td>
        <td>ਹਫ਼ਤਾਵਾਰੀ ਬੈਂਕ ਖਾਤੇ ਵਿੱਚ ਪੇਆਉਟ। ਉੱਚ ਕਸਟਮਰ ਰੇਟਿੰਗ ਨਾਲ ਆਰਡਰਾਂ ਦੀ ਗਿਣਤੀ ਵਧਦੀ ਹੈ।</td>
      </tr>
    </tbody>
  </table>

  <div class="grid-2">
    <div class="info-box highlight">
      <h4>ਪੇਰੀ-ਅਰਬਨ ਕਿਸਾਨਾਂ ਲਈ ਵੱਡਾ ਮੌਕਾ (Peri-Urban Farmer Opportunity)</h4>
      <p>ਸ਼ਹਿਰਾਂ ਦੇ ਨੇੜੇ ਰਹਿਣ ਵਾਲੇ ਕਿਸਾਨ ਇਸ ਮੌਡਿਊਲ ਰਾਹੀਂ ਹਾਈ-ਵੈਲਿਊ ਨਰਸਰੀਆਂ ਸਥਾਪਿਤ ਕਰ ਸਕਦੇ ਹਨ। ਰਵਾਇਤੀ ਕਣਕ-ਝੋਨੇ ਦੇ ਮੁਕਾਬਲੇ ਫੁੱਲਾਂ, ਸਜਾਵਟੀ ਪੌਦਿਆਂ ਅਤੇ ਸਬਜ਼ੀਆਂ ਦੀ ਪਨੀਰੀ ਤਿਆਰ ਕਰਕੇ ਸ਼ਹਿਰੀ ਲੋਕਾਂ ਨੂੰ ਵੇਚਣ ਨਾਲ ਪ੍ਰਤੀ ਏਕੜ 5 ਤੋਂ 8 ਗੁਣਾ ਵੱਧ ਕਮਾਈ ਹੁੰਦੀ ਹੈ।</p>
    </div>
    <div class="info-box blue">
      <h4>ਕਿਚਨ ਵੇਸਟ ਕੰਪੋਸਟਿੰਗ ਟ੍ਰੇਨਿੰਗ (Waste to Gold)</h4>
      <p>ਗਾਰਡਨ ਸਲਾਹਕਾਰ ਸ਼ਹਿਰੀ ਪਰਿਵਾਰਾਂ ਨੂੰ ਰਸੋਈ ਦੇ ਗਿੱਲੇ ਕੂੜੇ (ਸਬਜ਼ੀਆਂ ਦੇ ਛਿਲਕੇ, ਫਲ, ਚਾਹ ਪੱਤੀ) ਤੋਂ ਘਰ ਵਿੱਚ ਹੀ ਕਾਲਾ ਸੋਨਾ (Organic Compost) ਬਣਾਉਣ ਦੀ ਸਿਖਲਾਈ ਦਿੰਦੇ ਹਨ, ਜਿਸ ਨਾਲ ਸ਼ਹਿਰਾਂ ਦਾ ਕੂੜਾ ਵੀ ਘਟਦਾ ਹੈ ਅਤੇ ਮੁਫ਼ਤ ਖਾਦ ਮਿਲਦੀ ਹੈ।</p>
    </div>
  </div>
`;

const page3Html = `
  <h2 class="sec-title">
    <span>3. ਹਾਈਡ੍ਰੋਪੋਨਿਕਸ, ਵਰਟੀਕਲ ਫਾਰਮਿੰਗ ਅਤੇ ਵਾਤਾਵਰਣ ਲਾਭ</span>
    <span class="badge badge-dark">Future Urban Agriculture & Ecology</span>
  </h2>

  <h3 class="sub-title" style="color: #065f46;">ਆਧੁਨਿਕ ਸ਼ਹਿਰੀ ਖੇਤੀ ਤਕਨੀਕਾਂ (Modern Hydroponics & Vertical Farming)</h3>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 22%;">ਤਕਨੀਕ (Technique)</th>
        <th style="width: 38%;">ਇਹ ਕਿਵੇਂ ਕੰਮ ਕਰਦੀ ਹੈ? (How it works)</th>
        <th style="width: 40%;">ਫਾਰਮਸਕਿੰਗ ਪਲੇਟਫਾਰਮ ਦੀ ਸਹਾਇਤਾ</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>1. ਹਾਈਡ੍ਰੋਪੋਨਿਕਸ (Hydroponics)</strong><br><span class="badge badge-green">ਬਿਨਾਂ ਮਿੱਟੀ ਤੋਂ ਖੇਤੀ</span></td>
        <td>ਪੌਦਿਆਂ ਨੂੰ ਮਿੱਟੀ ਦੀ ਬਜਾਏ ਪਾਣੀ ਅਤੇ ਪੌਸ਼ਟਿਕ ਘੋਲ (Nutrient Solution) ਵਿੱਚ ਪਾਈਪਾਂ (NFT Systems) ਰਾਹੀਂ ਉਗਾਇਆ ਜਾਂਦਾ ਹੈ।</td>
        <td>ਨਿਊਟ੍ਰੀਐਂਟ ਫਾਰਮੂਲੇਸ਼ਨ ਚਾਰਟ, pH ਅਤੇ ਈਸੀ (EC) ਮੀਟਰ ਗਾਈਡੈਂਸ, ਅਤੇ ਹਾਈਡ੍ਰੋਪੋਨਿਕ ਕਿੱਟਾਂ ਦੀ ਸਪਲਾਈ।</td>
      </tr>
      <tr>
        <td><strong>2. ਵਰਟੀਕਲ ਗਾਰਡਨਿੰਗ</strong><br><span class="badge badge-blue">ਕੰਧਾਂ 'ਤੇ ਪੌਦੇ</span></td>
        <td>ਫਲੈਟਾਂ ਅਤੇ ਛੋਟੇ ਘਰਾਂ ਵਿੱਚ ਕੰਧਾਂ 'ਤੇ ਫਰੇਮ ਲਗਾ ਕੇ ਪੌਦੇ ਉਗਾਏ ਜਾਂਦੇ ਹਨ, ਜਿਸ ਨਾਲ ਜ਼ਮੀਨੀ ਥਾਂ ਬਿਲਕੁਲ ਨਹੀਂ ਘਿਰਦੀ।</td>
        <td>ਵਰਟੀਕਲ ਪਲੈਂਟਰ ਕਿੱਟਾਂ, ਡ੍ਰਿੱਪ ਆਟੋਮੇਸ਼ਨ ਕੰਟਰੋਲਰ, ਅਤੇ ਪੌਦਿਆਂ ਦੀ ਸਹੀ ਚੋਣ (ਸੁੱਕੂਲੈਂਟਸ, ਫਰਨ, ਜੜ੍ਹੀ-ਬੂਟੀਆਂ)।</td>
      </tr>
      <tr>
        <td><strong>3. ਮਾਈਕ੍ਰੋਗ੍ਰੀਨਜ਼ (Microgreens)</strong><br><span class="badge badge-purple">ਸੁਪਰਫੂਡ</span></td>
        <td>ਮੂਲੀ, ਸਰ੍ਹੋਂ, ਮਟਰ, ਪਾਲਕ ਦੇ ਛੋਟੇ 7-10 ਦਿਨਾਂ ਦੇ ਪੌਦੇ ਜੋ ਵਿਟਾਮਿਨਾਂ ਅਤੇ ਮਿਨਰਲਾਂ ਨਾਲ ਭਰਪੂਰ ਹੁੰਦੇ ਹਨ।</td>
        <td>ਕਮਰੇ ਵਿੱਚ ਮਾਈਕ੍ਰੋਗ੍ਰੀਨਜ਼ ਟ੍ਰੇਆਂ ਲਗਾਉਣ ਦੀ ਵਿਧੀ, ਸ਼ੁੱਧ ਬੀਜ, ਅਤੇ ਰੋਜ਼ਾਨਾ ਖੁਰਾਕ ਗਾਈਡ।</td>
      </tr>
    </tbody>
  </table>

  <div class="grid-3" style="margin-top: 8px;">
    <div class="info-box highlight" style="text-align: center;">
      <h4 style="justify-content: center; color: #047857;">ਪਾਣੀ ਦੀ 85% ਬੱਚਤ</h4>
      <p style="font-size: 11pt; font-weight: 800; color: #065f46; margin: 4px 0;">85% Water Saved</p>
      <p style="font-size: 7.2pt;">ਤੁਪਕਾ ਸਿੰਚਾਈ ਅਤੇ ਹਾਈਡ੍ਰੋਪੋਨਿਕਸ ਵਿੱਚ ਪਾਣੀ ਦਾ ਇੱਕ ਤੁਪਕਾ ਵੀ ਅਜਾਈਂ ਨਹੀਂ ਜਾਂਦਾ।</p>
    </div>
    <div class="info-box blue" style="text-align: center;">
      <h4 style="justify-content: center; color: #1d4ed8;">ਘਰ ਦਾ ਤਾਪਮਾਨ ਘਟਣਾ</h4>
      <p style="font-size: 11pt; font-weight: 800; color: #1e40af; margin: 4px 0;">3°C to 5°C Cooler</p>
      <p style="font-size: 7.2pt;">ਛੱਤ 'ਤੇ ਬਗੀਚਾ ਹੋਣ ਕਾਰਨ ਗਰਮੀਆਂ ਵਿੱਚ ਛੱਤ ਨਹੀਂ ਤਪਦੀ ਅਤੇ ਏ.ਸੀ. ਦਾ ਬਿਜਲੀ ਬਿੱਲ ਘਟਦਾ ਹੈ।</p>
    </div>
    <div class="info-box amber" style="text-align: center;">
      <h4 style="justify-content: center; color: #b45309;">ਮਾਨਸਿਕ ਸ਼ਾਂਤੀ ਤੇ ਸਿਹਤ</h4>
      <p style="font-size: 11pt; font-weight: 800; color: #92400e; margin: 4px 0;">100% Pure Oxygen</p>
      <p style="font-size: 7.2pt;">ਪੌਦਿਆਂ ਦੀ ਸੰਗਤ ਤਣਾਅ (Stress) ਦੂਰ ਕਰਦੀ ਹੈ ਅਤੇ ਸ਼ਹਿਰੀ ਪ੍ਰਦੂਸ਼ਣ ਤੋਂ ਮੁਕਤ ਸਾਫ਼ ਹਵਾ ਦਿੰਦੀ ਹੈ।</p>
    </div>
  </div>
`;

const page4Html = `
  <h2 class="sec-title">
    <span>4. ਗਾਰਡਨਰ ਪ੍ਰੋਜੈਕਟ ਸਮੀਖਿਆ, ਸਰਵੋਤਮ ਫੀਚਰ ਅਤੇ ਭਵਿੱਖੀ ਵਿਸਥਾਰ</span>
    <span class="badge badge-dark">Executive Sign-Off</span>
  </h2>

  <div class="grid-2">
    <div class="info-box highlight">
      <h4>ਸ਼ਹਿਰ ਅਤੇ ਪਿੰਡ ਦਾ ਆਪਸੀ ਸੁਮੇਲ (Rural-Urban Agronomy Bridge)</h4>
      <p>ਫਾਰਮਸਕਿੰਗ ਦਾ ਇਹ ਮੌਡਿਊਲ ਸ਼ਹਿਰੀ ਖਪਤਕਾਰਾਂ ਨੂੰ ਪੇਂਡੂ ਕਿਸਾਨਾਂ ਅਤੇ ਨਰਸਰੀਆਂ ਨਾਲ ਸਿੱਧਾ ਜੋੜਦਾ ਹੈ। ਪਿੰਡਾਂ ਦੇ ਨੌਜਵਾਨ ਤਕਨੀਕੀ ਮਾਲੀ ਬਣ ਕੇ ਸ਼ਹਿਰਾਂ ਵਿੱਚ ਵਧੀਆ ਰੁਜ਼ਗਾਰ ਕਮਾ ਸਕਦੇ ਹਨ, ਜਦਕਿ ਸ਼ਹਿਰੀ ਪਰਿਵਾਰਾਂ ਨੂੰ ਘਰ ਬੈਠੇ ਸੁੰਦਰ ਬਗੀਚੇ ਅਤੇ ਸ਼ੁੱਧ ਭੋਜਨ ਦਾ ਆਨੰਦ ਮਿਲਦਾ ਹੈ।</p>
    </div>
    <div class="info-box blue">
      <h4>ਵਾਤਾਵਰਣ ਪੱਖੀ ਸ਼ਹਿਰੀ ਢਾਂਚਾ (Green Cities Initiative)</h4>
      <p>ਕੰਕਰੀਟ ਦੇ ਜੰਗਲ ਬਣ ਰਹੇ ਸ਼ਹਿਰਾਂ ਵਿੱਚ ਘਰਾਂ ਦੀਆਂ ਛੱਤਾਂ ਨੂੰ ਹਰਿਆ-ਭਰਿਆ ਕਰਕੇ ਫਾਰਮਸਕਿੰਗ ਵਾਤਾਵਰਣ ਬਚਾਉਣ ਅਤੇ ਕਾਰਬਨ ਫੁੱਟਪ੍ਰਿੰਟ ਘਟਾਉਣ ਵਿੱਚ ਵੱਡਾ ਯੋਗਦਾਨ ਪਾ ਰਹੀ ਹੈ।</p>
    </div>
  </div>

  <div class="eval-container">
    <div class="eval-box-top">
      <h4>ਇਸ ਪ੍ਰਣਾਲੀ ਦੇ ਮੌਜੂਦਾ ਸਰਵੋਤਮ ਫੀਚਰ (Outstanding Current Features):</h4>
      <ul class="eval-list">
        <li><strong>AI Home Plant Doctor:</strong> ਗਮਲਿਆਂ ਦੇ ਪੌਦਿਆਂ ਦੇ ਰੋਗਾਂ ਲਈ ਘਰੇਲੂ, ਬਿਨਾਂ ਜ਼ਹਿਰ ਵਾਲੇ ਜੈਵਿਕ ਨੁਸਖੇ ਦੱਸਣਾ।</li>
        <li><strong>ਵਿਅਕਤੀਗਤ ਗਾਰਡਨ ਕੇਅਰ ਕੈਲੰਡਰ:</strong> ਗਮਲਿਆਂ ਦੀ ਗਿਣਤੀ ਅਤੇ ਧੁੱਪ ਮੁਤਾਬਕ ਪਾਣੀ ਅਤੇ ਖਾਦ ਪਾਉਣ ਦੇ ਰੋਜ਼ਾਨਾ ਅਲਰਟ।</li>
        <li><strong>ਵੈਰੀਫਾਈਡ ਮਾਲੀ ਬੁਕਿੰਗ:</strong> ਭਰੋਸੇਮੰਦ ਮਾਲੀ ਸਿੱਧਾ ਘਰ ਬੁਲਾਉਣ ਦੀ ਸਹੂਲਤ, ਜਿਸ ਨਾਲ ਘਰੇਲੂ ਔਰਤਾਂ ਅਤੇ ਬਜ਼ੁਰਗਾਂ ਨੂੰ ਬਹੁਤ ਸੌਖ ਹੁੰਦੀ ਹੈ।</li>
        <li><strong>ਸ਼ੁੱਧ ਆਰਗੈਨਿਕ ਸਮੱਗਰੀ ਦੀ ਹੋਮ ਡਿਲੀਵਰੀ:</strong> ਕੋਕੋਪੀਟ, ਗੰਡੋਇਆਂ ਦੀ ਖਾਦ ਅਤੇ ਦੇਸੀ ਬੀਜ ਪੱਕੇ ਬਿੱਲ ਨਾਲ ਘਰ ਪਹੁੰਚਣਾ।</li>
      </ul>
    </div>

    <div class="eval-box-future">
      <h4>ਭਵਿੱਖ ਵਿੱਚ ਹੋਰ ਸ਼ਾਮਲ ਕੀਤੇ ਜਾਣ ਵਾਲੇ ਸੁਪਰ-ਐਡਵਾਂਸਡ ਫੀਚਰ (High-Value Features to Add in Future):</h4>
      <ul class="eval-list">
        <li><strong>ਸਮਾਰਟ ਬਾਲਕਨੀ ਡ੍ਰਿੱਪ ਆਟੋਮੇਸ਼ਨ (IoT Drip Timer):</strong> ਵਾਈ-ਫਾਈ ਨਾਲ ਚੱਲਣ ਵਾਲੀ ਛੋਟੀ ਪਾਣੀ ਕਿੱਟ ਜੋ ਛੁੱਟੀਆਂ 'ਤੇ ਜਾਣ ਸਮੇਂ ਵੀ ਪੌਦਿਆਂ ਨੂੰ ਆਟੋਮੈਟਿਕ ਪਾਣੀ ਦਿੰਦੀ ਰਹੇ।</li>
        <li><strong>ਗਾਰਡਨ ਸੋਸ਼ਲ ਕਮਿਊਨਿਟੀ (Plant Swap Network):</strong> ਸ਼ਹਿਰ ਦੇ ਗਾਰਡਨਰਾਂ ਦਾ ਆਪਸੀ ਨੈੱਟਵਰਕ ਜਿੱਥੇ ਉਹ ਇੱਕ ਦੂਜੇ ਨਾਲ ਪੌਦੇ ਅਤੇ ਕਟਿੰਗਜ਼ ਬਦਲ ਸਕਣ।</li>
        <li><strong>AR ਗਾਰਡਨ ਵਿਜ਼ੂਅਲਾਈਜ਼ਰ (Augmented Reality):</strong> ਮੋਬਾਈਲ ਕੈਮਰਾ ਘੁਮਾ ਕੇ ਦੇਖਣਾ ਕਿ ਤੁਹਾਡੀ ਬਾਲਕਨੀ ਵਿੱਚ ਕਿਹੜਾ ਪੌਦਾ ਜਾਂ ਗਮਲਾ ਕਿੱਥੇ ਸਭ ਤੋਂ ਸੋਹਣਾ ਲੱਗੇਗਾ।</li>
        <li><strong>ਕਿਚਨ ਗਾਰਡਨ ਆਰਗੈਨਿਕ ਸਰਟੀਫਿਕੇਸ਼ਨ:</strong> ਘਰ ਵਿੱਚ ਸਬਜ਼ੀਆਂ ਉਗਾਉਣ ਵਾਲਿਆਂ ਨੂੰ 'FarmsKing Green Home' ਦਾ ਡਿਜੀਟਲ ਸਰਟੀਫਿਕੇਟ ਦੇਣਾ।</li>
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
  '06_FarmsKing_Gardener_Garden_Advisor_Project_Guide_Punjabi_A4.pdf',
  'ਗਾਰਡਨਰ ਅਤੇ ਬਾਗਬਾਨੀ ਸਲਾਹਕਾਰ ਪ੍ਰੋਜੈਕਟ ਗਾਈਡ',
  [
    { sub: 'ਘਰੇਲੂ ਬਾਗਬਾਨੀ ਦਾ ਪੂਰਾ ਵਹਾਅ (Kitchen & Terrace Gardening)', html: page1Html },
    { sub: 'ਬਾਗਬਾਨੀ ਸਲਾਹਕਾਰ (Advisor) ਦਾ ਕਾਰਜ ਪ੍ਰਵਾਹ (Horticulture)', html: page2Html },
    { sub: 'ਹਾਈਡ੍ਰੋਪੋਨਿਕਸ, ਵਰਟੀਕਲ ਫਾਰਮਿੰਗ ਤੇ ਵਾਤਾਵਰਣ (Modern Farming)', html: page3Html },
    { sub: 'ਗਾਰਡਨਰ ਸਮੀਖਿਆ, ਸਰਵੋਤਮ ਫੀਚਰ ਅਤੇ ਭਵਿੱਖੀ ਵਿਸਥਾਰ (Review & Roadmap)', html: page4Html },
  ]
);

